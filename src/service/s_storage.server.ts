import { schema } from "../shared/m_schema.shared";
import { DbService } from "./s_db.server";

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

  async addOpinion(
    source: string,
    o: Omit<typeof schema.opinion, "id" | "timestamp" | "source">
  ): Promise<number> {
    const nowTiny = _toTiny(Date.now());

    // check if opinion is valid
    if (!o.type || !o.target || !o.rating || !o.author) {
      throw new Error("Invalid opinion data");
    }

    //check if the same IP has already rated this target recently
    const existingCount = await this.db.count("opinion", {
      where: [
        ["type", "=", o.type],
        ["target", "=", o.target],
        ["author", "=", o.author],
        [
          "timestamp",
          ">",
          nowTiny - 24, // 24 hours
        ],
      ],
    });
    if (existingCount > 0) {
      throw new Error("You have already rated this target recently.");
    }

    return this.db.insert("opinion", {
      ...o,
      source: source,
      timestamp: nowTiny,
    });
  }

  async removeOpinion(id: number): Promise<void> {
    await this.db.delete("opinion", {
      where: [["id", "=", id]],
    });
  }

  async listOpinion(
    type: string,
    target?: string
  ): Promise<(typeof schema.opinion)[]> {
    const opinions = await this.db.list("opinion", {
      where: [["type", "=", type], target ? ["target", "=", target] : null],
    });
    return opinions.map((o) => ({
      ...o,
      timestamp: _fromTiny(o.timestamp),
    }));
  }

  async getTargetSummary(
    type: string,
    target: string,
    userId: string | null // to check if it was rated by this user
  ): Promise<{
    ratings: { rating: string; count: number }[];
    userRated: boolean;
  }> {
    const ratings = await this.db.listComputed("opinion", {
      select: [
        "rating",
        "COUNT(*) as count",
        `SUM(CASE WHEN author='${userId ?? ""}' THEN 1 ELSE 0 END) as rated`,
      ],
      where: [
        ["type", "=", type],
        ["target", "=", target],
      ],
      groupBy: ["rating"],
    });

    return {
      ratings: ratings.map((r) => ({
        rating: r.rating,
        count: r.count,
      })),
      userRated: userId != null && ratings.some((r) => r.rated > 0),
    };
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
    await this.db.delete("user", {
      where: [["id", "=", id]],
    });
  }

  async getUser(id: string): Promise<typeof schema.user | null> {
    const users = await this.db.list("user", {
      where: [["id", "=", id]],
    });
    return users.length > 0 ? users[0] : null;
  }

  async listUsers(): Promise<(typeof schema.user)[]> {
    return this.db.list("user");
  }
}
