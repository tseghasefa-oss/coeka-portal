import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { getContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';
import { UserAdminService } from '../src/services/admin/userAdminService';

describe('Generalized RBAC Middleware (The Gatekeeper) & Edge Session Security', () => {
  let authService: AuthService;
  let userAdminService: UserAdminService;

  beforeEach(async () => {
    const container = getContainer();
    authService = new AuthService(container.db, container.cache);
    userAdminService = new UserAdminService(container.db);
    await userAdminService.ensureSeedUsers();
  });

  // -------------------------------------------------------------
  // 1. Core Verification Task from Prompt: Student accessing /api/admin/courses
  // -------------------------------------------------------------
  describe('Prompt Verification Scenario: Student attempting to access /api/admin/courses', () => {
    it('attempts to access /api/admin/courses using a session tagged as STUDENT and returns 403 Forbidden', async () => {
      // 1. Create a genuine edge session in KV for a student account
      const session = await authService.createSession('usr-std-001');
      expect(session.role).toBe('STUDENT');
      expect(session.sessionId).toContain('coeka_sess_');

      // 2. Request /api/admin/courses with student's session cookie
      const res = await app.request('/api/admin/courses', {
        method: 'GET',
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('STUDENT');
      expect(json.requiredRoles).toEqual(expect.arrayContaining(['SUPER_ADMIN', 'ADMIN']));
    });

    it('blocks student using Bearer session token from /api/admin/courses with 403 Forbidden', async () => {
      const session = await authService.createSession('usr-std-001');

      const res = await app.request('/api/admin/courses', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.sessionId}`,
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('STUDENT');
    });

    it('blocks student using demo persona from /api/admin/courses with 403 Forbidden', async () => {
      const res = await app.request('/api/admin/courses', {
        method: 'GET',
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('STUDENT');
    });

    it('blocks unauthenticated requests to /api/admin/courses with 401 Unauthorized', async () => {
      const res = await app.request('/api/admin/courses');

      expect(res.status).toBe(401);
      const json: any = await res.json();
      expect(json.error).toContain('Unauthorized');
    });
  });

  // -------------------------------------------------------------
  // 2. Route Group 1: /api/admin/* -> requireRole(['SUPER_ADMIN', 'ADMIN'])
  // -------------------------------------------------------------
  describe('Route Group 1: /api/admin/* (Admin & Super Admin Dashboard)', () => {
    it('allows SUPER_ADMIN to access /api/admin/courses', async () => {
      const session = await authService.createSession('usr-admin-001');
      expect(session.role).toBe('SUPER_ADMIN');

      const res = await app.request('/api/admin/courses', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.courses).toBeDefined();
    });

    it('allows ADMIN to access /api/admin/courses', async () => {
      const res = await app.request('/api/admin/courses', {
        headers: {
          'X-Demo-Role': 'ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.courses).toBeDefined();
    });

    it('denies LECTURER from accessing /api/admin/courses with 403 Forbidden', async () => {
      const res = await app.request('/api/admin/courses', {
        headers: {
          'X-Demo-Role': 'LECTURER',
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
    });
  });

  // -------------------------------------------------------------
  // 3. Route Group 2: /api/staff/* -> requireRole(['LECTURER', 'DEAN', 'HOD'])
  // -------------------------------------------------------------
  describe('Route Group 2: /api/staff/* (Lecturers, Deans, HODs)', () => {
    it('allows LECTURER to access /api/staff/profile', async () => {
      const session = await authService.createSession('usr-staff-001');
      expect(session.role).toBe('LECTURER');

      const res = await app.request('/api/staff/profile', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.staff).toBeDefined();
    });

    it('allows DEAN to access /api/staff/profile', async () => {
      const session = await authService.createSession('usr-dean-001');
      expect(session.role).toBe('DEAN');

      const res = await app.request('/api/staff/profile', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.staff).toBeDefined();
    });

    it('allows HOD to access /api/staff/profile', async () => {
      const res = await app.request('/api/staff/profile', {
        headers: {
          'X-Demo-Role': 'HOD',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.staff).toBeDefined();
    });

    it('denies STUDENT from accessing /api/staff/profile with 403 Forbidden', async () => {
      const session = await authService.createSession('usr-std-001');

      const res = await app.request('/api/staff/profile', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('STUDENT');
      expect(json.requiredRoles).toEqual(['LECTURER', 'DEAN', 'HOD']);
    });

    it('denies PARENT from accessing /api/staff/profile with 403 Forbidden', async () => {
      const res = await app.request('/api/staff/profile', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('denies unauthenticated requests to /api/staff/profile with 401', async () => {
      const res = await app.request('/api/staff/profile');
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------
  // 4. Route Group 3: /api/finance/* -> requireRole(['BURSAR', 'SUPER_ADMIN'])
  // -------------------------------------------------------------
  describe('Route Group 3: /api/finance/* (Bursar & Super Admin Operations)', () => {
    it('allows BURSAR to access /api/finance/summary', async () => {
      const session = await authService.createSession('usr-bur-001');
      expect(session.role).toBe('BURSAR');

      const res = await app.request('/api/finance/summary', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.summary).toBeDefined();
      expect(json.summary.totalCollectedFormatted).toBe('₦345,000,000.00');
    });

    it('allows SUPER_ADMIN to access /api/finance/reconciliation', async () => {
      const session = await authService.createSession('usr-admin-001');

      const res = await app.request('/api/finance/reconciliation', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.reconciliation).toBeDefined();
      expect(json.reconciliation.length).toBeGreaterThan(0);
    });

    it('denies LECTURER from accessing /api/finance/summary with 403 Forbidden', async () => {
      const session = await authService.createSession('usr-staff-001');

      const res = await app.request('/api/finance/summary', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('LECTURER');
      expect(json.requiredRoles).toEqual(['BURSAR', 'SUPER_ADMIN']);
    });

    it('denies STUDENT from accessing /api/finance/summary with 403 Forbidden', async () => {
      const res = await app.request('/api/finance/summary', {
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(res.status).toBe(403);
    });

    it('denies unauthenticated requests to /api/finance/summary with 401', async () => {
      const res = await app.request('/api/finance/summary');
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------
  // 5. Route Group 4: /api/student/* -> requireRole(['STUDENT'])
  // -------------------------------------------------------------
  describe('Route Group 4: /api/student/* (Student Portal Access)', () => {
    it('allows STUDENT to access /api/student/profile', async () => {
      const session = await authService.createSession('usr-std-001');
      expect(session.role).toBe('STUDENT');

      const res = await app.request('/api/student/profile', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.student).toBeDefined();
      expect(json.student.matricNumber).toBe('COEKA/2026/NCE/084');
      expect(json.student.role).toBe('STUDENT');
    });

    it('allows STUDENT to access /api/student/courses/available', async () => {
      const session = await authService.createSession('usr-std-001');

      const res = await app.request('/api/student/courses/available', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.courses).toBeDefined();
      expect(json.courses.length).toBeGreaterThan(0);
    });

    it('denies LECTURER from accessing /api/student/profile with 403 Forbidden', async () => {
      const session = await authService.createSession('usr-staff-001');

      const res = await app.request('/api/student/profile', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('LECTURER');
      expect(json.requiredRoles).toEqual(['STUDENT']);
    });

    it('denies PARENT from accessing /api/student/profile with 403 Forbidden', async () => {
      const res = await app.request('/api/student/profile', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });

      expect(res.status).toBe(403);
    });

    it('denies unauthenticated requests to /api/student/profile with 401', async () => {
      const res = await app.request('/api/student/profile');
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------
  // 6. Route Group 5: /api/parent/* -> requireRole(['PARENT'])
  // -------------------------------------------------------------
  describe('Route Group 5: /api/parent/* (Parent Portal Access)', () => {
    it('allows PARENT to access /api/parent/wards', async () => {
      const res = await app.request('/api/parent/wards', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.parent).toBeDefined();
      expect(json.wards).toBeDefined();
      expect(json.wards.length).toBe(3);
    });

    it('denies STUDENT from accessing /api/parent/wards with 403 Forbidden', async () => {
      const session = await authService.createSession('usr-std-001');

      const res = await app.request('/api/parent/wards', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('STUDENT');
      expect(json.requiredRoles).toEqual(['PARENT']);
    });

    it('denies LECTURER from accessing /api/parent/wards with 403 Forbidden', async () => {
      const session = await authService.createSession('usr-staff-001');

      const res = await app.request('/api/parent/wards', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('denies unauthenticated requests to /api/parent/wards with 401', async () => {
      const res = await app.request('/api/parent/wards');
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------
  // 7. Session Invalidation & Edge KV Cache Revocation
  // -------------------------------------------------------------
  describe('Session Invalidation & Edge Cache Lifecyle', () => {
    it('immediately denies access once a session is deleted from KV cache', async () => {
      // 1. Create a session for Bursar
      const session = await authService.createSession('usr-bur-001');

      // 2. Validate access succeeds
      const initialRes = await app.request('/api/finance/summary', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });
      expect(initialRes.status).toBe(200);

      // 3. Delete / Invalidate session from KV
      await authService.deleteSession(session.sessionId);

      // 4. Validate subsequent access fails with 401 Unauthorized
      const revokedRes = await app.request('/api/finance/summary', {
        headers: {
          Cookie: `coeka_session=${session.sessionId}`,
        },
      });
      expect(revokedRes.status).toBe(401);
      const json: any = await revokedRes.json();
      expect(json.error).toContain('Unauthorized');
    });
  });
});
