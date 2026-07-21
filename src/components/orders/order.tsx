'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { Order } from '../../features/admin-dashboard/types';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../features/admin-dashboard/api';
import {
  Badge,
  currencyFormatter,
  DetailDialog,
  formatDate,
  fullName,
  PageShell,
  RecordsTable,
  SearchBox,
} from '../../lib/helper';
import { Button } from '../ui/button';
import { OrderDetail } from './orderHelper';

export function OrdersAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const ordersQuery = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => getOrders(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (ordersQuery.data ?? []).filter((order) => {
      const matchesStatus = status === 'all' || order.status === status;
      const matchesSearch =
        !query ||
        [order.orderNumber, fullName(order.customer), order.customer?.email, order.pickupCode].some(
          (value) => value?.toLowerCase().includes(query),
        );
      return matchesStatus && matchesSearch;
    });
  }, [ordersQuery.data, search, status]);

  return (
    <PageShell
      title="Orders"
      count={ordersQuery.data?.length ?? 0}
      actions={
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBox value={search} onChange={setSearch} placeholder="Search orders..." />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      }
    >
      <RecordsTable
        isLoading={ordersQuery.isLoading}
        isError={ordersQuery.isError}
        emptyLabel="No orders found."
        headers={['Order', 'Customer', 'Items', 'Total', 'Status', 'Paid At', 'Pickup', '']}
        rows={filtered.map((order) => [
          order.orderNumber || '-',
          <div key="customer">
            <p className="font-medium text-gray-900">{fullName(order.customer)}</p>
            <p className="text-xs text-gray-400">{order.customer?.email || '-'}</p>
          </div>,
          `${order.items?.length ?? 0} items`,
          currencyFormatter.format(order.totalAmount ?? 0),
          <Badge key="status" value={order.status} />,
          formatDate(order.paidAt),
          <span key="pickup" className="font-mono font-semibold">
            {order.pickupCode || '-'}
          </span>,
          <Button key="view" variant="outline" size="sm" onClick={() => setSelected(order)}>
            View
          </Button>,
        ])}
      />
      <DetailDialog
        title="Order Details"
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        {selected && <OrderDetail order={selected} />}
      </DetailDialog>
    </PageShell>
  );
}
