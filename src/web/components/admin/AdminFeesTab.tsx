import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Edit3,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface FeeScheduleItem {
  id: string;
  categoryName: string;
  categoryCode: string;
  division: string;
  level: number | string;
  session: string;
  amountKobo: number;
  formattedAmount: string;
  dueDate: string;
  isRecurring: boolean;
}

export const AdminFeesTab: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // Seeded/Managed Fee Schedules
  const [schedules, setSchedules] = useState<FeeScheduleItem[]>([
    {
      id: 'fs-1',
      categoryName: 'NCE School Fees (Tuition & Services)',
      categoryCode: 'NCE-TUI',
      division: 'NCE',
      level: 100,
      session: '2026/2027',
      amountKobo: 4500000, // ₦45,000.00
      formattedAmount: '₦45,000.00',
      dueDate: '2026-12-15',
      isRecurring: true,
    },
    {
      id: 'fs-2',
      categoryName: 'Provisional Acceptance Fee',
      categoryCode: 'NCE-ACC',
      division: 'NCE',
      level: 100,
      session: '2026/2027',
      amountKobo: 1500000, // ₦15,000.00
      formattedAmount: '₦15,000.00',
      dueDate: '2026-11-30',
      isRecurring: false,
    },
    {
      id: 'fs-3',
      categoryName: 'Hostel Accommodation (Standard Hall)',
      categoryCode: 'HST-STD',
      division: 'NCE',
      level: 100,
      session: '2026/2027',
      amountKobo: 2000000, // ₦20,000.00
      formattedAmount: '₦20,000.00',
      dueDate: '2026-12-15',
      isRecurring: true,
    },
    {
      id: 'fs-4',
      categoryName: 'Degree Programme School Fees',
      categoryCode: 'DEG-TUI',
      division: 'DEGREE',
      level: 100,
      session: '2026/2027',
      amountKobo: 7500000, // ₦75,000.00
      formattedAmount: '₦75,000.00',
      dueDate: '2026-12-15',
      isRecurring: true,
    },
    {
      id: 'fs-5',
      categoryName: 'Demonstration Secondary Termly Fees',
      categoryCode: 'SEC-TRM',
      division: 'SECONDARY',
      level: 'SS1',
      session: '2026/2027',
      amountKobo: 3200000, // ₦32,000.00
      formattedAmount: '₦32,000.00',
      dueDate: '2026-10-31',
      isRecurring: true,
    },
    {
      id: 'fs-6',
      categoryName: 'Staff Primary School Termly Fees',
      categoryCode: 'PRI-TRM',
      division: 'PRIMARY',
      level: 'Basic 1',
      session: '2026/2027',
      amountKobo: 1800000, // ₦18,000.00
      formattedAmount: '₦18,000.00',
      dueDate: '2026-10-31',
      isRecurring: true,
    },
  ]);

  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeeScheduleItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState('NCE School Fees (Tuition & Services)');
  const [formCategoryCode, setFormCategoryCode] = useState('NCE-TUI');
  const [formDivision, setFormDivision] = useState('NCE');
  const [formLevel, setFormLevel] = useState<number | string>(100);
  const [formAmountNaira, setFormAmountNaira] = useState<number>(45000);
  const [formDueDate, setFormDueDate] = useState('2026-12-15');

  const calculatedKobo = Math.round((formAmountNaira || 0) * 100);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formAmountNaira || formAmountNaira <= 0) {
      alert('Amount must be a positive integer in Naira.');
      return;
    }

    const kobo = Math.round(formAmountNaira * 100);
    const formatted = `₦${(kobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    if (editingSchedule) {
      setSchedules(
        schedules.map((s) =>
          s.id === editingSchedule.id
            ? {
                ...s,
                amountKobo: kobo,
                formattedAmount: formatted,
                dueDate: formDueDate,
              }
            : s
        )
      );
      showToast(`Updated price for ${editingSchedule.categoryName} to ${formatted}`);
    } else {
      const newItem: FeeScheduleItem = {
        id: `fs-${Date.now()}`,
        categoryName: formCategory,
        categoryCode: formCategoryCode,
        division: formDivision,
        level: formLevel,
        session: '2026/2027',
        amountKobo: kobo,
        formattedAmount: formatted,
        dueDate: formDueDate,
        isRecurring: true,
      };
      setSchedules([newItem, ...schedules]);
      showToast(`Set new fee price ${formatted} for ${newItem.categoryName}`);
    }

    setShowPriceModal(false);
    setEditingSchedule(null);
  };

  const handleOpenEdit = (sched: FeeScheduleItem) => {
    setEditingSchedule(sched);
    setFormCategory(sched.categoryName);
    setFormCategoryCode(sched.categoryCode);
    setFormDivision(sched.division);
    setFormLevel(sched.level);
    setFormAmountNaira(sched.amountKobo / 100);
    setFormDueDate(sched.dueDate);
    setShowPriceModal(true);
  };

  const handleDeleteSchedule = (id: string, name: string) => {
    if (confirm(`Remove fee schedule for ${name}?`)) {
      setSchedules(schedules.filter((s) => s.id !== id));
      showToast(`Fee schedule for ${name} removed.`);
    }
  };

  const filteredSchedules = schedules.filter(
    (s) => selectedDivision === 'ALL' || s.division === selectedDivision
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-300 border border-amber-400/40 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Strict Kobo Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-amber-900 flex items-center gap-2">
            Strict Kobo-Integer Arithmetic Active
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-mono">
              100 Kobo = ₦1.00
            </span>
          </h4>
          <p className="text-amber-800 leading-relaxed">
            All prices and fee schedules are stored in pure integer Kobo to prevent floating-point rounding errors across the multi-divisional ledger. Service charges are capped strictly at ₦2,000 max.
          </p>
        </div>
      </div>

      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className={`w-6 h-6 ${isNavy ? 'text-blue-600' : 'text-emerald-700'}`} />
            Institutional Fee Price Setting & Ledger Configuration
          </h2>
          <p className="text-xs text-slate-500">
            Define mandatory tuition, provisional acceptance, departmental levies, and hostel prices for 2026/2027.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSchedule(null);
            setFormAmountNaira(50000);
            setShowPriceModal(true);
          }}
          className={`flex items-center gap-2 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all ${
            isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Set Fee Schedule Price</span>
        </button>
      </div>

      {/* Division Switcher */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto">
        <Layers className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <span className="text-xs font-semibold text-slate-500 shrink-0">Filter Division:</span>
        {['ALL', 'NCE', 'DEGREE', 'SECONDARY', 'PRIMARY'].map((div) => (
          <button
            key={div}
            onClick={() => setSelectedDivision(div)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDivision === div
                ? isNavy
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-emerald-800 text-amber-300 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {div}
          </button>
        ))}
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Fee Category</th>
                <th className="py-3 px-4 text-center">Division</th>
                <th className="py-3 px-4 text-center">Level / Class</th>
                <th className="py-3 px-4 text-right">Raw Kobo (Storage)</th>
                <th className="py-3 px-4 text-right">Official Price (₦)</th>
                <th className="py-3 px-4 text-center">Payment Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSchedules.map((sched) => (
                <tr key={sched.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div>{sched.categoryName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sched.categoryCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {sched.division}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                    {sched.level}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 font-bold">
                    {sched.amountKobo.toLocaleString()} kobo
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                    {sched.formattedAmount}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600">
                    <div className="inline-flex items-center gap-1 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{sched.dueDate}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(sched)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="Edit Price"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(sched.id, sched.categoryName)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set/Edit Fee Schedule Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {editingSchedule ? 'Modify Fee Price' : 'Set Institutional Fee Schedule'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter price in Naira. The system converts and validates the exact Kobo integer value.
            </p>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fee Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    setFormCategory(e.target.value);
                    if (e.target.value.includes('Tuition')) setFormCategoryCode('NCE-TUI');
                    else if (e.target.value.includes('Acceptance')) setFormCategoryCode('NCE-ACC');
                    else if (e.target.value.includes('Hostel')) setFormCategoryCode('HST-STD');
                    else setFormCategoryCode('FEE-GEN');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="NCE School Fees (Tuition & Services)">NCE School Fees (Tuition & Services)</option>
                  <option value="Provisional Acceptance Fee">Provisional Acceptance Fee</option>
                  <option value="Hostel Accommodation (Standard Hall)">Hostel Accommodation (Standard Hall)</option>
                  <option value="Teaching Practice & Supervision Levy">Teaching Practice & Supervision Levy</option>
                  <option value="Degree Programme School Fees">Degree Programme School Fees</option>
                  <option value="Demonstration Secondary Termly Fees">Demonstration Secondary Termly Fees</option>
                  <option value="Staff Primary School Termly Fees">Staff Primary School Termly Fees</option>
                  <option value="ICT & Computational Laboratory Levy">ICT & Computational Laboratory Levy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Division</label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="NCE">NCE</option>
                    <option value="DEGREE">DEGREE</option>
                    <option value="SECONDARY">SECONDARY</option>
                    <option value="PRIMARY">PRIMARY</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Level</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={100}>100 Level</option>
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                    <option value={400}>400 Level</option>
                    <option value="SS1">Senior Secondary 1 (SS1)</option>
                    <option value="Basic 1">Basic Primary 1</option>
                  </select>
                </div>
              </div>

              {/* Price Input & Dynamic Kobo Calculation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Price in Naira (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-500">₦</span>
                    <input
                      type="number"
                      step={100}
                      min={100}
                      required
                      placeholder="e.g. 45000"
                      value={formAmountNaira}
                      onChange={(e) => setFormAmountNaira(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Strict Storage in Ledger:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {calculatedKobo.toLocaleString()} Kobo
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow ${
                    isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                  }`}
                >
                  Save Schedule Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
