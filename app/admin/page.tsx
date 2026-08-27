"use client";

import { useState } from "react";

import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function AdminPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [popup, setPopup] = useState("");

  const sendNotification = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      setPopup("Please enter a notification message.");
      return;
    }

    try {
      setSending(true);
      setPopup("");

      await addDoc(
        collection(db, "notifications"),
        {
          message: cleanMessage,
          createdAt: serverTimestamp()
        }
      );

      setMessage("");
      setPopup("Notification sent successfully.");
    } catch (error) {
      console.error(
        "Notification error:",
        error
      );

      setPopup(
        "We couldn't send the notification. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
              <span className="text-xl font-bold text-primary">
                ✓
              </span>
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Lowkey OTP
            </h2>

            <p className="mb-6 text-sm leading-6 text-gray-600">
              {popup}
            </p>

            <button
              onClick={() => setPopup("")}
              className="w-full rounded-2xl bg-primary py-3 font-semibold text-white active:scale-95"
            >
              Okay
            </button>

          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl">

        <h1 className="mb-8 text-4xl font-bold text-primary">
          Admin Panel
        </h1>

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Send Notification
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            Send an announcement to users through the
            Lowkey OTP notification center.
          </p>

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Enter notification message..."
            rows={6}
            disabled={sending}
            className="mb-5 w-full rounded-2xl border border-gray-200 p-4 text-gray-900 outline-none transition focus:border-primary disabled:bg-gray-100"
          />

          <button
            onClick={sendNotification}
            disabled={
              sending ||
              !message.trim()
            }
            className="w-full rounded-2xl bg-primary py-4 font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : "Send Notification"}
          </button>

        </div>

      </div>
    </main>
  );
}
