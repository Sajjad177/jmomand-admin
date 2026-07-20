"use client";

import React, { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; 
import { FiUploadCloud, FiX, FiFileText } from "react-icons/fi";
import { LuDownload } from "react-icons/lu";
import JSZip from "jszip";

// Shadcn UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

interface BulkResponse {
  success: boolean;
  message?: string;
}

interface ParsedProduct {
  name: string;
  category: string;
  condition: string;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  token,
}: BulkImportModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewItems, setPreviewItems] = useState<ParsedProduct[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  
  // New state for type selection (defaulting to "for_sale")
  const [type, setType] = useState<"for_sale" | "for_auction">("for_sale");

  // TanStack Query Mutation
  const bulkImportMutation = useMutation({
    mutationKey: ["bulkImportMutation"],
    mutationFn: async (formData: FormData) => {
      if (!token) {
        throw new Error("Please login again before uploading files. Token is missing.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = (await response.json().catch(() => ({}))) as BulkResponse;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to bulk import products");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Bulk products imported successfully!");
      await queryClient.invalidateQueries({ queryKey: ["inventoryData"] });
      await queryClient.invalidateQueries({ queryKey: ["auctionData"] });
      handleRemoveFile();
      onClose(); 
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import bulk products");
    },
  });

  // Client-side ZIP & CSV Parser Logic
  const parseZipFile = async (zipFile: File) => {
    setIsParsing(true);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(zipFile);
      
      const csvFileEntry = Object.keys(content.files).find((path) =>
        path.endsWith("products.csv")
      );

      if (!csvFileEntry) {
        toast.error("Could not find 'products.csv' inside the uploaded ZIP file.");
        setIsParsing(false);
        return;
      }

      const csvText = await content.files[csvFileEntry].async("text");
      
      const lines = csvText.split(/\r?\n/);
      if (lines.length <= 1) {
        setPreviewItems([]);
        setIsParsing(false);
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const nameIndex = headers.indexOf("name") !== -1 ? headers.indexOf("name") : 0;
      const categoryIndex = headers.indexOf("category") !== -1 ? headers.indexOf("category") : 1;
      const conditionIndex = headers.indexOf("condition") !== -1 ? headers.indexOf("condition") : 2;

      const parsedProducts: ParsedProduct[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const columns = lines[i].split(",");
        
        if (columns.length > 0) {
          parsedProducts.push({
            name: columns[nameIndex]?.replace(/"/g, "").trim() || "Unknown Product",
            category: columns[categoryIndex]?.replace(/"/g, "").trim() || "General",
            condition: columns[conditionIndex]?.replace(/"/g, "").trim() || "New",
          });
        }
      }

      setPreviewItems(parsedProducts);
    } catch (err) {
      console.error(err);
      toast.error("Error reading data from inside ZIP file.");
    } finally {
      setIsParsing(false);
    }
  };

  // File Handlers
  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    if (selectedFile.name.endsWith(".zip")) {
      parseZipFile(selectedFile);
    } else {
      setPreviewItems([]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewItems([]);
    setType("for_sale"); // resetting state
  };

  const handleImportSubmit = () => {
    if (!file) {
      toast.error("Please select or drop a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file); 
    formData.append("type", type); // Append selection input directly into backend request data

    bulkImportMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[540px] p-0 overflow-hidden bg-white rounded-xl border border-slate-100 shadow-2xl">
        
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-slate-100 flex flex-row items-center justify-between relative">
          <div>
            <DialogTitle className="text-base font-semibold text-slate-800">Bulk Import</DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your structured ZIP containing products data and assets.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
              isDragging 
                ? "border-blue-500 bg-blue-50/50" 
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="file"
              id="bulk-file-input"
              className="hidden"
              accept=".zip"
              onChange={handleFileChange}
            />
            <label htmlFor="bulk-file-input" className="cursor-pointer flex flex-col items-center">
              <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center shadow-sm mb-3">
                <FiUploadCloud className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">Drag & drop your ZIP file here</p>
              <p className="text-xs text-slate-400 mt-1">
                or <span className="text-blue-600 hover:underline">click to browse</span> · up to 25MB
              </p>
            </label>
          </div>

          {/* Uploaded File Detail Component */}
          {file && (
            <div className="border border-slate-100 rounded-xl p-3 flex items-center justify-between bg-white shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 line-clamp-1 max-w-[240px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB · {isParsing ? "Extracting data..." : "Ready to process"}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                className="text-slate-400 hover:text-blue-600 flex items-center gap-1.5 text-xs font-medium border border-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <LuDownload className="w-3.5 h-3.5" />
                <span>Sample Template</span>
              </button>
            </div>
          )}

          {/* New Dynamic Select Box Field */}
          <div className="space-y-1.5">
            <label htmlFor="import-type" className="text-xs font-semibold text-slate-700">
              Listing Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="import-type"
              value={type}
              onChange={(e) => setType(e.target.value as "for_sale" | "for_auction")}
              className="w-full h-10 px-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="for_sale">For Sale</option>
              <option value="for_auction">For Auction</option>
            </select>
          </div>

          {/* Dynamic Preview Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700">Preview Items ({previewItems.length})</h4>
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-[#EAF1F9] px-4 py-2 text-[11px] font-medium text-slate-600">
                <div>Product Name</div>
                <div className="pl-4">Category</div>
                <div>Condition</div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-slate-50 bg-white max-h-[160px] overflow-y-auto">
                {isParsing ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading dynamic preview...</div>
                ) : previewItems.length > 0 ? (
                  previewItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 px-4 py-2.5 text-xs text-slate-700 items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-blue-500 font-bold">📦</span>
                        </div>
                        <span className="truncate pr-2 font-medium" title={item.name}>{item.name}</span>
                      </div>
                      <div className="pl-4 text-slate-500 truncate" title={item.category}>{item.category}</div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-600 capitalize">{item.condition}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No files uploaded yet or empty dataset.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            {previewItems.length > 0 ? `${previewItems.length} items ready to import` : "0 items ready to import"}
          </p>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveFile}
              disabled={!file || bulkImportMutation.isPending}
              className="h-9 px-4 text-xs font-semibold text-rose-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImportSubmit}
              disabled={!file || bulkImportMutation.isPending || isParsing}
              className="h-9 px-5 text-xs font-semibold bg-[#FF621F] hover:bg-[#e05317] text-white rounded-lg shadow-sm"
            >
              {bulkImportMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
