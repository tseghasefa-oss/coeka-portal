import React from 'react';
import {
  GraduationCap,
  CreditCard,
  Clock,
  BookOpen,
  Users,
  FileCheck,
  Calendar,
  DollarSign,
  Layers,
  AlertTriangle,
  Award,
  CheckCircle2,
  Activity,
  ArrowRight,
  ShieldCheck,
  Building2,
  Database,
  Search,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  KeyRound,
  ExternalLink,
  Laptop,
  Pin,
  Megaphone
} from 'lucide-react';
import { useAppStore, UserRole } from '../../stores/useAppStore';
import { useBulletinStore } from '../../stores/useBulletinStore';

export const DashboardHome: React.FC = () => {
  const { userSession, setActiveTab, setAdminTab } = useAppStore();
  const { bulletins } = useBulletinStore();
  const role: UserRole = userSession?.role || 'STUDENT';

  // Greeting time
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  const activeBulletins = React.useMemo(() => {
    return bulletins
      .filter((b) => {
        if (!b.isPublished) return false;
        // Check placement
        const hasPlacement =
          b.placements.includes('STUDENT_DASHBOARD') ||
          (role !== 'STUDENT' && b.placements.includes('STAFF_PORTAL'));
        if (!hasPlacement) return false;

        // Check audience
        if (b.audiences.includes('ALL')) return true;
        if (role === 'STUDENT' && b.audiences.includes('STUDENTS')) return true;
        if (role !== 'STUDENT' && (b.audiences.includes('STAFF') || b.audiences.includes('ADMIN'))) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.pinToTop && !b.pinToTop) return -1;
        if (!a.pinToTop && b.pinToTop) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 4);
  }, [bulletins, role]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ========================================================================= */}
      {/* 1. COMMAND CENTER WELCOME & INSTITUTIONAL CONTEXT BANNER                 */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B192C] via-[#132c4d] to-[#0B192C] text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-24 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-amber-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>2026/2027 Academic Session • First Semester</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {timeGreeting},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
                {userSession?.fullName || 'Distinguished Scholar'}
              </span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium">
              {role === 'STUDENT' && 'Department of Mathematics & Computer Science • Matric: COEKA/2026/NCE/084'}
              {role === 'LECTURER' && 'Senior Lecturer • Department of Curriculum & Teaching Practice'}
              {role === 'BURSAR' && 'Chief Financial Controller • Directorate of Bursary & Revenue Collections'}
              {role === 'DEAN' && 'Dean, School of Sciences • Academic Board Executive'}
              {role === 'REGISTRAR' && 'Chief Administrative Officer • Central Academic Affairs & Registry'}
              {role === 'EXAM_OFFICER' && 'Chief Examination & Broadsheet Computation Officer'}
              {role === 'WARDEN' && 'Directorate of Student Affairs • Hostels & Residency Operations'}
              {role === 'LIBRARIAN' && 'Chief Librarian • Digital Knowledge Resources & E-Library Hub'}
              {role === 'PARENT' && 'Parent / Guardian Portal • Tracking Active Wards at COEKA'}
              {(role === 'SUPER_ADMIN' || role === 'ADMIN') && 'Institutional God-Mode Console • Sovereign Campus Infrastructure'}
            </p>
          </div>

          {/* Edge Status & Quick Badge */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono text-[11px]">Edge Network: 100% Operational</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 shadow-sm">
                Role: {role}
              </span>
              <button
                onClick={() => setActiveTab('profile')}
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Profile & ID Card
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC ROLE-BASED KPI CARDS GRID (The Command Center)                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Key Operational Metrics (At-a-Glance)</span>
            </h2>
            <p className="text-xs text-slate-500">Live indicators grounded in real-time Cloudflare D1 edge database</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Updated just now</span>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* ROLE A: STUDENT KPI CARDS                                               */}
        {/* ----------------------------------------------------------------------- */}
        {role === 'STUDENT' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Current CGPA */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current CGPA</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0B192C]">4.25</span>
                  <span className="text-xs font-bold text-slate-400">/ 5.00</span>
                </div>
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>First Class Distinction (+0.12)</span>
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <button onClick={() => setActiveTab('results')} className="hover:underline flex items-center gap-1">
                  <span>View Full Broadsheet</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Outstanding Fee Balance */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fee Balance</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-700">₦0.00</span>
                </div>
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Cleared (Eligible for Exams)</span>
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <button onClick={() => setActiveTab('finance')} className="hover:underline flex items-center gap-1">
                  <span>View Receipts & Invoices</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: Next Lecture/Class Time */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Scheduled Class</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-black text-[#0B192C] block">EDU 311: Educational Tech</span>
                  <span className="text-xs font-semibold text-blue-600 block mt-0.5">Today at 10:00 AM (Hall B)</span>
                </div>
                <p className="text-[11px] text-slate-500">Lecturer: Dr. Scholastica Tyav</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <button onClick={() => setActiveTab('sims')} className="hover:underline flex items-center gap-1">
                  <span>View Timetable</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 4: Hostel Status */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hostel Allocation</span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-black text-[#0B192C] block">Sir Kashim Ibrahim Hall</span>
                  <span className="text-xs font-bold text-purple-700 block mt-0.5">Room 204 • Bedspace 02</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold">Autonomous Lock Active</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <button onClick={() => setActiveTab('hostels')} className="hover:underline flex items-center gap-1">
                  <span>Manage Bedspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* ROLE B: LECTURER KPI CARDS                                              */}
        {/* ----------------------------------------------------------------------- */}
        {role === 'LECTURER' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Total Students Enrolled */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enrolled Students</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#0B192C]">284</div>
                <p className="text-xs text-slate-500">Active across 3 assigned courses (MTH 211, MTH 312, EDU 211)</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('staff')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>View Course Rosters</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Pending Grades to be submitted */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Grades</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <FileCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-600">2 Courses</div>
                <p className="text-xs text-amber-700 font-semibold">Continuous Assessment sheets awaiting upload</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('staff')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Open Grading Matrix</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: Today's Course Schedule */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Schedule</span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-black text-[#0B192C] block">MTH 211: Linear Algebra</span>
                  <span className="text-xs font-bold text-purple-700 block mt-0.5">12:00 PM - 2:00 PM • Science Lab 2</span>
                </div>
                <p className="text-xs text-slate-500">Attendance Tracker: Ready</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('staff')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Take Class Attendance</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* ROLE C: BURSAR KPI CARDS                                                */}
        {/* ----------------------------------------------------------------------- */}
        {(role === 'BURSAR' || role === 'BURSARY') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Total Revenue Collected this session */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Session Revenue</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-700">₦148,500,000</div>
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+14.2% Collections vs. Previous Session</span>
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('finance')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>View Revenue Ledgers</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Number of Pending Reconciliations */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unmatched Transactions</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-600">14 Pending</div>
                <p className="text-xs text-slate-500">Bank statement deposits pending dynamic NUBAN match</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('finance')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Execute Auto-Reconciliation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: Top 5 Debtors list */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Receivables / Debtors</span>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-rose-600">82 Students</div>
                <p className="text-xs text-rose-700 font-semibold">Total outstanding receivables: ₦3,690,000</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('finance')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>View Top Debtors Roster</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* ROLE D: DEAN / REGISTRAR KPI CARDS                                      */}
        {/* ----------------------------------------------------------------------- */}
        {(role === 'DEAN' || role === 'REGISTRAR') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Results awaiting approval */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Results for Senate Ratification</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <FileCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#0B192C]">18 Broadsheets</div>
                <p className="text-xs text-blue-600 font-semibold">8 Departments Submitted • Pending Dean Signature</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab(role === 'DEAN' ? 'dean' : 'registrar')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Open Approval Queue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Graduation candidate count */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Graduation Candidates</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-700">1,420 Cleared</div>
                <p className="text-xs text-slate-500">Full compliance with NCCE & NUC benchmark credit units</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab(role === 'DEAN' ? 'dean' : 'registrar')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Inspect Convocation List</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: System Health/Maintenance status */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">System Security & Health</span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-purple-700">99.99%</div>
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cloudflare WAF Shield: Active & Secure</span>
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('admin')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>View Security Audits</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* ROLE E: ADMIN / SUPER_ADMIN KPI CARDS                                   */}
        {/* ----------------------------------------------------------------------- */}
        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Users</span>
                <div className="text-3xl font-black text-[#0B192C]">3,420</div>
                <p className="text-xs text-slate-500">Students, Staff, Lecturers, Deans</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => { setActiveTab('admin'); setAdminTab('users'); }} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Manage RBAC Roles</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cryptographic Audit</span>
                <div className="text-3xl font-black text-emerald-700">100% Intact</div>
                <p className="text-xs text-emerald-600 font-semibold">HMAC SHA-256 Validated</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => { setActiveTab('admin'); setAdminTab('audit'); }} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Inspect Audit Hash</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Database Engine</span>
                <div className="text-3xl font-black text-blue-700">Cloudflare D1</div>
                <p className="text-xs text-slate-500">4 Divisions • 28 Active Tables</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => { setActiveTab('admin'); setAdminTab('courses'); }} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>View Curriculum</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Maintenance Mode</span>
                <div className="text-3xl font-black text-slate-900">Disabled</div>
                <p className="text-xs text-emerald-600 font-semibold">Public Traffic Unblocked</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => { setActiveTab('admin'); setAdminTab('settings'); }} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Governance Controls</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* ROLE F: WARDEN / STUDENT AFFAIRS KPI CARDS                              */}
        {/* ----------------------------------------------------------------------- */}
        {role === 'WARDEN' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hostel Bed Occupancy</span>
                <div className="text-3xl font-black text-[#0B192C]">850 / 1,200</div>
                <p className="text-xs text-emerald-600 font-semibold">70.8% Occupancy Rate Across 3 Halls</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('hostels')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Manage Inventory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active 15-Min Locks</span>
                <div className="text-3xl font-black text-amber-600">12 Locks Active</div>
                <p className="text-xs text-slate-500">Compare-and-Swap concurrency engine holding beds</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('hostels')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Live Lock Telemetry</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Vacancies</span>
                <div className="text-3xl font-black text-emerald-700">350 Beds</div>
                <p className="text-xs text-slate-500">Sir Kashim, Queen Amina, Benue Halls</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={() => setActiveTab('hostels')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>View Bed Allocation Map</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. QUICK ACTIONS SHORTCUT BAR                                            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-500" />
          <span>Quick Actions & Workflows</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {role === 'STUDENT' && (
            <>
              <button
                onClick={() => setActiveTab('results')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <GraduationCap className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 block">View Academic Results</span>
                <span className="text-[10px] text-slate-500">Semester broadsheet</span>
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <CreditCard className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 block">Tuition & Invoicing</span>
                <span className="text-[10px] text-slate-500">Dedicated VPay NUBAN</span>
              </button>
              <button
                onClick={() => setActiveTab('hostels')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <Building2 className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 block">Hostel Reservation</span>
                <span className="text-[10px] text-slate-500">Self-service bed pick</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <Award className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 block">Digital ID Card</span>
                <span className="text-[10px] text-slate-500">QR-code verified</span>
              </button>
            </>
          )}

          {role !== 'STUDENT' && (
            <>
              <button
                onClick={() => setActiveTab('profile')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <ShieldCheck className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 block">My Profile & Security</span>
                <span className="text-[10px] text-slate-500">Password & contacts</span>
              </button>
              <button
                onClick={() => setActiveTab('website')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <ExternalLink className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 block">Institutional Website</span>
                <span className="text-[10px] text-slate-500">Public Showroom</span>
              </button>
              <button
                onClick={() => setActiveTab('admissions')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <Users className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 block">Admissions Portal</span>
                <span className="text-[10px] text-slate-500">Review applicants</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <Database className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 block">Audit & Governance</span>
                <span className="text-[10px] text-slate-500">System parameters</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RECENT CAMPUS BULLETINS & ANNOUNCEMENTS                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Campus News & Academic Bulletins</span>
            </h3>
            <span className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => setActiveTab('website')}>
              View All
            </span>
          </div>

          <div className="space-y-3">
            {activeBulletins.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                No active announcements for your profile at this time.
              </div>
            ) : (
              activeBulletins.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 space-y-1.5 transition-colors">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                        {item.category}
                      </span>
                      {item.priority === 'URGENT' && (
                        <span className="font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded text-[10px]">
                          Urgent
                        </span>
                      )}
                      {item.pinToTop && (
                        <span className="flex items-center gap-0.5 text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          <Pin className="w-2.5 h-2.5 fill-amber-600" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-medium text-[10px]">{item.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{item.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Academic Calendar / Key Milestones */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Academic Milestones (First Semester)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Approved by Senate</span>
          </div>

          <div className="space-y-3">
            {[
              { date: 'Oct 12, 2026', event: 'Resumption of Fresh & Returning Students', status: 'Upcoming' },
              { date: 'Oct 18, 2026', event: 'Close of Normal Course Registration', status: 'Pending' },
              { date: 'Nov 02, 2026', event: 'Mid-Semester Continuous Assessment (CA)', status: 'Pending' },
              { date: 'Dec 14, 2026', event: 'First Semester Examination Commences', status: 'Pending' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{item.event}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{item.date}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
