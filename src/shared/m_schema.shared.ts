import { Dict } from "./util.shared";

export type DbSchemaBase = Dict<Dict<string | number | boolean | null>>;
type DbTypeOptions = "PRIMARY" | "AUTOINCREMENT" | "NULLABLE" | "UNIQUE";

const dbTypes = {
  INTEGER: (...o: DbTypeOptions[]) => ["INTEGER", ...o] as any as number,
  TINYINT: (...o: DbTypeOptions[]) => ["TINYINT", ...o] as any as number,
  TINYINT_NULL: (...o: DbTypeOptions[]) =>
    ["TINYINT", ...o] as any as number | null,
  BIGINT: (...o: DbTypeOptions[]) => ["BIGINT", ...o] as any as number,
  VARCHAR30: (...o: DbTypeOptions[]) => [`VARCHAR(30)`, ...o] as any as string,
  BOOLEAN: (...o: DbTypeOptions[]) => ["BOOLEAN", ...o] as any as boolean,
};

export function asDbType(v: any): {
  type: string;
  primary?: boolean;
  autoincrement?: boolean;
  nullable?: boolean;
  unique?: boolean;
} {
  const t = v as any as string[];

  return {
    type: t[0] ?? "UNKNOWN",
    primary: t.includes("PRIMARY"),
    autoincrement: t.includes("AUTOINCREMENT"),
    nullable: t.includes("NULLABLE"),
    unique: t.includes("UNIQUE"),
  };
}

export const schema = {
  user: {
    id: dbTypes.VARCHAR30("PRIMARY"),
    password_hash: dbTypes.VARCHAR30(),
    role: dbTypes.VARCHAR30(),
  },

  rating: {
    id: dbTypes.INTEGER("PRIMARY", "AUTOINCREMENT"),
    type: dbTypes.VARCHAR30(),
    target: dbTypes.VARCHAR30(),
    // metadata
    author: dbTypes.VARCHAR30("NULLABLE"),
    source: dbTypes.VARCHAR30(),
    timestamp: dbTypes.INTEGER(),
    // rating data (0-4 likert scales)
    ai_audio: dbTypes.TINYINT_NULL("NULLABLE"),
    ai_visual: dbTypes.TINYINT_NULL("NULLABLE"),
    ai_text: dbTypes.TINYINT_NULL("NULLABLE"),
  },
};

export type UserModel = Omit<typeof schema.user, "password_hash">;

export type ScoreModel = {
  meta: {
    type: string;
    target: string;
  };
  score: {
    ai_audio: number | null;
    ai_visual: number | null;
    ai_text: number | null;
  };
  user_rated: boolean;
};
