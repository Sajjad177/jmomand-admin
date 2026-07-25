'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { Invoice } from '../../features/admin-dashboard/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getInvoices, verifyInvoicePickup } from '../../features/admin-dashboard/api';
import { toast } from 'sonner';
import {
  Badge,
  currencyFormatter,
  DetailDialog,
  formatDate,
  fullName,
  InvoiceDetail,
  PageShell,
  RecordsTable,
  SearchBox,
} from '../../lib/helper';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { QrCode, ShieldCheck } from 'lucide-react';

export function InvoicesAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [tokenOrCode, setTokenOrCode] = useState('');

  const invoicesQuery = useQuery({
    queryKey: ['adminInvoices'],
    queryFn: () => getInvoices(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyInvoicePickup(tokenOrCode, token),
    onSuccess: (result) => {
      toast.success(result?.message || 'Pickup code verified successfully!');
      setTokenOrCode('');
    },
    onError: (error: Error) => toast.error(error.message || 'Verification failed'),
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (invoicesQuery.data ?? []).filter((invoice: Invoice) => {
      const matchesStatus = status === 'all' || invoice.status === status;
      const matchesSearch =
        !query ||
        [
          invoice.invoiceNumber,
          fullName(invoice.customer),
          invoice.customer?.email,
          invoice.product?.title,
          invoice.inventoryId,
          invoice.pickupCode,
        ].some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [invoicesQuery.data, search, status]);

  return (
    <PageShell
      title="Invoices"
      count={invoicesQuery.data?.length ?? 0}
      actions={
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search invoice, customer, code..."
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-slate-400 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="void">Void</option>
          </select>
        </div>
      }
    >
      {/* Quick Pickup Verification Banner */}
      <div className="mb-6 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[#FF5A1F]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Verify Item Pickup</h3>
              <p className="text-xs text-slate-500">
                {`Enter the customer's pickup code or token to mark order as handed over.`}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Input
              value={tokenOrCode}
              onChange={(event) => setTokenOrCode(event.target.value)}
              placeholder="e.g. PU-839271"
              className="max-w-xs font-mono text-sm uppercase"
            />
            <Button
              disabled={!tokenOrCode.trim() || verifyMutation.isPending}
              onClick={() => verifyMutation.mutate()}
              className="bg-[#FF5A1F] hover:bg-[#e04e18] text-white shrink-0"
            >
              {verifyMutation.isPending ? 'Verifying...' : 'Verify Pickup'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <RecordsTable
        isLoading={invoicesQuery.isLoading}
        isError={invoicesQuery.isError}
        emptyLabel="No invoices found."
        headers={[
          'Invoice',
          'Customer',
          'Product',
          'Total Amount',
          'Status',
          'Paid At',
          'Pickup Code',
          'Actions',
        ]}
        rows={filtered.map((invoice: Invoice) => [
          // Invoice Number & Date
          <div key="invoice" className="flex flex-col">
            <span className="font-semibold text-slate-900 font-mono">
              {invoice.invoiceNumber || '-'}
            </span>
            <span className="text-xs text-slate-400">
              ID: {invoice._id ? `...${invoice._id.slice(-6)}` : '-'}
            </span>
          </div>,

          // Customer Info
          <div key="customer" className="flex flex-col">
            <p className="font-medium text-slate-900">
              {fullName(invoice.customer) || 'Guest Customer'}
            </p>
            <p className="text-xs text-slate-500">{invoice.customer?.email || '-'}</p>
          </div>,

          // Product Info with Thumbnail
          <div key="product" className="flex items-center gap-2.5">
            {invoice.product?.images?.[0]?.url ? (
              <img
                src={invoice.product.images[0].url}
                alt={invoice.product.title}
                className="h-9 w-9 rounded-md object-cover border border-slate-100 shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400 shrink-0">
                N/A
              </div>
            )}
            <div className="flex flex-col truncate max-w-[180px]">
              <p className="truncate font-medium text-slate-900">{invoice.product?.title || '-'}</p>
              <p className="text-xs font-mono text-slate-400">{invoice.inventoryId || '-'}</p>
            </div>
          </div>,

          // Total Amount
          <div key="amount" className="flex flex-col">
            <span className="font-semibold text-slate-900">
              {currencyFormatter.format(invoice.totalAmount ?? invoice.amount ?? 0)}
            </span>
            {invoice.salesTaxAmount ? (
              <span className="text-[10px] text-slate-400">
                Incl. {currencyFormatter.format(invoice.salesTaxAmount)} tax
              </span>
            ) : null}
          </div>,

          // Status Badge
          <Badge key="status" value={invoice.status} />,

          // Paid At
          <span key="paidAt" className="text-xs text-slate-600">
            {invoice.paidAt ? formatDate(invoice.paidAt) : '-'}
          </span>,

          // Pickup Code Badge
          <div key="pickup">
            {invoice.pickupCode ? (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                <QrCode className="h-3 w-3 text-slate-500" />
                {invoice.pickupCode}
              </span>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </div>,

          // View Action
          <Button
            key="view"
            variant="outline"
            size="sm"
            onClick={() => setSelected(invoice)}
            className="hover:border-slate-300 hover:bg-slate-50"
          >
            Details
          </Button>,
        ])}
      />

      {/* Details Dialog */}
      <DetailDialog
        title={`${selected?.invoiceNumber || ''}`}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        {selected && <InvoiceDetail invoice={selected} />}
      </DetailDialog>
    </PageShell>
  );
}
