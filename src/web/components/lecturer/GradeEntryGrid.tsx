import React, { useState, useEffect } from 'react';
import {
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  AlertTriangle,
  Lock,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { CourseRosterItem, useSubmitGrades, usePublishResults } from '../../hooks/useLecturerData';
import { GradingPolicyEngine } from '../../../services/academic/gradingPolicyEngine';
import { GradingPolicy } from '../../../types/domain';

interface GradeRowState {
  studentId: string;
  matricNumber: string;
  fullName: string;
  division: string;
  gradingPolicy: GradingPolicy;
  ca1Score: number;
  ca2Score: number;
  caTotal: number;
  examScore: number;
  totalScore: number;
  letterGrade: string;
  gradePoint: number;
  isPass: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  isDirty?: boolean;
}

interface GradeEntryGridProps {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  divisionName?: string;
  roster: CourseRosterItem[];
  onRefresh?: () => void;
}

export const GradeEntryGrid: React.FC<GradeEntryGridProps> = ({
  courseId,
  courseCode,
  courseTitle,
  creditUnits,
  divisionName,
  roster,
  onRefresh,
}) => {
  const submitGradesMutation = useSubmitGrades(courseId);
  const publishResultsMutation = usePublishResults(courseId);

  // Local grid editable state
  const [rows, setRows] = useState<GradeRowState[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Determine course default policy based on division name or course code
  const getPolicyForDivision = (div: string): GradingPolicy => {
    if (div.includes('Degree')) return 'NUC_DEGREE_5_POINT';
    if (div.includes('Secondary') || div.includes('Demonstration')) return 'SECONDARY_WAEC';
    if (div.includes('Primary') || div.includes('Basic')) return 'PRIMARY_BASIC';
    return 'NCCE_5_POINT';
  };

  // Sync rows from incoming roster
  useEffect(() => {
    if (!roster || roster.length === 0) return;

    const initialRows: GradeRowState[] = roster.map((s) => {
      const policy = getPolicyForDivision(s.division || divisionName || '');
      const existingGrade = s.grade;

      const ca1 = existingGrade?.ca1Score ?? (existingGrade?.caTotal ? Math.round(existingGrade.caTotal / 2) : 0);
      const ca2 = existingGrade?.ca2Score ?? (existingGrade?.caTotal ? existingGrade.caTotal - ca1 : 0);
      const exam = existingGrade?.examScore ?? 0;
      const caTotal = ca1 + ca2;
      const total = existingGrade?.totalScore ?? (caTotal + exam);

      const evaluation = total > 0 ? GradingPolicyEngine.evaluateScore(total, policy) : {
        letterGrade: '-',
        gradePoint: 0.0,
        isPass: false,
      };

      return {
        studentId: s.studentId,
        matricNumber: s.matricNumber,
        fullName: s.fullName,
        division: s.division,
        gradingPolicy: policy,
        ca1Score: ca1,
        ca2Score: ca2,
        caTotal,
        examScore: exam,
        totalScore: total,
        letterGrade: existingGrade?.letterGrade || evaluation.letterGrade,
        gradePoint: existingGrade?.gradePoint ?? evaluation.gradePoint,
        isPass: evaluation.isPass,
        status: existingGrade?.status || 'DRAFT',
        isDirty: false,
      };
    });

    setRows(initialRows);
  }, [roster, divisionName]);

  // Handle cell edits
  const handleScoreChange = (
    index: number,
    field: 'ca1Score' | 'ca2Score' | 'examScore',
    value: string
  ) => {
    const numVal = Math.max(0, Number(value) || 0);

    setRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (field === 'ca1Score') {
        row.ca1Score = Math.min(20, numVal); // Max 20 points
      } else if (field === 'ca2Score') {
        row.ca2Score = Math.min(20, numVal); // Max 20 points
      } else if (field === 'examScore') {
        row.examScore = Math.min(60, numVal); // Max 60 points
      }

      row.caTotal = row.ca1Score + row.ca2Score;
      row.totalScore = row.caTotal + row.examScore;

      const evaluation = GradingPolicyEngine.evaluateScore(row.totalScore, row.gradingPolicy);
      row.letterGrade = evaluation.letterGrade;
      row.gradePoint = evaluation.gradePoint;
      row.isPass = evaluation.isPass;
      row.isDirty = true;

      updated[index] = row;
      return updated;
    });
  };

  // Save all draft scores
  const handleSaveDraft = async () => {
    try {
      const payload = rows.map((r) => ({
        studentId: r.studentId,
        ca1Score: r.ca1Score,
        ca2Score: r.ca2Score,
        examScore: r.examScore,
      }));

      await submitGradesMutation.mutateAsync({ grades: payload });
      setNotification({
        type: 'success',
        message: `Successfully saved ${rows.length} grade sheets in DRAFT state. Results are preserved securely and hidden from students until published.`,
      });

      // Clear dirty flags
      setRows((prev) => prev.map((r) => ({ ...r, isDirty: false })));
      onRefresh?.();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save draft scores.',
      });
    }
  };

  // Publish Results to Students
  const handleConfirmPublish = async () => {
    try {
      // First save any unsaved edits
      const payload = rows.map((r) => ({
        studentId: r.studentId,
        ca1Score: r.ca1Score,
        ca2Score: r.ca2Score,
        examScore: r.examScore,
      }));
      await submitGradesMutation.mutateAsync({ grades: payload });

      // Then transition status to PUBLISHED
      const res = await publishResultsMutation.mutateAsync();
      setShowPublishModal(false);

      setNotification({
        type: 'success',
        message: `Official Results Released! ${res.publishedCount || rows.length} student grades for ${courseCode} are now live and visible on the Student Portal.`,
      });

      setRows((prev) =>
        prev.map((r) => ({ ...r, status: 'PUBLISHED', isDirty: false }))
      );
      onRefresh?.();
    } catch (err: any) {
      setShowPublishModal(false);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to publish results.',
      });
    }
  };

  // Summary statistics
  const totalStudents = rows.length;
  const gradedRows = rows.filter((r) => r.totalScore > 0);
  const averageScore =
    gradedRows.length > 0
      ? (gradedRows.reduce((acc, r) => acc + r.totalScore, 0) / gradedRows.length).toFixed(1)
      : '0.0';
  const passRows = gradedRows.filter((r) => r.isPass);
  const passRate =
    gradedRows.length > 0
      ? Math.round((passRows.length / gradedRows.length) * 100)
      : 0;
  const publishedCount = rows.filter((r) => r.status === 'PUBLISHED').length;
  const isAllPublished = totalStudents > 0 && publishedCount === totalStudents;
  const hasUnsavedChanges = rows.some((r) => r.isDirty);

  return (
    <div className="space-y-6">
      {/* Header Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : notification.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-900'
              : 'bg-blue-50 border border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Draft Visibility Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300 text-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <strong className="block font-bold text-amber-950">
              Student Visibility Gate Active
            </strong>
            <span className="text-slate-600">
              Grades remain in <span className="font-bold text-amber-800">DRAFT</span> status until you explicitly click &ldquo;Publish Results to Students&rdquo;. Students cannot view unratified scores.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
              isAllPublished
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {isAllPublished ? (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                RESULTS PUBLISHED
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                STATUS: DRAFT MODE
              </>
            )}
          </span>
        </div>
      </div>

      {/* Class Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Course Details</span>
          <div className="mt-1">
            <strong className="text-base font-extrabold text-slate-900">{courseCode}</strong>
            <span className="text-xs text-slate-500 block">{creditUnits} Credit Units</span>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Class Average</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-slate-900">{averageScore}</strong>
            <span className="text-xs text-slate-500 font-medium">/ 100</span>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pass Rate</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-emerald-700">{passRate}%</strong>
            <span className="text-xs text-slate-500 font-medium">
              ({passRows.length}/{gradedRows.length})
            </span>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Publication State</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-blue-700">
              {publishedCount}/{totalStudents}
            </strong>
            <span className="text-xs text-slate-500 font-medium">live</span>
          </div>
        </div>
      </div>

      {/* Grade Entry Spreadsheet Card */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Score Entry Grid: {courseCode} - {courseTitle}
            </h3>
            <p className="text-xs text-slate-500">
              CA1 (Max 20) + CA2 (Max 20) + Examination (Max 60) = Total Score (Max 100)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={submitGradesMutation.isPending}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                hasUnsavedChanges
                  ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitGradesMutation.isPending ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={() => setShowPublishModal(true)}
              disabled={publishResultsMutation.isPending}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publish Results to Students</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Matric / Reg No</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3 text-center">CA1 (20)</th>
                <th className="py-2.5 px-3 text-center">CA2 (20)</th>
                <th className="py-2.5 px-3 text-center">CA Total (40)</th>
                <th className="py-2.5 px-3 text-center">Exam (60)</th>
                <th className="py-2.5 px-3 text-center">Total (100)</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3 text-center">Point</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr
                  key={row.studentId}
                  className={`hover:bg-slate-50/80 transition ${
                    row.isDirty ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">
                    {row.matricNumber}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {row.fullName}
                  </td>
                  {/* CA1 Input */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={row.ca1Score || ''}
                      onChange={(e) => handleScoreChange(idx, 'ca1Score', e.target.value)}
                      placeholder="0"
                      className="w-14 px-2 py-1 text-center rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </td>
                  {/* CA2 Input */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={row.ca2Score || ''}
                      onChange={(e) => handleScoreChange(idx, 'ca2Score', e.target.value)}
                      placeholder="0"
                      className="w-14 px-2 py-1 text-center rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </td>
                  {/* CA Total (Calculated) */}
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                    {row.caTotal}
                  </td>
                  {/* Exam Input */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={row.examScore || ''}
                      onChange={(e) => handleScoreChange(idx, 'examScore', e.target.value)}
                      placeholder="0"
                      className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </td>
                  {/* Total Score (Calculated) */}
                  <td className="py-2 px-3 text-center font-mono font-black text-slate-900 bg-slate-50">
                    {row.totalScore}
                  </td>
                  {/* Letter Grade */}
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        row.isPass
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.totalScore > 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {row.letterGrade}
                    </span>
                  </td>
                  {/* Grade Point */}
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                    {row.gradePoint.toFixed(1)}
                  </td>
                  {/* Publication Status */}
                  <td className="py-2 px-3 text-center">
                    {row.status === 'PUBLISHED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        PUBLISHED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        DRAFT
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {hasUnsavedChanges ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Unsaved score changes in memory. Click &ldquo;Save Draft&rdquo; to persist to ledger.
              </span>
            ) : (
              <span>All scores synchronized with Cloudflare D1 ledger.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={submitGradesMutation.isPending}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft Scores</span>
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              disabled={publishResultsMutation.isPending}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish to Students</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Publish Results */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Publish Official Course Results?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm publishing grades for <span className="font-bold text-slate-800">{courseCode}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Student Visibility Gate Warning:
              </p>
              <p>
                By publishing, all {rows.length} student scores will immediately transition from <strong>DRAFT</strong> to <strong>PUBLISHED</strong>. Students will be able to see their semester examination statement and GPA in the Student Portal.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPublish}
                disabled={publishResultsMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                {publishResultsMutation.isPending ? 'Publishing...' : 'Yes, Release Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
