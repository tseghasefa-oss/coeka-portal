import React, { useState } from 'react';
import {
  Archive,
  Search,
  Filter,
  GraduationCap,
  Calendar,
  FileText,
  UserCheck,
  CheckCircle2,
  FolderOpen,
  Award,
  BookOpen,
} from 'lucide-react';
import {
  StudentArchiveRecord,
  useStudentArchive,
  useArchiveStudentMutation,
} from '../../hooks/useRegistrarData';

export function StudentArchive() {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [divisionFilter, setDivisionFilter] = useState<string>('ALL');
  const [viewingDossier, setViewingDossier] = useState<StudentArchiveRecord | null>(null);

  const parsedYear = yearFilter === 'ALL' ? undefined : parseInt(yearFilter, 10);
  const { data: records = [], isLoading } = useStudentArchive({
    query: searchTerm || undefined,
    year: parsedYear,
    division: divisionFilter === 'ALL' ? undefined : divisionFilter,
  });

  const years = [2026, 2025, 2024, 2023, 2022];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              Institutional Alumni Registry
            </span>
            <span className="text-xs text-slate-400">• Archived Student Dossier Records</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Alumni & Student File Archives</span>
            <Archive className="w-5 h-5 text-amber-600" />
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Permanent academic records of graduated students. Search across graduation sessions,
            qualification honors, and verified certificate serials.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500 font-semibold">Class of:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none"
            >
              <option value="ALL">All Sessions</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['ALL', 'NCE', 'DEGREE'] as const).map((div) => (
              <button
                key={div}
                onClick={() => setDivisionFilter(div)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  divisionFilter === div
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search alumni archive by student name, matric number, certificate number, or qualification..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Archive Database Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800">Archived Alumni Dossiers</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {records.length} records
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Immutable snapshot verified with Registrar electronic seal
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Searching student file archives...
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No alumni records found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Finalize student dossiers after issuing certificates to build the archive.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold text-slate-600">
                  <th className="py-3 px-4">Alumni Student</th>
                  <th className="py-3 px-3 text-center">Class / Year</th>
                  <th className="py-3 px-4">Awarded Qualification</th>
                  <th className="py-3 px-3 text-center">Final CGPA & Honors</th>
                  <th className="py-3 px-4">Certificate Serial</th>
                  <th className="py-3 px-4 text-right">Dossier File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rec.studentName || 'Student'}</div>
                      <div className="font-mono text-[11px] text-slate-500">{rec.matricNumber}</div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {rec.graduationYear}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{rec.qualificationAwarded}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-bold text-slate-900">
                        {rec.finalCgpa.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-700">
                        {rec.honorsClassification}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {rec.certificateNumber ? (
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {rec.certificateNumber}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not issued</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingDossier(rec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all border border-amber-200"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                        <span>Inspect Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dossier Detail Modal */}
      {viewingDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Archive className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Archived Student Academic File
                  </h3>
                  <p className="text-xs text-slate-500">
                    {viewingDossier.studentName} ({viewingDossier.matricNumber})
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                {viewingDossier.archiveStatus}
              </span>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Conferred Qualification
                  </span>
                  <strong className="text-slate-900 text-xs block mt-0.5">
                    {viewingDossier.qualificationAwarded}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Graduation Session
                  </span>
                  <strong className="text-slate-900 text-xs block mt-0.5">
                    Class of {viewingDossier.graduationYear}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Final Cumulative CGPA
                  </span>
                  <strong className="font-mono text-slate-900 text-xs block mt-0.5">
                    {viewingDossier.finalCgpa.toFixed(2)} ({viewingDossier.honorsClassification})
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Official Certificate Number
                  </span>
                  <strong className="font-mono text-slate-900 text-xs block mt-0.5">
                    {viewingDossier.certificateNumber || 'N/A'}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">
                  Institutional Clearance Audit
                </span>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bursary: ₦0 Debt</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Library: Cleared</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Academic: Approved</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl font-mono text-[10px] text-slate-600 max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(viewingDossier.dossierSummary, null, 2)}</pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingDossier(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
