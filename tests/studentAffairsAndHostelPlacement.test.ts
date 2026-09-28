import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { createMemoryContainer, resetDefaultMemoryContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';
import { UserAdminService } from '../src/services/admin/userAdminService';
import { resolveDashboardTab } from '../src/web/stores/useAppStore';

describe('Directorate of Student Affairs & Student Dashboard Hostel Placement', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
  });

  describe('1. Directorate of Student Affairs Authentication & Credentials', () => {
    it('authenticates Directorate of Student Affairs with student_affairs / Password123!', async () => {
      const container = createMemoryContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();

      const authService = new AuthService(container.db, container.cache);

      // Verify credentials with username
      const profile = await authService.verifyCredentials('student_affairs', 'Password123!');
      expect(profile).not.toBeNull();
      expect(profile?.username).toBe('student_affairs');
      expect(profile?.role).toBe('WARDEN');
      expect(profile?.userType).toBe('STAFF');
      expect(profile?.fullName).toContain('Agba');
      expect(profile?.email).toBe('studentaffairs@coeka.edu.ng');

      // Verify credentials with email
      const profileByEmail = await authService.verifyCredentials('studentaffairs@coeka.edu.ng', 'Password123!');
      expect(profileByEmail).not.toBeNull();
      expect(profileByEmail?.id).toBe(profile?.id);
    });

    it('logs in Directorate of Student Affairs via POST /api/auth/login and sets WARDEN session', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'student_affairs',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('WARDEN');
      expect(data.user.username).toBe('student_affairs');
      expect(data.sessionId).toBeDefined();

      // Verify resolveDashboardTab directs WARDEN straight to hostels / warden desk
      expect(resolveDashboardTab('WARDEN')).toBe('hostels');
    });

    it('allows Directorate of Student Affairs to access warden roster via /api/hostels/warden/roster', async () => {
      const res = await app.request('/api/hostels/warden/roster?roomNumber=101', {
        method: 'GET',
        headers: {
          'X-Demo-Role': 'WARDEN',
        },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
      expect(data.report.roomNumber).toContain('101');
    });
  });

  describe('2. Autonomous Edge Concurrency Engine on Student SIMS Workspace', () => {
    it('enables eligible student to query live hostel overview and student reservation status', async () => {
      // Query student status
      const statusRes = await app.request('/api/hostels/student-status?studentId=std-001', {
        method: 'GET',
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(statusRes.status).toBe(200);
      const statusData: any = await statusRes.json();
      expect(statusData.success).toBe(true);
      expect(statusData.student).toBeDefined();

      // Query overview with gender filter
      const overviewRes = await app.request('/api/hostels/overview?gender=MALE', {
        method: 'GET',
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(overviewRes.status).toBe(200);
      const overviewData: any = await overviewRes.json();
      expect(overviewData.success).toBe(true);
      expect(Array.isArray(overviewData.hostels)).toBe(true);
    });

    it('acquires 15-minute Compare-and-Swap bed lock for eligible student', async () => {
      const res = await app.request('/api/hostels/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
        },
        body: JSON.stringify({
          bedspaceId: 'bed-b101-1',
          studentId: 'std-001',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.lockId).toBeDefined();
      expect(data.remainingSeconds).toBeGreaterThan(800);
    });
  });
});
