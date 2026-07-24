'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInventoryModal({ isOpen, onClose }: AddInventoryModalProps) {
  const [inventoryName, setInventoryName] = useState('');

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setInventoryName('');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setInventoryName('');
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-[460px] rounded-2xl bg-white p-6 gap-0 border border-slate-100 shadow-xl sm:rounded-2xl">
        <DialogHeader className="relative pb-4 border-b border-slate-100">
          <DialogTitle className="text-[17px] font-bold text-[#0f233a]">
            Add New Inventory
          </DialogTitle>

          <DialogDescription className="mt-1 text-xs font-medium text-slate-400">
            Add a new inventory item to your inventory management system.
          </DialogDescription>

          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-0 top-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSave} className="pt-5">
          <div className="mb-6 space-y-2">
            <label htmlFor="inventoryName" className="block text-xs font-bold text-[#0f233a]">
              Inventory Name
            </label>

            <input
              id="inventoryName"
              type="text"
              required
              value={inventoryName}
              onChange={(e) => setInventoryName(e.target.value)}
              placeholder="e.g. MacBook Pro, Office Chair, Samsung TV"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#f95d2c] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setInventoryName('');
                onClose();
              }}
              className="w-full rounded-xl border border-orange-200 bg-white py-3 text-sm font-semibold text-[#f95d2c] transition-colors hover:bg-orange-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#f95d2c] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e04e1f]"
            >
              Save Inventory
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
