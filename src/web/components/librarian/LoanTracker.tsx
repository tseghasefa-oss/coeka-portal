import React, { useState } from 'react';
import {
  Clock,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  User,
  Calendar,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useBookLoans, useReturnBook, useSendLoanReminder, BookLoanItem } from '../../hooks/useLibrarianData';

export const LoanTracker: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [returnModalLoan, setReturnModalLoan] = useState<BookLoanItem | null>(null);

  // Return modal form state
  const [isDamaged, setIsDamaged] = useState(false);
  const [damageFineNaira, setDamageFineNaira] = useState('');
  const [damageReason, setDamageReason] = useState('');

  const { data: loans = [], isLoading } = useBookLoans({
    status: selectedStatus,
    search: searchTerm,
  });

  const returnMutation = useReturnBook();
  const reminderMutation = useSendLoanReminder();

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalLoan) return;

    const damageFineKobo = isDamaged && damageFineNaira ? Math.round(parseFloat(damageFineNaira) * 100) : 0;

    try {
      const res: any = await returnMutation.mutateAsync({
        loanId: returnModalLoan.id,
        data: {
          isDamaged,
          damageFineKobo,
          damageReason: isDamaged ? damageReason : undefined,
        },
      });

      alert(res.message);
      setReturnModalLoan(null);
      setIsDamaged(false);
      setDamageFineNaira('');
      setDamageReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to return book');
    }
  };

  const handleSendReminder = async (loan: BookLoanItem) => {
    try {
      const res: any = await reminderMutation.mutateAsync(loan.id);
      alert(`Reminder Sent: ${res.message}`);
    } catch (err: any) {
      alert(err.message || 'Failed to send reminder');
    }
  };

  const overdueCount = loans.filter((l) => l.status === 'OVERDUE').length;

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student matric, name, or book title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'OVERDUE', 'ACTIVE', 'RETURNED'] as const).map((tab) => {
              const isActive = selectedStatus === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedStatus(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab === 'ALL' ? 'All Loans' : tab}</span>
                  {tab === 'OVERDUE' && overdueCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-black">
                      {overdueCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loans Table */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 text-emerald-700 animate-spin" />
          Loading circulation and borrowing logs...
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">No loan records found</p>
          <p className="text-slate-400">No books currently match the selected loan filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Borrower Details</th>
                  <th className="py-3.5 px-4">Book Title / Asset</th>
                  <th className="py-3.5 px-4">Loan Schedule</th>
                  <th className="py-3.5 px-4">Status & Fines</th>
                  <th className="py-3.5 px-4 text-right">Circulation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const isOverdue = loan.status === 'OVERDUE';
                  const isReturned = loan.status === 'RETURNED';

                  return (
                    <tr
                      key={loan.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Borrower */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{loan.studentName}</div>
                        <div className="text-[11px] font-mono text-emerald-800 font-semibold">
                          {loan.matricNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {loan.divisionName} • {loan.programmeName}
                        </div>
                      </td>

                      {/* Book */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{loan.bookTitle}</div>
                        <div className="text-[11px] text-slate-500">By {loan.bookAuthor}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Shelf: {loan.shelfLocation} | ISBN: {loan.bookIsbn}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                        <div>
                          <span className="text-slate-400">Issued: </span>
                          <span className="font-semibold text-slate-700">{loan.loanDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Due Date: </span>
                          <span
                            className={`font-semibold ${
                              isOverdue ? 'text-rose-700 font-black' : 'text-slate-700'
                            }`}
                          >
                            {loan.dueDate}
                          </span>
                        </div>
                        {loan.returnDate && (
                          <div className="text-emerald-700">
                            <span className="text-slate-400">Returned: </span>
                            <span className="font-semibold">{loan.returnDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 w-fit ${
                              isReturned
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isReturned ? (
                              <CheckCircle2 className="w-3 h-3 text-slate-500" />
                            ) : isOverdue ? (
                              <AlertTriangle className="w-3 h-3 text-rose-700" />
                            ) : (
                              <Clock className="w-3 h-3 text-emerald-700" />
                            )}
                            <span>{loan.status}</span>
                          </span>

                          {isOverdue && (
                            <span className="text-[11px] text-rose-700 font-bold">
                              {loan.daysOverdue} days late (Accruing ₦100/day)
                            </span>
                          )}

                          {loan.fineAmountKobo > 0 && (
                            <span className="text-[11px] text-amber-700 font-bold">
                              Fine: {loan.formattedFine}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!isReturned && (
                            <>
                              <button
                                onClick={() => handleSendReminder(loan)}
                                disabled={reminderMutation.isPending}
                                title="Send Return Reminder Notification"
                                className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200 cursor-pointer"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setReturnModalLoan(loan)}
                                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Return Book</span>
                              </button>
                            </>
                          )}
                          {isReturned && (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Checked In
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Book Inspection Modal */}
      {returnModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Check-In Returned Book</h3>
                  <p className="text-xs text-slate-500">Inspect physical condition and finalize loan</p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalLoan(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Book:</span>
                <span className="font-bold text-slate-900">{returnModalLoan.bookTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Borrower:</span>
                <span className="font-bold text-slate-900">
                  {returnModalLoan.studentName} ({returnModalLoan.matricNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-bold text-slate-900">{returnModalLoan.dueDate}</span>
              </div>
              {returnModalLoan.status === 'OVERDUE' && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-bold flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Book is {returnModalLoan.daysOverdue} day(s) overdue. Automatic fine: ₦
                    {(returnModalLoan.daysOverdue * 100).toLocaleString()}.
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDamaged}
                    onChange={(e) => setIsDamaged(e.target.checked)}
                    className="rounded text-rose-700 focus:ring-rose-600"
                  />
                  <span>Physical Damage or Defacement Detected</span>
                </label>

                {isDamaged && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in duration-100">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Damage Penalty Amount (₦ Naira) *
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        required
                        placeholder="e.g. 1500"
                        value={damageFineNaira}
                        onChange={(e) => setDamageFineNaira(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Condition Report Notes *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Spine broken, 4 pages water damaged"
                        value={damageReason}
                        onChange={(e) => setDamageReason(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalLoan(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnMutation.isPending}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {returnMutation.isPending ? 'Processing...' : 'Confirm Book Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
