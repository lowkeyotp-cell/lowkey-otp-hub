"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {

  const [adminTap, setAdminTap] =
    useState(0);

  const handleAdminTap = () => {

    const newTap = adminTap + 1;

    setAdminTap(newTap);

    if (newTap >= 7) {

      window.location.href =
        "/admin-login";

    }

  };

  return (

    <main className="min-h-screen bg-gray-100 text-center">

      <nav className="flex items-center justify-between px-6 py-5 bg-white shadow-sm">

        <h1
          onClick={handleAdminTap}
          className="text-2xl font-bold text-blue-600 cursor-pointer"
        >
          Lowkey OTP
        </h1>

        <button className="text-3xl">
          ☰
        </button>

      </nav>

      <section className="px-6 py-20">

        <h2 className="text-5xl font-bold text-gray-900 leading-tight">
          Buy OTP Numbers <br /> Instantly
        </h2>

        <p className="text-gray-600 mt-6 text-lg">
          Fast, Secure & Reliable OTP Marketplace
        </p>

        <div className="mt-10 flex flex-col gap-5">

          <Link href="/login">

            <button className="bg-blue-600 text-white py-4 rounded-2xl font-bold w-full">
              Login
            </button>

          </Link>

          <Link href="/register">

            <button className="bg-black text-white py-4 rounded-2xl font-bold w-full">
              Create Account
            </button>

          </Link>

        </div>

      </section>

    </main>

  );

}
