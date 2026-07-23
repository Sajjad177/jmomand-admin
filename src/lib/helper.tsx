import { Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { AdminUser, Invoice } from '../features/admin-dashboard/types';

import { Dialog } from '@radix-ui/react-dialog';
import { DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function PageShell({
  title,
  count,
  actions,
  children,
}: {
  title: string;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#FF5A1F]">Admin Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {title}
            {typeof count === 'number' && <span className="ml-2 text-[#FF5A1F]">({count})</span>}
          </h1>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-[260px]">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg bg-[#F5F7FA] pr-10 text-sm"
      />
      <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
    </div>
  );
}

export function TableState({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {label}
      </td>
    </tr>
  );
}

export function Badge({ value }: { value?: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(value)}`}
    >
      {(value || 'unknown').replace(/_/g, ' ')}
    </span>
  );
}

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
});

export const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function fullName(user?: AdminUser) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return name || user?.email || 'Unknown';
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return withTime ? dateTimeFormatter.format(date) : dateFormatter.format(date);
}


export function statusClass(status?: string) {
  if (['paid', 'active', 'completed', 'scheduled'].includes(status || '')) {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (['failed', 'payment_failed', 'cancelled', 'blocked', 'suspended'].includes(status || '')) {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-slate-100 text-slate-700';
}

export function RecordsTable({
  headers,
  rows,
  isLoading,
  isError,
  emptyLabel,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  isLoading?: boolean;
  isError?: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
            {isLoading ? (
              <TableState colSpan={headers.length} label="Loading records..." />
            ) : isError ? (
              <TableState colSpan={headers.length} label="Unable to load records." />
            ) : rows.length === 0 ? (
              <TableState colSpan={headers.length} label={emptyLabel} />
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50/60">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DetailDialog({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  return (
    <div className="space-y-4 text-sm text-slate-600">
      <ReportCard
        title={invoice.invoiceNumber || 'Invoice'}
        rows={[
          ['Customer', fullName(invoice.customer)],
          ['Email', invoice.customer?.email || '-'],
          ['Product', invoice.product?.title || '-'],
          ['Inventory ID', invoice.inventoryId || '-'],
          ['Auction', invoice.auction?.title || invoice.auction?._id || '-'],
          ['Status', invoice.status || '-'],
          ['Amount', currencyFormatter.format(invoice.amount ?? 0)],
          ['Pickup Code', invoice.pickupCode || '-'],
          ['Stripe Payment', invoice.stripePaymentIntentId || '-'],
          ['Failure Reason', invoice.paymentFailureReason || '-'],
        ]}
      />
    </div>
  );
}

export function ReportCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#d7e2f2] bg-white p-6">
      <h2 className="break-words text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No data available.</p>
        ) : (
          rows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-2 border-b border-slate-100 pb-2 text-sm sm:grid-cols-[150px_minmax(0,1fr)]"
            >
              <span className="capitalize text-slate-500">{label.replace(/_/g, ' ')}</span>
              <span className="min-w-0 break-all text-left font-semibold text-slate-950 sm:text-right">
                {value}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TableSkeleton({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse border-b border-slate-100">
          {Array.from({ length: columns }).map((_, colIndex) => {
            if (colIndex === 0) {
              return (
                <td key={colIndex} className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                      <div className="h-3 bg-slate-200 rounded w-36 animate-pulse" />
                    </div>
                  </div>
                </td>
              );
            }
            const widths = ['w-12', 'w-16', 'w-20', 'w-24', 'w-28'];
            const randomWidth = widths[(colIndex + rowIndex) % widths.length];
            return (
              <td key={colIndex} className="px-6 py-4">
                <div className={`h-4 bg-slate-200 rounded ${randomWidth} animate-pulse`} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
