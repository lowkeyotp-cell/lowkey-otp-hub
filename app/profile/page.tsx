"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function ProfilePage() {
  const [username, setUsername] = useState("LOWKEY User");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email || "");

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data();

          setUsername(
            String(data.username || user.displayName || "LOWKEY User")
          );

          setBalance(Number(data.balance || 0));
        }
      } catch (error) {
        console.error("Profile loading error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <header className="border-b border-white/10 bg-[#090b10]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <Link
              href="/marketplace"
              className="text-2xl font-black tracking-tight"
            >
              LOWKEY <span className="text-primary">OTP</span>
            </Link>

            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
              Account
            </p>
          </div>

          <Link
            href="/marketplace"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            Marketplace
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#111827] via-[#0c1220] to-[#090b10] p-6 shadow-2xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl font-black text-primary">
              {username.charAt(0).toUpperCase()}
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
              LOWKEY Account
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {loading ? "Loading..." : username}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {email || "Your LOWKEY account"}
            </p>

            <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Wallet Balance
              </p>

              <p className="mt-2 text-3xl font-black">
                ₦{balance.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Available for LOWKEY purchases.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/marketplace"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-primary/30 hover:bg-white/[0.06]"
          >
            <p className="text-lg font-bold">Home</p>
            <p className="mt-1 text-sm text-gray-500">
              Browse the LOWKEY Marketplace
            </p>
          </Link>

          <Link
            href="/marketplace/orders"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-primary/30 hover:bg-white/[0.06]"
          >
            <p className="text-lg font-bold">My Orders</p>
            <p className="mt-1 text-sm text-gray-500">
              View your purchased products
            </p>
          </Link>

          <Link
            href="/marketplace/transactions"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-primary/30 hover:bg-white/[0.06]"
          >
            <p className="text-lg font-bold">Transactions</p>
            <p className="mt-1 text-sm text-gray-500">
              View your marketplace transactions
            </p>
          </Link>

          <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-5">
            <p className="text-lg font-bold">Profile</p>
            <p className="mt-1 text-sm text-gray-500">
              Manage your LOWKEY account
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
