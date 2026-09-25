import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Building,
  Layers,
  Activity,
  Check,
} from 'lucide-react';
import { useBursarRevenue } from '../../hooks/useBursarData';

export const BursarDashboard: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const { data: revenueData, isLoading, refetch, isRefetching } = useBursarRevenue({
    divisionId: selectedDivision || undefined,
  });

  const summary = revenueData?.summary;
  const breakdown = revenueData?.breakdown || [];
  const byChannel = revenueData?.byChannel || [];

  return (
    <div className="space-y-6">
      {/* Top Controls & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Institutional Revenue & Collection Analytics
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Ledger
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time aggregate totals, debt exposure, and multi-rail collection channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">All Academic Divisions</option>
              <option value="div-nce">NCE Programmes</option>
              <option value="div-deg">Degree Programmes</option>
              <option value="div-sec">Demonstration Secondary</option>
              <option value="div-pri">Staff Primary School</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 shadow-sm transition disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (Integer Kobo Arithmetic Grounded) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected Revenue */}
        <div className="bento-card p-5 border border-slate-200 bg-white relative overflow-hidden group hover:border-slate-300 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Expected Billings</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {summary?.formattedTotalExpected || '₦0.00'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Current Session Invoices</span>
            <span className="font-semibold text-slate-700">100% Invoiced</span>
          </div>
        </div>

        {/* Total Collected Revenue */}
        <div className="bento-card p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white relative overflow-hidden group hover:border-emerald-300 transition shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Total Collected</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 tracking-tight font-mono">
            {summary?.formattedTotalCollected || '₦0.00'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700">
            <span className="flex items-center gap-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> Reconciled & Cleared
            </span>
            <span className="font-bold text-emerald-800 font-mono">{summary?.collectionRate || 0}% Rate</span>
          </div>
        </div>

        {/* Total Outstanding Debt */}
        <div className="bento-card p-5 border border-rose-200 bg-gradient-to-br from-rose-50/50 to-white relative overflow-hidden group hover:border-rose-300 transition shadow-sm">
          <div className="flex items-center justify-between text-rose-800 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">Total Debt Balance</span>
            <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-950 tracking-tight font-mono">
            {summary?.formattedTotalOutstanding || '₦0.00'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-rose-700">
            <span>Outstanding Across Divisions</span>
            <span className="font-semibold text-rose-800">Action Required</span>
          </div>
        </div>

        {/* Collection Efficiency & Volume */}
        <div className="bento-card p-5 border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white relative overflow-hidden group hover:border-amber-300 transition shadow-sm">
          <div className="flex items-center justify-between text-amber-800 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Collection Health</span>
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 tracking-tight font-mono">
            {summary?.collectionRate || 0}%
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-amber-800">
            <span>Total Transactions:</span>
            <span className="font-bold font-mono text-amber-950">{summary?.totalTransactionsCount || 0} Txns</span>
          </div>
        </div>
      </div>

      {/* Division & Level Revenue Breakdown Table */}
      <div className="bento-card p-6 border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-700" />
              Revenue Breakdown by Division & Academic Level
            </h3>
            <p className="text-xs text-slate-500">
              Analysis of fee billings, realized collections, and recovery percentages
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Last Updated: {new Date((revenueData?.generatedAt || Date.now() / 1000) * 1000).toLocaleTimeString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3 text-center">Level</th>
                <th className="py-3 px-3 text-center">Students</th>
                <th className="py-3 px-3 text-right">Expected (₦)</th>
                <th className="py-3 px-3 text-right">Collected (₦)</th>
                <th className="py-3 px-3 text-right">Debt Balance (₦)</th>
                <th className="py-3 px-3 text-center">Recovery %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {breakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No division breakdown data available for this filter.
                  </td>
                </tr>
              ) : (
                breakdown.map((row, idx) => (
                  <tr key={`${row.divisionId}-${row.level}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      {row.divisionName}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">{row.level}L</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700 font-medium">
                      {row.studentCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                      {row.formattedExpected}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                      {row.formattedCollected}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {row.formattedOutstanding}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.collectionRate >= 75
                                ? 'bg-emerald-600'
                                : row.collectionRate >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, row.collectionRate)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-800">
                          {row.collectionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Rail Payment Channels Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bento-card p-6 border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                Collections by Payment Rail & Settlement Gateway
              </h3>
              <p className="text-xs text-slate-500">Distribution across dynamic virtual NUBAN, POS, bank transfers, and web</p>
            </div>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
              Verified Settlements
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {byChannel.map((ch) => {
              const labelMap: Record<string, { name: string; tag: string; color: string }> = {
                VPAY_VIRTUAL_ACCOUNT: { name: 'VPay Dynamic NUBAN', tag: 'Direct USSD/Bank App', color: 'border-l-emerald-600' },
                BANK_TRANSFER: { name: 'Direct Bank Transfer', tag: 'Manual Teller / Wire', color: 'border-l-blue-600' },
                POS_TERMINAL: { name: 'Bursary POS Terminal', tag: 'Counter Swipe/Chip', color: 'border-l-purple-600' },
                PAYSTACK: { name: 'Paystack Gateway', tag: 'Card & Bank Checkout', color: 'border-l-cyan-600' },
                REMITA: { name: 'Remita e-Collection', tag: 'TSA Integrated Rail', color: 'border-l-amber-600' },
              };
              const meta = labelMap[ch.channel] || { name: ch.channel, tag: 'Standard Settlement', color: 'border-l-slate-400' };

              return (
                <div
                  key={ch.channel}
                  className={`p-4 rounded-xl border border-slate-200 bg-slate-50/50 border-l-4 ${meta.color} flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{meta.name}</h4>
                      <span className="text-[10px] text-slate-500 block">{meta.tag}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {ch.count} txns
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-semibold">Realized:</span>
                    <span className="text-sm font-mono font-bold text-emerald-900">{ch.formattedTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit & Compliance Sidebar */}
        <div className="bento-card p-6 border border-slate-200 bg-gradient-to-br from-slate-900 to-emerald-950 text-white shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <PieChart className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Audited Financial Controls
              </span>
            </div>
            <h4 className="text-lg font-bold">Kobo-Precision Zero Float Guarantee</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every fee invoice, partial payment, and manual reconciliation is sealed into the cryptographic audit trail with SHA-256 integrity proofs. Fractional kobo loss and currency floating errors are mathematically rejected at the database engine level.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Strict integer Kobo calculations</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Immediate D1 student balance mutation</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SHA-256 tamper-evident receipt hashes</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Bursary System Version</span>
            <span className="text-amber-300 font-bold">v2.4 - Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
};
