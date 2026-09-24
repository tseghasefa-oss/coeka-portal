import { Context, Next } from 'hono';
import { Env } from '../../types/env';

const inMemoryRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(limit: number = 60, windowSeconds: number = 60) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || '127.0.0.1';
    const now = Math.floor(Date.now() / 1000);

    // If Cloudflare KV is available
    if (c.env?.RATE_LIMIT_KV) {
      try {
        const key = `ratelimit:${clientIp}:${Math.floor(now / windowSeconds)}`;
        const currentCountStr = await c.env.RATE_LIMIT_KV.get(key);
        const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

        if (currentCount >= limit) {
          return c.json({ error: 'Too Many Requests: Rate limit exceeded. Please try again later.' }, 429);
        }

        await c.env.RATE_LIMIT_KV.put(key, (currentCount + 1).toString(), {
          expirationTtl: windowSeconds * 2,
        });
        return await next();
      } catch {
        // Fall back to memory on KV error
      }
    }

    // In-memory fallback
    const record = inMemoryRateLimitMap.get(clientIp);
    if (!record || record.resetAt < now) {
      inMemoryRateLimitMap.set(clientIp, { count: 1, resetAt: now + windowSeconds });
    } else {
      record.count++;
      if (record.count > limit) {
        return c.json({ error: 'Too Many Requests: Rate limit exceeded. Please try again later.' }, 429);
      }
    }

    await next();
  };
}
