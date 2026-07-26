'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PickupScheduleStatus } from './pickup-requests';

const statusOptionsConfig: Record<
  PickupScheduleStatus,
  { label: string; dotColor: string; description: string }
> = {
  requested: {
    label: 'Requested',
    dotColor: 'bg-amber-500',
    description: 'Pending initial review',
  },
  approved: {
    label: 'Approved',
    dotColor: 'bg-emerald-500',
    description: 'Ready for warehouse pickup',
  },
  rejected: {
    label: 'Rejected',
    dotColor: 'bg-rose-500',
    description: 'Declined or needs change',
  },
  completed: {
    label: 'Completed',
    dotColor: 'bg-blue-500',
    description: 'Item handed over to winner',
  },
  cancelled: {
    label: 'Cancelled',
    dotColor: 'bg-slate-400',
    description: 'Voided by user or admin',
  },
};

type ActionBarProps = {
  currentStatus: PickupScheduleStatus;
  selectedStatus: PickupScheduleStatus;
  isUpdating: boolean;
  onStatusChange: (status: PickupScheduleStatus) => void;
  onUpdateStatus: () => void;
};

export function PickupStatusActionBar({
  currentStatus,
  selectedStatus,
  isUpdating,
  onStatusChange,
  onUpdateStatus,
}: ActionBarProps) {
  const hasStatusChanged = selectedStatus !== currentStatus;

  return (
    <div className="px-6 py-4 transition-all">
      <div className="flex flex-col gap-3">
        {/* Main Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Left: Status Selector + Current State Badge */}
          <div className="flex flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Status:
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger className="h-10 w-full sm:w-[210px] bg-white border-slate-200 text-xs font-semibold text-slate-800 rounded-xl shadow-2xs focus:ring-2 focus:ring-slate-900/10 transition-all">
                  <SelectValue placeholder="Select status">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          statusOptionsConfig[selectedStatus]?.dotColor || 'bg-slate-400'
                        }`}
                      />
                      <span>{statusOptionsConfig[selectedStatus]?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start" className="rounded-xl border-slate-200 shadow-xl p-1">
                  {(Object.keys(statusOptionsConfig) as PickupScheduleStatus[]).map((status) => {
                    const option = statusOptionsConfig[status];
                    return (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-xs font-medium rounded-lg py-2 cursor-pointer focus:bg-slate-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 rounded-full ${option.dotColor}`} />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{option.label}</span>
                            <span className="text-[10px] text-slate-400">{option.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              disabled={!hasStatusChanged || isUpdating}
              onClick={onUpdateStatus}
              className={`h-10 px-6 text-xs font-bold tracking-wide transition-all shadow-xs rounded-xl flex items-center gap-2 ${
                hasStatusChanged
                  ? 'bg-[#FE6819] hover:bg-[#FE6819] text-white shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>Save</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
