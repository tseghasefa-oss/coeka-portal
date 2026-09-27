import React, { useState, useEffect } from 'react';
import {
  Power,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const MaintenanceModeToggle: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Safety confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetState, setTargetState] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Query system status
      const res = await fetch('/api/admin/system/status');
      const data: any = await res.json();
      if (data.success && typeof data.maintenanceMode === 'boolean') {
        setIsMaintenanceMode(data.maintenanceMode);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleClick = (nextState: boolean) => {
    setTargetState(nextState);
    setShowConfirmModal(true);
  };

  const executeToggle = async () => {
    setUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/governance/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState }),
      });
      const data: any = await res.json();

      if (data.success) {
        setIsMaintenanceMode(data.maintenanceMode);
        setFeedback({
          type: 'success',
          message: data.message || `Maintenance Mode successfully updated.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to toggle Maintenance Mode',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Network error while attempting to set Maintenance Mode',
      });
    } finally {
      setUpdating(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={targetState ? 'Engage Global Maintenance Mode' : 'Disable Maintenance Mode'}
        message={
          targetState
            ? 'WARNING: Engaging Maintenance Mode acts as an emergency institutional Kill-Switch. All active student, lecturer, dean, and librarian sessions will be immediately blocked with an HTTP 503 Maintenance Screen. Only users with the SUPER_ADMIN role will retain access.'
            : 'Disabling Maintenance Mode will immediately restore full portal accessibility across all faculties, students, and staff.'
        }
        confirmText={targetState ? 'Engage Emergency Kill-Switch' : 'Restore Live Operations'}
        isDangerous={targetState}
        onConfirm={executeToggle}
        onClose={() => setShowConfirmModal(false)}
      />

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Switch Card */}
      <div
        className={`p-6 rounded-2xl border shadow-lg transition-all ${
          isMaintenanceMode
            ? 'bg-gradient-to-r from-rose-950 via-red-950 to-slate-950 border-rose-600 text-white'
            : isNavy
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isMaintenanceMode
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isMaintenanceMode
                      ? 'bg-rose-500/30 text-rose-300 border-rose-500/50 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {isMaintenanceMode ? 'KILL-SWITCH ENGAGED' : 'PORTAL ONLINE & HEALTHY'}
                </span>
              </div>
              <h3 className="text-xl font-extrabold mt-1">Global Emergency Kill-Switch</h3>
              <p className="text-xs opacity-75">
                Master switch controlling campus-wide portal accessibility and downtime lockouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
            ) : isMaintenanceMode ? (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleToggleClick(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                {updating ? 'Deactivating...' : 'DEACTIVATE KILL-SWITCH'}
              </button>
            ) : (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleToggleClick(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                {updating ? 'Engaging...' : 'ENGAGE MAINTENANCE MODE'}
              </button>
            )}
          </div>
        </div>

        {/* Operational Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-xs">
          <div className="p-3.5 rounded-xl bg-black/20 border border-white/10">
            <div className="font-bold flex items-center gap-1.5 opacity-80 mb-1">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              API Routing Behavior
            </div>
            <div className="opacity-75">
              {isMaintenanceMode
                ? 'All non-SuperAdmin requests are immediately intercepted and return HTTP 503 Service Unavailable.'
                : 'All API routes (Admissions, Bursary, Registry, Exams, Hostels) are operating normally.'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/20 border border-white/10">
            <div className="font-bold flex items-center gap-1.5 opacity-80 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              SuperAdmin Exemption
            </div>
            <div className="opacity-75">
              SuperAdministrators bypass the lockout completely and can perform administrative repairs, database migrations, and emergency adjustments.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/20 border border-white/10">
            <div className="font-bold flex items-center gap-1.5 opacity-80 mb-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Audit Traceability
            </div>
            <div className="opacity-75">
              Every transition into or out of Maintenance Mode is cryptographically signed and stored in the immutable Audit Vault.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
