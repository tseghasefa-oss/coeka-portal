import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Check,
  X,
  FileQuestion,
  User,
  GraduationCap,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useDeanAppeals, useResolveAppeal, AppealItem } from '../../hooks/useDeanData';
import { GradingPolicyEngine } from '../../../services/academic/gradingPolicyEngine';

export function AppealDashboard() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState<AppealItem | null>(null);
  const [resolutionMode, setResolutionMode] = useState<'APPROVE' | 'REJECT' | null>(null);

  // Score correction state
  const [revisedCa1, setRevisedCa1] = useState<number>(0);
  const [revisedCa2, setRevisedCa2] = useState<number>(0);
  const [revisedExam, setRevisedExam] = useState<number>(0);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data: appeals, isLoading, refetch } = useDeanAppeals({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const resolveMutation = useResolveAppeal();

  const filteredAppeals = (appeals || []).filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.studentMatric.toLowerCase().includes(q) ||
      a.studentName.toLowerCase().includes(q) ||
      a.courseCode.toLowerCase().includes(q) ||
      a.reason.toLowerCase().includes(q)
    );
  });

  const handleOpenResolve = (appeal: AppealItem, mode: 'APPROVE' | 'REJECT') => {
    setSelectedAppeal(appeal);
    setResolutionMode(mode);
    setDecisionNotes('');
    if (appeal.currentScores) {
      setRevisedCa1(appeal.currentScores.ca1Score);
      setRevisedCa2(appeal.currentScores.ca2Score);
      setRevisedExam(appeal.currentScores.examScore);
    } else {
      setRevisedCa1(15);
      setRevisedCa2(15);
      setRevisedExam(40);
    }
  };

  const calculatedTotal = revisedCa1 + revisedCa2 + revisedExam;
  const simulatedGrade = GradingPolicyEngine.evaluateScore(calculatedTotal, 'NCCE_5_POINT');

  const handleExecuteResolution = async () => {
    if (!selectedAppeal || !resolutionMode) return;

    try {
      if (resolutionMode === 'APPROVE') {
        await resolveMutation.mutateAsync({
          appealId: selectedAppeal.id,
          decision: 'APPROVED',
          ca1Score: revisedCa1,
          ca2Score: revisedCa2,
          examScore: revisedExam,
          decisionNotes: decisionNotes || 'Grade corrected after external script audit and Dean concurrence.',
        });
        setSuccessToast(`Appeal for ${selectedAppeal.studentMatric} (${selectedAppeal.courseCode}) approved. Revised Grade: ${simulatedGrade.letterGrade} (${calculatedTotal}%).`);
      } else {
        await resolveMutation.mutateAsync({
          appealId: selectedAppeal.id,
          decision: 'REJECTED',
          decisionNotes: decisionNotes || 'Original examination script and marking scheme verified. Original grade upheld.',
        });
        setSuccessToast(`Appeal for ${selectedAppeal.studentMatric} rejected.`);
      }

      setSelectedAppeal(null);
      setResolutionMode(null);
      refetch();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve appeal');
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

      {/* Header & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search appeals by matric number, student, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Disputes
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Ticket List View */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading student grade disputes...
        </div>
      ) : filteredAppeals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">No Grade Disputes Filed</h3>
          <p className="text-xs text-slate-400 mt-1">
            No student appeals match the selected criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppeals.map((appeal) => (
            <div
              key={appeal.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold">
                    {appeal.courseCode}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      appeal.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : appeal.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {appeal.status === 'PENDING' && <Clock className="w-3 h-3" />}
                    {appeal.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                    {appeal.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                    {appeal.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{appeal.studentName}</div>
                  <div className="text-xs font-mono font-bold text-slate-500">{appeal.studentMatric}</div>
                </div>

                {/* Dispute Reason */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Student Dispute Reason:</span>
                  <p className="text-slate-600 italic">"{appeal.reason}"</p>
                  {appeal.desiredCorrection && (
                    <div className="mt-2 text-slate-500 text-[11px]">
                      <span className="font-semibold text-slate-700">Claimed: </span>
                      {appeal.desiredCorrection}
                    </div>
                  )}
                </div>

                {/* Current Scores */}
                {appeal.currentScores && (
                  <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">CA 1</span>
                      <span className="font-bold text-slate-800">{appeal.currentScores.ca1Score}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">CA 2</span>
                      <span className="font-bold text-slate-800">{appeal.currentScores.ca2Score}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Exam</span>
                      <span className="font-bold text-slate-800">{appeal.currentScores.examScore}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Total</span>
                      <span className="font-bold text-slate-900">{appeal.currentScores.totalScore}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Grade</span>
                      <span className="font-black text-rose-700">{appeal.currentScores.letterGrade}</span>
                    </div>
                  </div>
                )}

                {/* Resolution Notes if Resolved */}
                {appeal.decisionNotes && (
                  <div className="mt-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
                    <span className="font-bold text-emerald-900 block mb-1">Dean Resolution:</span>
                    <p className="text-emerald-800">{appeal.decisionNotes}</p>
                    {appeal.resolvedByDeanName && (
                      <span className="text-[10px] text-emerald-600 block mt-1">
                        Resolved by: {appeal.resolvedByDeanName}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending Appeals */}
              {appeal.status === 'PENDING' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenResolve(appeal, 'REJECT')}
                    className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Appeal</span>
                  </button>
                  <button
                    onClick={() => handleOpenResolve(appeal, 'APPROVE')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Correct Grade</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal: Approve or Reject Appeal */}
      {selectedAppeal && resolutionMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {resolutionMode === 'APPROVE' ? 'Approve Appeal & Correct Grade' : 'Reject Student Grade Appeal'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedAppeal.studentMatric} • {selectedAppeal.courseCode}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedAppeal(null);
                  setResolutionMode(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resolutionMode === 'APPROVE' ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                  <span className="font-bold">Original:</span> CA1: {selectedAppeal.currentScores?.ca1Score || 0}, CA2: {selectedAppeal.currentScores?.ca2Score || 0}, Exam: {selectedAppeal.currentScores?.examScore || 0} (Total: {selectedAppeal.currentScores?.totalScore || 0}, Grade: {selectedAppeal.currentScores?.letterGrade || 'F'})
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CA 1 (Max 20)</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={revisedCa1}
                      onChange={(e) => setRevisedCa1(Math.min(20, Math.max(0, Number(e.target.value))))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CA 2 (Max 20)</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={revisedCa2}
                      onChange={(e) => setRevisedCa2(Math.min(20, Math.max(0, Number(e.target.value))))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Exam (Max 60)</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={revisedExam}
                      onChange={(e) => setRevisedExam(Math.min(60, Math.max(0, Number(e.target.value))))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-center"
                    />
                  </div>
                </div>

                {/* Recalculated Preview */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-700 font-semibold block text-[11px]">Corrected Result:</span>
                    <span className="font-black text-emerald-950 text-base">
                      {calculatedTotal} / 100 • Grade {simulatedGrade.letterGrade}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 block">Grade Point</span>
                    <span className="font-black text-emerald-900 text-sm">{simulatedGrade.gradePoint.toFixed(1)} GP</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dean Decision & Audit Rationale</label>
                  <textarea
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="e.g., Script re-marked by moderation committee. 15 additional marks awarded to Exam."
                    rows={2}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Confirm rejection of this dispute ticket. The original examination marks and course registration will remain unchanged.
                </p>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rejection Rationale</label>
                  <textarea
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="e.g., Examination scripts verified. Marking key followed correctly with no discrepancy."
                    rows={3}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedAppeal(null);
                  setResolutionMode(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResolution}
                disabled={resolveMutation.isPending}
                className={`px-5 py-2.5 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 ${
                  resolutionMode === 'APPROVE'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {resolveMutation.isPending
                    ? 'Saving...'
                    : resolutionMode === 'APPROVE'
                    ? 'Confirm & Apply Grade Correction'
                    : 'Confirm Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
