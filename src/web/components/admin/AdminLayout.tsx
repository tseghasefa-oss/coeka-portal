import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CreditCard,
  DollarSign,
  Users,
  ShieldCheck,
  Sliders,
  Settings,
  Menu,
  X,
  ArrowLeft,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  ExternalLink,
  UserCheck,
  Database,
  ShieldAlert,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore, AdminTab } from '../../stores/useAppStore';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { AdminCoursesTab } from './AdminCoursesTab';
import { AdminFeesTab } from './AdminFeesTab';
import { UserRoleManager } from './UserRoleManager';
import { AdmissionManager } from './AdmissionManager';
import { SessionControls } from './SessionControls';
import { InstitutionalSettings } from './InstitutionalSettings';
import { CalendarControl } from './CalendarControl';
import { PortalToggle } from './PortalToggle';
import { AuditTrailView } from './AuditTrailView';
import { SystemStatusPanel } from './SystemStatusPanel';
import { BackupTrigger } from './BackupTrigger';
import { MigrationLog } from './MigrationLog';

export const AdminLayout: React.FC = () => {
  const {
    adminTab,
    setAdminTab,
    setActiveTab,
    userSession,
    uiPreferences,
    setUiPreferences,
    activeDivision,
    setActiveDivision,
  } = useAppStore();
  const { logout } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [admissionsSubTab, setAdmissionsSubTab] = useState<'upload' | 'lifecycle'>('upload');
  const [settingsSubTab, setSettingsSubTab] = useState<'toggles' | 'institutional' | 'calendar'>('toggles');
  const [databaseSubTab, setDatabaseSubTab] = useState<'snapshots' | 'migrations'>('snapshots');
  const isNavy = uiPreferences.theme === 'navy';
  const isSuperAdmin = userSession?.role === 'SUPER_ADMIN';

  React.useEffect(() => {
    if (isSuperAdmin && adminTab === 'courses') {
      setAdminTab('godmode');
    }
  }, [isSuperAdmin]);

  const navItems: { id: AdminTab; label: string; subLabel: string; icon: React.FC<{ className?: string }> }[] = [
    ...(isSuperAdmin
      ? [
          {
            id: 'godmode' as AdminTab,
            label: 'Command Center',
            subLabel: 'Executive Institutional Hub',
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      id: 'users',
      label: 'Governance Suite',
      subLabel: 'User Accounts, Roles, RBAC',
      icon: Users,
    },
    {
      id: 'fees',
      label: 'Institutional Suite (Fees)',
      subLabel: 'Tuition, Acceptance, Levies',
      icon: DollarSign,
    },
    {
      id: 'courses',
      label: 'Academic Curriculum',
      subLabel: 'Courses, Departments, Faculty',
      icon: BookOpen,
    },
    {
      id: 'admissions',
      label: 'Admissions Lifecycle',
      subLabel: 'Bulk CSV, Promotion, Billing',
      icon: UserCheck,
    },
    {
      id: 'settings',
      label: 'Infrastructure Suite',
      subLabel: 'Kill-Switch, Brand, Calendar',
      icon: Sliders,
    },
    {
      id: 'audit',
      label: 'Forensic Audit Vault',
      subLabel: 'HMAC Logs, Telemetry, Latency',
      icon: Activity,
    },
    {
      id: 'database',
      label: 'Database & Snapshots',
      subLabel: 'D1 Backups, Schema Migrations',
      icon: Database,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* 1. MASTER ADMIN TOP HEADER */}
      <header
        className={`sticky top-0 z-40 border-b shadow-sm transition-colors ${
          isNavy
            ? 'bg-[#0B192C] border-slate-800 text-white'
            : 'bg-emerald-950 border-emerald-900 text-white'
        }`}
      >
        <div className="max-w-7xl xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3">
            {/* Left: Mobile Menu Button & Brand */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle mobile admin navigation"
              >
                {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div
                className="flex items-center space-x-2.5 cursor-pointer"
                onClick={() => setActiveTab('website')}
                title="Return to Main Portal"
              >
                <div className="w-10 h-11 flex items-center justify-center shrink-0">
                  <img src="/coeka-logo.png" alt="COEKA Crest" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-white">COEKA</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isNavy
                          ? 'bg-blue-900/80 text-blue-300 border-blue-700'
                          : 'bg-emerald-800/80 text-amber-300 border-emerald-700'
                      }`}
                    >
                      Master Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 hidden sm:block">
                    Enterprise Campus Infrastructure • Benue State
                  </p>
                </div>
              </div>
            </div>

            {/* Middle: System Status Indicator */}
            <div className="hidden md:flex items-center space-x-3 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-slate-200">D1 Edge Engine: Operational</span>
              </div>
              <span className="text-white/30">•</span>
              <span className="text-slate-300 font-mono text-[11px]">2026/2027 Session Active</span>
            </div>

            {/* Right: Theme Toggle & Admin User Profile */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={() => setUiPreferences({ theme: isNavy ? 'emerald' : 'navy' })}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
                title={`Switch to ${isNavy ? 'Emerald' : 'Navy'} Theme`}
              >
                {isNavy ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
              </button>

              {/* Exit to Homepage Button */}
              <button
                type="button"
                onClick={() => setActiveTab('website')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                title="Return to Public Campus Website"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </button>

              {/* Super Admin User Profile Pill */}
              <div className="flex items-center space-x-2.5 pl-2 border-l border-white/10">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">
                    {userSession?.fullName || 'Engr. Prof. S. L. Tsegha'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">
                    {userSession?.role || 'SUPER_ADMIN'}
                  </span>
                </div>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm ${
                    isNavy
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-emerald-700 text-amber-300 border-emerald-600'
                  }`}
                >
                  SA
                </div>
              </div>

              {/* Dedicated Admin Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ml-1"
                title="Sign Out of Master Admin"
                aria-label="Sign Out of Master Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: HORIZONTAL TOP MENU + FULL-WIDTH WORKSPACE */}
      <div className="flex-1 max-w-7xl xl:max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 p-5 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-black text-[#0B192C] dark:text-white uppercase tracking-wider">
                      Master Administration
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scope Switcher */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Scope
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-xs font-bold">
                    {(['NCE', 'DEGREE', 'SECONDARY', 'PRIMARY'] as const).map((div) => (
                      <button
                        key={div}
                        type="button"
                        onClick={() => {
                          setActiveDivision(div);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-bold transition-all ${
                          activeDivision === div
                            ? 'bg-[#0B192C] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {div}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nav Items */}
                <div className="space-y-1 pt-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = adminTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAdminTab(item.id);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-left transition-all ${
                          isActive
                            ? 'bg-[#0B192C] text-white font-bold shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate">{item.label}</div>
                          <div
                            className={`text-[10px] truncate ${
                              isActive ? 'text-slate-300' : 'text-slate-400 font-normal'
                            }`}
                          >
                            {item.subLabel}
                          </div>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 shrink-0 opacity-80" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                COEKA Digital Campus v2.4 • Edge D1
              </div>
            </div>
          </div>
        )}

        {/* HORIZONTAL MASTER ADMINISTRATION TOP MENU */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          {/* Menu Title Badge & Horizontal Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none min-w-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
              <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Master Admin</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAdminTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0B192C] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                    title={item.subLabel}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Division Scope Switcher (Inline Horizontal) */}
          <div className="flex items-center gap-2 shrink-0 self-end xl:self-auto border-t xl:border-t-0 pt-2 xl:pt-0 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:flex">
              <Layers className="w-3.5 h-3.5" />
              <span>Scope:</span>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {(['NCE', 'DEGREE', 'SECONDARY', 'PRIMARY'] as const).map((div) => (
                <button
                  key={div}
                  type="button"
                  onClick={() => setActiveDivision(div)}
                  className={`py-1 px-2.5 rounded-lg text-center text-[10px] font-extrabold transition-all cursor-pointer ${
                    activeDivision === div
                      ? 'bg-[#0B192C] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {div}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN FULL-WIDTH WORKSPACE */}
        <main className="w-full min-w-0 space-y-6">
          {/* Breadcrumb Bar when viewing specific management suites */}
          {adminTab !== 'godmode' && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAdminTab('godmode')}
                  className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Command Center</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-extrabold text-[#0B192C] uppercase tracking-wider">
                  {navItems.find((n) => n.id === adminTab)?.label || 'Suite Management'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Active Scope:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {activeDivision} Division
                </span>
              </div>
            </div>
          )}

          {adminTab === 'godmode' && <SuperAdminDashboard />}
          {adminTab === 'courses' && <AdminCoursesTab />}
          {adminTab === 'fees' && <AdminFeesTab />}
          {adminTab === 'users' && <UserRoleManager />}
          {adminTab === 'admissions' && (
            <div className="space-y-6">
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
                  Bulk Admissions & Onboarding
                </button>
                <button
                  type="button"
                  onClick={() => setAdmissionsSubTab('lifecycle')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    admissionsSubTab === 'lifecycle'
                      ? 'bg-[#0B192C] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Session Progression & Financial Reset
                </button>
              </div>

              {admissionsSubTab === 'upload' ? <AdmissionManager /> : <SessionControls />}
            </div>
          )}
          {adminTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-sm">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('toggles')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === 'toggles'
                      ? 'bg-[#0B192C] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Portal Toggles & Kill-Switch
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('institutional')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === 'institutional'
                      ? 'bg-[#0B192C] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Institutional Branding & Identity
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('calendar')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === 'calendar'
                      ? 'bg-[#0B192C] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Academic Calendar Controller
                </button>
              </div>

              {settingsSubTab === 'toggles' && <PortalToggle />}
              {settingsSubTab === 'institutional' && <InstitutionalSettings />}
              {settingsSubTab === 'calendar' && <CalendarControl />}
            </div>
          )}
          {adminTab === 'audit' && (
            <div className="space-y-6">
              <SystemStatusPanel />
              <AuditTrailView />
            </div>
          )}
          {adminTab === 'database' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit shadow-sm">
                <button
                  type="button"
                  onClick={() => setDatabaseSubTab('snapshots')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    databaseSubTab === 'snapshots'
                      ? 'bg-[#0B192C] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  D1 Automated Snapshots & Backups
                </button>
                <button
                  type="button"
                  onClick={() => setDatabaseSubTab('migrations')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    databaseSubTab === 'migrations'
                      ? 'bg-[#0B192C] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Drizzle Schema Migration Manifest
                </button>
              </div>

              {databaseSubTab === 'snapshots' && <BackupTrigger />}
              {databaseSubTab === 'migrations' && <MigrationLog />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
