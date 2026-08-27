"use client";

import {
  useState,
  useEffect
} from "react";

import {
  collection,
  getDocs
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function AdminDashboard() {

  const [totalUsers, setTotalUsers] =
    useState(0);

  const [totalTransactions, setTotalTransactions] =
    useState(0);

  const loadStats = async () => {

    try {

      const usersSnapshot =
        await getDocs(
          collection(db, "users")
        );

      const transactionsSnapshot =
        await getDocs(
          collection(db, "transactions")
        );

      setTotalUsers(
        usersSnapshot.size
      );

      setTotalTransactions(
        transactionsSnapshot.size
      );

    } catch (error) {

      console.log(error);

    }

  };

  useEffect(() => {

    loadStats();

  }, []);

  return (

    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-primary mb-8">
        Admin Dashboard
      </h1>

      <div className="grid gap-6">

        <div className="grid grid-cols-2 gap-4">

          <div className="bg-primary text-white p-6 rounded-3xl">

            <h2 className="text-xl font-bold">
              Total Users
            </h2>

            <p className="text-3xl font-bold mt-3">
              {totalUsers}
            </p>

          </div>

          <div className="bg-green-600 text-white p-6 rounded-3xl">

            <h2 className="text-xl font-bold">
              Transactions
            </h2>

            <p className="text-3xl font-bold mt-3">
              {totalTransactions}
            </p>

          </div>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm">

          <button
            onClick={() =>
              window.location.href = "/admin-users"
            }
            className="bg-green-600 text-white py-4 rounded-2xl font-bold w-full"
          >
            Open Users Management
          </button>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm">

          <button
            onClick={() =>
              window.location.href = "/admin-orders"
            }
            className="bg-purple-600 text-white py-4 rounded-2xl font-bold w-full"
          >
            Open Orders Management
          </button>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm">

          <button
            onClick={() =>
              window.location.href = "/admin"
            }
            className="bg-primary text-white py-4 rounded-2xl font-bold w-full"
          >
            Open Notifications Panel
          </button>

        </div>

      </div>

    </main>

  );

}
