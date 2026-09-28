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

export const SuperAdminDashboard: React.FC = () => {
  const { userSession, uiPreferences, setAdminTab } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // Suite Navigation State (Hub-and-Spoke)
  const [activeSuite, setActiveSuite] = useState<ManagementSuite>('hub');
  
  // Sub-tab states for suites
  const [governanceSubTab, setGovernanceSubTab] = useState<'users'>('users');
  const [institutionalSubTab, setInstitutionalSubTab] = useState<'fees' | 'courses' | 'calendar'>('fees');
  const [forensicSubTab, setForensicSubTab] = useState<'vault' | 'logs'>('vault');
  const [infraSubTab, setInfraSubTab] = useState<'maintenance' | 'backups' | 'migrations' | 'identity'>('maintenance');
  const [admissionsSubTab, setAdmissionsSubTab] = useState<'upload' | 'progression'>('upload');

  // Command Palette State (Cmd+K)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      
      {/* ========================================================================= */}
      {/* 1. BREADCRUMB NAVIGATION & COMMAND PALETTE TRIGGER                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveSuite('hub')}
            className={`flex items-center gap-1.5 transition-colors ${
              activeSuite === 'hub' ? 'text-[#0B192C] font-bold' : 'hover:text-blue-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Command Center</span>
          </button>

          {activeSuite !== 'hub' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[#0B192C] font-bold uppercase tracking-wider">
                {activeSuite === 'governance' && 'Governance Suite'}
                {activeSuite === 'institutional' && 'Institutional Suite'}
                {activeSuite === 'forensics' && 'Forensic Suite'}
                {activeSuite === 'infrastructure' && 'Infrastructure Suite'}
                {activeSuite === 'admissions' && 'Admissions Suite'}
                {activeSuite === 'pipeline' && 'System Pipeline Suite'}
              </span>
            </>
          )}
        </div>

        {/* Right Utility: Quick Return & Search-First Command Palette Trigger */}
        <div className="flex items-center gap-3">
          {activeSuite !== 'hub' && (
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0B192C] bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Hub</span>
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
      {/* 2. COMMAND CENTER LANDING VIEW (THE MODULAR HUB)                          */}
      {/* ========================================================================= */}
      {activeSuite === 'hub' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Executive Header Banner (Anchored in Navy Blue, Clean & Authoritative) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0B192C] text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Institutional Master Console
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  College of Education, Katsina-Ala
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Executive Command Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Centralized supervisory hub for governance, financial oversight, cryptographic forensics,
                and edge infrastructure. Navigate specialized suites with zero clutter.
              </p>
            </div>

            {/* Governor Profile Pill & Operational Heartbeat */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0 relative z-10">
              <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700/80">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Cloudflare D1: Operational
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Signed in as: <strong className="text-white">{userSession?.fullName || 'SuperAdmin'}</strong>
              </span>
            </div>
          </div>

          {/* CLUSTER 1: INSTITUTIONAL PULSE (4 Clean KPI Cards, Big Numbers, Sparklines) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B192C]">
                Institutional Pulse & Vital Metrics
              </h2>
              <span className="text-xs text-slate-500">Live 2026/2027 Session Sync</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Students */}
              <div
                onClick={() => setActiveSuite('admissions')}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enrolled Students</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#0B192C] tracking-tight">4,820</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12.4% vs last session</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">NCE: 2,940 • Degree: 1,420 • Basic: 460</div>
              </div>

              {/* Card 2: Revenue */}
              <div
                onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revenue Inflow</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#0B192C] tracking-tight">₦184.5M</div>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>88.0% Collection Rate</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Tuition: ₦142M • Acceptance: ₦24M</div>
              </div>

              {/* Card 3: Staff */}
              <div
                onClick={() => setActiveSuite('governance')}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic & Staff</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#0B192C] tracking-tight">342</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% RBAC Verified</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">18 Deans/HODs • 214 Lecturers • 110 Staff</div>
              </div>

              {/* Card 4: Health */}
              <div
                onClick={() => setActiveSuite('infrastructure')}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Edge Uptime</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#0B192C] tracking-tight">99.98%</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>D1 Latency: 12ms</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">TLS 1.3 Strict • Cloudflare Shield Active</div>
              </div>
            </div>
          </div>

          {/* CLUSTER 2: THE LIFECYCLE PIPELINE (Horizontal Visual Flow) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0B192C] tracking-tight">
                  Academic Lifecycle Pipeline
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time progression tracking across admission, tuition settlement, SIMS enrollment, and senate clearance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSuite('pipeline')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Inspect Concurrency Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {/* Stage 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500">1. Admitted</span>
                    <span className="font-black text-[#0B192C]">100%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="text-lg font-black text-[#0B192C] mt-3">4,820 <span className="text-xs font-normal text-slate-500">Candidates</span></div>
              </div>

              {/* Stage 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500">2. Paid Fees</span>
                    <span className="font-black text-[#0B192C]">88.0%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>
                <div className="text-lg font-black text-[#0B192C] mt-3">4,241 <span className="text-xs font-normal text-slate-500">Settled</span></div>
              </div>

              {/* Stage 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500">3. Enrolled</span>
                    <span className="font-black text-[#0B192C]">82.0%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '82%' }} />
                  </div>
                </div>
                <div className="text-lg font-black text-[#0B192C] mt-3">3,952 <span className="text-xs font-normal text-slate-500">In Courses</span></div>
              </div>

              {/* Stage 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500">4. Certified</span>
                    <span className="font-black text-[#0B192C]">94.0%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>
                <div className="text-lg font-black text-[#0B192C] mt-3">4,530 <span className="text-xs font-normal text-slate-500">Cleared</span></div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN COMMAND CENTER LAYOUT: URGENT QUEUE + QUICK-ACTION GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* CLUSTER 3: URGENT ATTENTION QUEUE (Left Column - lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <h3 className="text-base font-extrabold text-[#0B192C]">
                      Urgent Attention Queue
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                    3 Action Items
                  </span>
                </div>

                {/* Alert Item 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    !
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">Pending Fee Overrides</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full shrink-0">
                        High Priority
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      3 student fee waiver exceptions awaiting Bursary ledger reconciliation.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 mt-2 inline-flex items-center gap-1"
                    >
                      <span>Resolve in Fee Suite</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Alert Item 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">Edge Shield WAF Telemetry</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
                        Shielded
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      14 malicious SQL injection payloads intercepted & dropped in last 24h.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setActiveSuite('forensics'); setForensicSubTab('vault'); }}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 mt-2 inline-flex items-center gap-1"
                    >
                      <span>Inspect Forensic Vault</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Alert Item 3 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">D1 Automated Snapshot</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Full AES-256 encrypted database snapshot verified at 04:00 UTC.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setActiveSuite('infrastructure'); setInfraSubTab('backups'); }}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 mt-2 inline-flex items-center gap-1"
                    >
                      <span>Review Backup Log</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Critical CTA Button (Strict Yellow Palette Rule) */}
              <button
                type="button"
                onClick={() => { setActiveSuite('infrastructure'); setInfraSubTab('maintenance'); }}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Power className="w-4 h-4" />
                <span>Emergency Maintenance Console</span>
              </button>
            </div>

            {/* CLUSTER 4: QUICK-ACTION GRID (Right Column - lg:col-span-7: 6 Portals) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-[#0B192C]">
                  Specialized Management Suites
                </h3>
                <span className="text-xs text-slate-500">6 Modular Subsystems</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Portal 1: Governance Suite */}
                <div
                  onClick={() => { setActiveSuite('governance'); setGovernanceSubTab('users'); }}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-[#0B192C] group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B192C] group-hover:text-blue-700 transition-colors">
                      Governance Suite
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      User accounts, role assignment, RBAC policy enforcement, and password resets.
                    </p>
                  </div>
                </div>

                {/* Portal 2: Institutional Suite */}
                <div
                  onClick={() => { setActiveSuite('institutional'); setInstitutionalSubTab('fees'); }}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-[#0B192C] group-hover:text-white transition-colors">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B192C] group-hover:text-blue-700 transition-colors">
                      Institutional Suite
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      Master fee matrix, academic courses, curriculum mapping, and session calendar.
                    </p>
                  </div>
                </div>

                {/* Portal 3: Forensic Suite */}
                <div
                  onClick={() => { setActiveSuite('forensics'); setForensicSubTab('vault'); }}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-[#0B192C] group-hover:text-white transition-colors">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B192C] group-hover:text-blue-700 transition-colors">
                      Forensic Suite
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      HMAC-SHA256 tamper verification, cryptographic audit vault, and security logs.
                    </p>
                  </div>
                </div>

                {/* Portal 4: Infrastructure Suite */}
                <div
                  onClick={() => { setActiveSuite('infrastructure'); setInfraSubTab('maintenance'); }}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-[#0B192C] group-hover:text-white transition-colors">
                      <Server className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B192C] group-hover:text-blue-700 transition-colors">
                      Infrastructure Suite
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      Kill-switch, D1 automated backups, Drizzle schema migrations, and branding.
                    </p>
                  </div>
                </div>

                {/* Portal 5: Admissions Lifecycle */}
                <div
                  onClick={() => { setActiveSuite('admissions'); setAdmissionsSubTab('upload'); }}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-[#0B192C] group-hover:text-white transition-colors">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B192C] group-hover:text-blue-700 transition-colors">
                      Admissions Suite
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      Bulk CSV candidate onboarding, automatic credential generation, and session resets.
                    </p>
                  </div>
                </div>

                {/* Portal 6: System Pipeline */}
                <div
                  onClick={() => setActiveSuite('pipeline')}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-[#0B192C] group-hover:text-white transition-colors">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B192C] group-hover:text-blue-700 transition-colors">
                      System Pipeline
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      Real-time concurrency engine, bed reservation locks, and executive overrides.
                    </p>
                  </div>
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0B192C]">Governance & Role Management Suite</h2>
              <p className="text-xs text-slate-500">
                Institutional User Directory, Role Assignment (RBAC), and Password Synchronization.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Command Center</span>
            </button>
          </div>

          <UserRoleManager />
        </div>
      )}

      {/* SUITE 2: INSTITUTIONAL SUITE (FEES, COURSES, CALENDAR) */}
      {activeSuite === 'institutional' && (
        <div className="space-y-6 animate-fade-in">
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0B192C]">Autonomous Concurrency Engine</h2>
              <p className="text-xs text-slate-500">
                End-to-end edge pipeline telemetry and executive clearance overrides.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSuite('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Command Center</span>
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Type a command or jump to suite (e.g. fees, users, audit, backup)..."
                className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-[#0B192C] group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-blue-700">
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

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Use <kbd className="px-1 py-0.5 bg-white border rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-white border rounded">↓</kbd> to navigate</span>
              <span><kbd className="px-1 py-0.5 bg-white border rounded">ESC</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
