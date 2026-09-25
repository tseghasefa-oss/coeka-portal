import { useEffect, useState, useCallback } from 'react';
import { useAppStore, UserSession, UserRole, ActiveTab, resolveDashboardTab } from '../stores/useAppStore';
import { getApiUrl } from '../config/api';

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
    try {
      setAuthLoading(true);
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('coeka_auth_token') : null;
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
          return syncedUser;
        }
      } else {
        // If 401 Unauthorized or forged/expired session, clear store session
        if (typeof window !== 'undefined') {
          localStorage.removeItem('coeka_auth_token');
        }
        setUserSession(null);
      }
    } catch (err) {
      console.warn('[useAuth] Could not synchronize server session:', err);
    } finally {
      setAuthLoading(false);
    }
    return null;
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

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

      setUserSession(activeUser);

      // Route user to their primary portal dashboard based on authenticated role
      const targetTab = resolveDashboardTab(activeUser.role);
      setActiveTab(targetTab);
      return { success: true, user: activeUser };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error encountered while connecting to authentication servers.';
      setLoginError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Log out of current session and invalidate KV cache
   */
  const logout = async () => {
    try {
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
