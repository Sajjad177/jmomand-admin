// --- Dynamic API Types Mapping ---
export interface InventoryItem {
  _id: string;
  inventoryId: string;
  title: string;
  category: string;
  condition: string;
  type: string;
  quantity: number;
  price: number;
  manufacturer?: string;
  color?: string[];
  description?: string;
  images: {
    public_id: string;
    url: string;
  }[];
}

interface MetaData {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface InventoryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: InventoryItem[];
  meta: MetaData;
}
