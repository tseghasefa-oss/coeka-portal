import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, CreditCard, ArrowRight } from 'lucide-react';

export interface ReservationTimerProps {
  bedLabel: string;
  roomNumber: string;
  hostelName: string;
  expiresAt: number; // Unix epoch seconds
  feeKobo?: number;
  onExpire?: () => void;
  onConfirmPayment: (paymentRef: string) => Promise<void>;
  onCancelReservation?: () => void;
}

export const ReservationTimer: React.FC<ReservationTimerProps> = ({
  bedLabel,
  roomNumber,
  hostelName,
  expiresAt,
  feeKobo = 2000000,
  onExpire,
  onConfirmPayment,
  onCancelReservation,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, expiresAt - now);
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, expiresAt - now);
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isExpiringSoon = secondsRemaining > 0 && secondsRemaining < 180; // under 3 mins
  const isExpired = secondsRemaining === 0;

  // Percentage of 15 minutes (900 seconds)
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / 900) * 100));

  const handlePayNow = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    try {
      const simulatedRef = `PSTK-HST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await onConfirmPayment(simulatedRef);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment confirmation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isExpired) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong className="text-sm font-bold block">15-Minute Reservation Lock Expired</strong>
            <p className="text-xs text-rose-700">
              Your temporary lock on {bedLabel} ({roomNumber}) has expired and returned to the public pool.
            </p>
          </div>
        </div>
        {onCancelReservation && (
          <button
            onClick={onCancelReservation}
            className="text-xs font-bold px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
          >
            Select Another Bed
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-2xl border transition-all shadow-md ${
        isExpiringSoon
          ? 'bg-gradient-to-r from-amber-100 via-rose-50 to-amber-50 border-rose-400'
          : 'bg-gradient-to-r from-amber-50 via-emerald-50/40 to-slate-50 border-amber-300'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Reservation details */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                isExpiringSoon ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-amber-950 font-bold'
              }`}
            >
              {isExpiringSoon ? 'LOCK EXPIRING SOON' : '15-MINUTE ATOMIC LOCK ACTIVE'}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {hostelName} • {roomNumber}
            </span>
          </div>
          <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Reserved: {bedLabel}</span>
            <span className="text-xs font-medium text-slate-500">
              (₦{(feeKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })} / session)
            </span>
          </h4>
          <p className="text-xs text-slate-600">
            This bedspace is exclusively locked for your matric number. Complete fee payment before the timer reaches 00:00 to finalize your allocation.
          </p>
        </div>

        {/* Countdown display & Action */}
        <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-between md:justify-end">
          <div className="text-center bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm min-w-[110px]">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-0.5">
              <Clock className={`w-3.5 h-3.5 ${isExpiringSoon ? 'text-rose-600 animate-spin' : 'text-amber-600 animate-pulse'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Time Left</span>
            </div>
            <strong
              className={`text-2xl font-mono font-black tracking-wider block ${
                isExpiringSoon ? 'text-rose-600 animate-pulse' : 'text-slate-900'
              }`}
            >
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </strong>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handlePayNow}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow hover:shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isProcessing ? 'Verifying...' : 'Pay & Confirm Bed'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {onCancelReservation && (
              <button
                onClick={onCancelReservation}
                disabled={isProcessing}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition text-center"
              >
                Release Lock Early
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress countdown bar */}
      <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isExpiringSoon ? 'bg-rose-500' : progressPercent > 50 ? 'bg-emerald-600' : 'bg-amber-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {paymentError && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}
    </div>
  );
};
