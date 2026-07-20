export type ApiResponse<T> = {
  success: boolean;
  message: string;
  statusCode?: number;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api/v1";

export async function apiRequest<T>(
  path: string,
  token: string | undefined,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  if (!token) throw new Error("Please login again");

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const result = (await response.json().catch(() => ({}))) as Partial<
    ApiResponse<T>
  >;

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "The request could not be completed");
  }

  return result as ApiResponse<T>;
}
