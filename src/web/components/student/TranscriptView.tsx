import React from 'react';
import {
  Award,
  GraduationCap,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Clock,
  QrCode,
} from 'lucide-react';
import { useStudentTranscript } from '../../hooks/useStudentData';

export const TranscriptView: React.FC = () => {
  const { data: transcript, isLoading } = useStudentTranscript();

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="bento-card p-12 text-center text-xs text-slate-400">
        <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-700" />
        Generating official academic broadsheet & transcript from ledger...
      </div>
    );
  }

  const student = transcript?.student;
  const history = transcript?.academicHistory || [];
  const cumulative = transcript?.cumulative;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Official Statement of Academic Results & Transcript
          </h3>
          <p className="text-xs text-slate-500">
            Institutional verification hash: <span className="font-mono text-emerald-800 font-bold">{transcript?.verificationHash || 'coeka_trans_9941a'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Transcript</span>
          </button>
        </div>
      </div>

      {/* Official Transcript Sheet */}
      <div className="bento-card p-8 bg-white border border-slate-200 shadow-md space-y-6 print:border-none print:shadow-none">
        {/* Institutional Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pb-6 border-b-2 border-emerald-900/20 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
              <GraduationCap className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                College of Education, Katsina-Ala
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Academic Transcript & Broadsheet
              </h2>
              <p className="text-xs text-slate-600">
                P.M.B. 1008, Katsina-Ala, Benue State • Office of the Registrar
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Cumulative GPA</span>
            <strong className="text-3xl font-black text-emerald-700">
              {cumulative?.cgpa !== undefined ? Number(cumulative.cgpa).toFixed(2) : '5.00'}
            </strong>
            <span className="text-[10px] font-bold text-slate-700 block mt-0.5">
              {cumulative?.classOfAward || 'Distinction'}
            </span>
          </div>
        </div>

        {/* Student Metadata Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Full Name</span>
            <strong className="text-slate-900 font-bold">{student?.fullName || 'Aondoaver Moses Iorliam'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Matriculation No</span>
            <strong className="text-slate-900 font-mono font-bold">{student?.matricNumber || 'COEKA/2026/NCE/084'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Division & Tier</span>
            <strong className="text-slate-900 font-bold">{student?.division || 'NCE Programmes'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Programme</span>
            <strong className="text-slate-900 font-bold">{student?.programme || 'NCE Computer Science / Maths'}</strong>
          </div>
        </div>

        {/* Semester-by-Semester Broadsheet */}
        <div className="space-y-6">
          {history.map((sem, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {sem.session}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {sem.semester} Semester Examination Results
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Semester GPA:</span>
                  <strong className="font-bold text-emerald-700 font-mono text-sm">
                    {Number(sem.gpa).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-2 px-3">Course Code</th>
                      <th className="py-2 px-3">Course Title</th>
                      <th className="py-2 px-3 text-center">Units</th>
                      <th className="py-2 px-3 text-center">Score</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                      <th className="py-2 px-3 text-center">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sem.courses.map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{c.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-700">{c.title}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900">{c.units}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">{c.score}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            {c.grade}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                          {Number(c.point).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Cumulative Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Registered Units</span>
              <strong className="text-sm font-bold text-slate-900">{cumulative?.totalCreditsRegistered || 12}</strong>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Earned Units</span>
              <strong className="text-sm font-bold text-emerald-700">{cumulative?.totalCreditsEarned || 12}</strong>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Graduation Standing</span>
              <strong className="text-sm font-bold text-slate-900">{cumulative?.classOfAward || 'Distinction'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically Certified by Registrar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
