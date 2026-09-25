import React from 'react';
import { Users, GraduationCap, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { WardSummary } from '../../hooks/useParentData';

interface WardSwitcherProps {
  wards: WardSummary[];
}

export const WardSwitcher: React.FC<WardSwitcherProps> = ({ wards }) => {
  const { activeWardId, setActiveWardId } = useAppStore();

  const activeWard = wards.find((w) => w.studentId === activeWardId) || wards[0];

  const handleSelectWard = (wardId: string) => {
    setActiveWardId(wardId as any);
  };

  return (
    <div className="space-y-3">
      {/* Dropdown / Quick Select on Mobile & Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Child Selection
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              {activeWard?.fullName || 'Select a Ward'}
            </h4>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="relative">
          <select
            id="ward-selector-dropdown"
            value={activeWard?.studentId || ''}
            onChange={(e) => handleSelectWard(e.target.value)}
            className="w-full sm:w-64 appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition"
          >
            {wards.map((ward) => (
              <option key={ward.studentId} value={ward.studentId}>
                {ward.fullName} ({ward.division} • {ward.level ? `${ward.level}L` : ward.programme})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Ward Cards Grid for Quick Visual Switching */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {wards.map((ward) => {
          const isSelected = (activeWard?.studentId || wards[0]?.studentId) === ward.studentId;
          const hasDebt = ward.outstandingKobo > 0;

          return (
            <button
              key={ward.studentId}
              id={`ward-card-${ward.studentId}`}
              onClick={() => handleSelectWard(ward.studentId)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600" />
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-600">
                    {ward.passportPhotoUrl ? (
                      <img src={ward.passportPhotoUrl} alt={ward.fullName} className="w-full h-full object-cover" />
                    ) : (
                      ward.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block truncate max-w-[130px]">
                      {ward.fullName}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {ward.matricNumber}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                    hasDebt ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {hasDebt ? ward.outstandingFormatted : 'Fees Paid'}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">
                  {ward.division} • {ward.level ? `${ward.level}L` : 'Basic Ed'}
                </span>
                <span className="font-bold text-emerald-700">
                  {ward.currentGPA ? `GPA ${ward.currentGPA}` : ward.terminalAverage || 'Good Standing'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
