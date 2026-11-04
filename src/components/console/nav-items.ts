import { IconBuildingCommunity, IconLayoutDashboard, type Icon } from '@tabler/icons-react';

export interface NavItem {
  label: string;
  href: string;
  icon: Icon;
}

/** School-admin sidebar navigation */
export const SCHOOL_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard },
];

/** Super-admin sidebar navigation */
export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/super-admin/dashboard', icon: IconLayoutDashboard },
  { label: 'Schools', href: '/super-admin/schools', icon: IconBuildingCommunity },
];
