"use client";

import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type ServiceData = {
  country: string;
  serviceName: string;
  serviceId: string | number;
  pool?: string | number;
  livePrice?: number;
  costPrice?: number;
  margin?: number;
};

export default function ServicePage() {
  const [serviceData, setServiceData] =
    useState<ServiceData | null>(null);

  const [buying, setBuying] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    const loadService = async () => {
      try {
        const stored =
          localStorage.getItem("selectedService");

        if (!stored) {
          setPopup({
            title: "Service Unavailable",
            message:
              "We couldn't load the selected service. Please go back and select it again.",
            type: "error",
          });
          return;
        }

        const selected = JSON.parse(stored);

        console.log("Selected Service:", selected);

        const response = await fetch("/api/pricing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            country: selected.country,
            service: selected.serviceId,
            pool: selected.pool,
          }),
          cache: "no-store",
        });

        const price = await response.json();

        console.log("Pricing result:", price);

        if (!response.ok || !price.success) {
          setServiceData({
            ...selected,
            livePrice: undefined,
          });
          return;
        }

        setServiceData({
          ...selected,
          livePrice: Number(price.price),
          costPrice: Number(price.costPrice),
          margin: Number(price.margin),
          pool: price.pool,
        });
      } catch (error) {
        console.error("Pricing error:", error);

        setPopup({
          title: "Unable to Load Service",
          message:
            "We couldn't load the service information right now. Please try again later.",
          type: "error",
        });
      }
    };

    loadService();
  }, []);

  const loadWalletBalance = async () => {
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      const data = userSnap.data();

      const balance = Number(data.balance || 0);

      setWalletBalance(balance);

      return balance;
    } catch (error) {
      console.error("Wallet balance error:", error);
      return null;
    }
  };

  const handleBuyNumber = async () => {
    if (buying) return;

    const user = auth.currentUser;

    if (!user) {
      setPopup({
        title: "Login Required",
        message:
          "Please log in to your account before purchasing a number.",
        type: "info",
      });
      return;
    }

    if (!serviceData) {
      setPopup({
        title: "Please Wait",
        message:
          "Service information is still loading. Please try again in a moment.",
        type: "info",
      });
      return;
    }

    if (!serviceData.serviceId) {
      setPopup({
        title: "Service Error",
        message:
          "This service could not be identified. Please select the service again.",
        type: "error",
      });
      return;
    }

    if (
      serviceData.pool === undefined ||
      serviceData.pool === null ||
      serviceData.pool === ""
    ) {
      setPopup({
        title: "Service Unavailable",
        message:
          "This number pool is currently unavailable. Please try another service.",
        type: "error",
      });
      return;
    }

    const price = Number(serviceData.livePrice);

    if (!Number.isFinite(price) || price <= 0) {
      setPopup({
        title: "Price Unavailable",
        message:
          "The current price could not be loaded. Please try again later.",
        type: "error",
      });
      return;
    }

    try {
      setBuying(true);

      /*
       * Check the customer's wallet balance first.
       */
      const balance = await loadWalletBalance();

      if (balance === null) {
        setPopup({
          title: "Wallet Unavailable",
          message:
            "We couldn't verify your wallet balance. Please try again.",
          type: "error",
        });
        return;
      }

      /*
       * Do not allow a purchase when the wallet
       * does not have enough money.
       */
      if (balance < price) {
        setPopup({
          title: "Insufficient Balance",
          message:
            `Your wallet balance is ₦${Math.floor(
              balance
            ).toLocaleString()}, but this number costs ₦${Math.ceil(
              price
            ).toLocaleString()}. Please fund your wallet and try again.`,
          type: "error",
        });
        return;
      }

      console.log("Starting purchase:", {
        country: serviceData.country,
        service: serviceData.serviceId,
        pool: serviceData.pool,
        price,
        walletBalance: balance,
      });

      const idToken = await getIdToken(user, true);

      const response = await fetch(
        "/api/buy-number",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            country: serviceData.country,
            service: serviceData.serviceId,
            pool: serviceData.pool,
          }),
          cache: "no-store",
        }
      );

      const result = await response.json();

      console.log("Buy Number result:", result);

      if (!response.ok || !result.success) {
        setPopup({
          title: "Purchase Unavailable",
          message:
            result.message ||
            "We couldn't complete your purchase right now. Please try again later.",
          type: "error",
        });
        return;
      }

      setPopup({
        title: "Number Purchased",
        message:
          `Your number ${result.number || ""} has been purchased successfully.`,
        type: "success",
      });

      /*
       * Refresh the displayed wallet balance.
       */
      await loadWalletBalance();
    } catch (error) {
      console.error("Buy Number error:", error);

      setPopup({
        title: "Purchase Failed",
        message:
          "Something went wrong while processing your purchase. Please try again.",
        type: "error",
      });
    } finally {
      setBuying(false);
    }
  };

  const closePopup = () => {
    setPopup(null);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-lg p-6">

        <h1 className="text-3xl font-bold text-blue-600 mb-6">
          Service Details
        </h1>

        <div className="space-y-5">

          <div>
            <p className="text-gray-500 text-sm">
              Country
            </p>

            <h2 className="text-xl font-semibold text-gray-900">
              {serviceData?.country || "Loading..."}
            </h2>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Service
            </p>

            <h2 className="text-xl font-semibold text-gray-900">
              {serviceData?.serviceName || "Loading..."}
            </h2>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Price
            </p>

            <h2 className="text-2xl font-bold text-green-600">
              {serviceData?.livePrice
                ? `₦${Math.ceil(
                    Number(serviceData.livePrice)
                  ).toLocaleString()}`
                : "Loading..."}
            </h2>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Wallet Balance
            </p>

            <h2 className="text-xl font-bold text-gray-900">
              {walletBalance !== null
                ? `₦${Math.floor(
                    walletBalance
                  ).toLocaleString()}`
                : "—"}
            </h2>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Status
            </p>

            <span className="text-green-600 font-semibold">
              ● Available
            </span>
          </div>

        </div>

        <button
          onClick={handleBuyNumber}
          disabled={buying || !serviceData}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buying
            ? "Processing..."
            : "Buy Number"}
        </button>

      </div>

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
          onClick={closePopup}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >

            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${
                popup.type === "success"
                  ? "bg-green-100"
                  : popup.type === "info"
                  ? "bg-blue-100"
                  : "bg-red-100"
              }`}
            >
              <span
                className={`text-2xl font-bold ${
                  popup.type === "success"
                    ? "text-green-600"
                    : popup.type === "info"
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {popup.type === "success"
                  ? "✓"
                  : popup.type === "info"
                  ? "i"
                  : "!"}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {popup.title}
            </h2>

            <p className="text-gray-600 leading-6">
              {popup.message}
            </p>

            <button
              onClick={closePopup}
              className="w-full mt-6 bg-gray-900 text-white py-3.5 rounded-2xl font-bold hover:bg-black transition"
            >
              Continue
            </button>

          </div>
        </div>
      )}

    </main>
  );
}
