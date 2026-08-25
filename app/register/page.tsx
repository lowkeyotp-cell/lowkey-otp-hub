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
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const handleRegister = async () => {

    if (!username || !email || !password) {

      alert("Fill all fields");

      return;

    }

    try {

      setLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        userCredential.user;

await sendEmailVerification(user);

      await setDoc(
        doc(db, "users", user.uid),
        {
          username,
          email,
          balance: 0,
          createdAt:
            serverTimestamp()
        }
      );

      alert(
  "Account created successfully! A verification email has been sent. Please check your Inbox or Spam folder before logging in."
);

      router.push("/login");

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
          Create Account
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mb-5"
        />

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
          onClick={handleRegister}
          disabled={loading}
          className="bg-blue-600 text-white py-4 rounded-2xl font-bold w-full"
        >
          {loading
            ? "Creating..."
            : "Register"}
        </button>

      </div>

    </main>

  );

}
