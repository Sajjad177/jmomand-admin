"use client";

import { CreateAuctionPayload } from "@/types/AuctionType";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Fetch auction products directly from /products/auctions
export const useAuctionProductsQuery = (
  token: string | null,
  searchTerm: string = "",
  isOpen: boolean = true
) => {
  return useQuery({
    queryKey: ["auctionProductsModal", searchTerm],
    queryFn: async () => {
      if (!token) return { data: [] };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/auctions?searchTerm=${encodeURIComponent(
          searchTerm
        )}&limit=30`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to fetch auction products");
      }

      return result;
    },
    enabled: isOpen && !!token,
  });
};

// Publish auction mutation hook
export const useAuctionHook = (token: string | null) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const publishAuctionMutation = useMutation({
    mutationKey: ["publishAuction"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (payload: any) => {
      if (!token) {
        throw new Error("Authorization token is missing. Please login again.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/auctions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to publish auction");
      }

      return result;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Auction published successfully!");
      await queryClient.invalidateQueries({ queryKey: ["auctionData"] });
      await queryClient.invalidateQueries({ queryKey: ["inventoryData"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardReports"] });
      localStorage.removeItem("selected_auction_products");
      router.push("/dashboard/auctions");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong while publishing.");
    },
  });

  return {
    publishAuctionMutation,
  };
};





export const useAddAuctionHook = (token: string | null) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Publish Auction Mutation
  const publishAuctionMutation = useMutation({
    mutationKey: ["publishAuction"],
    mutationFn: async (payload: CreateAuctionPayload) => {
      if (!token) {
        throw new Error("Authorization token is missing. Please login again.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auctions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to publish auction");
      }

      return result;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Auction published successfully!");
      
      // Invalidate relevant cache lists
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auctionData"] }),
        queryClient.invalidateQueries({ queryKey: ["inventoryData"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboardReports"] }),
      ]);

      localStorage.removeItem("selected_auction_products");
      router.push("/dashboard/auctions");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong while publishing.");
    },
  });

  return {
    publishAuctionMutation,
  };
};