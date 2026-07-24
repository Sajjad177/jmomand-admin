"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ArrowUpFromLine,
  Plus,
  Headphones,
  ArrowUpAZ,
  ArrowDownAZ,
  Eye,
  Package,
  Layers,
  DollarSign,
  X,
  Tag,
  CheckCircle2,
  Gavel,
} from "lucide-react";
import Link from "next/link";
import BulkImportModal from "./BulkImportModal";
import { useSession } from "next-auth/react";
import { InventoryItem, InventoryResponse } from "@/types/productTypes";
import type { LucideIcon } from "lucide-react";
import { Pagination } from "@/components/pagination";

export default function ProductDashboard() {
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null); // Quick View state

  // Search and Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Fetch Inventory dynamic data
  const { data: responseData, isLoading } = useQuery<InventoryResponse>({
    queryKey: ["inventoryData", searchTerm, page, limit, order],
    queryFn: async () => {
      if (!token) throw new Error("Please login again");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/inventory?searchTerm=${searchTerm}&page=${page}&limit=${limit}&sortOrder=${order}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to fetch inventory data");
      }
      return result;
    },
    enabled: !!token,
  });

  // Fetch all inventory for stats (no pagination limit)
  const { data: statsData } = useQuery<InventoryResponse>({
    queryKey: ["inventoryStats"],
    queryFn: async () => {
      if (!token) throw new Error("Please login again");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/inventory?limit=10000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to fetch stats");
      }
      return result;
    },
    enabled: !!token,
  });

  const products = responseData?.data || [];
  const meta = responseData?.meta;
  const totalProducts = meta?.total || 0;
  const totalPages = meta?.totalPage || 1;

  // Stats computation from full statsData
  const allProducts = statsData?.data || [];
  const totalSale = allProducts.filter((p) => p.type === "for_sale" || p.type !== "for_auction").length;
  const totalAuction = allProducts.filter((p) => p.type === "for_auction").length;
  const totalCategories = new Set(allProducts.map((p) => p.category).filter(Boolean)).size;

  // Pagination Handler
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="w-full space-y-6 bg-slate-50/50 p-6 rounded-2xl min-h-screen">
      {/* 1. Header & KPI Overview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventory Management
          </h1>
          <p className="text-sm text-slate-500">
            Monitor, update, and manage your store&apos;s stock and listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowUpFromLine className="w-4 h-4 text-slate-500" />
            Bulk Import
          </button>

          <Link
            href="/dashboard/inventory/add"
            className="flex items-center gap-2 h-10 px-4 bg-orange-600 hover:bg-orange-700 text-sm font-medium text-white rounded-xl transition-all shadow-sm shadow-orange-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Link>
        </div>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Sale"
          value={totalSale}
          icon={DollarSign}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Total Auction"
          value={totalAuction}
          icon={Gavel}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          title="Category"
          value={totalCategories}
          icon={Layers}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* 2. Main Content Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-200 p-4 sm:flex-row">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search products by title, ID..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>

          {/* Sort Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2 px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              title="Toggle Sort Order"
            >
              Sort Order: {order.toUpperCase()}
              {order === "asc" ? (
                <ArrowUpAZ className="w-4 h-4 text-slate-600" />
              ) : (
                <ArrowDownAZ className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Product ID</th>
                <th className="py-3.5 px-4">Title & Image</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading Products...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((product) => {
                  const imageUrl = product.images?.[0]?.url;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Product ID */}
                      <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-700">
                          {product.inventoryId || "N/A"}
                        </span>
                      </td>

                      {/* Product Image & Title */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Headphones className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <span
                            className="font-medium text-slate-900 truncate"
                            title={product.title}
                          >
                            {product.title}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                        {product.category || "-"}
                      </td>

                      {/* Condition Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <ConditionBadge condition={product.condition} />
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${product.type === "for_auction"
                              ? "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20"
                              : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                            }`}
                        >
                          {product.type === "for_auction" ? "Auction" : "Sale"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        ${product.price?.toLocaleString() || "0"}
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${product.quantity < 10
                              ? "text-rose-600"
                              : "text-slate-700"
                            }`}
                        >
                          {product.quantity}
                        </span>
                      </td>

                      {/* Action Column with Eye & Dropdown */}
                      <td className="py-4 px-6 text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick View Button */}
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Options Menu */}

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Pagination Footer */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          siblingCount={1}
        />
      </div>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        token={token || ""}
      />

      {/* Product Detail Slide-over Drawer / Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            SUB-COMPONENTS (UI)                             */
/* -------------------------------------------------------------------------- */

// 1. KPI Stat Card
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {value.toLocaleString()}
        </p>
      </div>
      <div className={`rounded-xl p-3 ${bgColor} ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

// 2. Condition Pill Badge
function ConditionBadge({ condition }: { condition?: string }) {
  const cond = condition?.toLowerCase() || "";

  if (cond === "new") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 capitalize">
        <CheckCircle2 className="w-3 h-3" /> New
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 capitalize">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      {condition?.replace("_", " ") || "Used"}
    </span>
  );
}

// 3. Product Quick View Modal
function ProductDetailModal({
  product,
  onClose,
}: {
  product: InventoryItem;
  onClose: () => void;
}) {
  const imageUrl = product.images?.[0]?.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 px-6">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-mono font-semibold text-slate-500">
              {product.inventoryId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Image & Title */}
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Headphones className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {product.title}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Manufacturer: {product.manufacturer || "N/A"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <ConditionBadge condition={product.condition} />
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {product.category}
                </span>
              </div>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Price:</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                ${product.price?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Stock Quantity:</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {product.quantity} Units
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Type:</span>
              <p className="font-semibold text-slate-700 capitalize mt-0.5">
                {product.type?.replace("_", " ")}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Colors:</span>
              <p className="font-semibold text-slate-700 capitalize mt-0.5">
                {Array.isArray(product.color)
                  ? product.color.join(", ")
                  : product.color || "N/A"}
              </p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5">
                Description
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <Link
            href={`/dashboard/inventory/${product._id}`}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Edit Product
          </Link>
        </div>
      </div>
    </div>
  );
}
