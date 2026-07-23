"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Check, Package, Loader2 } from "lucide-react";
import { useAuctionProductsQuery } from "@/features/hook/useAuctionHook";

export interface InventoryProduct {
  _id: string | { $oid: string };
  inventoryId: string;
  title: string;
  category: string;
  price: number;
  condition?: string;
  inventoryStatus?: string;
  images?: { url: string; public_id?: string }[];
}

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  alreadySelectedIds: string[];
  onConfirmSelection: (selectedProducts: InventoryProduct[]) => void;
}

export default function ProductSelectModal({
  isOpen,
  onClose,
  token,
  alreadySelectedIds = [],
  onConfirmSelection,
}: ProductSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMap, setSelectedMap] = useState<Record<string, InventoryProduct>>({});

  // Helper to extract string ID from string or MongoDB $oid object
  const getProductId = (product: InventoryProduct): string => {
    if (typeof product._id === "object" && product._id !== null && "$oid" in product._id) {
      return product._id.$oid;
    }
    return product._id as string;
  };

  // Reset internal selection state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedMap({});
      setSearchTerm("");
    }
  }, [isOpen]);

  // Fetch auction items directly using /products/auctions
  const { data: responseData, isLoading, isError, error } = useAuctionProductsQuery(
    token || null,
    searchTerm,
    isOpen
  );

  const products: InventoryProduct[] = responseData?.data || [];

  // Filter out products that are already added to the parent form
  const selectableProducts = products.filter(
    (product) => !alreadySelectedIds.includes(getProductId(product))
  );

  // Toggle individual product selection
  const toggleSelect = (product: InventoryProduct) => {
    const id = getProductId(product);
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = product;
      }
      return next;
    });
  };

  // Toggle Select All for all currently visible & available products
  const handleToggleSelectAll = () => {
    const allSelectableChecked =
      selectableProducts.length > 0 &&
      selectableProducts.every((p) => !!selectedMap[getProductId(p)]);

    if (allSelectableChecked) {
      // Clear current selection
      setSelectedMap({});
    } else {
      // Select all available products in current view
      const newMap: Record<string, InventoryProduct> = {};
      selectableProducts.forEach((p) => {
        newMap[getProductId(p)] = p;
      });
      setSelectedMap(newMap);
    }
  };

  // Confirm selection & log output
  const handleAdd = () => {
    const selectedProductList = Object.values(selectedMap);
    const productIdsArray = selectedProductList.map((p) => getProductId(p));

    // Console logging the extracted product ObjectIds for payload verification
    console.log("Selected Product IDs for Auction Payload:", productIdsArray);
    console.log("Selected Product Details:", selectedProductList);

    onConfirmSelection(selectedProductList);
    onClose();
  };

  if (!isOpen) return null;

  const isAllSelected =
    selectableProducts.length > 0 &&
    selectableProducts.every((p) => !!selectedMap[getProductId(p)]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Select Items for Auction</h3>
            <p className="text-xs text-slate-500">
              Select multiple products to include in this auction campaign
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product title or inventory ID..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 text-xs font-medium text-slate-700 placeholder-slate-400 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-xs font-medium">Loading auction items...</span>
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-xs text-rose-500">
              {(error as Error)?.message || "Failed to load products"}
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    {/* Header Select All Checkbox */}
                    <th className="py-2.5 px-3 w-12">
                      <div
                        onClick={handleToggleSelectAll}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                          isAllSelected
                            ? "bg-[#FF5A1F] border-[#FF5A1F] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                        title="Select All Available"
                      >
                        {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Inventory ID</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const productId = getProductId(product);
                    const isAlreadyAdded = alreadySelectedIds.includes(productId);
                    const isChecked = !!selectedMap[productId];
                    const img = product.images?.[0]?.url;

                    return (
                      <tr
                        key={productId}
                        onClick={() => !isAlreadyAdded && toggleSelect(product)}
                        className={`transition-colors ${
                          isAlreadyAdded
                            ? "opacity-40 bg-slate-50 cursor-not-allowed"
                            : isChecked
                            ? "bg-orange-50/50 cursor-pointer"
                            : "hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isAlreadyAdded
                                ? "bg-slate-200 border-slate-300"
                                : isChecked
                                ? "bg-[#FF5A1F] border-[#FF5A1F] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {(isChecked || isAlreadyAdded) && (
                              <Check className="w-3 h-3 stroke-[3]" />
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2.5 max-w-xs">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {img ? (
                                <img
                                  src={img}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <span className="truncate">{product.title}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                          {product.inventoryId}
                        </td>

                        <td className="py-3 px-3 text-slate-500">
                          {product.category || "-"}
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          ${product.price}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No available auction products found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            {Object.keys(selectedMap).length} item(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={Object.keys(selectedMap).length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5A1F] hover:bg-[#e04d18] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected ({Object.keys(selectedMap).length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}