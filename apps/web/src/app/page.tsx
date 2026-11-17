// apps/web/src/app/page.tsx
import { getProducts } from "@/lib/api";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { Product } from "@/types/catalog";

export default async function HomePage() {
  let products: Product[] = [];
  let backendOffline = false;

  try {
    const catalogData = await getProducts(1);
    products = catalogData.results;
  } catch (error) {
    console.error("Core API unreachable:", error);
    backendOffline = true;
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            buyit<span className="text-blue-600">.np</span>
          </span>
          <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600">
            <a href="/login" className="hover:text-zinc-900">Login</a>
            <a
              href="/cart"
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-white hover:bg-zinc-800"
            >
              Cart
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {backendOffline ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
            <strong>Core Catalog Service Offline:</strong> Start your Django server on{" "}
            <code className="font-mono">http://127.0.0.1:8000</code> and refresh the page.
          </div>
        ) : (
          <CatalogBrowser initialProducts={products} />
        )}
      </section>
    </main>
  );
}