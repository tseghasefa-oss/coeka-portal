import { Context, Next } from 'hono';
import { Env } from '../../types/env';
import { requireAuth, SessionUser } from './rbac';

export type AuthUser = SessionUser;

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  return requireAuth(c, next);
}
