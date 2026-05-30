import Sidebar from '@/components/school-admin/sidebar';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#070914] overflow-hidden selection:bg-purple-500/30 selection:text-purple-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:p-10 p-6 pt-20 lg:pt-10 scroll-smooth">{children}</main>
    </div>
  );
}
