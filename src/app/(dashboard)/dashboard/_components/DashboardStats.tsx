"use client";

import React from "react"
import { useDashboardReports } from "@/features/dashboard/use-dashboard-reports"

interface StatCardProps {
  title: string
  value?: string | number
  timeframeText?: string
  comparisonText?: string
  comparisonValue?: string
  children?: React.ReactNode
}

// A reusable Card component styled to match the image
const StatCard = ({
  title,
  value,
  timeframeText = "Last 7 days",
  comparisonText = "Previous 7days",
  comparisonValue,
  children,
}: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[180px] w-full transition-all hover:shadow-md">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-[17px] tracking-tight">
            {title}
          </h3>
          <button className="text-[11px] font-medium text-orange-500 border border-orange-200 bg-orange-50/30 rounded-full px-3 py-1 hover:bg-orange-50 transition-colors">
            Details
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">{timeframeText}</p>
      </div>

      {children ? (
        children
      ) : (
        <div className="mt-4">
          <div className="text-[32px] font-bold text-[#063339] leading-none tracking-tight">
            {value}
          </div>
          {comparisonValue && (
            <p className="text-xs font-medium text-slate-400 mt-2">
              {comparisonText}{" "}
              <span className="text-orange-500 font-semibold">
                ({comparisonValue})
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function getCount(rows: Array<{ _id: string; count: number }> | undefined, status: string) {
  return rows?.find((row) => row._id === status)?.count ?? 0;
}

function getAppointmentCount(
  rows: Array<{ _id: string; appointments: number }> | undefined,
  status: string,
) {
  return rows?.find((row) => row._id === status)?.appointments ?? 0;
}

export default function DashboardStats() {
  const reports = useDashboardReports();
  const data = reports.data;
  const loadingValue = reports.isLoading ? "..." : undefined;

  return (
    <div className="w-full ">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Live Auctions"
          value={loadingValue ?? numberFormatter.format(getCount(data?.auctions.byStatus, "active"))}
          timeframeText="Current status"
        />

        {/* Card 2: Won Orders */}
        <StatCard
          title="Paid Invoices"
          value={loadingValue ?? numberFormatter.format(data?.revenue.paidInvoices ?? 0)}
          timeframeText="All time"
        />

        {/* Card 3: Total Revenue */}
        <StatCard
          title="Total Revenue"
          value={loadingValue ?? currencyFormatter.format(data?.revenue.totalRevenue ?? 0)}
          timeframeText="All time"
        />

        {/* Card 4: Split Auctions Layout */}
        <StatCard title="Auctions">
          <div className="grid grid-cols-2 mt-4 relative pt-1">
            {/* Scheduled Section */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Scheduled
              </p>
              <span className="text-[26px] font-bold text-[#063339]">
                {loadingValue ?? numberFormatter.format(getAppointmentCount(data?.pickups.byStatus, "scheduled"))}
              </span>
            </div>

            {/* Vertical Divider */}
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 h-10 w-[1px] bg-slate-100" />

            {/* Closed Section */}
            <div className="pl-6">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Closed
              </p>
              <span className="text-[26px] font-bold text-red-500">
                {loadingValue ?? numberFormatter.format(getCount(data?.auctions.byStatus, "ended"))}
              </span>
            </div>
          </div>
        </StatCard>
      </div>
      {reports.isError ? (
        <p className="mt-3 text-xs font-medium text-red-500">
          Dashboard metrics could not be loaded. Please refresh to try again.
        </p>
      ) : null}
    </div>
  )
}
