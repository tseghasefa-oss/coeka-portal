import React, { useState } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  X,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface PasswordResetToolProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string; username: string } | null;
  onResetConfirm: (userId: string, customPassword?: string) => Promise<{ tempPassword: string; message: string }>;
}

export const PasswordResetTool: React.FC<PasswordResetToolProps> = ({
  isOpen,
  onClose,
  user,
  onResetConfirm,
}) => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ tempPassword: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleReset = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const passwordToUse = mode === 'custom' && customPassword.trim().length >= 6 ? customPassword.trim() : undefined;
      const res = await onResetConfirm(user.id, passwordToUse);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.tempPassword) {
      navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClose = () => {
    setResult(null);
    setCustomPassword('');
    setError(null);
    setMode('auto');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all ${
          isNavy
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Force Password Reset</h3>
              <p className="text-xs text-slate-400">Target User: {user.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!result ? (
          <div className="py-4 space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Administrative Credential Override:</span> This action will immediately invalidate the current password for <span className="font-semibold">{user.username}</span> and generate a replacement credential.
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Password Generation Strategy
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('auto')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'auto'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Generate
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'custom'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Custom Password
                </button>
              </div>
            </div>

            {mode === 'custom' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Password (min 6 characters)
                </label>
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="e.g. CoekaSecret@2026"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading || (mode === 'custom' && customPassword.trim().length < 6)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Resetting...' : 'Execute Password Reset'}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
              <span className="font-bold">Password Successfully Reset!</span> Provide the temporary credential below to the user securely.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Temporary Credential for {user.username}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.tempPassword}
                  className="flex-1 px-3.5 py-2.5 rounded-xl font-mono text-sm font-bold bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                  title="Copy password"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
