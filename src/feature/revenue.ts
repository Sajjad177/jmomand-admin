import { apiRequest } from "@/lib/api-client";

export interface RevenueChartData {
  period: 'week' | 'month';
  range: {
    start: string;
    end: string;
  };
  labels: string[];
  data: number[];
  totalRevenue: number;
}

export interface RevenueChartResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: RevenueChartData;
}

export const fetchRevenueChart = async (
  token: string | undefined,
  period: "week" | "month" = "month",
  startDate?: string,
  endDate?: string
): Promise<RevenueChartData> => {
  const params: Record<string, string> = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const queryString = new URLSearchParams(params).toString();
  const response = await apiRequest<RevenueChartData>(
    `/reports/revenue/chart?${queryString}`,
    token,
  );

  return response.data;
};
