"use client";

import React from "react";
import { Gavel, FileCheck, DollarSign, Activity } from "lucide-react";
import { useDashboardReports } from "@/features/dashboard/use-dashboard-reports";

interface StatCardProps {
  title: string;
  value?: string | number;
  timeframeText?: string;
  icon?: React.ElementType;
  iconBgColor?: string;
  iconColor?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const StatCard = ({
  title,
  value,
  timeframeText = "",
  icon: Icon,
  iconBgColor = "bg-slate-100",
  iconColor = "text-slate-700",
  isLoading,
  children,
}: StatCardProps) => {
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:border-slate-300">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 ${iconBgColor} ${iconColor} transition-transform duration-200 group-hover:scale-105`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </h3>
          <p className="text-xs font-semibold text-slate-800">
            {timeframeText}
          </p>
        </div>
      </div>

      {/* Main Metric Section */}
      {isLoading ? (
        <div className="mt-4 space-y-2">
          <div className="h-8 w-28 animate-pulse rounded-md bg-slate-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
        </div>
      ) : children ? (
        children
      ) : (
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
            {value}
          </span>
        </div>
      )}
    </div>
  );
};

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
  status: string
) {
  return rows?.find((row) => row._id === status)?.appointments ?? 0;
}

export default function DashboardStats() {
  const reports = useDashboardReports();
  const data = reports.data;
  const isLoading = reports.isLoading;

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Live Auctions */}
        <StatCard
          title="Live Auctions"
          icon={Gavel}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          value={numberFormatter.format(getCount(data?.auctions.byStatus, "active"))}
          isLoading={isLoading}
        />

        {/* Card 2: Paid Invoices */}
        <StatCard
          title="Paid Invoices"
          icon={FileCheck}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          value={numberFormatter.format(data?.revenue.paidInvoices ?? 0)}
          isLoading={isLoading}
        />

        {/* Card 3: Total Revenue */}
        <StatCard
          title="Total Revenue"
          icon={DollarSign}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
          value={currencyFormatter.format(data?.revenue.totalRevenue ?? 0)}
          isLoading={isLoading}
        />

        {/* Card 4: Split Activity Metrics Layout */}
        <StatCard
          title="Activity Metrics"
          icon={Activity}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          isLoading={isLoading}
        >
          <div className="mt-4 grid grid-cols-2 items-center divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
            {/* Scheduled Pickups */}
            <div className="pr-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Scheduled
              </span>
              <span className="mt-0.5 block text-lg font-black tracking-tight text-slate-900">
                {numberFormatter.format(
                  getAppointmentCount(data?.pickups.byStatus, "scheduled")
                )}
              </span>
            </div>

            {/* Ended Auctions */}
            <div className="pl-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ended
              </span>
              <span className="mt-0.5 block text-lg font-black tracking-tight text-slate-700">
                {numberFormatter.format(
                  getCount(data?.auctions.byStatus, "ended")
                )}
              </span>
            </div>
          </div>
        </StatCard>
      </div>

      {reports.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 text-xs font-semibold text-rose-700">
          <span>Unable to sync latest live metrics. Retrying connection...</span>
        </div>
      )}
    </div>
  );
}