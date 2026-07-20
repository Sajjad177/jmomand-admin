"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ArrowUpFromLine,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Headphones,
  ArrowUpAZ,
  ArrowDownAZ,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import BulkImportModal from "./BulkImportModal";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// --- Dynamic API Types Mapping ---
interface InventoryItem {
  _id: string;
  inventoryId: string;
  title: string;
  category: string;
  condition: string;
  type: string;
  quantity: number;
}

interface MetaData {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

interface InventoryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: InventoryItem[];
  meta: MetaData;
}

export default function ProductDashboard() {
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Search and Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  // Fetch Inventory dynamic data inside TanStack useQuery
  const { data: responseData, isLoading } = useQuery<InventoryResponse>({
    queryKey: ["inventoryData", searchTerm, page, limit, order],
    queryFn: async () => {
      if (!token) {
        throw new Error("Please login again");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/inventory?searchTerm=${searchTerm}&page=${page}&limit=${limit}&sortOrder=${order}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to fetch inventory data");
      }

      return result;
    },
    enabled: !!token,
  });

  const products = responseData?.data || [];
  const meta = responseData?.meta;
  const totalProducts = meta?.total || 0;
  const totalPages = meta?.totalPage || 1;

  // Pagination Handler
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const deleteMutation = useMutation({
    mutationKey: ["deleteProduct"],
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
        queryKey: ["inventoryData"],
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
        {/* Title and Count dynamically from meta */}
        <div className="text-lg font-semibold text-gray-800">
          All Product{" "}
          <span className="text-[#FF5A1F] font-medium ml-1">
            ({isLoading ? "..." : totalProducts})
          </span>
        </div>

        {/* Controls Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // resetting layout state to first page on search
              }}
              placeholder="Search Products......"
              className="w-full h-10 pl-4 pr-10 bg-[#F5F7FA] text-sm text-gray-600 placeholder-gray-400 rounded-lg outline-none focus:ring-1 focus:ring-gray-200 transition-all"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Filter Button */}

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

          {/* Bulk Import Button */}
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowUpFromLine className="w-4 h-4 text-gray-500" />
            Bulk Import
          </button>

          <BulkImportModal
            isOpen={bulkModalOpen}
            onClose={() => setBulkModalOpen(false)}
            token={token || ""}
          />

          {/* Add Item Button */}
          <button className="h-10 px-4 bg-[#FF5A1F] text-sm font-medium text-white rounded-lg hover:bg-[#e04e18] transition-colors shadow-sm">
            <Link
              href="/dashboard/inventory/add"
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Link>
          </button>
        </div>
      </div>

      {/* --- Products Table --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
              <th className="py-3 px-6 rounded-l-lg first-letter:uppercase">
                Product Id
              </th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Condition</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Quantity</th>
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
                  {/* Product ID from InventoryId */}
                  <td className="py-4 px-6 text-sm font-medium text-gray-700 whitespace-nowrap">
                    {product.inventoryId}
                  </td>

                  {/* Product Image & Name */}
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

                  {/* Category */}
                  <td className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
                    {product.category}
                  </td>

                  {/* Condition Status Indicator styling */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium capitalize">
                      <span
                        className={`w-2 h-2 rounded-full ${product.condition.toLowerCase() === "new"
                            ? "bg-[#10B981]"
                            : "bg-[#F97316]"
                          }`}
                      />
                      {product.condition.replace("_", " ")}
                    </div>
                  </td>

                  <td className="py-4 px-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                    {product.type === "for_auction" ? "Auction" : "Sale"}
                  </td>

                  {/* Quantity */}
                  <td className="py-4 px-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                    {product.quantity}
                  </td>

                  {/* Action Row Button */}
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

      {/* --- Dynamic Pagination Footer with API data mapping --- */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 h-9 px-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Page Numbers Mapping */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-md transition-colors ${page === pageNumber
                      ? "bg-[#D9E4F7] text-[#2563EB]"
                      : "text-gray-500 border border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 h-9 px-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
