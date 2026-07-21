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
    onSuccess: (result) => toast.success(result.message || 'Pickup code verified'),
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (invoicesQuery.data ?? []).filter((invoice) => {
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
          <SearchBox value={search} onChange={setSearch} placeholder="Search invoices..." />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="paid">Paid</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="void">Void</option>
          </select>
        </div>
      }
    >
      <div className="rounded-lg border border-[#d7e2f2] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={tokenOrCode}
            onChange={(event) => setTokenOrCode(event.target.value)}
            placeholder="Enter pickup token or code"
          />
          <Button
            disabled={!tokenOrCode.trim() || verifyMutation.isPending}
            onClick={() => verifyMutation.mutate()}
            className="bg-[#FF5A1F] hover:bg-[#e04e18]"
          >
            Verify Pickup
          </Button>
        </div>
      </div>
      <RecordsTable
        isLoading={invoicesQuery.isLoading}
        isError={invoicesQuery.isError}
        emptyLabel="No invoices found."
        headers={['Invoice', 'Customer', 'Product', 'Amount', 'Status', 'Paid At', 'Pickup', '']}
        rows={filtered.map((invoice) => [
          invoice.invoiceNumber || '-',
          <div key="customer">
            <p className="font-medium text-gray-900">{fullName(invoice.customer)}</p>
            <p className="text-xs text-gray-400">{invoice.customer?.email || '-'}</p>
          </div>,
          <div key="product">
            <p className="font-medium text-gray-900">{invoice.product?.title || '-'}</p>
            <p className="text-xs text-gray-400">{invoice.inventoryId || '-'}</p>
          </div>,
          currencyFormatter.format(invoice.amount ?? 0),
          <Badge key="status" value={invoice.status} />,
          formatDate(invoice.paidAt),
          <span key="pickup" className="font-mono font-semibold">
            {invoice.pickupCode || '-'}
          </span>,
          <Button key="view" variant="outline" size="sm" onClick={() => setSelected(invoice)}>
            View
          </Button>,
        ])}
      />
      <DetailDialog
        title="Invoice Details"
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        {selected && <InvoiceDetail invoice={selected} />}
      </DetailDialog>
    </PageShell>
  );
}
