'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { getUserDetails, getUsers, toggleUserBlock, toggleUserSuspension } from './api';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Badge, formatDate, fullName, PageShell, SearchBox, TableState } from '../../lib/helper';

export function UsersAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <PageShell
      title="User Management"
      count={usersQuery.data?.length ?? 0}
      actions={<SearchBox value={search} onChange={setSearch} placeholder="Search users..." />}
    >
      <div className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Status</th>
                {/* <th className="px-4 py-3">Joined</th> */}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {usersQuery.isLoading ? (
                <TableState colSpan={6} label="Loading users..." />
              ) : usersQuery.isError ? (
                <TableState colSpan={6} label="Unable to load users." />
              ) : filteredUsers.length === 0 ? (
                <TableState colSpan={6} label="No users found." />
              ) : (
                filteredUsers.map((user) => {
                  const status = user.isBlocked
                    ? 'blocked'
                    : user.isSuspend
                      ? 'suspended'
                      : 'active';
                  const isAdmin = user.role === 'admin';

                  return (
                    <tr key={user._id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{fullName(user)}</p>
                        <p className="text-xs text-gray-400">{user.email || '-'}</p>
                      </td>
                      <td className="px-4 py-4 capitalize">{user.role || 'user'}</td>
                      <td className="px-4 py-4">{user.isVerified ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-4">
                        <Badge value={status} />
                      </td>
                      {/* <td className="px-4 py-4">{formatDate(user.createdAt)}</td> */}
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedId(user._id)}
                          >
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAdmin || suspendMutation.isPending}
                            onClick={() => suspendMutation.mutate(user._id)}
                          >
                            {user.isSuspend ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAdmin || blockMutation.isPending}
                            onClick={() => blockMutation.mutate(user._id)}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </Button>
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
      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {userDetailsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading user details...</p>
          ) : (
            <div className="space-y-3 text-sm text-slate-600">
              {[
                ['Name', fullName(userDetailsQuery.data)],
                ['Email', userDetailsQuery.data?.email || '-'],
                ['Phone', userDetailsQuery.data?.phone || '-'],
                [
                  'Address',
                  [
                    userDetailsQuery.data?.street,
                    userDetailsQuery.data?.location,
                    userDetailsQuery.data?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ') || '-',
                ],
                ['Role', userDetailsQuery.data?.role || '-'],
                [
                  'Default Payment',
                  userDetailsQuery.data?.hasDefaultPaymentMethod ? 'Saved' : 'Not saved',
                ],
                ['Member Since', formatDate(userDetailsQuery.data?.createdAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-6 border-b border-slate-100 pb-2"
                >
                  <span className="font-medium text-slate-900">{label}</span>
                  <span className="text-right">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
