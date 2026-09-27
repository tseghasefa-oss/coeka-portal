import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Building,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface FeeScheduleItem {
  scheduleId: string;
  feeTitle: string;
  divisionCode: string;
  divisionName: string;
  level: number;
  amountKobo: number;
  amountNaira: string;
  dueDate: string;
  isCompulsory: boolean;
}

export const FeeMatrixAuditor: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const [feeMatrix, setFeeMatrix] = useState<FeeScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFeeMatrix = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/governance/fee-matrix');
      const data: any = await res.json();
      if (data.success && data.feeMatrix) {
        setFeeMatrix(data.feeMatrix);
      } else {
        setErrorMessage(data.error || 'Failed to retrieve fee matrix policy data');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error fetching fee matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeMatrix();
  }, []);

  const divisions = Array.from(new Set(feeMatrix.map((item) => item.divisionCode)));

  const filteredMatrix = feeMatrix.filter((item) => {
    const matchesDiv = divisionFilter === 'ALL' || item.divisionCode === divisionFilter;
    const matchesLevel = levelFilter === 'ALL' || String(item.level) === levelFilter;
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.feeTitle.toLowerCase().includes(term) ||
      item.divisionName.toLowerCase().includes(term) ||
      item.divisionCode.toLowerCase().includes(term);

    return matchesDiv && matchesLevel && matchesSearch;
  });

  const totalPotKobo = feeMatrix.reduce((acc, curr) => acc + (curr.amountKobo || 0), 0);
  const formattedPotNaira = '₦' + (totalPotKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isNavy
            ? 'bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950 border-amber-900/40 text-white'
            : 'bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 border-amber-700 text-white'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Read-Only Governance Auditor
            </span>
          </div>
          <h2 className="text-2xl font-black mt-1 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-400" />
            Institutional Fee Matrix & Tariffs
          </h2>
          <p className="text-xs text-slate-200 mt-1 max-w-2xl">
            SuperAdmin policy auditor for cross-faculty fee schedules. Guarantees that Bursary fee schedules
            comply with institutional caps and regulatory ministry guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchFeeMatrix}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Matrix
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border ${isNavy ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tariffs</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{feeMatrix.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active schedule items</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isNavy ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Divisions</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{divisions.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Degree, NCE, Diploma</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isNavy ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compulsory Items</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {feeMatrix.filter((f) => f.isCompulsory).length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Mandatory student dues</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isNavy ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Combined Schedule Cap</div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1.5 truncate">
            {formattedPotNaira}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Aggregated matrix sum</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
          isNavy ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search fee title, division, or schedule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-amber-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Academic Divisions</option>
            {divisions.map((div) => (
              <option key={div} value={div}>
                Division: {div}
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm ${
          isNavy ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-amber-500" />
            <span className="text-xs font-bold">Auditing fee matrix schedules...</span>
          </div>
        ) : filteredMatrix.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold">No fee schedules found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Fee Category</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Policy Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
                {filteredMatrix.map((item) => (
                  <tr key={item.scheduleId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      {item.feeTitle}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        {item.divisionCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {item.level} Level
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                      {item.amountNaira}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {item.dueDate || 'End of Semester'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.isCompulsory ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          COMPULSORY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          OPTIONAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
