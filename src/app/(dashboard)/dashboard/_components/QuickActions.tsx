'use client';
import React from 'react';
import { Plus, Gavel, MapPin } from 'lucide-react';
import AddCategoryModal from './AddCategoryModal';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = React.useState(false);
  const router = useRouter();

  return (
    <div className="w-full bg-white rounded-xl border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <h3 className="font-bold text-[#0f233a] text-[16px] tracking-tight mb-5">Quick Actions</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Add Inventory */}
        <button
          onClick={() => router.push('/dashboard/inventory/add')}
          className="flex flex-col items-center justify-center bg-[#f8fafc]/60 border border-slate-100 rounded-xl p-5 min-h-[120px] transition-all duration-200 hover:bg-[#f1f5f9] hover:border-slate-200 group"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-transform duration-200 group-hover:scale-105">
            <Plus className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-[#0f233a] tracking-tight">Add Inventory</span>
        </button>

        {/* Add Category */}
        {/* <button
          onClick={() => setIsAddCategoryModalOpen(true)}
          className="flex flex-col items-center justify-center bg-[#f8fafc]/60 border border-slate-100 rounded-xl p-5 min-h-[120px] transition-all duration-200 hover:bg-[#f1f5f9] hover:border-slate-200 group"
        >
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <div className="flex flex-col items-center justify-center scale-90">
              <div className="w-5 h-2 bg-amber-400 rounded-sm mb-[2px]" />
              <div className="flex gap-[3px]">
                <div className="w-2 h-3 bg-slate-400 rounded-sm" />
                <div className="w-2.5 h-3 bg-rose-500 rounded-sm" />
              </div>
            </div>
          </div>

          <span className="text-sm font-medium text-[#0f233a] tracking-tight">
            Add Category
          </span>
        </button> */}

        <AddCategoryModal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
        />

        {/* Add Auctions */}
        <button
          onClick={() => router.push('/dashboard/auctions')}
          className="flex flex-col items-center justify-center bg-[#f8fafc]/60 border border-slate-100 rounded-xl p-5 min-h-[120px] transition-all duration-200 hover:bg-[#f1f5f9] hover:border-slate-200 group"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-transform duration-200 group-hover:scale-105">
            <Gavel className="w-5 h-5 text-amber-700" />
          </div>
          <span className="text-sm font-medium text-[#0f233a] tracking-tight">Add Auctions</span>
        </button>

        {/* Pickup Request */}
        <button
          onClick={() => router.push('/dashboard/pickup-request')}
          className="flex flex-col items-center justify-center bg-[#f8fafc]/60 border border-slate-100 rounded-xl p-5 min-h-[120px] transition-all duration-200 hover:bg-[#f1f5f9] hover:border-slate-200 group"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-transform duration-200 group-hover:scale-105">
            <MapPin className="w-5 h-5 text-rose-500 fill-rose-100" />
          </div>
          <span className="text-sm font-medium text-[#0f233a] tracking-tight">Pickup Request</span>
        </button>
      </div>
    </div>
  );
}
