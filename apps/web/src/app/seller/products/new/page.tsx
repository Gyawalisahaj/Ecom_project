
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSellerProduct, uploadProductImageToR2 } from "@/lib/api";

export default function NewSellerProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("1");
  const [brandId, setBrandId] = useState("1");
  const [basePrice, setBasePrice] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("10");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let imageUrl = "";
      if (file) {
        imageUrl = await uploadProductImageToR2(file);
      }

      await createSellerProduct({
        name,
        category: Number(categoryId),
        brand: Number(brandId),
        base_price: basePrice,
        sku,
        stock_quantity: Number(stock),
        description,
        specifications: {},
        image_url: imageUrl,
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to publish product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Publish New Product (Seller)</h1>
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Product Name (e.g., ASUS ROG Zephyrus G14)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Category ID (e.g., 1)"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
            <input
              type="number"
              placeholder="Brand ID (e.g., 1)"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Base Price (NPR)"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
            <input
              type="text"
              placeholder="Initial SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
            <input
              type="number"
              placeholder="Stock Qty"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <textarea
            placeholder="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 p-3 text-sm"
          />
          <div>
            <label className="block text-xs font-medium text-zinc-600">Product Image (Direct to Cloudflare R2)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 text-sm text-zinc-600"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:bg-zinc-400"
          >
            {submitting ? "Uploading & Publishing..." : "Publish Product"}
          </button>
        </form>
      </div>
    </main>
  );
}