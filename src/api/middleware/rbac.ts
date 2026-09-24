import { Context, Next } from 'hono';
import { Env } from '../../types/env';

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized: Authentication required' }, 401);
    }

    if (!allowedRoles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
      return c.json({
        error: 'Forbidden: You do not possess the required role for this operational resource',
        requiredRoles: allowedRoles,
        currentRole: user.role,
      }, 403);
    }

    await next();
  };
}
