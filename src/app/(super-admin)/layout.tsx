'use client';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { AdminShell } from '@/components/layout/AdminShell';
import { SUPER_ADMIN_NAV } from '@/components/layout/nav-items';

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
