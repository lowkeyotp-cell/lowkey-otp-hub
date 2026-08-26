k"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showPopup = (
    title: string,
    message: string,
    type: "success" | "error"
  ) => {
    setPopup({
      title,
      message,
      type,
    });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showPopup(
        "Missing information",
        "Please enter your email address and password.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const user = userCredential.user;

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData.banned === true) {
          showPopup(
            "Account restricted",
            "Your account has been banned. Please contact support if you believe this was a mistake.",
            "error"
          );

          return;
        }
      }

      showPopup(
        "Welcome back",
        "Login successful. Redirecting you to your dashboard...",
        "success"
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 900);

    } catch (error: any) {
      console.error("Login error:", error);

      let message =
        "We couldn't sign you in. Please check your details and try again.";

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        message =
          "The email or password you entered is incorrect.";
      } else if (
        error?.code ===
        "auth/user-not-found"
      ) {
        message =
          "No account was found with this email address.";
      } else if (
        error?.code ===
        "auth/wrong-password"
      ) {
        message =
          "The password you entered is incorrect.";
      } else if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        message =
          "Too many login attempts. Please wait a moment and try again.";
      } else if (
        error?.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Network connection failed. Please check your internet connection.";
      }

      showPopup(
        "Login unsuccessful",
        message,
        "error"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div
              className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
                popup.type === "success"
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              <span
                className={`text-2xl font-black ${
                  popup.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {popup.type === "success"
                  ? "✓"
                  : "!"}
              </span>
            </div>

            <h2
              id="popup-title"
              className="text-xl font-bold text-gray-900"
            >
              {popup.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {popup.message}
            </p>

            <button
              onClick={() => setPopup(null)}
              className={`mt-6 w-full rounded-2xl py-3.5 font-bold text-white transition active:scale-95 ${
                popup.type === "success"
                  ? "bg-green-600"
                  : "bg-blue-600"
              }`}
            >
              Continue
            </button>

          </div>
        </div>
      )}

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <span className="text-2xl font-black text-white">
              LO
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to your Lowkey OTP account
          </p>

        </div>

        <div className="space-y-5">

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <div className="relative">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 pr-20 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm font-semibold text-blue-600"
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Secure login powered by Lowkey OTP
        </p>

      </div>

    </main>
  );
}
