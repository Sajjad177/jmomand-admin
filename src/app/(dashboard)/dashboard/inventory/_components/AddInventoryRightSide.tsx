'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Tag,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Eye,
  Building2,
  ShieldCheck,
  Palette,
} from 'lucide-react';

interface ImagePreview {
  id: string;
  url: string;
  name?: string;
}

interface AddInventoryRightSideProps {
  categoryImage?: ImagePreview | null;
  images: ImagePreview[];
  productName: string;
  manufacturer: string;
  colors: string[];
  category: string;
  condition: string;
  type: 'for_sale' | 'for_auction' | string;
  reservePrice: string;
  quantity: string;
  price: string;
}

// Helper to format raw condition strings into human-readable labels
const formatCondition = (str: string) => {
  if (!str) return 'Unspecified';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

// Helper to map color strings to inline preview colors
const getColorDot = (colorName: string) => {
  const normalized = colorName.toLowerCase().trim();
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#eab308',
    purple: '#a855f7',
    pink: '#ec4899',
    gray: '#6b7280',
    grey: '#6b7280',
    silver: '#cbd5e1',
    gold: '#eab308',
    orange: '#f97316',
    midnight: '#0f172a',
    starlight: '#f1f5f9',
  };

  return colorMap[normalized] || '#94a3b8';
};

export default function AddInventoryRightSide({
  categoryImage,
  images = [],
  productName,
  manufacturer,
  colors = [],
  category,
  condition,
  type = 'for_sale',
  reservePrice,
  quantity,
  price,
}: AddInventoryRightSideProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fallback to primary image if active image index is deleted
  useEffect(() => {
    if (selectedImageIndex >= images.length) {
      setSelectedImageIndex(0);
    }
  }, [images.length, selectedImageIndex]);

  const activeImage = images[selectedImageIndex]?.url;
  const filteredColors = colors.filter((c) => c && c.trim().length > 0);
  const isAuction = type === 'for_auction';

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#004242]/10 text-[#004242]">
            <Eye className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">Live Store Preview</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Sync
        </span>
      </div>

      {/* Main Preview Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-300">
        {/* CARD TOP MEDIA / GALLERY */}
        <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100/50 border-b border-slate-100 flex items-center justify-center p-4 group">
          {activeImage ? (
            <img
              src={activeImage}
              alt="Product Preview"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="p-3 rounded-2xl bg-white shadow-xs border border-slate-100">
                <ImageIcon className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-xs font-medium text-slate-400">No photos uploaded yet</span>
            </div>
          )}

          {/* Listing Type Tag */}
          <div className="absolute top-3 left-3 z-10">
            {isAuction ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Auction
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#004242] text-white shadow-md shadow-[#004242]/20">
                <Tag className="w-3.5 h-3.5" />
                For Sale
              </span>
            )}
          </div>

          {/* Condition Tag */}
          {condition && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/95 backdrop-blur-md text-slate-700 border border-slate-200/80 shadow-xs">
                {formatCondition(condition)}
              </span>
            </div>
          )}

          {/* Category Overlay Avatar */}
          {categoryImage?.url && (
            <div className="absolute bottom-3 right-3 z-10">
              <div className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-1 shadow-sm flex items-center justify-center overflow-hidden">
                <img
                  src={categoryImage.url}
                  alt={category || 'Category'}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* GALLERY THUMBNAILS ROW */}
        {images.length > 1 && (
          <div className="flex gap-2 p-3 bg-slate-50/60 border-b border-slate-100 overflow-x-auto scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-11 h-11 rounded-xl border overflow-hidden shrink-0 bg-white p-0.5 transition-all duration-150 ${
                  selectedImageIndex === idx
                    ? 'border-[#004242] ring-2 ring-[#004242]/20 shadow-xs scale-105'
                    : 'border-slate-200 opacity-60 hover:opacity-100 hover:scale-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </button>
            ))}
          </div>
        )}

        {/* CARD BODY CONTENT */}
        <div className="p-5 space-y-4">
          {/* Title & Brand Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {manufacturer || <span className="text-slate-400 italic">Brand Unspecified</span>}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
              {productName || (
                <span className="text-slate-300 italic">Product Title Pending...</span>
              )}
            </h4>
          </div>

          {/* Pricing & Stock Highlight Box */}
          <div
            className={`p-4 rounded-xl border transition-colors ${
              isAuction
                ? 'bg-amber-50/40 border-amber-200/70'
                : 'bg-emerald-50/40 border-emerald-200/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {isAuction ? 'Reserve Price' : 'Listed Price'}
                </span>
                <div className="text-2xl font-black text-slate-900 mt-0.5 flex items-baseline">
                  {isAuction ? (
                    reservePrice ? (
                      `$${Number(reservePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    ) : (
                      <span className="text-slate-300 text-lg font-medium">$0.00</span>
                    )
                  ) : price ? (
                    `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  ) : (
                    <span className="text-slate-300 text-lg font-medium">$0.00</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {isAuction ? 'Auction Format' : 'Stock Level'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md mt-1 ${
                    isAuction ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  {isAuction ? 'Open Bidding' : `${quantity || 1} Available`}
                </span>
              </div>
            </div>
          </div>

          {/* Color Variants Chips */}
          {filteredColors.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                Color Options ({filteredColors.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filteredColors.map((col, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: getColorDot(col) }}
                    />
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selected Metadata Badges */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs">
            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Category
              </span>
              {category ? (
                <span className="font-semibold text-teal-900 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                  {category}
                </span>
              ) : (
                <span className="text-slate-300 italic">Not set</span>
              )}
            </div>

            {/* Condition */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Condition
              </span>
              {condition ? (
                <span className="font-semibold text-slate-800 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md">
                  {formatCondition(condition)}
                </span>
              ) : (
                <span className="text-slate-300 italic">Not set</span>
              )}
            </div>
          </div>
        </div>

        {/* CARD FOOTER */}
        <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Card State</span>
          <span className="font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
            Draft Preview
          </span>
        </div>
      </div>
    </div>
  );
}
