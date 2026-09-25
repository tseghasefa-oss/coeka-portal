import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Users,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { BursarDashboard } from './BursarDashboard';
import { ReconciliationTable } from './ReconciliationTable';
import { DebtorExport } from './DebtorExport';
import { useAppStore } from '../../stores/useAppStore';

interface BursarModuleProps {
  // Optional slot to pass the student payment / virtual account view
  renderStudentPaymentView?: () => React.ReactNode;
}

export const BursarModule: React.FC<BursarModuleProps> = ({ renderStudentPaymentView }) => {
  const { userSession } = useAppStore();
  const [bursarSubTab, setBursarSubTab] = useState<'revenue' | 'reconciliation' | 'debtors' | 'studentView'>(
    userSession?.role === 'STUDENT' ? 'studentView' : 'revenue'
  );

  const isBursarOrAdmin = ['BURSAR', 'BURSARY', 'SUPER_ADMIN', 'ADMIN'].includes(userSession?.role || '');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bento-card p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800 shadow-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-700">
            Bursary & Financial Engine
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Welcome, {userSession?.fullName || 'Bursary Officer'}, {userSession?.role || 'BURSAR'}
          </h2>
          <p className="text-xs text-emerald-200">
            Kobo-precision ledger reconciliation, institutional debt recovery, and multi-rail collection
          </p>
        </div>
        <div className="text-left sm:text-right text-xs">
          <span className="text-slate-400 block text-[10px] uppercase">Operating Terminal</span>
          <span className="font-mono text-amber-300 font-bold">
            {userSession?.username || 'bursar_terminal'}
          </span>
        </div>
      </div>

      {/* Bursary Sub-navigation Bar */}
      {isBursarOrAdmin && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200">
          <button
            onClick={() => setBursarSubTab('revenue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              bursarSubTab === 'revenue'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Revenue & Analytics</span>
          </button>

          <button
            onClick={() => setBursarSubTab('reconciliation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              bursarSubTab === 'reconciliation'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Bank & POS Reconciliation</span>
          </button>

          <button
            onClick={() => setBursarSubTab('debtors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              bursarSubTab === 'debtors'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Debtor Management & Clearance</span>
          </button>

          {renderStudentPaymentView && (
            <button
              onClick={() => setBursarSubTab('studentView')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                bursarSubTab === 'studentView'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Student Invoices & NUBAN</span>
            </button>
          )}
        </div>
      )}

      {/* Sub-tab Views */}
      {bursarSubTab === 'revenue' && <BursarDashboard />}
      {bursarSubTab === 'reconciliation' && <ReconciliationTable />}
      {bursarSubTab === 'debtors' && <DebtorExport />}
      {bursarSubTab === 'studentView' && renderStudentPaymentView && renderStudentPaymentView()}
    </div>
  );
};
