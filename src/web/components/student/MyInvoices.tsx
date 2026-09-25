import React, { useState } from 'react';
import {
  CreditCard,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  QrCode,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useStudentInvoices } from '../../hooks/useStudentData';
import { useVirtualAccount } from '../../hooks/usePortalData';

export const MyInvoices: React.FC = () => {
  const { data: invoicesData, isLoading } = useStudentInvoices();
  const { data: virtualAccount } = useVirtualAccount();

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'VPAY' | 'PAYSTACK' | 'REMITA_BSCPP'>('VPAY');
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const handleCopy = (acc: string) => {
    navigator.clipboard?.writeText(acc);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handlePayOnline = (invoiceId: string, amount: string) => {
    setPayingInvoiceId(invoiceId);
    setTimeout(() => {
      alert(`Connecting to ${selectedGateway} secure collection gateway for ${amount}. Transaction reference generated.`);
      setPayingInvoiceId(null);
    }, 600);
  };

  const invoices = invoicesData?.invoices || [];
  const summary = invoicesData?.summary;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* VPay Dedicated Student Bank Account Banner */}
      <div className="bento-card p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-800">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
              VPay Dynamic NUBAN
            </span>
            <span className="text-xs text-emerald-200">Zero-Manual-Reconciliation Rail</span>
          </div>
          <h3 className="text-xl font-bold">Your Dedicated Student Bank Account</h3>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Parents or sponsors can transfer directly from any Nigerian banking app or USSD into this dedicated account. Your fee invoice will be reconciled and credited automatically in seconds without uploading deposit slips.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center w-full md:w-auto shrink-0 space-y-1.5">
          <span className="text-xs text-amber-300 font-semibold block">
            {virtualAccount?.bank_name || 'Wema Bank (COEKA Collection)'}
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-black tracking-wider text-white">
              {virtualAccount?.account_number || '9910840184'}
            </span>
            <button
              onClick={() => handleCopy(virtualAccount?.account_number || '9910840184')}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition cursor-pointer"
              title="Copy Account Number"
            >
              {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-emerald-200 block font-mono">
            {virtualAccount?.account_name || 'COEKA - MOSES IORLIAM'}
          </span>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Billed</span>
          <strong className="text-xl font-black text-slate-900 block mt-1">
            {summary?.formattedTotalDue || '₦65,000.00'}
          </strong>
          <span className="text-[10px] text-slate-400">2026/2027 Academic Session</span>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Settled</span>
          <strong className="text-xl font-black text-emerald-700 block mt-1">
            {summary?.formattedTotalPaid || '₦20,000.00'}
          </strong>
          <span className="text-[10px] text-emerald-600 font-medium">Reconciled to ledger</span>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Outstanding Balance</span>
          <strong className={`text-xl font-black block mt-1 ${summary?.hasOutstandingDebt ? 'text-amber-700' : 'text-emerald-700'}`}>
            {summary?.formattedOutstandingBalance || '₦45,000.00'}
          </strong>
          <span className="text-[10px] text-slate-400">
            {summary?.hasOutstandingDebt ? 'Fee settlement required' : 'Account 100% cleared'}
          </span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Current Session Fee Invoices</h3>
            <p className="text-xs text-slate-500">Official institutional bills and receipts</p>
          </div>

          {/* Payment Rail Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Online Gateway:</label>
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value as any)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
            >
              <option value="VPAY">VPay (Instant Transfer)</option>
              <option value="PAYSTACK">Paystack (Card / USSD)</option>
              <option value="REMITA_BSCPP">Remita BSCPP (Gov Rail)</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {invoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const displayDue = inv.formattedDue || '₦45,000.00';

            return (
              <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{inv.invoiceNumber}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">{inv.feeTitle}</h4>
                  <span className="text-xs text-slate-500">Due: {inv.dueDate}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Due:</span>
                    <strong className="text-base font-bold text-slate-900">
                      {displayDue}
                    </strong>
                  </div>

                  {isPaid ? (
                    <button
                      onClick={() => alert(`Downloading official stamped receipt for ${inv.invoiceNumber}`)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePayOnline(inv.id, displayDue)}
                      disabled={payingInvoiceId === inv.id}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition cursor-pointer"
                    >
                      {payingInvoiceId === inv.id ? 'Connecting...' : 'Pay Online Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
