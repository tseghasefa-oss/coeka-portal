import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { getContainer, createMemoryContainer, resetDefaultMemoryContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';
import { UserAdminService } from '../src/services/admin/userAdminService';

describe('COEKA Portal - Production Authentication System & Edge Session Management', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
  });

  // -------------------------------------------------------------
  // 1. AuthService Core Unit Tests
  // -------------------------------------------------------------
  describe('AuthService Core Logic', () => {
    it('verifies credentials with correct password and returns enriched user profile', async () => {
      const container = createMemoryContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();

      const authService = new AuthService(container.db, container.cache);

      // Verify with founder email and default credential
      const profile = await authService.verifyCredentials('founder@fruitfulujah.com', 'Password123!');
      expect(profile).not.toBeNull();
      expect(profile?.username).toBe('founder_tsegha');
      expect(profile?.role).toBe('SUPER_ADMIN');
      expect(profile?.userType).toBe('ADMIN');
      expect(profile?.fullName).toBe('Engr. Prof. S. L. Tsegha');

      // Verify with username
      const profileByUsername = await authService.verifyCredentials('founder_tsegha', 'Password123!');
      expect(profileByUsername).not.toBeNull();
      expect(profileByUsername?.id).toBe(profile?.id);
    });

    it('rejects authentication with invalid password and returns null', async () => {
      const container = createMemoryContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();

      const authService = new AuthService(container.db, container.cache);

      const profile = await authService.verifyCredentials('founder@fruitfulujah.com', 'WrongPassword123!');
      expect(profile).toBeNull();
    });

    it('rejects authentication for non-existent users', async () => {
      const container = createMemoryContainer();
      const authService = new AuthService(container.db, container.cache);

      const profile = await authService.verifyCredentials('unknown@coeka.edu.ng', 'Password123!');
      expect(profile).toBeNull();
    });

    it('creates a session in KV cache with 24-hour TTL and retrieves it', async () => {
      const container = createMemoryContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();

      const authService = new AuthService(container.db, container.cache);

      const session = await authService.createSession('usr-admin-001');
      expect(session.sessionId).toBeDefined();
      expect(session.sessionId.startsWith('coeka_sess_')).toBe(true);
      expect(session.role).toBe('SUPER_ADMIN');
      expect(session.expiresAt - session.createdAt).toBe(86400); // 24 hours

      // Retrieve session from KV
      const retrieved = await authService.getSession(session.sessionId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.userId).toBe('usr-admin-001');
      expect(retrieved?.username).toBe('founder_tsegha');

      // Delete session
      await authService.deleteSession(session.sessionId);
      const afterDelete = await authService.getSession(session.sessionId);
      expect(afterDelete).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 2. Auth API Integration: POST /api/auth/login
  // -------------------------------------------------------------
  describe('POST /api/auth/login', () => {
    it('returns 400 when email/username or password is missing', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'founder@fruitfulujah.com' }), // missing password
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain('required');
    });

    it('returns 401 for invalid credentials (wrong password)', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.10',
        },
        body: JSON.stringify({
          email: 'founder@fruitfulujah.com',
          password: 'IncorrectPassword!',
        }),
      });

      expect(res.status).toBe(401);
      const json: any = await res.json();
      expect(json.error).toContain('Invalid credentials');
    });

    it('returns 200, user profile, and secure httpOnly session cookie for valid login', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.11',
        },
        body: JSON.stringify({
          username: 'founder_tsegha',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.message).toBe('Authentication successful');
      expect(json.sessionId).toBeDefined();
      expect(json.sessionId.startsWith('coeka_sess_')).toBe(true);
      expect(json.user.role).toBe('SUPER_ADMIN');
      expect(json.user.fullName).toBe('Engr. Prof. S. L. Tsegha');

      // Verify Set-Cookie header contains coeka_session and HttpOnly
      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('coeka_session=coeka_sess_');
      expect(setCookieHeader?.toLowerCase()).toContain('httponly');
      expect(setCookieHeader).toContain('Max-Age=86400');
    });

    it('successfully logs in student account and sets student persona in session', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.12',
        },
        body: JSON.stringify({
          email: 'm.iorliam@student.coeka.edu.ng',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.user.role).toBe('STUDENT');
      expect(json.user.username).toBe('std_iorliam');
      expect(json.user.division).toBe('NCE');
    });
  });

  // -------------------------------------------------------------
  // 3. Auth API Integration: GET /api/auth/me
  // -------------------------------------------------------------
  describe('GET /api/auth/me', () => {
    it('returns 401 when no session cookie or header is provided', async () => {
      const res = await app.request('/api/auth/me');
      expect(res.status).toBe(401);
      const json: any = await res.json();
      expect(json.error).toContain('Unauthorized');
    });

    it('returns 401 when an invalid or forged session cookie is provided', async () => {
      const res = await app.request('/api/auth/me', {
        headers: {
          Cookie: 'coeka_session=coeka_sess_forged_invalid_token',
        },
      });

      expect(res.status).toBe(401);
    });

    it('returns 200 and authenticated profile when valid session cookie is provided', async () => {
      // 1. Log in to get session cookie
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.13',
        },
        body: JSON.stringify({
          username: 'lecturer1',
          password: 'Password123!',
        }),
      });

      expect(loginRes.status).toBe(200);
      const loginData: any = await loginRes.json();
      const sessionCookie = `coeka_session=${loginData.sessionId}`;

      // 2. Request /api/auth/me using the cookie
      const meRes = await app.request('/api/auth/me', {
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(meRes.status).toBe(200);
      const meData: any = await meRes.json();
      expect(meData.user.username).toBe('lecturer1');
      expect(meData.user.role).toBe('LECTURER');
      expect(meData.user.userType).toBe('STAFF');
      expect(meData.user.fullName).toBe('Dr. Olufemi Adeyemi');
    });

    it('authenticates via Authorization: Bearer <sessionId> header as well', async () => {
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.14',
        },
        body: JSON.stringify({
          username: 'founder_tsegha',
          password: 'Password123!',
        }),
      });

      const loginData: any = await loginRes.json();

      const meRes = await app.request('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${loginData.sessionId}`,
        },
      });

      expect(meRes.status).toBe(200);
      const meData: any = await meRes.json();
      expect(meData.user.role).toBe('SUPER_ADMIN');
    });
  });

  // -------------------------------------------------------------
  // 4. Auth API Integration: POST /api/auth/logout
  // -------------------------------------------------------------
  describe('POST /api/auth/logout', () => {
    it('deletes session from KV and clears cookie on logout', async () => {
      // 1. Log in
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.15',
        },
        body: JSON.stringify({
          username: 'founder_tsegha',
          password: 'Password123!',
        }),
      });

      const loginData: any = await loginRes.json();
      const sessionCookie = `coeka_session=${loginData.sessionId}`;

      // 2. Call logout
      const logoutRes = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(logoutRes.status).toBe(200);
      const logoutJson: any = await logoutRes.json();
      expect(logoutJson.message).toContain('Logged out');

      // 3. Confirm subsequent /me request fails with 401
      const meRes = await app.request('/api/auth/me', {
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(meRes.status).toBe(401);
    });
  });

  // -------------------------------------------------------------
  // 5. Account Suspension Security
  // -------------------------------------------------------------
  describe('Suspended Account Protection', () => {
    it('blocks suspended accounts from logging in with 403 Forbidden', async () => {
      const container = getContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();

      // Suspend std_iorliam account
      await userAdmin.setUserStatus('usr-std-001', false, 'admin');

      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.20',
        },
        body: JSON.stringify({
          username: 'std_iorliam',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('suspended');
    });
  });

  // -------------------------------------------------------------
  // 6. Rate Limiting Protection on Login Endpoint
  // -------------------------------------------------------------
  describe('Brute-Force Rate Limiting', () => {
    it('rate limits excessive requests from the same IP address (429 Too Many Requests)', async () => {
      const spamIp = '198.51.100.99';

      let lastStatus = 200;
      // Send 12 rapid requests (exceeding the limit of 10/min)
      for (let i = 0; i < 12; i++) {
        const res = await app.request('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': spamIp,
          },
          body: JSON.stringify({
            username: 'nonexistent_user',
            password: 'BadPassword',
          }),
        });
        lastStatus = res.status;
      }

      // The 11th or 12th request must trigger rate limit 429
      expect(lastStatus).toBe(429);
    });
  });
});
