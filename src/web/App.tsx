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
import { AdmissionsPortalPage } from './pages/AdmissionsPortalPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { UserProfilePage } from './components/profile/UserProfilePage';

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
      } else if (pathname.startsWith('/admissions') || search.includes('tab=admissions')) {
        setActiveTab('admissions');
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
  const { settingsData, refetch: refetchSettings } = useSystemSettings();
  const isMaintenanceMode = Boolean(settingsData?.maintenanceMode);
  const isSuperAdmin = userSession?.role === 'SUPER_ADMIN';

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'VPAY' | 'PAYSTACK' | 'REMITA_BSCPP'>('VPAY');
  const [hostelReserved, setHostelReserved] = useState(false);
  const [reservationTimer, setReservationTimer] = useState(900); // 15 mins in seconds

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

  // If activeTab is 'admissions', render dedicated public AdmissionsPortalPage
  if (activeTab === 'admissions') {
    return <AdmissionsPortalPage />;
  }

  // Full-Page Maintenance Screen: Intercept all non-SuperAdmin users when Maintenance Mode is engaged
  if (isMaintenanceMode && !isSuperAdmin) {
    return <InstitutionalMaintenanceScreen onCheckAgain={() => refetchSettings()} />;
  }

  return (
    <DashboardLayout>
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
        <div className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md border border-amber-600 mb-6 flex items-center justify-between gap-4">
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
      )}

      {/* TAB 0: COMMAND CENTER (ROLE-BASED HOME) */}
      {activeTab === 'dashboard_home' && <DashboardHome />}

      {/* TAB 0.5: USER PROFILE & PERSONALIZATION SETTINGS */}
      {activeTab === 'profile' && <UserProfilePage />}

      {/* TAB 0.8: ADMIN MASTER CONSOLE */}
      {activeTab === 'admin' && (
        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
          <AdminLayout />
        </ProtectedRoute>
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
      </DashboardLayout>
  );
}
