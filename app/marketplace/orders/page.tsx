"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Order = {
  id: string;
  orderId: string;
  productName: string;
  price: number;
  credential: string;
  status: string;
  createdAt: string | null;
};

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = await user.getIdToken();

        const response = await fetch("/api/marketplace/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load marketplace orders."
          );
        }

        setOrders(data.orders || []);
      } catch (err: any) {
        console.error("Marketplace orders error:", err);
        setError(
          err?.message || "Unable to load marketplace orders."
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">My Orders</h1>
            <p className="mt-1 text-sm text-gray-400">
              Your marketplace purchases and credentials.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-500"
          >
            Marketplace
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-gray-400">
            Loading orders...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="font-bold">No marketplace orders yet.</p>
            <p className="mt-2 text-sm text-gray-500">
              Your purchased products will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-white">
                      {order.productName}
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Order: {order.orderId}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                    {order.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="mt-1 font-bold">
                      ₦{Number(order.price).toLocaleString()}
                    </p>
                  </div>

<div>
  <p className="text-xs text-gray-500">Credential</p>

  <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3">
    <p className="break-all font-mono text-sm text-blue-300">
      {order.credential || "Unavailable"}
    </p>

    {order.credential && (
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(order.credential);
            alert("Full credential copied!");
          } catch {
            alert("Unable to copy credential.");
          }
        }}
        className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
      >
        Copy Full Credential
      </button>
    )}
  </div>
</div>

                  <div>
                    <p className="text-xs text-gray-500">Purchased</p>
                    <p className="mt-1 text-sm text-gray-300">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
