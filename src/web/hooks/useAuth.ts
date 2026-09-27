import { useEffect, useState, useCallback } from 'react';
import { useAppStore, UserSession, UserRole, ActiveTab, resolveDashboardTab } from '../stores/useAppStore';
import { getApiUrl } from '../config/api';

// Module-level singleton locks to prevent concurrent checkSession spam
let isSessionCheckInProgress = false;
let sessionCheckPromise: Promise<UserSession | null> | null = null;
let lastSessionCheckTimestamp = 0;

export interface LoginResult {
  success: boolean;
  user?: UserSession;
  error?: string;
}

export function useAuth() {
  const {
    userSession,
    setUserSession,
    authLoading,
    setAuthLoading,
    activeTab,
    setActiveTab,
    logout: storeLogout,
  } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  /**
   * Synchronize the client session with the server KV session via GET /api/auth/me
   */
  const checkSession = useCallback(async (): Promise<UserSession | null> => {
    // 1. If a session check is already in-flight, return the existing promise
    if (isSessionCheckInProgress && sessionCheckPromise) {
      return sessionCheckPromise;
    }

    // 2. If already authenticated and verified within the last 30 seconds, return current session
    const currentSession = useAppStore.getState().userSession;
    if (currentSession && Date.now() - lastSessionCheckTimestamp < 30_000) {
      setAuthLoading(false);
      return currentSession;
    }

    // 3. Fast check for saved token in localStorage or cookie
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('coeka_auth_token') : null;
    const hasCookie = typeof document !== 'undefined' && document.cookie.includes('coeka_session');

    // If there is NO saved token and NO session cookie, the client is unauthenticated:
    // Instantly set authLoading(false) without incurring any network delay or edge roundtrips!
    if (!savedToken && !hasCookie && !currentSession) {
      setAuthLoading(false);
      setUserSession(null);
      return null;
    }

    // 4. Only show authLoading if we don't already have an active session in client store
    if (!currentSession) {
      setAuthLoading(true);
    }

    isSessionCheckInProgress = true;

    sessionCheckPromise = (async () => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (savedToken) {
          headers['Authorization'] = `Bearer ${savedToken}`;
        }

        const res = await fetch(getApiUrl('/api/auth/me'), {
          method: 'GET',
          headers,
          credentials: 'include',
          signal: controller?.signal,
        });

        if (res.ok) {
          const data: any = await res.json();
          if (data.user) {
            const token = data.sessionId || data.session?.sessionId || savedToken;
            if (token && typeof window !== 'undefined') {
              localStorage.setItem('coeka_auth_token', token);
            }
            const syncedUser: UserSession = {
              userId: data.user.userId,
              username: data.user.username,
              fullName: data.user.fullName || data.user.username,
              role: data.user.role as UserRole,
              division: data.user.division || 'NCE',
              email: data.user.email,
              token,
            };
            setUserSession(syncedUser);
            lastSessionCheckTimestamp = Date.now();
            return syncedUser;
          }
        } else {
          // If 401 Unauthorized or forged/expired session, clear store session
          if (typeof window !== 'undefined') {
            localStorage.removeItem('coeka_auth_token');
          }
          setUserSession(null);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('[useAuth] Session check timed out (2.5s). Falling back gracefully.');
        } else {
          console.warn('[useAuth] Could not synchronize server session:', err);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        setAuthLoading(false);
        isSessionCheckInProgress = false;
        sessionCheckPromise = null;
      }
      return null;
    })();

    return sessionCheckPromise;
  }, [setUserSession, setAuthLoading]);

  // Check server session on initial mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Log in to the COEKA secure portal
   */
  const login = async (emailOrUsername: string, password: string): Promise<LoginResult> => {
    setIsSubmitting(true);
    setLoginError(null);

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller?.signal,
        body: JSON.stringify({
          username: emailOrUsername.trim(),
          email: emailOrUsername.trim(),
          password,
        }),
      });

      const data: any = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Invalid username or password. Please verify your institutional credentials.';
        setLoginError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const token = data.sessionId || data.session?.sessionId;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('coeka_auth_token', token);
      }

      const activeUser: UserSession = {
        userId: data.user.userId,
        username: data.user.username,
        fullName: data.user.fullName || data.user.username,
        role: data.user.role as UserRole,
        division: data.user.division || 'NCE',
        email: data.user.email,
        token,
      };

      // Ensure session is fresh and prevent checkSession from running immediately
      lastSessionCheckTimestamp = Date.now();
      setAuthLoading(false);
      setUserSession(activeUser);

      // Route user to their primary portal dashboard based on authenticated role
      const targetTab = resolveDashboardTab(activeUser.role);
      setActiveTab(targetTab);
      return { success: true, user: activeUser };
    } catch (err: any) {
      const errorMsg =
        err.name === 'AbortError'
          ? 'Authentication request timed out. Please check your connection and try again.'
          : err.message || 'Network error encountered while connecting to authentication servers.';
      setLoginError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsSubmitting(false);
      setAuthLoading(false);
    }
  };

  /**
   * Log out of current session and invalidate KV cache
   */
  const logout = async () => {
    try {
      lastSessionCheckTimestamp = 0;
      setAuthLoading(false);
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('coeka_auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[useAuth] Error notifying server during logout:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('coeka_auth_token');
      }
      storeLogout();
      setActiveTab('login');
      setAuthLoading(false);
    }
  };

  return {
    userSession,
    isAuthenticated: Boolean(userSession),
    authLoading,
    isSubmitting,
    loginError,
    setLoginError,
    login,
    logout,
    checkSession,
  };
}
