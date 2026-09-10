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

const [popup, setPopup] =
  useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

const [cancelling, setCancelling] =
  useState<string | null>(null);

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

const updatedData = await Promise.all(
  data.map(async (order: any) => {
    if (
      order.status === "waiting" &&
      order.orderId
    ) {
      try {
        const response = await fetch(
          "/api/otp",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              orderId: order.orderId,
            }),
          }
        );

        const result =
          await response.json();

        if (
          result.success &&
          result.code
        ) {
          return {
            ...order,
            otp: result.code,
            status: "completed",
          };
        }
      } catch (error) {
        console.log(
          "OTP refresh error:",
          error
        );
      }
    }

    return order;
  })
);

setOrders(updatedData);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }

    };

       loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

const cancelOrder = async (
  orderId: string | number
) => {
  if (!orderId) return;

  const user = auth.currentUser;

  if (!user) {
    setPopup({
      title: "Login Required",
      message:
        "Please log in again before cancelling this number.",
      type: "error",
    });
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to cancel this number? Your wallet will be refunded."
  );

  if (!confirmed) return;

  try {
    setCancelling(String(orderId));

        const idToken =
      await user.getIdToken();

    const response = await fetch(
      "/api/cancel-order",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          orderId,
        }),
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      setPopup({
        title:
          "Cancellation Failed",
        message:
          result.message ||
          "Unable to cancel this number.",
        type: "error",
      });

      return;
    }

localStorage.removeItem("activeOrder");

    setOrders((current) =>
      current.map((order) =>
        String(order.orderId) ===
        String(orderId)
          ? {
              ...order,
              status:
                "cancelled",
              refundAmount:
                result.refundAmount ??
                order.price,
            }
          : order
      )
    );

    setPopup({
      title:
        "Number Cancelled",
      message:
        `Your number was cancelled successfully and ₦${Number(
          result.refundAmount ?? 0
        ).toLocaleString()} has been refunded to your wallet.`,
      type: "success",
    });

  } catch (error) {
    console.error(
      "Cancel request error:",
      error
    );

    setPopup({
      title:
        "Network Error",
      message:
        "We couldn't complete the cancellation. Please try again.",
      type: "error",
    });

  } finally {
    setCancelling(null);
  }
};           
 return (

    <>
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#111827] border border-cyan-400/20 p-6 shadow-2xl">

            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                popup.type === "success"
                  ? "bg-green-500/20"
                  : "bg-red-500/20"
              }`}
            >
              <span
                className={`text-2xl font-black ${
                  popup.type === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {popup.type === "success" ? "✓" : "!"}
              </span>
            </div>

            <h2 className="text-center text-2xl font-black text-white">
              {popup.title}
            </h2>

            <p className="mt-3 text-center text-gray-300">
              {popup.message}
            </p>

            <button
              onClick={() => setPopup(null)}
              className="mt-6 w-full rounded-2xl bg-cyan-500 py-3 font-bold text-white"
            >
              Continue
            </button>

          </div>
        </div>
      )}

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
    : order.status === "cancelled"
    ? "bg-red-500/20 text-red-400"
    : "bg-yellow-500/20 text-yellow-400"
}`}
  >
   {order.status === "completed"
  ? "Completed"
  : order.status === "cancelled"
  ? "Cancelled"
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

  {order.status === "waiting" && (
    <button
      onClick={() => cancelOrder(order.orderId)}
      className="mt-4 w-full rounded-2xl bg-red-600 py-3 text-white font-bold"
    >
      Cancel Number
    </button>
  )}

</div>

</div>

          ))}

        </div>

      )}

        </main>

    </>

  );

}
