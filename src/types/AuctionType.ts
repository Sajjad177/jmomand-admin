export interface AuctionItem {
  _id: string;
  inventoryId: string;
  auctionId: string;
  title: string;
  category: string;
  condition: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  products?: AuctionProductItem[];
}

interface MetaData {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface AuctionResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AuctionItem[];
  meta: MetaData;
}


export interface CreateAuctionPayload {
  products: string[];
  title: string;
  description: string;
  auctionSchedule: {
    startDate: string;
    startTime: string;
    durationInDays: number;
  };
  startingBid: number;
  bidIncrement: number;
  pickupSchedule: {
    startDate: string;
    endDate: string;
    dailyStartTime: string;
    dailyEndTime: string;
    durationInDays: number;
  };
}



// 1. Image interface
export interface CloudinaryImage {
  public_id: string;
  url: string;
}

// 2. Nested Product inside Auction
export interface AuctionProductItem {
  _id: string;
  inventoryId: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  day?: string;
  reservePrice: number;
  inventoryStatus: string;
  images: CloudinaryImage[];
  categoryImage?: CloudinaryImage;
  totalReview: number;
  type: string;
  color: string[];
  quantity: number;
  manufacturer: string;
  averageReview: number;
  createdAt: string;
  updatedAt: string;
  auctionProductId: string;
  auctionProductStatus: string;
  currentBid: number;
  minimumNextBid: number;
}

// 3. Pickup Schedule interface
export interface PickupSchedule {
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  durationInDays: number;
}

// 4. Auction Product pivot entity interface
export interface AuctionProductPivot {
  _id: string;
  auctionId: string;
  productId: string;
  startingBid: number;
  bidIncrement: number;
  status: string;
  highestBid: {
    amount: number;
    bidderId?: string;
  };
  paymentStatus: string;
  pickupStatus: string;
  paymentRetryCount: number;
  createdAt: string;
  updatedAt: string;
}

// 5. Main Auction Item interface
export interface AuctionItems {
  _id: string;
  auctionId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  durationInDays: number;
  status: "upcoming" | "active" | "completed" | "cancelled" | string;
  pickupSchedule: PickupSchedule;
  products: AuctionProductItem[];
  auctionProducts: AuctionProductPivot[];
  buyerPremiumEnabled: boolean;
  buyerPremiumAmount: number;
  createdAt: string;
  updatedAt: string;
}

// 6. Meta pagination details
export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

// 7. Full API Response Structure
export interface GetAuctionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AuctionItem[];
  meta: Meta;
}

export interface UseGetAllAuctionsOptions {
  token: string | null;
  page?: number;
  limit?: number;
  enabled?: boolean;
}


export interface AuctionDetails {
  _id: string;
  auctionId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  status: "upcoming" | "active" | "ended" | string;
  products: AuctionProductItem[];
  createdAt?: string;
  updatedAt?: string;
  pickupSchedule: PickupSchedule;
  buyerPremiumEnabled: boolean;
  buyerPremiumAmount: number;
  durationInDays: number;
  startingBid: number;
  bidIncrement: number;
  highestBid: {
    amount: number;
    bidderId?: string;
  };
  auctionProducts:AuctionProductPivot[]
}

export interface GetAuctionDetailsResponse {
  success: boolean;
  message: string;
  data: AuctionDetails;
}

export interface UseGetAuctionDetailsOptions {
  auctionId: string;
  token?: string | null;
  enabled?: boolean;
}
