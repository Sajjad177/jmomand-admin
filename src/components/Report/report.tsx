'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { DateRange, getReports } from '../../features/admin-dashboard/api';
import { useQuery } from '@tanstack/react-query';
import { currencyFormatter, PageShell } from '../../lib/helper';
import { TrendingUp, Gavel, Package, Truck, Calendar } from 'lucide-react';

const PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7' },
  { label: '30 Days', value: '30' },
  { label: '90 Days', value: '90' },
];

interface MetricCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function MetricCard({ title, icon: Icon, children }: MetricCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DataRow({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-slate-500 capitalize">{label.replace(/_/g, ' ')}</span>
      <span className={`font-semibold ${highlight ? 'text-emerald-600 font-mono text-base' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-slate-50/50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 w-32 rounded bg-slate-200" />
        <div className="h-9 w-9 rounded-lg bg-slate-200" />
      </div>
      <div className="space-y-4">
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export function ReportsAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [preset, setPreset] = useState('all');

  const range = useMemo<DateRange>(() => {
    if (preset === 'all') return {};
    const now = new Date();
    const start = new Date(now);
    if (preset === 'today') start.setHours(0, 0, 0, 0);
    if (preset === '7') start.setDate(now.getDate() - 7);
    if (preset === '30') start.setDate(now.getDate() - 30);
    if (preset === '90') start.setDate(now.getDate() - 90);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }, [preset]);

  const reportsQuery = useQuery({
    queryKey: ['reportsPage', range],
    queryFn: () => getReports(range, token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const reports = reportsQuery.data;

  return (
    <PageShell
      title="Reports & Analytics"
      actions={
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <Calendar className="ml-2 h-4 w-4 text-slate-400" />
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                preset === p.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      {reportsQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : reportsQuery.isError || !reports ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 p-12 text-center">
          <p className="text-sm font-semibold text-red-800">Failed to load reports</p>
          <p className="mt-1 text-xs text-red-600">Please check your network connection or authentication credentials.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Revenue Metric */}
          <MetricCard title="Revenue Performance" icon={TrendingUp}>
            <DataRow label="Total Revenue" value={currencyFormatter.format(reports.revenue.totalRevenue)} highlight />
            <DataRow label="Paid Invoices" value={reports.revenue.paidInvoices} />
            <DataRow label="Average Order Value" value={currencyFormatter.format(reports.revenue.averageOrderValue)} />
          </MetricCard>

          {/* Auction Status Metric */}
          <MetricCard title="Auction Analytics" icon={Gavel}>
            <DataRow label="Winning Bids" value={currencyFormatter.format(reports.auctions.totalWinningBids)} highlight />
            {reports.auctions.byStatus.map((item) => (
              <DataRow key={item._id || 'unknown'} label={item._id || 'unknown'} value={item.count} />
            ))}
          </MetricCard>

          {/* Inventory Status Metric */}
          <MetricCard title="Inventory Breakdown" icon={Package}>
            {reports.inventory.map((item) => (
              <DataRow key={item._id || 'unknown'} label={item._id || 'unknown'} value={item.count} />
            ))}
          </MetricCard>

          {/* Pickup Status Metric */}
          <MetricCard title="Pickup & Logistics" icon={Truck}>
            {reports.pickups.byStatus.map((item) => (
              <DataRow
                key={item._id || 'unknown'}
                label={item._id || 'unknown'}
                value={`${item.appointments} appts / ${item.items} items`}
              />
            ))}
          </MetricCard>
        </div>
      )}
    </PageShell>
  );
}