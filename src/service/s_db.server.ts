import { Database } from "bun:sqlite";
import { asDbType, DbSchemaBase } from "../shared/m_schema.shared";
import { Dict } from "../shared/util.shared";

type _WhereProp<S extends DbSchemaBase, T extends keyof S> = (
  | [keyof S[T], "=" | "!=" | "<" | ">" | "<=" | ">=", string | number]
  | null
)[];

export class DbService<S extends DbSchemaBase> {
  private readonly _db;

  constructor(readonly name: string, readonly schema: S) {
    this._db = DbService._createDb(this.name, this.schema);
  }
  private _getColumns(table: keyof S, onlySettable = false) {
    return Object.entries(this.schema[table])
      .filter(([v]) => !onlySettable || !asDbType(v).autoincrement)
      .map(([k]) => k);
  }

  insert(table: keyof S, row: Dict<any>) {
    if (!row) throw new Error("No row data provided");

    const fields = this._getColumns(table, true);
    const holders = fields.map(() => "?").join(", ");
    const columns = fields.join(", ");
    const stmt = this._db.prepare(
      `INSERT INTO ${String(table)} (${columns}) VALUES (${holders})`
    );
    const result = stmt.run(...fields.map((f) => row[f]));
    return result.lastInsertRowid as number;
  }

  update(
    table: keyof S,
    row: Dict<any>,
    options: {
      where: _WhereProp<S, typeof table>;
    }
  ): void {
    if (!row) throw new Error("No row data provided");

    const fields = this._getColumns(table, true);
    const setClauses = fields.map((f) => `${String(f)} = ?`).join(", ");
    let query = `UPDATE ${String(table)} SET ${setClauses}`;
    const params: any[] = fields.map((f) => row[f]);

    if (options.where && options.where.length > 0) {
      const whereClauses = options.where
        .filter((v) => v !== null)
        .map(([field, op, value]) => {
          params.push(value);
          return `${String(field)} ${op} ?`;
        });
      query += ` WHERE ` + whereClauses.join(" AND ");
    }

    const stmt = this._db.prepare(query);
    stmt.run(...params);
  }

  list<T extends keyof S>(
    table: T,
    options: {
      where?: _WhereProp<S, T>;
      limit?: number;
    } = {}
  ): S[T][] {
    return this.listComputed(table, {
      where: options.where,
      limit: options.limit,
    }) as S[T][];
  }

  listComputed<T extends keyof S>(
    table: T,
    options: {
      select?: (keyof S[T] | string)[];
      where?: _WhereProp<S, T>;
      groupBy?: (keyof S[T])[];
      limit?: number;
    }
  ): Dict<any>[] {
    let query = `SELECT ${
      options.select && options.select.length > 0
        ? options.select.join(", ")
        : "*"
    } FROM ${String(table)}`;
    const params: any[] = [];

    if (options.where && options.where.length > 0) {
      const whereClauses = options.where
        .filter((v) => v !== null)
        .map(([field, op, value]) => {
          params.push(value);
          return `${String(field)} ${op} ?`;
        });
      query += ` WHERE ` + whereClauses.join(" AND ");
    }

    if (options.groupBy) {
      query += ` GROUP BY ` + String(options.groupBy);
    }
    if (options.limit) {
      query += ` LIMIT ` + options.limit;
    }
    const stmt = this._db.prepare(query);
    const results = stmt.all(...params) as S[T][];
    return results;
  }

  count<T extends keyof S>(
    table: T,
    options: {
      where?: _WhereProp<S, T>;
    } = {}
  ): number {
    let query = `SELECT COUNT(*) as count FROM ${String(table)}`;
    const params: any[] = [];

    if (options.where && options.where.length > 0) {
      const whereClauses = options.where
        .filter((v) => v !== null)
        .map(([field, op, value]) => {
          params.push(value);
          return `${String(field)} ${op} ?`;
        });
      query += ` WHERE ` + whereClauses.join(" AND ");
    }

    const stmt = this._db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  delete<T extends keyof S>(
    table: T,
    options: {
      where: _WhereProp<S, T>;
    }
  ): void {
    let query = `DELETE FROM ${String(table)}`;
    const params: any[] = [];

    if (options.where && options.where.length > 0) {
      const whereClauses = options.where
        .filter((v) => v !== null)
        .map(([field, op, value]) => {
          params.push(value);
          return `${String(field)} ${op} ?`;
        });
      query += ` WHERE ` + whereClauses.join(" AND ");
    }

    const stmt = this._db.prepare(query);
    stmt.run(...params);
  }

  static _createDb(file: string, tables: DbSchemaBase): Database {
    const db = new Database(file, { create: true });

    for (const [tableName, tableSchema] of Object.entries(tables)) {
      const columns = Object.entries(tableSchema)
        .map(([cName, cOptions]) => {
          const cType = asDbType(cOptions);

          let columnStr = `${cName} ${cType.type as any as string}`;
          if (cType.primary) columnStr += " PRIMARY KEY";
          if (!cType.nullable && !cType.primary) columnStr += " NOT NULL";
          if (cType.autoincrement) columnStr += " AUTOINCREMENT";
          return columnStr;
        })
        .join(", ");

      const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`;
      db.run(createTableSQL);
    }

    return db;
  }
}
