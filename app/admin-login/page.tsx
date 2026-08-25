"use client";

import { useState } from "react";

export default function AdminLoginPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleLogin = () => {

    if (
      email === "lowkeyotp@gmail.com" &&
      password === "lowkey123"
    ) {

      window.location.href =
        "/admin-dashboard";

    } else {

      alert("Invalid Admin Credentials");

    }

  };

  return (

    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-md">

        <h1 className="text-3xl font-bold text-blue-600 text-center mb-8">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mb-5"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mb-6"
        />

        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white py-4 rounded-2xl font-bold w-full"
        >
          Login
        </button>

      </div>

    </main>

  );

}
