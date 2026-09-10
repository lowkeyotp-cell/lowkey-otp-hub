"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  transferInitiated: boolean;
  createdAt: any;
};

function formatAmount(amount: number) {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: any) {
  try {
    if (!value) return "Date unavailable";

    if (value._seconds) {
      return new Date(value._seconds * 1000).toLocaleString(
        "en-NG"
      );
    }

    return new Date(value).toLocaleString("en-NG");
  } catch {
    return "Date unavailable";
  }
}

function maskAccount(account: string) {
  if (!account) return "••••••••••";

  return `••••${account.slice(-4)}`;
}

export default function WithdrawalTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (!user) {
          setMessage("Please log in as admin.");
          setLoading(false);
          return;
        }

        try {
          const token = await user.getIdToken();

          const res = await fetch(
            "/api/admin/withdraw/transactions",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

          const data = await res.json();

          if (!data.success) {
            throw new Error(
              data.message ||
                "Unable to load transactions."
            );
          }

          setTransactions(data.transactions ?? []);
        } catch (error: any) {
          setMessage(
            error.message ||
              "Unable to load withdrawal history."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-xl">

        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-green-400">
              Admin Finance
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Withdrawal History
            </h1>
          </div>

          <button
            onClick={() =>
              (window.location.href =
                "/admin-withdraw")
            }
            className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm font-bold"
          >
            Withdraw
          </button>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-gray-800 bg-gray-950 p-8 text-center text-gray-400">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-3xl border border-gray-800 bg-gray-950 p-8 text-center">
            <p className="text-lg font-bold">
              No withdrawal transactions
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Withdrawal requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const status =
                transaction.status.toLowerCase();

              const pending = status === "pending";
              const completed =
                status === "completed";
              const failed = status === "failed";

              return (
                <div
                  key={transaction.id}
                  className="rounded-3xl border border-gray-800 bg-gray-950 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        Withdrawal ID
                      </p>

                      <p className="mt-1 break-all text-sm font-bold">
                        {transaction.id}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        pending
                          ? "bg-yellow-500/10 text-yellow-400"
                          : completed
                          ? "bg-green-500/10 text-green-400"
                          : failed
                          ? "bg-red-500/10 text-red-400"
                          : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs text-gray-500">
                      Amount
                    </p>

                    <p className="mt-1 text-3xl font-black text-green-400">
                      {formatAmount(
                        transaction.amount
                      )}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        Bank
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {transaction.bankName ||
                          "Unknown bank"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Account
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {maskAccount(
                          transaction.accountNumber
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-gray-500">
                      Account Name
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      {transaction.accountName ||
                        "Unavailable"}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-gray-800 pt-4">
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="text-gray-500">
                        Created
                      </span>

                      <span className="text-gray-400">
                        {formatDate(
                          transaction.createdAt
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between gap-3 text-xs">
                      <span className="text-gray-500">
                        Transfer
                      </span>

                      <span
                        className={
                          transaction.transferInitiated
                            ? "text-green-400"
                            : "text-gray-400"
                        }
                      >
                        {transaction.transferInitiated
                          ? "Initiated"
                          : "Not initiated"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
