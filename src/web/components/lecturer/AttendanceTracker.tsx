import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Save,
  CheckSquare,
  Square,
  AlertCircle,
  FileSpreadsheet,
  History,
} from 'lucide-react';
import {
  CourseRosterItem,
  useMarkAttendance,
  useCourseAttendance,
} from '../../hooks/useLecturerData';

interface AttendanceTrackerProps {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  roster: CourseRosterItem[];
  onRefresh?: () => void;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  courseId,
  courseCode,
  courseTitle,
  roster,
  onRefresh,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statusMap, setStatusMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'>>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const markAttendanceMutation = useMarkAttendance(courseId);
  const { data: attendanceHistory, isLoading: historyLoading } = useCourseAttendance(
    courseId,
    selectedDate
  );

  // Initialize or update status map when roster or history changes
  React.useEffect(() => {
    const map: Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'> = {};
    for (const student of roster) {
      // If historical record exists for this student on this date, use it
      const match = attendanceHistory?.find((h) => h.studentId === student.studentId);
      map[student.studentId] = match ? match.status : 'PRESENT';
    }
    setStatusMap(map);
  }, [roster, attendanceHistory]);

  const handleToggle = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'EXCUSED') => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const map: Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'> = {};
    for (const student of roster) {
      map[student.studentId] = status;
    }
    setStatusMap(map);
  };

  const handleSaveAttendance = async () => {
    try {
      // Group by status
      const presentIds = Object.keys(statusMap).filter((id) => statusMap[id] === 'PRESENT');
      const absentIds = Object.keys(statusMap).filter((id) => statusMap[id] === 'ABSENT');
      const excusedIds = Object.keys(statusMap).filter((id) => statusMap[id] === 'EXCUSED');

      if (presentIds.length > 0) {
        await markAttendanceMutation.mutateAsync({
          studentIds: presentIds,
          lectureDate: selectedDate,
          status: 'PRESENT',
        });
      }

      if (absentIds.length > 0) {
        await markAttendanceMutation.mutateAsync({
          studentIds: absentIds,
          lectureDate: selectedDate,
          status: 'ABSENT',
        });
      }

      if (excusedIds.length > 0) {
        await markAttendanceMutation.mutateAsync({
          studentIds: excusedIds,
          lectureDate: selectedDate,
          status: 'EXCUSED',
        });
      }

      setNotification({
        type: 'success',
        message: `Attendance register for ${selectedDate} successfully saved to institutional database.`,
      });
      onRefresh?.();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save attendance records.',
      });
    }
  };

  const total = roster.length;
  const presentCount = Object.values(statusMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(statusMap).filter((s) => s === 'ABSENT').length;
  const excusedCount = Object.values(statusMap).filter((s) => s === 'EXCUSED').length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Lecture Date</span>
          <div className="mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <strong className="text-sm font-bold text-slate-900">{selectedDate}</strong>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Present Today</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-emerald-700">{presentCount}</strong>
            <span className="text-xs text-slate-500 font-medium">/ {total} ({attendanceRate}%)</span>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Absent</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-rose-600">{absentCount}</strong>
            <span className="text-xs text-slate-500 font-medium">students</span>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Excused</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-amber-600">{excusedCount}</strong>
            <span className="text-xs text-slate-500 font-medium">with cause</span>
          </div>
        </div>
      </div>

      {/* Main Register Checklist Card */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Lecture Attendance Register: {courseCode} - {courseTitle}
            </h3>
            <p className="text-xs text-slate-500">
              NCCE / NUC regulations mandate 75% attendance for examination eligibility
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Picker Input */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>

            {/* Batch Action Buttons */}
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Checklist Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Matric / Reg No</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3 text-center">Cumulative Rate</th>
                <th className="py-2.5 px-3 text-center">Status for {selectedDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map((student, idx) => {
                const currentStatus = statusMap[student.studentId] || 'PRESENT';
                const cumRate = student.attendance?.attendanceRate ?? 0;

                return (
                  <tr key={student.studentId} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {student.matricNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {student.fullName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-mono font-bold text-xs ${
                          cumRate >= 75 ? 'text-emerald-700' : 'text-rose-600 font-extrabold'
                        }`}
                      >
                        {cumRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200 gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggle(student.studentId, 'PRESENT')}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            currentStatus === 'PRESENT'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggle(student.studentId, 'ABSENT')}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            currentStatus === 'ABSENT'
                              ? 'bg-rose-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Absent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggle(student.studentId, 'EXCUSED')}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            currentStatus === 'EXCUSED'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Excused</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleSaveAttendance}
            disabled={markAttendanceMutation.isPending}
            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {markAttendanceMutation.isPending
                ? 'Persisting Attendance...'
                : `Save Attendance Register (${selectedDate})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
