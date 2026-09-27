import React, { useState } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useExamOfficerStats } from '../../hooks/useExamOfficerData';
import { BroadsheetViewer } from './BroadsheetViewer';
import { ProbationManager } from './ProbationManager';
import { GraduationList } from './GraduationList';

export type ExamOfficerSubTab = 'broadsheet' | 'probation' | 'graduation';

export function ExamOfficerDashboard() {
  const { userSession } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<ExamOfficerSubTab>('broadsheet');

  const { data: stats, isLoading: statsLoading } = useExamOfficerStats();

  return (
    <div className="space-y-6">
      {/* Header Greeting Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
              Senate Academic Board & Examination Office
            </span>
            <span className="text-xs text-slate-400">• Institutional Broadsheet Audit Central</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Welcome, {userSession?.fullName || 'Examination Officer'}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-900 text-white uppercase">
              {userSession?.role || 'EXAM_OFFICER'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Master session broadsheets, academic standing audits, probation notices, and degree/diploma graduation rosters.
            All results factor strictly published grades approved by the Dean.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveSubTab('broadsheet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'broadsheet'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
            <span>Broadsheet Grid</span>
          </button>

          <button
            onClick={() => setActiveSubTab('probation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'probation'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Probation Desk</span>
          </button>

          <button
            onClick={() => setActiveSubTab('graduation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'graduation'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Graduation List</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Broadsheets</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">
              {stats?.totalBroadsheets ?? 0}
            </strong>
            <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
              {stats?.certifiedBroadsheets ?? 0} Certified
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">On Probation</span>
            <strong className="text-2xl font-black text-rose-700 mt-1 block">
              {stats?.totalOnProbation ?? 0}
            </strong>
            <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
              CGPA &lt; 1.50 Deficit
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Graduating</span>
            <strong className="text-2xl font-black text-emerald-700 mt-1 block">
              {stats?.totalGraduationEligible ?? 0}
            </strong>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Senate Eligible
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Dean Drafts</span>
            <strong className="text-2xl font-black text-amber-600 mt-1 block">
              {stats?.pendingDraftsCount ?? 0}
            </strong>
            <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
              Pending Dean Approval
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Sub-Tab View Rendering */}
      {activeSubTab === 'broadsheet' && <BroadsheetViewer />}
      {activeSubTab === 'probation' && <ProbationManager />}
      {activeSubTab === 'graduation' && <GraduationList />}
    </div>
  );
}
