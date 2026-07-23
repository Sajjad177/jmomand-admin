import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { fullName } from '../../lib/helper';
import { getUserDetails, getUsers, toggleUserBlock, toggleUserSuspension } from '../admin-dashboard/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useUsersAdmin() {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Fetch all users
    const usersQuery = useQuery({
        queryKey: ['adminUsers'],
        queryFn: () => getUsers(token),
        enabled: Boolean(token),
        staleTime: 60_000,
    });

    // Fetch single user details for modal
    const userDetailsQuery = useQuery({
        queryKey: ['adminUser', selectedId],
        queryFn: () => getUserDetails(selectedId || '', token),
        enabled: Boolean(token && selectedId),
    });

    // Suspend mutation
    const suspendMutation = useMutation({
        mutationFn: (userId: string) => toggleUserSuspension(userId, token),
        onSuccess: async (result: any) => {
            toast.success(result.message || 'User suspension updated');
            await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (error: Error) => toast.error(error.message),
    });

    // Block mutation
    const blockMutation = useMutation({
        mutationFn: (userId: string) => toggleUserBlock(userId, token),
        onSuccess: async (result: any) => {
            toast.success(result.message || 'User block status updated');
            await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (error: Error) => toast.error(error.message),
    });

    // Filter users by search
    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return usersQuery.data ?? [];

        return (usersQuery.data ?? []).filter((user: any) =>
            [fullName(user), user.email, user.role].some((value) =>
                value?.toLowerCase().includes(query)
            )
        );
    }, [search, usersQuery.data]);

    return {
        search,
        setSearch,
        selectedId,
        setSelectedId,
        usersQuery,
        userDetailsQuery,
        filteredUsers,
        suspendMutation,
        blockMutation,
    };
}