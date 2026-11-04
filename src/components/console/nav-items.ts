import {
  IconBuildingCommunity,
  IconLayoutDashboard,
  IconPackage,
  IconBus,
  IconRoute,
  IconUserCheck,
  type Icon,
} from '@tabler/icons-react';

export interface NavItem {
  label: string;
  href: string;
  icon: Icon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** School-admin sidebar navigation */
export const SCHOOL_ADMIN_NAV: NavSection[] = [
  { label: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard }] },
  {
    label: 'Fleet',
    items: [
      { label: 'Buses', href: '/buses', icon: IconBus },
      { label: 'Routes', href: '/routes', icon: IconRoute },
      { label: 'Drivers', href: '/drivers', icon: IconUserCheck },
    ],
  },
];

/** Super-admin sidebar navigation */
export const SUPER_ADMIN_NAV: NavSection[] = [
  { label: 'Overview', items: [{ label: 'Dashboard', href: '/super-admin/dashboard', icon: IconLayoutDashboard }] },
  {
    label: 'Management',
    items: [
      { label: 'Schools', href: '/super-admin/schools', icon: IconBuildingCommunity },
      { label: 'Plans', href: '/super-admin/plans', icon: IconPackage },
    ],
  },
];
