import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  GraduationCap,
  Percent,
  FileCheck,
} from 'lucide-react';
import { CourseRosterItem } from '../../hooks/useLecturerData';

interface CourseRosterProps {
  roster: CourseRosterItem[];
  courseCode: string;
  courseTitle: string;
  isLoading?: boolean;
}

export const CourseRoster: React.FC<CourseRosterProps> = ({
  roster,
  courseCode,
  courseTitle,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState<string>('ALL');

  const filteredStudents = (roster || []).filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.matricNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiv = filterDivision === 'ALL' || s.division === filterDivision;
    return matchesSearch && matchesDiv;
  });

  // Calculate telemetry
  const totalStudents = roster.length;
  const gradedStudents = roster.filter((s) => s.grade !== null).length;
  const publishedStudents = roster.filter((s) => s.grade?.status === 'PUBLISHED').length;
  const avgAttendance =
    totalStudents > 0
      ? (roster.reduce((acc, s) => acc + (s.attendance?.attendanceRate || 0), 0) / totalStudents).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bento-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500 font-medium">candidates</span>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Graded Count</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{gradedStudents}</span>
            <span className="text-xs text-slate-500 font-medium">/ {totalStudents}</span>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{publishedStudents}</span>
            <span className="text-xs text-slate-500 font-medium">released</span>
          </div>
        </div>

        <div className="bento-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Attendance</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{avgAttendance}%</span>
            <span className="text-xs text-slate-500 font-medium">presence</span>
          </div>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Class Roster: {courseCode} - {courseTitle}
            </h3>
            <p className="text-xs text-slate-500">
              Official list of registered students with attendance telemetry and grade status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search matric or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>

            {/* Division Filter */}
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            >
              <option value="ALL">All Divisions</option>
              <option value="NCE Programmes">NCE Programmes</option>
              <option value="Degree Programmes">Degree Programmes</option>
              <option value="Demonstration Secondary">Demonstration Secondary</option>
              <option value="Staff Primary School">Staff Primary School</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-700" />
            Loading class roster from institutional ledger...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Matric / Reg No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Programme / Division</th>
                  <th className="py-3 px-3 text-center">Level</th>
                  <th className="py-3 px-3 text-center">Attendance Rate</th>
                  <th className="py-3 px-3 text-center">Grade Status</th>
                  <th className="py-3 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const rate = student.attendance?.attendanceRate ?? 0;
                  const isEligible = rate >= 75; // NCCE/NUC standard: 75% attendance required for exams
                  const grade = student.grade;

                  return (
                    <tr key={student.studentId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {student.matricNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {student.fullName}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="block font-medium">{student.programmeName}</span>
                        <span className="text-[10px] text-slate-400">{student.division}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {student.level}L
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold font-mono text-[11px] ${
                                isEligible ? 'text-emerald-700' : 'text-rose-600 font-extrabold'
                              }`}
                            >
                              {rate}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({student.attendance?.attendedCount || 0}/{student.attendance?.totalLectures || 0})
                            </span>
                          </div>
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isEligible ? 'bg-emerald-600' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, rate)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {!grade ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                            UNGRADED
                          </span>
                        ) : grade.status === 'PUBLISHED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            DRAFT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {grade ? (
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{grade.totalScore}</span>
                            <span className="font-extrabold text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {grade.letterGrade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
