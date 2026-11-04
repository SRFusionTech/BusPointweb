'use client';

import { AuthGuard } from '@/components/console/AuthGuard';
import { AdminShell } from '@/components/console/AdminShell';
import { SCHOOL_ADMIN_NAV } from '@/components/console/nav-items';

export default function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="school_admin">
      <AdminShell nav={SCHOOL_ADMIN_NAV} showAccountLinks>
        {children}
      </AdminShell>
    </AuthGuard>
  );
}
