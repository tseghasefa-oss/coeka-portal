import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  CreditCard,
  Building2,
  BookOpen,
  UserCheck,
  FileCheck,
  Award,
  Clock,
} from 'lucide-react';
import { useAppStore, ActiveTab } from '../../stores/useAppStore';

/**
 * Division-Based Feature Map defining institutional access boundaries
 */
export const DIVISION_FEATURES = {
  DEGREE: ['profile', 'fees', 'course_reg', 'results', 'hostels', 'clearance'],
  NCE: ['profile', 'fees', 'course_reg', 'results', 'hostels', 'clearance'],
  SECONDARY: ['profile', 'fees', 'report_cards', 'timetable', 'clearance'],
  PRIMARY: ['profile', 'fees', 'report_cards', 'timetable', 'clearance'],
} as const;

export type DivisionFeature =
  | 'profile'
  | 'fees'
  | 'course_reg'
  | 'results'
  | 'hostels'
  | 'clearance'
  | 'report_cards'
  | 'timetable';

export interface StudentMenuItem {
  id: ActiveTab;
  feature: DivisionFeature | 'home';
  label: string;
  icon: React.ElementType;
  badge?: string;
}

/**
 * Checks if a specific feature is enabled for the provided division
 */
export function isFeatureAllowed(division: string | undefined, feature: DivisionFeature): boolean {
  const norm = (division || 'NCE').toUpperCase() as keyof typeof DIVISION_FEATURES;
  const features = DIVISION_FEATURES[norm] || DIVISION_FEATURES.NCE;
  return (features as readonly string[]).includes(feature);
}

/**
 * Resolves filtered student navigation items tailored to the active academic division
 */
export function getStudentNavItems(division: string | undefined): StudentMenuItem[] {
  const norm = (division || 'NCE').toUpperCase() as keyof typeof DIVISION_FEATURES;
  const isPrimary = norm === 'PRIMARY';
  const isSecondary = norm === 'SECONDARY';

  const allItems: StudentMenuItem[] = [
    {
      id: 'dashboard_home',
      feature: 'home',
      label: 'Command Center',
      icon: LayoutDashboard,
    },
    {
      id: 'results',
      feature: 'results',
      label: 'My Academic Results',
      icon: GraduationCap,
      badge: 'Senate',
    },
    {
      id: 'sims',
      feature: 'course_reg',
      label: 'Course Registration',
      icon: BookOpen,
    },
    {
      id: 'sims',
      feature: 'report_cards',
      label: isPrimary ? 'Star Report & Progress' : 'Continuous Assessment & Reports',
      icon: Award,
      badge: isPrimary ? 'Stars' : 'Termly',
    },
    {
      id: 'sims',
      feature: 'timetable',
      label: isPrimary ? 'Daily Adventure Schedule' : 'Class Timetable',
      icon: Clock,
    },
    {
      id: 'finance',
      feature: 'fees',
      label: isPrimary ? 'School Fees & Levies' : 'Tuition & Fees',
      icon: CreditCard,
    },
    {
      id: 'hostels',
      feature: 'hostels',
      label: 'Hostel Allocation',
      icon: Building2,
      badge: 'Live',
    },
    {
      id: 'profile',
      feature: 'profile',
      label: isPrimary ? 'Pupil Profile & ID' : isSecondary ? 'Student Bio & ID' : 'My Profile & ID',
      icon: UserCheck,
    },
  ];

  return allItems.filter((item) => {
    if (item.feature === 'home') return true;
    return isFeatureAllowed(norm, item.feature as DivisionFeature);
  });
}

interface StudentSidebarProps {
  isCollapsed?: boolean;
  onItemClick?: (item: StudentMenuItem) => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isCollapsed = false,
  onItemClick,
}) => {
  const { userSession, activeDivision, activeTab, setActiveTab } = useAppStore();
  const division = (userSession?.division || activeDivision || 'NCE').toUpperCase();
  const menuItems = getStudentNavItems(division);

  const handleClick = (item: StudentMenuItem) => {
    setActiveTab(item.id);
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <nav className="py-2 px-3 space-y-1.5" aria-label="Student Navigation">
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={`${item.id}-${item.feature}-${index}`}
            type="button"
            onClick={() => handleClick(item)}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-all group relative cursor-pointer ${
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
    </nav>
  );
};
