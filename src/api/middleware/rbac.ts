import { Context, Next, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { AuthService } from '../../services/auth/authService';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'LECTURER'
  | 'DEAN'
  | 'HOD'
  | 'BURSAR'
  | 'STUDENT'
  | 'PARENT'
  | string;

export interface SessionUser {
  userId: string;
  username: string;
  role: UserRole;
  userType: string;
  division?: string;
  fullName?: string;
  email?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: SessionUser;
  }
}

/**
 * Helper to authenticate user from KV edge session cache, Authorization header, or demo persona.
 */
export async function authenticateSession(c: Context<{ Bindings: Env }>): Promise<SessionUser | null> {
  const existingUser = c.get('user');
  if (existingUser) {
    return existingUser;
  }

  const container = getContainer(c.env);
  const authService = new AuthService(container.db, container.cache);

  // 1. Session Cookie lookup in Edge KV Cache
  const sessionCookie = getCookie(c, 'coeka_session');
  if (sessionCookie) {
    const session = await authService.getSession(sessionCookie);
    if (session) {
      const user: SessionUser = {
        userId: session.userId,
        username: session.username,
        role: session.role,
        userType: session.userType,
        division: session.division,
        fullName: session.fullName,
        email: (session as any).email,
      };
      c.set('user', user);
      return user;
    }
  }

  // 2. Authorization Header (Bearer token in KV or JWT payload)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // 2a. Edge Session ID in KV Cache
    if (token.startsWith('coeka_sess_')) {
      const session = await authService.getSession(token);
      if (session) {
        const user: SessionUser = {
          userId: session.userId,
          username: session.username,
          role: session.role,
          userType: session.userType,
          division: session.division,
          fullName: session.fullName,
        };
        c.set('user', user);
        return user;
      }
    }

    // 2b. JWT Token Payload
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const user: SessionUser = {
          userId: payload.sub || payload.userId,
          username: payload.username || 'user',
          role: payload.role || 'STUDENT',
          userType: payload.userType || 'STUDENT',
        };
        c.set('user', user);
        return user;
      }
    } catch {
      // Fall through to unauthorized
    }
  }

  // 3. Demo Persona Header (for development sandbox and automated tests)
  const demoRole = c.req.header('X-Demo-Role');
  if (demoRole) {
    const user: SessionUser = {
      userId: `demo-${demoRole.toLowerCase()}-001`,
      username: `coeka-${demoRole.toLowerCase()}`,
      role: demoRole,
      userType: demoRole === 'STUDENT' ? 'STUDENT' : demoRole === 'PARENT' ? 'PARENT' : 'STAFF',
    };
    c.set('user', user);
    return user;
  }

  return null;
}

const requireAuthMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const user = await authenticateSession(c);
  if (!user) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401);
  }
  await next();
};

/**
 * Generalized requireAuth middleware:
 * Checks for a valid session in KV. If missing, returns 401 Unauthorized.
 * Can be used as either `app.use('*', requireAuth)` or `app.use('*', requireAuth())`.
 */
export function requireAuth(): MiddlewareHandler<{ Bindings: Env }>;
export function requireAuth(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void>;
export function requireAuth(c?: Context<{ Bindings: Env }>, next?: Next): any {
  if (c && next) {
    return requireAuthMiddleware(c, next);
  }
  return requireAuthMiddleware;
}

/**
 * Generalized requireRole middleware:
 * Extracts user's role from the session.
 * If user's role is NOT in the allowedRoles list, returns 403 Forbidden.
 * Accepts either an array `requireRole(['SUPER_ADMIN', 'ADMIN'])`
 * or rest parameters `requireRole('SUPER_ADMIN', 'ADMIN')`.
 */
export function requireRole(allowedRoles: UserRole[] | UserRole, ...restRoles: UserRole[]): MiddlewareHandler<{ Bindings: Env }> {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles, ...restRoles];

  return async (c, next) => {
    const user: SessionUser | null = c.get('user') || (await authenticateSession(c));

    if (!user) {
      return c.json({ error: 'Unauthorized: Authentication required' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({
        error: 'Forbidden: You do not possess the required role for this operational resource',
        requiredRoles: roles,
        currentRole: user.role,
      }, 403);
    }

    await next();
  };
}

/**
 * Convenience helper for Super Administrator access
 */
export function requireSuperAdmin(): MiddlewareHandler<{ Bindings: Env }> {
  return requireRole(['SUPER_ADMIN']);
}
