'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { CalendarClock, Eye, Package, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api-client';
import {
  Badge,
  DetailDialog,
  formatDate,
  formatTime,
  fullName,
  PageShell,
  TableSkeleton,
  TableState,
} from '@/lib/helper';
import { Button } from '@/components/ui/button';
import { PickupRequestDetails } from './pickup-request-details';

export type PickupScheduleStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

type UserSummary = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  image?: { url?: string };
};

type AuctionSummary = {
  _id: string;
  auctionId?: string;
  title?: string;
  status?: string;
};

type ProductSummary = {
  _id: string;
  inventoryId?: string;
  title?: string;
  images?: Array<{ url?: string }>;
  image?: { url?: string } | string;
  category?: string;
  categoryImage?: { url?: string };
  condition?: string;
  price?: number;
};

type AuctionProductSummary = {
  _id: string;
  auctionId?: string;
  productId?: ProductSummary;
  startingBid?: number;
  bidIncrement?: number;
  status?: string;
  highestBid?: {
    bidder?: string;
    bid?: string;
    amount?: number;
    placedAt?: string;
  };
  paymentStatus?: string;
  pickupStatus?: string;
  paymentRetryCount?: number;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
  winner?: string;
  lastPaymentRetryAt?: string;
  soldPrice?: number;
};

export type PickupSchedule = {
  _id: string;
  userId?: UserSummary;
  auctionId?: AuctionSummary;
  auctionProductId?: AuctionProductSummary;
  status: PickupScheduleStatus;
  pickupDate?: string;
  pickupTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

const statusTabs: Array<{ value: 'all' | PickupScheduleStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function PickupRequests() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof statusTabs)[number]['value']>('all');
  const [selected, setSelected] = useState<PickupSchedule | null>(null);
  const [draftStatus, setDraftStatus] = useState<PickupScheduleStatus>('requested');

  const schedulesQuery = useQuery({
    queryKey: ['pickupSchedules'],
    queryFn: async () => (await apiRequest<PickupSchedule[]>('/pickup-schedules/all', token)).data,
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      scheduleId,
      nextStatus,
    }: {
      scheduleId: string;
      nextStatus: PickupScheduleStatus;
    }) =>
      apiRequest<PickupSchedule>(`/pickup-schedules/${scheduleId}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: async (result) => {
      toast.success(result.message || 'Pickup request status updated');
      const updatedSchedule = result.data;
      setSelected(updatedSchedule);
      setDraftStatus(updatedSchedule.status);
      await queryClient.invalidateQueries({ queryKey: ['pickupSchedules'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardReports'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (schedulesQuery.data ?? []).filter((schedule) => {
      const product = schedule.auctionProductId?.productId;
      const matchesStatus = status === 'all' || schedule.status === status;
      const matchesSearch =
        !query ||
        [
          fullName(schedule.userId),
          schedule.userId?.email,
          schedule.auctionId?.auctionId,
          schedule.auctionId?.title,
          product?.inventoryId,
          product?.title,
          schedule.status,
          schedule.pickupDate,
          schedule.pickupTime,
        ].some((value) => value?.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [schedulesQuery.data, search, status]);

  const requestedCount =
    schedulesQuery.data?.filter((schedule) => schedule.status === 'requested').length ?? 0;

  const openDetails = (schedule: PickupSchedule) => {
    setSelected(schedule);
    setDraftStatus(schedule.status);
  };

  const handleUpdateStatus = () => {
    if (!selected) return;
    updateStatus.mutate({ scheduleId: selected._id, nextStatus: draftStatus });
  };

  return (
    <PageShell
      title="Pickup Requests"
      count={schedulesQuery.data?.length ?? 0}
      actions={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[280px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, auction, product..."
              className="h-10 w-full rounded-lg border border-transparent bg-[#F5F7FA] pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-orange-500/10"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {statusTabs.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(item.value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  status === item.value
                    ? 'bg-[#FF5A1F] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Total Schedules"
          value={schedulesQuery.data?.length ?? 0}
        />
        <MetricCard
          icon={<UserRound className="h-5 w-5" />}
          label="Awaiting Review"
          value={requestedCount}
        />
        <MetricCard
          icon={<Package className="h-5 w-5" />}
          label="Visible Results"
          value={filtered.length}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Schedule List</h2>
              <p className="mt-1 text-xs text-slate-500">
                Showing {filtered.length} of {schedulesQuery.data?.length ?? 0} pickup requests
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Auction</th>
                <th className="px-5 py-4">Pickup Date</th>
                <th className="px-5 py-4">Pickup Time</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {schedulesQuery.isLoading ? (
                <TableSkeleton columns={7} rows={6} />
              ) : schedulesQuery.isError ? (
                <TableState colSpan={7} label="Unable to load pickup requests." />
              ) : filtered.length === 0 ? (
                <TableState colSpan={7} label="No pickup requests found." />
              ) : (
                filtered.map((schedule) => (
                  <PickupScheduleRow key={schedule._id} schedule={schedule} onView={openDetails} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDialog
        title="Pickup Request"
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        contentClassName="sm:max-w-[640px] lg:max-w-[640px]"
        bodyClassName="overflow-hidden p-0"
      >
        {selected && (
          <PickupRequestDetails
            schedule={selected}
            selectedStatus={draftStatus}
            isUpdating={updateStatus.isPending}
            onStatusChange={setDraftStatus}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </DetailDialog>
    </PageShell>
  );
}

function PickupScheduleRow({
  schedule,
  onView,
}: {
  schedule: PickupSchedule;
  onView: (schedule: PickupSchedule) => void;
}) {
  const product = schedule.auctionProductId?.productId;

  return (
    <tr className="transition-colors hover:bg-slate-50/70">
      <td className="px-5 py-4 align-top">
        <div className="min-w-0">
          <p className="max-w-[190px] truncate font-semibold text-slate-950">
            {fullName(schedule.userId)}
          </p>
          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
            {schedule.userId?.email || '-'}
          </p>
        </div>
      </td>

      <td className="px-5 py-4 align-top">
        <div className="min-w-0">
          <p className="max-w-[240px] truncate font-semibold text-slate-900">
            {product?.title || 'Product'}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400">{product?.inventoryId || '-'}</p>
        </div>
      </td>

      <td className="px-5 py-4 align-top">
        <div>
          <p className="max-w-[210px] truncate font-semibold text-slate-900">
            {schedule.auctionId?.title || '-'}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400">
            {schedule.auctionId?.auctionId || '-'}
          </p>
        </div>
      </td>

      <td className="px-5 py-4 align-top font-medium text-slate-700">
        {formatDate(schedule.pickupDate)}
      </td>

      <td className="px-5 py-4 align-top">
        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800">
          {formatTime(schedule.pickupTime)}
        </span>
      </td>

      <td className="px-5 py-4 align-top">
        <Badge value={schedule.status} />
      </td>

      <td className="px-5 py-4 text-right align-top">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(schedule)}
          className="h-9 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-950 hover:text-white"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
      </td>
    </tr>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#FF5A1F]">
          {icon}
        </div>
      </div>
    </div>
  );
}
