import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Lock,
  Unlock,
  Key,
  Terminal,
  Activity,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface AuditVaultLog {
  id: string;
  actorUserId: string;
  action: string;
  entityName: string;
  entityId: string;
  signature: string;
  expectedSignature?: string;
  isTampered: boolean;
  isValidSignature: boolean;
  createdAt: number;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: string;
  newValue?: string;
}

interface SecuritySummary {
  failedLoginsCount: number;
  recentFailedLogins: Array<{
    id: string;
    identifier: string;
    ipAddress: string;
    timestamp: number;
    reason: string;
  }>;
  rateLimitTriggersCount: number;
  activeSuperAdminsCount: number;
  tamperedAuditLogsCount: number;
  systemStatus: 'SECURE' | 'WARNING' | 'ALERT';
}

export const AuditVault: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const [logs, setLogs] = useState<AuditVaultLog[]>([]);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [showOnlyTampered, setShowOnlyTampered] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditVaultLog | null>(null);

  const fetchVaultData = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch audit logs from vault endpoint
      let url = '/api/admin/governance/audit-vault?limit=100';
      if (actorFilter.trim()) {
        url += `&actor=${encodeURIComponent(actorFilter.trim())}`;
      }
      if (actionFilter !== 'ALL') {
        url += `&action=${encodeURIComponent(actionFilter)}`;
      }

      const [logsRes, secRes] = await Promise.all([
        fetch(url),
        fetch('/api/admin/governance/security'),
      ]);

      const logsData: any = await logsRes.json();
      const secData: any = await secRes.json();

      if (logsData.success && logsData.logs) {
        setLogs(logsData.logs);
      } else {
        setErrorMessage(logsData.error || 'Failed to load verified audit vault');
      }

      if (secData.success && secData.summary) {
        setSecuritySummary(secData.summary);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error fetching cryptographic vault logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVaultData();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVaultData();
  };

  const filteredLogs = logs.filter((log) => {
    if (showOnlyTampered && !log.isTampered) return false;
    return true;
  });

  const tamperedCount = logs.filter((l) => l.isTampered).length;
  const verifiedCount = logs.filter((l) => !l.isTampered).length;

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
      {/* 1. Header Banner & Status */}
      <div
        className={`bento-card p-6 text-white rounded-2xl border shadow-lg ${
          tamperedCount > 0
            ? 'bg-gradient-to-r from-rose-950 via-red-900 to-rose-900 border-rose-700'
            : isNavy
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border-indigo-900/40'
            : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border-emerald-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  tamperedCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {tamperedCount > 0
                  ? 'CRITICAL INTEGRITY BREACH DETECTED'
                  : 'HMAC-SHA256 IMMUTABLE FORENSIC LEDGER'}
              </span>
              <span className="text-[10px] font-semibold text-slate-300">
                Web Crypto API Hardware Acceleration
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              {tamperedCount > 0 ? (
                <AlertOctagon className="w-6 h-6 text-rose-400" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
              Cryptographic Audit Vault
            </h2>
            <p className="text-xs text-slate-200 mt-1 max-w-2xl">
              Every sensitive mutation across Bursary, Registry, Exams, and Library is signed with a secret HMAC key.
              Any direct database manipulation triggers an instant cryptographic integrity alert highlighted in bright red.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin' : ''}`} />
              Verify & Refresh
            </button>
          </div>
        </div>

        {/* Telemetry Indicator Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-black/25 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Verified Logs</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{verifiedCount}</div>
            <div className="text-[10px] text-emerald-200/80 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Valid Signatures
            </div>
          </div>

          <div
            className={`rounded-xl p-3 border ${
              tamperedCount > 0
                ? 'bg-rose-500/30 border-rose-500 text-white animate-pulse'
                : 'bg-black/25 border-white/10 text-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Tampered Records</div>
            <div className={`text-xl font-extrabold mt-0.5 ${tamperedCount > 0 ? 'text-rose-300' : 'text-slate-200'}`}>
              {tamperedCount}
            </div>
            <div className="text-[10px] flex items-center gap-1 mt-0.5">
              {tamperedCount > 0 ? (
                <span className="text-rose-200 font-bold flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" /> Compromised
                </span>
              ) : (
                <span className="text-emerald-300 font-medium">Zero Tampering</span>
              )}
            </div>
          </div>

          <div className="bg-black/25 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Active SuperAdmins</div>
            <div className="text-xl font-extrabold text-purple-300 mt-0.5">
              {securitySummary?.activeSuperAdminsCount || 1}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-purple-400" /> Supreme Authority
            </div>
          </div>

          <div className="bg-black/25 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Security Posture</div>
            <div
              className={`text-xl font-extrabold mt-0.5 ${
                securitySummary?.systemStatus === 'ALERT'
                  ? 'text-rose-400'
                  : securitySummary?.systemStatus === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {securitySummary?.systemStatus || 'SECURE'}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Radio className="w-3 h-3 text-emerald-400" /> Real-time Sentinel
            </div>
          </div>
        </div>
      </div>

      {/* 2. Threat & Failed Logins Telemetry */}
      {securitySummary && securitySummary.recentFailedLogins.length > 0 && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isNavy ? 'bg-slate-900/90 border-slate-800' : 'bg-amber-50/60 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-200/40 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">
                Security Sentinel: Recent Failed Authorization Attempts ({securitySummary.recentFailedLogins.length})
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Auto-logged by Rate Limiter & RBAC</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {securitySummary.recentFailedLogins.map((fl) => (
              <div
                key={fl.id}
                className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{fl.identifier}</span>
                  <span className="text-[10px] text-slate-500">{fl.ipAddress}</span>
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 truncate">
                  {fl.reason}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{formatDate(fl.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Filter and Query Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
          isNavy ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Actor User ID, Action, or Entity ID..."
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Administrative Actions</option>
            <option value="USER_ROLE_UPDATED">Role Modifications</option>
            <option value="RESULT_APPROVE">Dean's Approvals</option>
            <option value="CLEARANCE_GRANTED">Librarian Clearances</option>
            <option value="SUPERADMIN_OVERRIDE_FORCE_CLEAR_LIBRARY">Emergency Overrides</option>
            <option value="BULK_LEVEL_PROMOTION">Bulk Promotions</option>
            <option value="CERTIFICATE_ISSUANCE">Certificate Issuance</option>
          </select>

          <button
            type="button"
            onClick={() => setShowOnlyTampered(!showOnlyTampered)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              showOnlyTampered
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
            <span>Tampered Only ({tamperedCount})</span>
          </button>
        </div>
      </div>

      {/* 4. Forensic Audit Table */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm ${
          isNavy ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-500" />
              Verified Transaction Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredLogs.length} verified cryptographic audit entries
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-purple-500" />
            <span className="text-xs font-bold">Verifying HMAC signatures across database rows...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold">No audit entries matching filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Integrity Status</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Cryptographic Hash</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const isTampered = log.isTampered;
                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${
                        isTampered
                          ? 'bg-rose-500/15 border-l-4 border-l-rose-500 hover:bg-rose-500/25 text-rose-950 dark:text-rose-200'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Integrity Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isTampered ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight inline-flex items-center gap-1 bg-rose-600 text-white shadow-sm animate-pulse">
                            <AlertOctagon className="w-3 h-3" />
                            TAMPERED / INTEGRITY BREACH
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            CRYPTOGRAPHICALLY VERIFIED
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {log.action}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {log.actorUserId}
                        </div>
                        {log.ipAddress && (
                          <div className="text-[10px] text-slate-400 font-mono">{log.ipAddress}</div>
                        )}
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-600 dark:text-slate-300">{log.entityName}</div>
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                          {log.entityId}
                        </div>
                      </td>

                      {/* Cryptographic Hash */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate max-w-[140px] text-slate-500 dark:text-slate-400">
                            {log.signature || 'UNSIGNED_LEGACY'}
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {formatDate(log.createdAt)}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(log)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Detail Modal with Signature Comparison */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 transition-all ${
              selectedEntry.isTampered
                ? 'bg-rose-950 border-rose-600 text-white'
                : isNavy
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedEntry.isTampered
                      ? 'bg-rose-600 text-white'
                      : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                  }`}
                >
                  {selectedEntry.isTampered ? <AlertOctagon className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Forensic Evidence Inspection</h3>
                  <p className="text-xs opacity-75 font-mono">Log ID: {selectedEntry.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedEntry.isTampered && (
              <div className="my-4 p-3 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-100 text-xs">
                <div className="font-black flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4 text-white" />
                  SECURITY ALERT: DATABASE ROW HAS BEEN MANUALLY ALTERED
                </div>
                <div className="mt-1">
                  The HMAC signature stored in this database record does not match the recalculated hash over its row contents.
                  This indicates that a database administrator or malicious actor modified this transaction outside the API layer.
                </div>
              </div>
            )}

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[10px] font-bold uppercase opacity-60">Action Executed</div>
                  <div className="font-mono font-bold mt-0.5">{selectedEntry.action}</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[10px] font-bold uppercase opacity-60">Actor User ID</div>
                  <div className="font-mono font-bold mt-0.5">{selectedEntry.actorUserId}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[10px] font-bold uppercase opacity-60">Target Entity</div>
                  <div className="font-mono mt-0.5">{selectedEntry.entityName} ({selectedEntry.entityId})</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[10px] font-bold uppercase opacity-60">Timestamp</div>
                  <div className="mt-0.5">{formatDate(selectedEntry.createdAt)}</div>
                </div>
              </div>

              {/* Cryptographic Comparison */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                  Cryptographic Verification Hashes
                </div>
                <div>
                  <div className="text-[10px] opacity-60">Stored Database Signature:</div>
                  <div className="font-mono text-[11px] break-all bg-black/40 p-1.5 rounded-lg border border-white/5 mt-0.5">
                    {selectedEntry.signature || 'NULL'}
                  </div>
                </div>
                {selectedEntry.expectedSignature && (
                  <div>
                    <div className="text-[10px] opacity-60">Calculated Expected Signature:</div>
                    <div
                      className={`font-mono text-[11px] break-all p-1.5 rounded-lg border mt-0.5 ${
                        selectedEntry.isTampered
                          ? 'bg-rose-900/40 border-rose-500 text-rose-300'
                          : 'bg-emerald-900/40 border-emerald-500 text-emerald-300'
                      }`}
                    >
                      {selectedEntry.expectedSignature}
                    </div>
                  </div>
                )}
              </div>

              {/* Payload Diff */}
              {(selectedEntry.oldValue || selectedEntry.newValue) && (
                <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-2">
                  <div className="text-[10px] font-black uppercase opacity-60">Payload Mutation Snapshot</div>
                  {selectedEntry.oldValue && (
                    <div>
                      <div className="text-[10px] text-amber-300">Before:</div>
                      <pre className="font-mono text-[10px] overflow-x-auto bg-black/40 p-2 rounded-lg mt-0.5">
                        {typeof selectedEntry.oldValue === 'string'
                          ? selectedEntry.oldValue
                          : JSON.stringify(selectedEntry.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedEntry.newValue && (
                    <div>
                      <div className="text-[10px] text-emerald-300">After:</div>
                      <pre className="font-mono text-[10px] overflow-x-auto bg-black/40 p-2 rounded-lg mt-0.5">
                        {typeof selectedEntry.newValue === 'string'
                          ? selectedEntry.newValue
                          : JSON.stringify(selectedEntry.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
              >
                Close Forensic Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
