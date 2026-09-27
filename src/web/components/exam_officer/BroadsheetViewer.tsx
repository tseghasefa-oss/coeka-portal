import React, { useState } from 'react';
import {
  Table,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Printer,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  Award,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import {
  useBroadsheet,
  useCertifyBroadsheet,
  BroadsheetData,
} from '../../hooks/useExamOfficerData';

const DEPARTMENTS = [
  { id: 'dept-csc-001', name: 'Computer Science Education', code: 'CSC' },
  { id: 'dept-mth-001', name: 'Mathematics Education', code: 'MTH' },
  { id: 'dept-pes-001', name: 'Primary Education Studies', code: 'PES' },
  { id: 'dept-bio-001', name: 'Biology Education', code: 'BIO' },
  { id: 'dept-eng-001', name: 'English Language & Literary Studies', code: 'ENG' },
];

export function BroadsheetViewer() {
  const [selectedDeptId, setSelectedDeptId] = useState('dept-csc-001');
  const [selectedLevel, setSelectedLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'CARRY_OVER' | 'PROBATION'>('ALL');
  const [showCertifyModal, setShowCertifyModal] = useState(false);

  const { data: broadsheet, isLoading, refetch, isFetching } = useBroadsheet(
    selectedDeptId,
    selectedLevel
  );

  const certifyMutation = useCertifyBroadsheet();

  const filteredStudents = (broadsheet?.students || []).filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.matricNumber.toLowerCase().includes(q) ||
      s.studentName.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (statusFilter === 'PASSED') return s.status === 'GOOD_STANDING';
    if (statusFilter === 'CARRY_OVER') return s.status === 'CARRY_OVER';
    if (statusFilter === 'PROBATION') return s.status === 'PROBATION';

    return true;
  });

  const handleCertify = async () => {
    if (!broadsheet?.id) return;
    try {
      await certifyMutation.mutateAsync(broadsheet.id);
      setShowCertifyModal(false);
    } catch (e) {
      alert('Certification failed. Please retry.');
    }
  };

  const getGradeBadge = (grade: string, isPass: boolean) => {
    if (!isPass || grade === 'F' || grade === 'F9') {
      return 'bg-rose-100 text-rose-800 border-rose-300 font-black';
    }
    if (grade === 'A' || grade === 'A1') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
    }
    if (grade === 'B' || grade === 'B2' || grade === 'B3') {
      return 'bg-blue-100 text-blue-800 border-blue-200 font-bold';
    }
    if (grade === 'C' || grade === 'C4' || grade === 'C5' || grade === 'C6') {
      return 'bg-slate-100 text-slate-800 border-slate-200 font-semibold';
    }
    return 'bg-amber-100 text-amber-800 border-amber-200 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Control Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                Official Senate Broadsheet
              </span>
              <span className="text-xs text-slate-500">
                {broadsheet?.sessionName || '2026/2027 Academic Session'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{broadsheet?.departmentName || 'Computer Science Education'}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Level {selectedLevel}
              </span>
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
              title="Re-aggregate broadsheet from live database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Broadsheet</span>
            </button>

            {broadsheet?.status === 'CERTIFIED' ? (
              <span className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Certified & Locked</span>
              </span>
            ) : (
              <button
                onClick={() => setShowCertifyModal(true)}
                disabled={certifyMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Certify Broadsheet</span>
              </button>
            )}
          </div>
        </div>

        {/* Department & Level Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Select Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Select Level
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[100, 200, 300, 400].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    selectedLevel === lvl
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}L
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Filter by Standing
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Standings ({broadsheet?.students.length || 0})</option>
              <option value="PASSED">Passed All (Good Standing)</option>
              <option value="CARRY_OVER">With Carry-Over Courses</option>
              <option value="PROBATION">On Academic Probation</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Matric or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Dean Unapproved Draft Warnings Banner */}
      {broadsheet?.summary.unpublishedDraftsCount && broadsheet.summary.unpublishedDraftsCount > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-950">
              Dean Unapproved Draft Results Detected ({broadsheet.summary.unpublishedDraftsCount} entries)
            </h4>
            <p className="text-amber-800 leading-relaxed">
              <strong>Crucial Regulation:</strong> The Broadsheet only factors in results that have been formally{' '}
              <strong className="underline">PUBLISHED</strong> by the Dean. Courses marked with pending drafts are
              strictly excluded from GPA and CGPA calculations until the Dean approves them in the Oversight Desk.
            </p>
          </div>
        </div>
      ) : null}

      {/* Broadsheet Master Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Students</span>
          <strong className="text-2xl font-black text-slate-900">
            {broadsheet?.summary.totalStudents ?? 0}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Passed All</span>
          <strong className="text-2xl font-black text-emerald-700">
            {broadsheet?.summary.passedCount ?? 0}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-amber-600 uppercase block">Carry-Over</span>
          <strong className="text-2xl font-black text-amber-700">
            {broadsheet?.summary.carryOverCount ?? 0}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-rose-600 uppercase block">On Probation</span>
          <strong className="text-2xl font-black text-rose-700">
            {broadsheet?.summary.probationCount ?? 0}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-indigo-600 uppercase block">Class Avg CGPA</span>
          <strong className="text-2xl font-black text-indigo-700">
            {broadsheet?.summary.averageCgpa !== undefined ? broadsheet.summary.averageCgpa.toFixed(2) : '0.00'}
          </strong>
        </div>
      </div>

      {/* Master Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            {/* Header */}
            <thead className="bg-slate-900 text-white sticky top-0 z-20">
              <tr>
                <th className="py-3 px-3 w-10 text-center font-bold border-r border-slate-800">S/N</th>
                <th className="py-3 px-3 w-40 font-bold border-r border-slate-800">Matric Number</th>
                <th className="py-3 px-3 w-56 font-bold border-r border-slate-800">Student Full Name</th>

                {/* Course Columns */}
                {(broadsheet?.courses || []).map((c) => (
                  <th
                    key={c.courseId}
                    className="py-3 px-2 text-center font-bold border-r border-slate-800 min-w-[76px]"
                    title={`${c.courseTitle} (${c.creditUnits} Units)`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[11px]">{c.courseCode}</span>
                      <span className="text-[9px] text-slate-400 font-normal">
                        {c.creditUnits}U {c.hasUnpublishedDrafts && '⚠️'}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Academic Breakdown Columns */}
                <th className="py-3 px-2 text-center font-bold border-r border-slate-800 bg-slate-800 text-amber-300">
                  TCR
                </th>
                <th className="py-3 px-2 text-center font-bold border-r border-slate-800 bg-slate-800 text-emerald-300">
                  TCE
                </th>
                <th className="py-3 px-2 text-center font-bold border-r border-slate-800 bg-slate-800 text-slate-200">
                  TQP
                </th>
                <th className="py-3 px-2 text-center font-bold border-r border-slate-800 bg-indigo-950 text-indigo-300">
                  GPA
                </th>
                <th className="py-3 px-2 text-center font-bold border-r border-slate-800 bg-indigo-950 text-indigo-200 font-black">
                  CGPA
                </th>
                <th className="py-3 px-3 font-bold min-w-[140px]">Academic Standing</th>
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Compiling master session broadsheet from published grades...</span>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-500">
                    No student records found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const isProbation = s.status === 'PROBATION';
                  const isCarryOver = s.status === 'CARRY_OVER';

                  return (
                    <tr
                      key={s.studentId}
                      className={`hover:bg-slate-50/80 transition ${
                        isProbation
                          ? 'bg-rose-50/40'
                          : isCarryOver
                          ? 'bg-amber-50/30'
                          : idx % 2 === 1
                          ? 'bg-slate-50/30'
                          : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                        {s.matricNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 border-r border-slate-200 truncate max-w-[200px]">
                        {s.studentName}
                      </td>

                      {/* Course Results Cells */}
                      {(broadsheet?.courses || []).map((c) => {
                        const res = s.courses[c.courseCode];

                        if (!res) {
                          return (
                            <td
                              key={c.courseId}
                              className="py-2.5 px-2 text-center text-slate-300 font-mono border-r border-slate-200"
                            >
                              -
                            </td>
                          );
                        }

                        if (res.status === 'PENDING_APPROVAL') {
                          return (
                            <td
                              key={c.courseId}
                              className="py-2.5 px-2 text-center border-r border-slate-200 bg-amber-50"
                              title="Grade entered by Lecturer but pending Dean approval (excluded from GPA)"
                            >
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                                Draft
                              </span>
                            </td>
                          );
                        }

                        const badgeClass = getGradeBadge(res.letterGrade, res.isPass);

                        return (
                          <td
                            key={c.courseId}
                            className={`py-2.5 px-2 text-center border-r border-slate-200 ${
                              !res.isPass ? 'bg-rose-50/70' : ''
                            }`}
                          >
                            <div className="flex flex-col items-center leading-tight">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] border ${badgeClass}`}
                              >
                                {res.letterGrade}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {res.totalScore}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                        {s.totalCreditsRegistered}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700 border-r border-slate-200 bg-emerald-50/30">
                        {s.totalCreditsEarned}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">
                        {s.totalQualityPoints.toFixed(0)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-indigo-700 border-r border-slate-200 bg-indigo-50/30">
                        {s.gpa.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-indigo-900 border-r border-slate-200 bg-indigo-100/40">
                        {s.cgpa.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        {isProbation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Probation ({s.cgpa.toFixed(2)})
                          </span>
                        ) : isCarryOver ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Carry-Over: {s.carryOverCourses.join(', ')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Passed All
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Broadsheet Certification */}
      {showCertifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Certify & Archive Master Broadsheet?
                </h3>
                <p className="text-xs text-slate-500">
                  {broadsheet?.departmentName} • Level {selectedLevel}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Certifying this broadsheet locks the academic records for this session. It confirms that all published
              grades have undergone departmental and Dean verification, and allows these standing records to be
              presented to the College Academic Board and Senate.
            </p>

            {broadsheet?.summary.unpublishedDraftsCount && broadsheet.summary.unpublishedDraftsCount > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                ⚠️ <strong>Note:</strong> There are {broadsheet.summary.unpublishedDraftsCount} unapproved draft results.
                Certification will lock current published results only.
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCertifyModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCertify}
                disabled={certifyMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white shadow transition"
              >
                {certifyMutation.isPending ? 'Certifying...' : 'Confirm Certification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
