"use client";

import React from "react";
import Image from "next/image";
import {
  X,
  Calendar,
  Clock,
  Package,
  DollarSign,
  Tag,
  ShieldCheck,
  Truck,
  Layers,
  Loader2,
  TrendingUp,
  Gavel,
  CalendarDays,
  Info,
} from "lucide-react";
import { useGetAuctionDetailsHook } from "@/features/hook/useAuctionHook"; // Adjust import path if needed
import type { AuctionProductItem, AuctionProductPivot } from "@/types/AuctionType";

interface AuctionDetailsModalProps {
  auctionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

export function AuctionDetailsModal({
  auctionId,
  isOpen,
  onClose,
  token,
}: AuctionDetailsModalProps) {
  const { auction, isLoading, isError, error } = useGetAuctionDetailsHook({
    auctionId: auctionId ?? "",
    token,
    enabled: isOpen && !!auctionId && !!token,
  });

  if (!isOpen) return null;

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
      case "auction_active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Upcoming
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {status || "Unknown"}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden font-sans">
        
        {/* --- Modal Header --- */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-[#FF5A1F] rounded-xl border border-orange-100">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  {isLoading ? "Loading Auction Details..." : auction?.title}
                </h2>
                {auction?.status && getStatusBadge(auction.status)}
              </div>
              {!isLoading && auction?.auctionId && (
                <p className="text-xs font-mono text-gray-400 mt-0.5">
                  ID: {auction.auctionId}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- Modal Body --- */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAFAFA]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3 bg-white rounded-xl border border-gray-100">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF5A1F]" />
              <p className="text-sm font-medium">Fetching auction details...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-red-500 font-medium bg-white rounded-xl border border-red-100">
              {error?.message || "Failed to load auction details."}
            </div>
          ) : auction ? (
            <>
              {/* --- Timeline & Metrics Overview --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                      Starts At
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {formatDate(auction.startsAt)}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-lg shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                      Ends At
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {formatDate(auction.endsAt)}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                      Duration
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {auction.durationInDays} Days
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                      Total Items
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {auction.products?.length || 0} Products
                    </span>
                  </div>
                </div>
              </div>

              {/* --- Description --- */}
              {auction.description && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                    Auction Description
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {auction.description}
                  </p>
                </div>
              )}

              {/* --- Pickup & Premium Cards --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {auction.pickupSchedule && (
                  <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                      <Truck className="w-4 h-4 text-blue-600" />
                      Pickup Schedule
                    </div>
                    <div className="text-xs text-gray-600 space-y-1.5 pt-1">
                      <div className="flex justify-between items-center border-b border-gray-50 pb-1">
                        <span className="text-gray-500">Pickup Window:</span>
                        <span className="font-semibold text-gray-800">
                          {formatDate(auction.pickupSchedule.startDate)} – {formatDate(auction.pickupSchedule.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-50 pb-1">
                        <span className="text-gray-500">Daily Hours:</span>
                        <span className="font-semibold text-gray-800">
                          {auction.pickupSchedule.dailyStartTime} – {auction.pickupSchedule.dailyEndTime}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-semibold text-gray-800">
                          {auction.pickupSchedule.durationInDays} Days
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Buyer Premium
                  </div>
                  <div className="text-xs text-gray-600 space-y-1.5 pt-1">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-1">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-semibold text-gray-800">
                        {auction.buyerPremiumEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Premium Amount:</span>
                      <span className="font-semibold text-gray-800">
                        ${auction.buyerPremiumAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Products List --- */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-4.5 h-4.5 text-[#FF5A1F]" />
                    Auction Products ({auction.products?.length || 0})
                  </h3>
                </div>

                <div className="space-y-4">
                  {auction.products?.map((prod: AuctionProductItem) => {
                    // Match with corresponding entry in auctionProducts for bid details
                    const auctionProdMeta = auction.auctionProducts?.find(
                      (ap: AuctionProductPivot) =>
                        ap._id === prod.auctionProductId ||
                        ap.productId === prod._id
                    );

                    const highestBidAmount =
                      auctionProdMeta?.highestBid?.amount ?? prod.currentBid ?? 0;
                    const startingBid = auctionProdMeta?.startingBid ?? 0;
                    const bidIncrement = auctionProdMeta?.bidIncrement ?? 0;

                    return (
                      <div
                        key={prod._id}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5"
                      >
                        {/* Image Thumbnail */}
                        <div className="relative w-full md:w-28 h-28 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 group">
                          {prod.images?.[0]?.url ? (
                            <Image
                              src={prod.images[0].url}
                              alt={prod.title}
                              fill
                              sizes="112px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* Details Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-gray-900 text-base">
                                {prod.title}
                              </h4>
                              <p className="text-xs font-mono text-gray-400 mt-0.5">
                                SKU: {prod.inventoryId}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">
                              {prod.condition?.replace("_", " ")}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {prod.description}
                          </p>

                          {/* Bid Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                            {/* Highest Bid Highlight */}
                            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-600" />
                                Highest Bid
                              </span>
                              <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                                ${highestBidAmount}
                              </span>
                            </div>

                            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Starting Bid
                              </span>
                              <span className="text-xs font-bold text-gray-800 mt-0.5 block">
                                ${startingBid}
                              </span>
                            </div>

                            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Min Next Bid
                              </span>
                              <span className="text-xs font-bold text-[#FF5A1F] mt-0.5 block">
                                ${prod.minimumNextBid}
                              </span>
                            </div>

                            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Reserve Price
                              </span>
                              <span className="text-xs font-bold text-gray-800 mt-0.5 block">
                                ${prod.reservePrice}
                              </span>
                            </div>
                          </div>

                          {/* Extra Meta Badges */}
                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 pt-2">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-gray-400" />
                              {prod.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-gray-400" />
                              Brand: {prod.manufacturer || "-"}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                              Bid Step: ${bidIncrement}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* --- Modal Footer --- */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
