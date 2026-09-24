import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema/index';
import { Env } from '../types/env';

export { schema };

export type DrizzleD1Database = ReturnType<typeof createDrizzleD1>;

export function createDrizzleD1(d1: D1Database) {
  return drizzle(d1, { schema });
}

export class D1Client {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  get drizzle() {
    return createDrizzleD1(this.db);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql).bind(...params);
    const result = await stmt.all<T>();
    if (result.error) {
      throw new Error(`D1 Query Error: ${result.error}`);
    }
    return result.results || [];
  }

  async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql).bind(...params);
    const result = await stmt.first<T>();
    return result || null;
  }

  async execute(sql: string, params: any[] = []): Promise<D1Response> {
    const stmt = this.db.prepare(sql).bind(...params);
    return await stmt.run();
  }

  async batch(statements: { sql: string; params?: any[] }[]): Promise<D1Response[]> {
    const preparedStmts = statements.map(s => {
      const stmt = this.db.prepare(s.sql);
      return s.params && s.params.length > 0 ? stmt.bind(...s.params) : stmt;
    });
    return await this.db.batch(preparedStmts);
  }
}

export function getDbClient(env: Env): D1Client {
  return new D1Client(env.DB);
}
