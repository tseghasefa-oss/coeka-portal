import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  Activity,
  UserCheck,
  CreditCard,
  BookOpen,
  Filter,
  ExternalLink,
  ChevronRight,
  X,
  Clock,
  HardDrive,
} from 'lucide-react';
import { useAppStore, AdminTab } from '../../stores/useAppStore';
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
import { AdminFeesTab } from './AdminFeesTab';
import { AdminCoursesTab } from './AdminCoursesTab';
import { AdmissionManager } from './AdmissionManager';
import { SessionControls } from './SessionControls';
import { AuditTrailView } from './AuditTrailView';

export type ManagementSuite =
  | 'hub'
  | 'governance'
  | 'institutional'
  | 'forensics'
  | 'infrastructure'
  | 'admissions'
  | 'pipeline';

// Lightweight, pure React SVG Sparkline component for KPI trendlines
const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#2563EB' }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 72;
  const height = 22;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const SuperAdminDashboard: React.FC = () => {
  const { userSession, uiPreferences, setAdminTab } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // Suite Navigation State (Hub-and-Spoke Bento Hub)
  const [activeSuite, setActiveSuite] = useState<ManagementSuite>('hub');

  // Sub-tab states for suites
  const [governanceSubTab, setGovernanceSubTab] = useState<'users'>('users');
  const [institutionalSubTab, setInstitutionalSubTab] = useState<'fees' | 'courses' | 'calendar'>('fees');
  const [forensicSubTab, setForensicSubTab] = useState<'vault' | 'logs'>('vault');
  const [infraSubTab, setInfraSubTab] = useState<'maintenance' | 'backups' | 'migrations' | 'identity'>('maintenance');
  const [admissionsSubTab, setAdmissionsSubTab] = useState<'upload' | 'progression'>('upload');

  // Interactive Bento Cell States
  const [maintenanceModeActive, setMaintenanceModeActive] = useState(false);
  const [apiGatewayActive, setApiGatewayActive] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState('4h ago');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Command Palette State (Cmd+K)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunBackup = () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      setLastBackupTime('Just now');
      triggerToast('AES-256 encrypted D1 snapshot completed successfully.');
    }, 1200);
  };

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Command Palette Actions
  const commandPaletteItems = [
    { label: 'Executive Command Center', category: 'Hub', suite: 'hub' as const, subTab: null, icon: ShieldCheck },
    { label: 'User Accounts & RBAC Governance', category: 'Governance', suite: 'governance' as const, subTab: 'users', icon: Users },
    { label: 'Master Fee Matrix & Tariff Schedules', category: 'Institutional', suite: 'institutional' as const, subTab: 'fees', icon: DollarSign },
    { label: 'Courses, Curriculum & Departments', category: 'Institutional', suite: 'institutional' as const, subTab: 'courses', icon: BookOpen },
    { label: 'Academic Session Calendar Controller', category: 'Institutional', suite: 'institutional' as const, subTab: 'calendar', icon: Calendar },
    { label: 'Cryptographic Security & Forensic Vault', category: 'Forensics', suite: 'forensics' as const, subTab: 'vault', icon: Terminal },
    { label: 'System Telemetry & HMAC Tamper Logs', category: 'Forensics', suite: 'forensics' as const, subTab: 'logs', icon: Activity },
    { label: 'Emergency Kill-Switch & Maintenance', category: 'Infrastructure', suite: 'infrastructure' as const, subTab: 'maintenance', icon: Power },
    { label: 'D1 Automated Database Snapshots', category: 'Infrastructure', suite: 'infrastructure' as const, subTab: 'backups', icon: Database },
    { label: 'Drizzle Schema Migration Manifest', category: 'Infrastructure', suite: 'infrastructure' as const, subTab: 'migrations', icon: FileCheck2 },
    { label: 'Institutional Metadata & Crest', category: 'Infrastructure', suite: 'infrastructure' as const, subTab: 'identity', icon: Settings },
    { label: 'Bulk Admissions & Candidate Screening', category: 'Admissions', suite: 'admissions' as const, subTab: 'upload', icon: UserCheck },
    { label: 'Session Progression & Matriculation Reset', category: 'Admissions', suite: 'admissions' as const, subTab: 'progression', icon: RefreshCw },
    { label: 'Autonomous Concurrency & Bed Pipeline', category: 'Pipeline', suite: 'pipeline' as const, subTab: null, icon: TrendingUp },
  ];

  const filteredCommands = commandPaletteItems.filter((item) =>
    item.label.toLowerCase().includes(commandSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const navigateToCommand = (suite: ManagementSuite, subTab: any) => {
    setActiveSuite(suite);
    if (suite === 'institutional' && subTab) setInstitutionalSubTab(subTab);
    if (suite === 'forensics' && subTab) setForensicSubTab(subTab);
    if (suite === 'infrastructure' && subTab) setInfraSubTab(subTab);
    if (suite === 'admissions' && subTab) setAdmissionsSubTab(subTab);
    setCommandPaletteOpen(false);
    setCommandSearch('');
  };

  // Recent 5 verified audit logs for Audit Snapshot Bento Card
  const recentAuditLogs = [
    { id: '1', action: 'USER_ROLE_UPDATED', actor: 'tyodoo.yue', desc: 'Promoted Dr. J. Orkuma to HOD Computing', time: '2m ago' },
    { id: '2', action: 'RESULT_APPROVE', actor: 'dean.science', desc: 'Dean Approved Degree 300L CSC Exam Results', time: '14m ago' },
    { id: '3', action: 'CLEARANCE_GRANTED', actor: 'lib.officer', desc: 'Library Clearance issued to Candidate #084', time: '38m ago' },
    { id: '4', action: 'FEE_SCHEDULE_SET', actor: 'bursar.central', desc: 'Updated NCE 100L Science Tuition to ₦48,000', time: '1h ago' },
    { id: '5', action: 'BULK_LEVEL_PROMOTED', actor: 'registrar.exams', desc: 'Advanced 480 NCE 100L students to 200L', time: '2h ago' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold bg-[#0B192C] text-white border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB BAR & COMMAND PALETTE TRIGGER                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveSuite('hub')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSuite === 'hub' ? 'text-[#0B192C] font-bold' : 'hover:text-blue-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Command Center</span>
          </button>

          {activeSuite !== 'hub' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-extrabold text-[#0B192C] uppercase tracking-wider">
                {activeSuite === 'governance' && 'Governance Suite'}
                {activeSuite === 'institutional' && 'Institutional Suite'}
                {activeSuite === 'forensics' && 'Forensic Suite'}
                {activeSuite === 'infrastructure' && 'Infrastructure Suite'}
                {activeSuite === 'admissions' && 'Admissions Suite'}
                {activeSuite === 'pipeline' && 'System Pipeline'}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeSuite !== 'hub' && (
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Bento Hub</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
            title="Search Suites & Tools (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Jump to Suite...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 rounded text-slate-500">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BENTO GRID SYSTEM: COMMAND CENTER LANDING VIEW                         */}
      {/* ========================================================================= */}
      {activeSuite === 'hub' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Institutional Header Cell */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                  Institutional Master Console
                </span>
                <span className="text-xs text-slate-400">College of Education, Katsina-Ala</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0B192C] dark:text-white tracking-tight flex items-center gap-2">
                Executive Command Center
              </h1>
              <p className="text-xs text-slate-500 max-w-xl">
                Bento Grid architecture for governance, financial matrix, cryptographic audit vault, and edge infrastructure.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Cloudflare D1: Operational</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Signed in: <strong className="text-slate-800 dark:text-white">{userSession?.fullName || 'SuperAdmin'}</strong>
              </span>
            </div>
          </div>

          {/* THE BENTO GRID (12-Column Symmetrical Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">

            {/* ----------------------------------------------------------------- */}
            {/* HERO CELL 1: THE INSTITUTIONAL PULSE (Large - lg:col-span-6)      */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
              <div>
                {/* Cell Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-[#0B192C] dark:text-white tracking-tight">
                        Institutional Pulse
                      </h2>
                      <p className="text-[11px] text-slate-500">Live 2026/2027 session vitals & inflow analytics</p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </span>
                </div>

                {/* 4 KPIs in 2x2 Grid with Mini-Trendlines */}
                <div className="grid grid-cols-2 gap-3.5 my-4">
                  {/* KPI 1: Revenue Inflow */}
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Revenue Inflow</span>
                      <Sparkline data={[42, 58, 65, 80, 95, 120, 142, 184]} color="#2563EB" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">₦184.5M</div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12.4% vs last term</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 2: Enrolled Students */}
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Enrolled Students</span>
                      <Sparkline data={[12200, 12800, 13400, 13900, 14200, 14820]} color="#2563EB" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">14,820</div>
                      <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>+4.8% cohort intake</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 3: Academic & Staff */}
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Academic & Staff</span>
                      <Sparkline data={[440, 450, 460, 470, 478, 482]} color="#0B192C" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">482</div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>98.4% RBAC verified</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 4: Edge System Health */}
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Edge Uptime</span>
                      <Sparkline data={[99.9, 100, 99.8, 100, 100, 99.98]} color="#10B981" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">99.98%</div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>12ms D1 edge latency</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cell Action Button */}
              <button
                type="button"
                onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B192C] hover:bg-slate-900 text-white font-bold text-xs transition-colors flex items-center justify-between shadow-xs cursor-pointer mt-1"
              >
                <span>Inspect Institutional Financial Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* HERO CELL 2: THE LIFECYCLE PIPELINE (Large - lg:col-span-6)       */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
              <div>
                {/* Cell Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-[#0B192C] dark:text-white tracking-tight">
                        Lifecycle Pipeline
                      </h2>
                      <p className="text-[11px] text-slate-500">Student journey progression across institutional milestones</p>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    88.0% Conversion
                  </span>
                </div>

                {/* Progress Stepper Journey */}
                <div className="my-4 space-y-3.5">
                  {/* Stepped Progress Track */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: '88%' }}
                    />
                  </div>

                  {/* 4 Pipeline Stages */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
                    {/* Stage 1 */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>1. Admitted</span>
                        <span className="text-[#0B192C] dark:text-white font-black">100%</span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white mt-0.5">4,820</div>
                      <span className="text-[10px] text-slate-400">Screened Cohort</span>
                    </div>

                    {/* Stage 2 */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>2. Paid Fees</span>
                        <span className="text-blue-600 font-black">88.0%</span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white mt-0.5">4,241</div>
                      <span className="text-[10px] text-slate-400">Bursary Settled</span>
                    </div>

                    {/* Stage 3 */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>3. Enrolled</span>
                        <span className="text-blue-600 font-black">82.0%</span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white mt-0.5">3,952</div>
                      <span className="text-[10px] text-slate-400">Active in SIMS</span>
                    </div>

                    {/* Stage 4 */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>4. Certified</span>
                        <span className="text-emerald-600 font-black">94.0%</span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white mt-0.5">4,530</div>
                      <span className="text-[10px] text-slate-400">Senate Cleared</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Zero bottleneck alerts detected in current cycle.
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">2026/2027</span>
                  </div>
                </div>
              </div>

              {/* Cell Action Button */}
              <button
                type="button"
                onClick={() => setActiveSuite('pipeline')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B192C] hover:bg-slate-900 text-white font-bold text-xs transition-colors flex items-center justify-between shadow-xs cursor-pointer mt-1"
              >
                <span>Launch Autonomous Concurrency Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* OPERATIONAL CELL 1: QUICK ACTION HUB (Medium - lg:col-span-4)     */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#0B192C] dark:text-white">Quick Action Hub</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">6 Tools</span>
                </div>

                {/* 6 Minimalist Icon Buttons */}
                <div className="grid grid-cols-3 gap-2 my-3.5">
                  {/* 1. Edit Fees */}
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#0B192C] text-slate-700 hover:text-white border border-slate-200/70 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
                  >
                    <DollarSign className="w-4 h-4 mb-1 text-blue-600 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Edit Fees</span>
                  </button>

                  {/* 2. Manage Roles */}
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('governance'); setGovernanceSubTab('users'); }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#0B192C] text-slate-700 hover:text-white border border-slate-200/70 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
                  >
                    <Users className="w-4 h-4 mb-1 text-blue-600 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Manage Roles</span>
                  </button>

                  {/* 3. Forensic Vault */}
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('forensics'); setForensicSubTab('vault'); }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#0B192C] text-slate-700 hover:text-white border border-slate-200/70 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
                  >
                    <Terminal className="w-4 h-4 mb-1 text-blue-600 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Audit Vault</span>
                  </button>

                  {/* 4. Course Catalog */}
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('courses'); }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#0B192C] text-slate-700 hover:text-white border border-slate-200/70 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
                  >
                    <BookOpen className="w-4 h-4 mb-1 text-blue-600 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Courses</span>
                  </button>

                  {/* 5. Admissions */}
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('admissions'); setAdmissionsSubTab('upload'); }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#0B192C] text-slate-700 hover:text-white border border-slate-200/70 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
                  >
                    <UserCheck className="w-4 h-4 mb-1 text-blue-600 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Admissions</span>
                  </button>

                  {/* 6. System Pipeline */}
                  <button
                    type="button"
                    onClick={() => setActiveSuite('pipeline')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#0B192C] text-slate-700 hover:text-white border border-slate-200/70 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
                  >
                    <TrendingUp className="w-4 h-4 mb-1 text-blue-600 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Pipeline</span>
                  </button>
                </div>
              </div>

              {/* Trigger Command Palette */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Command Palette</span>
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 rounded text-slate-500 border border-slate-200">
                  Ctrl+K
                </kbd>
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* OPERATIONAL CELL 2: AUDIT SNAPSHOT (Medium - lg:col-span-4)       */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#0B192C] dark:text-white">Audit Snapshot</h3>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    0 Tampered
                  </span>
                </div>

                {/* Exactly 5 Verified Audit Rows */}
                <div className="my-3 space-y-1.5">
                  {recentAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 px-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight text-[11px]">
                            {log.desc}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono truncate">
                            {log.actor} • {log.time}
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 shrink-0">
                        VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* View All Action */}
              <button
                type="button"
                onClick={() => { setActiveSuite('forensics'); setForensicSubTab('vault'); }}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <span>View Full Forensic Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* OPERATIONAL CELL 3: INFRASTRUCTURE STATUS (Medium - lg:col-span-4) */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#0B192C] dark:text-white">Infrastructure Status</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Edge
                  </div>
                </div>

                {/* Interactive Toggles & Live Indicators */}
                <div className="my-3 space-y-2">
                  {/* Toggle 1: Maintenance Mode */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Maintenance Mode</div>
                      <div className="text-[10px] text-slate-500">
                        {maintenanceModeActive ? 'Campus hold active' : 'Normal live traffic'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMaintenanceModeActive(!maintenanceModeActive);
                        triggerToast(`Maintenance Mode toggled ${!maintenanceModeActive ? 'ON' : 'OFF'}.`);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        maintenanceModeActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          maintenanceModeActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: API Gateway */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">API Edge Gateway</div>
                      <div className="text-[10px] text-slate-500">
                        {apiGatewayActive ? 'Strict WAF & Rate Limiting' : 'Gateway Bypassed'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setApiGatewayActive(!apiGatewayActive);
                        triggerToast(`API Edge Gateway ${!apiGatewayActive ? 'Enabled' : 'Bypassed'}.`);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        apiGatewayActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          apiGatewayActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Edge Telemetry Strip */}
                  <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
                    <span className="font-mono">Latency: <strong className="text-emerald-600">12ms</strong></span>
                    <span className="font-mono">Cache: <strong className="text-blue-600">98%</strong></span>
                    <span className="font-mono">Nodes: <strong>LOS/LHR</strong></span>
                  </div>
                </div>
              </div>

              {/* Emergency Console Button (Strict Yellow/Amber Palette) */}
              <button
                type="button"
                onClick={() => { setActiveSuite('infrastructure'); setInfraSubTab('maintenance'); }}
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Emergency Maintenance Console</span>
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* UTILITY CELL 1: USER COUNT (Small - lg:col-span-3)                */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">User Count</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">14,820</div>
                <p className="text-[11px] text-slate-500 mt-0.5">14,338 Students • 482 Staff</p>
                <div className="text-[10px] text-slate-400 mt-0.5">Across all 4 divisions</div>
              </div>

              <button
                type="button"
                onClick={() => { setActiveSuite('governance'); setGovernanceSubTab('users'); }}
                className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Manage User Directory</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* UTILITY CELL 2: DEBT ALERT (Small - lg:col-span-3)                 */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Debt & Arrears Alert</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                </div>
                {/* Total outstanding amount in Navy Blue text */}
                <div className="text-xl sm:text-2xl font-black text-[#0B192C] dark:text-blue-300 tracking-tight">₦18.4M</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Outstanding term balance</p>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                  12.0% pending ledger balance
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Reconcile Fee Ledgers</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* UTILITY CELL 3: BACKUP STATUS (Small - lg:col-span-3)             */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Backup Status</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-black text-[#0B192C] dark:text-white tracking-tight flex items-center gap-1.5">
                  <span>Last: {lastBackupTime}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">AES-256 D1 Snapshot</p>
                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hourly sync verified</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleRunBackup}
                  disabled={isBackingUp}
                  className="px-3 py-1 rounded-xl bg-[#0B192C] hover:bg-slate-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isBackingUp ? 'animate-spin' : ''}`} />
                  <span>{isBackingUp ? 'Backing up...' : 'Run Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveSuite('infrastructure'); setInfraSubTab('backups'); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Logs
                </button>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* UTILITY CELL 4: SYSTEM VERSION (Small - lg:col-span-3)            */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Version</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-black text-[#0B192C] dark:text-white tracking-tight">v2.4.0 Edge</div>
                <p className="text-[11px] text-slate-500 mt-0.5">D1 Cloudflare Sync</p>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    Schema v14 Applied
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setActiveSuite('infrastructure'); setInfraSubTab('migrations'); }}
                className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Migration Logs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MANAGEMENT SUITES (DEDICATED, SEPARATE, UNCLUSTERED VIEWS)              */}
      {/* ========================================================================= */}

      {/* SUITE 1: GOVERNANCE SUITE */}
      {activeSuite === 'governance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0B192C]">Governance & Role Management Suite</h2>
              <p className="text-xs text-slate-500">
                Institutional User Directory, Role Assignment (RBAC), and Password Synchronization.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Bento Hub</span>
            </button>
          </div>

          <UserRoleManager />
        </div>
      )}

      {/* SUITE 2: INSTITUTIONAL SUITE (FEES, COURSES, CALENDAR) */}
      {activeSuite === 'institutional' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0B192C]">Institutional Operations Suite</h2>
              <p className="text-xs text-slate-500">
                Master fee schedule matrix, courses & curriculum, and academic calendar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Bento Hub</span>
            </button>
          </div>

          {/* Suite Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-sm">
            <button
              type="button"
              onClick={() => setInstitutionalSubTab('fees')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                institutionalSubTab === 'fees'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Master Fee Matrix
            </button>
            <button
              type="button"
              onClick={() => setInstitutionalSubTab('courses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                institutionalSubTab === 'courses'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Courses & Curriculum
            </button>
            <button
              type="button"
              onClick={() => setInstitutionalSubTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                institutionalSubTab === 'calendar'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Academic Calendar Controller
            </button>
          </div>

          {institutionalSubTab === 'fees' && <AdminFeesTab />}
          {institutionalSubTab === 'courses' && <AdminCoursesTab />}
          {institutionalSubTab === 'calendar' && <CalendarControl />}
        </div>
      )}

      {/* SUITE 3: FORENSIC SUITE */}
      {activeSuite === 'forensics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0B192C]">Cryptographic Forensic Suite</h2>
              <p className="text-xs text-slate-500">
                HMAC-SHA256 row-level signature verification and system telemetry.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Bento Hub</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-sm">
            <button
              type="button"
              onClick={() => setForensicSubTab('vault')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                forensicSubTab === 'vault'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cryptographic Audit Vault
            </button>
            <button
              type="button"
              onClick={() => setForensicSubTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                forensicSubTab === 'logs'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              System Health & Telemetry
            </button>
          </div>

          {forensicSubTab === 'vault' && <AuditVault />}
          {forensicSubTab === 'logs' && (
            <div className="space-y-6">
              <SystemStatusPanel />
              <AuditTrailView />
            </div>
          )}
        </div>
      )}

      {/* SUITE 4: INFRASTRUCTURE SUITE */}
      {activeSuite === 'infrastructure' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0B192C]">Infrastructure & Edge Nodes Suite</h2>
              <p className="text-xs text-slate-500">
                Kill-switch, D1 automated backups, schema migrations, and institutional identity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Bento Hub</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-sm">
            <button
              type="button"
              onClick={() => setInfraSubTab('maintenance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                infraSubTab === 'maintenance'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Maintenance Mode & Kill-Switch
            </button>
            <button
              type="button"
              onClick={() => setInfraSubTab('backups')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                infraSubTab === 'backups'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              D1 Database Backups
            </button>
            <button
              type="button"
              onClick={() => setInfraSubTab('migrations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                infraSubTab === 'migrations'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Drizzle Migrations Log
            </button>
            <button
              type="button"
              onClick={() => setInfraSubTab('identity')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                infraSubTab === 'identity'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Institutional Identity & Metadata
            </button>
          </div>

          {infraSubTab === 'maintenance' && (
            <div className="space-y-6">
              <MaintenanceModeToggle />
              <PortalToggle />
            </div>
          )}
          {infraSubTab === 'backups' && <BackupTrigger />}
          {infraSubTab === 'migrations' && <MigrationLog />}
          {infraSubTab === 'identity' && <InstitutionalSettings />}
        </div>
      )}

      {/* SUITE 5: ADMISSIONS SUITE */}
      {activeSuite === 'admissions' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0B192C]">Admissions Lifecycle Suite</h2>
              <p className="text-xs text-slate-500">
                Bulk candidate onboarding, credential generation, and session resets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Bento Hub</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-sm">
            <button
              type="button"
              onClick={() => setAdmissionsSubTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                admissionsSubTab === 'upload'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Bulk Admissions & Screening
            </button>
            <button
              type="button"
              onClick={() => setAdmissionsSubTab('progression')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                admissionsSubTab === 'progression'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Session Progression & Reset
            </button>
          </div>

          {admissionsSubTab === 'upload' ? <AdmissionManager /> : <SessionControls />}
        </div>
      )}

      {/* SUITE 6: SYSTEM PIPELINE */}
      {activeSuite === 'pipeline' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0B192C]">Autonomous Concurrency Engine</h2>
              <p className="text-xs text-slate-500">
                End-to-end edge pipeline telemetry and executive clearance overrides.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Bento Hub</span>
            </button>
          </div>

          <SystemPipelineView />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SEARCH-FIRST COMMAND PALETTE MODAL (CMD + K)                           */}
      {/* ========================================================================= */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden">
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Type a command or jump to suite (e.g. fees, users, audit, backup)..."
                className="w-full text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtered Action List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => navigateToCommand(cmd.suite, cmd.subTab)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-[#0B192C] group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate group-hover:text-blue-700">
                            {cmd.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {cmd.category}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No matching suites or commands found for "{commandSearch}"
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Use <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded">↓</kbd> to navigate</span>
              <span><kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded">ESC</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
