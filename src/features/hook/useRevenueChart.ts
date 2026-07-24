import { fetchRevenueChart, RevenueChartData } from '@/feature/revenue';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';


interface UseRevenueChartOptions {
  period?: 'week' | 'month';
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export const useRevenueChart = ({
  period = "month",
  startDate,
  endDate,
  enabled = true,
}: UseRevenueChartOptions = {}) => {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  return useQuery<RevenueChartData, Error>({
    queryKey: ["revenueChart", period, token, startDate, endDate],
    queryFn: () => fetchRevenueChart(token, period, startDate, endDate),
    enabled: enabled && Boolean(token),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
