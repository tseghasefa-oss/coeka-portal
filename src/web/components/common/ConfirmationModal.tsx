import React, { useEffect } from 'react';
import { AlertTriangle, HelpCircle, Loader2, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 pb-4 flex items-start justify-between gap-4 ${isDangerous ? 'bg-red-50/60' : 'bg-slate-50/80'}`}>
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl flex items-center justify-center ${
                isDangerous ? 'bg-red-100 text-red-600' : isNavy ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isDangerous ? (
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 id="confirmation-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                {title}
              </h3>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDangerous ? 'text-red-600' : 'text-slate-500'}`}>
                {isDangerous ? 'Destructive Action Confirmation' : 'Institutional Action Confirmation'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-4 text-sm text-slate-600 leading-relaxed font-medium">
          {message}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/80 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : isNavy
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
