import React from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Printer,
  Sparkles,
  Star,
  UserCheck,
  Building,
  Clock,
} from 'lucide-react';
import { useStudentReportCard } from '../../hooks/useStudentData';

export const ReportCardView: React.FC = () => {
  const { data: reportCard, isLoading } = useStudentReportCard();

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="bento-card p-12 text-center text-xs text-slate-400">
        <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-700" />
        Generating terminal report card and academic assessment...
      </div>
    );
  }

  const student = reportCard?.studentInfo;
  const subjects = reportCard?.subjects || [];
  const affective = reportCard?.affectiveTraits || [];
  const psychomotor = reportCard?.psychomotorSkills || [];
  const remarks = reportCard?.remarks;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Basic Education Termly Continuous Assessment Dossier
          </h3>
          <p className="text-xs text-slate-500">
            Official terminal report card and behavioral psychomotor assessment sheet
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Report Card</span>
        </button>
      </div>

      {/* Main Printable Report Card Sheet */}
      <div className="bento-card p-8 bg-white border border-slate-200 shadow-md space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="text-center pb-6 border-b-2 border-emerald-900/20 space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-black mx-auto mb-2 shadow-sm">
            <Building className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {reportCard?.institution || 'College Demonstration Secondary School, Katsina-Ala'}
          </h2>
          <p className="text-xs italic text-emerald-800 font-semibold">
            &ldquo;{reportCard?.motto || 'Excellence in Pedagogy & Morals'}&rdquo;
          </p>
          <div className="flex justify-center items-center gap-3 text-xs text-slate-600 pt-1 font-medium">
            <span>Session: <strong>{reportCard?.academicSession || '2026/2027'}</strong></span>
            <span>•</span>
            <span>Term: <strong>{reportCard?.term || 'First Term'}</strong></span>
          </div>
        </div>

        {/* Student Profile & Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Candidate Name</span>
            <strong className="text-slate-900 font-bold">{student?.fullName || 'Ngodoo Blessing Tsegha'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Admission / Reg No</span>
            <strong className="text-slate-900 font-mono font-bold">{student?.regNo || 'COEKA/DEMO/2026/SS2/012'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Class / Arm</span>
            <strong className="text-slate-900 font-bold">{student?.classLevel || 'Senior Secondary 2 (SS2 Science)'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Terminal Position</span>
            <strong className="text-emerald-700 font-bold">{student?.positionInClass || '2nd of 42 Students'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attendance Score</span>
            <strong className="text-slate-900 font-bold">{student?.attendanceScore || '96% (68 of 70 days)'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Times Punctual</span>
            <strong className="text-slate-900 font-bold">{student?.timesPunctual || 66} Days</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Class Average</span>
            <strong className="text-slate-900 font-bold">{student?.classAverage || 68.4}%</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student Average</span>
            <strong className="text-emerald-700 font-black text-sm">{student?.studentAverage || 82.5}%</strong>
          </div>
        </div>

        {/* Academic Subjects Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Cognitive Academic Performance (WAEC Standard)
          </h4>
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
                  <th className="py-2.5 px-3">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{sub.name}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{sub.ca1}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{sub.ca2}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{sub.exam}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{sub.total}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {sub.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 italic text-[11px]">{sub.remark}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] font-medium">{sub.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Affective & Psychomotor Behavioral Evaluation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Affective Domain */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              Affective Development & Conduct
            </h5>
            <div className="space-y-2">
              {affective.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">{item.trait}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-slate-500 font-semibold ml-1">
                      ({item.description})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Psychomotor Domain */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              Psychomotor Skills & Practical Aptitude
            </h5>
            <div className="space-y-2">
              {psychomotor.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">{item.skill}</span>
                  <div className="flex items-center gap-1 text-emerald-600">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < item.rating ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-slate-500 font-semibold ml-1">
                      ({item.description})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Remarks & Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Class Teacher&apos;s Remark</span>
            <p className="italic text-slate-800 leading-relaxed font-medium">&ldquo;{remarks?.classTeacherRemark}&rdquo;</p>
            <span className="font-bold text-emerald-800 block pt-1">{remarks?.classTeacherName}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Principal&apos;s Certification & Stamp</span>
            <p className="italic text-slate-800 leading-relaxed font-medium">&ldquo;{remarks?.principalRemark}&rdquo;</p>
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-bold text-emerald-800">{remarks?.principalName}</span>
              <span className="text-[10px] text-slate-500 font-semibold">Resumption: {remarks?.nextTermResumption}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
