import { IDatabaseProvider, DatabaseExecutionResult } from '../../interfaces/IDatabaseProvider';
import { createDrizzleD1, DrizzleD1Database } from '../../../database/client';

export class CloudflareDatabaseAdapter implements IDatabaseProvider {
  private d1: D1Database;
  public readonly drizzle: DrizzleD1Database;

  constructor(d1: D1Database) {
    this.d1 = d1;
    this.drizzle = createDrizzleD1(d1);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.d1.prepare(sql).bind(...params);
    const result = await stmt.all<T>();
    if (result.error) {
      throw new Error(`D1 Query Error: ${result.error}`);
    }
    return result.results || [];
  }

  async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const stmt = this.d1.prepare(sql).bind(...params);
    const result = await stmt.first<T>();
    return result || null;
  }

  async execute(sql: string, params: any[] = []): Promise<DatabaseExecutionResult> {
    const stmt = this.d1.prepare(sql).bind(...params);
    const result = await stmt.run();
    return {
      success: result.success,
      rowsAffected: result.meta?.changes,
      lastInsertRowId: result.meta?.last_row_id,
    };
  }

  async batch(statements: { sql: string; params?: any[] }[]): Promise<DatabaseExecutionResult[]> {
    const preparedStmts = statements.map(s => {
      const stmt = this.d1.prepare(s.sql);
      return s.params && s.params.length > 0 ? stmt.bind(...s.params) : stmt;
    });
    const results = await this.d1.batch(preparedStmts);
    return results.map(r => ({
      success: r.success,
      rowsAffected: r.meta?.changes,
      lastInsertRowId: r.meta?.last_row_id,
    }));
  }

  async transaction<T>(fn: (tx: IDatabaseProvider) => Promise<T>): Promise<T> {
    // Cloudflare D1 supports atomic operations via batch. For nested transactions, pass adapter
    return await fn(this);
  }
}
