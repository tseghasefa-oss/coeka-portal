import { MiddlewareHandler } from 'hono';

// In-memory fallback cache for local dev / Vitest unit tests when globalThis.caches is not available
const localMemoryCache = new Map<string, { body: string; headers: Record<string, string>; expiresAt: number }>();

export interface EdgeCacheOptions {
  ttlSeconds?: number; // default 3600 (1 hour)
  staleWhileRevalidateSeconds?: number; // default 86400 (24 hours)
  varyByQuery?: boolean;
}

/**
 * Cloudflare Edge Cache Middleware
 * Leverages native Cloudflare Cache API (caches.default) with stale-while-revalidate (SWR)
 * support and graceful fallback for local development and unit tests.
 */
export function edgeCache(options: EdgeCacheOptions = {}): MiddlewareHandler {
  const ttl = options.ttlSeconds ?? 3600;
  const swr = options.staleWhileRevalidateSeconds ?? 86400;

  return async (c, next) => {
    // Only cache read-only GET or HEAD requests
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      return next();
    }

    const cacheKeyUrl = c.req.url;
    const cacheControlHeader = `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${swr}`;

    // 1. Check Cloudflare Worker native Cache API: caches.default
    const hasCloudflareCache = typeof globalThis.caches !== 'undefined' && Boolean((globalThis.caches as any)?.default);

    if (hasCloudflareCache) {
      try {
        const cfCache = (globalThis.caches as any).default;
        const cachedResponse = await cfCache.match(c.req.raw);

        if (cachedResponse) {
          // Cache HIT on Cloudflare Edge!
          const hitResponse = new Response(cachedResponse.body, cachedResponse);
          hitResponse.headers.set('CF-Cache-Status', 'HIT');
          hitResponse.headers.set('X-Edge-Cache', 'HIT');
          return hitResponse;
        }
      } catch {
        // Fall back to origin processing if native cache match fails
      }
    } else {
      // Memory fallback for local emulation / Vitest test environment
      const memCached = localMemoryCache.get(cacheKeyUrl);
      if (memCached && memCached.expiresAt > Date.now()) {
        const hitHeaders = new Headers(memCached.headers);
        hitHeaders.set('CF-Cache-Status', 'HIT');
        hitHeaders.set('X-Edge-Cache', 'HIT');
        hitHeaders.set('Cache-Control', cacheControlHeader);

        return new Response(memCached.body, {
          status: 200,
          headers: hitHeaders,
        });
      }
    }

    // 2. Cache MISS: Proceed to route handler
    await next();

    // 3. Only cache 200 OK responses
    if (c.res.status === 200) {
      c.res.headers.set('Cache-Control', cacheControlHeader);
      c.res.headers.set('CF-Cache-Status', 'MISS');
      c.res.headers.set('X-Edge-Cache', 'MISS');

      if (hasCloudflareCache) {
        try {
          const cfCache = (globalThis.caches as any).default;
          const clone = c.res.clone();
          if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
            c.executionCtx.waitUntil(cfCache.put(c.req.raw, clone));
          } else {
            cfCache.put(c.req.raw, clone).catch(() => {});
          }
        } catch {
          // ignore cache put errors
        }
      } else {
        // Store in local memory cache for test verification
        try {
          const bodyClone = await c.res.clone().text();
          const headersObj: Record<string, string> = {};
          c.res.headers.forEach((val, key) => {
            const lower = key.toLowerCase();
            if (lower !== 'cf-cache-status' && lower !== 'x-edge-cache') {
              headersObj[key] = val;
            }
          });
          localMemoryCache.set(cacheKeyUrl, {
            body: bodyClone,
            headers: headersObj,
            expiresAt: Date.now() + (ttl + swr) * 1000,
          });
        } catch {
          // ignore stream clone errors
        }
      }
    }
  };
}

export function clearEdgeCache() {
  localMemoryCache.clear();
}
