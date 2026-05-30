import { redirect } from 'next/navigation';

// Anyone landing on /super-admin goes through the unified /login. The
// dashboard sidebar's own auth-guard will bounce back here on signout.
export default function SuperAdminRoot() {
  redirect('/super-admin/dashboard');
}
