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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppStore, SchoolDivision } from '../stores/useAppStore';

export function LoginPage() {
  const { login, isSubmitting, loginError, setLoginError } = useAuth();
  const { setActiveTab } = useAppStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const handleSelectDemoPersona = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setValidationError(null);
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-700/30 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Institutional Crest & Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/20 border-2 border-amber-300 mb-4 transform hover:scale-105 transition-all">
            <GraduationCap className="w-12 h-12 text-emerald-950" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            COEKA PORTAL
          </h2>
          <p className="mt-2 text-sm text-emerald-300 font-medium">
            College of Education, Katsina-Ala • Benue State, Nigeria
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Secure Edge Authentication System</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700 relative">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Error Notifications */}
            {(validationError || loginError) && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300 text-sm flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-200">Authentication Failed</p>
                  <p className="mt-0.5 text-xs text-rose-300/90">{validationError || loginError}</p>
                </div>
              </div>
            )}

            {/* Identifier Field (Matric / Staff ID / Email) */}
            <div>
              <label htmlFor="identifier" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Matriculation Number / Staff ID / Email
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. std_iorliam or COEKA/2026/NCE/084"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password Reset Instructions: Please contact the Directorate of ICT at ict@coekatsinaala.edu.ng or use the Admin Password Reset feature.')}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  className="block w-full pl-11 pr-11 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-400">
                  Keep me signed in on this device
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Personas (Single-Click Credentials) */}
          <div className="mt-8 border-t border-slate-700/80 pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Quick Test Personas
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800">
                1-Click Autofill
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Super Admin', user: 'founder_tsegha', role: 'SUPER_ADMIN', desc: 'Prof. S. L. Tsegha' },
                { label: 'Student', user: 'std_iorliam', role: 'STUDENT', desc: 'Moses Iorliam' },
                { label: 'Lecturer', user: 'lecturer1', role: 'LECTURER', desc: 'Dr. Adeyemi' },
                { label: 'Bursar', user: 'bursar_ikyur', role: 'BURSAR', desc: 'Mr. Ikyur' },
                { label: 'Dean', user: 'dean_tyav', role: 'DEAN', desc: 'Dr. Tyav' },
                { label: 'Parent', user: 'parent_iorliam', role: 'PARENT', desc: 'Elder Iorliam' },
              ].map((persona) => (
                <button
                  key={persona.user}
                  type="button"
                  onClick={() => handleSelectDemoPersona(persona.user, 'Password123!')}
                  className="flex flex-col text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500/60 transition-all group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300">
                      {persona.label}
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                      {persona.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 truncate mt-0.5">
                    {persona.user}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              Default Seed Password: <code className="text-amber-400 font-mono">Password123!</code>
            </p>
          </div>

          {/* Return to Public Website */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('website')}
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>Back to Public College Website</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Institutional Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} College of Education, Katsina-Ala. All rights reserved.</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Engineered for high concurrency with Cloudflare D1 Relational Storage & Edge KV Sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
