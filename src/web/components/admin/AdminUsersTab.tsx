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
  Copy,
  Check,
  AlertTriangle,
  History,
  FileCheck2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useUsers, useAuditLogs } from '../../hooks/useAdminData';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const AdminUsersTab: React.FC = () => {
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
    promoteUser,
    isPromoting,
    toggleUserStatus,
    isTogglingStatus,
    resetPassword,
    isResettingPassword,
  } = useUsers({
    role: roleFilter,
    division: divisionFilter,
    search: searchQuery,
  });

  // Audit Logs Hook
  const { auditLogs, verifyAuditLog } = useAuditLogs(15);

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

  // Temporary Password Modal state
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    isOpen: boolean;
    userName: string;
    tempPassword: string;
  }>({
    isOpen: false,
    userName: '',
    tempPassword: '',
  });
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);

  // Audit verification badge states
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);

  // Handlers
  const handlePromoteClick = (user: { id: string; name: string }) => {
    setConfirmModal({
      isOpen: true,
      title: 'Promote User to Administrator',
      message: `Are you sure you want to promote "${user.name}" to Super Administrator? This will grant elevated privileges including academic curriculum modifications, fee price changes, and user management.`,
      confirmText: 'Promote to Admin',
      isDangerous: false,
      onConfirm: async () => {
        try {
          await promoteUser({ id: user.id, role: 'SUPER_ADMIN' });
          showToast(`Successfully promoted ${user.name} to Super Administrator.`);
        } catch (err: any) {
          showToast(err.message || 'Failed to promote user.', 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleToggleStatusClick = (user: { id: string; name: string; isActive: boolean }) => {
    const nextState = !user.isActive;
    const actionWord = nextState ? 'activate' : 'suspend';

    setConfirmModal({
      isOpen: true,
      title: `${nextState ? 'Activate' : 'Suspend'} User Account`,
      message: nextState
        ? `Are you sure you want to reactivate the account for "${user.name}"? The user will immediately regain portal access.`
        : `Are you sure you want to suspend "${user.name}"? The user will be immediately blocked from portal login and all active sessions will be invalidated.`,
      confirmText: nextState ? 'Reactivate Account' : 'Suspend Account',
      isDangerous: !nextState,
      onConfirm: async () => {
        try {
          await toggleUserStatus({ id: user.id, isActive: nextState });
          showToast(`User ${user.name} has been ${actionWord}ed.`);
        } catch (err: any) {
          showToast(err.message || `Failed to ${actionWord} user.`, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleResetPasswordClick = (user: { id: string; name: string }) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset User Password',
      message: `Generate a new cryptographic temporary password for "${user.name}"? Their existing password will be revoked immediately.`,
      confirmText: 'Generate New Password',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await resetPassword(user.id);
          setHasCopiedPassword(false);
          setTempPasswordModal({
            isOpen: true,
            userName: user.name,
            tempPassword: res.tempPassword,
          });
          showToast(`Password generated for ${user.name}.`);
        } catch (err: any) {
          showToast(err.message || 'Failed to reset password.', 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedPassword(true);
    setTimeout(() => setHasCopiedPassword(false), 3000);
  };

  const handleVerifyAuditEntry = async (logId: string) => {
    try {
      const res = await verifyAuditLog(logId);
      setVerifiedMap((prev) => ({ ...prev, [logId]: res.isValid }));
      showToast(
        res.isValid
          ? `Audit log ${logId} cryptographically verified! HMAC signature is authentic.`
          : `Tampering Alert: Audit log ${logId} failed signature verification!`,
        res.isValid ? 'success' : 'error'
      );
    } catch {
      showToast('Error validating audit signature.', 'error');
    }
  };

  // Filtered users calculation
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery.trim() ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' ||
      u.role.toUpperCase() === roleFilter.toUpperCase() ||
      u.userType.toUpperCase() === roleFilter.toUpperCase();

    const matchesDivision =
      divisionFilter === 'ALL' || u.division.toUpperCase() === divisionFilter.toUpperCase();

    return matchesSearch && matchesRole && matchesDivision;
  });

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
        isLoading={isPromoting || isTogglingStatus || isResettingPassword}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Temporary Password Modal */}
      {tempPasswordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Temporary Password Generated
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    For {tempPasswordModal.userName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTempPasswordModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Please securely communicate this temporary credential to the user. The user will be required to change this password upon their next login.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="font-mono text-base font-black tracking-wider text-slate-900 selection:bg-amber-200">
                {tempPasswordModal.tempPassword}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(tempPasswordModal.tempPassword)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  hasCopiedPassword
                    ? 'bg-emerald-600 text-white'
                    : isNavy
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
              >
                {hasCopiedPassword ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setTempPasswordModal((prev) => ({ ...prev, isOpen: false }))}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className={`w-6 h-6 ${isNavy ? 'text-blue-600' : 'text-emerald-700'}`} />
            Institutional User & Staff Identity Directory
          </h2>
          <p className="text-xs text-slate-500">
            Audit user accounts, promote staff to administrators, suspend compromised logins, and generate temporary credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAuditDrawer(!showAuditDrawer)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              showAuditDrawer
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-amber-600" />
            <span>Cryptographic Audit Trail</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cryptographic Audit Trail Drawer */}
      {showAuditDrawer && (
        <div className="p-6 bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-black text-amber-300">
                  Tamper-Evident Cryptographic Audit Trail
                </h3>
                <p className="text-[11px] text-slate-400">
                  All administrative mutations are signed with HMAC-SHA256 and stored immutably.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuditDrawer(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No audit records currently available. Execute administrative actions to generate cryptographic logs.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {auditLogs.map((log) => {
                const isVerified = verifiedMap[log.id];
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400 font-mono text-[11px]">
                          {log.action}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {log.entityName} : {log.entityId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Actor: {log.actorUserId} • Signature: {log.signature.substring(0, 16)}...
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isVerified !== undefined ? (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isVerified
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-950 text-red-300 border border-red-500/40'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isVerified ? 'HMAC Verified' : 'Invalid Signature'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerifyAuditEntry(log.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
                        >
                          Verify Signature
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{users.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Active Campus Directory</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Academic Faculty</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {users.filter((u) => u.userType === 'STAFF').length}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">Deans, Lecturers & HODs</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Enrolled Students</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {users.filter((u) => u.userType === 'STUDENT').length}
          </div>
          <div className="text-[11px] text-purple-600 font-medium">NCE & Degree Learners</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Super Admins</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {users.filter((u) => u.role === 'SUPER_ADMIN').length}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Full Governance Authority</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Search input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, ID number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Role:</span>
            {['ALL', 'SUPER_ADMIN', 'STAFF', 'STUDENT', 'PARENT'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === role
                    ? isNavy
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-emerald-800 text-amber-300 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Division:</span>
            {['ALL', 'NCE', 'DEGREE', 'SECONDARY', 'PRIMARY'].map((div) => (
              <button
                key={div}
                onClick={() => setDivisionFilter(div)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  divisionFilter === div
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User & Identifier</th>
                <th className="py-3 px-4">Institutional Role</th>
                <th className="py-3 px-4">Department / Unit</th>
                <th className="py-3 px-4 text-center">Division</th>
                <th className="py-3 px-4 text-center">2FA Security</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No users matching current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                        <span>{u.identifier}</span>
                        <span>•</span>
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : u.role === 'DEAN' || u.role === 'BURSAR'
                            ? 'bg-purple-100 text-purple-900'
                            : u.role === 'LECTURER' || u.userType === 'STAFF'
                            ? 'bg-blue-100 text-blue-900'
                            : u.role === 'PARENT'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{u.departmentOrProg}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                      {u.division}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Promote to Admin */}
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handlePromoteClick(u)}
                            className="px-2 py-1 text-[11px] rounded-lg font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                            title="Promote to Super Administrator"
                          >
                            Promote to Admin
                          </button>
                        )}

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => handleResetPasswordClick(u)}
                          className="px-2 py-1 text-[11px] rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                          title="Generate temporary password"
                        >
                          <KeyRound className="w-3 h-3 text-slate-500" />
                          <span>Reset Pwd</span>
                        </button>

                        {/* Suspend / Reactivate */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatusClick(u)}
                          className={`px-2 py-1 text-[11px] rounded-lg font-bold transition-colors ${
                            u.isActive
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                          title={u.isActive ? 'Suspend user account' : 'Reactivate user account'}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
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
