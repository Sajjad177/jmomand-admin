"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number; // কতগুলো পেজ নম্বর পাশাপাশি দেখাবে
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  // 🧠 Smart Page Range Generator (Ellipsis Logic)
  const getPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3; // current + siblings + first + last
    const totalBlocks = totalNumbers + 2; // + 2 for ellipses

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full py-4 font-sans">
      {/* ⬅️ Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
        Previous
      </button>

      {/* 🔢 Page Numbers */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`dots-${index}`}
                className="w-9 h-9 flex items-center justify-center text-xs font-medium text-slate-400 select-none"
              >
                .....
              </span>
            );
          }

          const isCurrent = page === currentPage;

          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(Number(page))}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                isCurrent
                  ? "bg-[#DDE7F7] text-[#1D4ED8] font-bold shadow-xs" // Image 1-এর মতো Soft Blue Active State
                  : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* ➡️ Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        Next
        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
      </button>
    </div>
  );
}

export function Pager({
  page,
  totalPages,
  isFetching,
  onPage,
}: {
  page: number;
  totalPages: number;
  isFetching?: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      onPageChange={onPage}
    />
  );
}