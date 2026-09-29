import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CreditCard,
  FileCheck,
  ShieldCheck,
  QrCode,
  Building,
  Award,
  Layers,
  Sparkles,
  Download,
  User,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore, AcademicDivision } from '../../stores/useAppStore';
import { useStudentProfile } from '../../hooks/useStudentData';
import { StudentDivisionResolver } from './StudentDivisionResolver';
import { MyInvoices } from './MyInvoices';
import { DigitalClearance } from './DigitalClearance';
import { HostelPortal } from '../hostels/HostelPortal';
import { DivisionGuard } from '../common/DivisionGuard';

export const StudentDashboard: React.FC = () => {
  const { userSession, activeDivision } = useAppStore();
  const { data: profile } = useStudentProfile();

  const division = (userSession?.division || activeDivision || 'NCE').toUpperCase() as AcademicDivision;
  const isBasic = division === 'SECONDARY' || division === 'PRIMARY';

  // Sub-tab selection state: defaults to academic hub
  const [activeTab, setActiveTab] = useState<'academic' | 'fees' | 'profile' | 'clearance' | 'hostels'>('academic');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans animate-fade-in">
      {/* 1. SHARED STUDENT SHELL HEADER BANNER */}
      <div className={`p-6 sm:p-7 rounded-3xl text-white shadow-xl border flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ${
        division === 'PRIMARY'
          ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 border-amber-500'
          : division === 'SECONDARY'
          ? 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-emerald-800'
          : 'bg-gradient-to-r from-[#0B192C] via-[#132c4d] to-[#0B192C] border-slate-800'
      }`}>
        <div className="space-y-2 max-w-xl z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {division === 'DEGREE' && 'Affiliated Degree Directorate (Unilorin)'}
              {division === 'NCE' && 'NCE Undergraduate Directorate'}
              {division === 'SECONDARY' && 'Demonstration Secondary School'}
              {division === 'PRIMARY' && 'Staff Primary Basic Education'}
            </span>
            <span className="text-xs text-white/80 font-medium">
              {isBasic ? 'Basic Education Academic Terminal' : 'Tertiary SIMS Enterprise Hub'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, {profile?.fullName || userSession?.fullName || 'Student Scholar'}
          </h1>

          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {profile?.programme || (division === 'SECONDARY' ? 'Senior Secondary Science Stream' : division === 'PRIMARY' ? 'Primary Basic Education (Basic 4)' : 'NCE Computer Science / Mathematics')} • {profile?.matricNumber || userSession?.username || 'COEKA/2026/084'}
          </p>

          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Identity Verified • 2026/2027 Active</span>
            </span>
          </div>
        </div>

        {/* Digital Student ID Badge Preview */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4 shrink-0 shadow-inner z-10">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-400 shrink-0 bg-slate-800 flex items-center justify-center">
            <img
              src={profile?.passportPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt="Student Passport"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-0.5 text-xs">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
              Digital Student ID
            </span>
            <strong className="text-white font-mono block text-sm">
              {profile?.matricNumber || userSession?.username || 'COEKA/2026/084'}
            </strong>
            <span className="text-[10px] text-slate-300 block font-medium">
              {division} Division
            </span>
          </div>

          <div className="p-1.5 bg-white rounded-lg shrink-0 ml-2 hidden sm:block">
            <QrCode className="w-8 h-8 text-slate-900" />
          </div>
        </div>
      </div>

      {/* 2. SHARED STUDENT SHELL NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none">
          {/* TAB 1: ACADEMIC CORE (DIVISION SPECIFIC) */}
          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'academic'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Academic Core</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 uppercase">
              {division}
            </span>
          </button>

          {/* TAB 2: COMMON FEE MANAGEMENT */}
          <button
            type="button"
            onClick={() => setActiveTab('fees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'fees'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            <span>Fee Invoices & VPay</span>
          </button>

          {/* TAB 3: COMMON USER PROFILE & DIGITAL ID */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span>Profile & Digital ID</span>
          </button>

          {/* TAB 4: COMMON DIGITAL CLEARANCE */}
          <button
            type="button"
            onClick={() => setActiveTab('clearance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'clearance'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-500" />
            <span>Institutional Clearance</span>
          </button>

          {/* TAB 5: HOSTEL ALLOCATION (TERTIARY / BOARDING) */}
          {!isBasic && (
            <button
              type="button"
              onClick={() => setActiveTab('hostels')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'hostels'
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-teal-500" />
              <span>Hostel Bedspace</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. DYNAMIC CONTENT WORKSPACE */}
      {/* TAB 1: ACADEMIC CORE VIA DIVISION RESOLVER */}
      {activeTab === 'academic' && <StudentDivisionResolver />}

      {/* TAB 2: COMMON FEE INVOICES & VPAY NUBAN */}
      {activeTab === 'fees' && <MyInvoices />}

      {/* TAB 3: COMMON USER PROFILE & DIGITAL ID CARD */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-lg font-black text-[#0B192C] dark:text-white">
                Official Student Identity & Digital Dossier
              </h3>
              <p className="text-xs text-slate-500">
                HMAC SHA-256 tamper-evident credentials and QR-code verified pass
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B192C] text-white hover:bg-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Student ID Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ID Card Front Visual */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0B192C] via-slate-900 to-blue-950 text-white border border-slate-700 shadow-xl flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 flex items-center justify-center">
                    <img src="/coeka-logo.png" alt="COEKA" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block">COEKA Identity Card</span>
                    <span className="text-[9px] text-slate-300 font-mono">2026/2027 Session</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-950">
                  {division}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-800 shrink-0">
                  <img
                    src={profile?.passportPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt="Passport"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">{profile?.fullName || userSession?.fullName || 'Student Scholar'}</h4>
                  <span className="text-[11px] font-mono text-amber-300 block">{profile?.matricNumber || userSession?.username || 'COEKA/2026/084'}</span>
                  <span className="text-[10px] text-slate-300 block">{profile?.programme || 'Full-Time Student'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Active
                </span>
                <span className="font-mono">VALID: 2026 - 2029</span>
              </div>
            </div>

            {/* Bio-Data Sheet */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Institutional Bio-Data & Contacts
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Address</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">{userSession?.email || 'student@coeka.edu.ng'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Academic Division</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400 block">{division}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">State of Origin</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">Benue State</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">LGA of Origin</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">Katsina-Ala LGA</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Blood Group</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">O+ (Positive)</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Residential Address</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">COEKA Student Village</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMON DIGITAL CLEARANCE */}
      {activeTab === 'clearance' && <DigitalClearance />}

      {/* TAB 5: HOSTEL ALLOCATION */}
      {activeTab === 'hostels' && (
        <DivisionGuard allowedDivisions={['DEGREE', 'NCE']} featureName="Hostel Allocation">
          <HostelPortal />
        </DivisionGuard>
      )}
    </div>
  );
};
