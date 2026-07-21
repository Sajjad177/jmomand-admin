import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { getNotifications, markAllNotificationsRead } from '../../features/admin-dashboard/api';
import { toast } from 'sonner';
import { PageShell } from '../../lib/helper';
import { Button } from '../ui/button';
import { ShieldCheck } from 'lucide-react';
import { NotificationItem } from './notificationHelper';
import { Pager } from '../pagination';

export function NotificationsAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const notificationsQuery = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotifications({ page }, token),
    enabled: Boolean(token),
    staleTime: 30_000,
  });
  const notifications = notificationsQuery.data?.data ?? [];
  const unread = notifications.filter((notification) => !notification.isViewed).length;

  const readMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onSuccess: async (result) => {
      toast.success(result.message || 'Notifications marked as read');
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageShell
      title="Notifications"
      count={notificationsQuery.data?.meta?.total ?? 0}
      actions={
        <Button
          variant="outline"
          disabled={readMutation.isPending || unread === 0}
          onClick={() => readMutation.mutate()}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Mark All Read
        </Button>
      }
    >
      <div className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
        <div className="divide-y divide-slate-100">
          {notificationsQuery.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Loading notifications...
            </p>
          ) : notificationsQuery.isError ? (
            <p className="px-4 py-10 text-center text-sm text-red-500">
              Unable to load notifications.
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <NotificationItem key={notification._id} notification={notification} />
            ))
          )}
        </div>
        <Pager
          page={page}
          totalPages={Math.max(notificationsQuery.data?.meta?.totalPage ?? 1, 1)}
          isFetching={notificationsQuery.isFetching}
          onPage={setPage}
        />
      </div>
    </PageShell>
  );
}

export interface NotificationItemType {
  _id: string;
  message?: string;
  type?: string;
  isViewed?: boolean;
  createdAt?: string;
}
