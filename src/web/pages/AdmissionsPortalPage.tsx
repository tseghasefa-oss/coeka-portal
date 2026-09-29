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
  Baby,
  Calendar,
  User,
  Heart,
  MapPin,
} from 'lucide-react';
import { useAppStore, SchoolDivision } from '../stores/useAppStore';
import { useAdmissionsScreening } from '../hooks/usePortalData';
import { OLevelSubjectGrade } from '../../services/admissions/screeningEngine';

export function AdmissionsPortalPage() {
  const { setActiveTab } = useAppStore();
  const admissionsMutation = useAdmissionsScreening();

  // Active Division Tab
  const [applicantDivision, setApplicantDivision] = useState<SchoolDivision>('NCE');

  // Common Candidate Bio-Data
  const [applicantName, setApplicantName] = useState('Terfa Emmanuel Aondo');
  const [applicantEmail, setApplicantEmail] = useState('terfa.aondo@example.com');
  const [applicantPhone, setApplicantPhone] = useState('0803 123 4567');
  const [stateOfOrigin, setStateOfOrigin] = useState('Benue');
  const [lga, setLga] = useState('Katsina-Ala');

  // --- Tertiary (NCE & Degree) State ---
  const [applicantJamb, setApplicantJamb] = useState<number>(165);
  const [selectedCourse, setSelectedCourse] = useState('Computer Science / Mathematics');
  const [oLevelGrades, setOLevelGrades] = useState<OLevelSubjectGrade[]>([
    { subject: 'English Language', grade: 'C4' },
    { subject: 'Mathematics', grade: 'C5' },
    { subject: 'Biology', grade: 'B3' },
    { subject: 'Chemistry', grade: 'C6' },
    { subject: 'Physics', grade: 'B2' },
  ]);

  // --- Secondary School State ---
  const [targetSecondaryClass, setTargetSecondaryClass] = useState('JSS 1 (Basic 7)');
  const [secondaryPrevSchool, setSecondaryPrevSchool] = useState('Demonstration Primary School, Katsina-Ala');
  const [secondaryExamScore, setSecondaryExamScore] = useState<number>(76);
  const [secondaryParentName, setSecondaryParentName] = useState('Elder Moses Iorliam');
  const [secondaryParentPhone, setSecondaryParentPhone] = useState('0802 987 6543');
  const [secondaryParentOccupation, setSecondaryParentOccupation] = useState('Civil Servant');
  const [secondaryAddress, setSecondaryAddress] = useState('Plot 14, GRA Extension, Katsina-Ala, Benue State');

  // --- Primary & Nursery State ---
  const [targetPrimaryClass, setTargetPrimaryClass] = useState('Primary 1 (Basic 1)');
  const [pupilDob, setPupilDob] = useState('2020-04-12');
  const [primaryPrevSchool, setPrimaryPrevSchool] = useState('Early Learners Nursery, Katsina-Ala');
  const [primaryParentName, setPrimaryParentName] = useState('Mrs. Dooshima Aondo');
  const [primaryParentPhone, setPrimaryParentPhone] = useState('0814 555 1234');
  const [pupilHealthNotes, setPupilHealthNotes] = useState('Fully Immunized • No Known Allergies');
  const [primaryAddress, setPrimaryAddress] = useState('House 8, College Staff Quarters, Katsina-Ala');

  // Offer Result State
  const [admissionOffer, setAdmissionOffer] = useState<{
    applicationNumber: string;
    isEligible: boolean;
    reason: string;
    division: SchoolDivision;
    programmeName: string;
    targetClassOrCourse: string;
    scoreOrEvaluation: string;
    acceptanceFee: string;
    signatoryName: string;
    signatoryTitle: string;
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

    if (applicantDivision === 'NCE' || applicantDivision === 'DEGREE') {
      const cutoff = applicantDivision === 'DEGREE' ? 140 : 100;
      admissionsMutation.mutate(
        {
          division: applicantDivision,
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
              division: applicantDivision,
              programmeName: applicantDivision === 'DEGREE' ? 'Undergraduate Degree Programme (Affiliated University)' : 'Nigeria Certificate in Education (NCE)',
              targetClassOrCourse: selectedCourse,
              scoreOrEvaluation: `UTME / Screening Score: ${applicantJamb}`,
              acceptanceFee: '₦15,000.00',
              signatoryName: 'Dr. Elizabeth Angbiandoo',
              signatoryTitle: 'Academic Registrar, COEKA',
            });
          },
        }
      );
    } else if (applicantDivision === 'SECONDARY') {
      admissionsMutation.mutate(
        {
          division: 'SECONDARY',
          entranceExamScore: secondaryExamScore,
          departmentCutOff: 50,
        },
        {
          onSuccess: (evaluation) => {
            setAdmissionOffer({
              applicationNumber: `COEKA/SEC/2026/${Math.floor(1000 + Math.random() * 9000)}`,
              isEligible: evaluation.isEligible,
              reason: evaluation.reason,
              division: 'SECONDARY',
              programmeName: 'COEKA Demonstration Secondary School',
              targetClassOrCourse: targetSecondaryClass,
              scoreOrEvaluation: `Diagnostic Entrance Score: ${secondaryExamScore}% (Pass mark: 50%)`,
              acceptanceFee: '₦10,000.00',
              signatoryName: 'Mr. Dennis Iorver',
              signatoryTitle: 'Principal, Demonstration Secondary School',
            });
          },
        }
      );
    } else {
      // PRIMARY / NURSERY
      admissionsMutation.mutate(
        {
          division: 'PRIMARY',
          entranceExamScore: 85,
          departmentCutOff: 50,
        },
        {
          onSuccess: (evaluation) => {
            setAdmissionOffer({
              applicationNumber: `COEKA/PRI/2026/${Math.floor(1000 + Math.random() * 9000)}`,
              isEligible: evaluation.isEligible,
              reason: evaluation.reason,
              division: 'PRIMARY',
              programmeName: 'COEKA Demonstration Primary & Nursery School',
              targetClassOrCourse: targetPrimaryClass,
              scoreOrEvaluation: `Foundational Readiness Evaluation: CLEARED (DOB: ${pupilDob})`,
              acceptanceFee: '₦8,000.00',
              signatoryName: 'Mrs. Victoria Gbenda',
              signatoryTitle: 'Headmistress, Demonstration Primary School',
            });
          },
        }
      );
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const isTertiary = applicantDivision === 'NCE' || applicantDivision === 'DEGREE';
  const isSecondary = applicantDivision === 'SECONDARY';
  const isPrimary = applicantDivision === 'PRIMARY';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* 1. PUBLIC APPLICANT HEADER                                                */}
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
      <section className="bg-gradient-to-b from-[#0B192C] to-[#122B4D] text-white py-10 sm:py-12 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FACC15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold tracking-wide backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official 2026/2027 Academic Session Admissions Open</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Online Admissions & Candidate Screening Gateway
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Select your academic division below. The application dynamically adjusts to your specific institutional requirements — from tertiary JAMB/O-Levels to foundational entrance assessments.
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
            
            {/* Left 8 Cols: Dynamic Application Form */}
            <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              
              {/* Division Selector Tabs */}
              <div className="pb-5 border-b border-slate-100 mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#0B192C]">
                      Candidate Admission Application Form
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select your academic division to display the tailored application requirements:
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 self-start sm:self-auto">
                    2026/2027 Active
                  </span>
                </div>

                {/* 4 Division Tab Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {[
                    { id: 'NCE' as const, label: 'NCE Programme', subtitle: 'Requires JAMB + O\'Levels', icon: Award },
                    { id: 'DEGREE' as const, label: 'Degree Programme', subtitle: 'Affiliated University', icon: GraduationCap },
                    { id: 'SECONDARY' as const, label: 'Demonstration Secondary', subtitle: 'No JAMB / No O\'Levels', icon: School },
                    { id: 'PRIMARY' as const, label: 'Primary & Nursery', subtitle: 'Basic School Readiness', icon: Baby },
                  ].map((div) => {
                    const IconComp = div.icon;
                    const isActive = applicantDivision === div.id;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setApplicantDivision(div.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <IconComp className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                          {isActive && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                        </div>
                        <div>
                          <span className={`text-xs font-black block leading-tight ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                            {div.label}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 block leading-snug">{div.subtitle}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleApply} className="space-y-6">
                
                {/* ------------------------------------------------------------- */}
                {/* SCENARIO A: TERTIARY EDUCATION (NCE & DEGREE)                 */}
                {/* Requires JAMB score + 5 O'Level credits                       */}
                {/* ------------------------------------------------------------- */}
                {isTertiary && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Bio Data */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Tertiary Candidate Information</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Full Name (As registered in JAMB) <span className="text-rose-500">*</span>
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
                            2026 UTME / JAMB Score <span className="text-rose-500">*</span>
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
                            Cut-Off: <strong>{applicantDivision === 'DEGREE' ? '140' : '100'}</strong> for {applicantDivision}.
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

                    {/* O'Level Matrix */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>O'Level Subject Credits (WAEC / NECO / NABTEB)</span>
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
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SCENARIO B: SECONDARY SCHOOL APPLICATION                      */}
                {/* NO JAMB • NO O'LEVELS • Uses Entrance Exam & Guardian Info   */}
                {/* ------------------------------------------------------------- */}
                {isSecondary && (
                  <div className="space-y-6 animate-fade-in">
                    
                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3">
                      <School className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-purple-950 uppercase tracking-wide">
                          Demonstration Secondary School Enrollment Note
                        </h4>
                        <p className="text-xs text-purple-800 mt-0.5 leading-relaxed">
                          Secondary school applicants <strong>do not require JAMB or O-Level results</strong>. Admission is granted based on Common Entrance examination screening, continuous assessment transcripts, and placement interview.
                        </p>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span>Student Information</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Student's Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={applicantName}
                            onChange={(e) => setApplicantName(e.target.value)}
                            placeholder="e.g. Terfa Emmanuel Aondo"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Target Class for 2026/2027 <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={targetSecondaryClass}
                            onChange={(e) => setTargetSecondaryClass(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none"
                          >
                            <option>JSS 1 (Fresh Junior Secondary Entrance)</option>
                            <option>JSS 2 (Junior Secondary Transfer)</option>
                            <option>JSS 3 (Junior Secondary Transfer)</option>
                            <option>SSS 1 (Science Discipline)</option>
                            <option>SSS 1 (Arts & Humanities Discipline)</option>
                            <option>SSS 1 (Commercial / Business Discipline)</option>
                            <option>SSS 2 (Senior Secondary Transfer)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Previous Primary / Junior School Attended <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={secondaryPrevSchool}
                            onChange={(e) => setSecondaryPrevSchool(e.target.value)}
                            placeholder="School name"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Common Entrance / Diagnostic Exam Score (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={secondaryExamScore}
                            onChange={(e) => setSecondaryExamScore(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">Pass benchmark: 50%</span>
                        </div>
                      </div>
                    </div>

                    {/* Parent / Guardian Information */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-purple-600" />
                        <span>Parent / Guardian Contact Details</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Parent / Guardian Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={secondaryParentName}
                            onChange={(e) => setSecondaryParentName(e.target.value)}
                            placeholder="Full name"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Parent Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={secondaryParentPhone}
                            onChange={(e) => setSecondaryParentPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Parent Occupation
                          </label>
                          <input
                            type="text"
                            value={secondaryParentOccupation}
                            onChange={(e) => setSecondaryParentOccupation(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Residential Address
                          </label>
                          <input
                            type="text"
                            value={secondaryAddress}
                            onChange={(e) => setSecondaryAddress(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SCENARIO C: BASIC EDUCATION (PRIMARY & NURSERY)               */}
                {/* NO JAMB • NO O'LEVELS • Uses Age/DOB & Foundational Readiness */}
                {/* ------------------------------------------------------------- */}
                {isPrimary && (
                  <div className="space-y-6 animate-fade-in">
                    
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                      <Baby className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                          Demonstration Primary & Nursery School Enrollment Note
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                          Primary and Nursery applications <strong>do not require examination slips, JAMB, or O-Levels</strong>. Pupils are evaluated on developmental age-readiness, birth certification, and basic school aptitude.
                        </p>
                      </div>
                    </div>

                    {/* Pupil Information */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Child / Pupil Information</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Pupil's Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={applicantName}
                            onChange={(e) => setApplicantName(e.target.value)}
                            placeholder="Child's full name"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Target Class / Grade <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={targetPrimaryClass}
                            onChange={(e) => setTargetPrimaryClass(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                          >
                            <option>Crèche / Daycare (Age 6m - 1.5 yrs)</option>
                            <option>Pre-Nursery / Playgroup (Age 2 yrs)</option>
                            <option>Nursery 1 (Age 3 yrs)</option>
                            <option>Nursery 2 (Age 4 yrs)</option>
                            <option>Primary 1 (Fresh Basic 1 - Age 5-6 yrs)</option>
                            <option>Primary 2 (Transfer)</option>
                            <option>Primary 3 (Transfer)</option>
                            <option>Primary 4 (Transfer)</option>
                            <option>Primary 5 (Transfer)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Date of Birth <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={pupilDob}
                            onChange={(e) => setPupilDob(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Previous Nursery / School Attended (If Any)
                          </label>
                          <input
                            type="text"
                            value={primaryPrevSchool}
                            onChange={(e) => setPrimaryPrevSchool(e.target.value)}
                            placeholder="e.g. Home or previous nursery"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Parent & Medical / Care Notes */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Parent Contact & Health Care Information</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Parent / Guardian Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={primaryParentName}
                            onChange={(e) => setPrimaryParentName(e.target.value)}
                            placeholder="Mother/Father/Guardian"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Emergency Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={primaryParentPhone}
                            onChange={(e) => setPrimaryParentPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Special Health, Allergy or Dietary Notes
                          </label>
                          <input
                            type="text"
                            value={pupilHealthNotes}
                            onChange={(e) => setPupilHealthNotes(e.target.value)}
                            placeholder="e.g. None / Asthma / Allergic to peanuts"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Home Address in Katsina-Ala or Vicinity
                          </label>
                          <input
                            type="text"
                            value={primaryAddress}
                            onChange={(e) => setPrimaryAddress(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submission CTA */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    {isTertiary
                      ? 'Credentials will be verified against statutory NCCE / University benchmarks.'
                      : 'Candidate details will be registered for immediate placement and issuance of enrollment letter.'}
                  </div>

                  <button
                    type="submit"
                    disabled={admissionsMutation.isPending}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {admissionsMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing Application...</span>
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

            {/* Right 4 Cols: Dynamic Criteria & Info Cards */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card 1: Dynamic Criteria Based on Selected Division */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-[#0B192C]">
                    {isTertiary ? 'Tertiary Admission Criteria' : isSecondary ? 'Secondary School Criteria' : 'Basic Education Criteria'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  {isTertiary && (
                    <>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">NCE Programme:</strong> 100+ UTME score or pass in pre-NCE; at least 5 O'Level credits including English & Math.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Degree Programme:</strong> 140+ UTME score or Direct Entry (NCE / ND with Merit).
                        </div>
                      </div>
                    </>
                  )}

                  {isSecondary && (
                    <>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">JSS 1 Entrance:</strong> Primary School Leaving Certificate + pass in National / State Common Entrance.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Senior Secondary (SSS 1):</strong> BECE / Basic Education Certificate with placement into Science, Arts, or Commercial.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Transfer Students:</strong> Continuous Assessment Dossier from accredited secondary school.
                        </div>
                      </div>
                    </>
                  )}

                  {isPrimary && (
                    <>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Nursery & Early Years:</strong> Ages 2 to 4 years; developmental readiness and toilet training.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Primary 1 Intake:</strong> Child must be 5 years or older by September 2026; birth certificate verification.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Immunization:</strong> Submission of child's routine national immunization card.
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  {isTertiary
                    ? 'Official transcripts for Direct Entry candidates must be addressed directly to the Registrar.'
                    : isSecondary
                    ? 'Boarding accommodation is available on campus for secondary students subject to bedspace allocation.'
                    : 'School bus transit routes cover major locations in Katsina-Ala municipality.'}
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
                  Have questions about class placement or enrollment fees? Contact our admissions officers:
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
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {admissionOffer.programmeName}
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
                  I am pleased to inform you that your application for admission into the 2026/2027 Academic Session has been evaluated and approved. Following {admissionOffer.scoreOrEvaluation}, you have been offered <strong>Provisional Admission</strong> into:
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-[#0B192C] text-sm sm:text-base text-center">
                  {admissionOffer.programmeName} — <span className="text-blue-700">{admissionOffer.targetClassOrCourse}</span>
                </div>

                <p className="text-xs text-slate-600">
                  This offer is provisional and subject to formal verification of qualifying birth/academic credentials and settlement of the mandatory acceptance fee ({admissionOffer.acceptanceFee}).
                </p>
              </div>

              {/* Signatures & Verification Stamp */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                <div className="text-center sm:text-left">
                  <div className="font-serif italic font-bold text-slate-800 text-sm">{admissionOffer.signatoryName}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{admissionOffer.signatoryTitle}</div>
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
                  ← Submit another candidate application
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
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              NDPA 2023 Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('website')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Public Website
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
