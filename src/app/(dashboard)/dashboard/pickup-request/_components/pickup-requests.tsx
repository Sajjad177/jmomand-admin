"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

type PickupAppointment = {
  _id: string;
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  slot?: { startsAt?: string; endsAt?: string };
  products?: Array<{ _id?: string; title?: string }>;
  invoices?: Array<{ _id?: string; invoiceNumber?: string }>;
  pickupCode: string;
  status: "scheduled" | "picked_up" | "completed" | "cancelled";
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function PickupRequests() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const appointments = useQuery({
    queryKey: ["pickupAppointments"],
    queryFn: async () => (await apiRequest<PickupAppointment[]>("/pickups", token)).data,
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const complete = useMutation({
    mutationFn: async (appointmentId: string) =>
      apiRequest<PickupAppointment>("/pickups/complete", token, {
        method: "POST",
        body: JSON.stringify({ appointmentId }),
      }),
    onSuccess: async (result) => {
      toast.success(result.message || "Pickup completed");
      await queryClient.invalidateQueries({ queryKey: ["pickupAppointments"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardReports"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return appointments.data ?? [];
    return (appointments.data ?? []).filter((appointment) =>
      [
        appointment.pickupCode,
        appointment.customer?.firstName,
        appointment.customer?.lastName,
        appointment.customer?.email,
        appointment.status,
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [appointments.data, search]);

  return (
    <section className="w-full rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Pickup Requests <span className="ml-1 text-[#FF5A1F]">({appointments.data?.length ?? 0})</span>
        </h2>
        <div className="relative min-w-[260px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pickup requests..."
            className="h-10 w-full rounded-lg bg-[#F5F7FA] pl-4 pr-10 text-sm text-gray-600 outline-none focus:ring-1 focus:ring-gray-200"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead>
            <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
              <th className="rounded-l-lg px-4 py-3">Customer</th>
              <th className="px-4 py-3">Pickup Code</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="rounded-r-lg px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Loading pickup requests...</td></tr>
            ) : appointments.isError ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-red-500">Unable to load pickup requests.</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No pickup requests found.</td></tr>
            ) : filtered.map((appointment) => (
              <tr key={appointment._id} className="text-sm text-gray-600 hover:bg-gray-50/50">
                <td className="px-4 py-4">
                  <p className="font-medium text-gray-800">{[appointment.customer?.firstName, appointment.customer?.lastName].filter(Boolean).join(" ") || "Customer"}</p>
                  <p className="text-xs text-gray-400">{appointment.customer?.email || "—"}</p>
                </td>
                <td className="px-4 py-4 font-mono font-semibold text-gray-700">{appointment.pickupCode}</td>
                <td className="px-4 py-4">{appointment.slot?.startsAt ? dateFormatter.format(new Date(appointment.slot.startsAt)) : "—"}</td>
                <td className="px-4 py-4">{appointment.products?.length ?? appointment.invoices?.length ?? 0}</td>
                <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">{appointment.status.replace("_", " ")}</span></td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    disabled={appointment.status === "completed" || appointment.status === "cancelled" || complete.isPending}
                    onClick={() => complete.mutate(appointment._id)}
                    className="rounded-lg bg-[#FF5A1F] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#e04e18] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {appointment.status === "completed" ? "Completed" : "Complete Pickup"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
