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
  Megaphone,
  Radio,
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
import { BulletinManager } from './BulletinManager';

export type ManagementSuite =
  | 'hub'
  | 'governance'
  | 'institutional'
  | 'forensics'
  | 'infrastructure'
  | 'admissions'
  | 'pipeline'
  | 'bulletins';

// Lightweight, pure React SVG Sparkline component for KPI trendlines
const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#2563EB' }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 20;
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
    { label: 'Campus Bulletin & Broadcast Manager', category: 'Communications', suite: 'bulletins' as const, subTab: null, icon: Megaphone },
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
    <div className="space-y-6 w-full pb-12 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold bg-[#0B192C] text-white border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB BAR (WHEN INSIDE SPECIALIZED SUITES)                    */}
      {/* ========================================================================= */}
      {activeSuite !== 'hub' && (
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="flex items-center gap-1.5 transition-colors cursor-pointer hover:text-blue-700"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Command Center</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-extrabold text-[#0B192C] uppercase tracking-wider">
              {activeSuite === 'governance' && 'Governance Suite'}
              {activeSuite === 'institutional' && 'Institutional Suite'}
              {activeSuite === 'forensics' && 'Forensic Suite'}
              {activeSuite === 'infrastructure' && 'Infrastructure Suite'}
              {activeSuite === 'admissions' && 'Admissions Suite'}
              {activeSuite === 'pipeline' && 'System Pipeline'}
              {activeSuite === 'bulletins' && 'Bulletin & Broadcast Manager'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveSuite('hub')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bento Hub</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BENTO GRID SYSTEM: COMMAND CENTER LANDING VIEW                         */}
      {/* ========================================================================= */}
      {activeSuite === 'hub' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Institutional Master Console Header Bar */}
          <div className="bg-[#0B192C] text-white rounded-2xl sm:rounded-3xl p-5 border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/20">
                  Institutional Master Console
                </span>
                <span className="text-xs text-slate-300 font-medium">College of Education, Katsina-Ala</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Executive Command Center
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                Integrated Bento Grid architecture for sovereign edge governance, fee matrix, cryptographic audit vault, and SIMS pipelines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono font-bold text-slate-200">Cloudflare D1: Operational</span>
              </div>
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 border border-white/20 hover:bg-white/20 transition-all cursor-pointer shadow-xs"
              >
                <Search className="w-3.5 h-3.5 text-slate-300" />
                <span>Jump to Suite</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded text-slate-300">Ctrl+K</kbd>
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* THE BENTO BOXES (ALONE ON EACH LINE FOR EXPANSIVE BREATHING ROOM) */}
          {/* ================================================================= */}
          <div className="space-y-6">

            {/* --------------------------------------------------------------- */}
            {/* BOX 1: INSTITUTIONAL PULSE & VITAL METRICS                      */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white tracking-tight">
                      Institutional Pulse & Core Metrics
                    </h2>
                    <p className="text-xs text-slate-500">Live 2026/2027 academic session velocity, headcounts & revenue</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Edge Sync
                  </span>
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B192C] hover:bg-slate-900 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Master Fee Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4 KPIs Ribbon (Spacious 4-Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                {/* KPI 1: Revenue Inflow */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Revenue Inflow</span>
                    <Sparkline data={[42, 58, 65, 80, 95, 120, 142, 184]} color="#2563EB" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">₦184.5M</div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+12.4% vs last term velocity</span>
                    </div>
                  </div>
                </div>

                {/* KPI 2: Enrolled Students */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Students</span>
                    <Sparkline data={[12200, 12800, 13400, 13900, 14200, 14820]} color="#2563EB" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">14,820</div>
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>+4.8% cohort intake</span>
                    </div>
                  </div>
                </div>

                {/* KPI 3: Academic & Non-Academic Staff */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Staff Headcount</span>
                    <Sparkline data={[440, 450, 460, 470, 478, 482]} color="#0B192C" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">482</div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>98.4% verified biometric active</span>
                    </div>
                  </div>
                </div>

                {/* KPI 4: Edge System Health */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Edge Uptime & Health</span>
                    <Sparkline data={[99.9, 100, 99.8, 100, 100, 99.98]} color="#10B981" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-[#0B192C] dark:text-white tracking-tight">99.98%</div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>12ms D1 latency (Zero degradation)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* BOX 2: MANAGEMENT SUITES LAUNCHPAD                              */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white tracking-tight">
                      Institutional Management Suites
                    </h2>
                    <p className="text-xs text-slate-500">Quick-access operational consoles and departmental governance tools</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Command Palette</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded text-slate-500 border border-slate-200 dark:border-slate-800">Ctrl+K</kbd>
                </button>
              </div>

              {/* 7 Minimalist Suite Cards Across Full Width */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5 mt-5">
                <button
                  type="button"
                  onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-[#0B192C] text-slate-800 dark:text-slate-200 hover:text-white border border-slate-200/70 dark:border-slate-700/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 group-hover:bg-white/10 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
                    <DollarSign className="w-5 h-5 text-blue-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs font-black leading-tight">Master Fee Matrix</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 mt-1">Tariffs & Schedules</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveSuite('governance'); setGovernanceSubTab('users'); }}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-[#0B192C] text-slate-800 dark:text-slate-200 hover:text-white border border-slate-200/70 dark:border-slate-700/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 group-hover:bg-white/10 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
                    <Users className="w-5 h-5 text-blue-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs font-black leading-tight">User Governance</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 mt-1">RBAC & Directory</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveSuite('forensics'); setForensicSubTab('vault'); }}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-[#0B192C] text-slate-800 dark:text-slate-200 hover:text-white border border-slate-200/70 dark:border-slate-700/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 group-hover:bg-white/10 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
                    <Terminal className="w-5 h-5 text-blue-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs font-black leading-tight">Forensic Vault</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 mt-1">HMAC Audit Trails</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('courses'); }}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-[#0B192C] text-slate-800 dark:text-slate-200 hover:text-white border border-slate-200/70 dark:border-slate-700/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 group-hover:bg-white/10 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
                    <BookOpen className="w-5 h-5 text-blue-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs font-black leading-tight">Curriculum & Courses</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 mt-1">Academic Programs</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveSuite('admissions'); setAdmissionsSubTab('upload'); }}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-[#0B192C] text-slate-800 dark:text-slate-200 hover:text-white border border-slate-200/70 dark:border-slate-700/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 group-hover:bg-white/10 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
                    <UserCheck className="w-5 h-5 text-blue-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs font-black leading-tight">Candidate Screening</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 mt-1">Admissions Batch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSuite('pipeline')}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-[#0B192C] text-slate-800 dark:text-slate-200 hover:text-white border border-slate-200/70 dark:border-slate-700/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 group-hover:bg-white/10 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
                    <TrendingUp className="w-5 h-5 text-blue-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs font-black leading-tight">Pipeline Engine</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 mt-1">Hostels & SIMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSuite('bulletins')}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-[#0B192C] text-slate-800 dark:text-slate-200 hover:text-white border border-slate-200/70 dark:border-slate-700/60 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 group-hover:bg-white/10 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
                    <Megaphone className="w-5 h-5 text-amber-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs font-black leading-tight">Campus Bulletins</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 mt-1">Multi-Channel Tickers</span>
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* BOX 3: STUDENT LIFECYCLE PROGRESSION PIPELINE                   */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white tracking-tight">
                      Student Lifecycle Journey
                    </h2>
                    <p className="text-xs text-slate-500">End-to-end cohort progression across institutional milestones</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                    88.0% Conversion
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSuite('pipeline')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B192C] hover:bg-slate-900 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Autonomous Concurrency Engine</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stepper Progress Bar */}
              <div className="mt-5 space-y-4">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: '88%' }}
                  />
                </div>

                {/* 4 Pipeline Stages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>1. Admitted Cohort</span>
                      <span className="text-[#0B192C] dark:text-white font-black">100%</span>
                    </div>
                    <div className="text-2xl font-black text-[#0B192C] dark:text-white mt-1.5">4,820</div>
                    <span className="text-xs text-slate-400">Screened & Verified</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>2. Paid Tuition & Fees</span>
                      <span className="text-blue-600 font-black">88.0%</span>
                    </div>
                    <div className="text-2xl font-black text-[#0B192C] dark:text-white mt-1.5">4,241</div>
                    <span className="text-xs text-slate-400">Bursary Cleared</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>3. Enrolled Courses</span>
                      <span className="text-blue-600 font-black">82.0%</span>
                    </div>
                    <div className="text-2xl font-black text-[#0B192C] dark:text-white mt-1.5">3,952</div>
                    <span className="text-xs text-slate-400">Active SIMS Registration</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>4. Certified & Graduated</span>
                      <span className="text-emerald-600 font-black">94.0%</span>
                    </div>
                    <div className="text-2xl font-black text-[#0B192C] dark:text-white mt-1.5">4,530</div>
                    <span className="text-xs text-slate-400">Senate Cleared Alum</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Zero bottleneck alerts detected in current cycle. All batch validation jobs operational.
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">Academic Year 2026/2027</span>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* BOX 4: INFRASTRUCTURE SENTINEL & SOVEREIGN CONTROLS             */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white tracking-tight">
                      Infrastructure Sentinel & Sovereign Edge Controls
                    </h2>
                    <p className="text-xs text-slate-500">Global Cloudflare edge protection, active security gates, and maintenance switches</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 font-bold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Edge (LOS / LHR)
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('infrastructure'); setInfraSubTab('maintenance'); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-black text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Emergency Console</span>
                  </button>
                </div>
              </div>

              {/* 3 Spacious Columns Across Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {/* Toggle 1: Maintenance Mode */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Maintenance Mode</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {maintenanceModeActive ? 'Campus hold active' : 'Normal live traffic allowed'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMaintenanceModeActive(!maintenanceModeActive);
                      triggerToast(`Maintenance Mode toggled ${!maintenanceModeActive ? 'ON' : 'OFF'}.`);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      maintenanceModeActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        maintenanceModeActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: API Gateway */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">API Edge Gateway</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {apiGatewayActive ? 'Strict WAF & Rate Limiting' : 'Gateway Rules Bypassed'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setApiGatewayActive(!apiGatewayActive);
                      triggerToast(`API Edge Gateway ${!apiGatewayActive ? 'Enabled' : 'Bypassed'}.`);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      apiGatewayActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        apiGatewayActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Edge Telemetry Strip */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-around text-xs text-slate-600 dark:text-slate-400">
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latency</div>
                    <div className="font-mono font-black text-emerald-600 text-sm mt-0.5">12ms</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Edge Cache</div>
                    <div className="font-mono font-black text-blue-600 text-sm mt-0.5">98% Hit</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Pops</div>
                    <div className="font-mono font-black text-slate-800 dark:text-slate-200 text-sm mt-0.5">LOS / LHR</div>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* BOX 5: FORENSIC CRYPTOGRAPHIC AUDIT LEDGER                      */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white tracking-tight">
                      Forensic Cryptographic Audit Ledger
                    </h2>
                    <p className="text-xs text-slate-500">Immutable SHA-256 HMAC-signed audit trails of high-privilege operations</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    0 Tampered Logs
                  </span>
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('forensics'); setForensicSubTab('vault'); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B192C] hover:bg-slate-900 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Full Forensic Vault</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 5 Verified Audit Rows */}
              <div className="mt-5 space-y-2">
                {recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 px-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate text-xs sm:text-sm">
                          {log.desc}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          Actor: <strong className="text-slate-600 dark:text-slate-300">{log.actor}</strong> • {log.time}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60 shrink-0">
                      HMAC VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* BOX 6: D1 DATABASE & SYSTEM TELEMETRY                           */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white tracking-tight">
                      Cloudflare D1 Database & Telemetry
                    </h2>
                    <p className="text-xs text-slate-500">Serverless SQLite persistence, live automated snapshots, and migration status</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
                    v2.4.0 Edge
                  </span>
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('infrastructure'); setInfraSubTab('migrations'); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Drizzle Migration Manifest</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2 Wide Columns Across Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {/* Backup Info */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Automated Backup Status</div>
                    <div className="text-sm font-black text-[#0B192C] dark:text-white mt-1">Last Snapshot: {lastBackupTime}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-0.5">AES-256 D1 Snapshot verified & encrypted</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunBackup}
                    disabled={isBackingUp}
                    className="px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-slate-900 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                    <span>{isBackingUp ? 'Backing up...' : 'Run Backup Now'}</span>
                  </button>
                </div>

                {/* Debt Alert Strip */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bursary Debt & Arrears Alert</div>
                    <div className="text-sm font-black text-[#0B192C] dark:text-blue-300 mt-1">₦18.4M Outstanding Arrears</div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">12.0% pending term balance across departments</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-blue-700 hover:text-blue-900 font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                  >
                    <span>Inspect Ledgers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* BOX 7: INSTITUTIONAL BULLETIN & BROADCAST DISPATCH             */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0B192C] dark:text-white tracking-tight">
                      Institutional Bulletin & Broadcast Manager
                    </h2>
                    <p className="text-xs text-slate-500">Live multi-channel announcement engine targeting website tickers, notice boards, and student SIMS</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                    <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    Multi-Channel Edge Broadcast
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSuite('bulletins')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B192C] hover:bg-slate-900 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Manage Bulletins & Tickers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Ticker Live Preview & Channel Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {/* Live Ticker Channel */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Website Top Bar Ticker</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Synchronized
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                    Admissions Open for NCE & Affiliated Degree Programmes • Hostel Self-Service Active
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Rotation: 5s interval</span>
                    <button
                      type="button"
                      onClick={() => setActiveSuite('bulletins')}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Configure Ticker →
                    </button>
                  </div>
                </div>

                {/* Target Audience Reach */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Distribution Channels</span>
                    <span className="text-xs font-bold text-blue-600">5 Touchpoints</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Website Ticker</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Notice Board</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">Student SIMS</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Staff Portal</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">Admissions</span>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400">Targeted by role & admission status</div>
                </div>

                {/* Fast Action CTA */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">Fast Broadcast Dispatch</span>
                    <div className="text-xs font-medium text-amber-800 dark:text-amber-200 mt-1">
                      Instantly publish emergency alerts, semester date modifications, or fee guidelines.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSuite('bulletins')}
                    className="mt-3 w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-black text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    + Compose New Official Notice
                  </button>
                </div>
              </div>
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
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-xs">
            <button
              type="button"
              onClick={() => setInstitutionalSubTab('fees')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                institutionalSubTab === 'fees'
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-xs">
            <button
              type="button"
              onClick={() => setForensicSubTab('vault')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                forensicSubTab === 'vault'
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-xs">
            <button
              type="button"
              onClick={() => setInfraSubTab('maintenance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                infraSubTab === 'maintenance'
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-xs">
            <button
              type="button"
              onClick={() => setAdmissionsSubTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                admissionsSubTab === 'upload'
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
                  ? 'bg-[#0B192C] text-white shadow-xs'
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
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      {/* SUITE 7: INSTITUTIONAL BULLETIN & BROADCAST MANAGER */}
      {activeSuite === 'bulletins' && (
        <div className="space-y-6 animate-fade-in">
          <BulletinManager />
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
