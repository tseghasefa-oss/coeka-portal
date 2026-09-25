import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  CreditCard,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  useAdmissionsStats,
  useBulkUploadAdmissions,
  AdmissionsStatsData,
} from '../../hooks/useAdmissionsData';
import { BulkUploadService, RawApplicantRecord } from '../../../services/admissions/bulkUploadService';

const SAMPLE_CSV = `firstName,lastName,phone,email,programmeCode,divisionCode,jambRegNumber
Blessing,Oche,08031234567,blessing.oche@example.com,prog-nce-csc-mth,NCE,20261001JA
Godwin,Tsegha,08029876543,godwin.tsegha@example.com,prog-nce-csc-mth,NCE,20261002JA
Msurshima,Agber,08145556677,msurshima.agber@example.com,prog-bed-edu-mgt,DEGREE,20261003JA
Doofan,Akiga,09033344455,doofan.akiga@example.com,prog-sec-js1,SECONDARY,20261004JA`;

export const AdmissionManager: React.FC = () => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdmissionsStats();
  const bulkUploadMutation = useBulkUploadAdmissions();

  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<RawApplicantRecord[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      try {
        const records = BulkUploadService.parseCSV(text);
        setParsedPreview(records);
        setParseError(null);
      } catch (err: any) {
        setParseError(`CSV Parsing Error: ${err.message}`);
        setParsedPreview([]);
      }
    };
    reader.readAsText(file);
  };

  // Handle manual paste or sample load
  const handleLoadSample = () => {
    setCsvContent(SAMPLE_CSV);
    const records = BulkUploadService.parseCSV(SAMPLE_CSV);
    setParsedPreview(records);
    setParseError(null);
  };

  // Submit bulk admissions
  const handleExecuteUpload = async () => {
    if (parsedPreview.length === 0) {
      setParseError('Please load or paste valid CSV data before submitting.');
      return;
    }

    try {
      setParseError(null);
      const res: any = await bulkUploadMutation.mutateAsync({
        csvContent,
        admissionYear: 2026,
      });

      setUploadSuccessMessage(
        res.message || `Successfully processed ${res.summary?.createdCount || parsedPreview.length} applicants.`
      );
      setParsedPreview([]);
      setCsvContent('');
      refetchStats();
    } catch (err: any) {
      setParseError(err.message || 'Bulk upload failed. Please verify CSV format.');
    }
  };

  const filteredStudents = (stats?.students || []).filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.matricNumber.toLowerCase().includes(q) ||
      s.academicStatus.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Onboarding Telemetry Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <span>Admissions & Student Onboarding Pipeline</span>
          </h2>
          <p className="text-xs text-slate-500">
            Bulk CSV admissions provisioning, matriculation number generation, and onboarding completion telemetry
          </p>
        </div>

        <button
          onClick={() => refetchStats()}
          disabled={statsLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Telemetry Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bento-card p-4 border border-slate-200/80 shadow-xs bg-white space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Admitted
          </span>
          <div className="text-2xl font-black text-slate-900">
            {stats?.totalAdmitted ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">Across all 4 institutional divisions</span>
        </div>

        <div className="bento-card p-4 border border-slate-200/80 shadow-xs bg-white space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Provisional Offers
          </span>
          <div className="text-2xl font-black text-amber-600">
            {stats?.provisionalCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">Awaiting bio-data entry</span>
        </div>

        <div className="bento-card p-4 border border-slate-200/80 shadow-xs bg-white space-y-1">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Bio-Data Submitted
          </span>
          <div className="text-2xl font-black text-blue-600">
            {stats?.biodataCompletedCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">Profiles populated & verified</span>
        </div>

        <div className="bento-card p-4 border border-slate-200/80 shadow-xs bg-white space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Acceptance Settled
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {stats?.acceptancePaidCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">₦{(Number(stats?.acceptanceTotalKobo || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bento-card p-4 border border-slate-200/80 shadow-xs bg-white space-y-1">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Matriculation Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {stats?.completionPercentage ?? 0}%
            </span>
            <span className="text-[10px] text-slate-500">Active</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.completionPercentage ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Bulk Upload Dropzone & Form */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>Bulk Admissions Batch Upload (CSV)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Upload institutional admissions manifest to provision student accounts and generate acceptance fee billing.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Load Sample CSV</span>
          </button>
        </div>

        {uploadSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 space-y-1">
              <span className="font-bold block">Admissions Upload Successful!</span>
              <p>{uploadSuccessMessage}</p>
            </div>
          </div>
        )}

        {parseError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <span className="font-bold block">Upload Error</span>
              <p>{parseError}</p>
            </div>
          </div>
        )}

        {/* File Dropzone & Text Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select CSV File from Computer
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium mb-1">
                Drag and drop your .csv file here, or click to browse
              </p>
              <p className="text-[10px] text-slate-400 mb-3">
                Expected columns: firstName, lastName, phone, email, programmeCode, divisionCode, jambRegNumber
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Or Paste Raw CSV Contents Below
            </label>
            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                try {
                  const records = BulkUploadService.parseCSV(e.target.value);
                  setParsedPreview(records);
                  setParseError(null);
                } catch (err: any) {
                  setParseError(err.message);
                }
              }}
              placeholder={`firstName,lastName,phone,email,programmeCode,divisionCode\nAondo,Moses,08031234567,moses@example.com,prog-nce-csc-mth,NCE`}
              className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
            />
          </div>
        </div>

        {/* Parsed Preview Table */}
        {parsedPreview.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Ready to Import: {parsedPreview.length} Applicant Record(s)</span>
              </span>

              <button
                type="button"
                onClick={handleExecuteUpload}
                disabled={bulkUploadMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-all cursor-pointer"
              >
                {bulkUploadMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Batch Admissions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Execute Batch Admissions ({parsedPreview.length} Students)</span>
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Applicant Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Division</th>
                    <th className="py-2.5 px-3">Programme Code</th>
                    <th className="py-2.5 px-3">JAMB/Reg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedPreview.slice(0, 5).map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {rec.firstName} {rec.lastName}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">{rec.phone}</td>
                      <td className="py-2 px-3 text-slate-600">{rec.email || '—'}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {rec.divisionCode || 'NCE'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">{rec.programmeCode}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{rec.jambRegNumber || '—'}</td>
                    </tr>
                  ))}
                  {parsedPreview.length > 5 && (
                    <tr>
                      <td colSpan={7} className="py-2 px-3 text-center text-slate-500 bg-slate-50 text-[11px]">
                        ... and {parsedPreview.length - 5} more applicant records ready for batch account creation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. Onboarding Status Directory */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Admitted Student Onboarding Tracker</span>
            </h3>
            <p className="text-xs text-slate-500">
              Live status tracking of bio-data completion, biometric passport uploads, and acceptance payments
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or matric..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-3">Matric / Reg No</th>
                <th className="py-3 px-3">Full Name</th>
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3">Level</th>
                <th className="py-3 px-3">Bio-Data</th>
                <th className="py-3 px-3">Passport (R2)</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No admitted student records matching filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {s.matricNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {s.fullName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {s.division}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{s.level}L</td>
                    <td className="py-2.5 px-3">
                      {s.hasBiodata ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3 text-emerald-600" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-amber-500" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {s.hasPassport ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3 text-emerald-600" /> Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {s.academicStatus === 'ACTIVE' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ACTIVE MATRIC
                        </span>
                      ) : s.academicStatus === 'BIODATA_COMPLETED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          BIODATA COMPLETED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          PROVISIONAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
