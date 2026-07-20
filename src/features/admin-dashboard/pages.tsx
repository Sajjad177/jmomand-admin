"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Bell, CalendarClock, Eye, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  createPickupSlot,
  createCategory,
  getCategories,
  getInvoices,
  getNotifications,
  getOrders,
  getPickupSlots,
  getReports,
  getUserDetails,
  getUsers,
  markAllNotificationsRead,
  toggleCategory,
  toggleUserBlock,
  toggleUserSuspension,
  updateCategory,
  verifyInvoicePickup,
  type DateRange,
} from "./api";
import type { AdminUser, Category, Invoice, Notification, Order } from "./types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return withTime ? dateTimeFormatter.format(date) : dateFormatter.format(date);
}

function fullName(user?: AdminUser) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return name || user?.email || "Unknown";
}

function statusClass(status?: string) {
  if (["paid", "active", "completed", "scheduled"].includes(status || "")) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (["failed", "payment_failed", "cancelled", "blocked", "suspended"].includes(status || "")) {
    return "bg-red-50 text-red-700";
  }
  return "bg-slate-100 text-slate-700";
}

function Badge({ value }: { value?: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(value)}`}>
      {(value || "unknown").replace(/_/g, " ")}
    </span>
  );
}

function PageShell({
  title,
  count,
  actions,
  children,
}: {
  title: string;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#FF5A1F]">Admin Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {title}
            {typeof count === "number" && <span className="ml-2 text-[#FF5A1F]">({count})</span>}
          </h1>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[260px]">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg bg-[#F5F7FA] pr-10 text-sm"
      />
      <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
    </div>
  );
}

function TableState({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {label}
      </td>
    </tr>
  );
}

function Pager({
  page,
  totalPages,
  isFetching,
  onPage,
}: {
  page: number;
  totalPages: number;
  isFetching?: boolean;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 border-t border-[#d7e2f2] px-4 py-3">
      <Button variant="outline" disabled={page === 1 || isFetching} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" disabled={page === totalPages || isFetching} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  );
}

export function UsersAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => getUsers(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const userDetailsQuery = useQuery({
    queryKey: ["adminUser", selectedId],
    queryFn: () => getUserDetails(selectedId || "", token),
    enabled: Boolean(token && selectedId),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => toggleUserSuspension(userId, token),
    onSuccess: async (result) => {
      toast.success(result.message || "User suspension updated");
      await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => toggleUserBlock(userId, token),
    onSuccess: async (result) => {
      toast.success(result.message || "User block status updated");
      await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return usersQuery.data ?? [];
    return (usersQuery.data ?? []).filter((user) =>
      [fullName(user), user.email, user.role].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [search, usersQuery.data]);

  return (
    <PageShell
      title="User Management"
      count={usersQuery.data?.length ?? 0}
      actions={<SearchBox value={search} onChange={setSearch} placeholder="Search users..." />}
    >
      <div className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Status</th>
                {/* <th className="px-4 py-3">Joined</th> */}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {usersQuery.isLoading ? (
                <TableState colSpan={6} label="Loading users..." />
              ) : usersQuery.isError ? (
                <TableState colSpan={6} label="Unable to load users." />
              ) : filteredUsers.length === 0 ? (
                <TableState colSpan={6} label="No users found." />
              ) : (
                filteredUsers.map((user) => {
                  const status = user.isBlocked ? "blocked" : user.isSuspend ? "suspended" : "active";
                  const isAdmin = user.role === "admin";

                  return (
                    <tr key={user._id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{fullName(user)}</p>
                        <p className="text-xs text-gray-400">{user.email || "-"}</p>
                      </td>
                      <td className="px-4 py-4 capitalize">{user.role || "user"}</td>
                      <td className="px-4 py-4">{user.isVerified ? "Yes" : "No"}</td>
                      <td className="px-4 py-4"><Badge value={status} /></td>
                      {/* <td className="px-4 py-4">{formatDate(user.createdAt)}</td> */}
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedId(user._id)}>
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAdmin || suspendMutation.isPending}
                            onClick={() => suspendMutation.mutate(user._id)}
                          >
                            {user.isSuspend ? "Unsuspend" : "Suspend"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAdmin || blockMutation.isPending}
                            onClick={() => blockMutation.mutate(user._id)}
                          >
                            {user.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {userDetailsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading user details...</p>
          ) : (
            <div className="space-y-3 text-sm text-slate-600">
              {[
                ["Name", fullName(userDetailsQuery.data)],
                ["Email", userDetailsQuery.data?.email || "-"],
                ["Phone", userDetailsQuery.data?.phone || "-"],
                ["Address", [userDetailsQuery.data?.street, userDetailsQuery.data?.location, userDetailsQuery.data?.postalCode].filter(Boolean).join(", ") || "-"],
                ["Role", userDetailsQuery.data?.role || "-"],
                ["Default Payment", userDetailsQuery.data?.hasDefaultPaymentMethod ? "Saved" : "Not saved"],
                ["Member Since", formatDate(userDetailsQuery.data?.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-900">{label}</span>
                  <span className="text-right">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

export function CategoriesAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories", page, search],
    queryFn: () => getCategories({ page, searchTerm: search.trim() }, token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!image) throw new Error("Category image is required");
      return createCategory({ name, image }, token);
    },
    onSuccess: async (result) => {
      toast.success(result.message || "Category created");
      setCreateOpen(false);
      setName("");
      setImage(null);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveMutation = useMutation({
    mutationFn: () => updateCategory({ id: editing?._id || "", name, image }, token),
    onSuccess: async (result) => {
      toast.success(result.message || "Category updated");
      setEditing(null);
      setImage(null);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (categoryId: string) => toggleCategory(categoryId, token),
    onSuccess: async (result) => {
      toast.success(result.message || "Category updated");
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const meta = categoriesQuery.data?.meta;

  return (
    <PageShell
      title="Categories"
      count={meta?.total ?? 0}
      actions={
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBox value={search} onChange={(value) => { setPage(1); setSearch(value); }} placeholder="Search categories..." />
          <Button className="bg-[#FF5A1F] hover:bg-[#e04e18]" onClick={() => { setCreateOpen(true); setName(""); setImage(null); }}>
            Create Category
          </Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {categoriesQuery.isLoading ? (
                <TableState colSpan={5} label="Loading categories..." />
              ) : categoriesQuery.isError ? (
                <TableState colSpan={5} label="Unable to load categories." />
              ) : (categoriesQuery.data?.data ?? []).length === 0 ? (
                <TableState colSpan={5} label="No categories found." />
              ) : (
                (categoriesQuery.data?.data ?? []).map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {category.image?.url ? (
                          <Image
                            src={category.image.url}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-slate-100" />
                        )}
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{category.totalProduct ?? 0}</td>
                    <td className="px-4 py-4"><Badge value={category.isDeleted ? "deleted" : "active"} /></td>
                    <td className="px-4 py-4">{formatDate(category.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(category); setName(category.name); }}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" disabled={toggleMutation.isPending} onClick={() => toggleMutation.mutate(category._id)}>
                          {category.isDeleted ? "Restore" : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} totalPages={Math.max(meta?.totalPage ?? 1, 1)} isFetching={categoriesQuery.isFetching} onPage={setPage} />
      </div>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" />
            <Input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
            <Button disabled={!name.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()} className="w-full bg-[#FF5A1F] hover:bg-[#e04e18]">
              {saveMutation.isPending ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" />
            <Input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
            <Button disabled={!name.trim() || !image || createMutation.isPending} onClick={() => createMutation.mutate()} className="w-full bg-[#FF5A1F] hover:bg-[#e04e18]">
              {createMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

export function OrdersAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const ordersQuery = useQuery({ queryKey: ["adminOrders"], queryFn: () => getOrders(token), enabled: Boolean(token), staleTime: 60_000 });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (ordersQuery.data ?? []).filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesSearch = !query || [order.orderNumber, fullName(order.customer), order.customer?.email, order.pickupCode].some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [ordersQuery.data, search, status]);

  return (
    <PageShell
      title="Orders"
      count={ordersQuery.data?.length ?? 0}
      actions={
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBox value={search} onChange={setSearch} placeholder="Search orders..." />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      }
    >
      <RecordsTable
        isLoading={ordersQuery.isLoading}
        isError={ordersQuery.isError}
        emptyLabel="No orders found."
        headers={["Order", "Customer", "Items", "Total", "Status", "Paid At", "Pickup", ""]}
        rows={filtered.map((order) => [
          order.orderNumber || "-",
          <div key="customer"><p className="font-medium text-gray-900">{fullName(order.customer)}</p><p className="text-xs text-gray-400">{order.customer?.email || "-"}</p></div>,
          `${order.items?.length ?? 0} items`,
          currencyFormatter.format(order.totalAmount ?? 0),
          <Badge key="status" value={order.status} />,
          formatDate(order.paidAt),
          <span key="pickup" className="font-mono font-semibold">{order.pickupCode || "-"}</span>,
          <Button key="view" variant="outline" size="sm" onClick={() => setSelected(order)}>View</Button>,
        ])}
      />
      <DetailDialog title="Order Details" open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && <OrderDetail order={selected} />}
      </DetailDialog>
    </PageShell>
  );
}

export function InvoicesAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [tokenOrCode, setTokenOrCode] = useState("");
  const invoicesQuery = useQuery({ queryKey: ["adminInvoices"], queryFn: () => getInvoices(token), enabled: Boolean(token), staleTime: 60_000 });

  const verifyMutation = useMutation({
    mutationFn: () => verifyInvoicePickup(tokenOrCode, token),
    onSuccess: (result) => toast.success(result.message || "Pickup code verified"),
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (invoicesQuery.data ?? []).filter((invoice) => {
      const matchesStatus = status === "all" || invoice.status === status;
      const matchesSearch = !query || [invoice.invoiceNumber, fullName(invoice.customer), invoice.customer?.email, invoice.product?.title, invoice.inventoryId, invoice.pickupCode].some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [invoicesQuery.data, search, status]);

  return (
    <PageShell
      title="Invoices"
      count={invoicesQuery.data?.length ?? 0}
      actions={<div className="flex flex-col gap-3 sm:flex-row"><SearchBox value={search} onChange={setSearch} placeholder="Search invoices..." /><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All Statuses</option><option value="payment_pending">Payment Pending</option><option value="paid">Paid</option><option value="payment_failed">Payment Failed</option><option value="void">Void</option></select></div>}
    >
      <div className="rounded-lg border border-[#d7e2f2] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={tokenOrCode} onChange={(event) => setTokenOrCode(event.target.value)} placeholder="Enter pickup token or code" />
          <Button disabled={!tokenOrCode.trim() || verifyMutation.isPending} onClick={() => verifyMutation.mutate()} className="bg-[#FF5A1F] hover:bg-[#e04e18]">
            Verify Pickup
          </Button>
        </div>
      </div>
      <RecordsTable
        isLoading={invoicesQuery.isLoading}
        isError={invoicesQuery.isError}
        emptyLabel="No invoices found."
        headers={["Invoice", "Customer", "Product", "Amount", "Status", "Paid At", "Pickup", ""]}
        rows={filtered.map((invoice) => [
          invoice.invoiceNumber || "-",
          <div key="customer"><p className="font-medium text-gray-900">{fullName(invoice.customer)}</p><p className="text-xs text-gray-400">{invoice.customer?.email || "-"}</p></div>,
          <div key="product"><p className="font-medium text-gray-900">{invoice.product?.title || "-"}</p><p className="text-xs text-gray-400">{invoice.inventoryId || "-"}</p></div>,
          currencyFormatter.format(invoice.amount ?? 0),
          <Badge key="status" value={invoice.status} />,
          formatDate(invoice.paidAt),
          <span key="pickup" className="font-mono font-semibold">{invoice.pickupCode || "-"}</span>,
          <Button key="view" variant="outline" size="sm" onClick={() => setSelected(invoice)}>View</Button>,
        ])}
      />
      <DetailDialog title="Invoice Details" open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && <InvoiceDetail invoice={selected} />}
      </DetailDialog>
    </PageShell>
  );
}

export function PickupSlotsAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ startsAt: "", endsAt: "", maxCustomers: "10", maxItems: "50" });

  const slotsQuery = useQuery({ queryKey: ["pickupSlots"], queryFn: () => getPickupSlots(token), enabled: Boolean(token), staleTime: 60_000 });
  const createMutation = useMutation({
    mutationFn: () => createPickupSlot({
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      maxCustomers: Number(form.maxCustomers),
      maxItems: Number(form.maxItems),
    }, token),
    onSuccess: async (result) => {
      toast.success(result.message || "Pickup slot created");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["pickupSlots"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageShell title="Pickup Slots" count={slotsQuery.data?.length ?? 0} actions={<Button className="bg-[#FF5A1F] hover:bg-[#e04e18]" onClick={() => setOpen(true)}><CalendarClock className="mr-2 h-4 w-4" />Create Slot</Button>}>
      <RecordsTable
        isLoading={slotsQuery.isLoading}
        isError={slotsQuery.isError}
        emptyLabel="No pickup slots found."
        headers={["Date", "Time Range", "Customers", "Items", "Capacity", "Status"]}
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
            <div key="bar" className="h-2 w-32 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#FF5A1F]" style={{ width: `${Math.min(100, (used / max) * 100)}%` }} /></div>,
            <Badge key="status" value={slot.isActive ? "active" : "inactive"} />,
          ];
        })}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Pickup Slot</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((value) => ({ ...value, startsAt: event.target.value }))} />
            <Input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((value) => ({ ...value, endsAt: event.target.value }))} />
            <Input type="number" min="1" value={form.maxCustomers} onChange={(event) => setForm((value) => ({ ...value, maxCustomers: event.target.value }))} placeholder="Max customers" />
            <Input type="number" min="1" value={form.maxItems} onChange={(event) => setForm((value) => ({ ...value, maxItems: event.target.value }))} placeholder="Max items" />
            <Button disabled={!form.startsAt || !form.endsAt || createMutation.isPending} onClick={() => createMutation.mutate()} className="w-full bg-[#FF5A1F] hover:bg-[#e04e18]">
              {createMutation.isPending ? "Creating..." : "Create Slot"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

export function NotificationsAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const notificationsQuery = useQuery({ queryKey: ["notifications", page], queryFn: () => getNotifications({ page }, token), enabled: Boolean(token), staleTime: 30_000 });
  const notifications = notificationsQuery.data?.data ?? [];
  const unread = notifications.filter((notification) => !notification.isViewed).length;

  const readMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onSuccess: async (result) => {
      toast.success(result.message || "Notifications marked as read");
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageShell title="Notifications" count={notificationsQuery.data?.meta?.total ?? 0} actions={<Button variant="outline" disabled={readMutation.isPending || unread === 0} onClick={() => readMutation.mutate()}><ShieldCheck className="mr-2 h-4 w-4" />Mark All Read</Button>}>
      <div className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
        <div className="divide-y divide-slate-100">
          {notificationsQuery.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Loading notifications...</p>
          ) : notificationsQuery.isError ? (
            <p className="px-4 py-10 text-center text-sm text-red-500">Unable to load notifications.</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No notifications yet.</p>
          ) : notifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} />
          ))}
        </div>
        <Pager page={page} totalPages={Math.max(notificationsQuery.data?.meta?.totalPage ?? 1, 1)} isFetching={notificationsQuery.isFetching} onPage={setPage} />
      </div>
    </PageShell>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <span className={`mt-2 h-2.5 w-2.5 rounded-full ${notification.isViewed ? "bg-slate-200" : "bg-[#FF5A1F]"}`} />
      <Bell className="mt-0.5 h-4 w-4 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{notification.message || "Notification"}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="capitalize">{notification.type || "general"}</span>
          <span>{formatDate(notification.createdAt, true)}</span>
        </div>
      </div>
    </div>
  );
}

export function ReportsAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [preset, setPreset] = useState("all");
  const range = useMemo<DateRange>(() => {
    if (preset === "all") return {};
    const now = new Date();
    const start = new Date(now);
    if (preset === "today") start.setHours(0, 0, 0, 0);
    if (preset === "7") start.setDate(now.getDate() - 7);
    if (preset === "30") start.setDate(now.getDate() - 30);
    if (preset === "90") start.setDate(now.getDate() - 90);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }, [preset]);

  const reportsQuery = useQuery({ queryKey: ["reportsPage", range], queryFn: () => getReports(range, token), enabled: Boolean(token), staleTime: 60_000 });
  const reports = reportsQuery.data;

  return (
    <PageShell title="Reports & Analytics" actions={<select value={preset} onChange={(event) => setPreset(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All Time</option><option value="today">Today</option><option value="7">Last 7 Days</option><option value="30">Last 30 Days</option><option value="90">Last 90 Days</option></select>}>
      {reportsQuery.isLoading ? (
        <div className="rounded-lg border border-[#d7e2f2] bg-white p-10 text-center text-sm text-slate-500">Loading reports...</div>
      ) : reportsQuery.isError || !reports ? (
        <div className="rounded-lg border border-[#d7e2f2] bg-white p-10 text-center text-sm text-red-500">Unable to load reports.</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <ReportCard title="Revenue" rows={[
            ["Total Revenue", currencyFormatter.format(reports.revenue.totalRevenue)],
            ["Paid Invoices", String(reports.revenue.paidInvoices)],
            ["Average Order Value", currencyFormatter.format(reports.revenue.averageOrderValue)],
          ]} />
          <ReportCard title="Auction Status" rows={[
            ["Winning Bids", currencyFormatter.format(reports.auctions.totalWinningBids)],
            ...reports.auctions.byStatus.map((item) => [item._id || "unknown", String(item.count)]),
          ]} />
          <ReportCard title="Inventory Status" rows={reports.inventory.map((item) => [item._id || "unknown", String(item.count)])} />
          <ReportCard title="Pickup Status" rows={reports.pickups.byStatus.map((item) => [item._id || "unknown", `${item.appointments} appointments, ${item.items} items`])} />
        </div>
      )}
    </PageShell>
  );
}

function ReportCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#d7e2f2] bg-white p-6">
      <h2 className="break-words text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No data available.</p>
        ) : rows.map(([label, value]) => (
          <div key={label} className="grid gap-2 border-b border-slate-100 pb-2 text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
            <span className="capitalize text-slate-500">{label.replace(/_/g, " ")}</span>
            <span className="min-w-0 break-all text-left font-semibold text-slate-950 sm:text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordsTable({
  headers,
  rows,
  isLoading,
  isError,
  emptyLabel,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  isLoading?: boolean;
  isError?: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
              {headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
            {isLoading ? (
              <TableState colSpan={headers.length} label="Loading records..." />
            ) : isError ? (
              <TableState colSpan={headers.length} label="Unable to load records." />
            ) : rows.length === 0 ? (
              <TableState colSpan={headers.length} label={emptyLabel} />
            ) : rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50/60">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-4">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailDialog({ title, open, onOpenChange, children }: { title: string; open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="min-w-0 space-y-4 text-sm text-slate-600">
      <ReportCard title={order.orderNumber || "Order"} rows={[
        ["Customer", fullName(order.customer)],
        ["Email", order.customer?.email || "-"],
        ["Status", order.status || "-"],
        ["Total", currencyFormatter.format(order.totalAmount ?? 0)],
        ["Pickup Code", order.pickupCode || "-"],
        // ["Stripe Session", order.stripeSessionId || "-"],
        ["Stripe Payment", order.stripePaymentIntentId || "-"],
      ]} />
      <div className="min-w-0 rounded-lg border border-slate-200 p-4">
        <p className="font-semibold text-slate-950">Items</p>
        <div className="mt-3 space-y-2">
          {(order.items ?? []).map((item, index) => (
            <div key={`${item.product?._id || index}`} className="grid gap-2 border-b border-slate-100 pb-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <span className="min-w-0 break-words">{item.product?.title || "Product"} x {item.quantity ?? 1}</span>
              <span className="font-medium text-slate-700">{currencyFormatter.format(item.price ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  return (
    <div className="space-y-4 text-sm text-slate-600">
      <ReportCard title={invoice.invoiceNumber || "Invoice"} rows={[
        ["Customer", fullName(invoice.customer)],
        ["Email", invoice.customer?.email || "-"],
        ["Product", invoice.product?.title || "-"],
        ["Inventory ID", invoice.inventoryId || "-"],
        ["Auction", invoice.auction?.title || invoice.auction?._id || "-"],
        ["Status", invoice.status || "-"],
        ["Amount", currencyFormatter.format(invoice.amount ?? 0)],
        ["Pickup Code", invoice.pickupCode || "-"],
        ["Stripe Payment", invoice.stripePaymentIntentId || "-"],
        ["Failure Reason", invoice.paymentFailureReason || "-"],
      ]} />
    </div>
  );
}
