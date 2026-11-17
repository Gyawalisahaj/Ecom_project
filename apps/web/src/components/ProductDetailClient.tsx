"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/catalog";
import { addToCart } from "@/lib/api";

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || null);
  const [loading, setLoading] = useState(false);

  const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
  const activePrice = selectedVariant?.price_override || product.base_price;

  async function handleAdd() {
    if (!selectedVariant) return;
    setLoading(true);
    try {
      await addToCart(selectedVariant.id, 1);
      router.push("/cart");
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6">
        {primaryImage ? (
          <img src={primaryImage.url} alt={product.name} className="w-full rounded-xl object-cover" />
        ) : (
          <div className="flex h-80 items-center justify-center bg-zinc-100 text-zinc-400">No Image</div>
        )}
      </div>

      <div className="flex flex-col justify-between space-y-6">
        <div>
          <p className="text-sm font-medium text-blue-600">
            {product.brand.name} • {product.category.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">{product.name}</h1>
          <p className="mt-4 text-2xl font-bold text-zinc-900">
            NPR {Number(activePrice).toLocaleString()}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">{product.description}</p>

          {/* Variant Selector */}
          {product.variants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900">Select Configuration</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const label = Object.values(variant.attributes || {}).join(" / ") || variant.sku;
                  const active = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500"
                      }`}
                    >
                      {label} ({variant.stock_quantity} in stock)
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical Specifications */}
          {Object.keys(product.specifications || {}).length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900">Technical Specifications</h3>
              <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-3 px-4 py-2.5 text-sm">
                    <dt className="font-medium uppercase text-zinc-500">{key}</dt>
                    <dd className="col-span-2 text-zinc-900">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!selectedVariant || selectedVariant.stock_quantity < 1 || loading}
          className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-300"
        >
          {loading ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}