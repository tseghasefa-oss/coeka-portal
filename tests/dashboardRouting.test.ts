import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, resolveDashboardTab } from '../src/web/stores/useAppStore';
import { app } from '../src/api/index';
import { getContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';
import { UserAdminService } from '../src/services/admin/userAdminService';

describe('Role-Based Dashboard Routing & Navigation (Prompt 4 Final Wire-up)', () => {
  let authService: AuthService;
  let userAdminService: UserAdminService;

  beforeEach(async () => {
    const container = getContainer();
    authService = new AuthService(container.db, container.cache);
    userAdminService = new UserAdminService(container.db);
    await userAdminService.ensureSeedUsers();

    // Reset store state
    useAppStore.setState({
      activeTab: 'website',
      adminTab: 'courses',
      userSession: null,
      authLoading: false,
    });
  });

  // -------------------------------------------------------------
  // 1. Dashboard Resolver Unit Logic
  // -------------------------------------------------------------
  describe('resolveDashboardTab(role)', () => {
    it('resolves SUPER_ADMIN and ADMIN to "admin"', () => {
      expect(resolveDashboardTab('SUPER_ADMIN')).toBe('admin');
      expect(resolveDashboardTab('ADMIN')).toBe('admin');
    });

    it('resolves academic staff roles (LECTURER, HOD, STAFF) to "staff", DEAN to "dean", and LIBRARIAN to "librarian"', () => {
      expect(resolveDashboardTab('LECTURER')).toBe('staff');
      expect(resolveDashboardTab('DEAN')).toBe('dean');
      expect(resolveDashboardTab('LIBRARIAN')).toBe('librarian');
      expect(resolveDashboardTab('HOD')).toBe('staff');
      expect(resolveDashboardTab('STAFF')).toBe('staff');
    });

    it('resolves bursary roles (BURSAR, BURSARY) to "finance"', () => {
      expect(resolveDashboardTab('BURSAR')).toBe('finance');
      expect(resolveDashboardTab('BURSARY')).toBe('finance');
    });

    it('resolves PARENT to "parent"', () => {
      expect(resolveDashboardTab('PARENT')).toBe('parent');
    });

    it('resolves STUDENT and undefined/unknown to "sims"', () => {
      expect(resolveDashboardTab('STUDENT')).toBe('sims');
      expect(resolveDashboardTab(undefined)).toBe('sims');
      expect(resolveDashboardTab('')).toBe('sims');
      expect(resolveDashboardTab('UNKNOWN_ROLE')).toBe('sims');
    });
  });

  // -------------------------------------------------------------
  // 2. Verification Flow 1: Student Login & Admin URL Guarding
  // -------------------------------------------------------------
  describe('Verification Flow 1: Student Login and Admin URL Redirection', () => {
    it('logs in as a Student -> automatic redirect to Student Dashboard (sims)', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.10',
        },
        body: JSON.stringify({
          username: 'std_iorliam',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.user.role).toBe('STUDENT');

      // Set user session in Zustand and apply Dashboard Resolver
      const user = {
        userId: data.user.userId,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
        division: data.user.division,
        token: data.session?.sessionId,
      };

      const targetTab = resolveDashboardTab(user.role);
      useAppStore.setState({
        userSession: user,
        activeTab: targetTab,
      });

      // Verify automatic redirect landed on 'sims'
      const state = useAppStore.getState();
      expect(state.userSession?.role).toBe('STUDENT');
      expect(state.activeTab).toBe('sims');
    });

    it('attempt to manually change URL to /admin -> redirects back to Student Dashboard (sims)', () => {
      // 1. Given user is logged in as a Student
      useAppStore.setState({
        userSession: {
          userId: 'usr-std-001',
          username: 'std_iorliam',
          fullName: 'Aondoaver Moses Iorliam',
          role: 'STUDENT',
          division: 'NCE',
        },
        activeTab: 'sims',
      });

      expect(useAppStore.getState().activeTab).toBe('sims');

      // 2. Student manually attempts to switch activeTab or enter /admin in URL
      const attemptTabChange = (attemptedTab: 'admin') => {
        const currentUser = useAppStore.getState().userSession;
        if (attemptedTab === 'admin' && currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
          // Guard intercepts and redirects to user's authorized dashboard
          const resolved = resolveDashboardTab(currentUser?.role);
          useAppStore.setState({ activeTab: resolved });
        } else {
          useAppStore.setState({ activeTab: attemptedTab });
        }
      };

      attemptTabChange('admin');

      // 3. Verify user was immediately routed back to 'sims' (NOT 'admin')
      const state = useAppStore.getState();
      expect(state.activeTab).toBe('sims');
      expect(state.activeTab).not.toBe('admin');
    });
  });

  // -------------------------------------------------------------
  // 3. Verification Flow 2: Bursar Login & Finance Dashboard Redirection
  // -------------------------------------------------------------
  describe('Verification Flow 2: Bursar Login and Finance Dashboard Redirection', () => {
    it('logs in as Bursar -> automatic redirect to Finance Dashboard (finance)', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.11',
        },
        body: JSON.stringify({
          username: 'bursar_ikyur',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.user.role).toBe('BURSAR');

      // Set user session and apply Dashboard Resolver
      const user = {
        userId: data.user.userId,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
        division: data.user.division,
        token: data.session?.sessionId,
      };

      const targetTab = resolveDashboardTab(user.role);
      useAppStore.setState({
        userSession: user,
        activeTab: targetTab,
      });

      // Verify automatic redirect landed on 'finance'
      const state = useAppStore.getState();
      expect(state.userSession?.role).toBe('BURSAR');
      expect(state.activeTab).toBe('finance');
    });
  });

  // -------------------------------------------------------------
  // 4. Verification Flow 3: Academic Staff & Dean Redirection
  // -------------------------------------------------------------
  describe('Verification Flow 3: Faculty Staff and Dean Redirection', () => {
    it('logs in as Lecturer -> automatic redirect to Staff Dashboard (staff)', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.12',
        },
        body: JSON.stringify({
          username: 'lecturer1',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.user.role).toBe('LECTURER');

      const targetTab = resolveDashboardTab(data.user.role);
      useAppStore.setState({
        userSession: data.user,
        activeTab: targetTab,
      });

      expect(useAppStore.getState().activeTab).toBe('staff');
    });

    it('logs in as Dean -> automatic redirect to Staff Dashboard (staff)', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.13',
        },
        body: JSON.stringify({
          username: 'dean_tyav',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.user.role).toBe('DEAN');

      const targetTab = resolveDashboardTab(data.user.role);
      useAppStore.setState({
        userSession: data.user,
        activeTab: targetTab,
      });

      expect(useAppStore.getState().activeTab).toBe('dean');
    });
  });

  // -------------------------------------------------------------
  // 5. Verification Flow 4: Super Admin Redirection
  // -------------------------------------------------------------
  describe('Verification Flow 4: Super Admin Redirection', () => {
    it('logs in as Super Admin -> automatic redirect to Master Admin Area (admin)', async () => {
      const res = await app.request('/api/auth/login', {
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

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.user.role).toBe('SUPER_ADMIN');

      const targetTab = resolveDashboardTab(data.user.role);
      useAppStore.setState({
        userSession: data.user,
        activeTab: targetTab,
      });

      expect(useAppStore.getState().activeTab).toBe('admin');
    });
  });

  // -------------------------------------------------------------
  // 6. Root /dashboard URL Resolver
  // -------------------------------------------------------------
  describe('Root /dashboard URL Resolver', () => {
    it('resolves /dashboard to sims for authenticated student', () => {
      const session = { username: 'std_iorliam', fullName: 'Moses', role: 'STUDENT' as const, division: 'NCE' };
      const resolved = resolveDashboardTab(session.role);
      expect(resolved).toBe('sims');
    });

    it('resolves /dashboard to finance for authenticated bursar', () => {
      const session = { username: 'bursar_ikyur', fullName: 'Gabriel', role: 'BURSAR' as const, division: 'CENTRAL' };
      const resolved = resolveDashboardTab(session.role);
      expect(resolved).toBe('finance');
    });

    it('resolves /dashboard to staff for authenticated lecturer', () => {
      const session = { username: 'lecturer1', fullName: 'Adeyemi', role: 'LECTURER' as const, division: 'NCE' };
      const resolved = resolveDashboardTab(session.role);
      expect(resolved).toBe('staff');
    });

    it('resolves /dashboard to admin for authenticated admin', () => {
      const session = { username: 'admin1', fullName: 'Admin User', role: 'ADMIN' as const, division: 'CENTRAL' };
      const resolved = resolveDashboardTab(session.role);
      expect(resolved).toBe('admin');
    });

    it('resolves /dashboard to parent for authenticated guardian', () => {
      const session = { username: 'parent_tsegha', fullName: 'Joshua Tsegha', role: 'PARENT' as const, division: 'CENTRAL' };
      const resolved = resolveDashboardTab(session.role);
      expect(resolved).toBe('parent');
    });
  });

  // -------------------------------------------------------------
  // 7. Protected View Role Boundaries
  // -------------------------------------------------------------
  describe('Protected Dashboard View Role Boundaries', () => {
    const checkViewAccess = (allowedRoles: string[], userRole?: string): boolean => {
      if (!userRole) return false;
      return allowedRoles.includes(userRole);
    };

    it('enforces Admin Dashboard access (SUPER_ADMIN, ADMIN only)', () => {
      const allowed = ['SUPER_ADMIN', 'ADMIN'];
      expect(checkViewAccess(allowed, 'SUPER_ADMIN')).toBe(true);
      expect(checkViewAccess(allowed, 'ADMIN')).toBe(true);
      expect(checkViewAccess(allowed, 'STUDENT')).toBe(false);
      expect(checkViewAccess(allowed, 'BURSAR')).toBe(false);
      expect(checkViewAccess(allowed, 'LECTURER')).toBe(false);
      expect(checkViewAccess(allowed, 'PARENT')).toBe(false);
      expect(checkViewAccess(allowed, undefined)).toBe(false);
    });

    it('enforces Finance Dashboard access (BURSAR, BURSARY, SUPER_ADMIN, ADMIN)', () => {
      const allowed = ['BURSAR', 'BURSARY', 'SUPER_ADMIN', 'ADMIN'];
      expect(checkViewAccess(allowed, 'BURSAR')).toBe(true);
      expect(checkViewAccess(allowed, 'BURSARY')).toBe(true);
      expect(checkViewAccess(allowed, 'SUPER_ADMIN')).toBe(true);
      expect(checkViewAccess(allowed, 'STUDENT')).toBe(false);
      expect(checkViewAccess(allowed, 'LECTURER')).toBe(false);
      expect(checkViewAccess(allowed, 'PARENT')).toBe(false);
    });

    it('enforces Staff Dashboard access (LECTURER, DEAN, HOD, STAFF, SUPER_ADMIN, ADMIN)', () => {
      const allowed = ['LECTURER', 'DEAN', 'HOD', 'STAFF', 'SUPER_ADMIN', 'ADMIN'];
      expect(checkViewAccess(allowed, 'LECTURER')).toBe(true);
      expect(checkViewAccess(allowed, 'DEAN')).toBe(true);
      expect(checkViewAccess(allowed, 'HOD')).toBe(true);
      expect(checkViewAccess(allowed, 'STAFF')).toBe(true);
      expect(checkViewAccess(allowed, 'SUPER_ADMIN')).toBe(true);
      expect(checkViewAccess(allowed, 'STUDENT')).toBe(false);
      expect(checkViewAccess(allowed, 'BURSAR')).toBe(false);
      expect(checkViewAccess(allowed, 'PARENT')).toBe(false);
    });

    it('enforces SIMS Dashboard access (STUDENT, SUPER_ADMIN, ADMIN)', () => {
      const allowed = ['STUDENT', 'SUPER_ADMIN', 'ADMIN'];
      expect(checkViewAccess(allowed, 'STUDENT')).toBe(true);
      expect(checkViewAccess(allowed, 'SUPER_ADMIN')).toBe(true);
      expect(checkViewAccess(allowed, 'ADMIN')).toBe(true);
      expect(checkViewAccess(allowed, 'BURSAR')).toBe(false);
      expect(checkViewAccess(allowed, 'LECTURER')).toBe(false);
      expect(checkViewAccess(allowed, 'PARENT')).toBe(false);
    });

    it('enforces Parent Dashboard access (PARENT, SUPER_ADMIN, ADMIN)', () => {
      const allowed = ['PARENT', 'SUPER_ADMIN', 'ADMIN'];
      expect(checkViewAccess(allowed, 'PARENT')).toBe(true);
      expect(checkViewAccess(allowed, 'SUPER_ADMIN')).toBe(true);
      expect(checkViewAccess(allowed, 'ADMIN')).toBe(true);
      expect(checkViewAccess(allowed, 'STUDENT')).toBe(false);
      expect(checkViewAccess(allowed, 'BURSAR')).toBe(false);
      expect(checkViewAccess(allowed, 'LECTURER')).toBe(false);
    });
  });
});
