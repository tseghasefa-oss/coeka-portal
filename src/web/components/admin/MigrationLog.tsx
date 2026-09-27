import React from 'react';
import {
  FileCode2,
  CheckCircle2,
  Layers,
  Clock,
  RefreshCw,
  HardDrive,
  Hash,
  FileCheck2,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useDatabaseTools, MigrationItem } from '../../hooks/useAdminData';

export const MigrationLog: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const { migrations, isLoadingMigrations, refetchMigrations } = useDatabaseTools();

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
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Drizzle ORM D1 Schema Pipeline
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Live Database Migration Logs</h2>
          <p className="text-xs text-slate-300">
            Real-time audit log of all Drizzle migrations applied to Cloudflare D1 production database. Every batch is validated against institutional DDL specifications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetchMigrations()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMigrations ? 'animate-spin' : ''}`} />
          Verify Migrations
        </button>
      </div>

      {/* Migration Log Table */}
      <div className="bento-card overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Applied Migration Manifest ({migrations.length} Files)
            </h4>
            <p className="text-[11px] text-slate-400">
              D1 Database: coeka-production-db • Region: Western Europe (WEUR)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Batch Order</th>
                <th className="py-3 px-4">Migration File</th>
                <th className="py-3 px-4">Description / Subsystem</th>
                <th className="py-3 px-4">Checksum Hash</th>
                <th className="py-3 px-4">Applied Timestamp</th>
                <th className="py-3 px-4 text-right">Execution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoadingMigrations ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
                    Fetching migration records...
                  </td>
                </tr>
              ) : migrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No migration logs recorded.
                  </td>
                </tr>
              ) : (
                migrations.map((mig) => (
                  <tr key={mig.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
                        Batch #{mig.batch}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-cyan-500" />
                        {mig.migrationFile}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {mig.description || 'Database migration snapshot'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                      {mig.checksum}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {formatDate(mig.appliedAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {mig.status}
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
