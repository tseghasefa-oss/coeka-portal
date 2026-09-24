import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Lock,
  UserCheck,
  GraduationCap,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface UserDirectoryRecord {
  id: string;
  name: string;
  identifier: string; // Staff ID or Matric
  email: string;
  role: string;
  departmentOrProg: string;
  division: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

export const AdminUsersTab: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const [usersList, setUsersList] = useState<UserDirectoryRecord[]>([
    {
      id: 'usr-1',
      name: 'Engr. Prof. S. L. Tsegha',
      identifier: 'COEKA/ADM/001',
      email: 'founder@fruitfulujah.com',
      role: 'SUPER_ADMIN',
      departmentOrProg: 'Directorate of ICT & System Architecture',
      division: 'CENTRAL',
      isActive: true,
      twoFactorEnabled: true,
    },
    {
      id: 'usr-2',
      name: 'Dr. Olufemi Adeyemi',
      identifier: 'COEKA/STF/2026/001',
      email: 'lecturer1@coeka.edu.ng',
      role: 'LECTURER',
      departmentOrProg: 'Department of Computer Science',
      division: 'NCE',
      isActive: true,
      twoFactorEnabled: true,
    },
    {
      id: 'usr-3',
      name: 'Dr. (Mrs) Bridget Tyav',
      identifier: 'COEKA/STF/2026/012',
      email: 'btyav@coeka.edu.ng',
      role: 'DEAN',
      departmentOrProg: 'School of Education',
      division: 'NCE',
      isActive: true,
      twoFactorEnabled: true,
    },
    {
      id: 'usr-4',
      name: 'Mr. Gabriel Ikyur',
      identifier: 'COEKA/BUR/005',
      email: 'bursar.office@coeka.edu.ng',
      role: 'BURSAR',
      departmentOrProg: 'Bursary Revenue & Accounts Unit',
      division: 'CENTRAL',
      isActive: true,
      twoFactorEnabled: true,
    },
    {
      id: 'usr-5',
      name: 'Aondoaver Moses Iorliam',
      identifier: 'COEKA/2026/NCE/084',
      email: 'm.iorliam@student.coeka.edu.ng',
      role: 'STUDENT',
      departmentOrProg: 'NCE Computer Science / Mathematics',
      division: 'NCE',
      isActive: true,
      twoFactorEnabled: false,
    },
    {
      id: 'usr-6',
      name: 'Doose Mercy Gbadu',
      identifier: 'COEKA/2026/NCE/087',
      email: 'd.gbadu@student.coeka.edu.ng',
      role: 'STUDENT',
      departmentOrProg: 'NCE Biology / Integrated Science',
      division: 'NCE',
      isActive: true,
      twoFactorEnabled: false,
    },
    {
      id: 'usr-7',
      name: 'Terna Victor Chia',
      identifier: 'COEKA/2026/DEG/018',
      email: 'v.chia@degree.coeka.edu.ng',
      role: 'STUDENT',
      departmentOrProg: 'B.Ed Business Education',
      division: 'DEGREE',
      isActive: true,
      twoFactorEnabled: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: boolean) => {
    setUsersList(
      usersList.map((u) => (u.id === id ? { ...u, isActive: !currentStatus } : u))
    );
    showToast(`${name}'s account ${!currentStatus ? 'activated' : 'deactivated'}.`);
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className={`w-6 h-6 ${isNavy ? 'text-blue-600' : 'text-emerald-700'}`} />
            Institutional User & Staff Identity Directory
          </h2>
          <p className="text-xs text-slate-500">
            Audit user accounts, assign roles, enforce two-factor authentication, and monitor portal access.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">4,828</div>
          <div className="text-[11px] text-emerald-600 font-medium">99.2% Active Status</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Academic Faculty</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">248</div>
          <div className="text-[11px] text-blue-600 font-medium">Lecturers & Heads of Dept</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Undergraduates & Pupils</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">4,520</div>
          <div className="text-[11px] text-purple-600 font-medium">Enrolled in 2026/2027</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Super Administrators</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">3</div>
          <div className="text-[11px] text-amber-600 font-medium">Full System Authority</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, ID number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 shrink-0">Role:</span>
          {['ALL', 'SUPER_ADMIN', 'DEAN', 'LECTURER', 'BURSAR', 'STUDENT'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              {filteredUsers.map((u) => (
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
                          : u.role === 'LECTURER'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {u.departmentOrProg}
                  </td>
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
                    <button
                      onClick={() => handleToggleStatus(u.id, u.name, u.isActive)}
                      className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
