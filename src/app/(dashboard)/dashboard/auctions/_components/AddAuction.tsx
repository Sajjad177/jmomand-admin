"use client";

import React, { useState } from "react";
import { Calendar, Clock, Plus, Package, X, DollarSign, FileText, Edit3 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import ProductSelectModal, { InventoryProduct } from "./ProductSelectModal";
import { AuctionSummary } from "./AuctionSummary";
import { useAddAuctionHook } from "@/features/hook/useAuctionHook";

export default function CreateAuctionPage() {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    // React Query Hook for Publishing using useAddAuctionHook
    const { publishAuctionMutation } = useAddAuctionHook(token || null);

    // Selected Products State
    const [selectedItems, setSelectedItems] = useState<InventoryProduct[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Basic Information States
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Auction Schedule States
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [auctionDurationDays, setAuctionDurationDays] = useState<number>(0);
    const [isCustomAuctionDuration, setIsCustomAuctionDuration] = useState(false);

    // Bidding Price States
    const [startingBid, setStartingBid] = useState<number>(0);
    const [bidIncrement, setBidIncrement] = useState<number>(1);

    // Pickup Schedule States
    const [pickupStartDate, setPickupStartDate] = useState("");
    const [pickupEndDate, setPickupEndDate] = useState("");
    const [dailyStartTime, setDailyStartTime] = useState("");
    const [dailyEndTime, setDailyEndTime] = useState("");
    const [pickupDurationDays, setPickupDurationDays] = useState<number>(0);
    const [isCustomPickupDuration, setIsCustomPickupDuration] = useState(false);

    const durationDayOptions = [1, 2, 3, 5, 7, 10, 15];

    // Helper to extract string ID
    const getItemId = (item: InventoryProduct): string => {
        if (typeof item._id === "object" && item._id !== null && "$oid" in item._id) {
            return item._id.$oid;
        }
        return item._id as string;
    };

    const handleConfirmSelection = (newProducts: InventoryProduct[]) => {
        setSelectedItems((prev) => [...prev, ...newProducts]);
    };

    const handleRemoveItem = (id: string) => {
        setSelectedItems((prev) => prev.filter((item) => getItemId(item) !== id));
    };

    // Dynamic End Date Calculation
    const calculateEndDate = () => {
        if (!startDate || !startTime) return "N/A";
        const start = new Date(`${startDate}T${startTime}`);
        if (isNaN(start.getTime())) return "N/A";

        start.setDate(start.getDate() + Number(auctionDurationDays));
        return (
            start.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }) + ` ${startTime}`
        );
    };

    // Submit Handler
    const handlePublishAuction = async () => {
        if (selectedItems.length === 0) {
            toast.error("Please select at least one item for the auction.");
            return;
        }

        if (!title.trim()) {
            toast.error("Please provide an auction title.");
            return;
        }

        // Constructs EXACT payload required by Postman / Backend
        const payload = {
            products: selectedItems.map((item) => getItemId(item)),
            title: title.trim(),
            description: description.trim(),
            auctionSchedule: {
                startDate,
                startTime,
                durationInDays: Number(auctionDurationDays),
            },
            startingBid: Number(startingBid),
            bidIncrement: Number(bidIncrement),
            pickupSchedule: {
                startDate: pickupStartDate,
                endDate: pickupEndDate,
                dailyStartTime,
                dailyEndTime,
                durationInDays: Number(pickupDurationDays),
            },
        };


        // Call Hook Mutation
        publishAuctionMutation.mutate(payload, {
            onSuccess: () => {
                setSelectedItems([]);
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* LEFT / MAIN CONTENT */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Basic Details */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                            <h2 className="text-base font-bold text-slate-900">Auction Details</h2>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Auction Title</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Summer Clearance Mega Auction"
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
                                    />
                                    <FileText className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide auction overview..."
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* 2. Selected Items Section */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-slate-900">
                                    Selected Items ({selectedItems.length})
                                </h2>
                                {selectedItems.length > 0 && (
                                    <button
                                        onClick={() => setSelectedItems([])}
                                        className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                                {selectedItems.map((item) => {
                                    const itemId = getItemId(item);
                                    const img = item.images?.[0]?.url;
                                    return (
                                        <div
                                            key={itemId}
                                            className="relative group flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 min-w-[190px] shrink-0"
                                        >
                                            <button
                                                onClick={() => handleRemoveItem(itemId)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>

                                            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 overflow-hidden">
                                                {img ? (
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-slate-800 truncate max-w-[110px]">
                                                    {item.title}
                                                </p>
                                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                                    {item.inventoryId}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-orange-400 text-slate-500 hover:text-orange-500 rounded-xl p-3 min-w-[170px] min-h-[66px] shrink-0 transition-all text-xs font-semibold bg-slate-50/50 hover:bg-orange-50/20 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add More Items</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Pricing Configuration */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                            <h2 className="text-base font-bold text-slate-900">Bidding & Pricing Settings</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Starting Bid ($)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={0}
                                            value={startingBid}
                                            onChange={(e) => setStartingBid(Number(e.target.value))}
                                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 transition-all"
                                        />
                                        <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bid Increment ($)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={1}
                                            value={bidIncrement}
                                            onChange={(e) => setBidIncrement(Number(e.target.value))}
                                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 transition-all"
                                        />
                                        <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Auction Schedule */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
                            <h2 className="text-base font-bold text-slate-900">Auction Schedule</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-orange-500 transition-all"
                                        />
                                        <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-orange-500 transition-all"
                                        />
                                        <Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Auction Duration Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-slate-600">Duration (Days)</label>
                                    {isCustomAuctionDuration && (
                                        <span className="text-[11px] font-semibold text-orange-500">Custom Duration Mode</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    {durationDayOptions.map((days) => {
                                        const isSelected = !isCustomAuctionDuration && auctionDurationDays === days;
                                        return (
                                            <button
                                                key={days}
                                                type="button"
                                                onClick={() => {
                                                    setIsCustomAuctionDuration(false);
                                                    setAuctionDurationDays(days);
                                                }}
                                                className={`h-10 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                    ? "bg-blue-50 border-blue-400 text-blue-600 shadow-xs"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {days} {days === 1 ? "Day" : "Days"}
                                            </button>
                                        );
                                    })}

                                    {/* Custom Option Toggle Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCustomAuctionDuration(true);
                                            setAuctionDurationDays(1); // default start for custom
                                        }}
                                        className={`h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${isCustomAuctionDuration
                                            ? "bg-orange-50 border-orange-400 text-orange-600 shadow-xs"
                                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Custom</span>
                                    </button>
                                </div>

                                {/* Custom Days Input Field */}
                                {isCustomAuctionDuration && (
                                    <div className="mt-3 flex items-center gap-3 bg-orange-50/40 p-3 rounded-xl border border-orange-100 animate-in fade-in duration-150">
                                        <label className="text-xs font-medium text-slate-600">Enter custom duration:</label>
                                        <div className="relative w-28">
                                            <input
                                                type="number"
                                                min={1}
                                                max={365}
                                                value={auctionDurationDays}
                                                onChange={(e) => setAuctionDurationDays(Math.max(1, Number(e.target.value)))}
                                                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">Days</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 5. PickUp Schedule */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
                            <h2 className="text-base font-bold text-slate-900">PickUp Schedule</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pickup Start Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={pickupStartDate}
                                            onChange={(e) => setPickupStartDate(e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-orange-500 transition-all"
                                        />
                                        <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pickup End Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={pickupEndDate}
                                            onChange={(e) => setPickupEndDate(e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-orange-500 transition-all"
                                        />
                                        <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Daily Start Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={dailyStartTime}
                                            onChange={(e) => setDailyStartTime(e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-orange-500 transition-all"
                                        />
                                        <Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Daily End Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={dailyEndTime}
                                            onChange={(e) => setDailyEndTime(e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-orange-500 transition-all"
                                        />
                                        <Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Pickup Duration Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-slate-600">Pickup Duration (Days)</label>
                                    {isCustomPickupDuration && (
                                        <span className="text-[11px] font-semibold text-orange-500">Custom Pickup Duration Mode</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    {durationDayOptions.map((days) => {
                                        const isSelected = !isCustomPickupDuration && pickupDurationDays === days;
                                        return (
                                            <button
                                                key={days}
                                                type="button"
                                                onClick={() => {
                                                    setIsCustomPickupDuration(false);
                                                    setPickupDurationDays(days);
                                                }}
                                                className={`h-10 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                    ? "bg-blue-50 border-blue-400 text-blue-600 shadow-xs"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {days} {days === 1 ? "Day" : "Days"}
                                            </button>
                                        );
                                    })}

                                    {/* Custom Option Toggle Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCustomPickupDuration(true);
                                            setPickupDurationDays(1); // default start for custom
                                        }}
                                        className={`h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${isCustomPickupDuration
                                            ? "bg-orange-50 border-orange-400 text-orange-600 shadow-xs"
                                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Custom</span>
                                    </button>
                                </div>

                                {/* Custom Days Input Field */}
                                {isCustomPickupDuration && (
                                    <div className="mt-3 flex items-center gap-3 bg-orange-50/40 p-3 rounded-xl border border-orange-100 animate-in fade-in duration-150">
                                        <label className="text-xs font-medium text-slate-600">Enter custom pickup duration:</label>
                                        <div className="relative w-28">
                                            <input
                                                type="number"
                                                min={1}
                                                max={365}
                                                value={pickupDurationDays}
                                                onChange={(e) => setPickupDurationDays(Math.max(1, Number(e.target.value)))}
                                                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">Days</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT SIDEBAR */}
                    <AuctionSummary
                        selectedItems={selectedItems}
                        startDate={startDate}
                        startTime={startTime}
                        auctionDurationDays={auctionDurationDays}
                        pickupDurationDays={pickupDurationDays}
                        startingBid={startingBid}
                        bidIncrement={bidIncrement}
                        calculateEndDate={calculateEndDate}
                        getItemId={getItemId}
                        handlePublishAuction={handlePublishAuction}
                        isPublishing={publishAuctionMutation.isPending}
                    />

                </div>
            </div>

            {/* Modal Selection Component */}
            <ProductSelectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                token={token}
                alreadySelectedIds={selectedItems.map((item) => getItemId(item))}
                onConfirmSelection={handleConfirmSelection}
            />
        </div>
    );
}
