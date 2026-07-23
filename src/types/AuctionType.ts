interface AuctionItem {
  _id: string;
  inventoryId: string;
  title: string;
  category: string;
  condition: string;
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