'use client';

import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiUploadCloud, FiX, FiFileText, FiPackage } from 'react-icons/fi';
import { LuDownload } from 'react-icons/lu';
import JSZip from 'jszip';

// Shadcn UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

export default function BulkImportModal({ isOpen, onClose, token }: BulkImportModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewItems, setPreviewItems] = useState<ParsedProduct[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // New state for type selection (defaulting to "for_sale")
  const [type, setType] = useState<'for_sale' | 'for_auction'>('for_sale');

  // TanStack Query Mutation
  const bulkImportMutation = useMutation({
    mutationKey: ['bulkImportMutation'],
    mutationFn: async (formData: FormData) => {
      if (!token) {
        throw new Error('Please login again before uploading files. Token is missing.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/products/bulk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as BulkResponse;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to bulk import products');
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || 'Bulk products imported successfully!');
      await queryClient.invalidateQueries({ queryKey: ['inventoryData'] });
      await queryClient.invalidateQueries({ queryKey: ['auctionData'] });
      handleRemoveFile();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import bulk products');
    },
  });

  // Client-side ZIP & CSV Parser Logic
  const parseZipFile = async (zipFile: File) => {
    setIsParsing(true);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(zipFile);

      const csvFileEntry = Object.keys(content.files).find((path) => path.endsWith('products.csv'));

      if (!csvFileEntry) {
        toast.error("Could not find 'products.csv' inside the uploaded ZIP file.");
        setIsParsing(false);
        return;
      }

      const csvText = await content.files[csvFileEntry].async('text');

      const lines = csvText.split(/\r?\n/);
      if (lines.length <= 1) {
        setPreviewItems([]);
        setIsParsing(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const nameIndex = headers.indexOf('name') !== -1 ? headers.indexOf('name') : 0;
      const categoryIndex = headers.indexOf('category') !== -1 ? headers.indexOf('category') : 1;
      const conditionIndex = headers.indexOf('condition') !== -1 ? headers.indexOf('condition') : 2;

      const parsedProducts: ParsedProduct[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const columns = lines[i].split(',');

        if (columns.length > 0) {
          parsedProducts.push({
            name: columns[nameIndex]?.replace(/"/g, '').trim() || 'Unknown Product',
            category: columns[categoryIndex]?.replace(/"/g, '').trim() || 'General',
            condition: columns[conditionIndex]?.replace(/"/g, '').trim() || 'New',
          });
        }
      }

      setPreviewItems(parsedProducts);
    } catch (err) {
      console.error(err);
      toast.error('Error reading data from inside ZIP file.');
    } finally {
      setIsParsing(false);
    }
  };

  // File Handlers
  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    if (selectedFile.name.endsWith('.zip')) {
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
    setType('for_sale'); // resetting state
  };

  const handleImportSubmit = () => {
    if (!file) {
      toast.error('Please select or drop a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    bulkImportMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[540px] p-0 overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-2xl antialiased text-slate-800">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-slate-100 flex flex-row items-center justify-between relative bg-white">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
              Bulk Import
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Upload your structured ZIP containing products data and assets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer relative group ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
                : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 hover:border-slate-300'
            }`}
          >
            <input
              type="file"
              id="bulk-file-input"
              className="hidden"
              accept=".zip"
              onChange={handleFileChange}
            />
            <label
              htmlFor="bulk-file-input"
              className="cursor-pointer flex flex-col items-center w-full"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 mb-3 ${
                  isDragging
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200/60'
                }`}
              >
                <FiUploadCloud className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {isDragging ? 'Drop your ZIP file here' : 'Drag & drop your ZIP file here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                or{' '}
                <span className="text-blue-600 font-medium group-hover:underline">
                  click to browse
                </span>{' '}
                · up to 25MB
              </p>
            </label>
          </div>

          {/* Uploaded File Detail Badge */}
          {file && (
            <div className="border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between bg-white shadow-xs">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                  <FiFileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-[240px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={
                        isParsing ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'
                      }
                    >
                      {isParsing ? 'Extracting data...' : 'Ready to process'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 text-xs font-semibold border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
              >
                <LuDownload className="w-3.5 h-3.5" />
                <span>Sample Template</span>
              </button>
            </div>
          )}

          {/* Listing Type Select Box */}
          <div className="space-y-1.5">
            <label
              htmlFor="import-type"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Listing Type <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="import-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'for_sale' | 'for_auction')}
                className="w-full h-11 px-3.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer appearance-none"
              >
                <option value="for_sale">Fixed Price (For Sale)</option>
                <option value="for_auction">Auction</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Dynamic Preview Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Preview Items ({previewItems.length})
              </h4>
            </div>

            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-slate-50/80 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <div>Product Name</div>
                <div className="pl-2">Category</div>
                <div>Condition</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-100 max-h-[170px] overflow-y-auto">
                {isParsing ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                    Extracting dynamic preview data...
                  </div>
                ) : previewItems.length > 0 ? (
                  previewItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 px-4 py-2.5 text-xs text-slate-700 items-center hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                          <FiPackage className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate font-semibold text-slate-800" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div className="pl-2 text-slate-500 truncate" title={item.category}>
                        {item.category || '—'}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="text-slate-600 font-medium capitalize truncate">
                          {item.condition}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No file selected or empty dataset found in ZIP.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            {previewItems.length > 0
              ? `${previewItems.length} items ready to import`
              : '0 items ready to import'}
          </p>
          <div className="flex items-center space-x-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveFile}
              disabled={!file || bulkImportMutation.isPending}
              className="h-10 px-4 text-xs font-semibold text-rose-600 hover:text-rose-700 border-slate-200 hover:bg-rose-50/50 rounded-xl transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImportSubmit}
              disabled={!file || bulkImportMutation.isPending || isParsing}
              className="h-10 px-6 text-xs font-semibold bg-[#FF621F] hover:bg-[#e05317] active:bg-[#c94912] text-white rounded-xl shadow-xs transition-colors"
            >
              {bulkImportMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
