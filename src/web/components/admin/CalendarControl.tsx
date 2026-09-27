import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useSystemSettings } from '../../hooks/useAdminData';

export const CalendarControl: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const { settingsData, updateSettings, isUpdating, refetch } = useSystemSettings();

  const [sessionId, setSessionId] = useState('sess-2026-2027');
  const [sessionName, setSessionName] = useState('2026/2027 Academic Session');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2027-08-31');
  const [examStartDate, setExamStartDate] = useState('2027-02-15');
  const [examEndDate, setExamEndDate] = useState('2027-03-05');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (settingsData?.academicCalendar) {
      const cal = settingsData.academicCalendar;
      if (cal.sessionId) setSessionId(cal.sessionId);
      if (cal.startDate) setStartDate(cal.startDate);
      if (cal.endDate) setEndDate(cal.endDate);
      if (cal.examStartDate) setExamStartDate(cal.examStartDate);
      if (cal.examEndDate) setExamEndDate(cal.examEndDate);
    }
  }, [settingsData]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        calendarSessionId: sessionId,
        startDate,
        endDate,
        examStartDate,
        examEndDate,
      });
      showToast('Master Academic Session Calendar saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update academic calendar', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-900 border border-rose-700 text-white'
              : 'bg-emerald-900 border border-emerald-700 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div
        className={`bento-card p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm ${
          isNavy
            ? 'bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 border-slate-800'
            : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border-emerald-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Institutional Calendar Master Switch
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Academic Session Calendar Controller</h2>
          <p className="text-xs text-slate-300">
            Define statutory start and end dates for teaching, continuous assessment, and semester examinations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <form onSubmit={handleSave} className="lg:col-span-2 bento-card p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Master Session Date Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Academic Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Session Display Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Full Academic Session Term Dates
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Session Resumption Date (Start)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Session Closure Date (End)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Institutional Examination Windows
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Examination Commencement Date
                </label>
                <input
                  type="date"
                  value={examStartDate}
                  onChange={(e) => setExamStartDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Examination Conclusion Date
                </label>
                <input
                  type="date"
                  value={examEndDate}
                  onChange={(e) => setExamEndDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isUpdating ? 'Saving Calendar...' : 'Save Academic Schedule'}
            </button>
          </div>
        </form>

        {/* Calendar Summary & Deadlines Panel */}
        <div className="bento-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Timeline Overview
            </span>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Current Session:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{sessionId}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Session Resumes:</span>
                <span className="font-mono font-bold">{startDate}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Session Concludes:</span>
                <span className="font-mono font-bold">{endDate}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Exam Period:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{examStartDate} → {examEndDate}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
            <span className="font-bold">Automated Fee Due Dates:</span> Semester fee installment deadlines and course registration penalty triggers dynamically reference these statutory calendar dates.
          </div>
        </div>
      </div>
    </div>
  );
};
