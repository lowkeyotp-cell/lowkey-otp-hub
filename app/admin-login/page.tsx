"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const provider =
        new GoogleAuthProvider();

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      const user = result.user;

      if (
        user.uid !==
        "KSXJJqnu3FhuFcTye2lRlxxct6r2"
      ) {
        await auth.signOut();

        alert(
          "This Google account is not authorized as an admin."
        );

        return;
      }

      router.push("/admin-dashboard");

    } catch (error) {
      console.error(
        "Admin Google login error:",
        error
      );

      alert(
        "Google sign-in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-md">

        <h1 className="text-3xl font-bold text-primary text-center mb-3">
          Admin Login
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Sign in with your authorized Google account.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold disabled:opacity-50"
        >
          {loading
            ? "Signing in..."
            : "Continue with Google"}
        </button>

      </div>

    </main>
  );
}
