"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/lib/firebase";

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setTransactions([]);
          setLoading(false);
          return;
        }

        try {
          const q = query(
            collection(db, "walletTransactions"),
            where("uid", "==", user.uid),
            orderBy("createdAt", "desc")
          );

          const snapshot =
            await getDocs(q);

          const data =
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

          setTransactions(data);
        } catch (error) {
          console.error(
            "Transaction history error:",
            error
          );
        } finally {
          setLoading(false);
        }
      });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        Transaction History
      </h1>

      {loading ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm">
          Loading...
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm">
          <p className="text-gray-600">
            No transactions yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">

          {transactions.map(
            (transaction) => (
              <div
                key={transaction.id}
                className="bg-white p-6 rounded-3xl shadow-sm"
              >

                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">
                    Wallet Funding
                  </h2>

                  <span className="text-green-600 font-bold">
                    +₦
                    {Number(
                      transaction.amount || 0
                    ).toLocaleString()}
                  </span>
                </div>

                <p className="mt-3 text-gray-600">
                  Status:{" "}
                  <span className="text-green-600 font-semibold">
                    {transaction.status ||
                      "Success"}
                  </span>
                </p>

                <p className="mt-2 text-gray-500 text-sm break-all">
                  Reference:{" "}
                  {transaction.reference ||
                    transaction.id}
                </p>

                <p className="mt-2 text-gray-500 text-sm">
                  Channel:{" "}
                  {transaction.channel ||
                    "Paystack"}
                </p>

                <p className="mt-2 text-gray-400 text-sm">
                  {transaction.createdAt
                    ?.toDate
                    ? transaction.createdAt
                        .toDate()
                        .toLocaleString()
                    : "Date unavailable"}
                </p>

              </div>
            )
          )}

        </div>
      )}

    </main>
  );
}
