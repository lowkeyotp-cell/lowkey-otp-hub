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
  className="rounded-[2rem] bg-[#111827] border border-cyan-400/20 p-6 shadow-xl"
>

             <div className="flex items-center justify-between mb-5">
  <div>
    <h2 className="text-2xl font-black text-white">
      {order.service || "Unknown Service"}
    </h2>

    <p className="text-cyan-300 mt-1">
      {order.country || "Unknown Country"}
    </p>
  </div>

  <span
    className={`px-4 py-2 rounded-full text-sm font-bold ${
      order.status === "completed"
        ? "bg-green-500/20 text-green-400"
        : "bg-yellow-500/20 text-yellow-400"
    }`}
  >
    {order.status === "completed"
      ? "Completed"
      : "Waiting"}
  </span>
</div>

<div className="space-y-4">

  <div>
    <p className="text-gray-400 text-sm">
      Phone Number
    </p>

    <p className="text-xl font-bold text-white">
      {order.number || "-----"}
    </p>
  </div>

  <div>
    <p className="text-gray-400 text-sm">
      OTP Code
    </p>

    <p className="text-3xl font-black tracking-[8px] text-cyan-300">
      {order.otp || "Waiting..."}
    </p>
  </div>

</div>

            </div>

          ))}

        </div>

      )}

    </main>

  );

}
