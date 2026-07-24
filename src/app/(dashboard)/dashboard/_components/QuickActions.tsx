'use client';

import React from 'react';
import { Plus, Gavel, MapPin, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

export default function QuickActions() {
  const router = useRouter();

  const actions: QuickActionItem[] = [
    {
      id: 'inventory',
      title: 'Add Inventory',
      description: 'Create new catalog item',
      icon: Plus,
      iconBg: 'bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:border-indigo-600',
      iconColor: 'text-indigo-600 group-hover:text-white',
      onClick: () => router.push('/dashboard/inventory/add'),
    },
    {
      id: 'auctions',
      title: 'Create Auction',
      description: 'Schedule bidding event',
      icon: Gavel,
      iconBg: 'bg-amber-50 border-amber-100 group-hover:bg-amber-500 group-hover:border-amber-500',
      iconColor: 'text-amber-700 group-hover:text-white',
      onClick: () => router.push('/dashboard/auctions'),
    },
    {
      id: 'pickup',
      title: 'Pickup Request',
      description: 'Manage logistics & slots',
      icon: MapPin,
      iconBg: 'bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:border-emerald-600',
      iconColor: 'text-emerald-600 group-hover:text-white',
      onClick: () => router.push('/dashboard/pickup-request'),
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* Header Section */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            Quick Actions
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Shortcuts for common management tasks
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {actions.length} Shortcuts
        </span>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {/* Arrow indicator on hover */}
              <div className="absolute right-3.5 top-3.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100">
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${action.iconBg}`}
                >
                  <Icon className={`h-5 w-5 transition-colors duration-200 ${action.iconColor}`} />
                </div>

                <div className="pr-4">
                  <span className="block text-sm font-semibold tracking-tight text-slate-900">
                    {action.title}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">
                    {action.description}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}