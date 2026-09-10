"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
const [adminUid, setAdminUid] = useState("");

  const loadStats = async () => {
    try {
      const usersSnapshot = await getDocs(
        collection(db, "users")
      );

      const transactionsSnapshot = await getDocs(
        collection(db, "transactions")
      );

      setTotalUsers(usersSnapshot.size);
      setTotalTransactions(
        transactionsSnapshot.size
      );
    } catch (error) {
      console.log(
        "Admin stats error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    setAdminUid(user?.uid || "");
  });

  loadStats();

  return () => unsubscribe();
}, []);

  const openPage = (path: string) => {
    window.location.href = path;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">

      {/* Animated cyber background */}
      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[130px] animate-pulse" />

        <div className="absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-purple-600/20 blur-[130px] animate-pulse" />

        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-green-500/10 blur-[130px] animate-pulse" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:45px_45px]" />

      </div>

      <section className="relative z-10 mx-auto max-w-6xl p-5 sm:p-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-400">
              Secure Control Center
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              Admin Panel
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Manage your entire OTP marketplace
            </p>

<p className="mt-3 text-xs text-gray-500">
  Admin UID: {adminUid || "Not signed in"}
</p>
       
   </div>

          <div className="rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3">

            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              System
            </p>

            <p className="mt-1 text-sm font-black text-green-400">
              ● ONLINE
            </p>

          </div>

        </div>

        {/* Overview stats */}
        <div className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">

            <p className="text-sm text-gray-400">
              Total Users
            </p>

            <p className="mt-2 text-4xl font-black text-cyan-300">
              {loading ? "..." : totalUsers}
            </p>

          </div>

          <div className="rounded-3xl border border-purple-400/20 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">

            <p className="text-sm text-gray-400">
              Transactions
            </p>

            <p className="mt-2 text-4xl font-black text-purple-300">
              {loading
                ? "..."
                : totalTransactions}
            </p>

          </div>

        </div>

        {/* Main controls */}
        <div className="mt-8">

          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
            Platform Management
          </p>

          <div className="grid gap-4 sm:grid-cols-2">

            {/* Finance */}
            <button
              onClick={() =>
                openPage("/admin-finance")
              }
              className="group rounded-3xl border border-green-400/25 bg-green-400/[0.06] p-6 text-left transition hover:border-green-300/60 hover:bg-green-400/[0.1]"
            >
              <p className="text-2xl font-black text-green-300">
                💰 Finance
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Deposits, sales, refunds,
                profit and platform funds.
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-green-400">
                Open Finance →
              </p>
            </button>

            {/* Market */}
            <button
              onClick={() =>
                openPage("/admin-market")
              }
              className="group rounded-3xl border border-yellow-400/25 bg-yellow-400/[0.05] p-6 text-left transition hover:border-yellow-300/60 hover:bg-yellow-400/[0.09]"
            >
              <p className="text-2xl font-black text-yellow-300">
                💱 Market & Pricing
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Live USD rate, custom pricing
                rate and marketplace markup.
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-yellow-400">
                Manage Pricing →
              </p>
            </button>

            {/* Users */}
            <button
              onClick={() =>
                openPage("/admin-users")
              }
              className="group rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6 text-left transition hover:border-cyan-300/50 hover:bg-cyan-400/[0.06]"
            >
              <p className="text-2xl font-black">
                👥 Users
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Accounts, balances, bans and
                user activity.
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-cyan-400">
                Manage Users →
              </p>
            </button>

            {/* Orders */}
            <button
              onClick={() =>
                openPage("/admin-orders")
              }
              className="group rounded-3xl border border-purple-400/20 bg-white/[0.04] p-6 text-left transition hover:border-purple-300/50 hover:bg-purple-400/[0.06]"
            >
              <p className="text-2xl font-black">
                📦 Orders
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Monitor OTP orders, status,
                cancellations and refunds.
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-purple-400">
                Manage Orders →
              </p>
            </button>

            {/* Notifications */}
            <button
              onClick={() =>
               openPage("/admin-notifications")
              }
              className="group rounded-3xl border border-orange-400/20 bg-white/[0.04] p-6 text-left transition hover:border-orange-300/50 hover:bg-orange-400/[0.06]"
            >
              <p className="text-2xl font-black">
                🔔 Notifications
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Broadcast announcements and
                manage user notifications.
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-orange-400">
                Notification Center →
              </p>
            </button>

            {/* SMSPool */}
            <button
              onClick={() =>
                openPage("/admin-smspool")
              }
              className="group rounded-3xl border border-blue-400/20 bg-white/[0.04] p-6 text-left transition hover:border-blue-300/50 hover:bg-blue-400/[0.06]"
            >
              <p className="text-2xl font-black">
                📡 SMSPool
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Balance, API status, costs and
                number purchasing activity.
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-blue-400">
                SMSPool Control →
              </p>
            </button>

           {/* Withdrawals */}
<div className="group rounded-3xl border border-emerald-400/20 bg-white/[0.04] p-6 text-left">
  <p className="text-2xl font-black">
    🏦 Withdrawals
  </p>

  <p className="mt-2 text-sm text-gray-400">
    Withdraw available platform
    funds to your bank account.
  </p>

  <div className="mt-5 flex flex-col gap-3">
    <div
      onClick={() => openPage("/admin-finance")}
      className="cursor-pointer rounded-xl bg-emerald-400 px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-black"
    >
      Withdrawal Center →
    </div>

    <div
      onClick={() =>
        openPage("/admin-withdraw/transactions")
      }
      className="cursor-pointer rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white"
    >
      Transaction History →
    </div>
  </div>
</div>

           {/* Security & Audit */}
<div className="group rounded-3xl border border-emerald-400/20 bg-white/[0.04] p-6 text-left">
  <p className="text-2xl font-black">
    🛡️ Security & Audit
  </p>

  <p className="mt-2 text-sm text-gray-400">
    Admin actions, financial changes and security activity.
  </p>

  <div className="mt-5">
    <div
      onClick={() => openPage("/admin-security")}
      className="cursor-pointer rounded-xl bg-emerald-400 px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-black"
    >
      Security Center →
    </div>
  </div>
</div>

                       {/* Settings */}
            <button
              onClick={() =>
                openPage("/admin-settings")
              }
              className="group rounded-3xl border border-gray-400/20 bg-white/[0.04] p-6 text-left transition hover:border-gray-300/40"
            >
              <p className="text-2xl font-black">
                ⚙️ Platform Settings
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Maintenance mode, deposits,
                withdrawals and marketplace controls.
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-gray-400">
                Open Settings →
              </p>
            </button>

                       {/* Reports */}
            <button
              onClick={() =>
                openPage("/admin-reports")
              }
              className="group rounded-3xl border border-indigo-400/20 bg-white/[0.04] p-6 text-left transition hover:border-indigo-300/50 hover:bg-indigo-400/[0.06]"
            >
              <p className="text-2xl font-black">
                🧾 Reports
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Sales, profit, refunds, deposits and financial reports.
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-indigo-400">
                View Reports →
              </p>
            </button>

          </div>
        </div>

        {/* Security footer */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-600">
            Protected Admin Environment
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Financial actions will require server-side
            authorization and audit logging.
          </p>

        </div>

      </section>

    </main>
  );
}
