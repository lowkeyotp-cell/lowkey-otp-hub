"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth, db } from "@/lib/firebase";

export default function DashboardPage() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setBalance(Number(data.balance || 0));

          if (data.referralCode) {
            setReferralCode(String(data.referralCode));
          } else {
            const idToken = await user.getIdToken();

            const response = await fetch("/api/referrals/generate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ idToken }),
            });

            const result = await response.json();

            if (result.success && result.referralCode) {
              setReferralCode(result.referralCode);
            }
          }
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogoClick = () => {
    const nextClicks = logoClicks + 1;
    setLogoClicks(nextClicks);

    if (nextClicks >= 7) {
      setLogoClicks(0);
      router.push("/admin-login");
    }
  };

  const copyReferralLink = async () => {
    if (!referralCode) return;

    const link =
      `${window.location.origin}/register?ref=${referralCode}`;

    try {
      await navigator.clipboard.writeText(link);
      setReferralCopied(true);

      setTimeout(() => {
        setReferralCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-black tracking-widest">
            LOWKEY
          </div>
          <p className="text-gray-500 mt-2 text-sm">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white pb-10">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070b14]/95 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-5 py-5 flex items-center justify-between">

          <button
            type="button"
            onClick={handleLogoClick}
            className="text-left active:scale-95 transition"
          >
            <p className="text-xl font-black tracking-[0.25em] text-white">
              LOWKEY
            </p>
            <p className="text-[10px] uppercase tracking-[0.35em] text-blue-400">
              OTP Marketplace
            </p>
          </button>

          <button
            type="button"
            onClick={() => router.push("/notifications")}
            className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-lg"
          >
            🔔
          </button>

        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pt-6">

        {/* Welcome */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Welcome back
          </p>
          <h1 className="text-3xl font-black mt-1">
            Your Dashboard
          </h1>
        </div>

        {/* Wallet */}
        <div className="relative overflow-hidden rounded-[28px] border border-blue-500/20 bg-gradient-to-br from-[#101a33] to-[#0b1020] p-6 shadow-2xl shadow-blue-950/20">

          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Available Balance
              </p>

              <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-[11px] font-semibold text-green-400">
                ● Wallet
              </span>
            </div>

            <p className="text-4xl font-black mt-4 tracking-tight">
              ₦{balance.toLocaleString()}
            </p>

            <button
              type="button"
              onClick={() => router.push("/fund-wallet")}
              className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 active:scale-[0.98] transition"
            >
              + Fund Wallet
            </button>

            <button
              type="button"
              onClick={() => router.push("/marketplace")}
              className="mt-3 w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left hover:bg-white/[0.08] active:scale-[0.98] transition"
            >
              <div>
                <p className="font-bold text-white">
                  Marketplace
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Buy digital products & view marketplace orders
                </p>
              </div>

              <span className="text-xl text-blue-400">
                →
              </span>
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <section className="mt-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              Quick Actions
            </h2>
            <span className="text-xs text-gray-500">
              Fast access
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">

            <Link
              href="/buy-number"
              className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.08] p-5 active:scale-[0.98] transition"
            >
              <div className="text-2xl mb-4">📱</div>
              <p className="font-bold">Buy Number</p>
              <p className="text-xs text-gray-500 mt-1">
                Get an OTP number
              </p>
            </Link>

            <Link
              href="/orders"
              className="rounded-3xl border border-purple-500/20 bg-purple-500/[0.08] p-5 active:scale-[0.98] transition"
            >
              <div className="text-2xl mb-4">📦</div>
              <p className="font-bold">My Orders</p>
              <p className="text-xs text-gray-500 mt-1">
                Track your OTPs
              </p>
            </Link>

            <Link
              href="/transactions"
              className="rounded-3xl border border-green-500/20 bg-green-500/[0.08] p-5 active:scale-[0.98] transition"
            >
              <div className="text-2xl mb-4">💳</div>
              <p className="font-bold">Transactions</p>
              <p className="text-xs text-gray-500 mt-1">
                View wallet history
              </p>
            </Link>

            <Link
              href="/notifications"
              className="rounded-3xl border border-orange-500/20 bg-orange-500/[0.08] p-5 active:scale-[0.98] transition"
            >
              <div className="text-2xl mb-4">🔔</div>
              <p className="font-bold">Notifications</p>
              <p className="text-xs text-gray-500 mt-1">
                Important updates
              </p>
            </Link>

          </div>
        </section>

        {/* 7 Click OTP */}
        <section className="mt-7">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-xl">
                ⚡
              </div>

              <div>
                <h2 className="font-bold text-lg">
                  7 Click OTP
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fast access to your OTP services.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/buy-number")}
              className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 text-sm font-bold active:scale-[0.98] transition"
            >
              Get Started →
            </button>

          </div>
        </section>

        {/* Referral */}
        <section className="mt-7">
          <div className="rounded-[28px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/[0.08] to-transparent p-6">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-yellow-400 font-bold">
                  Referral Program
                </p>

                <h2 className="text-xl font-black mt-2">
                  Earn ₦100
                </h2>

                <p className="text-sm text-gray-400 mt-2 leading-6">
                  Invite a user and earn ₦100 when they make
                  their first successful deposit of ₦500 or more.
                </p>
              </div>

              <div className="text-3xl">
                🎁
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs text-gray-500 mb-2">
                Your referral code
              </p>

              <div className="flex gap-2">
                <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-center font-black tracking-[0.2em]">
                  {referralCode || "Generating..."}
                </div>

                <button
                  type="button"
                  onClick={copyReferralLink}
                  className="rounded-2xl bg-yellow-500 px-4 py-3 font-black text-black active:scale-95 transition"
                >
                  {referralCopied ? "✓" : "Copy"}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Deposits below ₦500 do not qualify.
            </p>

            <button
              type="button"
              onClick={() => router.push("/referrals")}
              className="mt-4 w-full rounded-2xl border border-yellow-500/20 bg-yellow-500/10 py-3.5 text-sm font-bold text-yellow-400 active:scale-[0.98] transition"
            >
              Open Referral Center →
            </button>

          </div>
        </section>

        {/* Support */}
        <a
          href="https://wa.me/2348036879380?text=Hello%2C%20is%20anyone%20available%3F"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 flex items-center justify-between rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.06] p-5 active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              💬
            </div>

            <div>
              <p className="font-bold">
                Contact Support
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Need help? Chat with us
              </p>
            </div>
          </div>

          <span className="text-gray-500">
            →
          </span>
        </a>

        {/* Logout */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-3xl border border-red-500/10 bg-red-500/[0.05] py-4 text-sm font-bold text-red-400 transition hover:border-red-500/20 hover:bg-red-500/[0.08] active:scale-[0.98]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            ↪
          </span>
          <span>Log Out</span>
        </button>

        <p className="text-center text-[10px] text-gray-700 mt-7 tracking-widest uppercase">
          LOWKEY OTP • Digital Service Hub
        </p>

      </div>
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d121d] p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-400">
              ↪
            </div>

            <h2
              id="logout-title"
              className="mt-5 text-center text-xl font-black text-white"
            >
              Sign out of LOWKEY?
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-gray-400">
              You will need to sign in again to access your LOWKEY account.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-2xl bg-red-500 px-4 py-3 font-bold text-white transition hover:bg-red-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
