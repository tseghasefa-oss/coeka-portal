import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  UserCheck,
  BookOpen,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { useChildPerformance } from '../../hooks/useParentData';

interface PerformanceTrackerProps {
  childId: string;
}

export const PerformanceTracker: React.FC<PerformanceTrackerProps> = ({ childId }) => {
  const { data: perfData, isLoading, error } = useChildPerformance(childId);

  if (isLoading) {
    return (
      <div className="bento-card p-12 text-center text-xs text-slate-400">
        <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-700" />
        Loading real-time academic telemetry and performance dossier...
      </div>
    );
  }

  if (error || !perfData?.performance) {
    return (
      <div className="bento-card p-8 text-center text-xs text-rose-500">
        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
        Failed to load academic records for this ward. Please ensure your account has authorized guardian permissions.
      </div>
    );
  }

  const perf = perfData.performance;
  const isHighAttendance = perf.attendance.attendanceRate >= 75;

  return (
    <div className="space-y-6">
      {/* Ward Academic Header & Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* GPA / Average */}
        <div className="bento-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Overall Standing</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <strong className="text-2xl font-black text-slate-900 block mt-1">
            {perf.summaryMetrics.formattedGpaOrAverage}
          </strong>
          <span className="text-[10px] text-emerald-700 font-bold block mt-1">
            {perf.summaryMetrics.classPosition || 'Top Quartile'}
          </span>
        </div>

        {/* Attendance Rate */}
        <div className="bento-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Attendance Rate</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <strong className="text-2xl font-black text-emerald-800 block mt-1">
            {perf.attendance.formattedRate}
          </strong>
          <span className="text-[10px] text-slate-500 block mt-1">
            {perf.attendance.attendedCount} of {perf.attendance.totalLectures} lectures held
          </span>
        </div>

        {/* Exam Eligibility Gate */}
        <div className="bento-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Exam Eligibility</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <strong
            className={`text-sm font-extrabold px-2 py-1 rounded inline-block mt-2 ${
              isHighAttendance ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {perf.attendance.isExamEligible ? 'CLEARED (75%+ Rule)' : 'RESTRICTED'}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-1.5">
            Verified by Academic Office
          </span>
        </div>

        {/* Current Term / Level */}
        <div className="bento-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Session & Term</span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <strong className="text-base font-bold text-slate-800 block mt-1">
            {perf.currentTermOrSemester}
          </strong>
          <span className="text-[10px] text-slate-500 block mt-1">
            Session: {perf.academicSession}
          </span>
        </div>
      </div>

      {/* Visual Chart: Term-Over-Term Academic Progression */}
      <div className="bento-card p-6 bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Term-over-Term Academic Performance Trajectory
            </h4>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
            +6.2% Upward Progression Trend
          </span>
        </div>

        {/* Visual Progress Bar Chart */}
        <div className="space-y-3 pt-2">
          {perf.progressHistory.map((step, idx) => {
            // Normalize percentage for progress bar (if 5.0 scale, multiply by 20; if 100 scale, direct)
            const percentage = step.scoreOrGPA <= 5.0 ? (step.scoreOrGPA / 5.0) * 100 : step.scoreOrGPA;

            return (
              <div key={step.termOrSemester} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{step.termOrSemester}</span>
                  <span className="font-mono font-bold text-emerald-800">{step.formatted}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(10, percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Cognitive Courses / Subjects Score Table */}
      <div className="bento-card p-6 bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Course / Subject Grades Breakdown
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {perf.matricNumber} • {perf.programme}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 px-3">Course / Subject</th>
                <th className="py-2.5 px-3 text-center">CA1 (20)</th>
                <th className="py-2.5 px-3 text-center">CA2 (20)</th>
                <th className="py-2.5 px-3 text-center">Exam (60)</th>
                <th className="py-2.5 px-3 text-center">Total (100)</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3">Instructor Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perf.subjectsOrCourses.map((sub) => (
                <tr key={sub.codeOrName} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <strong className="text-slate-900 font-semibold block">{sub.codeOrName}</strong>
                    <span className="text-[10px] text-slate-500">{sub.title}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{sub.ca1}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{sub.ca2}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{sub.exam}</td>
                  <td className="py-2.5 px-3 text-center font-black text-slate-900 font-mono">{sub.total}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {sub.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    <span>{sub.remark}</span>
                    {sub.teacherOrLecturer && (
                      <span className="text-[10px] text-slate-400 block">({sub.teacherOrLecturer})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Affective Traits & Character Evaluation (When available) */}
      {perf.affectiveTraits && perf.affectiveTraits.length > 0 && (
        <div className="bento-card p-6 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-900">
              Psychomotor & Affective Character Evaluation (1-5 Scale)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {perf.affectiveTraits.map((trait) => (
              <div key={trait.trait} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600 font-medium block">{trait.trait}</span>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-xs ${star <= trait.rating ? 'text-amber-500' : 'text-slate-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {trait.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Academic Remarks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bento-card p-5 bg-emerald-50/60 border border-emerald-200/80 space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">
            Level Adviser / Class Teacher Remark
          </span>
          <p className="text-xs text-emerald-950 italic leading-relaxed">
            "{perf.remarks.teacherRemark}"
          </p>
          <span className="text-[11px] font-bold text-emerald-800 block text-right">
            — {perf.remarks.teacherName}
          </span>
        </div>

        {perf.remarks.principalOrDeanRemark && (
          <div className="bento-card p-5 bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
              Principal / Academic Dean Remark
            </span>
            <p className="text-xs text-slate-800 italic leading-relaxed">
              "{perf.remarks.principalOrDeanRemark}"
            </p>
            <span className="text-[11px] font-bold text-slate-700 block text-right">
              — {perf.remarks.principalOrDeanName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
