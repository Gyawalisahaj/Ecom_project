"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrderHistory } from "@/lib/api";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    getOrderHistory()
      .then((data) => setOrders(data.results || data))
      .catch(() => router.push("/login"));
  }, [router]);

  return (
    <main className="min-h-screen bg-zinc-50 py-10">
      <div className="mx-auto max-w-4xl px-4">
        <a href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Back to Store
        </a>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Order History</h1>

        <div className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <p className="text-sm text-zinc-500">No orders placed yet.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <span className="font-bold text-zinc-900">Order #{order.id}</span>
                    <p className="text-xs text-zinc-500">{order.shipping_address}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-800">
                      {order.status}
                    </span>
                    <p className="mt-1 font-bold text-zinc-900">
                      NPR {Number(order.total_amount).toLocaleString()}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-zinc-600">
                  {order.items?.map((item: any) => (
                    <li key={item.id}>
                      {item.quantity}x {item.product_name} ({item.variant_sku}) — NPR {Number(item.price_at_purchase).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}