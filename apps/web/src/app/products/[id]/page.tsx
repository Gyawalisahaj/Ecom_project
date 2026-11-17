import { getProductById } from "@/lib/api";
import { ProductDetailClient } from "@/components/ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  return (
    <main className="min-h-screen bg-zinc-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <a href="/" className="mb-6 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Back to Catalog
        </a>
        <ProductDetailClient product={product} />
      </div>
    </main>
  );
}