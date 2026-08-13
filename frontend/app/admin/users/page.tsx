'use client';

import { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Trash2,
  ShieldCheck,
  Zap,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAdminUsers, useCreateAdminUser, useDeleteAdminUser } from '@/api/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data, isLoading, refetch } = useAdminUsers();
  const createAdmin = useCreateAdminUser();
  const deleteAdmin = useDeleteAdminUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createAdmin.mutateAsync({ fullName, email, password, role });
      setModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create admin user';
      setError(msg);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete platform admin account "${name}"?`)) return;
    try {
      await deleteAdmin.mutateAsync(id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-indigo-400" />
            Platform Admin Users
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage Kunemi Commerce platform operators (`super_admin` & `admin` roles).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 gap-2"
            onClick={() => void refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          {isSuperAdmin && (
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium gap-2 shadow-lg shadow-indigo-600/20"
              onClick={() => setModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Platform Admin
            </Button>
          )}
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
            <span>Loading platform admins...</span>
          </div>
        ) : !data?.admins.length ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400">No platform admins found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Operator Name</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Platform Role</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {data.admins.map((operator) => {
                  const isSuper = operator.role === 'super_admin';
                  const isCurrent = operator.id === currentUser?.id;

                  return (
                    <tr key={operator.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white flex items-center gap-2">
                        {operator.fullName}
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{operator.email}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            isSuper
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 flex items-center gap-1 w-fit'
                              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 flex items-center gap-1 w-fit'
                          }
                        >
                          {isSuper ? (
                            <>
                              <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
                              Super Admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3 w-3 text-indigo-400" />
                              Admin
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(operator.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSuperAdmin && !isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2 gap-1.5"
                            onClick={() => handleDelete(operator.id, operator.fullName)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-400" />
                Add Platform Admin
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <Input
                  required
                  placeholder="e.g. Sarah Connor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. sarah.admin@kunemi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Initial Password</label>
                <Input
                  required
                  type="password"
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Platform Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
                  className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="admin">Platform Admin (Standard Operator)</option>
                  <option value="super_admin">Super Admin (Full Control)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAdmin.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  {createAdmin.isPending ? 'Creating...' : 'Create Admin User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
