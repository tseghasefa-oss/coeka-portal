export interface ICacheProvider {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string, ttlSeconds?: number): Promise<number>;
}
