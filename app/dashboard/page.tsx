"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

import { auth, db } from "@/lib/firebase";

export default function DashboardPage() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          router.push("/login");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setBalance(Number(data.balance || 0));
        }
      } catch (error) {
        console.log("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-md mx-auto">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-blue-600">
            Dashboard
          </h1>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Wallet Balance
          </h2>

          <p className="text-4xl font-bold text-green-600 mt-4">
            ₦{balance.toLocaleString()}
          </p>
        </div>

        <div className="grid gap-5">

          <Link href="/buy-number">
            <button
              className="bg-blue-600 text-white py-5 rounded-3xl font-bold w-full"
            >
              Buy OTP Number
            </button>
          </Link>

          <button
            onClick={() => router.push("/fund-wallet")}
            className="bg-black text-white py-5 rounded-3xl font-bold w-full"
          >
            Fund Wallet
          </button>

          <button
            onClick={() => router.push("/transactions")}
            className="bg-green-600 text-white py-5 rounded-3xl font-bold w-full"
          >
            Transaction History
          </button>

          <button
            onClick={() => router.push("/orders")}
            className="bg-purple-600 text-white py-5 rounded-3xl font-bold w-full"
          >
            OTP Orders
          </button>

          <button
            onClick={() => router.push("/notifications")}
            className="bg-orange-500 text-white py-5 rounded-3xl font-bold w-full"
          >
            Notifications
          </button>

          <a
            href="https://wa.me/2348036879380?text=Hello%2C%20is%20anyone%20available%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-cyan-600 text-white py-5 rounded-3xl font-bold w-full text-center"
          >
            Contact Support
          </a>

          <button
            onClick={() => alert("Settings coming soon")}
            className="bg-gray-700 text-white py-5 rounded-3xl font-bold w-full"
          >
            Settings
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white py-5 rounded-3xl font-bold w-full"
          >
            Logout
          </button>

        </div>
      </div>
    </main>
  );
}
