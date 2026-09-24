import React, { useState } from 'react';
import {
  Sliders,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  Save,
  ToggleLeft,
  ToggleRight,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Academic Calendar Dates
  const [sessionName, setSessionName] = useState('2026/2027');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2027-08-31');
  const [semesterName, setSemesterName] = useState('First Semester');

  // Institutional Settings
  const [institutionMotto, setInstitutionMotto] = useState('Knowledge, Character and Excellence');
  const [supportEmail, setSupportEmail] = useState('portal.support@coeka.edu.ng');
  const [maintenanceBanner, setMaintenanceBanner] = useState('Welcome to the 2026/2027 Academic Session. Portal is live.');
  const [maxCreditUnits, setMaxCreditUnits] = useState(24);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleModule = (key: string) => {
    setModules(
      modules.map((m) => {
        if (m.key === key) {
          const nextState = !m.isOpen;
          showToast(`${m.name} is now ${nextState ? 'OPEN (Online)' : 'CLOSED (Locked)'}`);
          return { ...m, isOpen: nextState };
        }
        return m;
      })
    );
  };

  const handleSaveCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Academic Calendar updated: ${sessionName} (${startDate} to ${endDate}).`);
  };

  const handleSaveInstitutional = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Institutional configurations successfully saved.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-300 border border-amber-400/40 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className={`w-6 h-6 ${isNavy ? 'text-blue-600' : 'text-emerald-700'}`} />
          Institutional System Configuration & Operational Controls
        </h2>
        <p className="text-xs text-slate-500">
          Control portal access windows, adjust academic calendar dates, and manage institutional parameters.
        </p>
      </div>

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Portal Operational Toggles */}
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

        {/* 2. Academic Calendar Settings */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Academic Calendar & Session Timelines
            </h3>
            <p className="text-xs text-slate-500">
              Defines the official boundaries for 2026/2027 fee generation and registrations.
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

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-2.5 text-xs font-bold rounded-xl text-white shadow flex items-center justify-center gap-2 ${
                  isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Academic Calendar</span>
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
                onClick={() => setUiPreferences({ theme: 'emerald' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  !isNavy ? 'bg-emerald-800 text-amber-300 shadow' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Emerald
              </button>
              <button
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
