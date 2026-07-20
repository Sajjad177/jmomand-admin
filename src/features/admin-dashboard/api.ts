import { apiRequest } from "@/lib/api-client";
import type {
  AdminUser,
  Category,
  Invoice,
  Notification,
  Order,
  PickupSlot,
} from "./types";
import { getDashboardReports } from "@/features/dashboard/api";

export type DateRange = { startDate?: string; endDate?: string };

export const PAGE_LIMIT = 10;

export async function getUsers(token?: string) {
  return (await apiRequest<AdminUser[]>("/users", token)).data;
}

export async function getUserDetails(userId: string, token?: string) {
  return (await apiRequest<AdminUser>(`/users/${userId}`, token)).data;
}

export async function toggleUserSuspension(userId: string, token?: string) {
  return apiRequest<AdminUser>(`/users/${userId}/suspension`, token, {
    method: "PATCH",
  });
}

export async function toggleUserBlock(userId: string, token?: string) {
  return apiRequest<AdminUser>(`/users/${userId}/block`, token, {
    method: "PATCH",
  });
}

export async function getCategories(params: { page: number; searchTerm?: string }, token?: string) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(PAGE_LIMIT),
  });

  if (params.searchTerm) query.set("searchTerm", params.searchTerm);

  return apiRequest<Category[]>(`/category/all?${query.toString()}`, token);
}

export async function createCategory(
  params: { name: string; image: File },
  token?: string,
) {
  const formData = new FormData();
  formData.append("name", params.name);
  formData.append("image", params.image);

  return apiRequest<Category>("/category", token, {
    method: "POST",
    body: formData,
  });
}

export async function updateCategory(
  params: { id: string; name: string; image?: File | null },
  token?: string,
) {
  const formData = new FormData();
  formData.append("name", params.name);
  if (params.image) formData.append("image", params.image);

  return apiRequest<Category>(`/category/update/${params.id}`, token, {
    method: "PUT",
    body: formData,
  });
}

export async function toggleCategory(categoryId: string, token?: string) {
  return apiRequest<Category>(`/category/toggle/${categoryId}`, token, {
    method: "PUT",
  });
}

export async function getOrders(token?: string) {
  return (await apiRequest<Order[]>("/orders", token)).data;
}

export async function getInvoices(token?: string) {
  return (await apiRequest<Invoice[]>("/invoices", token)).data;
}

export async function verifyInvoicePickup(tokenOrCode: string, token?: string) {
  return apiRequest<Invoice>("/invoices/verify-pickup", token, {
    method: "POST",
    body: JSON.stringify({ tokenOrCode }),
  });
}

export async function getPickupSlots(token?: string) {
  return (await apiRequest<PickupSlot[]>("/pickups/slots/all", token)).data;
}

export async function createPickupSlot(
  payload: {
    startsAt: string;
    endsAt: string;
    maxCustomers: number;
    maxItems: number;
  },
  token?: string,
) {
  return apiRequest<PickupSlot>("/pickups/slots", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getNotifications(params: { page: number }, token?: string) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(PAGE_LIMIT),
  });

  return apiRequest<Notification[]>(`/notifications?${query.toString()}`, token);
}

export async function markAllNotificationsRead(token?: string) {
  return apiRequest<unknown>("/notifications/read-all", token, {
    method: "PATCH",
  });
}

export async function getReports(range: DateRange | null, token?: string) {
  return getDashboardReports(token, range ?? {});
}
