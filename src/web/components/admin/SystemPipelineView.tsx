import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  GraduationCap,
  Building,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Lock,
  Unlock,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SystemPipelineOverview } from '../../../services/admin/governanceService';

export const SystemPipelineView: React.FC = () => {
  const [pipeline, setPipeline] = useState<SystemPipelineOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Emergency Override State
  const [overrideType, setOverrideType] = useState<'FORCE_CLEAR_LIBRARY' | 'FORCE_CLEAR_BURSARY' | 'FORCE_RELEASE_HOSTEL_LOCK'>('FORCE_CLEAR_LIBRARY');
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideFeedback, setOverrideFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPipeline = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const url = forceRefresh ? '/api/admin/governance/pipeline?refresh=true' : '/api/admin/governance/pipeline';
      const res = await fetch(url);
      const data: any = await res.json();
      if (data.success && data.pipeline) {
        setPipeline(data.pipeline);
      } else {
        setErrorMessage(data.error || 'Failed to retrieve session pipeline telemetry');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error fetching pipeline data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIdentifier || !overrideReason) {
      setOverrideFeedback({ type: 'error', text: 'Please fill in target identifier and executive justification.' });
      return;
    }

    setOverrideSubmitting(true);
    setOverrideFeedback(null);

    try {
      const res = await fetch('/api/admin/governance/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overrideType,
          targetId: targetIdentifier.trim(),
          reason: overrideReason.trim(),
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setOverrideFeedback({
          type: 'success',
          text: data.details || 'Emergency override executed and logged in audit vault.',
        });
        setTargetIdentifier('');
        setOverrideReason('');
        await fetchPipeline(true);
      } else {
        setOverrideFeedback({
          type: 'error',
          text: data.error || 'Failed to execute emergency override.',
        });
      }
    } catch (err: any) {
      setOverrideFeedback({ type: 'error', text: err.message || 'Execution error.' });
    } finally {
      setOverrideSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Cache Telemetry Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg border border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              The Governor Layer
            </span>
            <span className="text-xs text-slate-300">Bird's Eye Institutional Lifecycle Oversight</span>
          </div>
          <h3 className="text-xl font-black mt-1">Cross-Module Academic & Financial Pipeline</h3>
          <p className="text-xs text-slate-400">
            Real-time telemetry aggregated across Bursary, Registry, Exams, Hostels, and Library.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          {pipeline?.isCached && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <span>KV Edge Cached</span>
            </span>
          )}
          <button
            onClick={() => fetchPipeline(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition border border-white/20 disabled:opacity-50"
            title="Bypass KV cache and recalculate live aggregates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Recalculating...' : 'Force Refresh'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4 Pipeline Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. FINANCIAL REVENUE VS DEBT */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <DollarSign className="w-4 h-4" />
                </div>
                <strong className="text-xs font-extrabold uppercase text-slate-700">Financial Liquidity</strong>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {pipeline?.financials.collectionRatePercentage ?? 0}% Recovered
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue (Settled)</span>
                <strong className="text-lg font-black text-emerald-700">
                  ₦{((pipeline?.financials.totalRevenueKobo || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Debt (Unpaid Invoices)</span>
                <strong className="text-sm font-bold text-rose-600">
                  ₦{((pipeline?.financials.totalDebtKobo || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-600 h-full"
                style={{ width: `${pipeline?.financials.collectionRatePercentage || 0}%` }}
              />
              <div
                className="bg-rose-400 h-full"
                style={{ width: `${100 - (pipeline?.financials.collectionRatePercentage || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{pipeline?.financials.settledTransactionsCount || 0} Paid</span>
              <span>{pipeline?.financials.unpaidInvoicesCount || 0} Unpaid</span>
            </div>
          </div>
        </div>

        {/* 2. ACADEMIC RESULTS GATEWAY */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                  <BookOpen className="w-4 h-4" />
                </div>
                <strong className="text-xs font-extrabold uppercase text-slate-700">Academic Moderation</strong>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {pipeline?.academics.publicationRatePercentage ?? 0}% Published
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Courses with Published Results</span>
                <strong className="text-lg font-black text-slate-900">
                  {pipeline?.academics.publishedCoursesCount || 0}
                  <span className="text-xs font-normal text-slate-500"> / {pipeline?.academics.totalCourses || 0} Courses</span>
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Draft Results Awaiting Dean</span>
                <strong className="text-sm font-bold text-amber-600">
                  {pipeline?.academics.draftCoursesCount || 0} Course Sheets Pending
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${pipeline?.academics.publicationRatePercentage || 0}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block text-right font-mono">
              Dean Queue: {pipeline?.academics.pendingDeansApprovalsCount || 0} Submissions
            </span>
          </div>
        </div>

        {/* 3. GRADUATION & CERTIFICATION */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <strong className="text-xs font-extrabold uppercase text-slate-700">Graduation Pipeline</strong>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {pipeline?.graduation.certificatesIssuedCount || 0} Certificates
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Senate Graduation Roster</span>
                <strong className="text-lg font-black text-slate-900">
                  {pipeline?.graduation.senateGraduationListCount || 0} Candidates
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Clearance Bottlenecks</span>
                <strong className="text-sm font-bold text-rose-600">
                  {pipeline?.graduation.clearanceBottlenecksCount || 0} Blocked by Debt/Library
                </strong>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Transcripts: {pipeline?.graduation.dispatchedTranscriptsCount || 0} Dispatched</span>
            <span className="text-amber-600 font-bold">{pipeline?.graduation.pendingTranscriptsCount || 0} Pending</span>
          </div>
        </div>

        {/* 4. LOGISTICS & HOSTEL OCCUPANCY */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Building className="w-4 h-4" />
                </div>
                <strong className="text-xs font-extrabold uppercase text-slate-700">Hostel Allocation</strong>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                {pipeline?.logistics.occupancyRatePercentage ?? 0}% Occupied
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupied / Available Beds</span>
                <strong className="text-lg font-black text-slate-900">
                  {pipeline?.logistics.occupiedBedspaces || 0}
                  <span className="text-xs font-normal text-slate-500"> / {pipeline?.logistics.totalBedspaces || 0} Total</span>
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active 15-Minute Locks</span>
                <strong className="text-sm font-bold text-amber-600">
                  {pipeline?.logistics.activeLocksCount || 0} In Checkout
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${pipeline?.logistics.occupancyRatePercentage || 0}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block text-right font-mono">
              {pipeline?.logistics.availableBedspaces || 0} Beds Free for Booking
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Overrides Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-900">Executive Emergency Overrides</h4>
            <p className="text-xs text-slate-500">
              SuperAdmin bypass control to unblock students or release locks in exceptional administrative circumstances.
            </p>
          </div>
        </div>

        {overrideFeedback && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
              overrideFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border border-rose-300 text-rose-900'
            }`}
          >
            {overrideFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{overrideFeedback.text}</span>
          </div>
        )}

        <form onSubmit={handleExecuteOverride} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Action Type */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Override Action
            </label>
            <select
              value={overrideType}
              onChange={(e: any) => setOverrideType(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="FORCE_CLEAR_LIBRARY">Force-Clear Library (Waive All Fines)</option>
              <option value="FORCE_CLEAR_BURSARY">Force-Clear Bursary (Waive Invoices)</option>
              <option value="FORCE_RELEASE_HOSTEL_LOCK">Force-Release Hostel Lock</option>
            </select>
          </div>

          {/* Target ID */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {overrideType === 'FORCE_RELEASE_HOSTEL_LOCK' ? 'Bedspace ID' : 'Student Matric / ID'}
            </label>
            <input
              type="text"
              value={targetIdentifier}
              onChange={(e) => setTargetIdentifier(e.target.value)}
              placeholder={overrideType === 'FORCE_RELEASE_HOSTEL_LOCK' ? 'e.g. bed-a101-1' : 'e.g. COEKA/2026/NCE/084 or std-001'}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          {/* Justification */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Executive Justification
            </label>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Approved Senate waiver / Compassionate grounds"
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={overrideSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{overrideSubmitting ? 'Executing Override...' : 'Execute SuperAdmin Override'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
