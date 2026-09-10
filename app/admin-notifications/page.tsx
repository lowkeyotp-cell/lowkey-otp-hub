"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Notification = {
  id: string;
  message: string;
  pinned?: boolean;
  createdAt?: any;
};

export default function AdminNotificationsPage() {
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] =
    useState<Notification[]>([]);
  const [search, setSearch] = useState("");
  const [popup, setPopup] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      setNotifications(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<
            Notification,
            "id"
          >),
        }))
      );
    });
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) =>
      item.message
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [notifications, search]);

  async function sendNotification() {
    const text = message.trim();

    if (!text) {
      setPopup("Please enter a notification.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(
        collection(db, "notifications"),
        {
          message: text,
          pinned: false,
          createdAt: serverTimestamp(),
        }
      );

      setMessage("");
      setPopup("Notification sent successfully.");
    } catch (error) {
      console.error(error);

      setPopup(
        "Failed to send notification."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(
    id: string,
    pinned: boolean
  ) {
    await updateDoc(
      doc(db, "notifications", id),
      {
        pinned: !pinned,
      }
    );
  }

  async function removeNotification(
    id: string
  ) {
    if (
      !confirm(
        "Delete this notification?"
      )
    ) {
      return;
    }

    await deleteDoc(
      doc(db, "notifications", id)
    );

    setPopup("Notification deleted.");
  }
  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl">
                🔔
              </span>
            </div>

            <h2 className="text-2xl font-black text-gray-900">
              Lowkey OTP
            </h2>

            <p className="mt-3 text-gray-600">
              {popup}
            </p>

            <button
              onClick={() => setPopup("")}
              className="mt-6 w-full rounded-2xl bg-primary py-3 font-bold text-white"
            >
              Okay
            </button>

          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">

        <h1 className="mb-8 text-4xl font-black text-primary">
          Notification Center
        </h1>

        <div className="mb-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Notifications
            </p>

            <p className="mt-2 text-4xl font-black">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Pinned
            </p>

            <p className="mt-2 text-4xl font-black">
              {
                notifications.filter(
                  (n) => n.pinned
                ).length
              }
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Search Results
            </p>

            <p className="mt-2 text-4xl font-black">
              {filteredNotifications.length}
            </p>
          </div>

        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-2xl font-bold">
            Send Notification
          </h2>

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            rows={5}
            placeholder="Write notification..."
            className="mt-5 w-full rounded-2xl border p-4 outline-none"
          />

          <button
            onClick={sendNotification}
            disabled={saving}
            className="mt-5 rounded-2xl bg-primary px-8 py-3 font-bold text-white disabled:opacity-50"
          >
            {saving
              ? "Sending..."
              : "Send Notification"}
          </button>

        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search notifications..."
            className="mb-6 w-full rounded-2xl border p-4 outline-none"
          />

          <div className="space-y-4">

            {filteredNotifications.length === 0 && (
              <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
                No notifications found.
              </div>
            )}

            {filteredNotifications.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border p-5"
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="font-semibold text-gray-900">
                      {item.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {item.pinned
                        ? "📌 Pinned"
                        : "Regular Notification"}
                    </p>

                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        togglePin(
                          item.id,
                          !!item.pinned
                        )
                      }
                      className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold"
                    >
                      {item.pinned
                        ? "Unpin"
                        : "Pin"}
                    </button>

                    <button
                      onClick={() =>
                        removeNotification(
                          item.id
                        )
                      }
                      className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>
  );
}
