import { ICacheProvider } from '../../interfaces/ICacheProvider';

export class CloudflareCacheAdapter implements ICacheProvider {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const val = await this.kv.get(key);
    if (val === null) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const valStr = typeof value === 'string' ? value : JSON.stringify(value);
    await this.kv.put(key, valStr, {
      expirationTtl: ttlSeconds,
    });
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async increment(key: string, ttlSeconds: number = 60): Promise<number> {
    const current = await this.kv.get(key);
    const count = current ? parseInt(current, 10) + 1 : 1;
    await this.kv.put(key, count.toString(), {
      expirationTtl: ttlSeconds,
    });
    return count;
  }
}
