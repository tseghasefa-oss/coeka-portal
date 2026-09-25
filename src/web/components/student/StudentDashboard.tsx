import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CreditCard,
  FileText,
  Calendar,
  ShieldCheck,
  QrCode,
  Building,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useStudentProfile } from '../../hooks/useStudentData';
import { CourseRegistrationView } from './CourseRegistrationView';
import { TranscriptView } from './TranscriptView';
import { ReportCardView } from './ReportCardView';
import { TimetableView } from './TimetableView';
import { MyInvoices } from './MyInvoices';
import { DigitalClearance } from './DigitalClearance';
import { OnboardingView } from './OnboardingView';

export const StudentDashboard: React.FC = () => {
  const { userSession } = useAppStore();
  const { data: profile } = useStudentProfile();

  // Determine if active user or selected tier is Basic Ed (Secondary / Primary) or Tertiary (NCE / Degree)
  const isBasicEd =
    userSession?.division === 'SECONDARY' ||
    userSession?.division === 'PRIMARY' ||
    profile?.division?.includes('Secondary') ||
    profile?.division?.includes('Primary');

  // Sub-tab selection state
  const [activeSubTab, setActiveSubTab] = useState<string>(
    isBasicEd ? 'reportCard' : 'courseReg'
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Student Identity & Digital ID Header Banner */}
      <div className="bento-card p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800 shadow-lg">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {profile?.division || 'NCE Programmes'}
            </span>
            <span className="text-xs text-emerald-200">
              {isBasicEd ? 'Basic Education Dossier' : 'Tertiary SIMS Portal'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Welcome, {profile?.fullName || userSession?.fullName || 'Aondoaver Moses Iorliam'}, {profile?.role || 'STUDENT'}
          </h2>

          <p className="text-xs text-emerald-100 leading-relaxed">
            {profile?.programme || 'NCE Computer Science / Mathematics'} • Level {profile?.level || 100} • Matric: {profile?.matricNumber || 'COEKA/2026/NCE/084'}
          </p>
        </div>

        {/* Digital ID Card Preview */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4 shrink-0 shadow-inner">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-400 shrink-0">
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
            <strong className="text-white font-mono block">
              {profile?.matricNumber || 'COEKA/2026/NCE/084'}
            </strong>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-900/60 px-2 py-0.2 rounded border border-emerald-700">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              VERIFIED ACTIVE
            </span>
          </div>

          <div className="p-1.5 bg-white rounded-lg shrink-0 ml-2">
            <QrCode className="w-8 h-8 text-slate-900" />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xs">
        {/* Tertiary Specific: Course Registration */}
        {!isBasicEd && (
          <button
            onClick={() => setActiveSubTab('courseReg')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'courseReg'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Course Registration</span>
          </button>
        )}

        {/* Basic Ed Specific: Report Card */}
        {isBasicEd && (
          <button
            onClick={() => setActiveSubTab('reportCard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'reportCard'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Termly Report Card</span>
          </button>
        )}

        {/* Unified: My Invoices */}
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'invoices'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>My Invoices & Debt</span>
        </button>

        {/* Tertiary Specific: Transcript */}
        {!isBasicEd && (
          <button
            onClick={() => setActiveSubTab('transcript')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'transcript'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Official Transcript</span>
          </button>
        )}

        {/* Unified: Class Timetable */}
        <button
          onClick={() => setActiveSubTab('timetable')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'timetable'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Class Timetable</span>
        </button>

        {/* Unified: Digital Clearance */}
        <button
          onClick={() => setActiveSubTab('clearance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'clearance'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Digital Clearance</span>
        </button>

        {/* Admissions Onboarding Wizard */}
        <button
          onClick={() => setActiveSubTab('onboarding')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'onboarding'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Admissions Onboarding</span>
        </button>

        {/* Preview Toggle for demonstration purposes */}
        <div className="ml-auto flex items-center gap-1 px-2 text-[10px] text-slate-500 font-semibold">
          <span>Tier View:</span>
          <button
            onClick={() => {
              setActiveSubTab('courseReg');
              useAppStore.setState({ activeDivision: 'NCE' });
            }}
            className={`px-2 py-0.5 rounded ${!isBasicEd ? 'bg-emerald-800 text-white font-bold' : 'bg-slate-200'}`}
          >
            Tertiary
          </button>
          <button
            onClick={() => {
              setActiveSubTab('reportCard');
              useAppStore.setState({ activeDivision: 'SECONDARY' });
            }}
            className={`px-2 py-0.5 rounded ${isBasicEd ? 'bg-emerald-800 text-white font-bold' : 'bg-slate-200'}`}
          >
            Basic Ed
          </button>
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      {activeSubTab === 'onboarding' && (
        <OnboardingView onComplete={() => setActiveSubTab('courseReg')} />
      )}

      {activeSubTab === 'courseReg' && (
        <CourseRegistrationView onNavigateToInvoices={() => setActiveSubTab('invoices')} />
      )}

      {activeSubTab === 'reportCard' && <ReportCardView />}

      {activeSubTab === 'invoices' && <MyInvoices />}

      {activeSubTab === 'transcript' && <TranscriptView />}

      {activeSubTab === 'timetable' && <TimetableView />}

      {activeSubTab === 'clearance' && <DigitalClearance />}
    </div>
  );
};
