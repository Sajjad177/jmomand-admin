'use client';

import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { useState } from 'react';
import { createPickupSlot, getPickupSlots } from '../../features/admin-dashboard/api';
import { toast } from 'sonner';
import { Badge, formatDate, PageShell, RecordsTable } from '../../lib/helper';
import { CalendarClock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

export function PickupSlotsAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    startsAt: '',
    endsAt: '',
    maxCustomers: '10',
    maxItems: '50',
  });

  const slotsQuery = useQuery({
    queryKey: ['pickupSlots'],
    queryFn: () => getPickupSlots(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
  const createMutation = useMutation({
    mutationFn: () =>
      createPickupSlot(
        {
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          maxCustomers: Number(form.maxCustomers),
          maxItems: Number(form.maxItems),
        },
        token,
      ),
    onSuccess: async (result) => {
      toast.success(result.message || 'Pickup slot created');
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['pickupSlots'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageShell
      title="Pickup Slots"
      count={slotsQuery.data?.length ?? 0}
      actions={
        <Button className="bg-[#FF5A1F] hover:bg-[#e04e18]" onClick={() => setOpen(true)}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Create Slot
        </Button>
      }
    >
      <RecordsTable
        isLoading={slotsQuery.isLoading}
        isError={slotsQuery.isError}
        emptyLabel="No pickup slots found."
        headers={['Date', 'Time Range', 'Customers', 'Items', 'Capacity', 'Status']}
        rows={(slotsQuery.data ?? []).map((slot) => {
          const customerTotal = slot.maxCustomers ?? 0;
          const itemTotal = slot.maxItems ?? 0;
          const used = Math.max(slot.bookedCustomers ?? 0, slot.bookedItems ?? 0);
          const max = Math.max(customerTotal, itemTotal, 1);
          return [
            formatDate(slot.startsAt),
            `${formatDate(slot.startsAt, true)} - ${formatDate(slot.endsAt, true)}`,
            `${slot.bookedCustomers ?? 0} / ${customerTotal}`,
            `${slot.bookedItems ?? 0} / ${itemTotal}`,
            <div key="bar" className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-[#FF5A1F]"
                style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
              />
            </div>,
            <Badge key="status" value={slot.isActive ? 'active' : 'inactive'} />,
          ];
        })}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Pickup Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm((value) => ({ ...value, startsAt: event.target.value }))}
            />
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => setForm((value) => ({ ...value, endsAt: event.target.value }))}
            />
            <Input
              type="number"
              min="1"
              value={form.maxCustomers}
              onChange={(event) =>
                setForm((value) => ({ ...value, maxCustomers: event.target.value }))
              }
              placeholder="Max customers"
            />
            <Input
              type="number"
              min="1"
              value={form.maxItems}
              onChange={(event) => setForm((value) => ({ ...value, maxItems: event.target.value }))}
              placeholder="Max items"
            />
            <Button
              disabled={!form.startsAt || !form.endsAt || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="w-full bg-[#FF5A1F] hover:bg-[#e04e18]"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Slot'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
