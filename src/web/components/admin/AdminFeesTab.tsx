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
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAppStore, SchoolDivision } from '../../stores/useAppStore';
import { useFeeSchedules, FeeScheduleItem, FeeCategoryItem } from '../../hooks/useAdminData';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const AdminFeesTab: React.FC = () => {
  const { uiPreferences, activeDivision, setActiveDivision } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // React Query Hook with Invalidation of Invoices
  const {
    feeSchedules,
    feeCategories,
    isLoading,
    isError,
    setFeePrice,
    isSettingPrice,
    updateFeeSchedule,
    deleteFeeSchedule,
    isDeleting,
    applyToAllLevels,
    isApplyingToAll,
    refetch,
  } = useFeeSchedules();

  const [activeView, setActiveView] = useState<'matrix' | 'table'>('matrix');
  const [selectedDivision, setSelectedDivision] = useState<SchoolDivision>('NCE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single Level Price Modal State
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [modalCategory, setModalCategory] = useState<{ id: string; name: string; code: string } | null>(null);
  const [modalLevel, setModalLevel] = useState<number | string>(100);
  const [modalAmountNaira, setModalAmountNaira] = useState<number>(45000);
  const [modalDueDate, setModalDueDate] = useState<string>('2026-12-15');

  // "Apply to All" Common Levies Modal State
  const [showApplyAllModal, setShowApplyAllModal] = useState(false);
  const [applyAllCategory, setApplyAllCategory] = useState<FeeCategoryItem | null>(null);
  const [applyAllAmountNaira, setApplyAllAmountNaira] = useState<number>(12500);
  const [applyAllDueDate, setApplyAllDueDate] = useState<string>('2026-12-15');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDangerous?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Division level configurations
  const divisionLevelsMap: Record<SchoolDivision, (number | string)[]> = {
    NCE: [100, 200, 300],
    DEGREE: [100, 200, 300, 400],
    SECONDARY: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
    PRIMARY: ['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'],
  };

  const currentLevels = divisionLevelsMap[selectedDivision];

  // Filter categories by division
  const currentCategories = feeCategories.filter((c) => {
    if (selectedDivision === 'NCE') return c.divisionId.includes('nce') || c.id.includes('nce') || c.id.includes('hostel');
    if (selectedDivision === 'DEGREE') return c.divisionId.includes('degree') || c.id.includes('deg');
    if (selectedDivision === 'SECONDARY') return c.divisionId.includes('secondary') || c.id.includes('sec');
    if (selectedDivision === 'PRIMARY') return c.divisionId.includes('primary') || c.id.includes('pri');
    return true;
  });

  // Helper to find schedule for given Category + Level
  const getScheduleForCell = (categoryId: string, level: number | string): FeeScheduleItem | undefined => {
    return feeSchedules.find(
      (s) => s.categoryId === categoryId && String(s.level) === String(level)
    );
  };

  // Save single price cell
  const handleSaveSinglePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCategory) return;

    if (!modalAmountNaira || modalAmountNaira < 0) {
      alert('Please enter a valid non-negative amount in Naira.');
      return;
    }

    try {
      await setFeePrice({
        categoryId: modalCategory.id,
        sessionId: 'sess-2026-2027',
        level: modalLevel,
        amountNaira: Number(modalAmountNaira),
        dueDate: modalDueDate,
      });

      const formatted = `₦${modalAmountNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
      showToast(`Set ${modalCategory.name} (${modalLevel}L) to ${formatted}. Invoices synchronized.`);
      setShowSingleModal(false);
    } catch (err: any) {
      alert(`Error setting fee price: ${err.message}`);
    }
  };

  // Handle "Apply to All Levels" for common levies
  const handleApplyToAllSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyAllCategory) return;

    if (!applyAllAmountNaira || applyAllAmountNaira < 0) {
      alert('Please enter a valid non-negative amount in Naira.');
      return;
    }

    try {
      await applyToAllLevels({
        categoryId: applyAllCategory.id,
        sessionId: 'sess-2026-2027',
        levels: currentLevels,
        amountNaira: Number(applyAllAmountNaira),
        dueDate: applyAllDueDate,
      });

      const formatted = `₦${applyAllAmountNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
      showToast(
        `Applied ${formatted} across all ${currentLevels.length} levels for ${applyAllCategory.name}!`
      );
      setShowApplyAllModal(false);
    } catch (err: any) {
      alert(`Batch update failed: ${err.message}`);
    }
  };

  // Open modal for specific cell
  const openSingleCellModal = (category: { id: string; name: string; code: string }, level: number | string) => {
    const existing = getScheduleForCell(category.id, level);
    setModalCategory(category);
    setModalLevel(level);
    setModalAmountNaira(existing ? existing.amountKobo / 100 : 25000);
    setModalDueDate(existing ? existing.dueDate : '2026-12-15');
    setShowSingleModal(true);
  };

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
            Strict Kobo-Integer Arithmetic & Real-Time Student Sync
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-mono font-bold">
              100 Kobo = ₦1.00
            </span>
          </h4>
          <p className="text-amber-800 leading-relaxed">
            All prices and fee schedules are stored in pure integer Kobo to prevent floating-point rounding errors. Whenever a fee schedule is modified, the <strong>useInvoices</strong> query is automatically invalidated so student balances and billing vouchers update instantaneously.
          </p>
        </div>
      </div>

      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className={`w-6 h-6 ${isNavy ? 'text-blue-600' : 'text-emerald-700'}`} />
            Financial Price Setting & Fee Price Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Configure institutional pricing based on <strong>Division $\rightarrow$ Level $\rightarrow$ Fee Item</strong> with one-click levy propagation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Refresh Prices"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* View Toggle */}
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Price Matrix
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detailed List
            </button>
          </div>
        </div>
      </div>

      {/* Division Navigation Tabs */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto">
        <Layers className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <span className="text-xs font-semibold text-slate-500 shrink-0">Select Division:</span>
        {(['NCE', 'DEGREE', 'SECONDARY', 'PRIMARY'] as const).map((div) => (
          <button
            key={div}
            onClick={() => {
              setSelectedDivision(div);
              setActiveDivision(div);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDivision === div
                ? isNavy
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-emerald-800 text-amber-300 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {div === 'NCE' ? 'NCE (Tertiary)' : div === 'DEGREE' ? 'DEGREE (Affiliated)' : div === 'SECONDARY' ? 'SECONDARY' : 'PRIMARY'}
          </button>
        ))}
      </div>

      {/* VIEW 1: PRICE MATRIX (Division -> Level -> Fee Item) */}
      {activeView === 'matrix' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>{selectedDivision} Institutional Price Matrix</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 lowercase font-medium">
                  {currentLevels.length} active levels
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any price cell to set or update that specific level. Use <strong>Apply to All Levels</strong> to propagate flat levies instantly.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 min-w-[240px]">Fee Item / Category</th>
                  {currentLevels.map((lvl) => (
                    <th key={lvl} className="py-3 px-4 text-center min-w-[150px]">
                      {typeof lvl === 'number' ? `${lvl} Level` : lvl}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right min-w-[180px]">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentCategories.length === 0 ? (
                  <tr>
                    <td colSpan={currentLevels.length + 2} className="py-8 text-center text-slate-400">
                      No fee categories configured for this division yet.
                    </td>
                  </tr>
                ) : (
                  currentCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Fee Item Column */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{cat.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>{cat.code}</span>
                          <span>•</span>
                          <span className={cat.isRecurring ? 'text-emerald-600' : 'text-amber-600'}>
                            {cat.isRecurring ? 'Session Recurring' : 'One-Time Payment'}
                          </span>
                        </div>
                      </td>

                      {/* Level Columns (Price Matrix Cells) */}
                      {currentLevels.map((lvl) => {
                        const sched = getScheduleForCell(cat.id, lvl);
                        const hasPrice = !!sched;
                        const formatted = sched ? sched.formattedAmount || `₦${(sched.amountKobo / 100).toLocaleString()}` : null;

                        return (
                          <td key={lvl} className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => openSingleCellModal(cat, lvl)}
                              className={`w-full p-2 rounded-xl text-center transition-all border ${
                                hasPrice
                                  ? 'bg-emerald-50/50 hover:bg-emerald-100/60 border-emerald-200/80 text-emerald-950 shadow-xs'
                                  : 'bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300 text-slate-400'
                              }`}
                              title={`Set price for ${cat.name} (${lvl})`}
                            >
                              {hasPrice ? (
                                <div>
                                  <div className="font-black text-xs text-emerald-900">{formatted}</div>
                                  <div className="text-[10px] font-mono text-emerald-700/80">
                                    {sched.amountKobo.toLocaleString()} kobo
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[11px] font-semibold flex items-center justify-center gap-1">
                                  <Plus className="w-3 h-3 text-slate-400" />
                                  <span>Set Price</span>
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Action Column: Apply to All Levels */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setApplyAllCategory(cat);
                            // Pre-fill amount from level 100 if exists
                            const firstLevelSched = getScheduleForCell(cat.id, currentLevels[0]);
                            setApplyAllAmountNaira(firstLevelSched ? firstLevelSched.amountKobo / 100 : 12500);
                            setShowApplyAllModal(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                            isNavy
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Apply to All Levels</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DETAILED LIST VIEW */}
      {activeView === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Fee Category</th>
                  <th className="py-3 px-4 text-center">Division</th>
                  <th className="py-3 px-4 text-center">Level</th>
                  <th className="py-3 px-4 text-right">Raw Kobo (Storage)</th>
                  <th className="py-3 px-4 text-right">Official Price (₦)</th>
                  <th className="py-3 px-4 text-center">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {feeSchedules.map((sched) => (
                  <tr key={sched.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div>{sched.categoryName || sched.categoryId}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{sched.categoryCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sched.divisionName || selectedDivision}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {sched.level}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 font-bold">
                      {sched.amountKobo.toLocaleString()} kobo
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                      {sched.formattedAmount || `₦${(sched.amountKobo / 100).toLocaleString()}`}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600">
                      <div className="inline-flex items-center gap-1 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{sched.dueDate}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Fee Schedule',
                            message: `Are you sure you want to delete the fee schedule for "${sched.categoryName}" (${sched.level} Level)? Student ledger calculations and billing invoices will be recalculated.`,
                            confirmText: 'Delete Schedule',
                            isDangerous: true,
                            onConfirm: async () => {
                              try {
                                await deleteFeeSchedule(sched.id);
                                showToast('Fee schedule deleted.');
                              } catch (err: any) {
                                showToast(`Delete failed: ${err.message}`);
                              } finally {
                                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                              }
                            },
                          });
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Single Level Price Edit */}
      {showSingleModal && modalCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">Set Price for {modalCategory.name}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Configuring tariff for <strong>{modalLevel} Level</strong> ({selectedDivision}).
            </p>

            <form onSubmit={handleSaveSinglePrice} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Price in Naira (₦) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-500">₦</span>
                    <input
                      type="number"
                      step={100}
                      min={0}
                      required
                      placeholder="e.g. 45000"
                      value={modalAmountNaira}
                      onChange={(e) => setModalAmountNaira(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Strict Integer Kobo:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {Math.round(modalAmountNaira * 100).toLocaleString()} Kobo
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={modalDueDate}
                  onChange={(e) => setModalDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingPrice}
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow flex items-center gap-1.5 ${
                    isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                  } disabled:opacity-50`}
                >
                  {isSettingPrice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Tariff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: "Apply to All Levels" for Common Levies */}
      {showApplyAllModal && applyAllCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-slate-900">
                Apply Price to All {selectedDivision} Levels
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Set a uniform fee for <strong>{applyAllCategory.name}</strong> across all {currentLevels.length} levels (
              {currentLevels.join(', ')}).
            </p>

            <form onSubmit={handleApplyToAllSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div>
                  <label className="text-xs font-bold text-amber-950 block mb-1">
                    Uniform Price in Naira (₦) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-500">₦</span>
                    <input
                      type="number"
                      step={100}
                      min={0}
                      required
                      placeholder="e.g. 12500"
                      value={applyAllAmountNaira}
                      onChange={(e) => setApplyAllAmountNaira(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 text-sm font-bold text-slate-900 rounded-xl border border-amber-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200">
                  <span className="text-amber-900 font-semibold">Strict Storage per Level:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {Math.round(applyAllAmountNaira * 100).toLocaleString()} Kobo
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={applyAllDueDate}
                  onChange={(e) => setApplyAllDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <strong>Affected Levels ({currentLevels.length}):</strong>{' '}
                {currentLevels.map((l) => `${l} Level`).join(', ')}.
                Student invoices will be invalidated and re-tallied immediately upon confirmation.
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyAllModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApplyingToAll}
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow flex items-center gap-1.5 ${
                    isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                  } disabled:opacity-50`}
                >
                  {isApplyingToAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Propagate to All Levels</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDangerous={confirmModal.isDangerous}
        isLoading={isDeleting || isApplyingToAll}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
