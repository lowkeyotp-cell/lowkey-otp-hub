"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  orderBy,
  query,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function NotificationsPage() {

  const [notifications, setNotifications] =
    useState<any[]>([]);

  useEffect(() => {

    const loadNotifications = async () => {

      const q = query(
        collection(db, "notifications"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {

        await addDoc(
          collection(db, "notifications"),
          {
            message:
              "Welcome to Lowkey OTP Marketplace 🎉",
            createdAt:
              serverTimestamp()
          }
        );

      }

      const newSnapshot = await getDocs(q);

      const data = newSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data()
        })
      );

      setNotifications(data);

    };

    loadNotifications();

  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        Notifications
      </h1>

      <div className="grid gap-4">

        {notifications.map((item) => (

          <div
            key={item.id}
            className="bg-white p-5 rounded-3xl shadow-sm"
          >

            <p className="font-bold text-lg text-gray-900">
              {item.message}
            </p>

            <p className="text-gray-500 mt-3 text-sm">
              {item.createdAt?.seconds
                ? new Date(
                    item.createdAt.seconds * 1000
                  ).toLocaleString()
                : "Just now"}
            </p>

          </div>

        ))}

      </div>

    </main>
  );
}
