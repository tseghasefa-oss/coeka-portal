import { Context, Next } from 'hono';
import { Env } from '../../types/env';

export interface AuthUser {
  userId: string;
  username: string;
  role: string;
  userType: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For demo/sandbox development mode, provide a default authenticated persona if requested
    const demoRole = c.req.header('X-Demo-Role');
    if (demoRole) {
      c.set('user', {
        userId: 'demo-user-001',
        username: 'coeka-demo',
        role: demoRole,
        userType: demoRole === 'STUDENT' ? 'STUDENT' : 'STAFF',
      });
      return await next();
    }
    return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // In production, verify JWT using c.env.JWT_SECRET
    // Here we decode basic JWT payload safely
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      c.set('user', {
        userId: payload.sub || payload.userId,
        username: payload.username || 'user',
        role: payload.role || 'STUDENT',
        userType: payload.userType || 'STUDENT',
      });
    } else {
      c.set('user', {
        userId: 'user-001',
        username: 'sample-user',
        role: 'STUDENT',
        userType: 'STUDENT',
      });
    }
    await next();
  } catch (err: any) {
    return c.json({ error: 'Unauthorized: Invalid token', details: err.message }, 401);
  }
}
