"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [adminTap, setAdminTap] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAdminTap = () => {
    const newTap = adminTap + 1;
    setAdminTap(newTap);

    if (newTap >= 7) {
      window.location.href = "/admin-login";
    }

    setTimeout(() => {
      setAdminTap(0);
    }, 5000);
  };

  return (
    <main className="min-h-screen bg-[#07111f] text-white overflow-hidden">

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-5 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">

        <button
          onClick={handleAdminTap}
          className="text-left active:scale-95 transition"
        >
          <div className="text-2xl font-black tracking-tight">
            Lowkey <span className="text-primary">OTP</span>
          </div>

          <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
            Marketplace
          </div>
        </button>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <Link href="/" className="hover:text-primary transition">
            Home
          </Link>

          <Link href="/buy-number" className="hover:text-primary transition">
            Buy Number
          </Link>

          <Link href="/fund-wallet" className="hover:text-primary transition">
            Fund Wallet
          </Link>

          <Link href="/notifications" className="hover:text-primary transition">
            Notifications
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-2xl w-11 h-11 rounded-2xl bg-white/5 border border-white/10"
        >
          {menuOpen ? "×" : "☰"}
        </button>

      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="relative z-30 md:hidden px-5 py-4 bg-[#0b1728] border-b border-white/10">

          <div className="flex flex-col gap-2">

            <Link
              href="/buy-number"
              className="p-4 rounded-2xl bg-white/5"
            >
              Buy Number
            </Link>

            <Link
              href="/fund-wallet"
              className="p-4 rounded-2xl bg-white/5"
            >
              Fund Wallet
            </Link>

            <Link
              href="/notifications"
              className="p-4 rounded-2xl bg-white/5"
            >
              Notifications
            </Link>

          </div>

        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 px-5 sm:px-8 pt-16 sm:pt-24 pb-20">

        <div className="max-w-5xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-sm mb-7">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            OTP Marketplace
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.95]">
            Get Your OTP
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary">
              Number Instantly.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mt-7 text-gray-400 text-lg sm:text-xl leading-relaxed">
            Buy temporary numbers for supported services,
            receive verification codes and manage everything
            from one simple wallet.
          </p>

          {/* Buttons */}
          <div className="max-w-md mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Link href="/register">
              <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary text-[#03101d] font-black shadow-xl shadow-primary/10 active:scale-95 transition">
                Create Account
              </button>
            </Link>

            <Link href="/login">
              <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 active:scale-95 transition">
                Login
              </button>
            </Link>

          </div>

          {/* Trust */}
          <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm text-gray-500">
            <span>✓ Secure Wallet</span>
            <span>✓ Live Pricing</span>
            <span>✓ Fast OTP</span>
          </div>

        </div>

      </section>

      {/* Feature cards */}
      <section className="relative z-10 px-5 sm:px-8 pb-20">

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">

          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-7 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl mb-5">
              ₦
            </div>

            <h2 className="text-xl font-bold">
              Simple Wallet
            </h2>

            <p className="text-gray-500 mt-3 leading-relaxed">
              Fund your wallet securely and use your
              balance whenever you need an OTP number.
            </p>
          </div>

          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-7 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl mb-5">
              ⚡
            </div>

            <h2 className="text-xl font-bold">
              Fast Delivery
            </h2>

            <p className="text-gray-500 mt-3 leading-relaxed">
              Choose your country and service,
              purchase a number and receive the OTP.
            </p>
          </div>

          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-7 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl mb-5">
              🔐
            </div>

            <h2 className="text-xl font-bold">
              Built For Developers
            </h2>

            <p className="text-gray-500 mt-3 leading-relaxed">
              A clean marketplace experience for
              verification and testing workflows.
            </p>
          </div>

        </div>

      </section>

      {/* How it works */}
      <section className="relative z-10 px-5 sm:px-8 py-20 border-y border-white/10 bg-white/[0.02]">

        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12">

            <p className="text-primary text-sm font-bold uppercase tracking-widest">
              How it works
            </p>

            <h2 className="text-3xl sm:text-4xl font-black mt-3">
              Get started in three steps
            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-[#0b1728] border border-white/10 rounded-3xl p-7">
              <span className="text-5xl font-black text-white/10">
                01
              </span>

              <h3 className="text-xl font-bold mt-5">
                Create an account
              </h3>

              <p className="text-gray-500 mt-3">
                Register and verify your email to access
                your marketplace dashboard.
              </p>
            </div>

            <div className="bg-[#0b1728] border border-white/10 rounded-3xl p-7">
              <span className="text-5xl font-black text-white/10">
                02
              </span>

              <h3 className="text-xl font-bold mt-5">
                Fund your wallet
              </h3>

              <p className="text-gray-500 mt-3">
                Add funds securely and keep your balance
                ready for purchases.
              </p>
            </div>

            <div className="bg-[#0b1728] border border-white/10 rounded-3xl p-7">
              <span className="text-5xl font-black text-white/10">
                03
              </span>

              <h3 className="text-xl font-bold mt-5">
                Buy your number
              </h3>

              <p className="text-gray-500 mt-3">
                Select a country and supported service,
                then receive your verification code.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="relative z-10 px-5 sm:px-8 py-20">

        <div className="max-w-4xl mx-auto rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/10 p-8 sm:p-12 text-center">

          <h2 className="text-3xl sm:text-5xl font-black">
            Ready to get started?
          </h2>

          <p className="text-gray-400 mt-4">
            Create your account and start using Lowkey OTP.
          </p>

          <Link href="/register">
            <button className="mt-8 px-8 py-4 rounded-2xl bg-white text-black font-black active:scale-95 transition">
              Get Started
            </button>
          </Link>

        </div>

      </section>

      {/* Contact */}
      <section className="relative z-10 px-5 pb-20 text-center">

        <p className="text-gray-500 text-sm mb-3">
          Need help?
        </p>

        <a
          href="https://wa.me/2347038167338"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold hover:bg-green-500/20 transition"
        >
          <span className="text-xl">💬</span>
          Chat on WhatsApp
        </a>

      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-5 py-8 text-center">

        <button
          onClick={handleAdminTap}
          className="font-bold text-gray-400"
        >
          Lowkey <span className="text-primary">OTP</span>
        </button>

        <p className="text-gray-600 text-xs mt-2">
          Secure OTP marketplace
        </p>

      </footer>

    </main>
  );
}
