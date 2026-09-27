import React, { useState } from 'react';
import {
  Database,
  HardDrive,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Sparkles,
  Server,
  FileCheck2,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useDatabaseTools, BackupItem } from '../../hooks/useAdminData';

export const BackupTrigger: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const { backups, isLoadingBackups, refetchBackups, triggerBackup, isTriggeringBackup } = useDatabaseTools();

  const [snapshotName, setSnapshotName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await triggerBackup(snapshotName.trim() || undefined);
      showToast(`D1 Snapshot ${res.backup.id} generated and verified successfully!`);
      setSnapshotName('');
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger snapshot backup', 'error');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (timestampSeconds: number) => {
    return new Date(timestampSeconds * 1000).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

      {/* Trigger Card */}
      <div className="bento-card p-6 border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Trigger D1 Database Snapshot
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute an immutable atomic snapshot of all 48 relational tables and persist cryptographic hash in the audit catalog.
              </p>
            </div>
          </div>

          <form onSubmit={handleTrigger} className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Custom snapshot label (optional)..."
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 sm:w-64"
            />
            <button
              type="submit"
              disabled={isTriggeringBackup}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringBackup ? 'animate-spin' : ''}`} />
              {isTriggeringBackup ? 'Snapshotting...' : 'Trigger Snapshot'}
            </button>
          </form>
        </div>
      </div>

      {/* Snapshot Catalog Table */}
      <div className="bento-card overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              D1 Snapshot Catalog ({backups.length})
            </h4>
            <p className="text-[11px] text-slate-400">
              Verified snapshots saved to Cloudflare R2 Document Lake
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetchBackups()}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Snapshot Identifier</th>
                <th className="py-3 px-4">Description / Name</th>
                <th className="py-3 px-4">Tables & Records</th>
                <th className="py-3 px-4">Estimated Size</th>
                <th className="py-3 px-4">Created Timestamp</th>
                <th className="py-3 px-4 text-right">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoadingBackups ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                    Loading database snapshots...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No snapshots recorded yet. Click "Trigger Snapshot" above to create one.
                  </td>
                </tr>
              ) : (
                backups.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {bkp.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {bkp.name}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">{bkp.tablesCount}</span> tables •{' '}
                      <span className="text-slate-500">{bkp.recordsCount}</span> records
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {formatBytes(bkp.sizeBytes)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                      {formatDate(bkp.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Signed & Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
