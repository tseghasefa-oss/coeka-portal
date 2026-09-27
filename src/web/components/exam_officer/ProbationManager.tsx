import React, { useState } from 'react';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldAlert,
  UserX,
  Mail,
  MessageSquare,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import {
  useProbationStudents,
  useSendProbationWarning,
  ProbationStudentItem,
} from '../../hooks/useExamOfficerData';

export function ProbationManager() {
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [standingFilter, setStandingFilter] = useState<'ALL' | 'PROBATION' | 'CARRY_OVER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [warnSuccessToast, setWarnSuccessToast] = useState<string | null>(null);

  const { data: students, isLoading, refetch, isFetching } = useProbationStudents();
  const warnMutation = useSendProbationWarning();

  const filtered = (students || []).filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.matricNumber.toLowerCase().includes(q) ||
      s.studentName.toLowerCase().includes(q) ||
      s.departmentName.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (departmentFilter !== 'ALL' && s.departmentId !== departmentFilter) return false;
    if (standingFilter === 'PROBATION' && s.status !== 'PROBATION') return false;
    if (standingFilter === 'CARRY_OVER' && s.status !== 'CARRY_OVER') return false;

    return true;
  });

  const handleSendWarning = async (student: ProbationStudentItem) => {
    try {
      await warnMutation.mutateAsync(student.studentId);
      setWarnSuccessToast(`Formal academic warning dispatched to ${student.studentName} (${student.matricNumber}) via SMS and Email.`);
      setTimeout(() => setWarnSuccessToast(null), 5000);
    } catch {
      alert('Failed to send academic warning. Please check network.');
    }
  };

  const handleDispatchAll = async () => {
    const unnotified = filtered.filter((s) => !s.warningSent);
    if (unnotified.length === 0) {
      alert('All filtered students have already received academic warnings.');
      return;
    }
    if (!confirm(`Dispatch formal warnings to ${unnotified.length} students?`)) {
      return;
    }

    for (const s of unnotified) {
      try {
        await warnMutation.mutateAsync(s.studentId);
      } catch {
        // continue
      }
    }
    setWarnSuccessToast(`Dispatched ${unnotified.length} academic warnings successfully.`);
    setTimeout(() => setWarnSuccessToast(null), 5000);
  };

  const probationCount = (students || []).filter((s) => s.status === 'PROBATION').length;
  const carryOverCount = (students || []).filter((s) => s.status === 'CARRY_OVER').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {warnSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{warnSuccessToast}</span>
          </div>
          <button
            onClick={() => setWarnSuccessToast(null)}
            className="text-emerald-800 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                Academic Audit & Retention
              </span>
              <span className="text-xs text-slate-500">• Institutional Quality Standard</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <span>Academic Probation & Carry-Over Desk</span>
              <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
                {probationCount} on Probation
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleDispatchAll}
              disabled={warnMutation.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-700 hover:bg-rose-600 text-white shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch All Warnings</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Standing Category
            </label>
            <select
              value={standingFilter}
              onChange={(e) => setStandingFilter(e.target.value as any)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Academic Deficits ({students?.length || 0})</option>
              <option value="PROBATION">Probation Only (CGPA &lt; 1.50) ({probationCount})</option>
              <option value="CARRY_OVER">Carry-Overs Only ({carryOverCount})</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Search by Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Matric, Name, or Dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs">
              <span className="font-bold text-slate-700 block">Threshold Policy:</span>
              <span className="text-[11px] text-slate-500">CGPA &lt; 1.50 requires formal warning</span>
            </div>
            <ShieldAlert className="w-6 h-6 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Flagged Students List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student Info</th>
                <th className="py-3 px-4">Department & Level</th>
                <th className="py-3 px-4 text-center">Semester GPA</th>
                <th className="py-3 px-4 text-center">Cumulative CGPA</th>
                <th className="py-3 px-4">Failed / Carry-Over Courses</th>
                <th className="py-3 px-4 text-center">Warning Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-600 mb-2" />
                    <span>Auditing student academic standing records...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <span>No students found currently on probation or with carry-overs!</span>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isProbation = s.status === 'PROBATION';

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isProbation ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block font-bold">{s.studentName}</strong>
                        <span className="text-[11px] font-mono text-slate-500">{s.matricNumber}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{s.departmentName}</span>
                        <span className="text-[10px] text-slate-500">Level {s.level}</span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {s.gpa.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-full border ${
                            isProbation
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {s.cgpa.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {s.carryOverCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.carryOverCourses.map((code) => (
                              <span
                                key={code}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-200"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {s.warningSent ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Warning Sent
                            </span>
                            {s.warningSentAt && (
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {new Date(s.warningSentAt * 1000).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Notice
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSendWarning(s)}
                          disabled={warnMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>{s.warningSent ? 'Resend' : 'Send Warning'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
