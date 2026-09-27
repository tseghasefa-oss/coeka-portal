import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Lock,
  UserCheck,
  UserX,
  KeyRound,
  GraduationCap,
  Briefcase,
  Layers,
  ChevronDown,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useUsers } from '../../hooks/useAdminData';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { PasswordResetTool } from './PasswordResetTool';

const ROLES_LIST = [
  { value: 'SUPER_ADMIN', label: 'Super Administrator', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'ADMIN', label: 'Administrator', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'REGISTRAR', label: 'Registrar', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
  { value: 'EXAM_OFFICER', label: 'Examination Officer', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'DEAN', label: 'Dean of School', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
  { value: 'HOD', label: 'Head of Department', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  { value: 'LECTURER', label: 'Academic Lecturer', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'BURSAR', label: 'Bursary Officer', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
  { value: 'LIBRARIAN', label: 'Library Officer', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
  { value: 'STUDENT', label: 'Student / Scholar', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'PARENT', label: 'Parent / Guardian', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' },
];

export const UserRoleManager: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');

  // React Query Hook for Users
  const {
    users,
    isLoading,
    refetch,
    changeUserRole,
    isChangingRole,
    toggleUserStatus,
    isTogglingStatus,
    resetPassword,
  } = useUsers({
    role: roleFilter,
    division: divisionFilter,
    search: searchQuery,
  });

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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

  // Role Change Modal state
  const [roleChangeModal, setRoleChangeModal] = useState<{
    isOpen: boolean;
    user: { id: string; name: string; currentRole: string } | null;
    selectedRole: string;
  }>({
    isOpen: false,
    user: null,
    selectedRole: '',
  });

  // Password Reset Tool state
  const [resetToolState, setResetToolState] = useState<{
    isOpen: boolean;
    user: { id: string; name: string; username: string } | null;
  }>({
    isOpen: false,
    user: null,
  });

  // Bulk Level Promotion state
  const [bulkPromoteModal, setBulkPromoteModal] = useState({
    isOpen: false,
    fromLevel: 100,
    toLevel: 200,
    isSubmitting: false,
  });

  const handleExecuteBulkPromote = async () => {
    setBulkPromoteModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const res = await fetch('/api/admin/governance/bulk-promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromLevel: bulkPromoteModal.fromLevel,
          toLevel: bulkPromoteModal.toLevel,
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        showToast(data.message || `Successfully promoted students to Level ${bulkPromoteModal.toLevel}.`);
        setBulkPromoteModal({ isOpen: false, fromLevel: 100, toLevel: 200, isSubmitting: false });
        refetch();
      } else {
        showToast(data.error || 'Failed to execute bulk promotion', 'error');
        setBulkPromoteModal((prev) => ({ ...prev, isSubmitting: false }));
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing bulk promotion', 'error');
      setBulkPromoteModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Handlers
  const handleOpenRoleModal = (user: { id: string; name: string; role: string }) => {
    setRoleChangeModal({
      isOpen: true,
      user: { id: user.id, name: user.name, currentRole: user.role },
      selectedRole: user.role,
    });
  };

  const handleExecuteRoleChange = async () => {
    if (!roleChangeModal.user || !roleChangeModal.selectedRole) return;
    try {
      await changeUserRole({
        id: roleChangeModal.user.id,
        role: roleChangeModal.selectedRole,
      });
      showToast(`User ${roleChangeModal.user.name} promoted/assigned to ${roleChangeModal.selectedRole} successfully.`);
      setRoleChangeModal({ isOpen: false, user: null, selectedRole: '' });
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleToggleStatusClick = (user: { id: string; name: string; isActive: boolean }) => {
    const nextState = !user.isActive;
    const actionWord = nextState ? 'activate' : 'suspend';

    setConfirmModal({
      isOpen: true,
      title: `${actionWord.toUpperCase()} User Account`,
      message: `Are you sure you want to ${actionWord} the account for "${user.name}"? ${
        !nextState
          ? 'The user will be immediately blocked from signing in or accessing campus services.'
          : 'The user will regain immediate access to their designated portal dashboard.'
      }`,
      confirmText: nextState ? 'Activate Account' : 'Suspend Account',
      isDangerous: !nextState,
      onConfirm: async () => {
        try {
          await toggleUserStatus({ id: user.id, isActive: nextState });
          showToast(`User account ${user.name} ${actionWord}d successfully.`);
        } catch (err: any) {
          showToast(err.message || `Failed to ${actionWord} user.`, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const getRoleBadge = (roleName: string) => {
    const found = ROLES_LIST.find((r) => r.value === roleName.toUpperCase());
    const badgeClass = found?.color || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight inline-flex items-center gap-1 ${badgeClass}`}>
        <ShieldCheck className="w-3 h-3 shrink-0" />
        {found?.label || roleName}
      </span>
    );
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
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
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
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Password Reset Modal Tool */}
      <PasswordResetTool
        isOpen={resetToolState.isOpen}
        onClose={() => setResetToolState({ isOpen: false, user: null })}
        user={resetToolState.user}
        onResetConfirm={async (userId, customPassword) => {
          return await resetPassword({ id: userId, customPassword });
        }}
      />

      {/* Role Change Modal */}
      {roleChangeModal.isOpen && roleChangeModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all ${
              isNavy
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Change Institutional Role</h3>
                <p className="text-xs text-slate-400">User: {roleChangeModal.user.name}</p>
              </div>
            </div>

            <div className="py-4 space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Select the new institutional role to assign. Changing this role will update access permissions immediately on the user's next request.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Role Assignment
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {ROLES_LIST.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setRoleChangeModal((prev) => ({ ...prev, selectedRole: role.value }))}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        roleChangeModal.selectedRole === role.value
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${role.value === 'SUPER_ADMIN' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <span>{role.label}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80">{role.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleChangeModal({ isOpen: false, user: null, selectedRole: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRoleChange}
                  disabled={isChangingRole || roleChangeModal.selectedRole === roleChangeModal.user.currentRole}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isChangingRole ? 'Updating...' : 'Assign Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Level Promotion Modal */}
      {bulkPromoteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all ${
              isNavy
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Bulk Academic Level Promotion</h3>
                <p className="text-xs text-slate-400">Advance student cohorts across levels</p>
              </div>
            </div>

            <div className="py-4 space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                This executive action advances all active students currently at the source level to the target level simultaneously.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">From Level</label>
                  <select
                    value={bulkPromoteModal.fromLevel}
                    onChange={(e) => setBulkPromoteModal((prev) => ({ ...prev, fromLevel: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-100 dark:bg-slate-800 font-bold"
                  >
                    <option value={100}>100 Level</option>
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To Target Level</label>
                  <select
                    value={bulkPromoteModal.toLevel}
                    onChange={(e) => setBulkPromoteModal((prev) => ({ ...prev, toLevel: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-100 dark:bg-slate-800 font-bold"
                  >
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                    <option value={400}>400 Level</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setBulkPromoteModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={bulkPromoteModal.isSubmitting || bulkPromoteModal.fromLevel >= bulkPromoteModal.toLevel}
                  onClick={handleExecuteBulkPromote}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {bulkPromoteModal.isSubmitting ? 'Promoting...' : `Promote All to ${bulkPromoteModal.toLevel}L`}
                </button>
              </div>
            </div>
          </div>
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
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              User Lifecycle & RBAC Engine
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Master User & Role Manager</h2>
          <p className="text-xs text-slate-300">
            Real-time role promotions, access suspension, and cryptographic password overrides across all institutional tiers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBulkPromoteModal({ isOpen: true, fromLevel: 100, toLevel: 200, isSubmitting: false })}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Bulk Level Promotion
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 w-fit cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Directory
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bento-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, matric/staff ID, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admins</option>
              <option value="ADMIN">Admins</option>
              <option value="REGISTRAR">Registrars</option>
              <option value="EXAM_OFFICER">Exam Officers</option>
              <option value="DEAN">Deans</option>
              <option value="HOD">HODs</option>
              <option value="LECTURER">Lecturers</option>
              <option value="BURSAR">Bursars</option>
              <option value="LIBRARIAN">Librarians</option>
              <option value="STUDENT">Students</option>
              <option value="PARENT">Parents</option>
            </select>

            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Divisions</option>
              <option value="NCE">NCE Division</option>
              <option value="DEGREE">Degree Division</option>
              <option value="SECONDARY">Secondary</option>
              <option value="PRIMARY">Primary</option>
              <option value="CENTRAL">Central Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Master Table */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Identifier / Portal ID</th>
                <th className="py-3 px-4">Institutional Role</th>
                <th className="py-3 px-4">Affiliation / Dept</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users match the selected query and filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                        {u.identifier}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{u.departmentOrProg}</div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{u.division}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 inline-flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(u)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          title="Change User Role (Promote/Reassign)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Role
                        </button>

                        <button
                          type="button"
                          onClick={() => setResetToolState({ isOpen: true, user: { id: u.id, name: u.name, username: u.username } })}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          title="Force Password Reset"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Reset
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatusClick(u)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            u.isActive
                              ? 'text-rose-500 hover:bg-rose-500/10'
                              : 'text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                          title={u.isActive ? 'Suspend User Account' : 'Activate User Account'}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
