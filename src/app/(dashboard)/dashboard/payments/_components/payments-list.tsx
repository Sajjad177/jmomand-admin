"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";

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

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const amountFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatMethod(method: string | null | undefined) {
  if (!method) return "—";
  if (method.toLowerCase() === "card") return "Credit Card";

  return method
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function PaymentsList() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [page, setPage] = useState(1);

  const { data: responseData, error, isLoading, isFetching } =
    useQuery<PaymentsResponse>({
      queryKey: ["payments", page, PAGE_LIMIT],
      queryFn: async () => {
        if (!token) throw new Error("Please login again");

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
          throw new Error(result.message || "Failed to fetch payments");
        }

        return result;
      },
      enabled: Boolean(token),
      placeholderData: (previousData) => previousData,
    });

  const payments = responseData?.data ?? [];
  const meta = responseData?.meta;
  const currentPage = meta?.page ?? page;
  const totalPages = Math.max(meta?.totalPage ?? 1, 1);
  const total = meta?.total ?? 0;
  const limit = meta?.limit ?? PAGE_LIMIT;
  const firstEntry = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastEntry = Math.min(currentPage * limit, total);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <section className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="bg-[#eaf1fc] text-sm font-medium uppercase text-[#0b3b47]">
              <th className="w-[31%] px-4 py-[18px]">Date</th>
              <th className="w-[28%] px-4 py-[18px]">Transaction ID</th>
              <th className="w-[25%] px-4 py-[18px]">Method</th>
              <th className="w-[16%] px-4 py-[18px]">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d7e2f2] text-base text-[#111111]">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="h-16 px-4 text-center text-sm text-slate-500">
                  Loading payments...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="h-16 px-4 text-center text-sm text-red-600">
                  {error instanceof Error ? error.message : "Unable to load payments."}
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="h-16 px-4 text-center text-sm text-slate-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((payment, index) => (
                <tr
                  key={`${payment.transactionId || "payment"}-${payment.date || index}`}
                  className="h-[63px] transition-colors hover:bg-slate-50/70"
                >
                  <td className="whitespace-nowrap px-4 py-4">
                    {payment.date ? dateFormatter.format(new Date(payment.date)) : "—"}
                  </td>
                  <td className="px-4 py-4 font-medium">{payment.transactionId || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-4">{formatMethod(payment.method)}</td>
                  <td className="whitespace-nowrap px-4 py-4">{amountFormatter.format(payment.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex min-h-[62px] flex-col items-center justify-between gap-4 border-t border-[#d7e2f2] px-4 py-3 sm:flex-row">
        <p className="text-sm text-slate-500">
          Showing {firstEntry} to {lastEntry} of {total} entries
        </p>

        {totalPages > 1 && (
          <div className="flex items-center" aria-label="Payments pagination">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1 || isFetching}
              className="h-8 rounded-l border border-[#d7e2f2] px-3 text-sm text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                disabled={isFetching}
                aria-current={currentPage === pageNumber ? "page" : undefined}
                className={`-ml-px h-8 min-w-9 border px-2 text-sm transition-colors ${
                  currentPage === pageNumber
                    ? "z-10 border-[#0647b5] bg-[#0647b5] text-white"
                    : "border-[#d7e2f2] bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages || isFetching}
              className="-ml-px h-8 rounded-r border border-[#d7e2f2] px-3 text-sm text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
