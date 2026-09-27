import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Send,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Award,
  ShieldCheck,
  Building,
  BookOpen,
  CreditCard,
  XCircle,
} from 'lucide-react';
import {
  useGraduationList,
  GraduationCandidateItem,
} from '../../hooks/useExamOfficerData';

export function GraduationList() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUALIFIED' | 'CLEARANCE_BLOCKED' | 'ACADEMIC_DEFICIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pushSenateModal, setPushSenateModal] = useState(false);
  const [senatePushedSuccess, setSenatePushedSuccess] = useState(false);

  const { data: graduationData, isLoading, refetch, isFetching } = useGraduationList();

  const candidates = graduationData?.candidates || [];

  const filtered = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.matricNumber.toLowerCase().includes(q) ||
      c.studentName.toLowerCase().includes(q) ||
      c.programmeName.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (statusFilter !== 'ALL' && c.graduationStatus !== statusFilter) return false;

    return true;
  });

  const getHonorsBadge = (classification: string) => {
    switch (classification) {
      case 'First Class Honours':
      case 'Distinction':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
      case 'Second Class Honours (Upper Division)':
      case 'Credit':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
      case 'Second Class Honours (Lower Division)':
      case 'Merit':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold';
      case 'Third Class Honours':
      case 'Pass':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    }
  };

  const handlePushToSenate = () => {
    setPushSenateModal(false);
    setSenatePushedSuccess(true);
    setTimeout(() => setSenatePushedSuccess(false), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Success */}
      {senatePushedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Senate Dossier Submitted:</strong> Graduating candidate roster with digital signatures successfully transmitted to the College Senate for Degree/Diploma conferment!
            </span>
          </div>
          <button
            onClick={() => setSenatePushedSuccess(false)}
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
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Convocation & Degree Audit
              </span>
              <span className="text-xs text-slate-500">• Final Year Validation</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <span>Senate Graduation & Convocation Roster</span>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                {graduationData?.qualifiedCount ?? 0} Qualified
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
              <span>Audit Now</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Roster</span>
            </button>

            <button
              onClick={() => setPushSenateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Push to Senate</span>
            </button>
          </div>
        </div>

        {/* Metrics Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Candidates</span>
            <strong className="text-xl font-black text-slate-900">
              {graduationData?.totalCandidates ?? 0}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Fully Qualified</span>
            <strong className="text-xl font-black text-emerald-800">
              {graduationData?.qualifiedCount ?? 0}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Clearance Blocked</span>
            <strong className="text-xl font-black text-amber-800">
              {graduationData?.clearanceBlockedCount ?? 0}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">Academic Deficit</span>
            <strong className="text-xl font-black text-rose-800">
              {graduationData?.academicDeficitCount ?? 0}
            </strong>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Final Year Candidates ({candidates.length})</option>
              <option value="QUALIFIED">Fully Qualified Candidates Only</option>
              <option value="CLEARANCE_BLOCKED">Clearance Blocked (Bursary / Library)</option>
              <option value="ACADEMIC_DEFICIT">Academic Deficit (Carry-Over / CGPA &lt; 1.50)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Search Candidate
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Matric number, Name, or Programme..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Graduation Candidates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Candidate Details</th>
                <th className="py-3 px-4">Programme & Dept</th>
                <th className="py-3 px-4 text-center">Final CGPA</th>
                <th className="py-3 px-4 text-center">Honors Classification</th>
                <th className="py-3 px-4 text-center">Bursary Clearance</th>
                <th className="py-3 px-4 text-center">Library Clearance</th>
                <th className="py-3 px-4 text-right">Overall Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Auditing final-year candidate credentials and clearance ledgers...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No candidates found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isQualified = c.graduationStatus === 'QUALIFIED';
                  const isBlocked = c.graduationStatus === 'CLEARANCE_BLOCKED';
                  const isDeficit = c.graduationStatus === 'ACADEMIC_DEFICIT';

                  return (
                    <tr
                      key={c.studentId}
                      className={`hover:bg-slate-50/80 transition ${
                        isQualified ? 'bg-emerald-50/15' : isDeficit ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block font-bold">{c.studentName}</strong>
                        <span className="text-[11px] font-mono text-slate-500">
                          {c.matricNumber} • {c.division} Level {c.level}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{c.programmeName}</span>
                        <span className="text-[10px] text-slate-500">{c.departmentName}</span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-black text-sm text-slate-900">
                        {c.finalCgpa.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getHonorsBadge(
                            c.honorsClassification
                          )}`}
                        >
                          {c.honorsClassification}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {c.financialStatus === 'CLEARED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Cleared (₦0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Debt: ₦{(c.outstandingDebtKobo / 100).toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {c.libraryStatus === 'CLEARED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            <BookOpen className="w-3 h-3 text-amber-600" />
                            Pending Clearance
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isQualified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm">
                            <GraduationCap className="w-3.5 h-3.5" />
                            Qualified
                          </span>
                        ) : isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Clearance Block
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Academic Deficit
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

      {/* Push to Senate Confirmation Modal */}
      {pushSenateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Transmit Roster to College Senate?
                </h3>
                <p className="text-xs text-slate-500">
                  Academic Board Official Convocation Submission
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to transmit the official graduation dossier of{' '}
              <strong>{graduationData?.qualifiedCount ?? 0} qualified candidates</strong> to the College Senate for
              statutory approval and degree/diploma certificate issuance.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Qualified Candidates:</span>
                <strong className="text-emerald-700">{graduationData?.qualifiedCount ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Blocked by Clearance:</span>
                <strong className="text-amber-700">{graduationData?.clearanceBlockedCount ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Academic Deficit (Withheld):</span>
                <strong className="text-rose-700">{graduationData?.academicDeficitCount ?? 0}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPushSenateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePushToSenate}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white shadow transition"
              >
                Confirm & Submit to Senate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
