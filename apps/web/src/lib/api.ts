// apps/web/src/lib/api.ts
import { PaginatedResponse, Product, SearchResponse } from "@/types/catalog";

const CORE_API = process.env.NEXT_PUBLIC_CORE_API_URL || "http://127.0.0.1:8000/api/v1";
const SEARCH_API = process.env.NEXT_PUBLIC_SEARCH_API_URL || "http://127.0.0.1:8001/api/v1";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("access_token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// --- Catalog & Search ---
export async function getProducts(page = 1, pageSize = 24, category?: string): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (category) params.append("category", category);
  const res = await fetch(`${CORE_API}/catalog/products/?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Catalog error: ${res.status}`);
  return res.json();
}

export async function getProductById(id: string | number): Promise<Product> {
  const res = await fetch(`${CORE_API}/catalog/products/${id}/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Product ${id} not found`);
  return res.json();
}

export async function searchProducts(query: string, limit = 12): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${SEARCH_API}/search/products/?${params.toString()}`);
  if (!res.ok) throw new Error(`Search error: ${res.status}`);
  return res.json();
}

// --- Identity & Auth ---
export async function loginUser(email: string, password: string) {
  const res = await fetch(`${CORE_API}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.detail || "Invalid email or password";
    throw new Error(msg);
  }
  const data = await res.json();
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}) {
  const res = await fetch(`${CORE_API}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    if (errData && typeof errData === "object") {
      const messages = Object.entries(errData)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
        .join("; ");
      throw new Error(messages || "Registration failed");
    }
    throw new Error("Registration failed");
  }
  return res.json();
}

// --- Cart & Checkout ---
export async function getCart() {
  const res = await fetch(`${CORE_API}/order/cart/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Unauthorized or failed to load cart");
  return res.json();
}

export async function addToCart(variantId: number, quantity = 1) {
  const res = await fetch(`${CORE_API}/order/cart/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ variant_id: variantId, quantity }),
  });
  if (!res.ok) throw new Error("Failed to add item to cart");
  return res.json();
}

export async function checkoutCart(shippingAddress: string, contactNumber: string) {
  const res = await fetch(`${CORE_API}/order/checkout/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      shipping_address: shippingAddress,
      contact_number: contactNumber,
    }),
  });
  if (!res.ok) throw new Error("Checkout failed");
  return res.json();
}

export async function uploadProductImageToR2(file: File): Promise<string> {
  // 1. Request presigned POST payload from Django
  const presignRes = await fetch(`${CORE_API}/media/upload-url/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ file_name: file.name, file_type: file.type }),
  });
  if (!presignRes.ok) throw new Error("Not authorized to upload media");
  const { url, fields, public_url } = await presignRes.json();

  // 2. Upload binary file directly from browser to Cloudflare R2
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v as string));
  formData.append("file", file);

  const r2Res = await fetch(url, { method: "POST", body: formData });
  if (!r2Res.ok) throw new Error("Cloudflare R2 upload failed");

  return public_url;
}

export async function createSellerProduct(payload: Record<string, any>) {
  const res = await fetch(`${CORE_API}/catalog/seller/products/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
}

export async function getOrderHistory() {
  const res = await fetch(`${CORE_API}/order/history/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
}

export async function initiateKhaltiPayment(orderId: number) {
  const res = await fetch(`${CORE_API}/payment/khalti/initiate/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ order_id: orderId }),
  });
  if (!res.ok) throw new Error("Failed to initiate Khalti payment");
  return res.json();
}

export async function verifyKhaltiPayment(pidx: string) {
  const res = await fetch(`${CORE_API}/payment/khalti/verify/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ pidx }),
  });
  if (!res.ok) throw new Error("Khalti verification failed");
  return res.json();
}
// append to apps/web/src/lib/api.ts
export interface RecommendedProduct {
  id: string;
  title: string;
  model: string;
  category: string;
  price: string;
  price_npr: number | null;
  url: string;
  thumbnail: string | null;
  specifications: Record<string, string>;
  scores: {
    hybrid: number;
    content: number;
    collaborative: number;
  };
}

export async function getRecommendations(
  productIdOrTitle: string,
  limit = 4
): Promise<RecommendedProduct[]> {
  const encoded = encodeURIComponent(productIdOrTitle);
  const res = await fetch(`${SEARCH_API}/recommendations/${encoded}/?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.recommendations || [];
}

export async function logProductInteraction(
  productId: string,
  eventType: "view" | "cart" | "purchase"
) {
  if (typeof window === "undefined") return;
  let sessionId = localStorage.getItem("buyit_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("buyit_session_id", sessionId);
  }

  await fetch(`${SEARCH_API}/recommendations/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      product_id: productId,
      event_type: eventType,
    }),
  }).catch(() => {});
}