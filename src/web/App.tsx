import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CreditCard,
  FileText,
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  User,
  Users,
  QrCode,
  ArrowRight,
  Copy,
  Check,
  Download,
  BookOpen,
  DollarSign,
  Award,
  Layers,
  ChevronRight,
  Sparkles,
  Send,
  Heart,
  TrendingUp,
  LogOut,
  LogIn,
  FileSpreadsheet,
} from 'lucide-react';
import { LedgerEngine } from '../services/finance/ledgerEngine';
import { GradingPolicyEngine } from '../services/academic/gradingPolicyEngine';
import { ResultComputer } from '../services/academic/resultComputer';
import { ScreeningEngine } from '../services/admissions/screeningEngine';
import { useAppStore, SchoolDivision, ActiveTab, resolveDashboardTab } from './stores/useAppStore';
import {
  useInvoices,
  useVirtualAccount,
  useHostelRooms,
  useReserveBedspace,
  useStudentResult,
  useParentWards,
  useAdmissionsScreening,
} from './hooks/usePortalData';
import { AdminLayout } from './components/admin/AdminLayout';
import { BursarModule } from './components/bursar/BursarModule';
import { LecturerModule } from './components/lecturer/LecturerModule';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { DeanDashboard } from './components/dean/DeanDashboard';
import { LibrarianDashboard } from './components/librarian/LibrarianDashboard';
import { ExamOfficerDashboard } from './components/exam_officer/ExamOfficerDashboard';
import { RegistrarDashboard } from './components/registrar/RegistrarDashboard';
import { HostelPortal } from './components/hostels/HostelPortal';
import { useSystemSettings } from './hooks/useAdminData';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ConsentModal } from './components/compliance/ConsentModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { InstitutionalMaintenanceScreen } from './components/common/InstitutionalMaintenanceScreen';
import { InstitutionalWebsite } from './components/website/InstitutionalWebsite';

export default function App() {
  // Global Client State via Zustand
  const {
    activeTab,
    setActiveTab,
    activeDivision,
    setActiveDivision,
    activeWardId,
    setActiveWardId,
    userSession,
    setUserSession,
  } = useAppStore();

  // Session Synchronization via useAuth
  const { logout } = useAuth();

  // NDPA 2023 Consent State
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const userId = userSession?.userId || userSession?.username || 'default';
    return Boolean(localStorage.getItem(`coeka_ndpa_consent_${userId}`));
  });

  // Keep consent state in sync when userSession changes
  useEffect(() => {
    if (userSession) {
      const userId = userSession.userId || userSession.username || 'default';
      const consented = Boolean(localStorage.getItem(`coeka_ndpa_consent_${userId}`));
      setHasConsented(consented);
    }
  }, [userSession?.userId, userSession?.username]);

  // Guard Admin Route: If non-admin attempts to access admin tab, redirect to their authorized dashboard
  useEffect(() => {
    if (activeTab === 'admin' && userSession?.role !== 'SUPER_ADMIN' && userSession?.role !== 'ADMIN') {
      if (userSession) {
        setActiveTab(resolveDashboardTab(userSession.role));
      } else {
        setActiveTab('login');
      }
    }
  }, [activeTab, userSession, setActiveTab]);

  // Support /dashboard, /admin, and /login URL routing on page load and browser history events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      const pathname = window.location.pathname;
      const hostname = window.location.hostname.toLowerCase();
      const search = window.location.search.toLowerCase();

      const isWorkerOrPortalHost =
        hostname.includes('worker.dev') ||
        hostname.includes('workers.dev') ||
        hostname.includes('portal');

      if (pathname.startsWith('/dashboard')) {
        if (userSession) {
          setActiveTab(resolveDashboardTab(userSession.role));
        } else {
          setActiveTab('login');
        }
      } else if (pathname.startsWith('/admin')) {
        if (userSession?.role === 'SUPER_ADMIN' || userSession?.role === 'ADMIN') {
          setActiveTab('admin');
        } else if (userSession) {
          // Non-admin logged in user (e.g. Student) attempting to access /admin -> redirect to authorized dashboard
          setActiveTab(resolveDashboardTab(userSession.role));
        } else {
          setActiveTab('login');
        }
      } else if (pathname.startsWith('/login') || search.includes('tab=login')) {
        setActiveTab('login');
      } else if (pathname.startsWith('/website') || search.includes('tab=website')) {
        setActiveTab('website');
      } else if (pathname === '/' || pathname === '') {
        if (userSession) {
          setActiveTab(resolveDashboardTab(userSession.role));
        } else if (search.includes('tab=login')) {
          setActiveTab('login');
        } else {
          setActiveTab('website');
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [userSession, setActiveTab]);

  // Server State via TanStack React Query
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: virtualAccount } = useVirtualAccount();
  const { data: hostelRooms, isLoading: hostelsLoading } = useHostelRooms();
  const reserveBedspaceMutation = useReserveBedspace();
  const { data: studentResult } = useStudentResult(activeDivision);
  const { data: parentData } = useParentWards();
  const admissionsMutation = useAdmissionsScreening();
  const { settingsData, refetch: refetchSettings } = useSystemSettings();
  const isMaintenanceMode = Boolean(settingsData?.maintenanceMode);
  const isSuperAdmin = userSession?.role === 'SUPER_ADMIN';

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'VPAY' | 'PAYSTACK' | 'REMITA_BSCPP'>('VPAY');
  const [hostelReserved, setHostelReserved] = useState(false);
  const [reservationTimer, setReservationTimer] = useState(900); // 15 mins in seconds

  // Admissions State
  const [applicantDivision, setApplicantDivision] = useState<'NCE' | 'DEGREE'>('NCE');
  const [applicantName, setApplicantName] = useState('Terfa Emmanuel Aondo');
  const [applicantJamb, setApplicantJamb] = useState(165);
  const [admissionOffer, setAdmissionOffer] = useState<{
    applicationNumber: string;
    isEligible: boolean;
    reason: string;
  } | null>(null);

  // Timer countdown simulation
  useEffect(() => {
    let interval: any;
    if (hostelReserved && reservationTimer > 0) {
      interval = setInterval(() => setReservationTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [hostelReserved, reservationTimer]);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    admissionsMutation.mutate(
      {
        division: applicantDivision,
        jambScore: applicantJamb,
        departmentCutOff: applicantDivision === 'DEGREE' ? 140 : 100,
        oLevelSubjects: [
          { subject: 'English Language', grade: 'C4' },
          { subject: 'Mathematics', grade: 'C5' },
          { subject: 'Biology', grade: 'B3' },
          { subject: 'Chemistry', grade: 'C6' },
          { subject: 'Physics', grade: 'B2' },
        ],
      },
      {
        onSuccess: (evaluation) => {
          setAdmissionOffer({
            applicationNumber: `COEKA/${applicantDivision}/2026/${Math.floor(1000 + Math.random() * 9000)}`,
            isEligible: evaluation.isEligible,
            reason: evaluation.reason,
          });
        },
      }
    );
  };

  // If activeTab is 'privacy', render PrivacyPolicy page
  if (activeTab === 'privacy') {
    return <PrivacyPolicy />;
  }

  // If activeTab is 'website', render high-fidelity sovereign InstitutionalWebsite
  if (activeTab === 'website') {
    return <InstitutionalWebsite />;
  }

  // If activeTab is 'login', render high-fidelity LoginPage
  if (activeTab === 'login') {
    return <LoginPage />;
  }

  // Full-Page Maintenance Screen: Intercept all non-SuperAdmin users when Maintenance Mode is engaged
  if (isMaintenanceMode && !isSuperAdmin) {
    return <InstitutionalMaintenanceScreen onCheckAgain={() => refetchSettings()} />;
  }

  // Render guarded full Master Admin shell if activeTab === 'admin'
  if (activeTab === 'admin') {
    return (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
        {userSession && !hasConsented && (
          <ConsentModal
            isOpen={true}
            studentId={userSession.userId}
            studentName={userSession.fullName}
            onConsentAccepted={() => setHasConsented(true)}
          />
        )}
        <AdminLayout />
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      {/* NDPA 2023 Mandatory Consent Modal - Blocks dashboard access until accepted */}
      {userSession && !hasConsented && (
        <ConsentModal
          isOpen={true}
          studentId={userSession.userId}
          studentName={userSession.fullName}
          onConsentAccepted={() => setHasConsented(true)}
        />
      )}
      {/* Maintenance Mode SuperAdmin Control Banner */}
      {isMaintenanceMode && (
        <div className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 shadow-md border-b border-amber-600 sticky top-0 z-[60]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-slate-950 animate-pulse" />
              <span>
                <strong>CAMPUS PORTAL MAINTENANCE MODE ACTIVE:</strong> The portal is currently locked for students and general public.
              </span>
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 font-mono text-[10px]">
                  Super Admin Bypass Active
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/admin/governance/maintenance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ enabled: false }),
                    });
                    refetchSettings();
                  }}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase transition-all cursor-pointer shadow-sm"
                >
                  Disable Kill-Switch
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Banner & Header */}
      <header className="bg-emerald-900 text-white border-b border-emerald-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Institution Brand */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => !userSession && setActiveTab('website')}>
              <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center text-emerald-950 font-black text-xl shadow-inner border border-amber-300">
                <GraduationCap className="w-7 h-7 text-emerald-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  COEKA PORTAL
                  {userSession ? (
                    <span className="text-xs bg-emerald-800 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-700 shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        {userSession.role === 'STUDENT'
                          ? 'Student Workspace (SIMS)'
                          : userSession.role === 'BURSAR' || userSession.role === 'BURSARY'
                          ? 'Bursary Hub'
                          : userSession.role === 'REGISTRAR'
                          ? 'Registrar Certification Portal'
                          : userSession.role === 'EXAM_OFFICER'
                          ? 'Exam Broadsheet Hub'
                          : userSession.role === 'DEAN'
                          ? 'Dean Oversight'
                          : userSession.role === 'LIBRARIAN'
                          ? 'Library Clearance'
                          : userSession.role === 'PARENT'
                          ? 'Parent Portal'
                          : userSession.role === 'SUPER_ADMIN' || userSession.role === 'ADMIN'
                          ? 'System Governor'
                          : `${userSession.role} Workspace`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-700/80 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-600">
                      Enterprise
                    </span>
                  )}
                </h1>
                <p className="text-xs text-emerald-200">
                  {userSession
                    ? `Active Session: 2026/2027 • Division: ${userSession.division || 'NCE'}`
                    : 'College of Education, Katsina-Ala • Benue State, Nigeria'}
                </p>
              </div>
            </div>

            {/* Navigation Switcher: ONLY shown when unauthenticated (public website visitor) */}
            {!userSession && (
              <nav className="hidden lg:flex space-x-1">
                {[
                  { id: 'website', label: 'College Home', icon: Home },
                  { id: 'admissions', label: 'Admissions', icon: FileText },
                  { id: 'sims', label: 'Student SIMS', icon: User },
                  { id: 'finance', label: 'Bursary', icon: CreditCard },
                  { id: 'results', label: 'Results', icon: Award },
                  { id: 'hostels', label: 'Hostels', icon: Building },
                  { id: 'staff', label: 'Staff Hub', icon: Users },
                  { id: 'dean', label: 'Dean Oversight', icon: ShieldCheck },
                  { id: 'exam_officer', label: 'Exam Broadsheet', icon: FileSpreadsheet },
                  { id: 'librarian', label: 'Library & Clearance', icon: BookOpen },
                  { id: 'registrar', label: 'Registrar Hub', icon: Award },
                  { id: 'parent', label: 'Parent Portal', icon: Heart },
                  { id: 'admin', label: 'Master Admin', icon: Layers },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-800 text-amber-300 shadow-sm border border-emerald-700'
                          : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Authenticated User Session Badge & Logout Button */}
            <div className="flex items-center space-x-3">
              {userSession ? (
                <>
                  <div className="hidden sm:flex flex-col text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-xs font-bold text-white">{userSession.fullName}</span>
                      <span className="text-[10px] font-semibold bg-emerald-800 text-amber-300 px-1.5 py-0.5 rounded border border-emerald-700">
                        {userSession.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-300 font-mono">
                      {userSession.username} • {userSession.division}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-amber-300 font-bold text-xs shadow-inner">
                    {userSession.fullName ? userSession.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'MI'}
                  </div>
                  {/* Dedicated Prominent Logout Button */}
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    title="Sign Out of COEKA Portal"
                    aria-label="Sign Out of COEKA Portal"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveTab('login')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-md transition-all transform active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Navigation: ONLY shown when unauthenticated */}
        {!userSession && (
          <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t border-emerald-800 space-x-2 text-xs">
            {[
              { id: 'website', label: 'Home' },
              { id: 'admissions', label: 'Admissions' },
              { id: 'sims', label: 'SIMS' },
              { id: 'finance', label: 'Bursary' },
              { id: 'results', label: 'Results' },
              { id: 'hostels', label: 'Hostels' },
              { id: 'staff', label: 'Staff' },
              { id: 'exam_officer', label: 'Broadsheet' },
              { id: 'librarian', label: 'Library' },
              { id: 'registrar', label: 'Registrar' },
              { id: 'parent', label: 'Parent' },
              { id: 'admin', label: 'Master Admin' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-3 py-1.5 rounded whitespace-nowrap font-medium ${
                  activeTab === tab.id ? 'bg-amber-400 text-emerald-950 font-bold' : 'text-emerald-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: ADMISSIONS PORTAL */}
        {activeTab === 'admissions' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bento-card p-8">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Online Admissions Portal</h2>
                  <p className="text-sm text-slate-500">Apply for NCE, Degree, Secondary, or Primary enrollment</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  2026/2027 Open
                </span>
              </div>

              {!admissionOffer ? (
                <form onSubmit={handleApply} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Programme Division
                      </label>
                      <select
                        value={applicantDivision}
                        onChange={(e) => setApplicantDivision(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      >
                        <option value="NCE">NCE (Nigeria Certificate in Education)</option>
                        <option value="DEGREE">Degree Programmes (Affiliated University)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Full Name (as in JAMB)
                      </label>
                      <input
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        UTME / Screening Score
                      </label>
                      <input
                        type="number"
                        value={applicantJamb}
                        onChange={(e) => setApplicantJamb(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Intended Course of Study
                      </label>
                      <select className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
                        <option>Computer Science / Mathematics</option>
                        <option>Biology / Integrated Science</option>
                        <option>English / Social Studies</option>
                        <option>Business Education (Degree)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow transition-all flex items-center justify-center gap-2"
                  >
                    <span>Submit Application & Check Instant Screening</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-bold text-emerald-950">
                        Provisional Admission Offered!
                      </h3>
                      <p className="text-sm text-emerald-800 mt-1">{admissionOffer.reason}</p>
                      <div className="mt-3 text-xs font-mono text-emerald-900 bg-white/80 p-2 rounded border border-emerald-200 inline-block">
                        Application Ref: <strong>{admissionOffer.applicationNumber}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-4 font-serif">
                    <div className="text-center border-b border-slate-200 pb-4">
                      <h3 className="text-lg font-bold text-emerald-950 uppercase tracking-wide">
                        College of Education, Katsina-Ala
                      </h3>
                      <p className="text-xs text-slate-500">Office of the Registrar • P.M.B. 1008, Katsina-Ala, Benue State</p>
                    </div>

                    <div className="text-sm space-y-2 text-slate-800 font-sans">
                      <p>Dear <strong>{applicantName}</strong>,</p>
                      <p>
                        You have been offered provisional admission into the{' '}
                        <strong>{applicantDivision} Programme</strong> for the 2026/2027 Academic Session.
                        Please proceed to pay your acceptance fee of ₦15,000.00.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-sans">
                      <span>Registrar: COEKA Academic Board</span>
                      <button
                        onClick={() => setActiveTab('finance')}
                        className="bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg hover:bg-emerald-700"
                      >
                        Pay Acceptance Fee
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setAdmissionOffer(null)}
                    className="text-xs text-slate-500 underline"
                  >
                    ← Submit another application
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT INFORMATION MANAGEMENT SYSTEM (SIMS - TERTIARY & BASIC) */}
        {activeTab === 'sims' && (
          <ProtectedRoute allowedRoles={['STUDENT', 'SUPER_ADMIN', 'ADMIN']}>
            <StudentDashboard />
          </ProtectedRoute>
        )}

        {/* TAB 4: BURSARY & FINANCIAL ENGINE */}
        {activeTab === 'finance' && (
          <ProtectedRoute allowedRoles={['BURSAR', 'BURSARY', 'SUPER_ADMIN', 'ADMIN', 'STUDENT']}>
            <BursarModule
              renderStudentPaymentView={() => (
                <div className="space-y-6">
                  <div className="bento-card p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-emerald-950 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                          VPay Dynamic NUBAN
                        </span>
                        <span className="text-xs text-emerald-200">Zero-Manual-Reconciliation Rail</span>
                      </div>
                      <h3 className="text-xl font-bold">Your Dedicated Student Bank Account</h3>
                      <p className="text-xs text-emerald-100 leading-relaxed">
                        Parents or sponsors can transfer directly from any Nigerian bank app or USSD into this dedicated account. Your fee invoice will be reconciled and credited automatically in seconds without uploading deposit slips.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center w-full md:w-auto shrink-0 space-y-1.5">
                      <span className="text-xs text-amber-300 font-semibold block">{virtualAccount?.bank_name || 'Wema Bank (COEKA Collection)'}</span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-mono font-black tracking-wider text-white">{virtualAccount?.account_number || '9910840184'}</span>
                        <button
                          onClick={() => handleCopyAccount(virtualAccount?.account_number || '9910840184')}
                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
                          title="Copy Account Number"
                        >
                          {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[11px] text-emerald-200 block font-mono">{virtualAccount?.account_name || 'COEKA - MOSES IORLIAM'}</span>
                    </div>
                  </div>

                  <div className="bento-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Current Session Fee Invoices</h3>
                      {invoicesLoading && <span className="text-xs text-emerald-700 animate-pulse font-medium">Syncing live balances...</span>}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {(invoices && invoices.length > 0 ? invoices : [
                        {
                          id: 'inv-001',
                          feeTitle: '2026/2027 NCE Tuition & Consolidated Institutional Fees',
                          invoiceNumber: 'INV-2026-COEKA-00184',
                          amountDueKobo: 4500000,
                          status: 'UNPAID',
                          dueDate: 'Dec 15, 2026',
                          formattedDue: '₦45,000.00',
                        },
                        {
                          id: 'inv-002',
                          feeTitle: 'Hostel Accommodation (Hall A - Female Bedspace)',
                          invoiceNumber: 'INV-2026-COEKA-00185',
                          amountDueKobo: 2000000,
                          status: 'PAID',
                          dueDate: 'Nov 30, 2026',
                          formattedDue: '₦20,000.00',
                        },
                      ]).map((inv: any) => {
                        const isPaid = inv.status === 'PAID';
                        const title = inv.feeTitle || inv.title;
                        const displayAmount = inv.formattedDue || LedgerEngine.koboToNaira(inv.amountDueKobo || inv.amountKobo);
                        return (
                          <div key={inv.invoiceNumber} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                                <span className="text-xs font-mono text-slate-400">{inv.invoiceNumber}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
                              <span className="text-xs text-slate-500">Due: {inv.dueDate}</span>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block">Total Due:</span>
                                <strong className="text-base font-bold text-slate-900">
                                  {displayAmount}
                                </strong>
                              </div>

                              {isPaid ? (
                                <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition">
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Receipt</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => alert(`Redirecting to ${selectedGateway} payment rail for ₦45,000.00`)}
                                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
                                >
                                  Pay Online Now
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            />
          </ProtectedRoute>
        )}

        {/* TAB 5: ACADEMIC RESULTS */}
        {activeTab === 'results' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    SENATE APPROVED
                  </span>
                  <span className="text-xs text-slate-500">2026/2027 • First Semester</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Official Semester Examination Statement</h3>
                <span className="text-xs text-slate-600">Aondoaver Moses Iorliam (COEKA/2026/NCE/084)</span>
              </div>

              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Semester GPA</span>
                  <strong className="text-2xl font-black text-emerald-700">
                    {studentResult?.semester?.gpa !== undefined ? studentResult.semester.gpa.toFixed(2) : '4.83'}
                  </strong>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Academic Standing</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {studentResult?.cumulative?.academicStanding || 'Distinction'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="bento-card p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Continuous Assessment & Examination Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3 text-center">Units</th>
                      <th className="py-2.5 px-3 text-center">CA (40)</th>
                      <th className="py-2.5 px-3 text-center">Exam (60)</th>
                      <th className="py-2.5 px-3 text-center">Total (100)</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(studentResult?.semester?.courses || [
                      { courseCode: 'CSC 111', courseTitle: 'Intro to Computer Systems', creditUnits: 2, caScore: 34, examScore: 52, totalScore: 86, letterGrade: 'A', gradePoint: 5.0 },
                      { courseCode: 'CSC 112', courseTitle: 'Problem Solving & BASIC', creditUnits: 3, caScore: 30, examScore: 48, totalScore: 78, letterGrade: 'A', gradePoint: 5.0 },
                      { courseCode: 'MTH 111', courseTitle: 'Algebra & Trigonometry', creditUnits: 3, caScore: 28, examScore: 42, totalScore: 70, letterGrade: 'A', gradePoint: 5.0 },
                      { courseCode: 'EDU 111', courseTitle: 'Philosophy of Education', creditUnits: 2, caScore: 36, examScore: 44, totalScore: 80, letterGrade: 'A', gradePoint: 5.0 },
                      { courseCode: 'GSE 111', courseTitle: 'General English I', creditUnits: 2, caScore: 32, examScore: 46, totalScore: 78, letterGrade: 'A', gradePoint: 5.0 },
                    ]).map((row: any) => (
                      <tr key={row.courseCode || row.code} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.courseCode || row.code}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{row.courseTitle || row.title}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-900">{row.creditUnits || row.units}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{row.caScore ?? row.ca ?? 30}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{row.examScore ?? row.exam ?? 50}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{row.totalScore ?? row.total}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {row.letterGrade || row.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                          {Number(row.gradePoint || row.point || 5).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: HOSTELS */}
        {activeTab === 'hostels' && (
          <HostelPortal />
        )}

        {/* TAB 7: STAFF HUB (SCORE UPLOAD, ATTENDANCE & ACADEMIC ENGINE) */}
        {activeTab === 'staff' && (
          <ProtectedRoute allowedRoles={['LECTURER', 'DEAN', 'HOD', 'STAFF', 'SUPER_ADMIN', 'ADMIN']}>
            <LecturerModule />
          </ProtectedRoute>
        )}

        {/* TAB 8: DEAN ACADEMIC OVERSIGHT (APPROVALS, APPEALS, FACULTY MAP) */}
        {activeTab === 'dean' && (
          <ProtectedRoute allowedRoles={['DEAN', 'SUPER_ADMIN', 'ADMIN']}>
            <DeanDashboard />
          </ProtectedRoute>
        )}

        {/* TAB 9: EXAMINATION OFFICER & BROADSHEET HUB (BROADSHEETS, PROBATION, GRADUATION) */}
        {activeTab === 'exam_officer' && (
          <ProtectedRoute allowedRoles={['EXAM_OFFICER', 'SUPER_ADMIN', 'ADMIN', 'DEAN']}>
            <ExamOfficerDashboard />
          </ProtectedRoute>
        )}

        {/* TAB 10: PARENT PORTAL (MULTI-WARD TELEMETRY & PAYMENTS) */}
        {activeTab === 'parent' && (
          <ProtectedRoute allowedRoles={['PARENT', 'SUPER_ADMIN', 'ADMIN']}>
            <ParentDashboard />
          </ProtectedRoute>
        )}

        {/* TAB 11: LIBRARIAN ASSET & CLEARANCE HUB (INVENTORY, CIRCULATION & CLEARANCE) */}
        {activeTab === 'librarian' && (
          <ProtectedRoute allowedRoles={['LIBRARIAN', 'SUPER_ADMIN', 'ADMIN']}>
            <LibrarianDashboard />
          </ProtectedRoute>
        )}

        {/* TAB 12: REGISTRAR & CERTIFICATE ISSUANCE HUB */}
        {activeTab === 'registrar' && (
          <ProtectedRoute allowedRoles={['REGISTRAR', 'SUPER_ADMIN', 'ADMIN']}>
            <RegistrarDashboard />
          </ProtectedRoute>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <p>© 2026 College of Education, Katsina-Ala. All rights reserved.</p>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setActiveTab('privacy')}
              className="text-emerald-400 hover:text-emerald-300 underline font-medium transition cursor-pointer"
            >
              Privacy Policy & NDPA 2023
            </button>
          </div>
          <p className="flex items-center gap-1.5">
            <span>Powered by</span>
            <strong className="text-amber-400">Fruitfulujah Project</strong>
            <span>• Katsina-Ala, Benue State</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
