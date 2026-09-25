import React, { useEffect } from 'react';
import { ShieldAlert, ArrowRight, LogOut, GraduationCap, Home } from 'lucide-react';
import { useAppStore, UserRole, ActiveTab, resolveDashboardTab } from '../../stores/useAppStore';
import { LoginPage } from '../../pages/LoginPage';
import { useAuth } from '../../hooks/useAuth';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { userSession, authLoading, setActiveTab } = useAppStore();
  const { logout } = useAuth();

  // If initial server session check is still pending
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center text-emerald-950 font-black mb-4 shadow-xl shadow-amber-500/20 border-2 border-amber-300 animate-pulse">
          <GraduationCap className="w-10 h-10 text-emerald-950" />
        </div>
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-base font-bold tracking-tight">Verifying COEKA Session...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Edge Authentication Services</p>
      </div>
    );
  }

  // If user is not authenticated, render LoginPage
  if (!userSession) {
    return <LoginPage />;
  }

  // If roles are specified and user's role is not authorized
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userSession.role)) {
    const targetDashboard = resolveDashboardTab(userSession.role);

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200 text-rose-600">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <h3 className="text-xl font-bold text-slate-900">Access Restricted</h3>
          <p className="text-sm text-slate-600 mt-2">
            You do not possess the required operational permissions to access this institutional resource.
          </p>

          <div className="my-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Your Current Role:</span>
              <span className="font-bold text-rose-600">{userSession.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Authorized Roles:</span>
              <span className="font-bold text-slate-700">{allowedRoles.join(', ')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab(targetDashboard)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <span>Return to Authorized Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('website')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Go to College Home</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign In with Different Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}
