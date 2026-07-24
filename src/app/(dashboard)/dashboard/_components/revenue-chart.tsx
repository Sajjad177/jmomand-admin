"use client";

import React, { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import { useRevenueChart } from "@/features/hook/useRevenueChart";

// --- Custom Floating Tooltip ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedVal =
      data.revenue >= 1000
        ? `$${(data.revenue / 1000).toFixed(1)}k`
        : `$${data.revenue}`;

    return (
      <div className="flex flex-col items-center -translate-y-2">
        {/* Orange Popup Box */}
        <div className="bg-[#FF5A1F] text-white rounded-xl px-3.5 py-2 shadow-lg text-center flex flex-col items-center min-w-[90px]">
          <span className="text-[11px] font-medium leading-none opacity-90 mb-1">
            {data.fullLabel}
          </span>
          <span className="text-xs font-bold leading-none">{formattedVal}</span>
        </div>
        {/* Circle Pin Pointer */}
        <div className="w-2.5 h-2.5 bg-white border-2 border-[#FF5A1F] rounded-full mt-1.5 shadow-sm shrink-0" />
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  const [period, setPeriod] = useState<"week" | "month">("month");

  // Fetch chart data via custom hook
  const { data, isLoading, isFetching, isError, error } = useRevenueChart({ period });

  // Map backend arrays to Recharts format
  const chartData = useMemo(() => {
    if (!data?.labels || !data?.data) return [];

    return data.labels.map((label, index) => ({
      name: label.length > 3 ? label.slice(0, 3) : label, // "January" -> "Jan"
      fullLabel: label,
      revenue: data.data[index] ?? 0,
    }));
  }, [data]);

  // Check if any non-zero revenue exists
  const hasData = useMemo(() => {
    return chartData.some((item) => item.revenue > 0);
  }, [chartData]);

  // Calculate dynamic maximum Y-axis upper limit to give headroom for rendering area slopes
  const maxRevenue = useMemo(() => {
    if (!chartData.length) return 1000;
    const max = Math.max(...chartData.map((d) => d.revenue));
    return max > 0 ? Math.ceil(max * 1.2) : 1000; // Adds 20% margin above peak
  }, [chartData]);

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-slate-900 text-lg tracking-tight">
            Revenue
          </h3>
          {data?.totalRevenue !== undefined && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Total:{" "}
              <span className="text-[#FF5A1F] font-semibold">
                ${data.totalRevenue.toLocaleString()}
              </span>
            </p>
          )}
        </div>

        {/* Week / Month Toggle Pill */}
        <div className="bg-[#FFEFE9] p-1 rounded-xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              period === "week"
                ? "bg-white text-[#FF5A1F] shadow-sm"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              period === "month"
                ? "bg-white text-[#FF5A1F] shadow-sm"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="h-[260px] w-full relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-xl transition-opacity">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF5A1F]" />
          </div>
        )}

        {!isLoading && !isFetching && (isError || !hasData) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-400 text-xs font-medium pointer-events-none">
            <span>
              {isError
                ? error?.message || "Failed to load revenue chart"
                : "No revenue recorded for this period"}
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="imageOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5A1F" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 400 }}
              domain={[0, maxRevenue]}
              tickFormatter={(val) =>
                val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`
              }
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#FF5A1F",
                strokeDasharray: "3 3",
                strokeWidth: 1.5,
              }}
              offset={-35}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#FF5A1F"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#imageOrangeGradient)"
              isAnimationActive={true}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
