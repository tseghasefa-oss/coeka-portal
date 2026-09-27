import React from 'react';
import {
  GraduationCap,
  AlertTriangle,
  RefreshCw,
  Lock,
  ShieldAlert,
  LogIn,
  LifeBuoy,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface Props {
  onCheckAgain: () => void;
  isChecking?: boolean;
}

export const InstitutionalMaintenanceScreen: React.FC<Props> = ({ onCheckAgain, isChecking = false }) => {
  const { setActiveTab } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between items-center p-6 selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-inner">
            <GraduationCap className="w-6 h-6 text-emerald-900" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">COEKA ENTERPRISE DIGITAL CAMPUS</h1>
            <p className="text-[11px] text-slate-400">College of Education, Katsina-Ala • Benue State</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5 text-purple-400" />
          Administrator Sign In
        </button>
      </div>

      {/* Main Center Announcement */}
      <div className="w-full max-w-xl text-center space-y-6 my-auto py-8">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 animate-pulse">
            <Lock className="w-12 h-12" />
          </div>
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs font-black shadow-md">
            !
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            HTTP 503 • Emergency Maintenance Lockdown
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Portal Under Scheduled Maintenance
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The COEKA campus portal is currently undergoing essential infrastructure updates, database migrations,
            and cryptographic ledger audits ordered by Institutional Administration.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 text-left space-y-2 max-w-md mx-auto">
          <div className="font-bold text-white flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            What this means for you:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>Student Course Registration, Fee Payments, and Results viewing are temporarily suspended.</li>
            <li>No data or ongoing applications are lost during this maintenance window.</li>
            <li>Access will automatically resume as soon as the SuperAdmin completes the migration.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCheckAgain}
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking System...' : 'Check Status Again'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-4xl py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <LifeBuoy className="w-3.5 h-3.5 text-slate-400" />
          <span>Support Desk: <strong className="text-slate-400">ict-support@coeka.edu.ng</strong></span>
        </div>
        <div>
          © 2026 College of Education, Katsina-Ala. All rights reserved.
        </div>
      </div>
    </div>
  );
};
