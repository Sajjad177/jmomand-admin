"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  ArrowUpAZ,
  ArrowDownAZ,
  Calendar,
  Package,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Pagination } from "@/components/pagination";
import { useGetAllAuctionsHook } from "@/features/hook/useAuctionHook";
import { AuctionDetailsModal } from "./AuctionDetailsModal";
import type { AuctionItem } from "@/types/AuctionType";


export default function ListOfauoction() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  // Search, Pagination, Sort and Selected Items States
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Modal State
  const [selectedAuctionIdForModal, setSelectedAuctionIdForModal] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Using your custom hook
  const { auctions, meta, isLoading, isError } =
    useGetAllAuctionsHook({
      token: token ?? "",
      page,
      limit,
      enabled: !!token,
    });

  const totalAuctions = meta?.total || 0;
  const totalPages = meta?.totalPage || 1;

  // Handlers for Modal
  const handleOpenDetailsModal = (id: string) => {
    setSelectedAuctionIdForModal(id);
    setIsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedAuctionIdForModal(null);
  };

  // Filter & sort logic for client-side search
  const filteredAuctions = (auctions || [])
    .filter(
      (auction: AuctionItem) =>
        auction.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.auctionId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: AuctionItem, b: AuctionItem) => {
      const titleA = a.title?.toLowerCase() || "";
      const titleB = b.title?.toLowerCase() || "";
      return order === "asc"
        ? titleA.localeCompare(titleB)
        : titleB.localeCompare(titleA);
    });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Upcoming
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full container bg-white rounded-xl border border-gray-100 shadow-sm p-8 font-sans">
      {/* --- Top Action Bar --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="text-lg font-semibold text-gray-800">
          Auctions{" "}
          <span className="text-[#FF5A1F] font-medium ml-1">
            ({isLoading ? "..." : totalAuctions})
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
              placeholder="Search Auctions..."
              className="w-full h-10 pl-4 pr-10 bg-[#F5F7FA] text-sm text-gray-600 placeholder-gray-400 rounded-lg outline-none focus:ring-1 focus:ring-gray-200 transition-all"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          <button
            onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
            className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title={`Sort ${order === "asc" ? "Descending" : "Ascending"}`}
          >
            {order === "asc" ? (
              <ArrowUpAZ className="w-4 h-4 text-gray-600" />
            ) : (
              <ArrowDownAZ className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <button
            onClick={() => router.push("/dashboard/auctions/add")}
            className="h-10 px-4 bg-[#FF5A1F] text-sm font-medium text-white rounded-lg hover:bg-[#e04e18] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Publish Auction
          </button>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
              
              <th className="py-3 px-4">Auction ID</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 text-center">Total Products</th>
              <th className="py-3 px-4">Starts At</th>
              <th className="py-3 px-4">Ends At</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-6 text-center rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                  Loading Auctions...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-red-500">
                  Failed to fetch auctions.
                </td>
              </tr>
            ) : filteredAuctions.length > 0 ? (
              filteredAuctions.map((auction: AuctionItem) => (
                <tr key={auction._id} className="hover:bg-gray-50/50 transition-colors">
                  
                  <td className="py-4 px-4 text-sm font-mono font-medium text-gray-700 whitespace-nowrap">
                    {auction.auctionId}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className="text-sm font-medium text-gray-800 max-w-[200px] truncate block"
                      title={auction.title}
                    >
                      {auction.title}
                    </span> 
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                      <Package className="w-3.5 h-3.5" />
                      {auction.products?.length || 0}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-800" />
                      {formatDate(auction.startsAt)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-800" />
                      {formatDate(auction.endsAt)}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {getStatusBadge(auction.status)}
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenDetailsModal(auction._id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-[#FF5A1F] hover:bg-orange-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                  No auctions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Pagination Footer --- */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* --- Auction Details Modal --- */}
      <AuctionDetailsModal
        auctionId={selectedAuctionIdForModal}
        isOpen={isModalOpen}
        onClose={handleCloseDetailsModal}
        token={token}
      />
    </div>
  );
}
