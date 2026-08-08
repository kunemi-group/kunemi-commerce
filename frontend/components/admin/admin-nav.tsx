'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Store,
  Globe,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    title: 'Platform Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Merchants & Stores',
    href: '/admin/merchants',
    icon: Store,
  },
  {
    title: 'Custom Domains',
    href: '/admin/domains',
    icon: Globe,
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between p-4 min-h-screen text-slate-100">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white font-bold">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">Kunemi Platform</h1>
            <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400 fill-amber-400" /> Super Admin
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60',
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-indigo-400' : 'text-slate-400')} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="px-2">
          <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'Super Admin'}</p>
          <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4 text-slate-400" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
