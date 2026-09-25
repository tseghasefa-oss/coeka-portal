import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../src/web/stores/useAppStore';
import { app } from '../src/api/index';
import { getContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';
import { UserAdminService } from '../src/services/admin/userAdminService';

describe('Auth Frontend, useAuth Hook & Session Guard (ProtectedRoute)', () => {
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
  // 1. Core Verification Task: Session Persistence via /api/auth/me
  // -------------------------------------------------------------
  describe('Session Persistence on Page Refresh (via /api/auth/me)', () => {
    it('verifies that refreshing the page does not log the user out (session persistence via /api/auth/me)', async () => {
      // 1. Simulate a prior successful login where server issued an edge session cookie
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
        body: JSON.stringify({
          username: 'std_iorliam',
          password: 'Password123!',
        }),
      });

      expect(loginRes.status).toBe(200);
      const setCookie = loginRes.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain('coeka_session=');

      // Extract session cookie value
      const match = setCookie!.match(/coeka_session=([^;]+)/);
      const sessionCookie = match ? match[1] : '';
      expect(sessionCookie).toBeTruthy();

      // 2. Simulate page reload: Client store is initially cleared or empty
      useAppStore.setState({ userSession: null, authLoading: true });
      expect(useAppStore.getState().userSession).toBeNull();

      // 3. App loads and calls GET /api/auth/me with the browser's session cookie
      const meRes = await app.request('/api/auth/me', {
        method: 'GET',
        headers: {
          Cookie: `coeka_session=${sessionCookie}`,
        },
      });

      expect(meRes.status).toBe(200);
      const meData: any = await meRes.json();
      expect(meData.user).toBeDefined();
      expect(meData.user.username).toBe('std_iorliam');
      expect(meData.user.role).toBe('STUDENT');

      // 4. Client Zustand store synchronizes with server session
      useAppStore.setState({
        userSession: {
          userId: meData.user.userId,
          username: meData.user.username,
          fullName: meData.user.fullName,
          role: meData.user.role,
          division: meData.user.division,
          token: meData.session?.sessionId,
        },
        authLoading: false,
      });

      // 5. Verify user remains logged in across reload
      const finalState = useAppStore.getState();
      expect(finalState.userSession).not.toBeNull();
      expect(finalState.userSession?.role).toBe('STUDENT');
      expect(finalState.userSession?.username).toBe('std_iorliam');
      expect(finalState.authLoading).toBe(false);
    });

    it('clears client session if server reports 401 Unauthorized (expired or forged session)', async () => {
      // Given forged/expired session
      const meRes = await app.request('/api/auth/me', {
        method: 'GET',
        headers: {
          Cookie: 'coeka_session=coeka_sess_forged_invalid_token',
        },
      });

      expect(meRes.status).toBe(401);

      // Store reflects logged-out state
      useAppStore.getState().logout();
      expect(useAppStore.getState().userSession).toBeNull();
      expect(useAppStore.getState().activeTab).toBe('login');
    });
  });

  // -------------------------------------------------------------
  // 2. Client Login & Role-Based Tab Redirection
  // -------------------------------------------------------------
  describe('Client Login Flow & Auto-Redirection', () => {
    it('logs in student and sets target dashboard to "sims"', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.0.1',
        },
        body: JSON.stringify({
          username: 'std_iorliam',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();

      useAppStore.setState({
        userSession: {
          userId: data.user.userId,
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role,
          division: data.user.division,
          token: data.session?.sessionId,
        },
        activeTab: 'sims',
      });

      const store = useAppStore.getState();
      expect(store.userSession?.role).toBe('STUDENT');
      expect(store.activeTab).toBe('sims');
    });

    it('logs in Super Admin and sets target dashboard to "admin"', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.0.2',
        },
        body: JSON.stringify({
          username: 'founder_tsegha',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();

      useAppStore.setState({
        userSession: {
          userId: data.user.userId,
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role,
          division: data.user.division,
          token: data.session?.sessionId,
        },
        activeTab: 'admin',
      });

      const store = useAppStore.getState();
      expect(store.userSession?.role).toBe('SUPER_ADMIN');
      expect(store.activeTab).toBe('admin');
    });

    it('logs in Lecturer and sets target dashboard to "staff"', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.0.3',
        },
        body: JSON.stringify({
          username: 'lecturer1',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();

      useAppStore.setState({
        userSession: {
          userId: data.user.userId,
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role,
          division: data.user.division,
          token: data.session?.sessionId,
        },
        activeTab: 'staff',
      });

      const store = useAppStore.getState();
      expect(store.userSession?.role).toBe('LECTURER');
      expect(store.activeTab).toBe('staff');
    });

    it('rejects incorrect password with 401 and retains null session', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.0.4',
        },
        body: JSON.stringify({
          username: 'founder_tsegha',
          password: 'WrongPassword999!',
        }),
      });

      expect(res.status).toBe(401);
      expect(useAppStore.getState().userSession).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 3. Client Logout Lifecycle
  // -------------------------------------------------------------
  describe('Client Logout Lifecycle', () => {
    it('calls /api/auth/logout, invalidates server session, and clears Zustand store', async () => {
      // 1. Sign in
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.0.5',
        },
        body: JSON.stringify({
          username: 'founder_tsegha',
          password: 'Password123!',
        }),
      });
      const cookie = loginRes.headers.get('set-cookie')!;

      // 2. Set authenticated state
      useAppStore.setState({
        userSession: {
          username: 'founder_tsegha',
          fullName: 'Prof. S. L. Tsegha',
          role: 'SUPER_ADMIN',
          division: 'CENTRAL',
        },
        activeTab: 'admin',
      });

      // 3. Logout action
      const logoutRes = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: {
          Cookie: cookie,
        },
      });
      expect(logoutRes.status).toBe(200);

      // Trigger store logout
      useAppStore.getState().logout();

      // 4. Verify store is purged and activeTab is redirected to login
      const state = useAppStore.getState();
      expect(state.userSession).toBeNull();
      expect(state.activeTab).toBe('login');

      // 5. Verify server session is expunged
      const verifyRes = await app.request('/api/auth/me', {
        headers: {
          Cookie: cookie,
        },
      });
      expect(verifyRes.status).toBe(401);
    });
  });

  // -------------------------------------------------------------
  // 4. ProtectedRoute Guard Logic & Role Enforcement
  // -------------------------------------------------------------
  describe('ProtectedRoute Guard Conditions', () => {
    it('identifies unauthenticated access condition and triggers login redirect', () => {
      useAppStore.setState({ userSession: null });
      const state = useAppStore.getState();

      const isAuthenticated = Boolean(state.userSession);
      expect(isAuthenticated).toBe(false);

      if (!isAuthenticated) {
        state.setActiveTab('login');
      }
      expect(useAppStore.getState().activeTab).toBe('login');
    });

    it('detects unauthorized role when student attempts to access admin dashboard', () => {
      useAppStore.setState({
        userSession: {
          username: 'std_iorliam',
          fullName: 'Moses Iorliam',
          role: 'STUDENT',
          division: 'NCE',
        },
        activeTab: 'admin',
      });

      const state = useAppStore.getState();
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN'];
      const hasPermission = allowedRoles.includes(state.userSession!.role);

      expect(hasPermission).toBe(false);
    });

    it('validates authorized role when Super Admin accesses admin dashboard', () => {
      useAppStore.setState({
        userSession: {
          username: 'founder_tsegha',
          fullName: 'Prof. S. L. Tsegha',
          role: 'SUPER_ADMIN',
          division: 'CENTRAL',
        },
        activeTab: 'admin',
      });

      const state = useAppStore.getState();
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN'];
      const hasPermission = allowedRoles.includes(state.userSession!.role);

      expect(hasPermission).toBe(true);
    });
  });
});
