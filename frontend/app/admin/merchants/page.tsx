'use client';

import { useState } from 'react';
import {
  useAdminMerchants,
  useSetCustomDomain,
  useUpdateMerchantStatus,
  useUpdateMerchantTier,
} from '@/api/hooks/use-admin';
import {
  Search,
  Building2,
  RefreshCw,
  Globe,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminMerchantsPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [customDomainInput, setCustomDomainInput] = useState<string>('');

  const { data: result, isLoading, refetch } = useAdminMerchants({
    search: search.trim() || undefined,
    tier: tierFilter || undefined,
    status: statusFilter || undefined,
  });

  const updateStatus = useUpdateMerchantStatus();
  const updateTier = useUpdateMerchantTier();
  const setCustomDomain = useSetCustomDomain();

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (confirm(`Are you sure you want to change store status to ${newStatus}?`)) {
      updateStatus.mutate({ id, status: newStatus });
    }
  };

  const handleTierChange = (id: string, tier: 'starter' | 'growth' | 'scale') => {
    updateTier.mutate({ id, tier });
  };

  const handleSaveCustomDomain = (id: string) => {
    setCustomDomain.mutate(
      { id, customDomain: customDomainInput.trim() || null },
      {
        onSuccess: () => {
          setSelectedMerchantId(null);
          setCustomDomainInput('');
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Directory & Stores</h1>
        <p className="text-sm text-slate-400">
          Manage all onboarded business stores, subscription tiers, custom vanity domains, and store suspension controls.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search merchants by store name, email, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="scale">Scale</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
          </div>
        ) : !result?.data.length ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No merchant stores found matching your search query.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {result.data.map((merchant) => (
              <div key={merchant.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/80 transition-colors">
                {/* Left: Info */}
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <Building2 className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-white">{merchant.name}</span>
                      <select
                        value={merchant.tier}
                        onChange={(e) =>
                          handleTierChange(
                            merchant.id,
                            e.target.value as 'starter' | 'growth' | 'scale',
                          )
                        }
                        className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-[11px] font-semibold text-slate-200 uppercase cursor-pointer"
                      >
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      Slug: <span className="font-semibold text-slate-200">/{merchant.storeSlug || 'none'}</span> • {merchant.email || 'No email'} • Currency: {merchant.currency}
                    </p>

                    {merchant.customDomain && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-300">
                        <Globe className="h-3.5 w-3.5" />
                        <span>{merchant.customDomain}</span>
                        <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                          {merchant.customDomainStatus || 'verified'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status & Actions */}
                <div className="flex items-center gap-3 justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                  <div className="text-right text-xs text-slate-400 hidden sm:block">
                    <div>{merchant.staffCount} Staff Members</div>
                    <div>{merchant.orderCount} Orders</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Custom Domain Modal Trigger */}
                    {selectedMerchantId === merchant.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="e.g. shop.brand.com"
                          value={customDomainInput}
                          onChange={(e) => setCustomDomainInput(e.target.value)}
                          className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-100 w-44"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-2 bg-indigo-600 hover:bg-indigo-500 text-xs"
                          onClick={() => handleSaveCustomDomain(merchant.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs text-slate-400"
                          onClick={() => setSelectedMerchantId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-800 bg-slate-900 text-xs text-slate-300 hover:bg-slate-800 gap-1.5"
                        onClick={() => {
                          setSelectedMerchantId(merchant.id);
                          setCustomDomainInput(merchant.customDomain || '');
                        }}
                      >
                        <Globe className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Domain</span>
                      </Button>
                    )}

                    {/* Status Toggle */}
                    <Button
                      size="sm"
                      variant={merchant.status === 'active' ? 'destructive' : 'default'}
                      className={
                        merchant.status === 'active'
                          ? 'h-8 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold'
                          : 'h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold'
                      }
                      onClick={() => handleToggleStatus(merchant.id, merchant.status)}
                    >
                      {merchant.status === 'active' ? 'Suspend Store' : 'Activate Store'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
