import Sidebar from '@/components/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#030408] overflow-hidden selection:bg-sky-500/30 selection:text-sky-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:p-10 p-6 pt-20 lg:pt-10 scroll-smooth">{children}</main>
    </div>
  );
}
