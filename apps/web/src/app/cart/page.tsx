// apps/web/src/app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutCart, getCart } from "@/lib/api";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [orderReceipt, setOrderReceipt] = useState<any>(null);

  useEffect(() => {
    getCart()
      .then(setCart)
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    const order = await checkoutCart(address, phone);
    setOrderReceipt(order);
    setCart({ items: [], total_items: 0 });
  }

  return (
    <main className="min-h-screen bg-zinc-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <a href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Continue Shopping
        </a>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Shopping Cart</h1>

        {orderReceipt && (
          <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-sm text-emerald-900">
            <h2 className="text-lg font-bold">Order #{orderReceipt.id} Placed!</h2>
            <p className="mt-1">Total Amount: NPR {Number(orderReceipt.total_amount).toLocaleString()}</p>
            <p>Status: {orderReceipt.status.toUpperCase()}</p>
          </div>
        )}

        {cart?.items?.length > 0 ? (
          <div className="mt-6 space-y-6">
            <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {cart.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-zinc-900">{item.product_name}</p>
                    <p className="text-xs text-zinc-500">SKU: {item.variant_sku}</p>
                  </div>
                  <span className="text-sm font-medium text-zinc-700">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCheckout} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Delivery Details</h2>
              <textarea
                placeholder="Full Delivery Address (e.g., New Baneshwor, Kathmandu)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 p-3 text-sm"
              />
              <input
                type="text"
                placeholder="Contact Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 p-3 text-sm"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Place Order
              </button>
            </form>
          </div>
        ) : (
          !orderReceipt && <p className="mt-6 text-sm text-zinc-500">Your cart is currently empty.</p>
        )}
      </div>
    </main>
  );
}