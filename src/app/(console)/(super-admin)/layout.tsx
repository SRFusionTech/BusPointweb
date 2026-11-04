'use client';

import { AuthGuard } from '@/components/console/AuthGuard';
import { AdminShell } from '@/components/console/AdminShell';
import { SUPER_ADMIN_NAV } from '@/components/console/nav-items';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="super_admin">
      {/* showAccountLinks=false: super admin has only logout */}
      <AdminShell navItems={SUPER_ADMIN_NAV} showAccountLinks={false}>
        {children}
      </AdminShell>
    </AuthGuard>
  );
}
