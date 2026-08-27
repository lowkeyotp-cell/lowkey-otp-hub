"use client";

import {
  useEffect,
  useState
} from "react";

import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";

import {
  auth,
  db
} from "@/lib/firebase";

export default function OrdersPage() {

  const [orders, setOrders] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const loadOrders =
      async () => {

      try {

        const user =
          auth.currentUser;

        if (!user) return;

        const q = query(
          collection(db, "orders"),
          where(
            "uid",
            "==",
            user.uid
          )
        );

        const snapshot =
          await getDocs(q);

        const data =
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

        setOrders(data);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }

    };

    loadOrders();

  }, []);

  return (

    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-primary mb-8">
        OTP Orders
      </h1>

      {loading ? (

        <p>Loading orders...</p>

      ) : orders.length === 0 ? (

        <div className="bg-white p-6 rounded-3xl shadow-sm">

          <p>No OTP orders yet</p>

        </div>

      ) : (

        <div className="grid gap-4">

          {orders.map((order) => (

            <div
              key={order.id}
              className="bg-white p-6 rounded-3xl shadow-sm"
            >

              <p className="font-bold text-lg">
                {order.service || "Unknown Service"}
              </p>

              <p className="mt-2">
                Number:
                {order.number || "N/A"}
              </p>

              <p className="mt-2">
                Country:
                {order.country || "N/A"}
              </p>

              <p className="mt-2">
                OTP:
                {order.otp || "Waiting..."}
              </p>

              <p className="mt-2 font-bold">
                Status:
                {order.status || "Pending"}
              </p>

            </div>

          ))}

        </div>

      )}

    </main>

  );

}
