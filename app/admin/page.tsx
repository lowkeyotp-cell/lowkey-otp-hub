"use client";

import { useState } from "react";

import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function AdminPage() {

  const [message, setMessage] =
    useState("");

  const sendNotification = async () => {

    if (!message) return;

    await addDoc(
      collection(db, "notifications"),
      {
        message,
        createdAt: serverTimestamp()
      }
    );

    alert("Notification Sent");

    setMessage("");

  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        Admin Panel
      </h1>

      <div className="bg-white p-6 rounded-3xl shadow-sm">

        <textarea
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Enter notification"
          className="w-full border p-4 rounded-2xl mb-5"
        />

        <button
          onClick={sendNotification}
          className="bg-blue-600 text-white py-4 px-6 rounded-2xl font-bold"
        >
          Send Notification
        </button>

      </div>

    </main>
  );
}
