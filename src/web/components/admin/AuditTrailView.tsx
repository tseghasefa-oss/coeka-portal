import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Eye,
  X,
  Lock,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuditLogs, AuditLogItem } from '../../hooks/useAdminData';

export const AuditTrailView: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const [limit, setLimit] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogItem | null>(null);

  const { auditLogs, isLoading, refetch, verifyAuditLog, isVerifying } = useAuditLogs(limit);

  // Filter logs locally
  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action.toUpperCase() === actionFilter;
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      log.action.toLowerCase().includes(term) ||
      log.actorUserId.toLowerCase().includes(term) ||
      log.entityName.toLowerCase().includes(term) ||
      log.entityId.toLowerCase().includes(term) ||
      log.id.toLowerCase().includes(term);

    return matchesAction && matchesSearch;
  });

  const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action.toUpperCase())));

  const formatDate = (timestampSeconds: number) => {
    return new Date(timestampSeconds * 1000).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
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
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HMAC-SHA256 Cryptographic Audit Ledger
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">System Audit Trail & Integrity Engine</h2>
          <p className="text-xs text-slate-300">
            Every administrative mutation is hashed and cryptographically signed. Tampered database records are automatically flagged in red.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Verify & Refresh
        </button>
      </div>

      {/* Detail Inspection Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 transition-all ${
              isNavy
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedEntry.isTampered
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  {selectedEntry.isTampered ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold">Audit Log Integrity Inspection</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedEntry.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Integrity Status:</span>
                {selectedEntry.isTampered ? (
                  <span className="px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    TAMPERED / SIGNATURE MISMATCH
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CRYPTOGRAPHICALLY VERIFIED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Actor User</span>
                  <span className="font-bold">{selectedEntry.actorUserId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Action</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedEntry.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Entity</span>
                  <span className="font-mono">{selectedEntry.entityName} #{selectedEntry.entityId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                  <span>{formatDate(selectedEntry.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Client IP Address</span>
                  <span className="font-mono">{selectedEntry.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">User Agent</span>
                  <span className="truncate block font-mono text-[10px]">{selectedEntry.userAgent}</span>
                </div>
              </div>

              {selectedEntry.oldValueJson && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Previous State (Before Mutation):</span>
                  <pre className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] overflow-x-auto border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {JSON.stringify(JSON.parse(selectedEntry.oldValueJson), null, 2)}
                  </pre>
                </div>
              )}

              {selectedEntry.newValueJson && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Applied Changes (After Mutation):</span>
                  <pre className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] overflow-x-auto border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {JSON.stringify(JSON.parse(selectedEntry.newValueJson), null, 2)}
                  </pre>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Cryptographic Seal Signature:</span>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[10px] break-all border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  {selectedEntry.signature}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200/50 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bento-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action, entity name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Actions ({auditLogs.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={25}>Latest 25</option>
              <option value={50}>Latest 50</option>
              <option value={100}>Latest 100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table with Highlighted Tamper Red Alert */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Integrity Status</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Calculating cryptographic signatures and verifying audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records found matching the query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isTampered = log.isTampered;
                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${
                        isTampered
                          ? 'bg-rose-500/10 dark:bg-rose-950/40 hover:bg-rose-500/20 text-rose-900 dark:text-rose-200 border-l-4 border-rose-500'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        {isTampered ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm inline-flex items-center gap-1.5 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Tampered Log
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            HMAC Verified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-bold ${isTampered ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {log.actorUserId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {log.entityName} #{log.entityId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(log)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
