import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileQuestion,
  Users,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { ApprovalQueue } from './ApprovalQueue';
import { AppealDashboard } from './AppealDashboard';
import { FacultyMap } from './FacultyMap';

export type DeanSubTab = 'queue' | 'appeals' | 'faculty';

export function DeanDashboard() {
  const { userSession } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<DeanSubTab>('queue');

  return (
    <div className="space-y-6">
      {/* Header Greeting Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              Academic Quality Assurance
            </span>
            <span className="text-xs text-slate-400">• School of Sciences / Faculty Board</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Welcome, {userSession?.fullName || 'Dean Tyav'}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white uppercase">
              {userSession?.role || 'DEAN'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            You are the quality control layer between academic lecturers and students. Moderation, result publication, grade dispute appeals, and faculty allocations.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'queue'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Approval Queue</span>
          </button>

          <button
            onClick={() => setActiveSubTab('appeals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'appeals'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-4 h-4 text-amber-600" />
            <span>Grade Disputes</span>
          </button>

          <button
            onClick={() => setActiveSubTab('faculty')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'faculty'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Faculty Map</span>
          </button>
        </div>
      </div>

      {/* Render Active Dean View */}
      {activeSubTab === 'queue' && <ApprovalQueue />}
      {activeSubTab === 'appeals' && <AppealDashboard />}
      {activeSubTab === 'faculty' && <FacultyMap />}
    </div>
  );
}
