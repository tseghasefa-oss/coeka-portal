import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Calendar,
  Building,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { VerificationResult } from '../../hooks/useRegistrarData';

export function PublicVerifier() {
  const [identifier, setIdentifier] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) return;

    setIsVerifying(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/registrar/verify/${encodeURIComponent(identifier.trim())}`);
      const data: any = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Verification service unavailable');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Verification Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-7 h-7 text-emerald-700" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Public Academic Credential Verification Portal
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
          For Employers, Embassies, NYSC, and Academic Institutions worldwide. Instantly verify the
          authenticity of any College of Education, Katsina-Ala degree or NCE certificate.
        </p>

        {/* Input Form */}
        <form onSubmit={handleVerify} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter Certificate Serial (COEKA/NCE/...), QR Hash, or Matric No..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying || !identifier.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifying ? 'Verifying...' : 'Verify Credential'}</span>
          </button>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Result Display */}
      {result && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {result.isValid ? (
            /* VALID CERTIFICATE CARD */
            <div className="bg-white rounded-3xl border-2 border-emerald-500/40 shadow-xl overflow-hidden">
              <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-100" />
                  <div>
                    <h3 className="text-base font-black tracking-tight">
                      Authentic COEKA Academic Credential Verified
                    </h3>
                    <p className="text-[11px] text-emerald-100 font-medium">
                      Tamper-proof record verified against College Registry and Senate Minutes
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-extrabold uppercase tracking-wider">
                  Official Valid
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Graduate & Qualification details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Graduate Name
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-0.5">
                      {result.studentName}
                    </h4>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Matric: {result.matricNumber}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Conferred Qualification
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">
                      {result.qualificationAwarded}
                    </h4>
                    <span className="text-xs font-semibold text-emerald-700">
                      Honors: {result.honorsClassification} (CGPA: {result.finalCgpa?.toFixed(2)})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Division
                    </span>
                    <strong className="text-slate-900 block mt-0.5">{result.division}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Conferment Date
                    </span>
                    <strong className="text-slate-900 block mt-0.5">
                      {result.confermentDate || 'N/A'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Certificate Serial
                    </span>
                    <strong className="font-mono text-slate-900 block mt-0.5">
                      {result.certificateNumber}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Institution
                    </span>
                    <strong className="text-slate-900 block mt-0.5">COEKA (Benue)</strong>
                  </div>
                </div>

                {/* Cryptographic Verification Hash */}
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 font-mono text-[10px] text-slate-700 break-all">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cryptographic Verification Fingerprint:</span>
                  </div>
                  <div>{result.qrVerificationHash}</div>
                </div>
              </div>
            </div>
          ) : result.status === 'REVOKED' ? (
            /* REVOKED CERTIFICATE CARD */
            <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-xl p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-xl font-black text-rose-900">
                ATTENTION: Academic Certificate Has Been Revoked
              </h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto mt-1">
                {result.message}
              </p>
              {result.revocationReason && (
                <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-semibold text-rose-900 max-w-md mx-auto">
                  Senate Reason: {result.revocationReason}
                </div>
              )}
            </div>
          ) : (
            /* NOT FOUND CARD */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-800">
                No Certificate Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {result.message}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Please double-check the serial number formatting (e.g., <code>COEKA/NCE/2026/00001</code>).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
