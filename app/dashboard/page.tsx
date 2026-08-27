"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Wallet,
  ShoppingCart,
  FileText,
  CreditCard,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);

  const [balance, setBalance] = useState(0);

  const [username, setUsername] = useState("");

  const [orders, setOrders] = useState(0);

  const [transactions, setTransactions] =
    useState(0);

  const [logoClicks, setLogoClicks] =
    useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const user = auth.currentUser;

      if (!user) {
        router.push("/login");
        return;
      }

      const snap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (snap.exists()) {
        const data = snap.data();

        setUsername(data.username || "User");
        setBalance(data.balance || 0);
      }
    };

    loadUser();
  }, [router]);

  const handleLogoClick = () => {
    const next = logoClicks + 1;

    setLogoClicks(next);

    if (next >= 7) {
      setLogoClicks(0);
      router.push("/admin-login");
    }

    setTimeout(() => {
      setLogoClicks(0);
    }, 5000);
  };

  const logout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const quickActions = [
    {
      title: "Buy Number",
      icon: ShoppingCart,
      route: "/buy-number",
    },
    {
      title: "Fund Wallet",
      icon: Wallet,
      route: "/fund-wallet",
    },
    {
      title: "Orders",
      icon: FileText,
      route: "/orders",
    },
    {
      title: "Transactions",
      icon: CreditCard,
      route: "/transactions",
    },
  ];
  return (
    <main className="min-h-screen bg-[#0f172a] text-white">

      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40">
          <div className="w-72 h-full bg-[#111827] p-6">

            <div
              onClick={handleLogoClick}
              className="cursor-pointer"
            >
              <h1 className="text-2xl font-bold text-primary">
                Lowkey OTP
              </h1>
            </div>

            <div className="mt-10 space-y-5">

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full flex justify-between items-center"
              >
                Dashboard
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => router.push("/buy-number")}
                className="w-full flex justify-between items-center"
              >
                Buy Number
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => router.push("/orders")}
                className="w-full flex justify-between items-center"
              >
                Orders
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => router.push("/transactions")}
                className="w-full flex justify-between items-center"
              >
                Transactions
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => router.push("/fund-wallet")}
                className="w-full flex justify-between items-center"
              >
                Fund Wallet
                <ChevronRight size={18} />
              </button>

              <button
                onClick={logout}
                className="w-full flex justify-between items-center text-red-400"
              >
                Logout
                <LogOut size={18} />
              </button>

            </div>

          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6 pt-8">

        <button
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={30} />
        </button>

        <div
          onClick={handleLogoClick}
          className="cursor-pointer"
        >
          <h1 className="text-xl font-bold text-primary">
            Lowkey OTP
          </h1>
        </div>

        <button
          onClick={() => router.push("/notifications")}
        >
          <Bell size={26} />
        </button>

      </div>
      <div className="px-6 mt-8">

        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary p-6">

          <p className="text-white/80">
            Wallet Balance
          </p>

          <h2 className="text-4xl font-bold mt-2">
            ₦{Number(balance).toLocaleString()}
          </h2>

          <p className="mt-2 text-white/80">
            Welcome back, {username}
          </p>

        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">

          <div className="bg-[#1e293b] rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Orders
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {orders}
            </h2>
          </div>

          <div className="bg-[#1e293b] rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Transactions
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {transactions}
            </h2>
          </div>

        </div>

        <h2 className="text-xl font-bold mt-10 mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-4">

          {quickActions.map((item) => {

            const Icon = item.icon;

            return (

              <button
                key={item.title}
                onClick={() => router.push(item.route)}
                className="bg-[#1e293b] rounded-3xl p-6 flex flex-col items-center active:scale-95 transition"
              >

                <Icon
                  size={34}
                  className="text-primary"
                />

                <span className="mt-4 font-semibold">
                  {item.title}
                </span>

              </button>

            );

          })}

        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-gray-800">

        <div className="grid grid-cols-4 py-4">

          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center text-primary"
          >
            <Wallet size={24} />
            <span className="text-xs mt-1">
              Home
            </span>
          </button>

          <button
            onClick={() => router.push("/buy-number")}
            className="flex flex-col items-center"
          >
            <ShoppingCart size={24} />
            <span className="text-xs mt-1">
              Buy
            </span>
          </button>

          <button
            onClick={() => router.push("/orders")}
            className="flex flex-col items-center"
          >
            <FileText size={24} />
            <span className="text-xs mt-1">
              Orders
            </span>
          </button>

          <button
            onClick={() => router.push("/fund-wallet")}
            className="flex flex-col items-center"
          >
            <User size={24} />
            <span className="text-xs mt-1">
              Wallet
            </span>
          </button>

        </div>

      </div>

    </main>
  );
}
