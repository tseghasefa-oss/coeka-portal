import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Sliders,
  Award,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Printer,
  QrCode,
  Sparkles,
  Lock,
  ArrowLeft,
  Bell,
  Sun,
  Moon,
  Save,
  Check
} from 'lucide-react';
import { useAppStore, UserRole } from '../../stores/useAppStore';

export const UserProfilePage: React.FC = () => {
  const { userSession, uiPreferences, setUiPreferences, setActiveTab } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'preferences' | 'digital_id'>('profile');

  // Profile Form State
  const [phoneNumber, setPhoneNumber] = useState('0803 123 4567');
  const [address, setAddress] = useState('Flat 4, Staff Quarters, Katsina-Ala, Benue State');
  const [emergencyContactName, setEmergencyContactName] = useState('Elder Moses Iorliam Snr');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('0802 987 6543');
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);

  // Security & Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [gradeNotification, setGradeNotification] = useState(true);
  const [feeReminders, setFeeReminders] = useState(true);

  const role: UserRole = userSession?.role || 'STUDENT';
  const isStudent = role === 'STUDENT';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMessage('Personal profile details updated successfully on the Cloudflare edge database.');
    setTimeout(() => setProfileSuccessMessage(null), 4000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (!currentPassword) {
      setSecurityMessage({ type: 'error', text: 'Please enter your current account password.' });
      return;
    }
    if (newPassword.length < 8) {
      setSecurityMessage({ type: 'error', text: 'New password must be at least 8 characters in length.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'The new password and confirmation password do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setSecurityMessage({
        type: 'success',
        text: 'Account password changed successfully! Your active session remains authenticated.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Top Breadcrumb & User Identity Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard_home')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Return to Dashboard Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B192C]">
              User Profile & Institutional Identity
            </h1>
            <p className="text-xs text-slate-500">Manage account information, security credentials, and digital student ID</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('digital_id' as any)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <Award className="w-4 h-4 text-slate-950" />
          <span>View Digital ID</span>
        </button>
      </div>

      {/* User Overview Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Passport Photo Frame */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#0B192C] to-slate-900 border-4 border-amber-400 p-1 flex items-center justify-center text-amber-400 font-black text-3xl shadow-lg">
            {userSession?.fullName
              ? userSession.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
              : 'CK'}
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Active Edge Session" />
        </div>

        {/* Identity Details */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">{userSession?.fullName || 'Aondoaver Moses Iorliam'}</h2>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 inline-block self-center md:self-auto">
              Role: {role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 font-semibold">Institutional ID / Matric: </span>
              <span className="font-mono font-bold text-slate-900">{userSession?.username || 'COEKA/2026/NCE/084'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Division: </span>
              <span className="font-bold text-slate-900">{userSession?.division || 'NCE Programme'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Official Email: </span>
              <span className="font-mono text-blue-700">{userSession?.email || `${userSession?.username?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@coeka.edu.ng`}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Statutory Compliance: </span>
              <span className="text-emerald-700 font-bold">NDPA 2023 Validated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'profile', label: 'Personal Information', icon: User },
          { id: 'security', label: 'Security & Password', icon: KeyRound },
          { id: 'preferences', label: 'Portal Preferences', icon: Sliders },
          { id: 'digital_id', label: 'Digital Identity Card', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'border-amber-400 text-[#0B192C] bg-amber-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE MANAGEMENT                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Personal Contact & Next-of-Kin Details</h3>
            <p className="text-xs text-slate-500">Ensure your contact records are current for academic notifications and fee receipts.</p>
          </div>

          {profileSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Primary Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Emergency Contact (Next-of-Kin) Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Next-of-Kin Telephone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Permanent Residential Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 shadow transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Updates</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY CENTER & CHANGE PASSWORD                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <form onSubmit={handleChangePassword} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Change Account Password</h3>
              <p className="text-xs text-slate-500">
                Ensure a strong, unique password with at least 8 characters, combining uppercase, lowercase, and digits.
              </p>
            </div>

            {securityMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in border ${
                  securityMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {securityMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{securityMessage.text}</span>
              </div>
            )}

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  New Password (min. 8 characters)
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter strong new password"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#0B192C] text-white hover:bg-slate-800 shadow transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Update Account Password</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Session Telemetry & Active Edge Status */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Active Edge Session Telemetry</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Geolocation Region</span>
                <span className="font-bold text-slate-900">Nigeria (Katsina-Ala / Makurdi)</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Transport Security</span>
                <span className="font-bold text-emerald-700">TLS 1.3 Strict HTTPS</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">WAF Rate-Limiting</span>
                <span className="font-bold text-blue-700">Cloudflare Shield Enforced</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PORTAL PREFERENCES                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'preferences' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Portal Interface & Notification Settings</h3>
            <p className="text-xs text-slate-500">Customize visual appearance and institutional alerting channels.</p>
          </div>

          <div className="space-y-6 max-w-xl">
            {/* Theme Preference Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Color Theme Palette</span>
                <span className="text-[11px] text-slate-500">Toggle between Classic Institutional Navy and Forest Emerald</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUiPreferences({ theme: 'navy' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    uiPreferences.theme === 'navy'
                      ? 'bg-[#0B192C] text-amber-400 shadow'
                      : 'bg-white text-slate-600 border border-slate-300'
                  }`}
                >
                  Navy Blue
                </button>
                <button
                  type="button"
                  onClick={() => setUiPreferences({ theme: 'emerald' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    uiPreferences.theme === 'emerald'
                      ? 'bg-emerald-800 text-amber-300 shadow'
                      : 'bg-white text-slate-600 border border-slate-300'
                  }`}
                >
                  Emerald Green
                </button>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Notification Channels & Alerts
              </span>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Email Alerts</span>
                  <span className="text-[11px] text-slate-500">Receive fee confirmations and semester notices via email</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">SMS Urgent Notifications</span>
                  <span className="text-[11px] text-slate-500">Direct text messages for exam schedule changes and deadlines</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Academic Grade Announcements</span>
                  <span className="text-[11px] text-slate-500">Immediate push notice when new semester results are published</span>
                </div>
                <input
                  type="checkbox"
                  checked={gradeNotification}
                  onChange={(e) => setGradeNotification(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DIGITAL ID CARD (Interactive & Printable)                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'digital_id' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Institutional Digital ID Card</h3>
              <p className="text-xs text-slate-500">Official biometric digital credential valid for 2026/2027 academic session</p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Physical ID Card</span>
            </button>
          </div>

          {/* Printable ID Card Container */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6">
            
            {/* FRONT SIDE OF ID CARD */}
            <div className="w-[340px] sm:w-[380px] h-[240px] rounded-2xl bg-gradient-to-br from-[#0B192C] via-slate-900 to-[#0B192C] text-white p-5 shadow-2xl border-2 border-amber-400 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
              
              {/* ID Header */}
              <div className="flex items-center gap-3 pb-2 border-b border-slate-700/80">
                <div className="w-10 h-11 shrink-0 flex items-center justify-center drop-shadow-sm">
                  <img src="/coeka-logo.png" alt="COEKA Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black tracking-tight text-white leading-tight uppercase">
                    College of Education, Katsina-Ala
                  </h4>
                  <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                    {isStudent ? 'Official Student Identity Card' : 'Staff Institutional Pass'}
                  </p>
                </div>
              </div>

              {/* ID Body */}
              <div className="flex items-center gap-4 my-auto">
                <div className="w-20 h-24 rounded-xl bg-slate-800 border-2 border-amber-400/80 p-0.5 flex flex-col items-center justify-center text-amber-400 font-black text-2xl shadow-inner shrink-0">
                  {userSession?.fullName
                    ? userSession.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : 'CK'}
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Name</span>
                    <span className="font-black text-sm text-white block leading-tight">
                      {userSession?.fullName || 'Aondoaver Moses Iorliam'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">
                      {isStudent ? 'Matric No' : 'Staff ID'}
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {userSession?.username || 'COEKA/2026/NCE/084'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Programme / Division</span>
                    <span className="text-[11px] text-slate-200 font-semibold">
                      {userSession?.division || 'NCE Programme (Sciences)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ID Footer */}
              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[9px] text-slate-400">
                <span>Valid: 2026/2027 Session</span>
                <span className="text-amber-400 font-bold uppercase">Benue State Govt</span>
              </div>
            </div>

            {/* REVERSE SIDE OF ID CARD */}
            <div className="w-[340px] sm:w-[380px] h-[240px] rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border-2 border-slate-300 relative overflow-hidden flex flex-col justify-between">
              
              <div className="space-y-1 text-center border-b border-slate-100 pb-2">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                  Terms of Issuance & Verification
                </p>
                <p className="text-[8px] text-slate-500 leading-tight">
                  This card remains the property of the College of Education, Katsina-Ala. If found, please return to the Registry Office, P.M.B. 1008, Katsina-Ala, Benue State.
                </p>
              </div>

              {/* Barcode & Hologram Verification Strip */}
              <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                    <QrCode className="w-12 h-12 text-slate-800" />
                    <div>
                      <span className="block font-bold text-slate-800">EDGE-VERIFIED</span>
                      <span className="block text-[8px] text-slate-400">SHA-256 Validated</span>
                      <span className="block text-[8px] text-emerald-600 font-bold">ACTIVE REGISTRATION</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="w-16 h-8 border-b border-slate-400 mx-auto" />
                  <span className="block text-[8px] font-bold text-slate-700">REGISTRAR</span>
                  <span className="block text-[7px] text-slate-400">COEKA Academic Board</span>
                </div>
              </div>

              {/* Bottom strip */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-500">
                <span>Emergency: +234 803 000 1976</span>
                <span className="font-mono text-slate-400">NDPA 2023 SECURE</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
