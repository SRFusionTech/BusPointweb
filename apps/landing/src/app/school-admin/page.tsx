import { redirect } from 'next/navigation';

// Anyone landing on /school-admin goes straight to their dashboard. The
// sidebar's auth-guard sends unauthenticated users to /login.
export default function SchoolAdminRoot() {
  redirect('/school-admin/dashboard');
}
