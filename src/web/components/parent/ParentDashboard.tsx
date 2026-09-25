import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  CreditCard,
  FileText,
  Clock,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Download,
  Printer,
} from 'lucide-react';
import { useParentWards, useChildPerformance } from '../../hooks/useParentData';
import { useAppStore } from '../../stores/useAppStore';
import { WardSwitcher } from './WardSwitcher';
import { PerformanceTracker } from './PerformanceTracker';
import { UnifiedPaymentPortal } from './UnifiedPaymentPortal';

type ParentSubTab = 'overview' | 'payments' | 'reports';

export const ParentDashboard: React.FC = () => {
  const { userSession, activeWardId, setActiveWardId } = useAppStore();
  const { data: parentData, isLoading } = useParentWards();

  const [activeSubTab, setActiveSubTab] = useState<ParentSubTab>('overview');

  const wards = parentData?.wards || [];
  const parent = parentData?.parent;

  // Initialize active ward in Zustand if not already set
  useEffect(() => {
    if (!activeWardId && wards.length > 0) {
      setActiveWardId(wards[0].studentId as any);
    }
  }, [activeWardId, wards, setActiveWardId]);

  const currentWardId = activeWardId || wards[0]?.studentId || 'std-001';
  const selectedWard = wards.find((w) => w.studentId === currentWardId) || wards[0];

  const totalOutstandingKobo = wards.reduce((sum, w) => sum + (w.outstandingKobo || 0), 0);
  const formattedTotalOutstanding = `₦${(totalOutstandingKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="bento-card p-12 text-center text-xs text-slate-400">
        <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-700" />
        Connecting to COEKA Guardian clearing rail & synchronizing ward telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Executive Welcome & Parent Banner */}
      <div className="bento-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-emerald-950 text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded uppercase tracking-wider">
              Parent & Guardian Hub
            </span>
            <span className="text-xs text-emerald-200">Session 2026/2027 Active</span>
          </div>
          <h3 className="text-xl font-bold">
            Welcome, {parent?.fullName || userSession?.fullName || 'Mr. Joshua T. Tsegha'}
          </h3>
          <p className="text-xs text-emerald-100">
            Account ID: {parent?.parentId || 'prt-001'} • Monitored Wards: {wards.length} Children across NCE, Secondary & Primary
          </p>
        </div>

        <div className="text-left sm:text-right text-xs bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
          <span className="text-slate-300 block">Total Outstanding Family Balance</span>
          <strong className={`text-base font-black ${totalOutstandingKobo > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
            {totalOutstandingKobo > 0 ? formattedTotalOutstanding : 'Zero Balance (Cleared)'}
          </strong>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-emerald-800 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Academic Oversight & Performance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'payments'
              ? 'bg-emerald-800 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Unified Fee Payments</span>
          {totalOutstandingKobo > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'reports'
              ? 'bg-emerald-800 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terminal Report Cards</span>
        </button>
      </div>

      {/* TAB 1: ACADEMIC OVERSIGHT & PERFORMANCE TRACKER */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Ward Switcher: changes activeWardId in Zustand store */}
          <WardSwitcher wards={wards} />

          {/* Performance Tracker for currently selected ward */}
          <PerformanceTracker childId={currentWardId} />
        </div>
      )}

      {/* TAB 2: UNIFIED FEE PAYMENTS (MULTI-CHILD SHOPPING CART) */}
      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          <UnifiedPaymentPortal wards={wards} />
        </div>
      )}

      {/* TAB 3: TERMINAL REPORT CARDS & PRINTABLE OFFICIAL DOSSIER */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <WardSwitcher wards={wards} />

          <div className="bento-card p-6 bg-white border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {selectedWard?.fullName || 'Ward'} — Official Statement of Termly Results
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedWard?.programme || 'COEKA Educational Track'} • {selectedWard?.division}
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Dossier</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Institutional Verification Reference</span>
                <strong className="font-mono text-emerald-800 font-bold block mt-0.5">
                  coeka_guardian_verified_{currentWardId}_99a4c
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Signed by Academic Directorate</span>
                <span className="text-emerald-700 font-bold">VERIFIED AUTHENTIC</span>
              </div>
            </div>

            {/* Render performance detail */}
            <PerformanceTracker childId={currentWardId} />
          </div>
        </div>
      )}
    </div>
  );
};
