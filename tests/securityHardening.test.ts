import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { getContainer, resetDefaultMemoryContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';

describe('Security Hardening & WAF Verification (The Shield)', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
  });

  describe('1. Input Validation Overhaul & SQL Injection Rejection', () => {
    it('strictly blocks classical SQL injection attacks on authentication gateway', async () => {
      // Classical SQL injection attempt: ' OR 1=1 --
      const sqliPayload = {
        identifier: "' OR '1'='1' --",
        password: "Password123!",
      };

      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sqliPayload),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Input Validation Failed');
      expect(json.details[0].message).toMatch(/SQL injection/i);
    });

    it('strictly blocks UNION SELECT SQL injection attempts', async () => {
      const unionPayload = {
        identifier: "admin' UNION SELECT * FROM users --",
        password: "Password123!",
      };

      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unionPayload),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Input Validation Failed');
    });

    it('rejects malformed JSON payloads at the edge boundary with 400', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ malformed json: not valid ...',
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toMatch(/Malformed JSON payload/i);
    });
  });

  describe('2. Strict Institutional Security Headers', () => {
    it('injects CSP, X-Frame-Options, and nosniff headers on HTTP responses', async () => {
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);

      const headers = res.headers;

      // Clickjacking Defense
      expect(headers.get('X-Frame-Options')).toBe('DENY');

      // MIME-type Sniffing Defense
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');

      // Content Security Policy
      const csp = headers.get('Content-Security-Policy');
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");

      // Transport Security (HSTS)
      const hsts = headers.get('Strict-Transport-Security');
      expect(hsts).toContain('max-age=31536000');

      // Referrer Policy
      expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('3. Session Hardening & Cryptographic Session Rotation', () => {
    it('regenerates session ID in KV upon privilege escalation and destroys old token', async () => {
      const container = getContainer();
      const authService = new AuthService(container.db, container.cache);

      // 1. Create initial session for a lecturer
      const initialSession = await authService.createSession('usr-staff-001');
      expect(initialSession.sessionId).toBeDefined();
      expect(initialSession.role).toBe('LECTURER');

      // Verify active in KV
      const cachedBefore = await authService.getSession(initialSession.sessionId);
      expect(cachedBefore).not.toBeNull();
      expect(cachedBefore?.userId).toBe('usr-staff-001');

      // 2. Perform Session Rotation (privilege update simulation)
      const rotatedSession = await authService.rotateSession(initialSession.sessionId);

      // Verify new session ID is distinct
      expect(rotatedSession.sessionId).not.toBe(initialSession.sessionId);
      expect(rotatedSession.userId).toBe('usr-staff-001');

      // 3. Confirm old session ID is completely erased from KV
      const oldCached = await authService.getSession(initialSession.sessionId);
      expect(oldCached).toBeNull();

      // 4. Confirm new session is active in KV
      const newCached = await authService.getSession(rotatedSession.sessionId);
      expect(newCached).not.toBeNull();
      expect(newCached?.sessionId).toBe(rotatedSession.sessionId);
    });
  });

  describe('4. Rate Limiting Protection', () => {
    it('throttles excessive consecutive login attempts with HTTP 429', async () => {
      // Trigger 10 login requests (the limit)
      for (let i = 0; i < 10; i++) {
        await app.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.42' },
          body: JSON.stringify({ identifier: 'founder_tsegha', password: 'Password123!' }),
        });
      }

      // 11th request should be throttled
      const throttledRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.42' },
        body: JSON.stringify({ identifier: 'founder_tsegha', password: 'Password123!' }),
      });

      expect(throttledRes.status).toBe(429);
      const json: any = await throttledRes.json();
      expect(json.error).toMatch(/Rate limit exceeded/i);
    });
  });
});
