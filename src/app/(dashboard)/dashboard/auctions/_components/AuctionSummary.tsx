"use client";

import React from "react";
import { Package } from "lucide-react";
import { InventoryProduct } from "./ProductSelectModal";

interface AuctionSummaryProps {
  selectedItems: InventoryProduct[];
  startDate: string;
  startTime: string;
  auctionDurationDays: number;
  pickupDurationDays: number;
  startingBid: number;
  bidIncrement: number;
  calculateEndDate: () => string;
  getItemId: (item: InventoryProduct) => string;
  handlePublishAuction: () => void;
  isPublishing: boolean;
}

export function AuctionSummary({
  selectedItems,
  startDate,
  startTime,
  auctionDurationDays,
  pickupDurationDays,
  startingBid,
  bidIncrement,
  calculateEndDate,
  getItemId,
  handlePublishAuction,
  isPublishing,
}: AuctionSummaryProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
        Auction Summary
      </h2>

      <div className="space-y-3.5 text-xs font-medium">
        <div className="flex items-center justify-between text-slate-500">
          <span>Total Items</span>
          <span className="font-bold text-slate-900">{selectedItems.length || 0}</span>
        </div>

        <div className="flex items-center justify-between text-slate-500">
          <span>Start Date</span>
          <span className="font-bold text-slate-900">
            {startDate && startTime ? `${startDate} ${startTime}` : "N/A"}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-500">
          <span>End Date</span>
          <span className="font-bold text-slate-900">{calculateEndDate()}</span>
        </div>

        <div className="flex items-center justify-between text-slate-500">
          <span>Auction Duration</span>
          <span className="font-bold text-slate-900">{auctionDurationDays || 0} Days</span>
        </div>

        <div className="flex items-center justify-between text-slate-500">
          <span>Pickup Duration</span>
          <span className="font-bold text-slate-900">{pickupDurationDays || 0} Days</span>
        </div>

        <div className="flex items-center justify-between text-slate-500">
          <span>Starting Bid</span>
          <span className="font-bold text-slate-900">${startingBid || 0}</span>
        </div>

        <div className="flex items-center justify-between text-slate-500">
          <span>Bid Increment</span>
          <span className="font-bold text-slate-900">${bidIncrement || 0}</span>
        </div>
      </div>

      {/* Selected Items List */}
      <div className="pt-2 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-900 mb-3">Selected Items</h3>
        {selectedItems.length > 0 ? (
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {selectedItems.map((item) => {
              const itemId = getItemId(item);
              const img = item.images?.[0]?.url;
              return (
                <div key={itemId} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 overflow-hidden">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">
                      {item.inventoryId}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No items added yet.</p>
        )}
      </div>

      <button
        type="button"
        onClick={handlePublishAuction}
        disabled={isPublishing}
        className="w-full h-12 bg-[#FF5A1F] hover:bg-[#e04d18] text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {isPublishing ? "Publishing..." : "Publish Auction"}
      </button>
    </div>
  );
}