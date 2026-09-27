import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  RefreshCw,
  Power,
  Flame,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useSystemSettings, useInstitutionalSettings } from '../../hooks/useAdminData';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface ModuleControl {
  key: string;
  name: string;
  description: string;
  isOpen: boolean;
  divisionScope: string;
}

export const PortalToggle: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const { settingsData, updateSettings, isUpdating, refetch } = useSystemSettings();
  const { toggleMaintenance, isTogglingMaintenance } = useInstitutionalSettings();

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [modules, setModules] = useState<ModuleControl[]>([
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
      divisionScope: 'NCE Undergraduates',
    },
  ]);

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

  useEffect(() => {
    if (settingsData) {
      if (settingsData.maintenanceMode !== undefined) {
        setMaintenanceMode(settingsData.maintenanceMode);
      }
      if (settingsData.portalStatus) {
        setModules([
          {
            key: 'admissions',
            name: 'Admissions & Screening Portal',
            description: 'Accepts new online applications and UTME screening evaluations.',
            isOpen: Boolean(settingsData.portalStatus.admissions),
            divisionScope: 'All Divisions',
          },
          {
            key: 'course_registration',
            name: 'Student Course Registration (SIMS)',
            description: 'Allows enrolled undergraduates and pupils to register semester courses.',
            isOpen: Boolean(settingsData.portalStatus.courseRegistration),
            divisionScope: 'NCE & Degree',
          },
          {
            key: 'result_upload',
            name: 'Faculty Continuous Assessment & Exam Upload',
            description: 'Permits lecturers to input and submit CA and examination scores.',
            isOpen: Boolean(settingsData.portalStatus.resultUpload),
            divisionScope: 'All Divisions',
          },
          {
            key: 'hostel_booking',
            name: 'Hostel Accommodation Reservation',
            description: 'Enables 15-minute bedspace locks and online accommodation fee payments.',
            isOpen: Boolean(settingsData.portalStatus.hostelBooking ?? true),
            divisionScope: 'NCE Undergraduates',
          },
        ]);
      }
    }
  }, [settingsData]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMaintenanceToggleClick = () => {
    const nextState = !maintenanceMode;

    setConfirmModal({
      isOpen: true,
      title: nextState ? 'CRITICAL: ENABLE GLOBAL MAINTENANCE MODE' : 'RESTORE PORTAL ACCESS',
      message: nextState
        ? 'DANGER: Engaging the Global Kill-Switch will instantly put the entire portal into Maintenance Mode. All students, parents, and unauthorized personnel will be immediately blocked with HTTP 503. Only Super Administrators will retain backend access.'
        : 'Are you sure you want to deactivate Maintenance Mode and restore global public access for all campus students and staff?',
      confirmText: nextState ? 'ENGAGE KILL-SWITCH' : 'Restore Live Access',
      isDangerous: nextState,
      onConfirm: async () => {
        try {
          await toggleMaintenance(nextState);
          setMaintenanceMode(nextState);
          showToast(
            nextState
              ? 'Portal Kill-Switch Engaged: System is now locked in Maintenance Mode.'
              : 'Maintenance Mode deactivated: Portal is now live for all users.'
          );
        } catch (err: any) {
          showToast(err.message || 'Failed to toggle maintenance mode', 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleModuleToggleClick = (module: ModuleControl) => {
    const nextState = !module.isOpen;
    const action = nextState ? 'Open' : 'Close';

    setConfirmModal({
      isOpen: true,
      title: `${action} ${module.name}`,
      message: `Are you sure you want to ${action.toLowerCase()} the ${module.name}? ${
        !nextState
          ? 'Affected users will receive a notice that the window is currently closed.'
          : 'Eligible users will be able to perform transactions immediately.'
      }`,
      confirmText: `${action} Subsystem`,
      isDangerous: !nextState,
      onConfirm: async () => {
        try {
          await updateSettings({
            portalModule: module.key,
            isOpen: nextState,
          });
          setModules((prev) =>
            prev.map((m) => (m.key === module.key ? { ...m, isOpen: nextState } : m))
          );
          showToast(`${module.name} successfully ${action.toLowerCase()}ed.`);
        } catch (err: any) {
          showToast(err.message || 'Failed to update subsystem status', 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDangerous={confirmModal.isDangerous}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

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
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              System Control & Catastrophic Switches
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Portal Operational Toggles & Kill-Switch</h2>
          <p className="text-xs text-slate-300">
            Control live portal traffic with precision. Put the entire system into Maintenance Mode or open/close individual subsystems on demand.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating || isTogglingMaintenance ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* THE GLOBAL KILL-SWITCH PANEL */}
      <div
        className={`bento-card p-6 border-2 transition-all ${
          maintenanceMode
            ? 'bg-rose-500/10 border-rose-500 shadow-xl'
            : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                maintenanceMode
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Power className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    maintenanceMode
                      ? 'bg-rose-500 text-white border-rose-600'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300'
                  }`}
                >
                  {maintenanceMode ? 'PORTAL LOCKED • MAINTENANCE ACTIVE' : 'LIVE TRAFFIC OPERATIONAL'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                Global Portal Maintenance Mode (Kill-Switch)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mt-0.5">
                When engaged, all student, parent, and general visitor traffic is blocked immediately with a statutory maintenance banner. Only Super Administrators can authenticate to perform emergency maintenance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMaintenanceToggleClick}
            disabled={isTogglingMaintenance}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2.5 cursor-pointer disabled:opacity-50 shrink-0 ${
              maintenanceMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
            }`}
          >
            {maintenanceMode ? (
              <>
                <Unlock className="w-4 h-4" />
                Deactivate Kill-Switch
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 text-amber-300" />
                Engage Kill-Switch
              </>
            )}
          </button>
        </div>
      </div>

      {/* INDIVIDUAL SUBSYSTEM CONTROLLERS */}
      <div className="bento-card p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          Subsystem Traffic Gates & Operational Windows
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((m) => (
            <div
              key={m.key}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                m.isOpen
                  ? 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                  : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {m.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {m.divisionScope}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {m.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleModuleToggleClick(m)}
                  disabled={isUpdating}
                  className={`p-1 rounded-xl transition-all cursor-pointer ${
                    m.isOpen ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={m.isOpen ? 'Close Subsystem' : 'Open Subsystem'}
                >
                  {m.isOpen ? (
                    <ToggleRight className="w-9 h-9" />
                  ) : (
                    <ToggleLeft className="w-9 h-9" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <span className="text-slate-400">Current Status:</span>
                <span
                  className={`font-bold inline-flex items-center gap-1 ${
                    m.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {m.isOpen ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {m.isOpen ? 'Actively Open' : 'Access Closed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
