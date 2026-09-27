import React, { useState, useEffect } from 'react';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Save,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Image,
  GraduationCap,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useInstitutionalSettings, InstitutionalInfo } from '../../hooks/useAdminData';

export const InstitutionalSettings: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const { institutionalInfo, isLoading, refetch, updateInstitutionalInfo, isUpdating } = useInstitutionalSettings();

  const [formData, setFormData] = useState<InstitutionalInfo>({
    name: 'College of Education, Katsina-Ala',
    motto: 'Knowledge, Character and Excellence',
    logoUrl: '/images/coeka-logo.png',
    email: 'registrar@coeka.edu.ng',
    phone: '+234 803 123 4567',
    address: 'P.M.B. 1008, Katsina-Ala, Benue State, Nigeria',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (institutionalInfo) {
      setFormData(institutionalInfo);
    }
  }, [institutionalInfo]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateInstitutionalInfo(formData);
      showToast('Institutional profile and contact settings updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update institutional settings', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-900 border border-rose-700 text-white'
              : 'bg-emerald-900 border border-emerald-700 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div
        className={`bento-card p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm ${
          isNavy
            ? 'bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 border-slate-800'
            : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border-emerald-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Statutory Profile & Brand Configuration
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Institutional Identity & Contact Controller</h2>
          <p className="text-xs text-slate-300">
            Configure official statutory institution name, crest/logo, official motto, and administrative contact channels rendered across student invoices, receipts, and transcripts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <form onSubmit={handleSave} className="lg:col-span-2 bento-card p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-500" />
            Statutory Institution Profile
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Official Institution Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Statutory Motto
            </label>
            <input
              type="text"
              value={formData.motto}
              onChange={(e) => setFormData((prev) => ({ ...prev, motto: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Official Institutional Crest / Logo URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.logoUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Administrative Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Campus Helpline / Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Statutory Campus Physical Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isUpdating ? 'Saving Profile...' : 'Save Institutional Profile'}
            </button>
          </div>
        </form>

        {/* Live Identity Preview Card */}
        <div className="bento-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Official Identity Preview
            </span>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 rounded-2xl bg-emerald-950 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-md mb-3 overflow-hidden">
                <GraduationCap className="w-10 h-10" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white max-w-xs">
                {formData.name}
              </h4>
              <p className="text-xs text-amber-600 dark:text-amber-400 italic mt-1 font-serif">
                "{formData.motto}"
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 space-y-1">
                <p>{formData.address}</p>
                <p className="font-mono">{formData.email}</p>
                <p className="font-mono">{formData.phone}</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs">
            <span className="font-bold">Global Template Synchronization:</span> Edits made here immediately propagate to electronic transcripts, bursary official receipts, admission letters, and public portal headers.
          </div>
        </div>
      </div>
    </div>
  );
};
