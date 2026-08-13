'use client';

import { useAdminMetrics } from '@/api/hooks/use-admin';
import {
  Store,
  Users,
  ShoppingBag,
  BadgeDollarSign,
  Globe,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const { data: metrics, isLoading, isError, refetch } = useAdminMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
        <p className="text-sm font-medium text-rose-300">
          Failed to load platform metrics from NestJS backend API.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold hover:bg-slate-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { overview, recentMerchants } = metrics;
  const formattedGmv = (overview.globalGmvCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Platform Overview</h1>
          <p className="text-sm text-slate-400">
            Real-time platform GMV volume, merchant tenant counts, and active edge routing status.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV Volume */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Platform GMV</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BadgeDollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">₦{formattedGmv}</div>
            <p className="text-xs text-slate-500 mt-1">Across all onboarded merchant stores</p>
          </div>
        </Card>

        {/* Total Businesses */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Merchants</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{overview.totalBusinesses}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-emerald-400 font-medium">{overview.activeBusinesses} Active</span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-rose-400 font-medium">{overview.suspendedBusinesses} Suspended</span>
            </div>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{overview.totalOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Platform order transactions</p>
          </div>
        </Card>

        {/* Custom Domains */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custom Edge Domains</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{overview.activeCustomDomains}</div>
            <p className="text-xs text-slate-500 mt-1">Cloudflare KV registered domains</p>
          </div>
        </Card>
      </div>

      {/* Recent Merchant Signups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recently Onboarded Stores</h2>
          <Link
            href="/admin/merchants"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All Merchants</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="divide-y divide-slate-800/60">
            {recentMerchants.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No merchant stores registered yet.</div>
            ) : (
              recentMerchants.map((merchant) => (
                <div key={merchant.id} className="p-4 flex items-center justify-between hover:bg-slate-900/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        <span>{merchant.name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase border-slate-700 bg-slate-800 text-slate-300">
                          {merchant.tier}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {merchant.storeSlug ? `/${merchant.storeSlug}` : 'No slug set'} • {merchant.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      className={
                        merchant.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }
                    >
                      {merchant.status}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(merchant.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
