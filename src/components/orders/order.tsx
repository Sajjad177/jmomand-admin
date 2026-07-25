'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Package, Search, Truck } from 'lucide-react';
import { Order } from '../../features/admin-dashboard/types';
import { getOrders } from '../../features/admin-dashboard/api';
import {
  Badge,
  currencyFormatter,
  DetailDialog,
  formatDate,
  fullName,
  PageShell,
  SearchBox,
  TableSkeleton,
  TableState,
} from '../../lib/helper';
import { Button } from '../ui/button';
import { OrderDetail } from './orderHelper';

const orderStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

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
      const firstProduct = order.items?.[0]?.product;
      const matchesStatus = status === 'all' || order.status === status;
      const matchesSearch =
        !query ||
        [
          order.orderNumber,
          fullName(order.customer),
          order.customer?.email,
          order.pickupCode,
          firstProduct?.title,
          firstProduct?.inventoryId,
        ].some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [ordersQuery.data, search, status]);

  return (
    <PageShell
      title="Orders"
      count={ordersQuery.data?.length ?? 0}
      actions={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBox value={search} onChange={setSearch} placeholder="Search orders..." />
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {orderStatuses.map((item) => (
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
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Order List</h2>
              <p className="mt-1 text-xs text-slate-500">
                Showing {filtered.length} of {ordersQuery.data?.length ?? 0} orders
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Search className="h-3.5 w-3.5" />
              Search by order, customer, pickup code, or product
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Pickup</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {ordersQuery.isLoading ? (
                <TableSkeleton columns={7} rows={6} />
              ) : ordersQuery.isError ? (
                <TableState colSpan={7} label="Unable to load orders." />
              ) : filtered.length === 0 ? (
                <TableState colSpan={7} label="No orders found." />
              ) : (
                filtered.map((order) => (
                  <OrderRow key={order._id} order={order} onView={setSelected} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDialog
        title="Order Details"
        description="Review customer, pickup, and item information for this order."
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        {selected && <OrderDetail order={selected} />}
      </DetailDialog>
    </PageShell>
  );
}

function OrderRow({ order, onView }: { order: Order; onView: (order: Order) => void }) {
  const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity ?? 1), 0) ?? 0;
  const firstItem = order.items?.[0];
  const product = firstItem?.product;
  const imageUrl = product?.images?.[0]?.url || product?.categoryImage?.url;

  return (
    <tr className="transition-colors hover:bg-slate-50/70">
      <td className="px-5 py-4 align-top">
        <div>
          <p className="font-bold text-slate-950">{order.orderNumber || '-'}</p>
          <p className="mt-1 text-xs text-slate-400">{formatDate(order.createdAt, true)}</p>
        </div>
      </td>

      <td className="px-5 py-4 align-top">
        <div className="min-w-0">
          <p className="max-w-[190px] truncate font-semibold text-slate-900">
            {fullName(order.customer)}
          </p>
          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
            {order.customer?.email || '-'}
          </p>
        </div>
      </td>

      <td className="px-5 py-4 align-top">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product?.title || 'Product image'}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="max-w-[210px] truncate font-semibold text-slate-900">
              {product?.title || 'Product'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {itemCount} item{itemCount === 1 ? '' : 's'}
              {product?.inventoryId ? ` • ${product.inventoryId}` : ''}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 align-top">
        <p className="font-bold text-slate-950">
          {currencyFormatter.format(order.totalAmount ?? 0)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {firstItem?.quantity ?? 0} x{' '}
          {currencyFormatter.format(firstItem?.price ?? product?.price ?? 0)}
        </p>
      </td>

      <td className="px-5 py-4 align-top">
        <Badge value={order.status} />
      </td>

      <td className="px-5 py-4 align-top">
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
          <Truck className="h-3.5 w-3.5 text-[#FF5A1F]" />
          <span className="font-mono text-xs font-bold text-slate-800">
            {order.pickupCode || '-'}
          </span>
        </div>
      </td>

      <td className="px-5 py-4 text-right align-top">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(order)}
          className="h-9 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-950 hover:text-white"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
      </td>
    </tr>
  );
}
