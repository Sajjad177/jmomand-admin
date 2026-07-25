export type AdminUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  location?: string;
  postalCode?: string;
  dateOfBirth?: string;
  role?: string;
  image?: { url?: string };
  isVerified?: boolean;
  isSuspend?: boolean;
  isBlocked?: boolean;
  hasDefaultPaymentMethod?: boolean;
  createdAt?: string;
};

export type Category = {
  _id: string;
  name: string;
  image?: { url?: string };
  totalProduct?: number;
  isDeleted?: boolean;
  createdAt?: string;
};

export type ProductSummary = {
  _id?: string;
  title?: string;
  inventoryId?: string;
  images?: Array<{ url?: string }>;
  category?: string;
  categoryImage?: { url?: string };
  color?: string[];
  condition?: string;
  manufacturer?: string;
  price?: number;
};

export type Order = {
  _id: string;
  orderNumber?: string;
  customer?: AdminUser;
  items?: Array<{ product?: ProductSummary; quantity?: number; price?: number }>;
  totalAmount?: number;
  status?: "pending" | "paid" | "failed" | "cancelled";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  pickupCode?: string;
  pickupQrDataUrl?: string;
  createdAt?: string;
};

export type Invoice = {
  _id: string;
  invoiceNumber?: string;
  auction?: { _id?: string; title?: string };
  product?: ProductSummary;
  customer?: AdminUser;
  inventoryId?: string;
  amount?: number;
  status?: "payment_pending" | "paid" | "payment_failed" | "void";
  stripePaymentIntentId?: string;
  pickupCode?: string;
  pickupQrDataUrl?: string;
  paidAt?: string;
  paymentFailureReason?: string;
  createdAt?: string;
};

export type PickupSlot = {
  _id: string;
  startsAt?: string;
  endsAt?: string;
  maxCustomers?: number;
  maxItems?: number;
  bookedCustomers?: number;
  bookedItems?: number;
  isActive?: boolean;
  createdAt?: string;
};

export type Notification = {
  _id: string;
  to?: string;
  message?: string;
  isViewed?: boolean;
  type?: string;
  id?: string;
  createdAt?: string;
};

export type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};
