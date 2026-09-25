import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Clock,
  AlertTriangle,
  CreditCard,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useLibraryStats } from '../../hooks/useLibrarianData';
import { InventoryManager } from './InventoryManager';
import { LoanTracker } from './LoanTracker';
import { ClearancePortal } from './ClearancePortal';

export const LibrarianDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'loans' | 'clearance'>('inventory');
  const { data: stats, isLoading } = useLibraryStats();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Executive Header Banner */}
      <div className="bento-card p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-800">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Asset & Clearance Hub
            </span>
            <span className="text-xs text-emerald-200">College Main Library</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Librarian Academic Asset & Clearance Management
          </h2>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Custodianship of institutional literature, circulation loan tracking, penalty fine assessments, and digital graduation clearance stamps.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center w-full md:w-auto shrink-0 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-300 block">Repository Health</span>
          <div className="text-2xl font-black text-white">
            {stats ? `${stats.availableVolumes} / ${stats.totalVolumes}` : '---'}
          </div>
          <span className="text-[11px] font-bold block text-emerald-200">Volumes Available for Circulation</span>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Catalog Titles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">
              {isLoading ? '...' : stats?.totalTitles || 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Catalog Titles</div>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">
              {isLoading ? '...' : stats?.activeLoans || 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Active Borrowers</div>
          </div>
        </div>

        {/* Overdue Loans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-800 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-rose-700">
              {isLoading ? '...' : stats?.overdueLoans || 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Overdue Unreturned</div>
          </div>
        </div>

        {/* Cleared Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-800 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-teal-800">
              {isLoading ? '...' : stats?.totalStudentsCleared || 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Students Cleared</div>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'inventory'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Inventory Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 relative ${
            activeTab === 'loans'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Loan & Overdue Tracker</span>
          {(stats?.overdueLoans || 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-black">
              {stats?.overdueLoans}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clearance')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'clearance'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Digital Clearance Portal</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'loans' && <LoanTracker />}
        {activeTab === 'clearance' && <ClearancePortal />}
      </div>
    </div>
  );
};
