'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { DateRange, getReports } from '../../features/admin-dashboard/api';
import { useQuery } from '@tanstack/react-query';
import { currencyFormatter, PageShell, ReportCard } from '../../lib/helper';

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
        <select
          value={preset}
          onChange={(event) => setPreset(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      }
    >
      {reportsQuery.isLoading ? (
        <div className="rounded-lg border border-[#d7e2f2] bg-white p-10 text-center text-sm text-slate-500">
          Loading reports...
        </div>
      ) : reportsQuery.isError || !reports ? (
        <div className="rounded-lg border border-[#d7e2f2] bg-white p-10 text-center text-sm text-red-500">
          Unable to load reports.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <ReportCard
            title="Revenue"
            rows={[
              ['Total Revenue', currencyFormatter.format(reports.revenue.totalRevenue)],
              ['Paid Invoices', String(reports.revenue.paidInvoices)],
              ['Average Order Value', currencyFormatter.format(reports.revenue.averageOrderValue)],
            ]}
          />
          <ReportCard
            title="Auction Status"
            rows={[
              ['Winning Bids', currencyFormatter.format(reports.auctions.totalWinningBids)],
              ...reports.auctions.byStatus.map((item) => [
                item._id || 'unknown',
                String(item.count),
              ]),
            ]}
          />
          <ReportCard
            title="Inventory Status"
            rows={reports.inventory.map((item) => [item._id || 'unknown', String(item.count)])}
          />
          <ReportCard
            title="Pickup Status"
            rows={reports.pickups.byStatus.map((item) => [
              item._id || 'unknown',
              `${item.appointments} appointments, ${item.items} items`,
            ])}
          />
        </div>
      )}
    </PageShell>
  );
}
