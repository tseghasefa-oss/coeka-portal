import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  Filter,
  QrCode,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  CandidateWithClearance,
  CertificateRecord,
  useGraduationCandidates,
  useIssuedCertificates,
  useIssueCertificateMutation,
} from '../../hooks/useRegistrarData';

export function CertificateIssuer() {
  const [divisionFilter, setDivisionFilter] = useState<'ALL' | 'NCE' | 'DEGREE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithClearance | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<CertificateRecord | null>(null);
  const [confermentDate, setConfermentDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: candidates = [], isLoading: candidatesLoading } = useGraduationCandidates(
    divisionFilter === 'ALL' ? undefined : divisionFilter
  );

  const { data: issuedCertificates = [], isLoading: certsLoading } = useIssuedCertificates({
    division: divisionFilter === 'ALL' ? undefined : divisionFilter,
  });

  const issueMutation = useIssueCertificateMutation();

  // Filter candidates by search term
  const filteredCandidates = candidates.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.matricNumber.toLowerCase().includes(term) ||
      c.studentName.toLowerCase().includes(term) ||
      c.programmeName.toLowerCase().includes(term) ||
      c.departmentName.toLowerCase().includes(term)
    );
  });

  const handleIssueCertificate = async (candidate: CandidateWithClearance) => {
    setFeedback(null);
    try {
      const cert = await issueMutation.mutateAsync({
        studentId: candidate.studentId,
        confermentDate,
      });
      setViewingCertificate(cert);
      setFeedback({
        type: 'success',
        message: `Certificate ${cert.certificateNumber} successfully issued for ${candidate.studentName}!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to issue certificate',
      });
    }
  };

  const handleViewExistingCertificate = (candidate: CandidateWithClearance) => {
    const existing = issuedCertificates.find((c) => c.studentId === candidate.studentId);
    if (existing) {
      setViewingCertificate(existing);
    } else {
      setFeedback({
        type: 'error',
        message: 'Certificate details loading or not found in recent records.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              Clearance-Gated Certification Desk
            </span>
            <span className="text-xs text-slate-400">• Senate & Registrar Seal</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Official Academic Certificate Issuance</span>
            <Award className="w-5 h-5 text-emerald-600" />
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Certificates are strictly locked behind three institutional gates:
            <strong> Bursary Zero-Debt</strong>, <strong>Librarian Final Clearance</strong>, and
            <strong> Academic Board Graduation Requirements</strong> (0 carry-overs, CGPA &ge; 1.50).
          </p>
        </div>

        {/* Division Switcher & Conferment Date */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['ALL', 'NCE', 'DEGREE'] as const).map((div) => (
              <button
                key={div}
                onClick={() => setDivisionFilter(div)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  divisionFilter === div
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {div === 'ALL' ? 'All Divisions' : div}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500 font-semibold">Conferment:</span>
            <input
              type="date"
              value={confermentDate}
              onChange={(e) => setConfermentDate(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter graduating candidates by Matric Number, Student Name, Programme, or Department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Candidates Clearance & Issuance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800">
              Graduating Candidates Verification Matrix
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredCandidates.length} students
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-time synchronization with Bursary, Library, and Senate Broad-sheets
          </span>
        </div>

        {candidatesLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading graduating candidates and evaluating institutional clearance gates...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No graduating candidates found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Verify that students are in graduating level (NCE 300 / DEGREE 400).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold text-slate-600">
                  <th className="py-3 px-4">Student & Programme</th>
                  <th className="py-3 px-3 text-center">Division</th>
                  <th className="py-3 px-3 text-center">CGPA & Standing</th>
                  <th className="py-3 px-3 text-center">Bursary Gate</th>
                  <th className="py-3 px-3 text-center">Library Gate</th>
                  <th className="py-3 px-3 text-center">Academic Gate</th>
                  <th className="py-3 px-4 text-right">Certificate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((candidate) => {
                  const isFinancialPass = candidate.financialClearance.isCleared;
                  const isLibraryPass = candidate.libraryClearance.isCleared;
                  const isAcademicPass =
                    candidate.isEligibleForGraduation &&
                    candidate.outstandingFailedCourses.length === 0 &&
                    candidate.finalCgpa >= 1.5;
                  const allGatesPass = isFinancialPass && isLibraryPass && isAcademicPass;

                  return (
                    <tr
                      key={candidate.studentId}
                      className="hover:bg-slate-50/75 transition-colors"
                    >
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{candidate.studentName}</div>
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{candidate.matricNumber}</span>
                          <span>•</span>
                          <span className="text-slate-600">{candidate.programmeName}</span>
                        </div>
                      </td>

                      {/* Division */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            candidate.division === 'DEGREE'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {candidate.division}
                        </span>
                      </td>

                      {/* CGPA & Standing */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-bold text-slate-900">
                          {candidate.finalCgpa.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-700">
                          {candidate.honorsClassification}
                        </div>
                      </td>

                      {/* Bursary Gate */}
                      <td className="py-3 px-3 text-center">
                        {isFinancialPass ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid (₦0)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>
                              ₦{(candidate.financialClearance.outstandingDebtKobo / 100).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Library Gate */}
                      <td className="py-3 px-3 text-center">
                        {isLibraryPass ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Cleared</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>{candidate.libraryClearance.status}</span>
                          </div>
                        )}
                      </td>

                      {/* Academic Gate */}
                      <td className="py-3 px-3 text-center">
                        {isAcademicPass ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>0 Carry-overs</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>{candidate.outstandingFailedCourses.length} Deficits</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {candidate.hasCertificate ? (
                          <button
                            onClick={() => handleViewExistingCertificate(candidate)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-600" />
                            <span>View Serial</span>
                          </button>
                        ) : allGatesPass ? (
                          <button
                            onClick={() => handleIssueCertificate(candidate)}
                            disabled={issueMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            <Award className="w-3.5 h-3.5 text-white" />
                            <span>Issue Certificate</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            title="Cannot issue certificate until Bursary debt is cleared, Library stamp granted, and academic deficits resolved."
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Clearance Blocked</span>
                          </button>
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

      {/* Official Certificate Preview Modal */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full border-4 border-amber-500/30 shadow-2xl p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Background Watermark Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <Award className="w-96 h-96 text-slate-900" />
            </div>

            {/* Header / Crest */}
            <div className="text-center relative">
              <span className="text-[11px] font-extrabold tracking-widest uppercase text-amber-700 block">
                Federal Republic of Nigeria
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                COLLEGE OF EDUCATION, KATSINA-ALA
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                P.M.B. 1008, Katsina-Ala, Benue State • Established 1976
              </p>

              <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-emerald-600 mx-auto my-3 rounded-full" />

              <span className="text-xs font-semibold italic text-slate-600 block">
                By the Authority of the Governing Council and Academic Board
              </span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block mt-1">
                Be it known that
              </span>
            </div>

            {/* Graduate Name & Qualification */}
            <div className="text-center my-6 relative">
              <h4 className="text-2xl font-black text-slate-950 tracking-tight underline decoration-amber-500 decoration-2 underline-offset-4">
                {viewingCertificate.studentName}
              </h4>
              <p className="font-mono text-xs font-semibold text-slate-500 mt-1">
                Matriculation Number: {viewingCertificate.matricNumber}
              </p>

              <p className="text-xs text-slate-600 max-w-lg mx-auto mt-4 leading-relaxed">
                having satisfied all the requirements of the statutes and successfully completed the
                approved programme of study, is hereby admitted to the award of:
              </p>

              <div className="my-3 px-4 py-2 bg-amber-50/70 border border-amber-200 rounded-xl inline-block">
                <span className="text-base font-black text-amber-950 block">
                  {viewingCertificate.qualificationAwarded}
                </span>
                <span className="text-xs font-extrabold text-emerald-800">
                  Classification: {viewingCertificate.honorsClassification} (CGPA:{' '}
                  {viewingCertificate.finalCgpa.toFixed(2)})
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Conferred on: <strong>{viewingCertificate.confermentDate}</strong>
              </p>
            </div>

            {/* Cryptographic QR Hash & Signatures Footer */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
              {/* QR Verification Info */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-900 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-md">
                  <QrCode className="w-12 h-12 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Cryptographic Serial & Verification Hash
                  </span>
                  <div className="font-mono font-black text-xs text-slate-900">
                    {viewingCertificate.certificateNumber}
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 truncate max-w-[240px]">
                    Hash: {viewingCertificate.qrVerificationHash}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Senate Tamper-Proof Signature Verified</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
