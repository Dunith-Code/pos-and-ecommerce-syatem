const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4002"}/api`;

export type Product = {
  id: string;
  name: string;
  price: string;
  stock: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
};

export type Payment = {
  id: string;
  orderId: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT";
  idempotencyKey: string;
  attemptedAt: string;
};

export type Order = {
  id: string;
  userId: string | null;
  status: "PENDING" | "RESERVED" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED";
  idempotencyKey: string;
  reservedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments?: Payment[];
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  searchCatalog: (params: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.minPrice != null) query.set("minPrice", String(params.minPrice));
    if (params.maxPrice != null) query.set("maxPrice", String(params.maxPrice));
    if (params.inStock) query.set("inStock", "true");
    const qs = query.toString();
    return request<Product[]>(`/catalog${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id: string) => request<Product>(`/catalog/${id}`),

  checkout: (data: {
    productId: string;
    quantity: number;
    idempotencyKey: string;
    unitPrice: number;
  }) => request<Order>("/orders/checkout", { method: "POST", body: JSON.stringify(data) }),
  listOrders: () => request<Order[]>("/orders"),
  getOrder: (id: string) => request<Order>(`/orders/${id}`),
  cancelOrder: (id: string, reason?: string) =>
    request<{ orderId: string; previousStatus: string; refunded: boolean }>(
      `/orders/${id}/cancel`,
      { method: "POST", body: JSON.stringify({ reason }) }
    ),

  processPayment: (
    orderId: string,
    data: { idempotencyKey: string; forcedOutcome?: "SUCCESS" | "FAILED" | "TIMEOUT" }
  ) =>
    request<{ payment: Payment; duplicate: boolean }>(`/payments/${orderId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};