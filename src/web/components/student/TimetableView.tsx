import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Printer,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useStudentTimetable } from '../../hooks/useStudentData';

export const TimetableView: React.FC = () => {
  const { data: timetable, isLoading } = useStudentTimetable();
  const [activeDay, setActiveDay] = useState<string>('Monday');

  const days = timetable?.days || [];
  const currentDayData = days.find((d) => d.day === activeDay) || days[0];

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="bento-card p-12 text-center text-xs text-slate-400">
        <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-700" />
        Loading lecture and class timetable...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Day Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Class & Lecture Schedule</span>
          </h3>
          <p className="text-xs text-slate-500">
            {timetable?.academicSession || '2026/2027'} • {timetable?.semesterOrTerm || 'First Semester'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Schedule</span>
        </button>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        {days.map((d) => (
          <button
            key={d.day}
            onClick={() => setActiveDay(d.day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeDay === d.day
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {d.day}
          </button>
        ))}
      </div>

      {/* Periods for Active Day */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h4 className="text-sm font-bold text-slate-900">
            {activeDay}&apos;s Scheduled Periods
          </h4>
          <span className="text-xs text-slate-500 font-semibold">
            {currentDayData?.periods?.length || 0} Lecture Sessions
          </span>
        </div>

        <div className="space-y-3">
          {(currentDayData?.periods || []).map((period, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 font-mono font-bold text-xs">
                  {period.time}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {period.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {period.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {period.venue}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {period.lecturer}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Confirmed Slot
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
