"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type ReportData = {
  revenue: number;
  profit: number;
  refunds: number;
  deposits: number;
  sales: number;
};

const format = (value: number) =>
  `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function AdminReports() {
  const [data, setData] = useState<ReportData>({
    revenue: 0,
    profit: 0,
    refunds: 0,
    deposits: 0,
    sales: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadReports();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

    async function loadReports() {
    try {
      const { getAuth } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase");

      const user = getAuth().currentUser;

      if (!user) {
        throw new Error("Admin session not found.");
      }

      const token = await user.getIdToken();

      const res = await fetch("/api/admin/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load reports."
        );
      }

      setData({
        revenue: Number(result.revenue ?? 0),
        profit: Number(result.profit ?? 0),
        refunds: Number(result.refunds ?? 0),
        deposits: Number(result.deposits ?? 0),
        sales: Number(result.sales ?? 0),
      });
    } catch (error) {
      console.error("Reports error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() =>
            (window.location.href = "/admin-dashboard")
          }
          className="mb-6 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold"
        >
          ← Admin Dashboard
        </button>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-indigo-400">
            Financial Reports
          </p>

          <h1 className="mt-2 text-4xl font-black">
            🧾 Reports
          </h1>

          <p className="mt-2 text-gray-400">
            Sales, profit, refunds, deposits and financial performance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-3xl border border-green-400/20 bg-white/[0.04] p-6">
            <p className="text-sm text-gray-400">
              Total Revenue
            </p>
            <p className="mt-2 text-3xl font-black text-green-300">
              {loading ? "..." : format(data.revenue)}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6">
            <p className="text-sm text-gray-400">
              Total Profit
            </p>
            <p className="mt-2 text-3xl font-black text-cyan-300">
              {loading ? "..." : format(data.profit)}
            </p>
          </div>

          <div className="rounded-3xl border border-red-400/20 bg-white/[0.04] p-6">
            <p className="text-sm text-gray-400">
              Total Refunds
            </p>
            <p className="mt-2 text-3xl font-black text-red-300">
              {loading ? "..." : format(data.refunds)}
            </p>
          </div>

          <div className="rounded-3xl border border-purple-400/20 bg-white/[0.04] p-6">
            <p className="text-sm text-gray-400">
              Total Deposits
            </p>
            <p className="mt-2 text-3xl font-black text-purple-300">
              {loading ? "..." : format(data.deposits)}
            </p>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-white/[0.04] p-6">
            <p className="text-sm text-gray-400">
              Completed Sales
            </p>
            <p className="mt-2 text-3xl font-black text-yellow-300">
              {loading ? "..." : data.sales}
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}
