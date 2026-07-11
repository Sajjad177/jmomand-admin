import React from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpFromLine,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Headphones,
} from "lucide-react";
import Link from "next/link";

// Dummy JSON Data Structure matching your layout
const dummyProducts = [
  {
    id: "#ORD0001",
    name: "Wireless Bluetooth...",
    category: "Electronics",
    condition: "New",
    quantity: 265,
  },
  {
    id: "#ORD0002",
    name: "Smartwatch Series 5",
    category: "Electronics",
    condition: "New",
    quantity: 265,
  },
  {
    id: "#ORD0003",
    name: "Gaming Laptop RT...",
    category: "Computers",
    condition: "Refurbished",
    quantity: 265,
  },
  {
    id: "#ORD0005",
    name: "Wireless Charging...",
    category: "Accessories",
    condition: "New",
    quantity: 265,
  },
  {
    id: "#ORD0006",
    name: "Bluetooth Speaker...",
    category: "Audio",
    condition: "New",
    quantity: 265,
  },
  {
    id: "#ORD0007",
    name: "Smart Home Securi...",
    category: "Electronics",
    condition: "New",
    quantity: 265,
  },
  {
    id: "#ORD0007",
    name: "Smart Home Securi...",
    category: "Electronics",
    condition: "New",
    quantity: 265,
  },
  {
    id: "#ORD0007",
    name: "Smart Home Securi...",
    category: "Electronics",
    condition: "New",
    quantity: 265,
  },
  {
    id: "#ORD0008",
    name: "Portable SSD 1TB",
    category: "Storage",
    condition: "New",
    quantity: 265,
  },
  {
    id: "#ORD0009",
    name: "Ergonomic Office C...",
    category: "Furniture",
    condition: "New",
    quantity: 265,
  },
];

export default function ProductDashboard() {
  return (
    <div className="w-full container bg-white rounded-xl border border-gray-100 shadow-sm p-8 font-sans">
      {/* --- Top Action Bar --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Title and Count */}
        <div className="text-lg font-semibold text-gray-800">
          All Product{" "}
          <span className="text-[#FF5A1F] font-medium ml-1">(145)</span>
        </div>

        {/* Controls Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search Products......"
              className="w-full h-10 pl-4 pr-10 bg-[#F5F7FA] text-sm text-gray-600 placeholder-gray-400 rounded-lg outline-none focus:ring-1 focus:ring-gray-200 transition-all"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Filter Button */}
          <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          </button>

          {/* Bulk Import Button */}
          <button className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowUpFromLine className="w-4 h-4 text-gray-500" />
            Bulk Import
          </button>

          {/* Add Item Button */}
          <button className=" h-10 px-4 bg-[#FF5A1F] text-sm font-medium text-white rounded-lg hover:bg-[#e04e18] transition-colors shadow-sm">
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
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-6 text-center rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dummyProducts.map((product, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                {/* Product ID */}
                <td className="py-4 px-6 text-sm font-medium text-gray-700 whitespace-nowrap">
                  {product.id}
                </td>

                {/* Product Image & Name */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[160px] truncate">
                      {product.name}
                    </span>
                  </div>
                </td>

                {/* Category */}
                <td className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
                  {product.category}
                </td>

                {/* Condition Status */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        product.condition === "New"
                          ? "bg-[#10B981]"
                          : "bg-[#F97316]"
                      }`}
                    />
                    {product.condition}
                  </div>
                </td>

                {/* Quantity */}
                <td className="py-4 px-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                  {product.quantity}
                </td>

                {/* Action Row Button */}
                <td className="py-4 px-6 text-center whitespace-nowrap">
                  <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Pagination Footer --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-2">
        {/* Previous Button */}
        <button className="flex items-center gap-1 h-9 px-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1.5">
          <button className="w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-md bg-[#D9E4F7] text-[#2563EB]">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md text-gray-500 border border-gray-200 hover:bg-gray-50">
            2
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md text-gray-500 border border-gray-200 hover:bg-gray-50">
            3
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md text-gray-500 border border-gray-200 hover:bg-gray-50">
            4
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md text-gray-500 border border-gray-200 hover:bg-gray-50">
            5
          </button>
          <span className="text-gray-400 text-xs px-1">.....</span>
          <button className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md text-gray-500 border border-gray-200 hover:bg-gray-50">
            24
          </button>
        </div>

        {/* Next Button */}
        <button className="flex items-center gap-1 h-9 px-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
