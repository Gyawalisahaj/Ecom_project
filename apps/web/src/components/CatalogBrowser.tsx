
"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/catalog";
import { searchProducts } from "@/lib/api";
import { CardItem, ProductCard } from "./ProductCard";

export function CatalogBrowser({ initialProducts }: { initialProducts: Product[] }) {
  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<CardItem[] | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Normalize initial Django products into CardItem format
  const defaultItems: CardItem[] = initialProducts.map((p) => {
    const primaryImg = p.images.find((img) => img.is_primary) || p.images[0];
    return {
      id: p.id,
      name: p.name,
      brand: p.brand.name,
      category: p.category.name,
      base_price: p.base_price,
      thumbnail: primaryImg ? primaryImg.url : null,
      specifications: p.specifications,
    };
  });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchHits(null);
      setLatencyMs(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchProducts(trimmed);
        setSearchHits(res.hits);
        setLatencyMs(res.processingTimeMs);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const displayedItems = searchHits !== null ? searchHits : defaultItems;

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search laptops, GPUs, monitors (e.g., RTX 4060, MacBook)..."
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>
            {isSearching
              ? "Searching Meilisearch index..."
              : searchHits !== null
              ? `Found ${searchHits.length} result(s) for "${query}"`
              : `Showing ${defaultItems.length} featured products`}
          </span>
          {latencyMs !== null && (
            <span className="font-mono text-emerald-600">
              Meilisearch: {latencyMs}ms
            </span>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {displayedItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500">
          No tech products matched your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedItems.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}