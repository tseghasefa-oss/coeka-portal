import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Filter,
  X,
  AlertTriangle,
  QrCode,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import {
  useBursarTransactions,
  useReconcilePayment,
  PaymentTransactionItem,
} from '../../hooks/useBursarData';

export const ReconciliationTable: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: transactions, isLoading, refetch, isRefetching } = useBursarTransactions({
    status: statusFilter || undefined,
    channel: channelFilter || undefined,
    search: searchQuery || undefined,
  });

  const reconcileMutation = useReconcilePayment();

  // Active Transaction for Reconciliation Modal
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransactionItem | null>(null);
  const [matricNumberInput, setMatricNumberInput] = useState<string>('COEKA/2026/NCE/084');
  const [bursarNotesInput, setBursarNotesInput] = useState<string>('');
  const [reconcileSuccessResult, setReconcileSuccessResult] = useState<any | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleOpenReconcile = (txn: PaymentTransactionItem) => {
    setSelectedTxn(txn);
    setReconcileSuccessResult(null);
    setBursarNotesInput(`Manual payment reconciliation verified by Bursar Office against bank statement ${txn.bankReference || txn.transactionReference}`);
    // Pre-populate if transaction had a recognized student matric
    if (txn.matricNumber) {
      setMatricNumberInput(txn.matricNumber);
    } else {
      setMatricNumberInput('COEKA/2026/NCE/084');
    }
  };

  const handleCloseModal = () => {
    setSelectedTxn(null);
    setReconcileSuccessResult(null);
  };

  const handleExecuteReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn || !matricNumberInput.trim()) return;

    try {
      const result = await reconcileMutation.mutateAsync({
        transactionId: selectedTxn.id,
        studentId: matricNumberInput.trim(),
        amountKobo: selectedTxn.amountKobo,
        notes: bursarNotesInput.trim(),
      });
      setReconcileSuccessResult(result);
    } catch (err: any) {
      // Error handled by mutation state
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const pendingCount = (transactions || []).filter((t) => t.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Payment Reconciliation & Bank Inflow Audit
            {pendingCount > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                {pendingCount} Pending Match
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            Match manual bank wires, POS teller vouchers, and unallocated transactions to student matriculation numbers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 shadow-sm transition disabled:opacity-50"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Transaction Ref, Payer Name, Bank Reference, or Matric Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending (Unmatched)</option>
              <option value="RECONCILED">Reconciled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">All Channels</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="POS_TERMINAL">POS Terminal</option>
              <option value="VPAY_VIRTUAL_ACCOUNT">VPay Virtual Account</option>
              <option value="PAYSTACK">Paystack</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bento-card border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Payer / Depositor</th>
                <th className="py-3 px-4 text-right">Amount (₦)</th>
                <th className="py-3 px-4">Allocated Student</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Date / Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Loading incoming payment ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : !transactions || transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isReconciled = txn.status === 'RECONCILED';
                  const channelBadgeMap: Record<string, { label: string; bg: string; text: string }> = {
                    BANK_TRANSFER: { label: 'Bank Transfer', bg: 'bg-blue-50', text: 'text-blue-800' },
                    POS_TERMINAL: { label: 'Bursary POS', bg: 'bg-purple-50', text: 'text-purple-800' },
                    VPAY_VIRTUAL_ACCOUNT: { label: 'VPay NUBAN', bg: 'bg-emerald-50', text: 'text-emerald-800' },
                    PAYSTACK: { label: 'Paystack', bg: 'bg-cyan-50', text: 'text-cyan-800' },
                  };
                  const badge = channelBadgeMap[txn.paymentChannel] || {
                    label: txn.paymentChannel,
                    bg: 'bg-slate-100',
                    text: 'text-slate-800',
                  };

                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div>{txn.transactionReference}</div>
                        {txn.bankReference && (
                          <div className="text-[10px] text-slate-400 font-mono">Bank: {txn.bankReference}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {txn.payerName || 'Direct Counter Deposit'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {txn.formattedAmount}
                      </td>
                      <td className="py-3 px-4">
                        {txn.studentName ? (
                          <div>
                            <span className="font-semibold text-slate-900 block">{txn.studentName}</span>
                            <span className="text-[10px] font-mono text-emerald-800 font-bold">
                              {txn.matricNumber || 'COEKA/2026/NCE/084'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned Inflow</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isReconciled
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isReconciled ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              RECONCILED
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              PENDING MATCH
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {new Date(txn.createdAt * 1000).toLocaleDateString()}{' '}
                        <span className="text-[10px] text-slate-400">
                          {new Date(txn.createdAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isReconciled ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] font-mono text-slate-500">
                              {txn.receiptNumber || 'REC-ISSUED'}
                            </span>
                            <span className="p-1 text-emerald-700" title="Tamper-evident receipt signed">
                              <ShieldCheck className="w-4 h-4" />
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenReconcile(txn)}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <span>Match & Clear</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
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

      {/* Reconciliation Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-700">
                  Bursary Financial Clearing
                </span>
                <h3 className="text-lg font-bold mt-1 text-white">Manual Payment Reconciliation</h3>
                <p className="text-xs text-emerald-200">
                  Post credit directly to student invoice with Kobo-precision ledger balancing
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {!reconcileSuccessResult ? (
                <form onSubmit={handleExecuteReconciliation} className="space-y-4">
                  {/* Transaction Details Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-600">
                      <span>Transaction Reference:</span>
                      <span className="font-mono text-slate-900 font-bold">{selectedTxn.transactionReference}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Payer Name:</span>
                      <span className="font-medium text-slate-900">{selectedTxn.payerName || 'Direct Deposit'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Bank Voucher / Reference:</span>
                      <span className="font-mono text-slate-700">{selectedTxn.bankReference || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Payment Rail:</span>
                      <span className="font-bold text-emerald-800">{selectedTxn.paymentChannel}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm">
                      <span className="font-bold text-slate-700">Reconciliation Value:</span>
                      <span className="font-black font-mono text-emerald-950 text-base">
                        {selectedTxn.formattedAmount}
                      </span>
                    </div>
                  </div>

                  {/* Student Matriculation Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Target Student Matriculation Number or User ID *
                    </label>
                    <input
                      type="text"
                      value={matricNumberInput}
                      onChange={(e) => setMatricNumberInput(e.target.value)}
                      placeholder="e.g. COEKA/2026/NCE/084 or std-sample-001"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Matches the active tuition or session fee invoice for this student and clears their debt balance.
                    </span>
                  </div>

                  {/* Notes / Voucher Details */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Audit Trail Remarks / Bursar Verification Notes
                    </label>
                    <textarea
                      rows={2}
                      value={bursarNotesInput}
                      onChange={(e) => setBursarNotesInput(e.target.value)}
                      placeholder="Enter verification remarks or teller tracking notes..."
                      className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Error Notification */}
                  {reconcileMutation.isError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{reconcileMutation.error?.message || 'Failed to reconcile transaction'}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reconcileMutation.isPending || !matricNumberInput.trim()}
                      className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      {reconcileMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Posting to Ledger...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm & Reconcile Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Success State with Signed Official Receipt */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">Payment Successfully Reconciled!</h4>
                      <p className="text-xs text-emerald-800 mt-0.5">{reconcileSuccessResult.message}</p>
                    </div>
                  </div>

                  {/* Official Signed Receipt Preview */}
                  <div className="border border-slate-300 rounded-2xl p-5 bg-white shadow-sm space-y-4 font-sans">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Official COEKA Bursary Receipt
                        </span>
                        <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                          {reconcileSuccessResult.receipt?.receiptNumber}
                        </div>
                      </div>
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <QrCode className="w-8 h-8 text-slate-800" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Student Beneficiary</span>
                        <strong className="text-slate-900">{reconcileSuccessResult.receipt?.studentName}</strong>
                        <div className="text-[10px] font-mono text-emerald-800">
                          {reconcileSuccessResult.receipt?.matricNumber}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Amount Credited</span>
                        <strong className="text-emerald-950 font-mono text-sm">
                          {reconcileSuccessResult.receipt?.formattedAmountPaid}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Remaining Debt</span>
                        <strong className="text-rose-700 font-mono">
                          {reconcileSuccessResult.receipt?.formattedBalanceRemaining || '₦0.00'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Invoice Number</span>
                        <strong className="text-slate-800 font-mono">
                          {reconcileSuccessResult.invoice?.invoice_number || 'INV-2026-COEKA'}
                        </strong>
                      </div>
                    </div>

                    {/* Cryptographic SHA-256 Tamper Proof Hash */}
                    <div className="pt-3 border-t border-slate-200 text-[11px] space-y-1">
                      <span className="text-slate-500 font-bold block">Cryptographic Verification Hash:</span>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="font-mono text-[10px] text-slate-700 truncate max-w-[280px]">
                          {reconcileSuccessResult.receipt?.verificationHash}
                        </span>
                        <button
                          onClick={() => handleCopy(reconcileSuccessResult.receipt?.verificationHash || '')}
                          className="p-1 text-slate-500 hover:text-emerald-700 transition"
                          title="Copy Hash"
                        >
                          {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseModal}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition"
                    >
                      Done & Return to Ledger
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
