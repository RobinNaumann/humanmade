import { err } from "donau/server";
import { schema, ScoreModel } from "../shared/m_schema.shared";
import { DbService } from "./s_db.server";

function _starClamped(v: any) {
  const n = Number.parseFloat(v);
  if (isNaN(n)) return null;
  return Math.min(4, Math.max(0, n));
}

function _toTiny(timestamp: number): number {
  // convert to a smaller integer representation: hours epoch
  return Math.floor(timestamp / (1000 * 60 * 60));
}

function _fromTiny(tiny: number): number {
  // convert back to full timestamp
  return tiny * 1000 * 60 * 60;
}

export class StorageService {
  constructor(public readonly db: DbService<typeof schema>) {}

  async addRating(
    source: string,
    r: Omit<typeof schema.rating, "id" | "timestamp" | "source">
  ): Promise<number> {
    const nowTiny = _toTiny(Date.now());

    // check if opinion is valid
    if (!r.type || !r.target || !r.author) {
      throw err.badRequest("Invalid opinion data");
    }

    //check if the same IP has already rated this target recently
    const existingCount = this.db.count("rating", {
      where: [
        ["type", "=", r.type],
        ["target", "=", r.target],
        ["author", "=", r.author],
        [
          "timestamp",
          ">",
          nowTiny - 24, // 24 hours
        ],
      ],
    });
    if (existingCount > 0) {
      throw err.tooManyRequests("You have already rated this target recently.");
    }

    const row: Omit<typeof schema.rating, "id"> = {
      type: r.type,
      target: r.target,
      ai_voice: _starClamped(r.ai_voice),
      ai_visual: _starClamped(r.ai_visual),
      ai_text: _starClamped(r.ai_text),
      source: source,
      timestamp: nowTiny,
      author: r.author,
    };

    return this.db.insert("rating", row);
  }

  async removeRating(id: number): Promise<void> {
    this.db.delete("rating", {
      where: [["id", "=", id]],
    });
  }

  async listRating(
    type: string,
    target?: string
  ): Promise<(typeof schema.rating)[]> {
    const ratings = this.db.list("rating", {
      where: [["type", "=", type], target ? ["target", "=", target] : null],
    });
    return ratings.map((r) => ({
      ...r,
      timestamp: _fromTiny(r.timestamp),
    }));
  }

  async listTargetSummary(
    type: string,
    target: string | null,
    userId: string | null
  ): Promise<ScoreModel[]> {
    const fields: (keyof ScoreModel["rating"])[] = [
      "ai_voice",
      "ai_visual",
      "ai_text",
    ];

    const summaries = this.db.listComputed("rating", {
      select: [
        "target",
        "COUNT(*) as count",
        ...fields.flatMap((f) => [
          `SUM(${f}) as ${f}_t`,
          `COUNT(${f}) as ${f}_c`,
        ]),
        `SUM(CASE WHEN author='${
          userId ?? ""
        }' THEN 1 ELSE 0 END) as user_rated`,
      ],
      where: [["type", "=", type], target ? ["target", "=", target] : null],
      groupBy: target ? undefined : ["target"],
    });

    return summaries.map((r) => ({
      meta: {
        type: type,
        target: r.target,
      },
      rating: fields.reduce((acc, f) => {
        const count = r[`${f}_c`] as number;
        const total = r[`${f}_t`] as number;
        acc[f] = count > 0 ? total / count : null;
        return acc;
      }, {} as ScoreModel["rating"]),
      user_rated: userId != null && r.user_rated > 0,
    }));
  }

  async getTargetSummary(
    type: string,
    target: string,
    userId: string | null // to check if it was rated by this user
  ): Promise<ScoreModel> {
    const rows = await this.listTargetSummary(type, target, userId);
    if (rows.length > 0) return rows[0];
    throw err.notFound("No ratings found for this target");
  }

  // ========= USER MANAGEMENT ==========

  /** updates or creates a user */
  async setUser(
    id: string,
    password_hash: string,
    role: string
  ): Promise<string> {
    const existing = this.db.list("user", {
      where: [["id", "=", id]],
    });
    if (existing.length > 0) {
      this.db.update(
        "user",
        { password_hash, role },
        {
          where: [["id", "=", id]],
        }
      );
      return existing[0].id;
    }
    this.db.insert("user", {
      id,
      password_hash,
      role,
    });
    return id;
  }

  async deleteUser(id: string): Promise<void> {
    this.db.delete("user", {
      where: [["id", "=", id]],
    });
  }

  async getUser(id: string): Promise<typeof schema.user | null> {
    const users = this.db.list("user", {
      where: [["id", "=", id]],
    });
    return users.length > 0 ? users[0] : null;
  }

  async listUsers(): Promise<(typeof schema.user)[]> {
    return this.db.list("user");
  }
}
