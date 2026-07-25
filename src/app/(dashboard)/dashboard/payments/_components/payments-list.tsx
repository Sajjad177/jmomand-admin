'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  CreditCard,
  Building2,
  Wallet,
  Copy,
  Check,
  RefreshCw,
  DollarSign,
  Receipt,
  ArrowUpDown,
} from 'lucide-react';
import { Pagination } from '../../../../../components/pagination';

interface Payment {
  date: string | null;
  transactionId: string | null;
  method: string;
  amount: number;
}

interface PaymentsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: Payment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}

const PAGE_LIMIT = 10;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
});

const amountFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// Helper component for method icons
function PaymentMethodBadge({ method }: { method: string | null | undefined }) {
  const normalized = method?.toLowerCase() || '';

  let Icon = CreditCard;
  let label = 'Credit Card';
  let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

  if (normalized.includes('bank') || normalized.includes('ach') || normalized.includes('wire')) {
    Icon = Building2;
    label = 'Bank Transfer';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (
    normalized.includes('wallet') ||
    normalized.includes('paypal') ||
    normalized.includes('stripe')
  ) {
    Icon = Wallet;
    label = 'Digital Wallet';
    badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (normalized) {
    label = normalized.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${badgeColor}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// Copy-to-clipboard helper for Transaction ID
function TransactionIdCell({ id }: { id: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!id) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
        Pending / Manual
      </span>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-center gap-2">
      <span className="font-mono text-xs font-medium text-slate-700">{id}</span>
      <button
        onClick={handleCopy}
        title="Copy Transaction ID"
        className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

export default function PaymentsList() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [page, setPage] = useState(1);

  const {
    data: responseData,
    error,
    isLoading,
    isFetching,
  } = useQuery<PaymentsResponse>({
    queryKey: ['payments', page, PAGE_LIMIT],
    queryFn: async () => {
      if (!token) throw new Error('Please login again');

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/payments?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to fetch payments');
      }

      return result;
    },
    enabled: Boolean(token),
    placeholderData: (previousData) => previousData,
  });

  const payments = responseData?.data ?? [];
  const meta = responseData?.meta;
  const totalPages = Math.max(meta?.totalPage ?? 1, 1);
  const total = meta?.total ?? 0;
  const limit = meta?.limit ?? PAGE_LIMIT;
  const firstEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastEntry = Math.min(page * limit, total);
  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  // Calculate page total volume
  const pageTotal = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Optional Top Summary Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page Volume
            </p>
            <p className="text-lg font-bold text-slate-900">{amountFormatter.format(pageTotal)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Transactions
            </p>
            <p className="text-lg font-bold text-slate-900">{total}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">Payment History</h3>
            {isFetching && !isLoading && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <span className="text-xs font-medium text-slate-500">
            Showing {payments.length} items
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">
                  <span className="flex items-center gap-1">
                    Date & Time
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </span>
                </th>
                <th className="px-5 py-3.5">Transaction ID</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="h-32 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                      <span>Loading payments...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="h-28 text-center text-red-500">
                    {error instanceof Error ? error.message : 'Unable to load payments.'}
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-28 text-center text-slate-400">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => {
                  const paymentDate = payment.date ? new Date(payment.date) : null;

                  return (
                    <tr
                      key={`${payment.transactionId || 'payment'}-${payment.date || index}`}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      {/* Date Cell */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {paymentDate ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {dateFormatter.format(paymentDate)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {timeFormatter.format(paymentDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Transaction ID */}
                      <td className="px-5 py-3.5">
                        <TransactionIdCell id={payment.transactionId} />
                      </td>

                      {/* Method Badge */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <PaymentMethodBadge method={payment.method} />
                      </td>

                      {/* Amount */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <span className="font-semibold text-slate-900">
                          {amountFormatter.format(payment.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Section */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/50 px-5 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Showing <span className="font-medium text-slate-700">{firstEntry}</span> to{' '}
            <span className="font-medium text-slate-700">{lastEntry}</span> of{' '}
            <span className="font-medium text-slate-700">{total}</span> entries
          </p>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </section>
    </div>
  );
}
