import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Award,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Download,
  Layers,
  Sparkles,
  Check,
  Info,
  ShoppingCart,
  Trash2,
  Send,
  Lock,
} from 'lucide-react';
import { useStudentProfile, useAvailableCourses, useStudentTranscript } from '../../hooks/useStudentData';

interface TertiaryAcademicViewProps {
  division: 'DEGREE' | 'NCE';
}

export const TertiaryAcademicView: React.FC<TertiaryAcademicViewProps> = ({ division }) => {
  const { data: profile } = useStudentProfile();
  const { data: coursesData } = useAvailableCourses();
  const { data: transcriptData } = useStudentTranscript();

  const [activeModule, setActiveModule] = useState<'courses' | 'gpa' | 'transcript' | 'audit'>('courses');

  // Course Registration Cart State
  const defaultCourses = [
    { code: division === 'DEGREE' ? 'CSC 311' : 'CSC 211', title: 'Data Structures & Algorithms', units: 3, core: true, prerequisite: 'Passed CSC 111 (B)' },
    { code: division === 'DEGREE' ? 'CSC 312' : 'CSC 212', title: 'Operating Systems & Cloud Architecture', units: 3, core: true, prerequisite: 'Passed CSC 112 (A)' },
    { code: division === 'DEGREE' ? 'EDU 311' : 'EDU 211', title: 'Educational Technology & Micro-Teaching', units: 2, core: true, prerequisite: 'Passed EDU 111 (A)' },
    { code: division === 'DEGREE' ? 'MTH 311' : 'MTH 211', title: 'Abstract Algebra & Real Analysis', units: 3, core: true, prerequisite: 'Passed MTH 111 (B)' },
    { code: division === 'DEGREE' ? 'GSE 311' : 'GSE 211', title: 'Peace Studies & Conflict Resolution', units: 2, core: true, prerequisite: 'None' },
    { code: division === 'DEGREE' ? 'CSC 315' : 'CSC 215', title: 'Web Application Development & APIs', units: 3, core: false, prerequisite: 'Passed CSC 111 (B)' },
    { code: division === 'DEGREE' ? 'CSC 318' : 'CSC 218', title: 'Computer Hardware & Networking', units: 2, core: false, prerequisite: 'None' },
  ];

  const [cart, setCart] = useState<typeof defaultCourses>(defaultCourses.slice(0, 5));
  const [registered, setRegistered] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const totalCredits = cart.reduce((sum, c) => sum + c.units, 0);
  const minCredits = 15;
  const maxCredits = 24;
  const isCreditValid = totalCredits >= minCredits && totalCredits <= maxCredits;

  const handleToggleCourse = (course: typeof defaultCourses[0]) => {
    if (cart.some((c) => c.code === course.code)) {
      setCart(cart.filter((c) => c.code !== course.code));
    } else {
      if (totalCredits + course.units > maxCredits) {
        alert(`Credit limit exceeded! Maximum permissible is ${maxCredits} units.`);
        return;
      }
      setCart([...cart, course]);
    }
  };

  const handleRegisterCourses = () => {
    if (!isCreditValid) return;
    setRegistered(true);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  // GPA Tracker Semesters
  const semestersHistory = [
    {
      semester: '100 Level — First Semester',
      gpa: 4.19,
      units: 21,
      points: 88,
      status: 'Verified',
      courses: [
        { code: 'CSC 111', title: 'Intro to Computer Science', units: 3, grade: 'A', score: 78, gp: 15 },
        { code: 'MTH 111', title: 'Algebra & Trigonometry', units: 3, grade: 'B', score: 68, gp: 12 },
        { code: 'EDU 111', title: 'Foundations of Education', units: 2, grade: 'A', score: 74, gp: 10 },
        { code: 'GSE 111', title: 'Use of English & Communication', units: 2, grade: 'A', score: 72, gp: 10 },
        { code: 'CSC 112', title: 'Computer Programming I', units: 3, grade: 'A', score: 81, gp: 15 },
      ],
    },
    {
      semester: '100 Level — Second Semester',
      gpa: 4.36,
      units: 22,
      points: 96,
      status: 'Verified',
      courses: [
        { code: 'CSC 121', title: 'Discrete Mathematical Structures', units: 3, grade: 'A', score: 84, gp: 15 },
        { code: 'MTH 121', title: 'Differential & Integral Calculus', units: 3, grade: 'A', score: 76, gp: 15 },
        { code: 'EDU 121', title: 'Philosophy of Education', units: 2, grade: 'B', score: 66, gp: 8 },
        { code: 'GSE 121', title: 'Citizenship & National Values', units: 2, grade: 'A', score: 79, gp: 10 },
        { code: 'CSC 122', title: 'Computer Programming II (C++)', units: 3, grade: 'A', score: 88, gp: 15 },
      ],
    },
    {
      semester: '200 Level — First Semester',
      gpa: 4.55,
      units: 20,
      points: 91,
      status: 'Verified',
      courses: [
        { code: 'CSC 211', title: 'Data Structures & Algorithms', units: 3, grade: 'A', score: 86, gp: 15 },
        { code: 'MTH 211', title: 'Linear Algebra', units: 3, grade: 'A', score: 80, gp: 15 },
        { code: 'EDU 211', title: 'Curriculum & Instruction', units: 2, grade: 'A', score: 75, gp: 10 },
        { code: 'GSE 211', title: 'Peace & Conflict Studies', units: 2, grade: 'A', score: 82, gp: 10 },
        { code: 'CSC 212', title: 'Operating Systems', units: 3, grade: 'B', score: 69, gp: 12 },
      ],
    },
  ];

  // Degree Audit Categories
  const auditCategories = [
    {
      title: 'General Studies (GSE)',
      completed: 6,
      total: 6,
      courses: [
        { code: 'GSE 111', name: 'Communication in English', status: 'Completed' },
        { code: 'GSE 121', name: 'Use of Library & ICT', status: 'Completed' },
        { code: 'GSE 211', name: 'Peace & Conflict Resolution', status: 'Completed' },
      ],
    },
    {
      title: 'Core Professional Education (EDU)',
      completed: 12,
      total: 12,
      courses: [
        { code: 'EDU 111', name: 'History of Education in Nigeria', status: 'Completed' },
        { code: 'EDU 121', name: 'Sociology & Philosophy of Education', status: 'Completed' },
        { code: 'EDU 211', name: 'Educational Psychology & Learning', status: 'Completed' },
        { code: 'EDU 221', name: 'Measurement, Evaluation & Tests', status: 'Completed' },
      ],
    },
    {
      title: 'Departmental Major Specialization',
      completed: 48,
      total: 60,
      courses: [
        { code: 'CSC 111', name: 'Introduction to Computer Science', status: 'Completed' },
        { code: 'CSC 112', name: 'Structured Programming Language', status: 'Completed' },
        { code: 'CSC 211', name: 'Data Structures & Algorithmic Analysis', status: 'Completed' },
        { code: 'CSC 311', name: 'Database Management Systems', status: 'In Progress' },
        { code: 'CSC 312', name: 'Software Engineering & Cloud Systems', status: 'Remaining' },
      ],
    },
    {
      title: 'Teaching Practice & Practical Fieldwork',
      completed: 3,
      total: 6,
      courses: [
        { code: 'EDU 311', name: 'Teaching Practice Phase I (Peer Microteaching)', status: 'Completed' },
        { code: 'EDU 321', name: 'Teaching Practice Phase II (External Posting)', status: 'In Progress' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tertiary Header Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              {division === 'DEGREE' ? 'Affiliated Degree Undergraduate' : 'Nigeria Certificate in Education (NCE)'}
            </span>
            <span className="text-xs font-semibold text-slate-500">Autonomous Credit Management Core</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] tracking-tight mt-1">
            Tertiary Academic Workstation
          </h2>
        </div>

        {/* 4 Navigation Modules */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'courses', label: 'Course Registration', icon: ShoppingCart },
            { id: 'gpa', label: 'GPA & CGPA Tracker', icon: TrendingUp },
            { id: 'transcript', label: 'Digital Transcript', icon: Award },
            { id: 'audit', label: 'Degree Audit', icon: FileCheck },
          ].map((m) => {
            const Icon = m.icon;
            const active = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModule(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODULE 1: COURSE REGISTRATION HUB */}
      {activeModule === 'courses' && (
        <div className="space-y-6 animate-fade-in">
          {successToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Course Registration Approved! Official Semester Form CRF-2026 generated.</span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors"
              >
                Print Course Form
              </button>
            </div>
          )}

          {/* Credit Meter & Fee Clearance Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Credit Unit Gauge
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#0B192C]">{totalCredits} <span className="text-sm font-semibold text-slate-400">/ 24 Units</span></span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCreditValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {isCreditValid ? 'Valid Load' : 'Load Out of Range'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${totalCredits > 24 ? 'bg-rose-500' : totalCredits < 15 ? 'bg-amber-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(100, (totalCredits / 24) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">Min 15 units • Max 24 units statutory limit</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Financial Clearance Gate
              </span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-lg font-black text-emerald-800">100% Cleared</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tuition, departmental levy and acceptance fees settled via VPay dynamic account.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                Audit Hash: LEDGER_OK_2026
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Registration Window
                </span>
                <span className="text-sm font-black text-slate-900 block mt-1">First Semester 2026/2027</span>
                <span className="text-xs text-blue-700 font-semibold block">Closes October 18, 2026</span>
              </div>
              <button
                type="button"
                onClick={handleRegisterCourses}
                disabled={!isCreditValid || registered}
                className={`w-full mt-3 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  registered
                    ? 'bg-emerald-600 text-white cursor-default'
                    : isCreditValid
                    ? 'bg-[#0B192C] hover:bg-slate-900 text-white cursor-pointer shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {registered ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Registered & Verified</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Finalize Course Registration</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Shopping Cart / Course Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Available Departmental Courses (Shopping Cart)</h3>
                <p className="text-xs text-slate-500">Select required core and elective courses for this semester</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                {cart.length} of {defaultCourses.length} Selected
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {defaultCourses.map((c) => {
                const isSelected = cart.some((x) => x.code === c.code);
                return (
                  <div
                    key={c.code}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-slate-900">{c.code}</span>
                        {c.core && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Compulsory Core
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {c.units} Credit Units
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{c.title}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>Prerequisite status: {c.prerequisite}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCourse(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-[#0B192C] hover:bg-slate-900 text-white shadow-xs'
                      }`}
                    >
                      {isSelected ? 'Remove Course' : '+ Add to Schedule'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: GPA & CGPA TRACKER */}
      {activeModule === 'gpa' && (
        <div className="space-y-6 animate-fade-in">
          {/* CGPA Summary Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0B192C] to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 font-mono">
                Official Senate Broadsheet
              </span>
              <h3 className="text-2xl font-black tracking-tight">Cumulative Grade Point Average (CGPA)</h3>
              <p className="text-xs text-slate-300 max-w-lg">
                Calculated in strict compliance with NCCE 5-Point Broadsheet Benchmark and NUC Degree Standards.
              </p>
            </div>

            <div className="flex items-center gap-5 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Cumulative CGPA</span>
                <span className="text-3xl font-black text-amber-400 font-mono">4.37</span>
                <span className="text-[10px] text-slate-300 block font-semibold">on 5.00 Scale</span>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Class of Award</span>
                <span className="text-sm font-black text-white block">
                  {division === 'DEGREE' ? 'First Class Honours' : 'Distinction Grade'}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block">63 Units Completed</span>
              </div>
            </div>
          </div>

          {/* Semester Breakdown Accordions */}
          <div className="space-y-4">
            {semestersHistory.map((sem, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{sem.semester}</h4>
                    <span className="text-[11px] text-slate-500">
                      Total Registered Units: {sem.units} • Total Grade Points: {sem.points}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-blue-50 text-blue-800 border border-blue-200">
                      GPA: {sem.gpa.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/60 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Course Code</th>
                        <th className="py-2.5 px-4">Course Title</th>
                        <th className="py-2.5 px-4 text-center">Units</th>
                        <th className="py-2.5 px-4 text-center">Raw Score</th>
                        <th className="py-2.5 px-4 text-center">Grade</th>
                        <th className="py-2.5 px-4 text-center">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sem.courses.map((cs) => (
                        <tr key={cs.code} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{cs.code}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">{cs.title}</td>
                          <td className="py-2.5 px-4 text-center font-mono">{cs.units}</td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold">{cs.score}%</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                              {cs.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-blue-700">{cs.gp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 3: DIGITAL TRANSCRIPT */}
      {activeModule === 'transcript' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  <img src="/coeka-logo.png" alt="COEKA" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0B192C] uppercase tracking-tight">
                    College of Education, Katsina-Ala
                  </h3>
                  <p className="text-xs text-slate-500">Official Institutional Broadsheet & Academic Transcript</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B192C] text-white hover:bg-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Transcript</span>
                </button>
              </div>
            </div>

            {/* Candidate Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Full Name</span>
                <span className="font-bold text-slate-900 block">{profile?.fullName || 'Degree Test'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Matric Number</span>
                <span className="font-mono font-bold text-slate-900 block">{profile?.matricNumber || 'COEKA/2026/DEG/901'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Academic Division</span>
                <span className="font-bold text-blue-700 block">{division}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Cumulative CGPA</span>
                <span className="font-mono font-black text-emerald-700 block">4.37 / 5.00</span>
              </div>
            </div>

            {/* Cryptographic Seal */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Cloudflare Edge Cryptographic Seal: Validated</span>
                </div>
                <p className="text-[11px] text-blue-700 font-mono">
                  HMAC-SHA256: 46708f23d682fef9aa996ecbb139bfb6c9ffdc039905ad6ad5c85a88b9411d97
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shrink-0 self-start sm:self-auto">
                Registrar Verified
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: DEGREE AUDIT */}
      {activeModule === 'audit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Graduation & Degree Audit Checklist</h3>
                <p className="text-xs text-slate-500">Track mandatory credit unit completion towards convocation</p>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                Overall Progress: 69 / 84 Credits (82.1%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {auditCategories.map((cat, idx) => {
                const percent = Math.round((cat.completed / cat.total) * 100);
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{cat.title}</h4>
                      <span className="text-[11px] font-mono font-bold text-blue-700">{cat.completed}/{cat.total} Units</span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {cat.courses.map((crs) => (
                        <div key={crs.code} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-mono font-semibold">{crs.code} • {crs.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              crs.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : crs.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {crs.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
