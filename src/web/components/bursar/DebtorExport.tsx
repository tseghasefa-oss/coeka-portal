import React, { useState } from 'react';
import {
  Download,
  Search,
  Filter,
  AlertCircle,
  Bell,
  CheckCircle2,
  Mail,
  Phone,
  Building,
  RefreshCw,
  X,
  Send,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import {
  useBursarDebtors,
  useSendDebtAlert,
  DebtorItem,
} from '../../hooks/useBursarData';

export const DebtorExport: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: debtors, isLoading, refetch, isRefetching } = useBursarDebtors({
    divisionId: selectedDivision || undefined,
    level: selectedLevel ? parseInt(selectedLevel, 10) : undefined,
    search: searchQuery || undefined,
  });

  const sendAlertMutation = useSendDebtAlert();

  // Alert Modal State
  const [targetDebtor, setTargetDebtor] = useState<DebtorItem | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'NOTICE' | 'WARNING' | 'FINAL_DEMAND' | 'EXAM_BARRED'>('WARNING');
  const [alertNotes, setAlertNotes] = useState<string>('');
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  const handleOpenAlertModal = (debtor: DebtorItem) => {
    setTargetDebtor(debtor);
    setAlertSuccessMsg(null);
    setAlertSeverity(debtor.hasActiveAlert ? 'FINAL_DEMAND' : 'WARNING');
    setAlertNotes(`Official bursary demand notice for outstanding fee balance of ${debtor.formattedDebt}. Settlement required prior to semester examinations.`);
  };

  const handleCloseAlertModal = () => {
    setTargetDebtor(null);
    setAlertSuccessMsg(null);
  };

  const handleDispatchAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDebtor) return;

    try {
      await sendAlertMutation.mutateAsync({
        studentId: targetDebtor.studentId,
        severity: alertSeverity,
        notes: alertNotes.trim(),
      });
      setAlertSuccessMsg(`Institutional alert (${alertSeverity}) dispatched to ${targetDebtor.fullName} (${targetDebtor.matricNumber})`);
      setTimeout(() => {
        handleCloseAlertModal();
      }, 1800);
    } catch (err: any) {
      // Error handled by mutation
    }
  };

  /**
   * RFC-4180 compliant CSV Export Generator
   */
  const handleExportCSV = () => {
    if (!debtors || debtors.length === 0) {
      alert('No debtor records available to export.');
      return;
    }

    const headers = [
      'Matriculation Number',
      'Full Name',
      'Academic Division',
      'Programme of Study',
      'Academic Level',
      'Total Invoiced (NGN)',
      'Total Paid (NGN)',
      'Outstanding Debt (NGN)',
      'Unpaid Invoices Count',
      'Invoice Numbers',
      'Email Address',
      'Phone Number',
      'Active Alert Severity',
    ];

    const escapeCSV = (val: any) => {
      const stringVal = val === null || val === undefined ? '' : String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const rows = debtors.map((d) => [
      escapeCSV(d.matricNumber),
      escapeCSV(d.fullName),
      escapeCSV(d.divisionName),
      escapeCSV(d.programmeName),
      escapeCSV(`${d.level}L`),
      escapeCSV((d.totalBilledKobo / 100).toFixed(2)),
      escapeCSV((d.totalPaidKobo / 100).toFixed(2)),
      escapeCSV((d.outstandingDebtKobo / 100).toFixed(2)),
      escapeCSV(d.unpaidInvoicesCount),
      escapeCSV(d.invoiceNumbers),
      escapeCSV(d.email),
      escapeCSV(d.phoneNumber),
      escapeCSV(d.alertSeverity),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `COEKA_Institutional_Debtors_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalOutstandingKobo = (debtors || []).reduce((acc, d) => acc + (d.outstandingDebtKobo || 0), 0);
  const formattedTotalOutstanding = `₦${(totalOutstandingKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Institutional Debt Recovery & Student Clearance
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
              {(debtors || []).length} Outstanding Accounts
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time debtor ledger with total exposure of{' '}
            <strong className="text-rose-700 font-mono">{formattedTotalOutstanding}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 shadow-sm transition disabled:opacity-50"
            title="Refresh Debtors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!debtors || debtors.length === 0}
            className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Debtor List (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search debtors by Matriculation Number, Student Name, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">All Divisions</option>
              <option value="div-nce">NCE Programmes</option>
              <option value="div-deg">Degree Programmes</option>
              <option value="div-sec">Demonstration Secondary</option>
              <option value="div-pri">Staff Primary School</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">All Levels</option>
              <option value="100">100 Level / JSS1 / Basic 1</option>
              <option value="200">200 Level / JSS2 / Basic 2</option>
              <option value="300">300 Level / JSS3 / Basic 3</option>
              <option value="400">400 Level (Degree)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Debtors Table */}
      <div className="bento-card border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Student Name & Matric</th>
                <th className="py-3 px-4">Division & Level</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Invoiced (₦)</th>
                <th className="py-3 px-4 text-right">Paid (₦)</th>
                <th className="py-3 px-4 text-right">Debt Balance (₦)</th>
                <th className="py-3 px-4 text-center">Alert Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Aggregating active debtor list...</span>
                    </div>
                  </td>
                </tr>
              ) : !debtors || debtors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-50" />
                    No students with outstanding fee balances found for the selected criteria.
                  </td>
                </tr>
              ) : (
                debtors.map((debtor) => {
                  const severityBadgeMap: Record<string, { label: string; bg: string; text: string }> = {
                    EXAM_BARRED: { label: 'EXAM BARRED', bg: 'bg-red-100', text: 'text-red-900 border border-red-300' },
                    FINAL_DEMAND: { label: 'FINAL DEMAND', bg: 'bg-rose-100', text: 'text-rose-900 border border-rose-300' },
                    WARNING: { label: 'WARNING ISSUED', bg: 'bg-amber-100', text: 'text-amber-900 border border-amber-300' },
                    NOTICE: { label: 'NOTICE SENT', bg: 'bg-blue-100', text: 'text-blue-900 border border-blue-300' },
                    NONE: { label: 'NO ALERT', bg: 'bg-slate-100', text: 'text-slate-600' },
                  };
                  const badge = severityBadgeMap[debtor.alertSeverity] || severityBadgeMap.NONE;

                  return (
                    <tr key={debtor.studentId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 text-sm block">{debtor.fullName}</strong>
                        <span className="font-mono text-emerald-800 font-bold text-[11px]">
                          {debtor.matricNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 font-medium block">{debtor.divisionName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {debtor.level}L • {debtor.programmeName}
                        </span>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{debtor.email}</span>
                        </div>
                        {debtor.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{debtor.phoneNumber}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 font-medium">
                        {debtor.formattedBilled}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-800 font-bold">
                        {debtor.formattedPaid}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-700 font-black text-sm">
                        {debtor.formattedDebt}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenAlertModal(debtor)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Bell className="w-3 h-3" />
                          <span>Send Alert</span>
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

      {/* Debt Alert Modal */}
      {targetDebtor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-800/80 px-2 py-0.5 rounded border border-amber-700">
                  Institutional Action
                </span>
                <h3 className="text-lg font-bold mt-1 text-white">Dispatch Debt Reminder & Clearance Warning</h3>
                <p className="text-xs text-amber-200">
                  Transmits formal financial demand notice and examination clearance restrictions
                </p>
              </div>
              <button
                onClick={handleCloseAlertModal}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              {alertSuccessMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Alert Dispatched Successfully!</h4>
                    <p className="mt-0.5">{alertSuccessMsg}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDispatchAlert} className="space-y-4">
                  {/* Debtor Profile Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Student:</span>
                      <strong className="text-slate-900">{targetDebtor.fullName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Matriculation Number:</span>
                      <span className="font-mono text-emerald-800 font-bold">{targetDebtor.matricNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Outstanding Balance:</span>
                      <strong className="text-rose-700 font-mono text-sm">{targetDebtor.formattedDebt}</strong>
                    </div>
                  </div>

                  {/* Severity Level Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Clearance Warning Severity Level *
                    </label>
                    <select
                      value={alertSeverity}
                      onChange={(e) => setAlertSeverity(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                    >
                      <option value="NOTICE">NOTICE: Friendly Reminder (Payment Approaching)</option>
                      <option value="WARNING">WARNING: Formal Demand (Payment Past Due)</option>
                      <option value="FINAL_DEMAND">FINAL DEMAND: Imminent Academic Sanction</option>
                      <option value="EXAM_BARRED">EXAM BARRED: Examination Clearance Pass Revoked</option>
                    </select>
                  </div>

                  {/* Notes / Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Official Warning Remarks / Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={alertNotes}
                      onChange={(e) => setAlertNotes(e.target.value)}
                      className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Error display */}
                  {sendAlertMutation.isError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{sendAlertMutation.error?.message || 'Failed to dispatch alert'}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseAlertModal}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendAlertMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      {sendAlertMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Dispatch Official Alert</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
