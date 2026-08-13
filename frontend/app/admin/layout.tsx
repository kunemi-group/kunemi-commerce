import { ReactNode } from 'react';
import { AdminAuthGate } from '@/components/admin/admin-auth';
import { AdminNav } from '@/components/admin/admin-nav';

export const metadata = {
  title: 'Platform Super Admin | Kunemi Commerce',
  description: 'Executive Control Plane & Multi-Tenant Merchant Management',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGate>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <AdminNav />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto space-y-8">
          {children}
        </main>
      </div>
    </AdminAuthGate>
  );
}
