"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product, ProductVariant } from "@/types/catalog";
import { addToCart, getProductById, getRecommendations, logProductInteraction, RecommendedProduct } from "@/lib/api";

function formatPrice(price: string | number): string {
  return `NPR ${Number(price).toLocaleString("en-NP")}`;
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

export function ProductDetailClient({
  product: initialProduct = null,
  productId,
}: {
  product?: Product | null;
  productId?: string | number;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(!initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    initialProduct?.variants?.[0] || null
  );
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);

  // Fetch product on client side if initialProduct is null
  useEffect(() => {
    if (!product && productId) {
      setLoadingProduct(true);
      getProductById(productId)
        .then((data) => {
          if (data) {
            setProduct(data);
            setSelectedVariant(data.variants?.[0] || null);
            const primIdx = data.images?.findIndex((img) => img.is_primary) ?? 0;
            if (primIdx >= 0) setSelectedImage(primIdx);
          }
        })
        .catch((err) => {
          console.error("Error loading product:", err);
        })
        .finally(() => setLoadingProduct(false));
    }
  }, [productId]); // only depend on productId

  // Load recommendations when product is available
  useEffect(() => {
    if (product?.name) {
      getRecommendations(product.name, 4)
        .then(setRecommendations)
        .catch(() => {});
      logProductInteraction(String(product.id), "view").catch(() => {});
    }
  }, [product?.id, product?.name]);

  const images = product?.images || [];
  const activeImageUrl = images[selectedImage]?.url || images[0]?.url;
  const activePrice = selectedVariant?.price_override || product?.base_price || 0;
  const variants = product?.variants || [];
  const specs = product?.specifications || {};

  async function handleAdd() {
    if (!selectedVariant) return;
    setLoading(true);
    try {
      await addToCart(selectedVariant.id, 1);
      if (product) {
        logProductInteraction(String(product.id), "cart").catch(() => {});
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  if (loadingProduct) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 animate-fade-in">
        <div className="skeleton aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-6 w-1/4 rounded" />
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="skeleton h-8 w-1/3 rounded" />
          <div className="skeleton h-24 w-full rounded" />
          <div className="skeleton h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="rounded-2xl border p-12 text-center animate-fade-in"
        style={{ borderColor: "var(--border-default)", background: "var(--surface-primary)" }}
      >
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Product Not Found
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          This product could not be loaded. Please return to the catalog.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow"
          style={{ background: "var(--brand-600)" }}
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
        <Link href="/" className="flex items-center gap-1 transition-colors hover:underline" style={{ color: "var(--text-secondary)" }}>
          <ChevronLeftIcon />
          Home
        </Link>
        <span>/</span>
        <span>{product.category?.name || "Category"}</span>
        <span>/</span>
        <span style={{ color: "var(--text-primary)" }}>{product.brand?.name || "Brand"}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left — Image Gallery */}
        <div className="space-y-4">
          <div
            className="overflow-hidden rounded-2xl border flex items-center justify-center p-6"
            style={{ borderColor: "var(--border-default)", background: "var(--surface-primary)" }}
          >
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt={product.name}
                className="max-h-[420px] w-full object-contain transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div
                className="flex aspect-square items-center justify-center"
                style={{ background: "var(--surface-tertiary)", color: "var(--text-tertiary)" }}
              >
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25a1.5 1.5 0 0 0 1.5 1.5Z" />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setSelectedImage(i)}
                  className="h-18 w-18 flex-shrink-0 overflow-hidden rounded-xl border-2 p-1 transition-all"
                  style={{
                    borderColor: i === selectedImage ? "var(--brand-600)" : "var(--border-default)",
                    opacity: i === selectedImage ? 1 : 0.6,
                    background: "var(--surface-primary)",
                  }}
                >
                  <img src={img.url} alt={img.alt_text || product.name} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Product Info */}
        <div className="flex flex-col">
          {/* Brand & Category */}
          <div className="mb-3 flex items-center gap-2">
            {product.brand?.name && (
              <span
                className="rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ background: "var(--brand-50)", color: "var(--brand-700)" }}
              >
                {product.brand.name}
              </span>
            )}
            {product.category?.name && (
              <span
                className="rounded-lg px-3 py-1 text-xs font-semibold"
                style={{ background: "var(--surface-tertiary)", color: "var(--text-secondary)" }}
              >
                {product.category.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              {formatPrice(activePrice)}
            </span>
            <span
              className="rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{ background: "#dcfce7", color: "#166534" }}
            >
              In Stock & Ready to Ship
            </span>
          </div>

          {/* Trust Badges */}
          <div
            className="mt-6 flex flex-wrap gap-4 rounded-xl border p-4"
            style={{ borderColor: "var(--border-default)", background: "var(--surface-secondary)" }}
          >
            {[
              { icon: <ShieldIcon />, text: "1 Year Official Warranty" },
              { icon: <TruckIcon />, text: "Nationwide Fast Delivery" },
              { icon: <CheckIcon />, text: "100% Genuine Guaranteed" },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--accent-success)" }}>{badge.icon}</span>
                {badge.text}
              </div>
            ))}
          </div>

          {/* Variant Selector */}
          {variants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Configuration
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const label = Object.values(variant.attributes || {}).join(" / ") || variant.sku;
                  const active = selectedVariant?.id === variant.id;
                  const inStock = (variant.stock_quantity ?? 0) > 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!inStock}
                      className="rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-40"
                      style={{
                        borderColor: active ? "var(--brand-600)" : "var(--border-default)",
                        background: active ? "var(--brand-50)" : "var(--surface-primary)",
                        color: active ? "var(--brand-700)" : "var(--text-primary)",
                      }}
                    >
                      {label}
                      <span className="ml-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        ({inStock ? `${variant.stock_quantity} available` : "Out of stock"})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart Actions */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAdd}
              disabled={!selectedVariant || (selectedVariant?.stock_quantity ?? 0) < 1 || loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
              style={{ background: added ? "var(--accent-success)" : "var(--brand-600)" }}
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Adding...
                </>
              ) : added ? (
                <>
                  <CheckIcon />
                  Added to Cart!
                </>
              ) : (
                "Add to Cart"
              )}
            </button>
            <Link
              href="/cart"
              className="flex items-center justify-center rounded-xl border px-6 py-4 text-sm font-semibold transition-all hover:shadow-md"
              style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            >
              View Cart
            </Link>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8">
              <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Product Description
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Technical Specifications */}
          {Object.keys(specs).length > 0 && (
            <div className="mt-10">
              <h3 className="mb-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Technical Specifications
              </h3>
              <dl
                className="divide-y overflow-hidden rounded-xl border"
                style={{ borderColor: "var(--border-default)", background: "var(--surface-primary)" }}
              >
                {Object.entries(specs).map(([key, val], i) => (
                  <div
                    key={key}
                    className="grid grid-cols-3 px-4 py-3 text-sm"
                    style={{ background: i % 2 === 0 ? "var(--surface-primary)" : "var(--surface-secondary)" }}
                  >
                    <dt className="font-semibold uppercase" style={{ color: "var(--text-tertiary)", fontSize: "0.75rem" }}>
                      {key}
                    </dt>
                    <dd className="col-span-2 font-medium" style={{ color: "var(--text-primary)" }}>{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Carousel */}
      {recommendations.length > 0 && (
        <section className="mt-16 animate-fade-in-up">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              Recommended Pairings & Similar Tech
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((rec, i) => (
              <a
                key={rec.id}
                href={rec.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logProductInteraction(rec.id, "view")}
                className="group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up"
                style={{
                  borderColor: "var(--border-default)",
                  background: "var(--surface-primary)",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="aspect-square overflow-hidden p-3" style={{ background: "var(--surface-tertiary)" }}>
                  {rec.thumbnail ? (
                    <img
                      src={rec.thumbnail}
                      alt={rec.title}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-indigo-600" style={{ color: "var(--text-primary)" }}>
                    {rec.title}
                  </h3>
                  <p
                    className="mt-3 border-t pt-2 text-base font-extrabold"
                    style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  >
                    {rec.price}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
