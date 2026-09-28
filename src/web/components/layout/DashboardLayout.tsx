import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  CreditCard,
  Building2,
  BookOpen,
  Users,
  FileSpreadsheet,
  FileCheck,
  FileText,
  Award,
  ShieldCheck,
  Sliders,
  Settings,
  Database,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCheck,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  School,
  Clock,
  ArrowRight,
  Lock
} from 'lucide-react';
import { useAppStore, UserRole, ActiveTab, AdminTab } from '../../stores/useAppStore';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  id: ActiveTab;
  adminSubTab?: AdminTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  category: 'result' | 'fee' | 'hostel' | 'system';
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userSession, activeTab, setActiveTab, adminTab, setAdminTab, uiPreferences } = useAppStore();
  const { logout } = useAuth();

  const role: UserRole = userSession?.role || 'STUDENT';

  // Responsive Sidebar States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Topbar Dropdown States
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'First Semester 2026/2027 Broadsheets Published',
      time: '12m ago',
      unread: true,
      category: 'result',
    },
    {
      id: 'notif-2',
      title: 'Tuition Fee Clearance Confirmed (Receipt #REC-8401)',
      time: '1h ago',
      unread: true,
      category: 'fee',
    },
    {
      id: 'notif-3',
      title: 'Autonomous Hostel Reservation Window Active',
      time: '2h ago',
      unread: true,
      category: 'hostel',
    },
    {
      id: 'notif-4',
      title: 'Cloudflare Edge WAF: Routine security scan complete',
      time: '5h ago',
      unread: false,
      category: 'system',
    },
  ]);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close search/notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  // ---------------------------------------------------------------------------
  // ROLE-BASED NAVIGATION ITEMS MAPPING
  // ---------------------------------------------------------------------------
  const getNavItems = (): NavItem[] => {
    // 1. STUDENT
    if (role === 'STUDENT') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'results', label: 'My Academic Results', icon: GraduationCap, badge: 'New' },
        { id: 'finance', label: 'Tuition & Fees', icon: CreditCard },
        { id: 'hostels', label: 'Hostel Allocation', icon: Building2, badge: 'Live' },
        { id: 'sims', label: 'Course Registration', icon: BookOpen },
        { id: 'profile', label: 'My Profile & ID', icon: UserCheck },
      ];
    }

    // 2. LECTURER
    if (role === 'LECTURER' || role === 'STAFF' || role === 'HOD') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'staff', label: 'Grade Submission', icon: FileSpreadsheet, badge: 'Active' },
        { id: 'sims', label: 'Course Rosters', icon: BookOpen },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    // 3. BURSAR / BURSARY
    if (role === 'BURSAR' || role === 'BURSARY') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'finance', label: 'Revenue & Ledgers', icon: DollarSign },
        { id: 'finance', label: 'Reconciliation Engine', icon: Layers, badge: 'VPay' },
        { id: 'admin', adminSubTab: 'fees', label: 'Master Fee Schedule', icon: Sliders },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    // 4. DEAN
    if (role === 'DEAN') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'dean', label: 'Approval Queue', icon: FileCheck, badge: '18 Pending' },
        { id: 'staff', label: 'Faculty Departments', icon: School },
        { id: 'exam_officer', label: 'Broadsheet Audit', icon: FileText },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    // 5. REGISTRAR
    if (role === 'REGISTRAR') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'registrar', label: 'Academic Affairs', icon: BookOpen },
        { id: 'admissions', label: 'Student Admissions', icon: Users },
        { id: 'exam_officer', label: 'Senate Broadsheets', icon: FileText },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    // 6. EXAM OFFICER
    if (role === 'EXAM_OFFICER') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'exam_officer', label: 'Broadsheet Engine', icon: FileSpreadsheet },
        { id: 'dean', label: 'Senate Submissions', icon: ShieldCheck },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    // 7. WARDEN / STUDENT AFFAIRS
    if (role === 'WARDEN') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'hostels', label: 'Hostel Allocation Engine', icon: Building2, badge: 'Locks' },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    // 8. LIBRARIAN
    if (role === 'LIBRARIAN') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'librarian', label: 'E-Library Catalog', icon: BookOpen },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    // 9. PARENT
    if (role === 'PARENT') {
      return [
        { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
        { id: 'parent', label: 'Ward Academic Progress', icon: GraduationCap },
        { id: 'finance', label: 'School Fee Payment', icon: CreditCard },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    // 10. SUPER_ADMIN / ADMIN
    return [
      { id: 'dashboard_home', label: 'Command Center', icon: LayoutDashboard },
      { id: 'admin', adminSubTab: 'courses', label: 'Courses & Curriculum', icon: BookOpen },
      { id: 'admin', adminSubTab: 'fees', label: 'Fee Configuration', icon: CreditCard },
      { id: 'admin', adminSubTab: 'users', label: 'User Accounts & RBAC', icon: Users, badge: 'Admin' },
      { id: 'admin', adminSubTab: 'audit', label: 'Cryptographic Audit', icon: Database },
      { id: 'admin', adminSubTab: 'settings', label: 'Governance Settings', icon: Settings },
      { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
    ];
  };

  const navItems = getNavItems();

  const handleNavClick = (item: NavItem) => {
    setActiveTab(item.id);
    if (item.adminSubTab) {
      setAdminTab(item.adminSubTab);
    }
    setMobileDrawerOpen(false);
  };

  // Search Results Simulation
  const searchResults = [
    { title: 'Aondoaver Moses Iorliam (COEKA/2026/NCE/084)', type: 'Student Record', tab: 'results' },
    { title: 'MTH 211: Linear Algebra & Differential Equations', type: 'Course Catalog', tab: 'sims' },
    { title: 'Fee Invoice #INV-2026-0928-84 (Tuition ₦48,500)', type: 'Bursary Invoice', tab: 'finance' },
    { title: 'Sir Kashim Ibrahim Hall - Room 204 (Bed 02)', type: 'Hostel Bedspace', tab: 'hostels' },
  ].filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.type.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* ========================================================================= */}
      {/* 1. INSTITUTIONAL TOPBAR (Fixed Header)                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm transition-all h-16 sm:h-20 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Left: Mobile Drawer Hamburger & Brand Monogram */}
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setActiveTab('dashboard_home')}
            >
              <div className="w-12 h-13 sm:w-13 sm:h-14 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 drop-shadow-sm">
                <img src="/coeka-logo.png" alt="COEKA Crest" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-black text-[#0B192C] tracking-tight leading-none group-hover:text-blue-700 transition-colors">
                  COLLEGE OF EDUCATION
                </span>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                  Katsina-Ala • Enterprise Portal
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6 relative" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search students, courses, invoices... (Ctrl + K)"
                className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-blue-500 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400 text-slate-900"
              />
            </div>

            {/* Search Dropdown Results Popover */}
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-fade-in max-h-80 overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                  Global Edge Search Matches
                </div>
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setActiveTab(res.tab as any);
                          setSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{res.title}</span>
                          <span className="text-[10px] text-blue-600 font-semibold">{res.type}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No results found for "{searchQuery}". Try searching by matric, course code, or invoice.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Notification Center + User Identity + Logout */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Notification Center */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-fade-in space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Institutional Alerts
                      </h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border transition-colors flex items-start justify-between gap-2 ${
                          n.unread ? 'bg-blue-50/50 border-blue-200/80' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 leading-snug">{n.title}</p>
                          <span className="text-[10px] text-slate-400 block">{n.time}</span>
                        </div>
                        {n.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        setActiveTab('dashboard_home');
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      View Notice Board
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Identity Pill */}
            <div
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200 group"
            >
              {/* Passport Photo Frame (R2 simulated fallback monogram) */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#0B192C] to-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-black text-xs shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                {userSession?.fullName
                  ? userSession.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : 'CK'}
              </div>

              {/* Name & Role Badge (Visible sm+) */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                  {userSession?.fullName || 'Aondoaver Moses'}
                </span>
                <span className="text-[10px] font-black text-blue-700 tracking-wider uppercase">
                  {role}
                </span>
              </div>
            </div>

            {/* Clean Logout Action Button */}
            <button
              type="button"
              onClick={() => logout()}
              className="p-2 sm:px-3 sm:py-2 rounded-xl font-bold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all flex items-center gap-1.5"
              title="Sign Out of Portal"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>

          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY CONTAINER WITH DYNAMIC COLLAPSIBLE SIDEBAR + MAIN CONTENT         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ======================================================================= */}
        {/* DESKTOP / TABLET COLLAPSIBLE SIDEBAR (Deep Navy Blue #0B192C)           */}
        {/* ======================================================================= */}
        <aside
          className={`hidden lg:flex flex-col bg-[#0B192C] text-slate-300 border-r border-slate-800 transition-all duration-300 relative z-30 shrink-0 select-none ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Sidebar Header: Role Badge + Toggle Collapse Button */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img src="/coeka-logo.png" alt="COEKA" className="w-10 h-11 object-contain shrink-0 drop-shadow-sm" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 truncate">
                    {role} PORTAL
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">Sovereign Edge Hub</span>
                </div>
              </div>
            ) : (
              <img src="/coeka-logo.png" alt="COEKA" className="w-10 h-11 object-contain mx-auto drop-shadow-sm" />
            )}
            
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ml-auto"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id && (!item.adminSubTab || adminTab === item.adminSubTab);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-all group relative ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-slate-950 text-amber-400'
                          : 'bg-slate-800 text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Public Showroom Link in Sidebar */}
          <div className="p-3 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('website')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Visit Public Showroom Website"
            >
              <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && <span>Public Website</span>}
            </button>
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* MOBILE SLIDE-OUT DRAWER (Smooth Framer Motion Animation)                */}
        {/* ======================================================================= */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50"
              />

              {/* Drawer Container */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="lg:hidden fixed inset-y-0 left-0 w-72 bg-[#0B192C] text-slate-300 shadow-2xl z-50 flex flex-col border-r border-slate-800"
              >
                {/* Drawer Top */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-13 flex items-center justify-center shrink-0 drop-shadow-sm">
                      <img src="/coeka-logo.png" alt="COEKA Crest" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-white block">COEKA PORTAL</span>
                      <span className="text-[10px] text-amber-400 font-bold uppercase">{role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Drawer Nav Items */}
                <div className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive =
                      activeTab === item.id && (!item.adminSubTab || adminTab === item.adminSubTab);

                    return (
                      <button
                        key={index}
                        onClick={() => handleNavClick(item)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 font-black shadow'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      setActiveTab('website');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-bold hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>Public Showroom Website</span>
                  </button>
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600/20 text-rose-400 text-xs font-bold hover:bg-rose-600/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Portal</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ======================================================================= */}
        {/* MAIN APPLICATION VIEWPORT WITH FRAMER MOTION TRANSITIONS               */}
        {/* ======================================================================= */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

    </div>
  );
};
