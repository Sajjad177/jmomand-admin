"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Headphones, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface SelectedAuctionProduct {
  _id: string;
  inventoryId: string;
  title: string;
  category: string;
  condition: string;
}

export default function AuctionPublishAddPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [selectedProducts, setSelectedProducts] = useState<
    SelectedAuctionProduct[]
  >([]);

  // --- Form States corresponding to Backend Payload ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Auction Schedule States
  const [auctionStartDate, setAuctionStartDate] = useState("");
  const [auctionStartTime, setAuctionStartTime] = useState("");
  const [auctionDuration, setAuctionDuration] = useState<number>(1);

  // Bidding States
  const [startingBid, setStartingBid] = useState<number>(1);
  const [bidIncrement, setBidIncrement] = useState<number>(5);
  // const [reservePrice, setReservePrice] = useState<number>(150);

  // Pickup Schedule States
  const [pickupStartDate, setPickupStartDate] = useState("");
  const [pickupEndDate, setPickupEndDate] = useState("");
  const [pickupStartTime, setPickupStartTime] = useState("09:00");
  const [pickupEndTime, setPickupEndTime] = useState("17:00");
  const [pickupDuration, setPickupDuration] = useState<number>(3);

  useEffect(() => {
    const storedData = localStorage.getItem("selected_auction_products");
    if (storedData) {
      setSelectedProducts(JSON.parse(storedData));
    }
  }, []);

  // --- TanStack Query Mutation for Post Endpoint ---
  const publishAuctionMutation = useMutation({
    mutationKey: ["publishAuction"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (payload: any) => {
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
        },
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to publish auction");
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Auction published successfully!");
      localStorage.removeItem("selected_auction_products");
      router.push("/dashboard/auctions");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong while publishing.");
    },
  });

  const handleBack = () => {
    localStorage.removeItem("selected_auction_products");
    router.back();
  };

  const handleFinalPublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product before publishing.");
      return;
    }

    // Creating backend structured payload format
    const payload = {
      products: selectedProducts.map((p) => p._id),
      title,
      description,
      auctionSchedule: {
        startDate: auctionStartDate,
        startTime: auctionStartTime,
        durationInDays: Number(auctionDuration),
      },
      startingBid: Number(startingBid),
      bidIncrement: Number(bidIncrement),
      // reservePrice: Number(reservePrice),
      pickupSchedule: {
        startDate: pickupStartDate,
        endDate: pickupEndDate,
        dailyStartTime: pickupStartTime,
        dailyEndTime: pickupEndTime,
        durationInDays: Number(pickupDuration),
      },
    };

    publishAuctionMutation.mutate(payload);
  };

  return (
    <div className="w-full container bg-white rounded-xl border border-gray-100 shadow-sm p-8 font-sans space-y-8">
      {/* --- Header Section --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Selection Grid
          </button>
          <h2 className="text-xl font-bold text-gray-800 mt-2">
            Create &amp; Publish New Auction Batch
          </h2>
          <p className="text-xs text-gray-400">
            Configure bidding thresholds, session periods and warehouse pickup
            logistics rules.
          </p>
        </div>

        <button
          onClick={handleFinalPublishSubmit}
          disabled={
            selectedProducts.length === 0 || publishAuctionMutation.isPending
          }
          className="h-11 px-6 bg-[#FF5A1F] text-sm font-semibold text-white rounded-lg hover:bg-[#e04e18] transition-all shadow-sm flex items-center gap-2 self-start sm:self-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {publishAuctionMutation.isPending
            ? "Publishing..."
            : "Confirm & Publish Campaign"}
        </button>
      </div>

      <form
        onSubmit={handleFinalPublishSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* --- Left Column: Configuration Forms (Takes 2/3 Space) --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="p-6 bg-[#F8FAFC] rounded-xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2">
              General Information
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Auction Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Premium Electronics Weekend Auction"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Event Rules / Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise breakdown info regarding specific terms, condition status guarantees..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Timing Schedules and Core Bidding Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auction Session Setup */}
            <div className="p-6 bg-[#F8FAFC] rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                Auction Period Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Launch Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={auctionStartDate}
                    onChange={(e) => setAuctionStartDate(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Kickoff Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={auctionStartTime}
                    onChange={(e) => setAuctionStartTime(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Campaign Duration (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={auctionDuration}
                    onChange={(e) => setAuctionDuration(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bidding System Parameters */}
            <div className="p-6 bg-[#F8FAFC] rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                Bidding Value Thresholds
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Starting Initial Bid ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={startingBid}
                    onChange={(e) => setStartingBid(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Minimum Bid Increment ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={bidIncrement}
                    onChange={(e) => setBidIncrement(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                {/* <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Reserve Target Price ($) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={reservePrice}
                    onChange={(e) => setReservePrice(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                  />
                </div> */}
              </div>
            </div>
          </div>

          {/* Fulfillment Rules Block */}
          <div className="p-6 bg-[#F8FAFC] rounded-xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2">
              Post-Auction Pickup Allocation Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Pickup Window Start *
                </label>
                <input
                  type="date"
                  required
                  value={pickupStartDate}
                  onChange={(e) => setPickupStartDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Pickup Window End *
                </label>
                <input
                  type="date"
                  required
                  value={pickupEndDate}
                  onChange={(e) => setPickupEndDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Total Valid Period (Days)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pickupDuration}
                  onChange={(e) => setPickupDuration(Number(e.target.value))}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Daily Opening Window *
                </label>
                <input
                  type="time"
                  required
                  value={pickupStartTime}
                  onChange={(e) => setPickupStartTime(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Daily Closing Cutoff *
                </label>
                <input
                  type="time"
                  required
                  value={pickupEndTime}
                  onChange={(e) => setPickupEndTime(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Column: Sticky Selection Sidebar Preview (Takes 1/3 Space) --- */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="bg-[#E2EAF8] px-4 py-3 text-xs font-bold text-[#3A5B77] flex justify-between items-center">
              <span>Selected Products Manifest</span>
              <span className="bg-white/70 px-2 py-0.5 rounded-full text-[10px]">
                {selectedProducts.length} Items
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {selectedProducts.length > 0 ? (
                selectedProducts.map((product) => (
                  <div
                    key={product._id}
                    className="p-3 hover:bg-slate-50/60 transition-colors flex items-start gap-2.5"
                  >
                    <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-semibold text-slate-700 truncate"
                        title={product.title}
                      >
                        {product.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        ID: {product.inventoryId}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {product.category}
                        </span>
                        <span className="text-[10px] font-medium capitalize text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {product.condition.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No products checked found in queue buffer context memory
                  stack.
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
