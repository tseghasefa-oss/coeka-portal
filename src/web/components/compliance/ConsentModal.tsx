import React, { useState } from 'react';
import { ShieldCheck, Lock, ExternalLink, Check, AlertTriangle, LogOut } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface ConsentModalProps {
  isOpen: boolean;
  onConsentAccepted: () => void;
  studentId?: string;
  studentName?: string;
}

export function ConsentModal({ isOpen, onConsentAccepted, studentId, studentName }: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { setActiveTab, logout } = useAppStore();

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('coeka_token') || '';
      await fetch('/api/student/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentId: studentId || 'std-001',
          consentedAt: new Date().toISOString(),
        }),
      }).catch(() => {
        // Fallback gracefully if offline / local mock
      });
    } catch {
      // ignore
    } finally {
      const key = `coeka_ndpa_consent_${studentId || 'default'}`;
      localStorage.setItem(key, new Date().toISOString());
      setSubmitting(false);
      onConsentAccepted();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Institutional Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 sm:p-7 relative">
          <div className="flex items-center gap-3 mb-2 text-amber-400">
            <ShieldCheck className="w-7 h-7 shrink-0" />
            <span className="text-[11px] uppercase font-mono tracking-widest font-bold">
              College of Education, Katsina-Ala • NDPA 2023
            </span>
          </div>
          <h2 id="consent-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Data Processing & Privacy Consent
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Welcome, <strong>{studentName || 'Student'}</strong>. Please review and acknowledge our statutory terms before proceeding.
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[50vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
            <div>
              <strong className="block font-bold">Statutory Requirement:</strong>
              Under the <strong>Nigeria Data Protection Act (NDPA 2023)</strong>, educational institutions must obtain explicit consent to store and process student records.
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">By continuing to the portal, you consent to:</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Academic Registry & Certification:</strong> Storage of course enrollments, Continuous Assessment (CA) scores, semester examination grades, and Senate broadsheet computations.</li>
              <li><strong>Bursary Financial Reconciliation:</strong> Automated generation of dynamic Wema Bank / VPay NUBANs and ledger transaction logging.</li>
              <li><strong>Accreditation & Regulatory Reporting:</strong> Transmission of verified academic manifests to the National Commission for Colleges of Education (NCCE) and JAMB.</li>
              <li><strong>Campus Security & Residency:</strong> Biometric verification, passport photos, and hall of residence room inventory management.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>Right to Portability & Full Privacy Policy</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('privacy' as any)}
              className="text-emerald-800 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Read Policy</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Interactive Consent Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 cursor-pointer transition select-none">
            <input
              type="checkbox"
              id="ndpa-consent-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-700 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs text-slate-800 font-medium leading-normal">
              I have read, understood, and hereby consent to the College Data Processing Terms pursuant to the Nigeria Data Protection Act (NDPA 2023).
            </span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Decline & Sign Out</span>
          </button>

          <button
            type="button"
            disabled={!agreed || submitting}
            onClick={handleAccept}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
              agreed && !submitting
                ? 'bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span>Recording Consent...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Agree & Enter Dashboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
