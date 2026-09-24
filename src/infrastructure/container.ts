import { IDatabaseProvider } from './interfaces/IDatabaseProvider';
import { ICacheProvider } from './interfaces/ICacheProvider';
import { IStorageProvider } from './interfaces/IStorageProvider';
import { IQueueProvider } from './interfaces/IQueueProvider';

import { CloudflareDatabaseAdapter } from './adapters/cloudflare/CloudflareDatabaseAdapter';
import { CloudflareCacheAdapter } from './adapters/cloudflare/CloudflareCacheAdapter';
import { CloudflareStorageAdapter } from './adapters/cloudflare/CloudflareStorageAdapter';
import { CloudflareQueueAdapter } from './adapters/cloudflare/CloudflareQueueAdapter';

import {
  MemoryDatabaseAdapter,
  MemoryCacheAdapter,
  MemoryStorageAdapter,
  MemoryQueueAdapter,
} from './adapters/memory/index';

import { Env } from '../types/env';

export * from './interfaces/IDatabaseProvider';
export * from './interfaces/ICacheProvider';
export * from './interfaces/IStorageProvider';
export * from './interfaces/IQueueProvider';

export interface ServiceContainer {
  db: IDatabaseProvider;
  cache: ICacheProvider;
  storage: IStorageProvider;
  queue: IQueueProvider;
}

/**
 * Creates a ServiceContainer bound to Cloudflare edge infrastructure (D1, KV, R2, Queue).
 */
export function createCloudflareContainer(env: Env): ServiceContainer {
  return {
    db: new CloudflareDatabaseAdapter(env.DB),
    cache: new CloudflareCacheAdapter(env.SESSION_KV),
    storage: new CloudflareStorageAdapter(env.DOCUMENTS_BUCKET),
    queue: new CloudflareQueueAdapter(env.ASYNC_QUEUE),
  };
}

/**
 * Creates an in-memory / mock ServiceContainer suitable for unit tests, local emulation, or non-Cloudflare environments.
 */
export function createMemoryContainer(): ServiceContainer {
  return {
    db: new MemoryDatabaseAdapter(),
    cache: new MemoryCacheAdapter(),
    storage: new MemoryStorageAdapter(),
    queue: new MemoryQueueAdapter(),
  };
}

/**
 * Factory to retrieve the active ServiceContainer. Automatically falls back to in-memory if Env is undefined.
 */
export function getContainer(env?: Env): ServiceContainer {
  if (env && env.DB) {
    return createCloudflareContainer(env);
  }
  return createMemoryContainer();
}
