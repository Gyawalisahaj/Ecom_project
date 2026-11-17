
import Link from "next/link";

export interface CardItem {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  base_price: string | number;
  thumbnail: string | null;
  specifications: Record<string, string>;
}

export function ProductCard({ item }: { item: CardItem }) {
  const topSpecs = Object.entries(item.specifications || {}).slice(0, 3);

  return (
    <Link
      href={`/products/${item.id}`}
      className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400 hover:shadow-md"
    >
      <div>
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg bg-zinc-100">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              No Image
            </div>
          )}
        </div>

        <div className="mb-1 flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>{item.brand}</span>
          <span>{item.category}</span>
        </div>

        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-zinc-900">
          {item.name}
        </h3>

        {topSpecs.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {topSpecs.map(([key, value]) => (
              <span
                key={key}
                className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
              >
                {key.toUpperCase()}: {value}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 pt-3">
        <p className="text-lg font-bold text-zinc-900">
          NPR {Number(item.base_price).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}