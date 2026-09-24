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
} from 'lucide-react';
import { LedgerEngine } from '../services/finance/ledgerEngine';
import { GradingPolicyEngine } from '../services/academic/gradingPolicyEngine';
import { ResultComputer } from '../services/academic/resultComputer';
import { ScreeningEngine } from '../services/admissions/screeningEngine';
import { useAppStore, SchoolDivision, ActiveTab } from './stores/useAppStore';
import {
  useInvoices,
  useVirtualAccount,
  useHostelRooms,
  useReserveBedspace,
  useStudentResult,
  useParentWards,
  useAdmissionsScreening,
} from './hooks/usePortalData';

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
  } = useAppStore();

  // Server State via TanStack React Query
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: virtualAccount } = useVirtualAccount();
  const { data: hostelRooms, isLoading: hostelsLoading } = useHostelRooms();
  const reserveBedspaceMutation = useReserveBedspace();
  const { data: studentResult } = useStudentResult(activeDivision);
  const { data: parentData } = useParentWards();
  const admissionsMutation = useAdmissionsScreening();

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

  // SIMS Course Registration State
  const [registeredCourses, setRegisteredCourses] = useState<string[]>([
    'CSC 111',
    'CSC 112',
    'MTH 111',
    'EDU 111',
    'GSE 111',
  ]);
  const [regSuccess, setRegSuccess] = useState(false);

  // Staff Score Entry State
  const [staffCourse, setStaffCourse] = useState('CSC 111');
  const [staffScores, setStaffScores] = useState([
    { matric: 'COEKA/2026/NCE/084', name: 'Aondoaver Moses Iorliam', ca: 34, exam: 52 },
    { matric: 'COEKA/2026/NCE/085', name: 'Mngusonun Faith Tyav', ca: 28, exam: 46 },
    { matric: 'COEKA/2026/NCE/086', name: 'Terna Victor Chia', ca: 32, exam: 42 },
    { matric: 'COEKA/2026/NCE/087', name: 'Doose Mercy Gbadu', ca: 22, exam: 35 },
  ]);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Banner & Header */}
      <header className="bg-emerald-900 text-white border-b border-emerald-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Institution Brand */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('website')}>
              <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center text-emerald-950 font-black text-xl shadow-inner border border-amber-300">
                <GraduationCap className="w-7 h-7 text-emerald-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  COEKA PORTAL
                  <span className="text-xs bg-emerald-700/80 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-600">
                    Enterprise
                  </span>
                </h1>
                <p className="text-xs text-emerald-200">College of Education, Katsina-Ala • Benue State, Nigeria</p>
              </div>
            </div>

            {/* Navigation Switcher */}
            <nav className="hidden lg:flex space-x-1">
              {[
                { id: 'website', label: 'College Home', icon: Home },
                { id: 'admissions', label: 'Admissions', icon: FileText },
                { id: 'sims', label: 'Student SIMS', icon: User },
                { id: 'finance', label: 'Bursary', icon: CreditCard },
                { id: 'results', label: 'Results', icon: Award },
                { id: 'hostels', label: 'Hostels', icon: Building },
                { id: 'staff', label: 'Staff Hub', icon: Users },
                { id: 'parent', label: 'Parent Portal', icon: Heart },
                { id: 'admin', label: 'KPIs', icon: Layers },
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

            {/* User Session Quick Badge */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">{userSession?.fullName || 'Moses Iorliam'}</span>
                <span className="text-[11px] text-amber-300 font-mono">{userSession?.username || 'COEKA/2026/NCE/084'}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-amber-300 font-bold text-sm">
                {userSession ? userSession.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'MI'}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Navigation */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t border-emerald-800 space-x-2 text-xs">
          {[
            { id: 'website', label: 'Home' },
            { id: 'admissions', label: 'Admissions' },
            { id: 'sims', label: 'SIMS' },
            { id: 'finance', label: 'Bursary' },
            { id: 'results', label: 'Results' },
            { id: 'hostels', label: 'Hostels' },
            { id: 'staff', label: 'Staff' },
            { id: 'parent', label: 'Parent' },
            { id: 'admin', label: 'KPIs' },
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
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: COLLEGE HOMEPAGE */}
        {activeTab === 'website' && (
          <div className="space-y-8">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-emerald-800">
              <div className="max-w-3xl space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5" /> 2026/2027 Academic Session Live
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Welcome to College of Education, Katsina-Ala
                </h2>
                <p className="text-emerald-100 text-base sm:text-lg leading-relaxed">
                  Pioneering teacher education, degree programmes, and secondary learning in Benue State. Bringing all admissions, student records, fee collections, and academic transcripts onto a unified digital campus portal.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('admissions')}
                    className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Apply for Admissions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('finance')}
                    className="bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold px-6 py-3 rounded-xl border border-emerald-700 transition-all flex items-center gap-2"
                  >
                    <span>Pay School Fees</span>
                    <CreditCard className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Institutional Operating Divisions</h3>
                  <p className="text-sm text-slate-500">Academic units administered on the unified COEKA platform</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'NCE Programmes',
                    desc: 'National Commission for Colleges of Education (NCCE) 3-year teacher certification.',
                    stat: '24 Accredited Courses',
                    tag: 'NCCE 5-Point Scale',
                  },
                  {
                    title: 'Degree Programmes',
                    desc: 'Full-time Bachelor of Education (B.Ed / B.Sc Ed) affiliated university degrees.',
                    stat: 'NUC Approved',
                    tag: 'Senate Ratification',
                  },
                  {
                    title: 'Demonstration Secondary',
                    desc: 'Junior and Senior Secondary education (JSS1 - SSS3) with WAEC & NECO curricula.',
                    stat: 'WAEC / BECE Center',
                    tag: 'Terminal Reports',
                  },
                  {
                    title: 'Staff Primary School',
                    desc: 'Basic primary and nursery foundational education with termly continuous assessment.',
                    stat: 'Basic 1 - 6 Classes',
                    tag: 'Continuous Assessment',
                  },
                ].map((div, i) => (
                  <div key={i} className="bento-card p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 mb-2 inline-block">
                        {div.tag}
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{div.title}</h4>
                      <p className="text-sm text-slate-600 mb-4">{div.desc}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                      <span>{div.stat}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADMISSIONS PORTAL */}
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

        {/* TAB 3: STUDENT INFORMATION MANAGEMENT SYSTEM (SIMS) */}
        {activeTab === 'sims' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bento-card p-6 flex flex-col justify-between bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-lg">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-emerald-800/80">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-bold tracking-widest text-amber-300 uppercase">Digital Student ID</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 border border-emerald-700">
                    VERIFIED
                  </span>
                </div>

                <div className="mt-6 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-2xl bg-amber-400 border-2 border-white shadow-md flex items-center justify-center text-3xl font-black text-emerald-950 mb-3">
                    MI
                  </div>
                  <h3 className="text-lg font-bold text-white">Aondoaver Moses Iorliam</h3>
                  <span className="text-xs text-amber-300 font-mono mt-0.5">COEKA/2026/NCE/084</span>
                  <span className="text-xs text-emerald-200 mt-1">NCE Computer Science / Maths</span>
                </div>
              </div>

              <div className="pt-6 border-t border-emerald-800/80 mt-6 flex items-center justify-between">
                <div className="space-y-0.5 text-left text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase">Level & Session</span>
                  <span className="font-semibold text-white">100 Level • 2026/2027</span>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <QrCode className="w-10 h-10 text-slate-900" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bento-card p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Semester Course Registration</h3>
                  <p className="text-xs text-slate-500">2026/2027 First Semester (Min 15, Max 24 Units)</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Load:</span>
                  <strong className="text-base font-bold text-emerald-700">
                    {registeredCourses.length * 2 + 2} Units
                  </strong>
                </div>
              </div>

              {regSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Course registration submitted to Course Adviser (Dr. T. Kange) for electronic approval.</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-2.5 px-3">Selected</th>
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Course Title</th>
                      <th className="py-2.5 px-3 text-center">Units</th>
                      <th className="py-2.5 px-3">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { code: 'CSC 111', title: 'Introduction to Computer Systems', units: 2, compulsory: true },
                      { code: 'CSC 112', title: 'Problem Solving & BASIC Programming', units: 3, compulsory: true },
                      { code: 'MTH 111', title: 'Algebra and Trigonometry', units: 3, compulsory: true },
                      { code: 'MTH 112', title: 'Basic Calculus', units: 3, compulsory: false },
                      { code: 'EDU 111', title: 'Introduction to Foundations of Education', units: 2, compulsory: true },
                      { code: 'GSE 111', title: 'General English I', units: 2, compulsory: true },
                    ].map((c) => {
                      const isChecked = registeredCourses.includes(c.code);
                      return (
                        <tr key={c.code} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={c.compulsory}
                              onChange={() => {
                                if (isChecked) {
                                  setRegisteredCourses(registeredCourses.filter((code) => code !== c.code));
                                } else {
                                  setRegisteredCourses([...registeredCourses, c.code]);
                                }
                              }}
                              className="rounded text-emerald-700 focus:ring-emerald-600"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{c.code}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{c.title}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{c.units}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                c.compulsory ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {c.compulsory ? 'Compulsory' : 'Elective'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setRegSuccess(true)}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow"
                >
                  Confirm & Submit Course Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BURSARY & FINANCIAL ENGINE */}
        {activeTab === 'finance' && (
          <div className="space-y-6 max-w-5xl mx-auto">
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
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bento-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Hostel Space Allocation</h3>
                  <p className="text-xs text-slate-500">Hall A (Queen Amina Hall - Female) • Room 101</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                  ₦20,000.00 / Session
                </span>
              </div>

              {hostelReserved && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>
                      15-Minute Reservation Lock Active! Complete fee payment before the timer expires.
                    </span>
                  </div>
                  <strong className="font-mono text-sm text-amber-950 font-bold">
                    {Math.floor(reservationTimer / 60)}:{(reservationTimer % 60).toString().padStart(2, '0')}
                  </strong>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {(hostelRooms?.[0]?.bedspaces || [
                  { id: 'bed-1', name: 'Bed 1 (Lower)', status: hostelReserved ? 'RESERVED' : 'AVAILABLE', isAvailable: !hostelReserved },
                  { id: 'bed-2', name: 'Bed 2 (Upper)', status: 'AVAILABLE', isAvailable: true },
                  { id: 'bed-3', name: 'Bed 3 (Lower)', status: 'OCCUPIED', isAvailable: false },
                  { id: 'bed-4', name: 'Bed 4 (Upper)', status: 'AVAILABLE', isAvailable: true },
                ]).map((b: any) => {
                  const isAvailable = b.isAvailable ?? (b.status === 'AVAILABLE');
                  const isReserved = b.isReserved || b.status === 'RESERVED' || (hostelReserved && b.id === 'bed-1');
                  const statusLabel = isReserved ? 'RESERVED' : isAvailable ? 'AVAILABLE' : 'OCCUPIED';
                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border text-center flex flex-col justify-between gap-3 ${
                        isReserved
                          ? 'bg-amber-50 border-amber-400'
                          : isAvailable
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">{b.name || `Bed ${b.id.slice(-1)}`}</strong>
                        <span
                          className={`text-[10px] font-bold uppercase mt-1 inline-block ${
                            isReserved ? 'text-amber-700' : isAvailable ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <button
                        disabled={!isAvailable || reserveBedspaceMutation.isPending}
                        onClick={() => {
                          reserveBedspaceMutation.mutate(b.id, {
                            onSuccess: (res: any) => {
                              setHostelReserved(true);
                              setReservationTimer(res.lockDurationSeconds || 900);
                            },
                          });
                        }}
                        className={`text-xs font-bold py-1.5 rounded-lg transition ${
                          isAvailable
                            ? 'bg-emerald-800 text-white hover:bg-emerald-700 shadow'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isReserved ? 'Locked (15m)' : isAvailable ? 'Select Bed' : 'Occupied'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: STAFF HUB (SCORE UPLOAD & WORKLOAD) */}
        {activeTab === 'staff' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bento-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-950 text-white">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Faculty Workspace</span>
                <h3 className="text-xl font-bold">Dr. Terver Kange (Senior Lecturer)</h3>
                <p className="text-xs text-emerald-200">Department of Computer Science • School of Sciences</p>
              </div>
              <div className="text-left sm:text-right text-xs">
                <span className="text-slate-400 block">Assigned Workload:</span>
                <strong className="text-amber-300 text-sm">3 Courses (8 Units) • 510 Students</strong>
              </div>
            </div>

            <div className="bento-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Score Entry & Moderation Sheet</h4>
                  <p className="text-xs text-slate-500">Continuous Assessment (Max 40) + Examination (Max 60)</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Course:</label>
                  <select
                    value={staffCourse}
                    onChange={(e) => setStaffCourse(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="CSC 111">CSC 111 (Intro to CS)</option>
                    <option value="CSC 112">CSC 112 (Programming)</option>
                    <option value="CSC 211">CSC 211 (Data Structures)</option>
                  </select>
                </div>
              </div>

              {scoreSubmitted && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Draft score batch locked and transmitted to HOD Computer Science for departmental moderation.</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-2.5 px-3">Matric Number</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3 text-center">CA (0-40)</th>
                      <th className="py-2.5 px-3 text-center">Exam (0-60)</th>
                      <th className="py-2.5 px-3 text-center">Total</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffScores.map((row, idx) => {
                      const total = row.ca + row.exam;
                      const evaluated = GradingPolicyEngine.evaluateScore(total, 'NCCE_5_POINT');
                      return (
                        <tr key={row.matric} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.matric}</td>
                          <td className="py-2.5 px-3 text-slate-700">{row.name}</td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={row.ca}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...staffScores];
                                updated[idx].ca = Math.min(40, Math.max(0, val));
                                setStaffScores(updated);
                              }}
                              className="w-16 px-2 py-1 text-center rounded border border-slate-300 font-bold"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={row.exam}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...staffScores];
                                updated[idx].exam = Math.min(60, Math.max(0, val));
                                setStaffScores(updated);
                              }}
                              className="w-16 px-2 py-1 text-center rounded border border-slate-300 font-bold"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{total}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {evaluated.letterGrade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setScoreSubmitted(true)}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Score Sheet to HOD</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: PARENT PORTAL (MULTI-WARD TELEMETRY) */}
        {activeTab === 'parent' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bento-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-emerald-950 text-white">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Parent & Guardian Hub</span>
                <h3 className="text-xl font-bold">Mr. Joshua T. Tsegha</h3>
                <p className="text-xs text-emerald-200">Registered Phone: 08064377594 • Katsina-Ala, Benue State</p>
              </div>
              <div className="text-left sm:text-right text-xs">
                <span className="text-slate-400 block">Monitored Wards:</span>
                <strong className="text-amber-300 text-sm">3 Children (NCE, Secondary, Primary)</strong>
              </div>
            </div>

            {/* Ward Switcher Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'std-001',
                  name: 'Aondoaver Moses',
                  div: 'NCE Programme (100L)',
                  fee: '₦45,000 Due',
                  perf: 'GPA: 4.83',
                  feeColor: 'text-amber-700 bg-amber-50',
                },
                {
                  id: 'std-002',
                  name: 'Ngodoo Blessing',
                  div: 'Demonstration Secondary (SS2)',
                  fee: 'Fees Paid',
                  perf: '3rd of 45',
                  feeColor: 'text-emerald-700 bg-emerald-50',
                },
                {
                  id: 'std-003',
                  name: 'Terhide Kelvin',
                  div: 'Staff Primary (Basic 4)',
                  fee: 'Fees Paid',
                  perf: '1st of 32',
                  feeColor: 'text-emerald-700 bg-emerald-50',
                },
              ].map((ward) => (
                <button
                  key={ward.id}
                  onClick={() => setActiveWardId(ward.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    activeWardId === ward.id
                      ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-white/80 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-sm text-slate-900">{ward.name}</strong>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ward.feeColor}`}>
                      {ward.fee}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block">{ward.div}</span>
                  <span className="text-xs font-bold text-emerald-700 mt-2 block">{ward.perf}</span>
                </button>
              ))}
            </div>

            {/* Selected Ward Telemetry Detail Card */}
            {activeWardId === 'std-002' && (
              <div className="bento-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Ngodoo Blessing Tsegha — Terminal School Report Card
                    </h4>
                    <p className="text-xs text-slate-500">COEKA Demonstration Secondary School • Third Term SS2</p>
                  </div>
                  <button className="bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report Card PDF</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3 text-center">CA1 (20)</th>
                        <th className="py-2.5 px-3 text-center">CA2 (20)</th>
                        <th className="py-2.5 px-3 text-center">Exam (60)</th>
                        <th className="py-2.5 px-3 text-center">Total (100)</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { subject: 'English Language', ca1: 18, ca2: 17, exam: 48, total: 83, grade: 'A1', remark: 'Excellent' },
                        { subject: 'Mathematics', ca1: 16, ca2: 18, exam: 46, total: 80, grade: 'A1', remark: 'Excellent' },
                        { subject: 'Biology', ca1: 15, ca2: 16, exam: 44, total: 75, grade: 'A1', remark: 'Distinction' },
                        { subject: 'Chemistry', ca1: 14, ca2: 15, exam: 42, total: 71, grade: 'B2', remark: 'Very Good' },
                        { subject: 'Physics', ca1: 15, ca2: 15, exam: 40, total: 70, grade: 'B2', remark: 'Very Good' },
                      ].map((sub) => (
                        <tr key={sub.subject} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{sub.subject}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{sub.ca1}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{sub.ca2}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{sub.exam}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{sub.total}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{sub.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeWardId === 'std-001' && (
              <div className="bento-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Aondoaver Moses Iorliam — NCE Academic Telemetry
                    </h4>
                    <p className="text-xs text-slate-500">100 Level • NCE Computer Science / Mathematics</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('finance')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shadow"
                  >
                    Pay Outstanding ₦45,000.00
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 block">Attendance Rate</span>
                    <strong className="text-xl font-bold text-emerald-700">96.4%</strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 block">First Semester GPA</span>
                    <strong className="text-xl font-bold text-emerald-700">4.83 / 5.00</strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 block">Bursary Clearance</span>
                    <strong className="text-xl font-bold text-amber-600">Pending Tuition</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: EXECUTIVE DASHBOARD */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Executive Management Dashboard</h3>
              <p className="text-xs text-slate-500">Real-time institutional metrics for College Provost and Directorate</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Total Active Students', value: '4,820', sub: 'Across 4 Divisions', icon: GraduationCap, color: 'text-emerald-700' },
                { title: 'Session Fee Collection', value: '₦184.2M', sub: '92% Collection Rate', icon: DollarSign, color: 'text-amber-600' },
                { title: 'Admissions Processed', value: '1,420', sub: '2026/2027 Cycle', icon: FileText, color: 'text-blue-600' },
                { title: 'Hostel Occupancy', value: '94.5%', sub: '416 / 440 Bedspaces', icon: Building, color: 'text-purple-600' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bento-card p-6 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">{stat.title}</span>
                      <h4 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h4>
                      <span className="text-[11px] text-emerald-600 font-medium">{stat.sub}</span>
                    </div>
                    <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 College of Education, Katsina-Ala. All rights reserved.</p>
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
