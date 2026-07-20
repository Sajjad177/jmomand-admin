"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Headphones,
  ArrowUpAZ,
  ArrowDownAZ,
  Plus,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface AuctionItem {
  _id: string;
  inventoryId: string;
  title: string;
  category: string;
  condition: string;
}

interface MetaData {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

interface AuctionResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AuctionItem[];
  meta: MetaData;
}

export default function ListOfauoction() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Search, Pagination, Sort and Selected Items States
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Fetch Auction data
  const { data: responseData, isLoading } = useQuery<AuctionResponse>({
    queryKey: ["auctionData", searchTerm, page, limit, order],
    queryFn: async () => {
      if (!token) {
        throw new Error("Please login again");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/auctions?searchTerm=${searchTerm}&page=${page}&limit=${limit}&sortOrder=${order}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to fetch auction data");
      }
      return result;
    },
    enabled: !!token,
  });

  const products = responseData?.data || [];
  const meta = responseData?.meta;
  const totalProducts = meta?.total || 0;
  const totalPages = meta?.totalPage || 1;

  // Checkbox Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = products.map((p) => p._id);
      setSelectedProductIds(allIds);
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Click Action: Transfer selected products data layer to local storage dynamic router payload
  const handlePublishNavigation = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to publish on auction.");
      return;
    }
    const selectedProductsDetails = products.filter((p) =>
      selectedProductIds.includes(p._id),
    );
    localStorage.setItem(
      "selected_auction_products",
      JSON.stringify(selectedProductsDetails),
    );
    router.push("/dashboard/auctions/add"); // Adjust route path destination properly
  };

  const deleteMutation = useMutation({
    mutationKey: ["publishAuction"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (payload: any) => {
      if (!token) {
        throw new Error("Authorization token is missing. Please login again.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${payload.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to delete product");
      }

      return result;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Product deleted successfully!");
      await queryClient.invalidateQueries({
        queryKey: ["auctionData"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong while deleting.");
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  return (
    <div className="w-full container bg-white rounded-xl border border-gray-100 shadow-sm p-8 font-sans">
      {/* --- Top Action Bar --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="text-lg font-semibold text-gray-800">
          Auction Product{" "}
          <span className="text-[#FF5A1F] font-medium ml-1">
            ({isLoading ? "..." : totalProducts})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search Products......"
              className="w-full h-10 pl-4 pr-10 bg-[#F5F7FA] text-sm text-gray-600 placeholder-gray-400 rounded-lg outline-none focus:ring-1 focus:ring-gray-200 transition-all"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          <button
            onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
            className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {order === "asc" ? (
              <ArrowUpAZ className="w-4 h-4 text-gray-600" />
            ) : (
              <ArrowDownAZ className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Dynamically Styled Action Button conditional logic trigger layout tracking */}
          <button
            onClick={handlePublishNavigation}
            className="h-10 px-4 bg-[#FF5A1F] text-sm font-medium text-white rounded-lg hover:bg-[#e04e18] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Auction Publish{" "}
            {selectedProductIds.length > 0 && `(${selectedProductIds.length})`}
          </button>
        </div>
      </div>

      {/* --- Products Table --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
              <th className="py-3 px-4 w-12 rounded-l-lg">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    products.length > 0 &&
                    selectedProductIds.length === products.length
                  }
                  className="w-4 h-4 rounded text-[#FF5A1F] border-gray-300 focus:ring-[#FF5A1F] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Product Id</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Condition</th>
              <th className="py-3 px-6 text-center rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-sm text-gray-400"
                >
                  Loading Products...
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product._id)}
                      onChange={() => handleSelectItem(product._id)}
                      className="w-4 h-4 rounded text-[#FF5A1F] border-gray-300 focus:ring-[#FF5A1F] cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                    {product.inventoryId}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <span
                        className="text-sm font-medium text-gray-700 max-w-[160px] truncate"
                        title={product.title}
                      >
                        {product.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
                    {product.category}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium capitalize">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          product.condition.toLowerCase() === "new"
                            ? "bg-[#10B981]"
                            : "bg-[#F97316]"
                        }`}
                      />
                      {product.condition.replace("_", " ")}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap relative">
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === product._id ? null : product._id,
                        )
                      }
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openDropdown === product._id && (
                      <div className="absolute right-6 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            handleDelete(product._id);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-sm text-gray-400"
                >
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Pagination Footer --- */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 h-9 px-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-md ${
                  page === index + 1
                    ? "bg-[#D9E4F7] text-[#2563EB]"
                    : "text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 h-9 px-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
