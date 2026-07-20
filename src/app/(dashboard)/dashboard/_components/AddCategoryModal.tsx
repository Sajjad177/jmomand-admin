"use client";

import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCategoryModal({
  isOpen,
  onClose,
}: AddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async () => {
      if (!image) throw new Error("Category image is required");
      const formData = new FormData();
      formData.append("name", categoryName.trim());
      formData.append("image", image);
      return apiRequest<unknown>("/category", session?.user?.accessToken, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(result.message || "Category created");
      setCategoryName("");
      setImage(null);
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    createCategory.mutate();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCategoryName("");
          setImage(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-[460px] rounded-2xl bg-white p-6 gap-0 border border-slate-100 shadow-xl sm:rounded-2xl">
        <DialogHeader className="relative pb-4 border-b border-slate-100">
          <DialogTitle className="text-[17px] font-bold text-[#0f233a]">
            Add New Category
          </DialogTitle>

          <DialogDescription className="mt-1 text-xs font-medium text-slate-400">
            Create a new category to organize your inventory and auctions.
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
            <label
              htmlFor="categoryName"
              className="block text-xs font-bold text-[#0f233a]"
            >
              Category Name
            </label>

            <input
              id="categoryName"
              type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Electronics, Home Appliances, Tools"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#f95d2c] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <label
              htmlFor="categoryImage"
              className="mt-4 block text-xs font-bold text-[#0f233a]"
            >
              Category Image
            </label>
            <input
              ref={imageInputRef}
              id="categoryImage"
              type="file"
              accept="image/*"
              required
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:font-semibold file:text-[#f95d2c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setCategoryName("");
                setImage(null);
                onClose();
              }}
              disabled={createCategory.isPending}
              className="w-full rounded-xl border border-orange-200 bg-white py-3 text-sm font-semibold text-[#f95d2c] transition-colors hover:bg-orange-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createCategory.isPending}
              className="w-full rounded-xl bg-[#f95d2c] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e04e1f]"
            >
              {createCategory.isPending ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
