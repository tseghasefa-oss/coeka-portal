import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  Terminal,
  Server,
  DollarSign,
  Building,
  Lock,
  Unlock,
  KeyRound,
  FileCheck2,
  Calendar,
  Layers,
  Database,
  Sliders,
  Settings,
  AlertTriangle,
  RefreshCw,
  Power,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { SystemPipelineView } from './SystemPipelineView';
import { UserRoleManager } from './UserRoleManager';
import { AuditVault } from './AuditVault';
import { MaintenanceModeToggle } from './MaintenanceModeToggle';
import { SystemStatusPanel } from './SystemStatusPanel';
import { InstitutionalSettings } from './InstitutionalSettings';
import { CalendarControl } from './CalendarControl';
import { MigrationLog } from './MigrationLog';
import { BackupTrigger } from './BackupTrigger';
import { PortalToggle } from './PortalToggle';
import { FeeMatrixAuditor } from './FeeMatrixAuditor';
import { AssetOversight } from './AssetOversight';

type PillarTab = 'pipeline' | 'governance' | 'forensics' | 'devops' | 'assets';

export const SuperAdminDashboard: React.FC = () => {
  const { userSession, uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const [activeTab, setActiveTab] = useState<PillarTab>('pipeline');
  const [devopsSubTab, setDevopsSubTab] = useState<'status' | 'killswitch' | 'settings' | 'calendar' | 'migrations' | 'backups' | 'portals'>('killswitch');
  const [assetSubTab, setAssetSubTab] = useState<'tariffs' | 'inventory'>('tariffs');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Supreme Governor Header */}
      <div
        className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
          isNavy
            ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 border-purple-900/50 text-white'
            : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-indigo-900 text-white'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Institutional God Mode • System Governor
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Role: SUPER_ADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-purple-400 shrink-0" />
            COEKA Central Command Center
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Absolute administrative authority, cryptographic ledger verification, executive overrides,
            and disaster recovery management for College of Education, Katsina-Ala.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 shrink-0">
          <div className="text-right px-2">
            <div className="text-[10px] font-bold uppercase text-slate-400">Governor Session</div>
            <div className="text-xs font-mono font-bold text-purple-300 truncate max-w-[140px]">
              {userSession?.username || 'SUPER_ADMIN'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500 flex items-center justify-center text-purple-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 5 Architectural Pillar Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'pipeline'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Pillar 2: System Pipeline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'governance'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pillar 1: HR & Role Governance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('forensics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'forensics'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Pillar 3: Cryptographic Audit Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('devops')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'devops'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Pillar 4: Infrastructure & DevOps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'assets'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pillar 5: Financials & Assets</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* Pillar 2: System Pipeline & Emergency Overrides */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <SystemPipelineView />
          </div>
        )}

        {/* Pillar 1: Global User & Role Governance */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <UserRoleManager />
          </div>
        )}

        {/* Pillar 3: Cryptographic Security & Forensic Audit Vault */}
        {activeTab === 'forensics' && (
          <div className="space-y-6">
            <AuditVault />
          </div>
        )}

        {/* Pillar 4: System Infrastructure & DevOps */}
        {activeTab === 'devops' && (
          <div className="space-y-6">
            {/* Sub-tab navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setDevopsSubTab('killswitch')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  devopsSubTab === 'killswitch'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                Emergency Kill-Switch
              </button>

              <button
                type="button"
                onClick={() => setDevopsSubTab('status')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  devopsSubTab === 'status'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Cloudflare Latency & D1 Health
              </button>

              <button
                type="button"
                onClick={() => setDevopsSubTab('settings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  devopsSubTab === 'settings'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Institutional Metadata
              </button>

              <button
                type="button"
                onClick={() => setDevopsSubTab('calendar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  devopsSubTab === 'calendar'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Academic Session Calendar
              </button>

              <button
                type="button"
                onClick={() => setDevopsSubTab('migrations')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  devopsSubTab === 'migrations'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                D1 Drizzle Migrations
              </button>

              <button
                type="button"
                onClick={() => setDevopsSubTab('backups')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  devopsSubTab === 'backups'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                D1 Snapshot Backup
              </button>

              <button
                type="button"
                onClick={() => setDevopsSubTab('portals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  devopsSubTab === 'portals'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Portal Feature Switches
              </button>
            </div>

            {/* Sub-tab view components */}
            {devopsSubTab === 'killswitch' && <MaintenanceModeToggle />}
            {devopsSubTab === 'status' && <SystemStatusPanel />}
            {devopsSubTab === 'settings' && <InstitutionalSettings />}
            {devopsSubTab === 'calendar' && <CalendarControl />}
            {devopsSubTab === 'migrations' && <MigrationLog />}
            {devopsSubTab === 'backups' && <BackupTrigger />}
            {devopsSubTab === 'portals' && <PortalToggle />}
          </div>
        )}

        {/* Pillar 5: Financials & Asset Master-Control */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAssetSubTab('tariffs')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  assetSubTab === 'tariffs'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                Fee Matrix Policy Auditor
              </button>

              <button
                type="button"
                onClick={() => setAssetSubTab('inventory')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  assetSubTab === 'inventory'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Physical Library & Hostel Inventory
              </button>
            </div>

            {assetSubTab === 'tariffs' && <FeeMatrixAuditor />}
            {assetSubTab === 'inventory' && <AssetOversight />}
          </div>
        )}
      </div>
    </div>
  );
};
