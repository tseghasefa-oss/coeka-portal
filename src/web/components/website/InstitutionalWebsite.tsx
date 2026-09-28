import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  School,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  FileText,
  Search,
  Check,
  Laptop,
  Flame,
  Globe2,
  Sparkles,
  Lock,
  ArrowUpRight,
  HelpCircle,
  Clock,
  Layers,
  Info
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface Announcement {
  id: string;
  title: string;
  category: 'Admissions' | 'Academic' | 'Hostel' | 'General';
  date: string;
  summary: string;
  content: string;
  author: string;
}

export function InstitutionalWebsite() {
  const { setActiveTab } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [activeDivisionFilter, setActiveDivisionFilter] = useState<'ALL' | 'NCE' | 'DEGREE' | 'SECONDARY' | 'PRIMARY'>('ALL');

  // Quick Eligibility Checker state
  const [checkDivision, setCheckDivision] = useState<'NCE' | 'DEGREE'>('NCE');
  const [jambScore, setJambScore] = useState<number | ''>(140);
  const [oLevelCredits, setOLevelCredits] = useState<number>(5);
  const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; message: string } | null>(null);

  const announcements: Announcement[] = [
    {
      id: 'ann-1',
      title: '2026/2027 Academic Session Admissions Exercise Commences',
      category: 'Admissions',
      date: 'September 25, 2026',
      summary: 'Applications are formally invited from suitably qualified candidates for admission into NCE and Degree Programmes.',
      content: `The Academic Board of the College of Education, Katsina-Ala announces the commencement of admission screening for the 2026/2027 academic year. 

Candidates who sat for the 2026 Unified Tertiary Matriculation Examination (UTME) and scored a minimum of 100 for NCE or 140 for Degree programmes, and have five (5) O'Level credits including English Language and Mathematics at not more than two sittings, are invited to apply.

Direct Entry candidates for Degree programmes with NCE, ND, or IJMB are also eligible to register via the official COEKA Portal.`,
      author: 'Office of the Registrar'
    },
    {
      id: 'ann-2',
      title: 'Autonomous Hostel Allocation Now Live on Student Portal',
      category: 'Hostel',
      date: 'September 22, 2026',
      summary: 'Students who have completed 100% of their tuition fee clearance can now select hostel rooms directly from their dashboard.',
      content: `The Directorate of Student Affairs has activated the autonomous room reservation engine for the 2026/2027 academic session. 

Eligible full-time students who have settled their mandatory institutional tuition in full can log into the COEKA Student Portal, navigate to the Hostel Allocation tab, and secure an available bedspace across Sir Kashim Ibrahim, Queen Amina, and Benue Hall residences with zero manual paperwork.`,
      author: 'Directorate of Student Affairs'
    },
    {
      id: 'ann-3',
      title: 'First Semester 2026/2027 Resumption & Orientation Schedule',
      category: 'Academic',
      date: 'September 18, 2026',
      summary: 'Fresh and returning students are advised to review the approved semester calendar and scheduled matriculation ceremony.',
      content: `All fresh and returning students of the College are notified that physical resumption for the first semester begins on Monday, October 12, 2026. 

Fresh student verification, digital ID capture at the Admissions Directorate, and mandatory orientation lectures will hold between October 14 and October 18 at the College Auditorium. Course registration on the SIMS portal closes three weeks from resumption.`,
      author: 'Academic Planning & Registry'
    },
    {
      id: 'ann-4',
      title: 'NCCE Re-Accreditation Team Awards Top Institutional Rating',
      category: 'General',
      date: 'September 10, 2026',
      summary: 'Full accreditation affirmed across all science, vocational, and arts departments following a rigorous week-long review.',
      content: `The National Commission for Colleges of Education (NCCE) evaluation team has concluded its quinquennial accreditation exercise at the College of Education, Katsina-Ala, awarding an outstanding 100% accreditation rating across all 28 NCE academic programmes.

The Provost commends the Governing Council, academic staff, and management for maintaining premier educational standards and investing in state-of-the-art laboratory infrastructure.`,
      author: 'College Information & Protocol Unit'
    }
  ];

  const handleCheckEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    const score = Number(jambScore);
    const cutoff = checkDivision === 'DEGREE' ? 140 : 100;

    if (score >= cutoff && oLevelCredits >= 5) {
      setEligibilityResult({
        eligible: true,
        message: `Congratulations! With a JAMB score of ${score} and ${oLevelCredits} O'Level credits, you meet the institutional threshold for ${checkDivision === 'DEGREE' ? 'Affiliated Degree' : 'NCE'} Admission.`
      });
    } else {
      setEligibilityResult({
        eligible: false,
        message: `Current requirements: Minimum JAMB score of ${cutoff} and 5 relevant O'Level credits. You can still apply for Pre-NCE or Preliminary Studies.`
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-amber-400 selection:text-slate-950">
      
      {/* ========================================================================= */}
      {/* TOP EMERGENCY / TICKER BAR (High Authority & Informational)             */}
      {/* ========================================================================= */}
      <div className="bg-[#0B192C] border-b border-slate-800 text-slate-300 text-xs py-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0">
              Bulletin 2026/2027
            </span>
            <span className="truncate text-slate-300 font-medium">
              Admissions Open for NCE & Affiliated Degree Programmes • Hostel Self-Service Allocation Active • 100% NCCE Accredited
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0 text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Katsina-Ala, Benue State
            </span>
            <span className="hidden sm:inline-block">•</span>
            <a href="mailto:info@coeka.edu.ng" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              info@coeka.edu.ng
            </a>
            <span className="hidden sm:inline-block">•</span>
            <button 
              onClick={() => setActiveTab('privacy')} 
              className="hover:text-amber-400 transition-colors"
            >
              NDPA Privacy
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN STICKY NAVIGATION HEADER                                            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Institutional Brand Identity */}
            <a href="#hero" className="flex items-center gap-3.5 group">
              <div className="w-14 h-16 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 drop-shadow-sm">
                <img src="/coeka-logo.png" alt="COEKA Official Crest" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-[#0B192C] leading-none group-hover:text-blue-700 transition-colors">
                  COLLEGE OF EDUCATION
                </span>
                <span className="text-xs font-bold text-amber-600 tracking-widest uppercase mt-0.5">
                  Katsina-Ala, Benue State
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:block">
                  Established 1976 • Discipline and Dedication
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 font-semibold text-sm text-slate-700">
              <a href="#hero" className="px-3.5 py-2 rounded-lg hover:text-blue-700 hover:bg-slate-100 transition-colors">
                Home
              </a>
              <a href="#about" className="px-3.5 py-2 rounded-lg hover:text-blue-700 hover:bg-slate-100 transition-colors">
                About
              </a>
              <a href="#academics" className="px-3.5 py-2 rounded-lg hover:text-blue-700 hover:bg-slate-100 transition-colors">
                Academics
              </a>
              <a href="#admissions" className="px-3.5 py-2 rounded-lg hover:text-blue-700 hover:bg-slate-100 transition-colors">
                Admissions
              </a>
              <a href="#facilities" className="px-3.5 py-2 rounded-lg hover:text-blue-700 hover:bg-slate-100 transition-colors">
                Campus Life
              </a>
              <a href="#notices" className="px-3.5 py-2 rounded-lg hover:text-blue-700 hover:bg-slate-100 transition-colors">
                Bulletins
              </a>
              <a href="#contact" className="px-3.5 py-2 rounded-lg hover:text-blue-700 hover:bg-slate-100 transition-colors">
                Contact
              </a>
            </nav>

            {/* Action Buttons: Yellow "Student Portal Login" CTA + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-400/20 hover:shadow-lg hover:shadow-amber-400/30 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-amber-300"
              >
                <Lock className="w-4 h-4 text-[#0B192C]" />
                <span>Student Portal Login</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="sm:hidden px-3.5 py-2 rounded-lg font-bold text-xs bg-amber-400 text-[#0B192C] flex items-center gap-1 shadow"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Portal</span>
              </button>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fade-in">
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
            >
              About COEKA
            </a>
            <a
              href="#academics"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
            >
              Academic Divisions
            </a>
            <a
              href="#admissions"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
            >
              Admissions 2026/2027
            </a>
            <a
              href="#facilities"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
            >
              Campus Facilities
            </a>
            <a
              href="#notices"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
            >
              Notice Board
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
            >
              Contact Us
            </a>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveTab('login');
                }}
                className="w-full py-3 px-4 rounded-xl font-black text-center text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Enter Enterprise Portal</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION: Authority, Ambition, Clear Pathways                       */}
      {/* ========================================================================= */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-[#0B192C] via-[#0f2442] to-[#0B192C] text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Subtle geometric background accents */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FACC15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left 7 Columns: Authoritative Headline, Mission & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-amber-400 text-xs font-bold tracking-wide backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>50 Years of Educational Mastery • Established 1976</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
                Shaping the Future of <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
                  Educators in Nigeria
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                The College of Education, Katsina-Ala is Benue State’s flagship teacher-training institution. 
                We produce world-class educators, innovators, and leaders across NCE, affiliated Degree, 
                and model secondary and foundational institutions.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#admissions"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-black text-base text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow-xl shadow-amber-400/20 hover:shadow-amber-400/30 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-amber-300"
                >
                  <span>Apply for 2026/2027</span>
                  <ArrowRight className="w-5 h-5 text-[#0B192C]" />
                </a>

                <a
                  href="#academics"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all backdrop-blur-sm"
                >
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <span>Explore Programmes</span>
                </a>

                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold text-sm text-blue-300 hover:text-white hover:bg-blue-900/30 border border-blue-800/60 rounded-xl transition-all"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Enter Portal</span>
                </button>
              </div>

              {/* Quick Trust Seals */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-slate-400 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>NCCE Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>NUC Degree Affiliated</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>TRCN Accredited</span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Interactive Quick Portal & Division Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
                <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                      <School className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">COEKA Digital Gateway</h3>
                      <p className="text-xs text-slate-400">Institutional Access & Verification</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Edge
                  </span>
                </div>

                {/* 4 Division Quick Launch */}
                <div className="py-5 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Institutional Pathways:
                  </span>
                  
                  {[
                    { title: 'Nigeria Certificate in Education (NCE)', subtitle: '3-Year Standard Professional Teacher Track', badge: 'Premier' },
                    { title: 'Affiliated Degree Programmes', subtitle: 'B.Ed Degrees via UNICAL & UNIJOS Affiliation', badge: 'Direct Entry' },
                    { title: 'Demonstration Secondary School', subtitle: 'Leading Co-Educational Model School in Katsina-Ala', badge: 'WAEC/NECO' },
                    { title: 'Demonstration Primary & Nursery', subtitle: 'Modern Foundational STEM & Early Child Care', badge: 'Foundational' }
                  ].map((div, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all flex items-center justify-between group cursor-pointer"
                      onClick={() => {
                        const target = document.getElementById('academics');
                        target?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            {div.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">{div.subtitle}</p>
                      </div>
                      <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                        {div.badge}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Direct Portal Jump */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Already registered as student or staff?
                  </div>
                  <button
                    onClick={() => setActiveTab('login')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 group"
                  >
                    <span>Log In Here</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* THE "STATS" RIBBON: High-Contrast Navy Blue Metric Bar                  */}
      {/* ========================================================================= */}
      <section className="bg-[#0B192C] border-y border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1">
              <span className="block text-4xl sm:text-5xl font-black text-amber-400">50+</span>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Years of Excellence</span>
              <p className="text-xs text-slate-400">Founded in 1976 by Benue State</p>
            </div>

            <div className="space-y-1">
              <span className="block text-4xl sm:text-5xl font-black text-amber-400">10,000+</span>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Alumni Teachers</span>
              <p className="text-xs text-slate-400">Transforming schools nationwide</p>
            </div>

            <div className="space-y-1">
              <span className="block text-4xl sm:text-5xl font-black text-amber-400">4</span>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Academic Divisions</span>
              <p className="text-xs text-slate-400">NCE, Degree, Secondary, Primary</p>
            </div>

            <div className="space-y-1">
              <span className="block text-4xl sm:text-5xl font-black text-amber-400">100%</span>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Accreditation</span>
              <p className="text-xs text-slate-400">NCCE, NUC & TRCN Certified</p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ABOUT COEKA & PROVOST'S WELCOME (Authority & Trust)                     */}
      {/* ========================================================================= */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left 6 Cols: History, Mission, Values */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                <span>Our Heritage & Vision</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
                Pioneering Pedagogical Distinction Since 1976
              </h2>

              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Established as the Advanced Teachers College, Katsina-Ala, the institution has stood as the pillar
                of educational human capital development in North-Central Nigeria. With over five decades of service,
                COEKA prepares versatile, technology-adept educators who instill moral rectitude, critical thinking,
                and scientific inquiry in young minds.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-[#0B192C] text-sm flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Our Mission</span>
                  </h4>
                  <p className="text-xs text-slate-600">
                    To produce highly qualified, competent, and morally sound teachers capable of inspiring academic and social transformation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-[#0B192C] text-sm flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-blue-600" />
                    <span>Our Vision</span>
                  </h4>
                  <p className="text-xs text-slate-600">
                    To remain the premier center of pedagogical excellence and research-driven teacher education in Sub-Saharan Africa.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="#academics"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>Read full institutional history and governing council</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right 6 Cols: Provost's Desk Message */}
            <div className="lg:col-span-6">
              <div className="bg-gradient-to-br from-slate-900 to-[#0B192C] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-black text-2xl shadow-inner">
                      PR
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Office of the Provost</h3>
                      <p className="text-xs text-amber-400 font-semibold">College of Education, Katsina-Ala</p>
                      <span className="text-[11px] text-slate-400">Benue State Government of Nigeria</span>
                    </div>
                  </div>

                  <blockquote className="italic text-slate-300 text-sm leading-relaxed border-l-2 border-amber-400 pl-4">
                    "Welcome to COEKA. Our commitment is rooted in cultivating educators who do not merely transmit
                    knowledge, but ignite curiosity and civic responsibility. In an increasingly automated world,
                    the teacher remains the catalyst of human civilization. We invite you to join our scholarly community."
                  </blockquote>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <p className="font-bold text-white">Prof. Scholastica Tyav</p>
                      <p className="text-[11px] text-slate-400">Provost & Chief Academic Executive</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('admissions')}
                      className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
                    >
                      Join COEKA
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ACADEMIC DIVISIONS GRID (The 4 Pillars of COEKA)                         */}
      {/* ========================================================================= */}
      <section id="academics" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <School className="w-3.5 h-3.5" />
              <span>Academic Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
              Four Distinct Academic Divisions
            </h2>
            <p className="text-slate-600 text-base">
              Providing holistic educational pathways from foundational nursery training to professional 
              university degrees, all underpinned by rigorous pedagogical standards.
            </p>

            {/* Division Filter Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                { id: 'ALL', label: 'All Divisions' },
                { id: 'NCE', label: 'NCE Programmes' },
                { id: 'DEGREE', label: 'Degree Programmes' },
                { id: 'SECONDARY', label: 'Secondary School' },
                { id: 'PRIMARY', label: 'Primary & Nursery' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDivisionFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeDivisionFilter === tab.id
                      ? 'bg-[#0B192C] text-amber-400 shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1: NCE Division */}
            {(activeDivisionFilter === 'ALL' || activeDivisionFilter === 'NCE') && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                      3-Year Track
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#0B192C] group-hover:text-blue-600 transition-colors">
                    Nigeria Certificate in Education (NCE)
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    The core pillar of COEKA. Accredited across 5 schools: School of Sciences, 
                    School of Arts & Social Sciences, School of Languages, School of Vocational Education, 
                    and Early Childhood Care & Primary Education.
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">Schools & Departments:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mathematics & Physics</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Computer Education</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>English & Literature</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Agricultural Science</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase font-semibold">Award</span>
                    <span className="text-xs font-bold text-[#0B192C]">NCE (NCCE Accredited)</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('admissions')}
                    className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800"
                  >
                    <span>View Requirements</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Card 2: Degree Programmes */}
            {(activeDivisionFilter === 'ALL' || activeDivisionFilter === 'DEGREE') && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                      Affiliated Degree
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#0B192C] group-hover:text-blue-600 transition-colors">
                    Undergraduate Degree Programmes
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    Offered in strategic affiliation with premier Nigerian Universities (e.g. University of Calabar and University of Jos). 
                    Earn a full university Bachelor of Education degree while studying in Katsina-Ala.
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">Available Bachelor Degrees:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>B.Sc(Ed) Biology</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>B.Ed Educational Admin</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>B.A(Ed) English</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>B.Sc(Ed) Chemistry</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase font-semibold">Award</span>
                    <span className="text-xs font-bold text-[#0B192C]">B.Ed / B.Sc(Ed) / B.A(Ed)</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('admissions')}
                    className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800"
                  >
                    <span>View Requirements</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Card 3: Demonstration Secondary School */}
            {(activeDivisionFilter === 'ALL' || activeDivisionFilter === 'SECONDARY') && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                      <School className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                      JSS 1 - SSS 3
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#0B192C] group-hover:text-blue-600 transition-colors">
                    Demonstration Secondary School
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    A model co-educational secondary school that acts as both a benchmark learning environment
                    for secondary students and a pedagogical laboratory for student teachers undertaking clinical practice.
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">Key Features:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WAEC & NECO Centre</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dedicated Science Labs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ICT Coding Club</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Moral Discipline Focus</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase font-semibold">Award</span>
                    <span className="text-xs font-bold text-[#0B192C]">Senior School Certificate (SSCE)</span>
                  </div>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800"
                  >
                    <span>Admissions Info</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Card 4: Demonstration Primary & Nursery School */}
            {(activeDivisionFilter === 'ALL' || activeDivisionFilter === 'PRIMARY') && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Early Years & Basic
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#0B192C] group-hover:text-blue-600 transition-colors">
                    Demonstration Primary & Nursery
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    Dedicated early childhood development center and model primary school providing foundational 
                    literacy, numeracy, and cognitive development in a child-centered, secure atmosphere.
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">Highlights:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Montessori Play Suites</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Early Phonics Training</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Secure Playground</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Experienced Teachers</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase font-semibold">Award</span>
                    <span className="text-xs font-bold text-[#0B192C]">Primary School Leaving Certificate</span>
                  </div>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800"
                  >
                    <span>Enrolment Inquiries</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE ADMISSIONS & ELIGIBILITY CHECKER                            */}
      {/* ========================================================================= */}
      <section id="admissions" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0B192C] to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left 6 Columns: Instructions & Guidelines */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  <span>2026/2027 Admissions Guide</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Instant Admission Eligibility Checker
                </h2>

                <p className="text-slate-300 text-sm leading-relaxed">
                  Interested in joining the College of Education, Katsina-Ala? Verify your admission eligibility 
                  in real-time against current NCCE and NUC cut-off requirements, then proceed directly to complete your application.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">NCE Programme Minimum Score: 100</p>
                      <p className="text-xs text-slate-400">Score 100+ in 2026 UTME and have 5 O'Level credits.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Degree Programme Minimum Score: 140</p>
                      <p className="text-xs text-slate-400">Score 140+ in 2026 UTME or possess relevant NCE/ND for Direct Entry.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Instant Portal Clearance</p>
                      <p className="text-xs text-slate-400">Application verification is processed in real-time on our Cloudflare edge.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('admissions')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow-lg transition-all"
                  >
                    <span>Open Official Application Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right 6 Columns: Interactive Calculator Form */}
              <div className="lg:col-span-6">
                <form
                  onSubmit={handleCheckEligibility}
                  className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-xl space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-black text-[#0B192C]">Pre-Admission Eligibility Calculator</h3>
                    <p className="text-xs text-slate-500">Calculate qualification status before applying</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Select Target Division
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCheckDivision('NCE');
                            setEligibilityResult(null);
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                            checkDivision === 'NCE'
                              ? 'bg-blue-50 border-blue-600 text-blue-700 font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          NCE Programme (3 Yrs)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckDivision('DEGREE');
                            setEligibilityResult(null);
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                            checkDivision === 'DEGREE'
                              ? 'bg-blue-50 border-blue-600 text-blue-700 font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Degree Programme (B.Ed)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Your 2026 UTME (JAMB) Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="400"
                        value={jambScore}
                        onChange={(e) => {
                          setJambScore(e.target.value === '' ? '' : Number(e.target.value));
                          setEligibilityResult(null);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="e.g. 165"
                        required
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Institutional cut-off: 100 for NCE, 140 for Degree.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Number of O'Level Credits (WAEC/NECO/NABTEB)
                      </label>
                      <select
                        value={oLevelCredits}
                        onChange={(e) => {
                          setOLevelCredits(Number(e.target.value));
                          setEligibilityResult(null);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value={6}>6 or more Credits</option>
                        <option value={5}>5 Credits (Standard requirement)</option>
                        <option value={4}>4 Credits</option>
                        <option value={3}>3 or fewer Credits</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#0B192C] hover:bg-slate-800 transition-all shadow flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4 text-amber-400" />
                      <span>Check My Eligibility Now</span>
                    </button>
                  </div>

                  {/* Result Feedback Banner */}
                  {eligibilityResult && (
                    <div
                      className={`p-4 rounded-xl text-xs space-y-2 border animate-fade-in ${
                        eligibilityResult.eligible
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black">
                        {eligibilityResult.eligible ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span>{eligibilityResult.eligible ? 'STATUS: ELIGIBLE' : 'STATUS: REVIEW REQUIRED'}</span>
                      </div>
                      <p>{eligibilityResult.message}</p>
                      
                      {eligibilityResult.eligible && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('admissions')}
                          className="mt-2 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <span>Proceed to Complete Application Form</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </form>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CAMPUS INFRASTRUCTURE & WORLD-CLASS FACILITIES                          */}
      {/* ========================================================================= */}
      <section id="facilities" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Campus Environment</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
              Modern Facilities for 21st Century Learning
            </h2>
            <p className="text-slate-600 text-base">
              A vibrant, fully-secured campus in Katsina-Ala featuring digitalized learning spaces, 
              robust science laboratories, and peaceful residential accommodation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Facility 1: E-Library */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#0B192C] mb-2">Modern E-Library & Resource Hub</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Over 15,000 physical texts combined with high-speed 24/7 internet workstations providing direct access 
                to global research journals (JSTOR, ScienceDirect, and EBSCOHost).
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <span>120 High-Speed Digital Workstations</span>
              </div>
            </div>

            {/* Facility 2: Science Laboratories */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#0B192C] mb-2">Advanced STEM & Science Labs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated laboratories for Physics, Chemistry, Biology, Integrated Science, and Agricultural Education 
                equipped to full NCCE and NUC benchmark standards.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                <span>Hands-on Experimental Training</span>
              </div>
            </div>

            {/* Facility 3: CBT & ICT Centre */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-4 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#0B192C] mb-2">500-Capacity ICT & CBT Centre</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full computer-based testing center hosting semester examinations, JAMB CBT assessments, 
                and specialized digital teacher capacity-building workshops.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-purple-600 flex items-center gap-1">
                <span>Dual Fiber Connectivity & Solar Power</span>
              </div>
            </div>

            {/* Facility 4: Hostels & Residences */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#0B192C] mb-2">Secure Student Hostels</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                On-campus residential halls (Sir Kashim Ibrahim, Queen Amina, and Benue Hall) with 24-hour security, 
                clean water borehole systems, and self-service portal bed allocation.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <span>Autonomous Portal Allocation</span>
              </div>
            </div>

            {/* Facility 5: Micro-Teaching Clinic */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#0B192C] mb-2">Micro-Teaching Clinics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Closed-circuit video recording suites where prospective educators practice lesson delivery, 
                classroom management, and pedagogical methodology with faculty critiques.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <span>Clinical Video Feedback Systems</span>
              </div>
            </div>

            {/* Facility 6: Sports & Athletics */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-4 group-hover:bg-[#0B192C] group-hover:text-amber-400 transition-colors">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#0B192C] mb-2">Sports & Recreation Complex</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-purpose athletic pitch, volleyball courts, basketball courts, and student union center 
                fostering balanced physical health, teamwork, and recreational sports.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-teal-600 flex items-center gap-1">
                <span>Active Student Life</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* CAMPUS NOTICE BOARD & OFFICIAL BULLETINS                                 */}
      {/* ========================================================================= */}
      <section id="notices" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>Verified Announcements</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
                Campus Notice Board
              </h2>
              <p className="text-slate-600 text-sm max-w-xl">
                Official institutional bulletins, academic calendars, and administrative notifications 
                issued directly from the Registry and Student Affairs Directorate.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#0B192C] bg-amber-400 hover:bg-amber-300 px-4 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <span>Access Student Notice Archive</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAnnouncement(item)}
                className="bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#0B192C] group-hover:text-blue-600 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">{item.author}</span>
                  <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>Read Bulletin</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* ANNOUNCEMENT DETAIL MODAL DIALOG                                         */}
      {/* ========================================================================= */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {selectedAnnouncement.category}
                </span>
                <span className="text-xs text-slate-500">• {selectedAnnouncement.date}</span>
              </div>
              <h3 className="text-2xl font-black text-[#0B192C] leading-snug">
                {selectedAnnouncement.title}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold block text-slate-900">Official Issuance:</span>
              <p>{selectedAnnouncement.author} • College of Education, Katsina-Ala</p>
            </div>

            <div className="text-sm text-slate-700 space-y-4 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
              {selectedAnnouncement.content}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Document Reference: COEKA/REG/PUB/2026</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnnouncement(null);
                    setActiveTab('login');
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300"
                >
                  Action in Portal
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTACT, LOCATION & VISITORS SECTION                                    */}
      {/* ========================================================================= */}
      <section id="contact" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left 6 Columns: Contact Details & Campus Map Info */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Reach COEKA</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
                Connect With the College
              </h2>

              <p className="text-slate-600 text-sm leading-relaxed">
                Whether you are a prospective student inquiring about JAMB cut-off requirements, 
                an alumnus requesting official transcripts, or a partner seeking institutional collaboration, 
                our administrative teams are on hand to assist.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B192C] text-sm">Permanent Campus Address</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      College of Education, P.M.B. 1008, Katsina-Ala, Benue State, Nigeria.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B192C] text-sm">Official Electronic Inquiries</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      General: <a href="mailto:info@coeka.edu.ng" className="text-blue-600 hover:underline">info@coeka.edu.ng</a> <br />
                      Admissions: <a href="mailto:admissions@coeka.edu.ng" className="text-blue-600 hover:underline">admissions@coeka.edu.ng</a> <br />
                      Registrar: <a href="mailto:registrar@coeka.edu.ng" className="text-blue-600 hover:underline">registrar@coeka.edu.ng</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B192C] text-sm">Liaison & Helpdesk Hotlines</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      +234 803 000 1976 • +234 812 456 7890 (Mondays – Fridays, 8am – 4pm WAT)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 6 Columns: Direct Feedback & Inquiry Form */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-5">
                <div>
                  <h3 className="text-xl font-black text-[#0B192C]">Send Us a Public Inquiry</h3>
                  <p className="text-xs text-slate-500">Official responses are typically provided within 24–48 hours.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Terseer Iorliam"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="yourname@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="0803XXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inquiry Category</label>
                    <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                      <option>Admissions & Cut-Off Guidelines</option>
                      <option>Degree Affiliation Inquiries</option>
                      <option>Transcripts & Academic Records</option>
                      <option>Demonstration School Enrolment</option>
                      <option>General Institutional Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message</label>
                    <textarea
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Write your message here..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => alert('Thank you for reaching out to COEKA. Your message has been received by the Registry.')}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow transition-all flex items-center justify-center gap-2"
                  >
                    <span>Submit Inquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* DEEP NAVY BLUE INSTITUTIONAL FOOTER (Authority & Legal Compliant)        */}
      {/* ========================================================================= */}
      <footer className="bg-[#0B192C] text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
            
            {/* Col 1 & 2: Institutional Identity & Motto */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-18 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 drop-shadow-md">
                  <img src="/coeka-logo.png" alt="COEKA Crest" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-base font-black text-white tracking-tight block">
                    COLLEGE OF EDUCATION
                  </span>
                  <span className="text-xs font-bold text-amber-400 tracking-wider uppercase block">
                    Katsina-Ala, Benue State
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Established in 1976 by the Benue State Government. Dedicated to fostering pedagogical mastery,
                scientific inquiry, and moral excellence across North-Central Nigeria and beyond.
              </p>

              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Institutional Motto:</p>
                <p className="italic text-amber-400">"Discipline and Dedication"</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Student & Staff Portal</span>
                </button>
              </div>
            </div>

            {/* Col 3: Academic Divisions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Divisions
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#academics" className="hover:text-white transition-colors">
                    NCE Academic Division
                  </a>
                </li>
                <li>
                  <a href="#academics" className="hover:text-white transition-colors">
                    Affiliated Degree Programmes
                  </a>
                </li>
                <li>
                  <a href="#academics" className="hover:text-white transition-colors">
                    Demonstration Secondary School
                  </a>
                </li>
                <li>
                  <a href="#academics" className="hover:text-white transition-colors">
                    Demonstration Primary & Nursery
                  </a>
                </li>
                <li>
                  <a href="#academics" className="hover:text-white transition-colors">
                    School of Early Childhood
                  </a>
                </li>
                <li>
                  <a href="#academics" className="hover:text-white transition-colors">
                    Vocational & Tech Education
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Quick Portals & Facilities */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Campus Gateways
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={() => setActiveTab('login')} className="hover:text-white transition-colors text-left">
                    Student SIMS Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('login')} className="hover:text-white transition-colors text-left">
                    Hostel Allocation Engine
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('admissions')} className="hover:text-white transition-colors text-left">
                    Admissions Application
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('login')} className="hover:text-white transition-colors text-left">
                    Staff & Lecturer Intranet
                  </button>
                </li>
                <li>
                  <a href="#facilities" className="hover:text-white transition-colors">
                    Digital E-Library Access
                  </a>
                </li>
                <li>
                  <button onClick={() => setActiveTab('login')} className="hover:text-white transition-colors text-left">
                    Administrative God-Mode
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 5: Accreditation & Regulatory */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Regulatory Oversight
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>NCCE Approved</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>NUC Degree Standards</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>TRCN Professional Reg.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Benue State Ministry of Ed.</span>
                </li>
                <li className="pt-2">
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className="text-xs font-semibold text-amber-400 hover:underline block"
                  >
                    NDPA 2023 Compliance
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Attribution & Edge Security Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-3">
              <span>© {new Date().getFullYear()} College of Education, Katsina-Ala. All rights reserved.</span>
            </div>
            
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Powered by COEKA Sovereign Edge Cloud (Cloudflare D1 & Pages)</span>
              </span>
              <span>•</span>
              <button onClick={() => setActiveTab('privacy')} className="hover:text-amber-400 transition-colors">
                Privacy Policy
              </button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
