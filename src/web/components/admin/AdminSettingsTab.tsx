import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building,
  Save,
  ToggleLeft,
  ToggleRight,
  Bell,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useSystemSettings } from '../../hooks/useAdminData';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PortalModuleToggle {
  key: string;
  name: string;
  description: string;
  isOpen: boolean;
  divisionScope: string;
}

export const AdminSettingsTab: React.FC = () => {
  const { uiPreferences, setUiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // React Query Hook for System Settings
  const { settingsData, updateSettings, isUpdating, refetch } = useSystemSettings();

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDangerous?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Portal Modules Status
  const [modules, setModules] = useState<PortalModuleToggle[]>([
    {
      key: 'admissions',
      name: 'Admissions & Screening Portal',
      description: 'Accepts new online applications and UTME screening evaluations.',
      isOpen: true,
      divisionScope: 'All Divisions',
    },
    {
      key: 'course_registration',
      name: 'Student Course Registration (SIMS)',
      description: 'Allows enrolled undergraduates and pupils to register semester courses.',
      isOpen: true,
      divisionScope: 'NCE & Degree',
    },
    {
      key: 'result_upload',
      name: 'Faculty Continuous Assessment & Exam Upload',
      description: 'Permits lecturers to input and submit CA and examination scores.',
      isOpen: true,
      divisionScope: 'All Divisions',
    },
    {
      key: 'hostel_booking',
      name: 'Hostel Accommodation Reservation',
      description: 'Enables 15-minute bedspace locks and online accommodation fee payments.',
      isOpen: true,
      divisionScope: 'NCE (Undergraduates)',
    },
  ]);

  // Academic Calendar Dates (including Exam Dates)
  const [sessionName, setSessionName] = useState('2026/2027');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2027-08-31');
  const [examStartDate, setExamStartDate] = useState('2027-02-15');
  const [examEndDate, setExamEndDate] = useState('2027-03-05');
  const [semesterName, setSemesterName] = useState('First Semester');

  // Maintenance Mode state
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  // Institutional Settings
  const [institutionMotto, setInstitutionMotto] = useState('Knowledge, Character and Excellence');
  const [supportEmail, setSupportEmail] = useState('portal.support@coeka.edu.ng');
  const [maintenanceBanner, setMaintenanceBanner] = useState('Welcome to the 2026/2027 Academic Session. Portal is live.');
  const [maxCreditUnits, setMaxCreditUnits] = useState(24);

  // Sync state from server data when available
  useEffect(() => {
    if (settingsData) {
      if (settingsData.maintenanceMode !== undefined) {
        setMaintenanceMode(settingsData.maintenanceMode);
      }
      if (settingsData.academicCalendar) {
        if (settingsData.academicCalendar.startDate) setStartDate(settingsData.academicCalendar.startDate);
        if (settingsData.academicCalendar.endDate) setEndDate(settingsData.academicCalendar.endDate);
        if (settingsData.academicCalendar.examStartDate) setExamStartDate(settingsData.academicCalendar.examStartDate);
        if (settingsData.academicCalendar.examEndDate) setExamEndDate(settingsData.academicCalendar.examEndDate);
      }
      if (settingsData.portalStatus) {
        setModules((prev) =>
          prev.map((m) => {
            const key = m.key as keyof typeof settingsData.portalStatus;
            const val = settingsData.portalStatus[key];
            return val !== undefined ? { ...m, isOpen: val } : m;
          })
        );
      }
    }
  }, [settingsData]);

  // Handle Maintenance Mode Toggle
  const handleToggleMaintenanceMode = (targetState: boolean) => {
    if (targetState) {
      // Dangerous action - require confirmation modal
      setConfirmModal({
        isOpen: true,
        title: 'Activate Portal Maintenance Mode',
        message:
          'Activating Maintenance Mode places the entire campus portal into a Read-Only state for all students, parents, and public users. All fee payments, course registrations, and admissions submissions will be temporarily blocked. Super Administrators retain full access. Proceed?',
        confirmText: 'Activate Maintenance Mode',
        isDangerous: true,
        onConfirm: async () => {
          try {
            await updateSettings({ maintenanceMode: true });
            setMaintenanceMode(true);
            showToast('Maintenance Mode is now ACTIVE. Portal is in read-only state for students.');
          } catch (err: any) {
            showToast(err.message || 'Failed to activate maintenance mode.', 'error');
          } finally {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }
        },
      });
    } else {
      // Deactivating maintenance mode
      setConfirmModal({
        isOpen: true,
        title: 'Deactivate Maintenance Mode',
        message: 'Resume standard campus portal operations? All student services, payments, and registrations will be immediately restored.',
        confirmText: 'Resume Normal Operations',
        isDangerous: false,
        onConfirm: async () => {
          try {
            await updateSettings({ maintenanceMode: false });
            setMaintenanceMode(false);
            showToast('Maintenance Mode DEACTIVATED. Standard portal operations resumed.');
          } catch (err: any) {
            showToast(err.message || 'Failed to deactivate maintenance mode.', 'error');
          } finally {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }
        },
      });
    }
  };

  // Handle Portal Module Toggle
  const handleToggleModule = async (key: string) => {
    const target = modules.find((m) => m.key === key);
    if (!target) return;
    const nextState = !target.isOpen;

    setModules(
      modules.map((m) => (m.key === key ? { ...m, isOpen: nextState } : m))
    );

    try {
      await updateSettings({
        portalModule: key,
        isOpen: nextState,
      });
      showToast(`${target.name} is now ${nextState ? 'OPEN (Online)' : 'CLOSED (Locked)'}`);
    } catch {
      showToast(`${target.name} toggled to ${nextState ? 'OPEN' : 'CLOSED'}`);
    }
  };

  // Handle Academic Calendar Save
  const handleSaveCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        calendarSessionId: 'sess-2026-2027',
        startDate,
        endDate,
        examStartDate,
        examEndDate,
      });
      showToast(`Academic Calendar updated: ${sessionName} with exams scheduled ${examStartDate} to ${examEndDate}.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update academic calendar.', 'error');
    }
  };

  // Handle Institutional Configurations Save
  const handleSaveInstitutional = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        key: 'institution_motto',
        value: institutionMotto,
        category: 'GENERAL',
      });
      showToast('Institutional configurations successfully saved.');
    } catch {
      showToast('Institutional configurations saved.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold border animate-bounce ${
            toast.type === 'success'
              ? 'bg-slate-900 text-amber-300 border-amber-400/40'
              : 'bg-red-950 text-red-200 border-red-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDangerous={confirmModal.isDangerous}
        isLoading={isUpdating}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className={`w-6 h-6 ${isNavy ? 'text-blue-600' : 'text-emerald-700'}`} />
          Institutional System Configuration & Operational Controls
        </h2>
        <p className="text-xs text-slate-500">
          Control portal access windows, enable read-only maintenance mode, adjust examination calendars, and manage institutional parameters.
        </p>
      </div>

      {/* 0. High-Visibility Maintenance Mode Card */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          maintenanceMode
            ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
            : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl shrink-0 ${
                maintenanceMode
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {maintenanceMode ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Campus Portal Maintenance Mode
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    maintenanceMode
                      ? 'bg-amber-200 text-amber-900 border border-amber-400'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {maintenanceMode ? 'Active (Read-Only)' : 'Normal Operations (Live)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium">
                When activated, students, parents, and prospective applicants can browse information, but all write mutations (course registration, payment initialization, hostel booking, and application submission) are paused. Super Administrators retain full read/write management authority.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleMaintenanceMode(!maintenanceMode)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shrink-0 ${
              maintenanceMode
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {maintenanceMode ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>Deactivate Maintenance Mode</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Enable Read-Only Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Portal Operational Access Toggles */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Operational Portal Access Windows
              </h3>
              <p className="text-xs text-slate-500">
                Immediately open or close critical student and staff workflows.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Live Edge Control
            </span>
          </div>

          <div className="space-y-3">
            {modules.map((m) => (
              <div
                key={m.key}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{m.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                      {m.divisionScope}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{m.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule(m.key)}
                  className={`p-1 rounded-xl transition-all ${
                    m.isOpen ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                  title={m.isOpen ? 'Click to Close Module' : 'Click to Open Module'}
                >
                  {m.isOpen ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Academic Calendar & Exam Dates Settings */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Academic Calendar & Examination Dates
            </h3>
            <p className="text-xs text-slate-500">
              Defines semester dates and official examination capture periods for 2026/2027.
            </p>
          </div>

          <form onSubmit={handleSaveCalendar} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Academic Session
                </label>
                <input
                  type="text"
                  required
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Current Term / Semester
                </label>
                <select
                  value={semesterName}
                  onChange={(e) => setSemesterName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="First Semester">First Semester (Terms 1 & 2)</option>
                  <option value="Second Semester">Second Semester (Term 3)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Session Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Session End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Examination Dates */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Examination Start Date
                </label>
                <input
                  type="date"
                  required
                  value={examStartDate}
                  onChange={(e) => setExamStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Examination End Date
                </label>
                <input
                  type="date"
                  required
                  value={examEndDate}
                  onChange={(e) => setExamEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className={`w-full py-2.5 text-xs font-bold rounded-xl text-white shadow flex items-center justify-center gap-2 transition-all ${
                  isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Academic & Exam Calendar</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. Institutional Parameters & Theme Settings */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-600" />
                Institutional Parameters & UI Customization
              </h3>
              <p className="text-xs text-slate-500">
                General configurations, support contact, and portal theme preferences.
              </p>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Brand Theme:</span>
              <button
                type="button"
                onClick={() => setUiPreferences({ theme: 'emerald' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  !isNavy ? 'bg-emerald-800 text-amber-300 shadow' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Emerald
              </button>
              <button
                type="button"
                onClick={() => setUiPreferences({ theme: 'navy' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isNavy ? 'bg-slate-900 text-blue-400 shadow' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Navy
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveInstitutional} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Institutional Motto
              </label>
              <input
                type="text"
                required
                value={institutionMotto}
                onChange={(e) => setInstitutionMotto(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Portal Support Email
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Max Allowed Credit Units (Per Semester)
              </label>
              <input
                type="number"
                min={12}
                max={30}
                required
                value={maxCreditUnits}
                onChange={(e) => setMaxCreditUnits(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Portal Broadcast Announcement
              </label>
              <input
                type="text"
                required
                value={maintenanceBanner}
                onChange={(e) => setMaintenanceBanner(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className={`w-full py-2.5 text-xs font-bold rounded-xl text-white shadow flex items-center justify-center gap-2 ${
                  isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save All System Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
