import { ICacheProvider } from '../../interfaces/ICacheProvider';
import { IStorageProvider, StorageUploadResult } from '../../interfaces/IStorageProvider';
import { IQueueProvider } from '../../interfaces/IQueueProvider';
import { IDatabaseProvider, DatabaseExecutionResult } from '../../interfaces/IDatabaseProvider';

export class MemoryCacheAdapter implements ICacheProvider {
  private store = new Map<string, { val: string; expiresAt?: number }>();

  async get<T = string>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.val) as T;
    } catch {
      return item.val as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { val, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async increment(key: string, ttlSeconds: number = 60): Promise<number> {
    const current = await this.get<number>(key);
    const count = typeof current === 'number' ? current + 1 : (current ? parseInt(String(current), 10) + 1 : 1);
    await this.set(key, count.toString(), ttlSeconds);
    return count;
  }
}

export class MemoryStorageAdapter implements IStorageProvider {
  private files = new Map<string, { data: ArrayBuffer; contentType: string }>();

  async upload(
    key: string,
    data: Uint8Array | ArrayBuffer | string,
    contentType: string = 'application/octet-stream'
  ): Promise<StorageUploadResult> {
    let buffer: ArrayBuffer;
    if (typeof data === 'string') {
      const encoded = new TextEncoder().encode(data);
      buffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
    } else if (data instanceof Uint8Array) {
      buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    } else {
      buffer = data as ArrayBuffer;
    }

    this.files.set(key, { data: buffer, contentType });
    return {
      key,
      url: `https://storage.local/${key}`,
      sizeBytes: buffer.byteLength,
    };
  }

  async download(key: string): Promise<ArrayBuffer | null> {
    return this.files.get(key)?.data || null;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  getPublicUrl(key: string): string {
    return `https://storage.local/${key}`;
  }
}

export class MemoryQueueAdapter implements IQueueProvider {
  public messages: any[] = [];

  async push<T = any>(message: T): Promise<void> {
    this.messages.push(message);
  }

  async pushBatch<T = any>(messages: T[]): Promise<void> {
    this.messages.push(...messages);
  }
}

import { createRequire } from 'node:module';

export class MemoryDatabaseAdapter implements IDatabaseProvider {
  private sqlite?: any;
  public drizzle?: any;
  private mockStore: Record<string, any[]> = {};

  constructor(sqliteInstance?: any) {
    if (sqliteInstance) {
      this.sqlite = sqliteInstance;
    } else if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const nodeRequire = createRequire(import.meta.url);
        const { DatabaseSync } = nodeRequire('node:sqlite');
        const fs = nodeRequire('node:fs');
        const path = nodeRequire('node:path');

        if (DatabaseSync) {
          this.sqlite = new DatabaseSync(':memory:');
          try {
            const schemaPath = path.resolve(process.cwd(), 'src/database/migrations/0001_initial_schema.sql');
            if (fs.existsSync(schemaPath)) {
              this.sqlite.exec(fs.readFileSync(schemaPath, 'utf8'));
            }
            const seedPath = path.resolve(process.cwd(), 'src/database/migrations/0002_seed_data.sql');
            if (fs.existsSync(seedPath)) {
              this.sqlite.exec(fs.readFileSync(seedPath, 'utf8'));
            }
            const sysSettingsPath = path.resolve(process.cwd(), 'src/database/migrations-drizzle/0001_striped_black_widow.sql');
            if (fs.existsSync(sysSettingsPath)) {
              this.sqlite.exec(fs.readFileSync(sysSettingsPath, 'utf8'));
            }
          } catch {
            // Optional fallback
          }
        }
      } catch {
        // Fallback to in-memory store
      }
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.sqlite) {
      const stmt = this.sqlite.prepare(sql);
      return stmt.all(...params) as T[];
    }
    return [] as T[];
  }

  async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (this.sqlite) {
      const stmt = this.sqlite.prepare(sql);
      const res = stmt.get(...params);
      return (res as T) || null;
    }
    return null;
  }

  async execute(sql: string, params: any[] = []): Promise<DatabaseExecutionResult> {
    if (this.sqlite) {
      const stmt = this.sqlite.prepare(sql);
      const res = stmt.run(...params);
      return {
        success: true,
        rowsAffected: Number(res.changes || 1),
        lastInsertRowId: Number(res.lastInsertRowid || 1),
      };
    }
    return { success: true, rowsAffected: 1 };
  }

  async batch(statements: { sql: string; params?: any[] }[]): Promise<DatabaseExecutionResult[]> {
    if (this.sqlite) {
      const results: DatabaseExecutionResult[] = [];
      for (const s of statements) {
        results.push(await this.execute(s.sql, s.params || []));
      }
      return results;
    }
    return statements.map(() => ({ success: true, rowsAffected: 1 }));
  }

  async transaction<T>(fn: (tx: IDatabaseProvider) => Promise<T>): Promise<T> {
    return await fn(this);
  }
}
