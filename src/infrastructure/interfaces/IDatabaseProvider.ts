export interface DatabaseExecutionResult {
  success: boolean;
  rowsAffected?: number;
  lastInsertRowId?: number | string;
}

export interface IDatabaseProvider {
  drizzle?: any;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<DatabaseExecutionResult>;
  batch(statements: { sql: string; params?: any[] }[]): Promise<DatabaseExecutionResult[]>;
  transaction<T>(fn: (tx: IDatabaseProvider) => Promise<T>): Promise<T>;
}
