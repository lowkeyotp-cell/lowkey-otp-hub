"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  signInWithEmailAndPassword
} from "firebase/auth";

import {
  doc,
  getDoc
} from "firebase/firestore";

import {
  auth,
  db
} from "@/lib/firebase";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const handleLogin = async () => {

    if (!email || !password) {

      alert("Fill all fields");

      return;

    }

    try {

      setLoading(true);

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        userCredential.user;

      const userRef =
        doc(db, "users", user.uid);

      const userSnap =
        await getDoc(userRef);

      if (userSnap.exists()) {

        const userData =
          userSnap.data();

        if (userData.banned === true) {

          alert(
            "Your account has been banned"
          );

          return;

        }

      }

      alert("Login Successful");

      router.push("/dashboard");

    } catch (error: any) {

      alert(error.message);

    } finally {

      setLoading(false);

    }

  };

  return (

    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-md">

        <h1 className="text-3xl font-bold text-blue-600 text-center mb-8">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mb-5"
        />

        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mb-5"
        />

        <button
          onClick={() =>
            setShowPassword(
              !showPassword
            )
          }
          className="mb-5 text-sm text-blue-600"
        >
          {showPassword
            ? "Hide Password"
            : "Show Password"}
        </button>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-600 text-white py-4 rounded-2xl font-bold w-full"
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

      </div>

    </main>

  );

}
