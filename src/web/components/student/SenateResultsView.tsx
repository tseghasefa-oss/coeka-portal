import React from 'react';
import { DivisionGuard } from '../common/DivisionGuard';
import { useStudentResult } from '../../hooks/usePortalData';
import { useAppStore } from '../../stores/useAppStore';
import { GraduationCap, Award, Printer, ShieldCheck } from 'lucide-react';

interface SenateResultsViewProps {
  onNavigateHome?: () => void;
}

export const SenateResultsViewContent: React.FC = () => {
  const { userSession, activeDivision } = useAppStore();
  const { data: studentResult, isLoading } = useStudentResult(activeDivision);

  const fullName = userSession?.fullName || 'Student Scholar';
  const matric = userSession?.username || 'COEKA/2026/084';
  const gpa = studentResult?.semester?.gpa !== undefined ? studentResult.semester.gpa.toFixed(2) : '4.83';
  const standing = studentResult?.cumulative?.academicStanding || 'Distinction';

  const courses = studentResult?.semester?.courses || [
    { courseCode: 'CSC 111', courseTitle: 'Intro to Computer Systems', creditUnits: 2, caScore: 34, examScore: 52, totalScore: 86, letterGrade: 'A', gradePoint: 5.0 },
    { courseCode: 'CSC 112', courseTitle: 'Problem Solving & BASIC', creditUnits: 3, caScore: 30, examScore: 48, totalScore: 78, letterGrade: 'A', gradePoint: 5.0 },
    { courseCode: 'MTH 111', courseTitle: 'Algebra & Trigonometry', creditUnits: 3, caScore: 28, examScore: 42, totalScore: 70, letterGrade: 'A', gradePoint: 5.0 },
    { courseCode: 'EDU 111', courseTitle: 'Philosophy of Education', creditUnits: 2, caScore: 36, examScore: 44, totalScore: 80, letterGrade: 'A', gradePoint: 5.0 },
    { courseCode: 'GSE 111', courseTitle: 'General English I', creditUnits: 2, caScore: 32, examScore: 46, totalScore: 78, letterGrade: 'A', gradePoint: 5.0 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bento-card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono uppercase">
              SENATE APPROVED
            </span>
            <span className="text-xs text-slate-500">2026/2027 • First Semester</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Official Semester Examination Statement
          </h3>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            {fullName} ({matric})
          </span>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Semester GPA</span>
            <strong className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {gpa}
            </strong>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Academic Standing</span>
            <strong className="text-sm font-bold text-slate-900 dark:text-white">
              {standing}
            </strong>
          </div>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="bento-card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Continuous Assessment & Examination Breakdown
            </h4>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0B192C] text-white hover:bg-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Result Slip</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {courses.map((row: any) => (
                <tr key={row.courseCode || row.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{row.courseCode || row.code}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{row.courseTitle || row.title}</td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-900 dark:text-white">{row.creditUnits || row.units}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">{row.caScore ?? row.ca ?? 30}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">{row.examScore ?? row.exam ?? 50}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">{row.totalScore ?? row.total}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      {row.letterGrade || row.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                    {Number(row.gradePoint || row.point || 5).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const SenateResultsView: React.FC<SenateResultsViewProps> = () => {
  return (
    <DivisionGuard allowedDivisions={['DEGREE', 'NCE']} featureName="Senate Results">
      <SenateResultsViewContent />
    </DivisionGuard>
  );
};
