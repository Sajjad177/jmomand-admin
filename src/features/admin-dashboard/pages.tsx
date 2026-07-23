'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Eye,
  MoreVertical,
  CreditCard,
  Loader2,
  Ban,
  UserX,
  UserCheck,
  Users,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserDetails, getUsers, toggleUserBlock, toggleUserSuspension } from './api';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserDetailsModal } from './UserDetailsModal';

import { formatDate, fullName, PageShell, SearchBox, TableState, TableSkeleton } from '../../lib/helper';

export function UsersAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  const usersQuery = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => getUsers(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const userDetailsQuery = useQuery({
    queryKey: ['adminUser', selectedId],
    queryFn: () => getUserDetails(selectedId || '', token),
    enabled: Boolean(token && selectedId),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => toggleUserSuspension(userId, token),
    onSuccess: async (result) => {
      toast.success(result.message || 'User suspension updated');
      await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => toggleUserBlock(userId, token),
    onSuccess: async (result) => {
      toast.success(result.message || 'User block status updated');
      await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return usersQuery.data ?? [];
    return (usersQuery.data ?? []).filter((user) =>
      [fullName(user), user.email, user.role].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [search, usersQuery.data]);

  useEffect(() => {
    console.log('Users shown in the table:', filteredUsers);
  }, [filteredUsers]);

  const displayedUsers = useMemo(() => {
    return filteredUsers.filter((user) => {
      if (roleFilter === 'all') return true;
      return user.role?.toLowerCase() === roleFilter;
    });
  }, [filteredUsers, roleFilter]);

  // Statistics calculation
  const totalCount = usersQuery.data?.length ?? 0;
  const activeCount = usersQuery.data?.filter((u) => !u.isBlocked && !u.isSuspend).length ?? 0;
  const suspendedCount = usersQuery.data?.filter((u) => u.isSuspend).length ?? 0;
  const blockedCount = usersQuery.data?.filter((u) => u.isBlocked).length ?? 0;

  return (
    <PageShell
      title="User Management"
      count={totalCount}
      actions={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(['all', 'user', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all ${roleFilter === role
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                {role}
              </button>
            ))}
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search users..." />
        </div>
      }
    >
      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Users"
          value={totalCount}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Active Users"
          value={activeCount}
          icon={UserCheck}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Suspended"
          value={suspendedCount}
          icon={AlertTriangle}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          title="Blocked"
          value={blockedCount}
          icon={ShieldAlert}
          color="text-rose-600"
          bgColor="bg-rose-50"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Verified</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersQuery.isLoading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : usersQuery.isError ? (
                <TableState colSpan={6} label="Unable to load users." />
              ) : displayedUsers.length === 0 ? (
                <TableState colSpan={6} label="No users found." />
              ) : (
                displayedUsers.map((user) => {
                  const isAdmin = user.role === 'admin';
                  const isSuspending =
                    suspendMutation.isPending && suspendMutation.variables === user._id;
                  const isBlocking =
                    blockMutation.isPending && blockMutation.variables === user._id;
                  const isUpdating = isSuspending || isBlocking;

                  return (
                    <tr key={user._id} className="transition-colors hover:bg-slate-50/50">
                      {/* User (Image + Initials + Name + Email) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.image?.url ? (
                            <img
                              src={user.image.url}
                              alt={fullName(user)}
                              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-100"
                            />
                          ) : (
                            <AvatarInitials user={user} />
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{fullName(user)}</p>
                            <p className="text-xs text-slate-400">{user.email || '-'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${isAdmin
                            ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20'
                            : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>

                      {/* Verified Status */}
                      <td className="px-6 py-4">
                        {user.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <UserCheck className="h-4 w-4" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-4">
                        {user.hasDefaultPaymentMethod ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                            <CreditCard className="h-3.5 w-3.5" /> Saved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-200">
                            <CreditCard className="h-3.5 w-3.5" /> None
                          </span>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td className="px-6 py-4">
                        {isUpdating ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/10 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Updating...
                          </span>
                        ) : user.isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Blocked
                          </span>
                        ) : user.isSuspend ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/10">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors"
                            onClick={() => setSelectedId(user._id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg transition-all z-[9999]"
                            >
                              <DropdownMenuItem
                                disabled={isAdmin || isUpdating}
                                onClick={() => suspendMutation.mutate(user._id)}
                                className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${user.isSuspend
                                  ? 'text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700'
                                  : 'text-amber-600 focus:bg-amber-50 focus:text-amber-700'
                                  }`}
                              >
                                {isSuspending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : user.isSuspend ? (
                                  <UserCheck className="h-4 w-4" />
                                ) : (
                                  <UserX className="h-4 w-4" />
                                )}
                                <span>
                                  {isSuspending
                                    ? 'Updating...'
                                    : user.isSuspend
                                      ? 'Unsuspend User'
                                      : 'Suspend User'}
                                </span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={isAdmin || isUpdating}
                                onClick={() => blockMutation.mutate(user._id)}
                                className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${user.isBlocked
                                  ? 'text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700'
                                  : 'text-rose-600 focus:bg-rose-50 focus:text-rose-700'
                                  }`}
                              >
                                {isBlocking ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : user.isBlocked ? (
                                  <UserCheck className="h-4 w-4" />
                                ) : (
                                  <Ban className="h-4 w-4" />
                                )}
                                <span>
                                  {isBlocking
                                    ? 'Updating...'
                                    : user.isBlocked
                                      ? 'Unblock User'
                                      : 'Block User'}
                                </span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        selectedId={selectedId}
        onClose={() => setSelectedId(null)}
        user={userDetailsQuery.data}
        isLoading={userDetailsQuery.isLoading}
      />
    </PageShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                            SUB-COMPONENTS (UI)                             */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-in">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-lg p-3 ${bgColor} ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function AvatarInitials({ user, className }: { user: any; className?: string }) {
  if (!user) return null;
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 ring-1 ring-slate-200 ${className}`}
    >
      {initials}
    </div>
  );
}
