// apps/web/src/app/payment/verify/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyKhaltiPayment } from "@/lib/api";

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const pidx = searchParams.get("pidx");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying Khalti transaction...");

  useEffect(() => {
    if (!pidx) {
      setStatus("error");
      setMessage("Missing payment identifier (pidx).");
      return;
    }

    verifyKhaltiPayment(pidx)
      .then((res) => {
        setStatus("success");
        setMessage(`Payment confirmed for Order #${res.order_id}.`);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Payment verification failed or was cancelled.");
      });
  }, [pidx]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">
          {status === "verifying" ? "Processing Payment" : status === "success" ? "Payment Successful" : "Payment Failed"}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">{message}</p>
        <a
          href="/orders"
          className="mt-6 inline-block rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          View My Orders
        </a>
      </div>
    </main>
  );
}
