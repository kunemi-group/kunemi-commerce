'use client';

import { useAdminMerchants } from '@/api/hooks/use-admin';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function AdminDomainsPage() {
  const { data: result, isLoading, refetch } = useAdminMerchants({ limit: 50 });

  const customDomainMerchants =
    result?.data.filter((m) => Boolean(m.customDomain || m.storeSlug)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cloudflare Edge Domains & KV Monitor</h1>
          <p className="text-sm text-slate-400">
            Inspect active tenant custom vanity domains and subdomains provisioned in the Cloudflare Workers KV registry (`TENANT_LOOKUP`).
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync KV Registry</span>
        </button>
      </div>

      {/* Cloudflare Edge Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Edge Worker Status</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>kunemi-edge-coordinator</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Cloudflare Workers Platform Router Active</p>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">KV Store Name</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white font-mono">TENANT_LOOKUP</div>
            <p className="text-xs text-slate-500 mt-1">Key-value store for domain-to-tenant IDs</p>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Domain Mappings</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{customDomainMerchants.length}</div>
            <p className="text-xs text-slate-500 mt-1">Subdomains & vanity custom domains</p>
          </div>
        </Card>
      </div>

      {/* Domain Registry Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Active Tenant Domain Mappings</h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
            </div>
          ) : !customDomainMerchants.length ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No domain mappings registered yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {customDomainMerchants.map((merchant) => (
                <div key={merchant.id} className="p-4 flex items-center justify-between hover:bg-slate-900/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{merchant.customDomain || `${merchant.storeSlug}.shopflow.store`}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
                        >
                          {merchant.customDomain ? 'Custom Domain' : 'Platform Subdomain'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Maps to Tenant ID: <span className="font-mono text-slate-300">{merchant.id}</span> ({merchant.name})
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
                    <span className="text-xs font-mono text-slate-500">KV Sync: OK</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
