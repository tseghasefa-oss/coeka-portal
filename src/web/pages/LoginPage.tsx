import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  School,
  KeyRound,
  ExternalLink,
  X,
  Mail,
  Building2,
  Check,
  BookOpen,
  Award,
  ChevronRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../stores/useAppStore';

export function LoginPage() {
  const { login, isSubmitting, loginError, setLoginError } = useAuth();
  const { setActiveTab } = useAppStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick Persona notification badge
  const [personaBadge, setPersonaBadge] = useState<string | null>(null);

  // Credential Recovery Modal State
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryRole, setRecoveryRole] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!username.trim()) {
      setValidationError('Please enter your Matric Number, Staff ID, or Email Address.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your account password.');
      return;
    }

    await login(username.trim(), password);
  };

  const handleSelectDemoPersona = (demoUser: string, demoPass: string, label: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setValidationError(null);
    setLoginError(null);
    setPersonaBadge(`Autofilled ${label} credentials`);
    setTimeout(() => setPersonaBadge(null), 3500);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) return;
    setRecoverySuccess(true);
  };

  const resetRecovery = () => {
    setIsRecoveryOpen(false);
    setRecoveryIdentifier('');
    setRecoverySuccess(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden">
      {/* ========================================================================= */}
      {/* LEFT SIDE (60% Desktop): Immersive Sovereign Brand & Institutional Story */}
      {/* ========================================================================= */}
      <div className="lg:w-[58%] xl:w-[60%] bg-slate-950 text-white relative flex flex-col justify-between p-8 sm:p-12 xl:p-16 overflow-hidden">
        {/* Decorative Ambient Background & Vector Grid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle Geometric SVG Grid Pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern id="coeka-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#coeka-grid)" />
          </svg>

          {/* Glowing Radial Orbs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/25 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-emerald-950/40 rounded-full blur-3xl" />
        </div>

        {/* Top Header: Institutional Identity & Return to Website */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 border border-amber-300/60 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <span className="block text-xs font-black tracking-widest text-amber-400 uppercase">
                COEKA
              </span>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                College of Education, Katsina-Ala
              </h1>
              <span className="text-[11px] text-slate-400 block">
                Benue State, Nigeria • Established 1976
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('website')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white text-xs font-medium transition-all hover:scale-105"
            aria-label="Return to public campus website"
          >
            <span>Public Campus</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>

        {/* Center Section: Core Institutional Statement & Pillars */}
        <div className="relative z-10 my-10 lg:my-14 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Enterprise Digital Campus Gateway</span>
          </div>

          <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Empowering the Next Generation of{' '}
            <span className="bg-gradient-to-r from-amber-300 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
              Educators & Leaders
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Welcome to the unified digital campus operating system for the College of Education, Katsina-Ala.
            Access real-time academic records, automated examination broadsheets, biometric admissions,
            and decentralized fee reconciliation across all institutional tiers.
          </p>

          {/* Institutional Highlights Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6 border-t border-slate-800/80">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-emerald-900/50 text-emerald-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">54+ Academic Programs</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  NCCE Accredited NCE & University Degree Affiliations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-amber-900/50 text-amber-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Verified Broadsheets</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cryptographic GPA calculations and Senate-ready results
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-blue-900/50 text-blue-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Hostel Concurrency Safe</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  15-minute atomic reservation locks preventing double-booking
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-teal-900/50 text-teal-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Web Crypto Audit Vault</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  HMAC-SHA256 hardware tamper-detection on every transaction
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Security & Edge Latency Telemetry */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400">Cloudflare D1 & KV Edge: Operational</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} COEKA • Benue State Government of Nigeria</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE (40% Desktop): Clean Enterprise Login Card & Authentication   */}
      {/* ========================================================================= */}
      <div className="lg:w-[42%] xl:w-[40%] flex flex-col justify-center items-center p-4 sm:p-8 lg:p-10 xl:p-12 bg-slate-50 min-h-screen lg:min-h-0 relative">
        {/* Mobile Header (Visible on screens < lg) */}
        <div className="lg:hidden w-full max-w-md mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-900">COEKA PORTAL</span>
              <span className="text-[10px] text-slate-500">College of Education, Katsina-Ala</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('website')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Floating Persona Autofill Toast */}
        {personaBadge && (
          <div className="w-full max-w-md mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{personaBadge}</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Ready</span>
          </div>
        )}

        {/* The Card Container */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/90 p-6 sm:p-8 animate-fade-in">
          {/* Card Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                <Shield className="w-3 h-3 text-emerald-600" />
                <span>Institutional Sign-In</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('website')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>← Public Website</span>
              </button>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign In to Your Account
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Enter your institutional credentials to access your academic or staff dashboard.
            </p>
          </div>

          {/* Error Banner */}
          {(validationError || loginError) && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Authentication Failed</p>
                <p className="mt-0.5 text-rose-700">{validationError || loginError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setLoginError(null);
                }}
                className="text-rose-400 hover:text-rose-600"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Identifier Field */}
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Matric Number / Staff ID / Email
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (validationError || loginError) {
                      setValidationError(null);
                      setLoginError(null);
                    }
                  }}
                  placeholder="e.g. std_iorliam or founder_tsegha"
                  aria-label="Matriculation Number, Staff ID, or Email Address"
                  aria-required="true"
                  className="block w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationError || loginError) {
                      setValidationError(null);
                      setLoginError(null);
                    }
                  }}
                  placeholder="Enter your account password"
                  aria-label="Account Password"
                  aria-required="true"
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 select-none">
                  Keep me signed in on this device
                </span>
              </label>
            </div>

            {/* Submit Button with Hover Lift and Loading State */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 hover:from-emerald-600 hover:to-teal-800 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Personas (1-Click Evaluation Bar) */}
          <div className="mt-6 pt-5 border-t border-slate-200/90">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Personas
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                1-Click Autofill
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { label: 'Student', user: 'std_iorliam', role: 'STUDENT' },
                { label: 'Super Admin', user: 'founder_tsegha', role: 'SUPER_ADMIN' },
                { label: 'Student Affairs', user: 'student_affairs', role: 'WARDEN' },
                { label: 'Registrar', user: 'registrar_coeka', role: 'REGISTRAR' },
                { label: 'Exam Officer', user: 'exam_officer1', role: 'EXAM_OFFICER' },
                { label: 'Lecturer', user: 'lecturer1', role: 'LECTURER' },
                { label: 'Bursar', user: 'bursar_ikyur', role: 'BURSAR' },
                { label: 'Dean', user: 'dean_tyav', role: 'DEAN' },
                { label: 'Librarian', user: 'librarian_wende', role: 'LIBRARIAN' },
                { label: 'Parent', user: 'parent_iorliam', role: 'PARENT' },
              ].map((persona) => (
                <button
                  key={persona.user}
                  type="button"
                  onClick={() => handleSelectDemoPersona(persona.user, 'Password123!', persona.label)}
                  className="flex flex-col text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition-all group"
                >
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                    {persona.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono truncate">
                    {persona.user}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-2">
              Default Seed Password: <code className="text-emerald-700 font-mono font-semibold">Password123!</code>
            </p>
          </div>

          {/* Public Website Return Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('website')}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1 font-medium"
            >
              <span>Return to Public College Website</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* ICT Support Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 max-w-sm space-y-1.5">
          <div>
            <span>Need help logging in? Contact the Directorate of ICT at </span>
            <a
              href="mailto:ict@coekatsinaala.edu.ng"
              className="text-emerald-700 hover:underline font-medium"
            >
              ict@coekatsinaala.edu.ng
            </a>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className="text-slate-500 hover:text-emerald-700 underline transition cursor-pointer"
            >
              Institutional Privacy Policy & NDPA 2023 Compliance
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CREDENTIAL RECOVERY MODAL                                                */}
      {/* ========================================================================= */}
      {isRecoveryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={resetRecovery}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              aria-label="Close recovery dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 id="recovery-modal-title" className="text-lg font-bold text-slate-900">
                  Credential Recovery & Reset
                </h3>
                <p className="text-xs text-slate-500">
                  COEKA Directorate of Information & Communication Technology
                </p>
              </div>
            </div>

            {!recoverySuccess ? (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setRecoveryRole('STUDENT')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                      recoveryRole === 'STUDENT'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Student Recovery
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryRole('STAFF')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                      recoveryRole === 'STAFF'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Staff Recovery
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="recovery-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    {recoveryRole === 'STUDENT'
                      ? 'Matriculation Number / JAMB Reg No'
                      : 'Staff File Number / Institutional Email'}
                  </label>
                  <input
                    id="recovery-input"
                    type="text"
                    required
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder={
                      recoveryRole === 'STUDENT'
                        ? 'e.g. std_iorliam or COEKA/2026/NCE/084'
                        : 'e.g. founder_tsegha or lecturer1'
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    A secure password reset link or SMS OTP will be dispatched to your registered phone and email.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Physical Support Desk</p>
                    <p className="mt-0.5 text-[11px]">
                      Visit ICT Directorate, Administrative Complex Room 104 (Monday - Friday, 8:00 AM - 4:00 PM) with your Student ID or Staff ID Card for instant in-person credential re-issuance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetRecovery}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-md"
                  >
                    Dispatch Reset Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Recovery Instructions Dispatched</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    If an active record exists for <span className="font-mono font-bold text-slate-800">{recoveryIdentifier}</span>, a secure one-time reset code has been sent to the primary mobile number and secondary email on file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetRecovery}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
