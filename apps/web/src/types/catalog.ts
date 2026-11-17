
export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  price_override: string | null;
  stock_quantity: number;
  attributes: Record<string, string>;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: Category;
  brand: Brand;
  description: string;
  base_price: string;
  specifications: Record<string, string>;
  variants: ProductVariant[];
  images: ProductImage[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SearchHit {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  base_price: number;
  specifications: Record<string, string>;
  thumbnail: string | null;
}

export interface SearchResponse {
  query: string;
  hits: SearchHit[];
  estimatedTotalHits: number;
  processingTimeMs: number;
}