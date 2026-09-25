import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { AuthService } from '../../services/auth/authService';
import { rateLimiter } from '../middleware/rateLimit';

export const authRoutes = new Hono<{ Bindings: Env }>();

// Rate limit login endpoint to prevent brute-force attacks (10 attempts per minute per IP)
authRoutes.post('/login', rateLimiter(10, 60, 'login'), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const emailOrUsername = body.email || body.username;
  const password = body.password;

  if (!emailOrUsername || !password) {
    return c.json({ error: 'Validation Error: Email/username and password are required' }, 400);
  }

  const container = getContainer(c.env);
  const authService = new AuthService(container.db, container.cache);

  try {
    const userProfile = await authService.verifyCredentials(emailOrUsername, password);

    if (!userProfile) {
      return c.json({ error: 'Invalid credentials: Username/email or password is incorrect' }, 401);
    }

    // Create session in KV cache with 24-hour TTL
    const session = await authService.createSession(userProfile.id);

    // Set secure httpOnly session cookie
    const isHttps = c.req.url.startsWith('https:');
    setCookie(c, 'coeka_session', session.sessionId, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'None' : 'Lax',
      path: '/',
      maxAge: AuthService.SESSION_TTL_SECONDS,
    });

    return c.json({
      message: 'Authentication successful',
      sessionId: session.sessionId,
      user: {
        userId: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
        userType: session.userType,
        division: session.division,
        fullName: session.fullName,
      },
    });
  } catch (err: any) {
    if (err.message && err.message.includes('suspended')) {
      return c.json({ error: err.message }, 403);
    }
    return c.json({ error: err.message || 'Authentication failed' }, 400);
  }
});

// Logout endpoint: deletes session from KV cache and clears httpOnly cookie
authRoutes.post('/logout', async (c) => {
  const container = getContainer(c.env);
  const authService = new AuthService(container.db, container.cache);

  const sessionId = getCookie(c, 'coeka_session') || c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');

  if (sessionId) {
    await authService.deleteSession(sessionId);
  }

  deleteCookie(c, 'coeka_session', { path: '/' });

  return c.json({ message: 'Logged out successfully' });
});

// Current user profile endpoint based on active session
authRoutes.get('/me', async (c) => {
  const container = getContainer(c.env);
  const authService = new AuthService(container.db, container.cache);

  const sessionId = getCookie(c, 'coeka_session') || c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!sessionId) {
    return c.json({ error: 'Unauthorized: No active session or cookie provided' }, 401);
  }

  const session = await authService.getSession(sessionId);

  if (!session) {
    return c.json({ error: 'Unauthorized: Session expired or invalid' }, 401);
  }

  return c.json({
    sessionId: session.sessionId,
    user: {
      userId: session.userId,
      username: session.username,
      email: session.email,
      role: session.role,
      userType: session.userType,
      division: session.division,
      fullName: session.fullName,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    },
  });
});
