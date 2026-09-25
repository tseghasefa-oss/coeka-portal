import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  BookOpen,
  Award,
  Users,
  Search,
  Check,
  ShieldCheck,
  Send,
  BarChart3,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import {
  useDeanApprovalQueue,
  useCourseReview,
  useApproveResults,
  PendingCourseQueueItem,
} from '../../hooks/useDeanData';

export function ApprovalQueue() {
  const { data: queue, isLoading, refetch } = useDeanApprovalQueue();
  const approveMutation = useApproveResults();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [confirmApproveModal, setConfirmApproveModal] = useState(false);
  const [deanComments, setDeanComments] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data: courseReview, isLoading: reviewLoading } = useCourseReview(selectedCourseId);

  const filteredQueue = (queue || []).filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.courseCode.toLowerCase().includes(q) ||
      item.courseTitle.toLowerCase().includes(q) ||
      item.lecturerName.toLowerCase().includes(q) ||
      (item.departmentName && item.departmentName.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (filterStatus === 'PENDING') return item.draftCount > 0;
    if (filterStatus === 'APPROVED') return item.draftCount === 0 && item.publishedCount > 0;
    return true;
  });

  const handleApprove = async () => {
    if (!selectedCourseId) return;
    try {
      const res = await approveMutation.mutateAsync({
        courseId: selectedCourseId,
        comments: deanComments || 'Approved and published by Academic Dean following Faculty Board moderation.',
      });
      setConfirmApproveModal(false);
      setDeanComments('');
      setSuccessToast(`Successfully approved and released results for ${res.courseCode || 'course'} (${res.approvedCount} students).`);
      refetch();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to approve results');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* If a course is selected for deep review */}
      {selectedCourseId && courseReview ? (
        <div className="space-y-6">
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setSelectedCourseId(null)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Approval Queue</span>
            </button>

            <div className="flex items-center gap-3">
              {courseReview.metrics.draftCount > 0 ? (
                <button
                  onClick={() => setConfirmApproveModal(true)}
                  disabled={approveMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Review & Approve Results ({courseReview.metrics.draftCount} Drafts)</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                  <Check className="w-4 h-4" />
                  <span>All Results Published</span>
                </div>
              )}
            </div>
          </div>

          {/* Course Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-black tracking-wider uppercase">
                    {courseReview.course.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {courseReview.course.creditUnits} Credit Units • Level {courseReview.course.level}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  {courseReview.course.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {courseReview.course.departmentName || 'Department of Computer Science'} • {courseReview.course.programmeName}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                {courseReview.metrics.draftCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Dean Approval
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Senate Ratified / Published
                  </span>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-medium block">Total Students</span>
                <span className="text-xl font-black text-slate-900">{courseReview.metrics.totalStudents}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <span className="text-xs text-amber-700 font-medium block">Awaiting Dean</span>
                <span className="text-xl font-black text-amber-800">{courseReview.metrics.draftCount}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <span className="text-xs text-emerald-700 font-medium block">Published</span>
                <span className="text-xl font-black text-emerald-800">{courseReview.metrics.publishedCount}</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                <span className="text-xs text-indigo-700 font-medium block">Class Average</span>
                <span className="text-xl font-black text-indigo-800">{courseReview.metrics.averageScore}%</span>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-center">
                <span className="text-xs text-teal-700 font-medium block">Pass Rate</span>
                <span className="text-xl font-black text-teal-800">{courseReview.metrics.passRate}%</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                <span className="text-xs text-rose-700 font-medium block">Failed (F)</span>
                <span className="text-xl font-black text-rose-800">{courseReview.metrics.failCount}</span>
              </div>
            </div>

            {/* Grade Distribution Bar */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                  Grade Distribution Breakdown
                </span>
                <span className="text-slate-400">Total Graded: {courseReview.metrics.totalStudents}</span>
              </div>
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((letter) => {
                  const count = courseReview.metrics.gradeDistribution[letter] || 0;
                  const pct = courseReview.metrics.totalStudents > 0
                    ? Math.round((count / courseReview.metrics.totalStudents) * 100)
                    : 0;
                  return (
                    <div key={letter} className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="font-black text-slate-800">Grade {letter}</div>
                      <div className="text-base font-black text-emerald-700 mt-1">{count}</div>
                      <div className="text-[10px] text-slate-400">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Student Scores Broadsheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>Class Broadsheet Dossier ({courseReview.results.length} Candidates)</span>
              </h3>
              <span className="text-xs text-slate-500">Continuous Assessment (40%) + Exam (60%)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Matric No.</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3 text-center">Gender</th>
                    <th className="p-3 text-center">CA 1 (20)</th>
                    <th className="p-3 text-center">CA 2 (20)</th>
                    <th className="p-3 text-center">Exam (60)</th>
                    <th className="p-3 text-center">Total (100)</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-center">GP</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseReview.results.map((r, idx) => (
                    <tr key={r.gradeEntryId || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{r.matricNumber}</td>
                      <td className="p-3 font-medium text-slate-800">{r.studentName}</td>
                      <td className="p-3 text-center text-slate-500">{r.gender}</td>
                      <td className="p-3 text-center font-mono">{r.ca1Score}</td>
                      <td className="p-3 text-center font-mono">{r.ca2Score}</td>
                      <td className="p-3 text-center font-mono">{r.examScore}</td>
                      <td className="p-3 text-center font-mono font-black text-slate-900">{r.totalScore}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-black text-[11px] ${
                            r.letterGrade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.letterGrade === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : r.letterGrade === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : r.letterGrade === 'F'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {r.letterGrade}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">{r.gradePoint.toFixed(1)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Approval Queue List View */
        <div className="space-y-4">
          {/* Header Controls & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses, codes, or lecturers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Courses ({queue?.length || 0})
              </button>
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === 'PENDING'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Awaiting Approval ({queue?.filter((q) => q.draftCount > 0).length || 0})
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === 'APPROVED'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Published
              </button>
            </div>
          </div>

          {/* Queue Cards */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading Dean's academic approval queue...
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800">Approval Queue is Clear</h3>
              <p className="text-xs text-slate-400 mt-1">
                No courses are currently pending Dean quality moderation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQueue.map((item) => (
                <div
                  key={item.courseId}
                  onClick={() => setSelectedCourseId(item.courseId)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold">
                        {item.courseCode}
                      </span>
                      {item.draftCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          {item.draftCount} Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-3 line-clamp-1">
                      {item.courseTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {item.departmentName || 'Department of Computer Science'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>Lecturer:</span>
                      <span className="font-semibold text-slate-800">{item.lecturerName}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Total Enrolled:</span>
                      <span className="font-mono font-bold text-slate-800">{item.totalStudents} Students</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700">Review & Publish Broadsheet</span>
                    <ChevronRight className="w-4 h-4 text-emerald-700" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal: Master Switch Result Approval */}
      {confirmApproveModal && courseReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-emerald-800 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Dean Quality Assurance Sign-off</h3>
                <p className="text-xs text-slate-500">
                  Master Switch: Authorize official grade publication to student SIMS portal.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Course:</span>
                <span className="font-bold text-slate-900">{courseReview.course.code} - {courseReview.course.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Awaiting Release:</span>
                <span className="font-bold text-emerald-700">{courseReview.metrics.draftCount} Student Scores</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Class Average:</span>
                <span className="font-bold text-slate-900">{courseReview.metrics.averageScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Pass Rate:</span>
                <span className="font-bold text-slate-900">{courseReview.metrics.passRate}%</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Faculty Board Moderation Comments & Formal Endorsement
              </label>
              <textarea
                value={deanComments}
                onChange={(e) => setDeanComments(e.target.value)}
                placeholder="e.g., Reviewed by Faculty Board of Studies. Standard deviation and moderation verified."
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmApproveModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{approveMutation.isPending ? 'Publishing...' : 'Approve & Release to Students'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
