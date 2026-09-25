import React, { useState } from 'react';
import {
  FastForward,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  DollarSign,
  Layers,
  GraduationCap,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  useBatchPromote,
  useResetSessionBilling,
  PromotionResultData,
  BillingResetResultData,
} from '../../hooks/useAdmissionsData';
import { useAppStore } from '../../stores/useAppStore';

export const SessionControls: React.FC = () => {
  const { activeDivision } = useAppStore();
  const promoteMutation = useBatchPromote();
  const billingResetMutation = useResetSessionBilling();

  // Promotion Controls State
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedFromLevel, setSelectedFromLevel] = useState<string>('ALL');
  const [promotionResult, setPromotionResult] = useState<PromotionResultData | null>(null);

  // Billing Reset State
  const [targetSession, setTargetSession] = useState<string>('2027/2028');
  const [billingDivision, setBillingDivision] = useState<string>('ALL');
  const [billingResult, setBillingResult] = useState<BillingResetResultData | null>(null);

  const [confirmPromoteModal, setConfirmPromoteModal] = useState(false);
  const [confirmBillingModal, setConfirmBillingModal] = useState(false);

  // Trigger Promotion
  const handleExecutePromotion = async () => {
    setConfirmPromoteModal(false);
    try {
      const payload: { divisionCode?: string; fromLevel?: number } = {};
      if (selectedDivision !== 'ALL') payload.divisionCode = selectedDivision;
      if (selectedFromLevel !== 'ALL') payload.fromLevel = Number(selectedFromLevel);

      const res: any = await promoteMutation.mutateAsync(payload);
      setPromotionResult(res.result);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Billing Reset
  const handleExecuteBillingReset = async () => {
    setConfirmBillingModal(false);
    try {
      const payload: { newSession: string; divisionCode?: string } = {
        newSession: targetSession,
      };
      if (billingDivision !== 'ALL') payload.divisionCode = billingDivision;

      const res: any = await billingResetMutation.mutateAsync(payload);
      setBillingResult(res.result);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-700" />
          <span>Academic Session Lifecycle & Financial Transition Controls</span>
        </h2>
        <p className="text-xs text-slate-500">
          Automated year-end student progression, academic standing evaluation, carry-over detection, and statutory fee matrix reset.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: Academic Session Progression & Promotion */}
        <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <FastForward className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Year-End Academic Promotion Engine
                </h3>
                <p className="text-[11px] text-slate-500">
                  Progress students (100L $\rightarrow$ 200L $\rightarrow$ 300L $\rightarrow$ 400L / GRADUATED)
                </p>
              </div>
            </div>

            {/* Standing Rules Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600" /> Institutional Academic Policies
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500">
                <li>Minimum CGPA $\ge 1.00$ required for clear promotion to next level.</li>
                <li>Students with CGPA $&lt; 1.00$ placed on Academic Probation.</li>
                <li>Compulsory course failures automatically flagged as Carry-Overs.</li>
                <li>Final level students (300L NCE / 400L Degree) transitioned to GRADUATED.</li>
              </ul>
            </div>

            {/* Scope Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Division
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="ALL">All Divisions</option>
                  <option value="NCE">NCE Regular</option>
                  <option value="DEGREE">Degree Affiliated</option>
                  <option value="SECONDARY">Secondary (JS1-SS3)</option>
                  <option value="PRIMARY">Staff Primary</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  From Current Level
                </label>
                <select
                  value={selectedFromLevel}
                  onChange={(e) => setSelectedFromLevel(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="ALL">All Current Levels</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                </select>
              </div>
            </div>

            {/* Promotion Result Telemetry */}
            {promotionResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Promotion Run Complete
                </span>
                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Evaluated</span>
                    <strong className="text-sm font-bold text-slate-900">{promotionResult.totalEvaluated}</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-600 block">Promoted</span>
                    <strong className="text-sm font-bold text-emerald-700">{promotionResult.promotedCount}</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-amber-600 block">Probation</span>
                    <strong className="text-sm font-bold text-amber-700">{promotionResult.probationCount}</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-blue-600 block">Graduated</span>
                    <strong className="text-sm font-bold text-blue-700">{promotionResult.graduatedCount}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setConfirmPromoteModal(true)}
            disabled={promoteMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-all cursor-pointer"
          >
            {promoteMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating Academic Standings & Promoting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Promote All Eligible Students</span>
              </>
            )}
          </button>
        </div>

        {/* PANEL 2: Financial Session Reset & Fee Matrix */}
        <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  New Session Financial Reset & Billing
                </h3>
                <p className="text-[11px] text-slate-500">
                  Apply statutory fee matrix to active students for the upcoming academic session
                </p>
              </div>
            </div>

            {/* Fee Tariff Information */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Approved Institutional Fee Matrix
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div>NCE 100L: <strong>₦45,000.00</strong></div>
                <div>NCE 200L: <strong>₦40,000.00</strong></div>
                <div>NCE 300L: <strong>₦38,000.00</strong></div>
                <div>Degree 100L: <strong>₦65,000.00</strong></div>
              </div>
            </div>

            {/* Reset Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Academic Session
                </label>
                <input
                  type="text"
                  value={targetSession}
                  onChange={(e) => setTargetSession(e.target.value)}
                  placeholder="2027/2028"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Division
                </label>
                <select
                  value={billingDivision}
                  onChange={(e) => setBillingDivision(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="ALL">All Active Students</option>
                  <option value="NCE">NCE Regular</option>
                  <option value="DEGREE">Degree Affiliated</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="PRIMARY">Primary</option>
                </select>
              </div>
            </div>

            {/* Billing Reset Result */}
            {billingResult && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Fee Matrix Applied Successfully
                </span>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Session</span>
                    <strong className="text-xs font-bold text-slate-900">{billingResult.session}</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Invoices</span>
                    <strong className="text-xs font-bold text-blue-700">{billingResult.totalInvoicesCreated}</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Total Billed</span>
                    <strong className="text-xs font-bold text-emerald-700">{billingResult.formattedTotalBilled}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setConfirmBillingModal(true)}
            disabled={billingResetMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-blue-800 hover:bg-blue-900 text-white shadow-md transition-all cursor-pointer"
          >
            {billingResetMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Session Invoices...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 text-blue-200" />
                <span>Apply New Session Fee Matrix / Reset Billing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      {confirmPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Confirm Academic Promotion</h4>
                <p className="text-xs text-slate-500">Irreversible session progression action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to promote eligible students across <strong>{selectedDivision}</strong>?
              The system will calculate CGPAs, verify carry-overs, and update student levels directly in the D1 database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPromoteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm"
              >
                Yes, Execute Promotion
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Confirm Session Fee Reset</h4>
                <p className="text-xs text-slate-500">Batch invoice generation for {targetSession}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will generate new UNPAID tuition and consolidated levy invoices for all active students for session <strong>{targetSession}</strong> with integer Kobo precision.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBillingModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBillingReset}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-800 hover:bg-blue-900 text-white shadow-sm"
              >
                Yes, Generate Invoices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
