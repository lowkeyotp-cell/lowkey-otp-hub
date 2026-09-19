"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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
  const [resettingPassword, setResettingPassword] =
    useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  const [showUsageNotice, setShowUsageNotice] =
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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showPopup(
        "Enter your email",
        "Please enter your email address first so we can send you a password reset link.",
        "error"
      );
      return;
    }

    try {
      setResettingPassword(true);

      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      showPopup(
        "Reset email sent",
        "Check your email for a password reset link. If you don't see it, check your spam or junk folder.",
        "success"
      );
    } catch (error: any) {
      console.error(
        "Password reset error:",
        error
      );

      let message =
        "We couldn't send the password reset email. Please try again.";

      if (
        error?.code ===
        "auth/user-not-found"
      ) {
        message =
          "No account was found with this email address.";
      } else if (
        error?.code ===
        "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      } else if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        message =
          "Too many reset attempts. Please wait a moment and try again.";
      } else if (
        error?.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Network connection failed. Please check your internet connection.";
      }

      showPopup(
        "Password reset failed",
        message,
        "error"
      );
    } finally {
      setResettingPassword(false);
    }
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

      setShowUsageNotice(true);

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

      {showUsageNotice && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="usage-notice-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-violet-500/20 bg-[#0d0915] shadow-2xl shadow-violet-950/40">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-300">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <h2
                id="usage-notice-title"
                className="text-xl font-black text-white"
              >
                Responsible Use Notice
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Please use LOWKEY OTP HUB and all services available on the
                platform only for legitimate and lawful purposes.
              </p>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-white/70">
                Any numbers, verification services, marketplace products,
                or other services purchased through this platform should be
                used responsibly and in accordance with applicable laws and
                the terms of the services you use.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowUsageNotice(false);
                  router.push("/dashboard");
                }}
                className="mt-6 w-full rounded-2xl bg-violet-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-500"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}

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
                  : "bg-primary"
              }`}
            >
              Continue
            </button>

          </div>
        </div>
      )}

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
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
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 outline-none transition focus:border-primary focus:bg-white disabled:opacity-60"
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
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 pr-20 text-gray-900 outline-none transition focus:border-primary focus:bg-white disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm font-semibold text-primary"
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading || resettingPassword}
              className="text-sm font-semibold text-primary transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resettingPassword
                ? "Sending reset link..."
                : "Forgot password?"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-primary py-4 font-bold text-white shadow-md transition hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
