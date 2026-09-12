"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Transaction = {
  id: string;
  orderId: string;
  productId: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string | null;
};

export default function MarketplaceTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = await user.getIdToken();

        const response = await fetch(
          "/api/marketplace/transactions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load marketplace transactions."
          );
        }

        setTransactions(data.transactions || []);
      } catch (err: any) {
        console.error(
          "Marketplace transactions error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load marketplace transactions."
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
            <h1 className="text-3xl font-black">
              Marketplace Transactions
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Your marketplace purchase history.
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
            Loading transactions...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="font-bold">
              No marketplace transactions yet.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Your marketplace purchases will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      {transaction.type}
                    </p>

                    <h2 className="mt-1 font-bold">
                      Marketplace Purchase
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Order: {transaction.orderId || "N/A"}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                    {transaction.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      Amount
                    </p>

                    <p className="mt-1 text-lg font-black">
                      ₦
                      {Number(
                        transaction.amount
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Date
                    </p>

                    <p className="mt-1 text-sm text-gray-300">
                      {transaction.createdAt
                        ? new Date(
                            transaction.createdAt
                          ).toLocaleString()
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
