import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  School,
  BookOpen,
  Award,
  Lock,
  Printer,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useAppStore, SchoolDivision } from '../stores/useAppStore';
import { useAdmissionsScreening } from '../hooks/usePortalData';
import { OLevelSubjectGrade } from '../../services/admissions/screeningEngine';

export function AdmissionsPortalPage() {
  const { setActiveTab } = useAppStore();
  const admissionsMutation = useAdmissionsScreening();

  // Application Form State
  const [applicantDivision, setApplicantDivision] = useState<SchoolDivision>('NCE');
  const [applicantName, setApplicantName] = useState('Terfa Emmanuel Aondo');
  const [applicantEmail, setApplicantEmail] = useState('terfa.aondo@example.com');
  const [applicantPhone, setApplicantPhone] = useState('0803 123 4567');
  const [applicantJamb, setApplicantJamb] = useState<number>(165);
  const [selectedCourse, setSelectedCourse] = useState('Computer Science / Mathematics');
  const [stateOfOrigin, setStateOfOrigin] = useState('Benue');
  const [lga, setLga] = useState('Katsina-Ala');

  // O'Level Subject Grades State
  const [oLevelGrades, setOLevelGrades] = useState<OLevelSubjectGrade[]>([
    { subject: 'English Language', grade: 'C4' },
    { subject: 'Mathematics', grade: 'C5' },
    { subject: 'Biology', grade: 'B3' },
    { subject: 'Chemistry', grade: 'C6' },
    { subject: 'Physics', grade: 'B2' },
  ]);

  // Offer Result State
  const [admissionOffer, setAdmissionOffer] = useState<{
    applicationNumber: string;
    isEligible: boolean;
    reason: string;
    score: number;
    division: string;
    course: string;
  } | null>(null);

  const handleGradeChange = (index: number, newGrade: any) => {
    setOLevelGrades((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], grade: newGrade };
      return updated;
    });
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    const cutoff = applicantDivision === 'DEGREE' ? 140 : applicantDivision === 'NCE' ? 100 : 50;

    admissionsMutation.mutate(
      {
        division: applicantDivision as 'NCE' | 'DEGREE',
        jambScore: applicantJamb,
        departmentCutOff: cutoff,
        oLevelSubjects: oLevelGrades,
      },
      {
        onSuccess: (evaluation) => {
          setAdmissionOffer({
            applicationNumber: `COEKA/${applicantDivision}/2026/${Math.floor(1000 + Math.random() * 9000)}`,
            isEligible: evaluation.isEligible,
            reason: evaluation.reason,
            score: applicantJamb,
            division: applicantDivision,
            course: selectedCourse,
          });
        },
      }
    );
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* 1. PUBLIC APPLICANT HEADER (NO STUDENT PROFILE / NO AUTHENTICATED SIDEBAR) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Brand & Crest */}
          <div
            onClick={() => setActiveTab('website')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-12 sm:w-12 sm:h-13 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 drop-shadow">
              <img src="/coeka-logo.png" alt="COEKA Crest" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-tight leading-none text-white group-hover:text-amber-400 transition-colors">
                COLLEGE OF EDUCATION
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                Katsina-Ala • Admissions Gateway
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('website')}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/15 transition-all shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Return to</span> Website
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4.5 py-2 rounded-xl text-xs font-black text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow-md transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Student / Staff Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. ADMISSIONS HERO & INFORMATIVE BANNER                                   */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-[#0B192C] to-[#122B4D] text-white py-10 sm:py-14 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FACC15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold tracking-wide backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official 2026/2027 Academic Session Admissions Open</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Online Admissions & Automated Candidate Screening Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Welcome prospective applicants. Apply for Nigeria Certificate in Education (NCE), University-Affiliated Degree,
              Demonstration Secondary, or Demonstration Primary programmes. Your credentials are automatically screened in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. APPLICATION WORKSPACE & SCREENING ENGINE                               */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-1">
        
        {!admissionOffer ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 8 Cols: Interactive Application Form */}
            <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#0B192C]">
                    Candidate Admission Application Form
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step 1 of 2: Candidate Bio-Data, Programme Selection & O'Level Verification
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  Active Intake
                </span>
              </div>

              <form onSubmit={handleApply} className="space-y-6">
                
                {/* Section 1: Programme Division */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Select Target Division & Award
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'NCE' as const, label: 'NCE Programme', award: 'Nigeria Certificate in Education (3 Yrs)' },
                      { id: 'DEGREE' as const, label: 'Degree Programme', award: 'B.Ed / B.Sc(Ed) Affiliated Univ' },
                      { id: 'SECONDARY' as const, label: 'Secondary School', award: 'COEKA Demonstration (JSS-SSS)' },
                      { id: 'PRIMARY' as const, label: 'Basic Education', award: 'Demonstration Primary & Nursery' },
                    ].map((div) => (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setApplicantDivision(div.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          applicantDivision === div.id
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span className={`text-xs font-black ${applicantDivision === div.id ? 'text-blue-900' : 'text-slate-900'}`}>
                          {div.label}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 leading-snug">{div.award}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2: Bio Data */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
                    Candidate Information & Verification
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name (As registered in JAMB / WAEC) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        UTME / JAMB Score (or Screening Score) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="400"
                        value={applicantJamb}
                        onChange={(e) => setApplicantJamb(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                        required
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Minimum Cut-Off: <strong>{applicantDivision === 'DEGREE' ? '140' : '100'}</strong> for this division.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Intended Programme / Course of Study <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      >
                        <option>Computer Science / Mathematics</option>
                        <option>Biology / Integrated Science</option>
                        <option>English Language / Social Studies</option>
                        <option>Business Education (Accounting & Secretarial)</option>
                        <option>Primary Education Studies (PES)</option>
                        <option>Early Childhood Care Education (ECCE)</option>
                        <option>B.Sc(Ed) Mathematics (Degree)</option>
                        <option>B.Sc(Ed) Biology (Degree)</option>
                        <option>B.A(Ed) English (Degree)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        State of Origin / LGA
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={stateOfOrigin}
                          onChange={(e) => setStateOfOrigin(e.target.value)}
                          placeholder="State"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                        />
                        <input
                          type="text"
                          value={lga}
                          onChange={(e) => setLga(e.target.value)}
                          placeholder="LGA"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: O'Level Grades Matrix */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      O'Level Subject Credits (WAEC / NECO / NABTEB)
                    </h3>
                    <span className="text-[10px] text-slate-500">Minimum 5 Credits required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {oLevelGrades.map((subject, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-700 block truncate mb-1.5" title={subject.subject}>
                          {subject.subject}
                        </span>
                        <select
                          value={subject.grade}
                          onChange={(e) => handleGradeChange(idx, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold focus:outline-none"
                        >
                          <option value="A1">A1 (Distinction)</option>
                          <option value="B2">B2 (Very Good)</option>
                          <option value="B3">B3 (Good)</option>
                          <option value="C4">C4 (Credit)</option>
                          <option value="C5">C5 (Credit)</option>
                          <option value="C6">C6 (Credit)</option>
                          <option value="D7">D7 (Pass)</option>
                          <option value="E8">E8 (Pass)</option>
                          <option value="F9">F9 (Fail)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submission CTA */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    By submitting, your qualifications are verified against statutory NCCE & affiliated university benchmarks.
                  </div>

                  <button
                    type="submit"
                    disabled={admissionsMutation.isPending}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {admissionsMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating Qualifications...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Application & Check Clearance</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right 4 Cols: Admission Guidelines & Instant Info */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card 1: Statutory Admission Criteria */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-[#0B192C]">Statutory Admission Criteria</h3>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">NCE Programmes:</strong> 100+ UTME score or pass in pre-NCE; at least 5 O'Level credits including English & Math.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Degree Programmes:</strong> 140+ UTME score or Direct Entry with NCE / National Diploma with Merit pass.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Basic & Secondary:</strong> Completion of foundational schooling and diagnostic aptitude assessment.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  Direct Entry candidates with NCE or ND diplomas must submit their academic transcripts to the Academic Registrar.
                </div>
              </div>

              {/* Card 2: Helpdesk & Verification Notice */}
              <div className="bg-[#0B192C] text-white rounded-2xl sm:rounded-3xl p-6 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/80">
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-amber-400 flex items-center justify-center font-bold">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-white">Admissions Directorate Helpdesk</h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Experiencing difficulties or require assistance with your subject combinations? Contact our admissions officer:
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>admissions@coeka.edu.ng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>+234 (0) 813 456 7890</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ===================================================================== */
          /* ADMISSION OFFER PROVISIONAL CLEARANCE SLIP (OFFICIAL LETTERHEAD)      */
          /* ===================================================================== */
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            
            {/* Status Banner */}
            <div className={`p-6 rounded-2xl sm:rounded-3xl border flex items-start gap-4 shadow-sm ${
              admissionOffer.isEligible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-xs">
                {admissionOffer.isEligible ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {admissionOffer.isEligible
                    ? 'Provisional Admission Offer Issued!'
                    : 'Candidate Pre-Screening Review Pending'}
                </h3>
                <p className="text-xs sm:text-sm font-medium leading-relaxed opacity-90">
                  {admissionOffer.reason}
                </p>
                <div className="pt-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-white/80 border border-slate-200/80 inline-block">
                    Application Ref: <strong>{admissionOffer.applicationNumber}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Printable Institutional Admission Slip */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-md space-y-6">
              
              {/* Header Letterhead */}
              <div className="text-center border-b-2 border-slate-900 pb-6 space-y-2">
                <div className="w-16 h-16 mx-auto mb-2">
                  <img src="/coeka-logo.png" alt="COEKA Crest" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] uppercase tracking-wide">
                  College of Education, Katsina-Ala
                </h2>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  Office of the Academic Registrar • Admissions Directorate
                </p>
                <p className="text-[11px] text-slate-500">
                  P.M.B. 1008, Katsina-Ala, Benue State, Federal Republic of Nigeria
                </p>
              </div>

              {/* Offer Body */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                  <span>Date: <strong>September 29, 2026</strong></span>
                  <span>Session: <strong>2026/2027</strong></span>
                </div>

                <p>
                  Dear <strong>{applicantName}</strong>,
                </p>

                <p>
                  I am pleased to inform you that following your satisfactory performance in the 2026 Unified Tertiary Matriculation Examination (UTME) / Institutional Screening with score <strong>{admissionOffer.score}</strong>, and verification of your qualifying O'Level subject credits, you have been offered <strong>Provisional Admission</strong> into the:
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-[#0B192C] text-sm sm:text-base text-center">
                  {admissionOffer.division} — {admissionOffer.course}
                </div>

                <p className="text-xs text-slate-600">
                  This offer is provisional and subject to formal verification of your original certificates, JAMB admission letter, and payment of the non-refundable institutional acceptance fee.
                </p>
              </div>

              {/* Signatures & Verification Stamp */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                <div className="text-center sm:text-left">
                  <div className="font-serif italic font-bold text-slate-800 text-sm">Dr. Elizabeth Angbiandoo</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Academic Registrar</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintSlip}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Offer Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-black text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <span>Proceed to Portal Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAdmissionOffer(null)}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  ← Submit another candidate screening
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 4. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            &copy; 2026 College of Education, Katsina-Ala. Powered by <strong>Fruitfulujah Project</strong>.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('privacy')}
              className="hover:text-blue-600 transition-colors"
            >
              NDPA 2023 Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('website')}
              className="hover:text-blue-600 transition-colors"
            >
              Public Website
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
