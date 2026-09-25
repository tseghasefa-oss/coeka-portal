import React, { useState } from 'react';
import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  Users,
  Award,
  Globe,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import {
  useLecturerCourses,
  useCourseRoster,
  LecturerCourseItem,
} from '../../hooks/useLecturerData';
import { GradeEntryGrid } from './GradeEntryGrid';
import { AttendanceTracker } from './AttendanceTracker';
import { CourseRoster } from './CourseRoster';

export const LecturerModule: React.FC = () => {
  const { userSession } = useAppStore();
  const { data: courses, isLoading: coursesLoading } = useLecturerCourses();

  // Active course selection state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('crs-csc111');

  // Active sub-tab state
  const [subTab, setSubTab] = useState<'grades' | 'attendance' | 'roster'>('grades');

  // Auto-select first course when courses load
  React.useEffect(() => {
    if (courses && courses.length > 0 && !courses.find((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const activeCourse = courses?.find((c) => c.id === selectedCourseId) || {
    id: 'crs-csc111',
    code: 'CSC 111',
    title: 'Introduction to Computer Systems',
    creditUnits: 2,
    level: 100,
    semesterTerm: 1,
    programmeName: 'NCE Computer Science / Mathematics',
    divisionName: 'NCE Programmes',
  };

  const {
    data: rosterData,
    isLoading: rosterLoading,
    refetch: refetchRoster,
  } = useCourseRoster(activeCourse.id);

  const roster = rosterData?.students || [];
  const isResultsPublished = rosterData?.resultsPublished ?? false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Faculty Workspace Header Banner */}
      <div className="bento-card p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800 shadow-lg">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Academic Engine • Module 2
            </span>
            <span className="text-xs text-emerald-200">
              Tertiary (NCCE/NUC) & Basic Education Roster
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Welcome, {userSession?.fullName || 'Dr. Terver Kange'}, {userSession?.role || 'LECTURER'}
          </h2>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Manage course grade entry (CA1, CA2, Exam), track daily lecture attendance, and control student result publishing gates.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-left md:text-right shrink-0 space-y-1">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
            Academic Unit
          </span>
          <span className="text-sm font-bold text-white block">
            Dept of Computer Science
          </span>
          <span className="text-xs text-emerald-200 block font-mono">
            {userSession?.username || 'lecturer1'} • School of Sciences
          </span>
        </div>
      </div>

      {/* Course Selector & Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xs">
        {/* Course Dropdown */}
        <div className="flex items-center gap-2 px-2">
          <BookOpen className="w-4 h-4 text-emerald-800 shrink-0" />
          <label className="text-xs font-bold text-slate-700 shrink-0">Course:</label>
          <select
            value={activeCourse.id}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          >
            {(courses || [
              { id: 'crs-csc111', code: 'CSC 111', title: 'Intro to Computer Systems' },
              { id: 'crs-csc112', code: 'CSC 112', title: 'Problem Solving & BASIC' },
              { id: 'crs-bed111', code: 'BED 111', title: 'Principles of Business Ed' },
            ]).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('grades')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'grades'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Score Entry Grid</span>
          </button>

          <button
            onClick={() => setSubTab('attendance')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'attendance'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Attendance Tracker</span>
          </button>

          <button
            onClick={() => setSubTab('roster')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'roster'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Course Roster</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      {subTab === 'grades' && (
        <GradeEntryGrid
          courseId={activeCourse.id}
          courseCode={activeCourse.code}
          courseTitle={activeCourse.title}
          creditUnits={activeCourse.creditUnits}
          divisionName={activeCourse.divisionName}
          roster={roster}
          onRefresh={refetchRoster}
        />
      )}

      {subTab === 'attendance' && (
        <AttendanceTracker
          courseId={activeCourse.id}
          courseCode={activeCourse.code}
          courseTitle={activeCourse.title}
          roster={roster}
          onRefresh={refetchRoster}
        />
      )}

      {subTab === 'roster' && (
        <CourseRoster
          roster={roster}
          courseCode={activeCourse.code}
          courseTitle={activeCourse.title}
          isLoading={rosterLoading}
        />
      )}
    </div>
  );
};
