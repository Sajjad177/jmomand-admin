import Image from 'next/image';
import { CheckCircle2, QrCode, Search, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { AdminUser, Invoice } from '../features/admin-dashboard/types';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

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

function getQrImageSrc(value?: string) {
  const qrValue = value?.trim();

  if (!qrValue) return undefined;
  if (qrValue.startsWith('data:image/')) return qrValue;
  if (qrValue.startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrValue)}`;
  }

  return `data:image/png;base64,${qrValue}`;
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
  description,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-[95vw] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-6xl lg:max-w-7xl">
        <DialogHeader className="relative border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <DialogTitle className="pr-10 text-xl font-bold tracking-tight text-slate-950">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="mt-1 text-sm text-slate-500">
              {description}
            </DialogDescription>
          )}
          <DialogClose className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const isPaid = invoice.status === 'paid';
  const pickupQrSrc = getQrImageSrc(invoice.pickupQrDataUrl);

  return (
    <div className="space-y-6 pt-2 text-sm text-slate-700">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50 p-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Invoice Status
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge value={invoice.status} />
            {isPaid && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Paid on {formatDate(invoice.paidAt)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total Charged
          </p>
          <p className="text-lg font-bold text-slate-900">
            {currencyFormatter.format(invoice.totalAmount ?? invoice.amount ?? 0)}
          </p>
        </div>
      </div>

      {/* Product & Customer Details (2 Columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Customer Card */}
        <div className="rounded-lg border border-slate-200/80 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Customer Info
          </p>
          <p className="font-semibold text-slate-900">{fullName(invoice.customer) || 'N/A'}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {invoice.customer?.email || 'No email provided'}
          </p>
          {invoice.customer?._id && (
            <p className="text-[11px] font-mono text-slate-400 mt-2">ID: {invoice.customer._id}</p>
          )}
        </div>

        {/* Item Card */}
        <div className="rounded-lg border border-slate-200/80 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Item Purchased
          </p>
          <div className="flex items-center gap-3">
            {invoice.product?.images?.[0]?.url && (
              <img
                src={invoice.product.images[0].url}
                alt={invoice.product.title}
                className="h-10 w-10 rounded object-cover border border-slate-100"
              />
            )}
            <div>
              <p className="font-medium text-slate-900">
                {invoice.product?.title || 'Unknown Product'}
              </p>
              <p className="text-xs font-mono text-slate-500">SKU: {invoice.inventoryId || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="rounded-lg border border-slate-200/80 overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Payment Breakdown
          </p>
        </div>
        <div className="p-4 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{currencyFormatter.format(invoice.subtotal ?? invoice.amount ?? 0)}</span>
          </div>

          {Boolean(invoice.buyerPremiumAmount) && (
            <div className="flex justify-between text-slate-600">
              <span>{invoice.buyerPremiumLabel || "Buyer's Premium"}</span>
              <span>+{currencyFormatter.format(invoice.buyerPremiumAmount)}</span>
            </div>
          )}

          {Boolean(invoice.salesTaxAmount) && (
            <div className="flex justify-between text-slate-600">
              <span>
                Sales Tax ({invoice.stateTaxLabel || invoice.stateTaxState || 'State Tax'} @{' '}
                {invoice.stateTaxRate}%)
              </span>
              <span>+{currencyFormatter.format(invoice.salesTaxAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-between font-semibold text-slate-900 text-sm">
            <span>Total Amount</span>
            <span>{currencyFormatter.format(invoice.totalAmount ?? invoice.amount ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Pickup Verification Section */}
      <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-800">
            Pickup Authorization
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-base font-bold text-slate-900">
              {invoice.pickupCode || 'No Code Generated'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Present this code at pickup verification</p>
        </div>

        {pickupQrSrc ? (
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
            <Image
              src={pickupQrSrc}
              alt="Pickup QR code"
              width={144}
              height={144}
              className="h-32 w-32 rounded-md object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-slate-400">
            <QrCode className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Technical Meta Footer */}
      <div className="text-[11px] text-slate-400 font-mono space-y-1 border-t border-slate-100 pt-3">
        <p>
          Token Hash:{' '}
          {invoice.pickupTokenHash ? `${invoice.pickupTokenHash.slice(0, 20)}...` : 'N/A'}
        </p>
        {invoice.paymentFailureReason && (
          <p className="text-red-500">Failure Reason: {invoice.paymentFailureReason}</p>
        )}
      </div>
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

export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
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

// Dynamic End Date Calculation
export const calculateEndDate = (
  startDate: string,
  startTime: string,
  auctionDurationDays: number,
) => {
  if (!startDate || !startTime || !auctionDurationDays) return 'N/A';

  const start = new Date(`${startDate}T${startTime}`);
  if (isNaN(start.getTime())) return 'N/A';

  start.setDate(start.getDate() + Number(auctionDurationDays));
  return (
    start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ` ${startTime}`
  );
};
