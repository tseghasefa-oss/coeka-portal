import React from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  Building,
  GraduationCap,
  Award,
} from 'lucide-react';
import { useStudentClearance } from '../../hooks/useStudentData';

export const DigitalClearance: React.FC = () => {
  const { data: clearance, isLoading } = useStudentClearance();

  if (isLoading) {
    return (
      <div className="bento-card p-12 text-center text-xs text-slate-400">
        <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-700" />
        Synchronizing institutional clearance records...
      </div>
    );
  }

  const checklist = clearance?.checklist || [];
  const isFullyCleared = clearance?.isFullyCleared ?? false;
  const clearedCount = clearance?.clearedCount ?? 0;
  const totalCount = clearance?.totalUnits ?? 5;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Clearance Overview Banner */}
      <div className="bento-card p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-800">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Institutional Clearance
            </span>
            <span className="text-xs text-emerald-200">Session & Graduation Gate</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Digital Multi-Department Clearance Dossier
          </h3>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Real-time synchronization across Bursary, Library, Academic Department, Hostel Warden, and Clinic.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center w-full md:w-auto shrink-0 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-300 block">Clearance Status</span>
          <div className="flex items-center justify-center gap-1.5">
            <strong className="text-2xl font-black text-white">
              {clearedCount} / {totalCount}
            </strong>
          </div>
          <span className="text-[11px] font-bold block text-emerald-200">
            {isFullyCleared ? '100% Completed' : `${totalCount - clearedCount} Unit(s) Pending`}
          </span>
        </div>
      </div>

      {/* Checklist Units */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-base font-bold text-slate-900">Required Clearance Stations</h4>
            <p className="text-xs text-slate-500">Each department reviews and electronically signs your record</p>
          </div>

          {isFullyCleared ? (
            <button
              onClick={() => alert('Downloading official stamped Digital Clearance Certificate (PDF)...')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Clearance Certificate</span>
            </button>
          ) : (
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Clearance In Progress
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {checklist.map((item) => {
            const isDone = item.status === 'CLEARED';

            return (
              <div key={item.unit} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">{item.title}</h5>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-600">
                      <span>Sign-off: <strong>{item.officer}</strong></span>
                      {item.remarks && <span className="italic">• {item.remarks}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isDone ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Sign-off Verified
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Action Required
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
