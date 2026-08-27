"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleRegister = async () => {
    if (!username || !email || !password) {
      showPopup(
        "Missing information",
        "Please fill in your username, email, and password.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      setPopup(null);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(
        doc(db, "users", user.uid),
        {
          username,
          email,
          balance: 0,
          createdAt: serverTimestamp(),
        }
      );

      showPopup(
        "Account created",
        "Your account has been created successfully. A verification email has been sent. Please check your Inbox or Spam folder before logging in.",
        "success"
      );

    } catch (error: any) {
      console.error("Registration error:", error);

      let message =
        "We couldn't create your account. Please try again.";

      if (error?.code === "auth/email-already-in-use") {
        message =
          "An account with this email already exists.";
      } else if (
        error?.code === "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      } else if (
        error?.code === "auth/weak-password"
      ) {
        message =
          "Your password is too weak. Please choose a stronger password.";
      } else if (error?.message) {
        message = error.message;
      }

      showPopup(
        "Registration failed",
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
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div
              className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
                popup.type === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <span className="text-2xl font-black">
                {popup.type === "success" ? "✓" : "!"}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              {popup.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {popup.message}
            </p>

            <button
              onClick={() => {
                setPopup(null);

                if (popup.type === "success") {
                  router.push("/login");
                }
              }}
              className="mt-6 w-full rounded-2xl bg-primary py-3.5 font-bold text-white transition active:scale-95"
            >
              Continue
            </button>

          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md">

        <div className="mb-8">

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md">
            <span className="text-xl font-black text-white">
              +
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Create Account
          </h1>

          <p className="mt-2 text-gray-500">
            Create your Lowkey OTP account.
          </p>

        </div>

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Username
        </label>

        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          disabled={loading}
          className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl mb-5 text-gray-900 outline-none transition focus:border-primary focus:bg-white disabled:opacity-60"
        />

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          disabled={loading}
          className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl mb-5 text-gray-900 outline-none transition focus:border-primary focus:bg-white disabled:opacity-60"
        />

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Password
        </label>

        <div className="relative mb-3">

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="Create password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            disabled={loading}
            className="w-full border border-gray-200 bg-gray-50 p-4 pr-20 rounded-2xl text-gray-900 outline-none transition focus:border-primary focus:bg-white disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary"
          >
            {showPassword ? "Hide" : "Show"}
          </button>

        </div>

        <p className="text-xs text-gray-400 mb-6">
          A verification email will be sent after registration.
        </p>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="bg-primary text-white py-4 rounded-2xl font-bold w-full shadow-md transition hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

      </div>

    </main>
  );
}
