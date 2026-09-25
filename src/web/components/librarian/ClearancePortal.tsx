import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileCheck,
  AlertTriangle,
  CreditCard,
  BookOpen,
  DollarSign,
  Stamp,
  UserCheck,
  X,
} from 'lucide-react';
import {
  useStudentClearanceCheck,
  useGrantClearance,
  useApplyFine,
} from '../../hooks/useLibrarianData';

export const ClearancePortal: React.FC = () => {
  const [searchInput, setSearchInput] = useState('COEKA/2026/NCE/084');
  const [activeSearchId, setActiveSearchId] = useState('COEKA/2026/NCE/084');
  const [remarks, setRemarks] = useState('');
  const [isFineModalOpen, setIsFineModalOpen] = useState(false);

  // Apply fine state
  const [fineNaira, setFineNaira] = useState('');
  const [fineReason, setFineReason] = useState('');

  const { data: dossier, isLoading, error, refetch } = useStudentClearanceCheck(activeSearchId);
  const grantMutation = useGrantClearance();
  const applyFineMutation = useApplyFine();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveSearchId(searchInput.trim());
    }
  };

  const handleGrantClearance = async () => {
    if (!dossier) return;
    try {
      const res: any = await grantMutation.mutateAsync({
        studentId: dossier.studentId,
        remarks: remarks || undefined,
      });
      alert(res.message);
      setRemarks('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to grant clearance');
    }
  };

  const handleApplyFineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier || !fineNaira || !fineReason) return;

    const amountKobo = Math.round(parseFloat(fineNaira) * 100);

    try {
      await applyFineMutation.mutateAsync({
        studentId: dossier.studentId,
        amountKobo,
        reason: fineReason,
      });

      alert(`Library Fine of ₦${parseFloat(fineNaira).toLocaleString()} pushed to student invoice & Bursar ledger.`);
      setIsFineModalOpen(false);
      setFineNaira('');
      setFineReason('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to apply fine');
    }
  };

  const isCleared = dossier?.clearanceStatus === 'CLEARED';

  return (
    <div className="space-y-6">
      {/* Student Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Student Library Clearance Desk</h3>
          <p className="text-xs text-slate-500">
            Search student matriculation number or ID to inspect unreturned assets and stamp official clearance
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter matric number (e.g. COEKA/2026/NCE/084, COEKA/2026/DEG/018)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            Verify Student
          </button>
        </form>

        {/* Quick Demo Student Switcher */}
        <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-400">Quick Test Students:</span>
          <button
            type="button"
            onClick={() => {
              setSearchInput('COEKA/2026/NCE/084');
              setActiveSearchId('COEKA/2026/NCE/084');
            }}
            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono transition cursor-pointer"
          >
            COEKA/2026/NCE/084 (Has Overdue Book)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('COEKA/2026/DEG/018');
              setActiveSearchId('COEKA/2026/DEG/018');
            }}
            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono transition cursor-pointer"
          >
            COEKA/2026/DEG/018 (Cleared)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('COEKA/2026/NCE/087');
              setActiveSearchId('COEKA/2026/NCE/087');
            }}
            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono transition cursor-pointer"
          >
            COEKA/2026/NCE/087 (Active Loan)
          </button>
        </div>
      </div>

      {/* Clearance Dossier Results */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-700 animate-pulse" />
          Verifying student library liabilities and circulation records...
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center text-xs text-rose-700">
          {(error as any)?.message || 'Student record not found.'}
        </div>
      ) : dossier ? (
        <div className="space-y-6">
          {/* Clearance Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {dossier.divisionName} Division
                </span>
                <span className="text-xs text-slate-500 font-medium">{dossier.programmeName}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">{dossier.studentName}</h3>
              <p className="text-xs font-mono font-bold text-emerald-800">
                Matriculation No: {dossier.matricNumber}
              </p>
            </div>

            {/* Clearance Stamp Badge */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <div
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border shadow-xs ${
                  isCleared
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-4 ring-emerald-50'
                    : 'bg-amber-50 text-amber-800 border-amber-300 ring-4 ring-amber-50'
                }`}
              >
                {isCleared ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>Library Cleared</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                    <span>Clearance Pending</span>
                  </>
                )}
              </div>

              {isCleared && dossier.digitalCertificateHash && (
                <div className="text-[10px] font-mono text-slate-400 text-right">
                  Digital Seal: {dossier.digitalCertificateHash.substring(0, 16)}...
                </div>
              )}
            </div>
          </div>

          {/* Audit Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Unreturned Borrowed Books */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-800" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Borrowed Books in Custody
                  </h4>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    dossier.activeLoansCount === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {dossier.activeLoansCount} Book(s)
                </span>
              </div>

              {dossier.activeLoans.length === 0 ? (
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Zero unreturned books. All borrowed materials safely checked in.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {dossier.activeLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{loan.bookTitle}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Due: {loan.dueDate} | Shelf: {loan.shelfLocation}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          loan.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Unpaid Library Fines */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-800" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Outstanding Library Liabilities
                  </h4>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    dossier.unpaidFinesKobo === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {dossier.formattedUnpaidFines}
                </span>
              </div>

              {dossier.unpaidFines.length === 0 ? (
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Zero library debt. No outstanding penalty invoices on ledger.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {dossier.unpaidFines.map((fine) => (
                    <div
                      key={fine.id}
                      className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{fine.reason}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Invoice: {fine.invoiceNumber || 'Pending'}
                        </div>
                      </div>
                      <span className="font-black text-rose-800">{fine.formattedAmount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Decision & Clearance Stamping Desk */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Clearance Action & Endorsement</h4>

            {dossier.canClear ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Student Meets All Institutional Library Clearance Requirements</span>
                </div>
                <p className="text-emerald-700 text-[11px]">
                  Zero unreturned volumes in custody and zero fine balances detected across College Bursary ledger.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <XCircle className="w-4 h-4 text-rose-700" />
                  <span>Clearance Blocked Due to Outstanding Liabilities:</span>
                </div>
                <ul className="list-disc list-inside text-rose-800 text-[11px] space-y-0.5">
                  {dossier.reasonsIneligible.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
              {/* Assess Fine Action */}
              <button
                type="button"
                onClick={() => setIsFineModalOpen(true)}
                className="px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Assess Lost Book / Fine Liability</span>
              </button>

              {/* Grant Clearance Button */}
              <button
                type="button"
                disabled={!dossier.canClear || grantMutation.isPending || isCleared}
                onClick={handleGrantClearance}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition ${
                  dossier.canClear && !isCleared
                    ? 'bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Stamp className="w-4 h-4" />
                <span>
                  {isCleared
                    ? 'Clearance Already Endorsed'
                    : grantMutation.isPending
                    ? 'Stamping Seal...'
                    : 'Endorse & Grant Clearance'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Apply Fine Modal */}
      {isFineModalOpen && dossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-800 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assess Library Fine</h3>
                  <p className="text-xs text-slate-500">Pushes invoice directly to student & Bursar ledger</p>
                </div>
              </div>
              <button
                onClick={() => setIsFineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Debtor</span>
              <p className="font-bold text-slate-900">
                {dossier.studentName} ({dossier.matricNumber})
              </p>
              <p className="text-slate-500">{dossier.programmeName}</p>
            </div>

            <form onSubmit={handleApplyFineSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Fine Amount (₦ Naira) *
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  placeholder="e.g. 5000"
                  value={fineNaira}
                  onChange={(e) => setFineNaira(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Reason / Violation Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Lost library textbook: Fundamentals of Data Structures (replacement cost & processing fee)"
                  value={fineReason}
                  onChange={(e) => setFineReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-700 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                <strong>Automatic Ledger Integration:</strong> Applying this fine generates an unpaid invoice in the Bursary dashboard and increases the student's debt balance instantly.
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFineModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyFineMutation.isPending}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {applyFineMutation.isPending ? 'Applying...' : 'Apply Fine to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
