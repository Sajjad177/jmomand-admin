"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getDashboardReports } from "./api";

export function useDashboardReports(startDate?: string, endDate?: string) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  return useQuery({
    queryKey: ["dashboardReports", startDate, endDate],
    queryFn: () => getDashboardReports(token, { startDate, endDate }),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}
