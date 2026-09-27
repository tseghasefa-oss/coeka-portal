import React, { useState } from 'react';
import {
  Award,
  FileText,
  Archive,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useRegistrarStats } from '../../hooks/useRegistrarData';
import { CertificateIssuer } from './CertificateIssuer';
import { TranscriptQueue } from './TranscriptQueue';
import { StudentArchive } from './StudentArchive';
import { PublicVerifier } from './PublicVerifier';

export type RegistrarSubTab = 'candidates' | 'transcripts' | 'archive' | 'verify';

export function RegistrarDashboard() {
  const { userSession } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<RegistrarSubTab>('candidates');

  const { data: stats, isLoading: statsLoading } = useRegistrarStats();

  return (
    <div className="space-y-6">
      {/* Header Greeting Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              Office of the College Registrar
            </span>
            <span className="text-xs text-slate-400">• Ultimate Institutional Authority</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Welcome, {userSession?.fullName || 'Registrar'}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-900 text-white uppercase">
              {userSession?.role || 'REGISTRAR'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Official certificate issuance, transcript fulfillment pipeline, employer verification, and
            permanent alumni dossier file archives.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveSubTab('candidates')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'candidates'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Certificates</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transcripts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'transcripts'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Transcripts</span>
          </button>

          <button
            onClick={() => setActiveSubTab('archive')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'archive'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-4 h-4 text-amber-600" />
            <span>Alumni Archive</span>
          </button>

          <button
            onClick={() => setActiveSubTab('verify')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'verify'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Public Verifier</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Certificates Issued */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Certificates Issued</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">
              {stats?.totalCertificatesIssued ?? 0}
            </strong>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              {stats?.validCertificatesCount ?? 0} Valid & Active
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Transcripts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Pending Transcripts</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">
              {stats?.pendingTranscriptsCount ?? 0}
            </strong>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
              Awaiting Dispatch
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Dispatched Transcripts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Transcripts Dispatched</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">
              {stats?.completedTranscriptsCount ?? 0}
            </strong>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Successfully Delivered
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Alumni Dossiers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Archived Alumni</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">
              {stats?.totalAlumniArchived ?? 0}
            </strong>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
              Permanent Records
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Subtab Component */}
      <div className="animate-in fade-in duration-200">
        {activeSubTab === 'candidates' && <CertificateIssuer />}
        {activeSubTab === 'transcripts' && <TranscriptQueue />}
        {activeSubTab === 'archive' && <StudentArchive />}
        {activeSubTab === 'verify' && <PublicVerifier />}
      </div>
    </div>
  );
}
