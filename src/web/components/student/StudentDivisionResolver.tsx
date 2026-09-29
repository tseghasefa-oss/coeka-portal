import React from 'react';
import { useAppStore, AcademicDivision } from '../../stores/useAppStore';
import { TertiaryAcademicView } from './TertiaryAcademicView';
import { SecondaryAcademicView } from './SecondaryAcademicView';
import { PrimaryAcademicView } from './PrimaryAcademicView';
import { Layers } from 'lucide-react';

interface StudentDivisionResolverProps {
  overrideDivision?: AcademicDivision;
}

export const StudentDivisionResolver: React.FC<StudentDivisionResolverProps> = ({ overrideDivision }) => {
  const { userSession, activeDivision, setActiveDivision } = useAppStore();

  // Determine current active division:
  // 1. Explicit prop override
  // 2. User's authenticated session division (e.g. from degree@test.com -> DEGREE)
  // 3. Fallback to activeDivision in Zustand
  const rawDivision = overrideDivision || userSession?.division || activeDivision || 'NCE';
  const division = rawDivision.toUpperCase() as AcademicDivision;

  return (
    <div className="space-y-4">
      {/* Optional Interactive Division Switcher for Live Demo & Verification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-700 dark:text-slate-300">Division Academic Scope:</span>
          <span className="font-black text-[#0B192C] dark:text-white px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-[11px]">
            {division === 'DEGREE' && 'Tertiary (Degree 4-Year Undergraduate)'}
            {division === 'NCE' && 'Tertiary (NCE 3-Year Certificate)'}
            {division === 'SECONDARY' && 'Secondary (Demonstration SS2 Track)'}
            {division === 'PRIMARY' && 'Primary (Staff Primary Basic 4 Track)'}
          </span>
        </div>

        {/* Quick Division Switcher Pills */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['DEGREE', 'NCE', 'SECONDARY', 'PRIMARY'] as const).map((div) => {
            const isSelected = division === div;
            return (
              <button
                key={div}
                type="button"
                onClick={() => {
                  setActiveDivision(div);
                  if (userSession) {
                    useAppStore.setState({
                      userSession: {
                        ...userSession,
                        division: div,
                      },
                    });
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0B192C] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`Switch live academic core to ${div}`}
              >
                {div}
              </button>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC DIVISION-SPECIFIC CORE RESOLVER */}
      {division === 'DEGREE' && <TertiaryAcademicView division="DEGREE" />}
      {division === 'NCE' && <TertiaryAcademicView division="NCE" />}
      {division === 'SECONDARY' && <SecondaryAcademicView />}
      {division === 'PRIMARY' && <PrimaryAcademicView />}
      {division !== 'DEGREE' && division !== 'NCE' && division !== 'SECONDARY' && division !== 'PRIMARY' && (
        <TertiaryAcademicView division="NCE" />
      )}
    </div>
  );
};
