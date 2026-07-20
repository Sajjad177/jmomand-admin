import { apiRequest } from "@/lib/api-client";

export type StatusCount = { _id: string; count: number };
export type RevenueReport = {
  totalRevenue: number;
  paidInvoices: number;
  averageOrderValue: number;
};
export type AuctionReport = {
  totalWinningBids: number;
  byStatus: StatusCount[];
};
export type PickupStatusCount = { _id: string; appointments: number; items: number };
export type PickupReport = { byStatus: PickupStatusCount[] };

function dateQuery(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getDashboardReports(
  token: string | undefined,
  range: { startDate?: string; endDate?: string } = {},
) {
  const query = dateQuery(range.startDate, range.endDate);
  const [revenue, auctions, inventory, pickups] = await Promise.all([
    apiRequest<RevenueReport>(`/reports/revenue${query}`, token),
    apiRequest<AuctionReport>(`/reports/auctions${query}`, token),
    apiRequest<StatusCount[]>("/reports/inventory", token),
    apiRequest<PickupReport>(`/reports/pickups${query}`, token),
  ]);

  return {
    revenue: revenue.data,
    auctions: auctions.data,
    inventory: inventory.data,
    pickups: pickups.data,
  };
}
