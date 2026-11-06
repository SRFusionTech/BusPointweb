import {
  IconBuildingCommunity,
  IconHistory,
  IconMapPin,
  IconLayoutDashboard,
  IconPackage,
  IconBus,
  IconRoute,
  IconSchool,
  IconUserCheck,
  IconUsersGroup,
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
    label: 'Live tracking',
    items: [
      { label: 'Live map', href: '/live', icon: IconMapPin },
      { label: 'Trip history', href: '/trips', icon: IconHistory },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { label: 'Buses', href: '/buses', icon: IconBus },
      { label: 'Routes', href: '/routes', icon: IconRoute },
      { label: 'Drivers', href: '/drivers', icon: IconUserCheck },
      { label: 'Parents', href: '/parents', icon: IconUsersGroup },
    ],
  },
  { label: 'School', items: [{ label: 'Classes', href: '/classes', icon: IconSchool }] },
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
