import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Award,
  Users,
  Building,
  AlertCircle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  MapPin,
  BookOpen,
} from 'lucide-react';
import { useStudentProfile } from '../../hooks/useStudentData';

export const SecondaryAcademicView: React.FC = () => {
  const { data: profile } = useStudentProfile();
  const [activeModule, setActiveModule] = useState<'reportCard' | 'timetable' | 'attendance' | 'exams'>('reportCard');

  // Secondary Subjects Continuous Assessment Data
  const subjectsReport = [
    { name: 'General Mathematics', ca1: 10, ca2: 9, project: 18, exam: 54, total: 91, grade: 'A1', remark: 'Distinction' },
    { name: 'English Language', ca1: 8, ca2: 9, project: 16, exam: 48, total: 81, grade: 'A1', remark: 'Distinction' },
    { name: 'Physics', ca1: 9, ca2: 8, project: 17, exam: 50, total: 84, grade: 'A1', remark: 'Distinction' },
    { name: 'Chemistry', ca1: 7, ca2: 8, project: 16, exam: 46, total: 77, grade: 'B2', remark: 'Very Good' },
    { name: 'Biology', ca1: 8, ca2: 9, project: 19, exam: 52, total: 88, grade: 'A1', remark: 'Distinction' },
    { name: 'Further Mathematics', ca1: 8, ca2: 7, project: 15, exam: 45, total: 75, grade: 'B2', remark: 'Very Good' },
    { name: 'Civic Education', ca1: 9, ca2: 9, project: 18, exam: 55, total: 91, grade: 'A1', remark: 'Distinction' },
    { name: 'Agricultural Science', ca1: 8, ca2: 8, project: 17, exam: 49, total: 82, grade: 'A1', remark: 'Distinction' },
    { name: 'Computer Studies (ICT)', ca1: 10, ca2: 10, project: 20, exam: 56, total: 96, grade: 'A1', remark: 'Distinction' },
  ];

  const totalScore = subjectsReport.reduce((acc, curr) => acc + curr.total, 0);
  const averageScore = (totalScore / subjectsReport.length).toFixed(1);

  // Affective & Psychomotor Traits
  const behavioralTraits = [
    { trait: 'Punctuality & Assembly Attendance', rating: 5, category: 'Affective' },
    { trait: 'Neatness & Uniform Compliance', rating: 5, category: 'Affective' },
    { trait: 'Honesty & Moral Integrity', rating: 5, category: 'Affective' },
    { trait: 'Leadership & Class Cooperation', rating: 4, category: 'Affective' },
    { trait: 'Handiwork, Craft & Drawing', rating: 5, category: 'Psychomotor' },
    { trait: 'Athletics & Sportsmanship', rating: 4, category: 'Psychomotor' },
    { trait: 'Laboratory Experiments & Dexterity', rating: 5, category: 'Psychomotor' },
  ];

  // Daily Timetable
  const weeklyTimetable = [
    {
      day: 'Monday',
      periods: [
        { time: '08:00 - 08:45 AM', subject: 'General Mathematics', teacher: 'Mr. Terfa Agba', room: 'Hall SS2-A' },
        { time: '08:45 - 09:30 AM', subject: 'English Language', teacher: 'Mrs. Dooshima Ukey', room: 'Hall SS2-A' },
        { time: '09:30 - 10:15 AM', subject: 'Physics (Theory)', teacher: 'Dr. Olufemi Adeyemi', room: 'Physics Lab' },
        { time: '10:15 - 11:00 AM', subject: 'Mid-Morning Break & Snacks', teacher: 'Duty Master', room: 'Cafeteria' },
        { time: '11:00 - 11:45 AM', subject: 'Chemistry (Organic)', teacher: 'Mrs. Janet Agbo', room: 'Chemistry Lab' },
        { time: '11:45 - 12:30 PM', subject: 'Computer Studies / Coding', teacher: 'Mr. Moses Iorliam', room: 'ICT Center 1' },
      ],
    },
    {
      day: 'Tuesday',
      periods: [
        { time: '08:00 - 08:45 AM', subject: 'Biology (Cell Biology)', teacher: 'Dr. Jerry Agba', room: 'Biology Lab' },
        { time: '08:45 - 09:30 AM', subject: 'Civic Education', teacher: 'Mr. Victor Chia', room: 'Hall SS2-A' },
        { time: '09:30 - 10:15 AM', subject: 'Further Mathematics', teacher: 'Mr. Terfa Agba', room: 'Hall SS2-A' },
        { time: '10:15 - 11:00 AM', subject: 'Recess & Games', teacher: 'Duty Master', room: 'Sports Field' },
        { time: '11:00 - 11:45 AM', subject: 'English Comprehension', teacher: 'Mrs. Dooshima Ukey', room: 'Hall SS2-A' },
        { time: '11:45 - 12:30 PM', subject: 'Physics Practical (Alt A)', teacher: 'Dr. Olufemi Adeyemi', room: 'Physics Lab' },
      ],
    },
    {
      day: 'Wednesday',
      periods: [
        { time: '08:00 - 08:45 AM', subject: 'General Mathematics', teacher: 'Mr. Terfa Agba', room: 'Hall SS2-A' },
        { time: '08:45 - 09:30 AM', subject: 'Agricultural Science', teacher: 'Mr. Gabriel Ikyur', room: 'School Farm' },
        { time: '09:30 - 10:15 AM', subject: 'Chemistry Practical', teacher: 'Mrs. Janet Agbo', room: 'Chemistry Lab' },
        { time: '10:15 - 11:00 AM', subject: 'Mid-Morning Break', teacher: 'Duty Master', room: 'Cafeteria' },
        { time: '11:00 - 11:45 AM', subject: 'Technical Drawing', teacher: 'Engr. Stephen Tsegha', room: 'Graphics Studio' },
        { time: '11:45 - 12:30 PM', subject: 'Literary & Debating Society', teacher: 'Patron', room: 'Assembly Hall' },
      ],
    },
  ];

  // External Exam Schedule
  const externalExams = [
    {
      exam: 'WAEC WASSCE (School Candidate May/June 2027)',
      candidateNo: '4081204092',
      center: 'COEKA Demonstration Secondary School (Center 40812)',
      hall: 'Science Block Hall B',
      seat: 'Desk #14',
      status: 'VERIFIED & REGISTERED',
      countdown: 'Upcoming in Term 3',
      papers: [
        { paper: 'General Mathematics (Obj & Essay)', date: 'May 18, 2027', time: '09:00 AM - 12:30 PM' },
        { paper: 'English Language (Oral, Essay, Obj)', date: 'May 22, 2027', time: '09:00 AM - 01:00 PM' },
        { paper: 'Physics 3 (Practical Alternative A)', date: 'May 28, 2027', time: '09:00 AM - 11:45 AM' },
        { paper: 'Chemistry 3 (Practical Alternative A)', date: 'June 02, 2027', time: '09:00 AM - 11:00 AM' },
      ],
    },
    {
      exam: 'NECO SSCE (National Examinations Council)',
      candidateNo: 'NC-2027-40812-092',
      center: 'COEKA Demonstration Secondary School',
      hall: 'Science Block Hall B',
      seat: 'Desk #14',
      status: 'BIOMETRICS CAPTURED',
      countdown: 'June/July 2027',
      papers: [
        { paper: 'Mathematics Paper I & II', date: 'June 14, 2027', time: '10:00 AM - 01:30 PM' },
        { paper: 'Biology Practical', date: 'June 19, 2027', time: '10:00 AM - 12:00 PM' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Secondary Header Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Demonstration Secondary School
            </span>
            <span className="text-xs font-semibold text-slate-500">Senior Secondary Track (SS2 Science A)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] tracking-tight mt-1">
            Secondary Student Academic Terminal
          </h2>
        </div>

        {/* 4 Navigation Modules */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'reportCard', label: 'Termly Report Card', icon: FileText },
            { id: 'timetable', label: 'Class Timetable', icon: Calendar },
            { id: 'attendance', label: 'Attendance Meter', icon: CheckCircle2 },
            { id: 'exams', label: 'Exam Notice Board', icon: Award },
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

      {/* MODULE 1: REPORT CARD VIEWER */}
      {activeModule === 'reportCard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Printable Report Card Sheet */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  <img src="/coeka-logo.png" alt="COEKA DSS" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0B192C] uppercase tracking-tight">
                    COEKA Demonstration Secondary School
                  </h3>
                  <p className="text-xs text-slate-500">Official Continuous Assessment Terminal Broadsheet & Report Card</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B192C] text-white hover:bg-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Report Card</span>
              </button>
            </div>

            {/* Candidate & Term Summary Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Student Name</span>
                <span className="font-bold text-slate-900 block">{profile?.fullName || 'Sec Test'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Admission / Roll No.</span>
                <span className="font-mono font-bold text-slate-900 block">{profile?.matricNumber || 'DSS/2026/SEC/903'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Class & Stream</span>
                <span className="font-bold text-emerald-800 block">Senior Secondary 2 (SS2 Science)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Position in Class</span>
                <span className="font-black text-blue-700 block">3rd out of 38 Pupils</span>
              </div>
            </div>

            {/* Academic Performance Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-3 text-center">Test 1 (10)</th>
                    <th className="py-3 px-3 text-center">Test 2 (10)</th>
                    <th className="py-3 px-3 text-center">Project (20)</th>
                    <th className="py-3 px-3 text-center">Exam (60)</th>
                    <th className="py-3 px-3 text-center">Total (100)</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectsReport.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{s.ca1}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{s.ca2}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{s.project}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{s.exam}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">{s.total}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {s.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{s.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Average & Grade Metrics */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs gap-3">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-sm font-black text-emerald-950 block">Cumulative Average: {averageScore}%</span>
                  <span className="text-[11px] text-emerald-800">Total Marks Obtained: {totalScore} / 900</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-700 text-white font-black text-xs rounded-full">
                Promotion Status: Distinction Cleared
              </span>
            </div>

            {/* Affective & Psychomotor Domain */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Affective & Psychomotor Behavioral Domain (Rating 1 - 5)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {behavioralTraits.map((t, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{t.trait}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      {'★'.repeat(t.rating)}
                      <span className="text-slate-400 font-mono text-[10px]">({t.rating}/5)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Remarks & Endorsements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Class Teacher's Remark</span>
                <p className="text-xs text-slate-700 italic">
                  "An exceptionally diligent, brilliant, and well-behaved science scholar. Keep up the high standard."
                </p>
                <span className="text-[10px] font-mono text-slate-500 block pt-2">— Mr. Moses Iorliam (B.Sc Ed, HOD Science)</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Principal's Endorsement</span>
                <p className="text-xs text-slate-700 italic">
                  "Outstanding academic result. Approved for direct senior registration and WAEC candidate screening."
                </p>
                <span className="text-[10px] font-mono text-slate-500 block pt-2">— Dr. (Mrs) Bridget Tyav (Principal, DSS)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: CLASS TIMETABLE */}
      {activeModule === 'timetable' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Subject Roster & Timetable</h3>
                <p className="text-xs text-slate-500">SS2 Science Stream — First Term 2026/2027</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                School Hours: 07:45 AM - 02:00 PM
              </span>
            </div>

            <div className="space-y-4">
              {weeklyTimetable.map((dayPlan, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-3 bg-slate-100 font-black text-xs text-slate-800 flex items-center justify-between">
                    <span>{dayPlan.day} Schedule</span>
                    <span className="text-[10px] font-medium text-slate-500">{dayPlan.periods.length} Instructional Periods</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {dayPlan.periods.map((p, pIdx) => (
                      <div key={pIdx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded w-36 text-center">
                            {p.time}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.subject}</span>
                            <span className="text-[11px] text-slate-500">Instructor: {p.teacher}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">
                          <MapPin className="w-3 h-3" />
                          {p.room}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: ATTENDANCE METER */}
      {activeModule === 'attendance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white border border-emerald-800 shadow-md space-y-4">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                Term Attendance Gauge
              </span>
              <div className="text-center py-4">
                <span className="text-5xl font-black text-emerald-400 font-mono">96.7%</span>
                <span className="text-xs text-slate-300 block mt-1">Total Term Attendance</span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 text-xs text-emerald-200 text-center font-medium">
                Punctuality Rating: Exemplary (Zero Truancy)
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Session Ledger Breakdown
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Total Statutory School Days</span>
                  <span className="font-mono font-bold text-slate-900">120 Days</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-900 font-semibold">
                  <span>Days Physically Present</span>
                  <span className="font-mono font-bold text-emerald-700">116 Days</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 text-amber-900 font-semibold">
                  <span>Authorized Medical Leave</span>
                  <span className="font-mono font-bold text-amber-700">4 Days</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 text-rose-900 font-semibold">
                  <span>Unexcused Truancy</span>
                  <span className="font-mono font-bold text-rose-700">0 Days</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Attendance Streak
                </span>
                <div className="text-3xl font-black text-[#0B192C] mt-2">42 Days</div>
                <p className="text-xs text-slate-500 mt-1">
                  Continuous consecutive school attendance without late coming or absence.
                </p>
              </div>
              <span className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200">
                Eligible for Terminal Perfect Attendance Award
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: EXAM NOTICE BOARD */}
      {activeModule === 'exams' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">National & External Examinations Desk</h3>
              <p className="text-xs text-slate-500">WAEC, NECO, and BECE examination registrations and assigned halls</p>
            </div>

            <div className="space-y-5">
              {externalExams.map((ex, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{ex.exam}</h4>
                      <p className="text-xs text-slate-500">Center: {ex.center}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                      {ex.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate Exam No.</span>
                      <span className="font-mono font-bold text-slate-900">{ex.candidateNo}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Hall & Desk</span>
                      <span className="font-bold text-emerald-800">{ex.hall} • {ex.seat}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Exam Timetable</span>
                      <span className="font-bold text-blue-700">{ex.countdown}</span>
                    </div>
                  </div>

                  {/* Scheduled Papers */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Scheduled Subject Papers
                    </span>
                    <div className="divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                      {ex.papers.map((p, pIdx) => (
                        <div key={pIdx} className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-800">{p.paper}</span>
                          <span className="font-mono text-slate-500 text-[11px]">{p.date} • {p.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
