import React, { useEffect, useState } from 'react';
import { useAppStore, SchoolDivision, ActiveTab } from '../../stores/useAppStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface DivisionGuardProps {
  allowedDivisions?: SchoolDivision[];
  children: React.ReactNode;
  fallbackTab?: ActiveTab;
  featureName?: string;
}

/**
 * DivisionGuard: Institutional Route Guard protecting Tertiary-only features
 * (Course Registration, Senate Results, Hostel Allocations) against unauthorized
 * Basic Education (Secondary & Primary) access.
 */
export const DivisionGuard: React.FC<DivisionGuardProps> = ({
  allowedDivisions = ['DEGREE', 'NCE'],
  children,
  fallbackTab = 'dashboard_home',
  featureName = 'This feature',
}) => {
  const { userSession, activeDivision, setActiveTab, showToast } = useAppStore();
  const currentDivision = (userSession?.division || activeDivision || 'NCE').toUpperCase() as SchoolDivision;
  const isAllowed = allowedDivisions.includes(currentDivision);

  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isAllowed && !hasRedirected) {
      setHasRedirected(true);

      // 1. Trigger strict institutional toast notification
      showToast('This feature is not available for your academic division.', 'error');

      // 2. Intercept and redirect back to authorized division home screen
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState({}, '', '/dashboard');
        }
        setActiveTab(fallbackTab);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isAllowed, hasRedirected, fallbackTab, setActiveTab, showToast]);

  // If division is not allowed, block view immediately and render security boundary
  if (!isAllowed) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 shadow-xl text-center space-y-5 animate-fade-in font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 font-mono">
            Institutional Boundary Enforcement • Division {currentDivision}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Access Restricted to Tertiary Programmes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            This feature is not available for your academic division. You are being redirected to your division command center...
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history?.replaceState) {
                window.history.replaceState({}, '', '/dashboard');
              }
              setActiveTab(fallbackTab);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
