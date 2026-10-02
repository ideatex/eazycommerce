import { redirect } from 'next/navigation';
import { AuthEngine } from '@/lib/auth';
import { RBAC } from '@/lib/rbac';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { AdminTopBar } from '@/components/Admin/AdminTopBar';
import { AdminNavProvider } from '@/context/AdminNavContext';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await AuthEngine.getSessionUserFromCookies();

  if (!session || !RBAC.isAdminOrStaff(session.role)) {
    redirect('/signin?callbackUrl=/admin');
  }
  return (
    <AdminNavProvider>
      <div className="min-h-screen flex bg-neutral-100/70 font-sans text-neutral-900">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <AdminTopBar user={{ fullName: session.fullName, role: session.role }} />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </AdminNavProvider>
  );
}
