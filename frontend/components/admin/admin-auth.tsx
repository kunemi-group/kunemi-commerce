'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seedAdminAccount } from '@/api/services/admin';

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
          <span className="text-sm font-medium">Verifying super admin credentials...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Super Admin Authorization Required</h2>
            <p className="text-sm text-slate-400">
              This surface is reserved exclusively for Kunemi Commerce platform operators. You are currently logged in as{' '}
              <span className="font-semibold text-slate-200">{user?.email || 'Guest'}</span> ({user?.role || 'unauthenticated'}).
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              Sign In as Super Admin
            </Button>

            <Button
              variant="outline"
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              onClick={async () => {
                try {
                  const res = await seedAdminAccount();
                  alert(`Seed Result: ${res.message}\nEmail: ${res.email}\nDefault Password: admin123`);
                } catch {
                  alert('Could not trigger seed. Ensure API is running.');
                }
              }}
            >
              Seed Admin Account (Dev)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
