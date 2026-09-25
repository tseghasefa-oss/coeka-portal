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
} from 'lucide-react';
import { useAppStore, AdminTab } from '../../stores/useAppStore';
import { AdminCoursesTab } from './AdminCoursesTab';
import { AdminFeesTab } from './AdminFeesTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdmissionManager } from './AdmissionManager';
import { SessionControls } from './SessionControls';

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

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [admissionsSubTab, setAdmissionsSubTab] = useState<'upload' | 'lifecycle'>('upload');
  const isNavy = uiPreferences.theme === 'navy';

  const navItems: { id: AdminTab; label: string; subLabel: string; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'courses',
      label: 'Academic Management',
      subLabel: 'Courses, Departments, Faculty',
      icon: BookOpen,
    },
    {
      id: 'fees',
      label: 'Financial Price Setting',
      subLabel: 'Tuition, Acceptance, Levies',
      icon: DollarSign,
    },
    {
      id: 'users',
      label: 'User & Staff Directory',
      subLabel: 'Staff, Students, RBAC Access',
      icon: Users,
    },
    {
      id: 'admissions',
      label: 'Admissions & Lifecycle',
      subLabel: 'Bulk CSV, Promotion, Billing',
      icon: UserCheck,
    },
    {
      id: 'settings',
      label: 'System Settings',
      subLabel: 'Portal Toggles, Calendar, Configs',
      icon: Sliders,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      {/* 1. MASTER ADMIN TOP HEADER */}
      <header
        className={`sticky top-0 z-40 border-b shadow-md transition-colors ${
          isNavy
            ? 'bg-slate-950 border-slate-800 text-white'
            : 'bg-emerald-950 border-emerald-900 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-inner border ${
                    isNavy
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-amber-400 text-emerald-950 border-amber-300'
                  }`}
                >
                  <GraduationCap className="w-6 h-6" />
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
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 lg:w-64 p-4 lg:p-0 flex flex-col justify-between shrink-0 transition-transform lg:translate-x-0 duration-300 ease-in-out ${
            mobileSidebarOpen ? 'translate-x-0 bg-slate-900 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="space-y-4">
            {/* Mobile Sidebar Close Header */}
            <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Admin Navigation
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Navigation Links */}
            <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-sm space-y-1">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Master Administration
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAdminTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-left transition-all ${
                      isActive
                        ? isNavy
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                          : 'bg-emerald-800 text-amber-300 font-bold shadow-md shadow-emerald-800/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? (isNavy ? 'text-white' : 'text-amber-300') : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{item.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? (isNavy ? 'text-blue-100' : 'text-emerald-200') : 'text-slate-400 font-normal'
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

            {/* Institutional Division Context Switcher */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Active Division Scope</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                {(['NCE', 'DEGREE', 'SECONDARY', 'PRIMARY'] as const).map((div) => (
                  <button
                    key={div}
                    onClick={() => setActiveDivision(div)}
                    className={`py-1.5 px-2 rounded-xl text-center text-[11px] transition-all ${
                      activeDivision === div
                        ? isNavy
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-emerald-800 text-amber-300 shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {div}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 bg-white/70 rounded-2xl border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>COEKA Digital Campus v2.4</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Cloudflare D1 • Drizzle ORM • Strict Kobo
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-6">
          <div
            className={`bento-card p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-md ${
              isNavy
                ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-slate-800'
                : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border-emerald-800'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isNavy
                    ? 'bg-blue-900/80 text-blue-300 border-blue-700'
                    : 'bg-emerald-800/80 text-amber-300 border-emerald-700'
                }`}
              >
                Institutional Executive Management
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Welcome, {userSession?.fullName || 'Administrator'}, {userSession?.role || 'SUPER_ADMIN'}
              </h2>
              <p className="text-xs text-slate-300">
                Master Administration Area • Full Read/Write Governance Access
              </p>
            </div>
            <div className="text-left sm:text-right text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">Active Scope</span>
              <span className="font-mono text-amber-300 font-bold">
                {activeDivision} Division
              </span>
            </div>
          </div>

          {adminTab === 'courses' && <AdminCoursesTab />}
          {adminTab === 'fees' && <AdminFeesTab />}
          {adminTab === 'users' && <AdminUsersTab />}
          {adminTab === 'admissions' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setAdmissionsSubTab('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    admissionsSubTab === 'upload'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-transparent text-slate-700 hover:bg-slate-300/60'
                  }`}
                >
                  Bulk Admissions & Onboarding
                </button>
                <button
                  type="button"
                  onClick={() => setAdmissionsSubTab('lifecycle')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    admissionsSubTab === 'lifecycle'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-transparent text-slate-700 hover:bg-slate-300/60'
                  }`}
                >
                  Session Progression & Financial Reset
                </button>
              </div>

              {admissionsSubTab === 'upload' ? <AdmissionManager /> : <SessionControls />}
            </div>
          )}
          {adminTab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
};
