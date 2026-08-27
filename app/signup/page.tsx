"use client";

import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
} from "firebase/auth";

import { app } from "@/lib/firebase";

const auth = getAuth(app);

export default function SignupPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await sendEmailVerification(
        userCredential.user
      );

      alert(
        "Verification email sent! Please check your inbox or spam folder."
      );

    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">

      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md">

        <h1 className="text-4xl font-bold text-center text-primary mb-2">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Join OTP Marketplace today
        </p>

        <div className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Email address"
            className="border border-gray-300 p-4 rounded-xl"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 p-4 rounded-xl"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            onClick={handleSignup}
            className="bg-primary text-white py-4 rounded-xl font-semibold"
          >
            Sign Up
          </button>

        </div>

      </div>

    </main>
  );
}
