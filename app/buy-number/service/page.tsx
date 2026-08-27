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

type PopupType = "success" | "error" | "info";

export default function ServicePage() {
  const [serviceData, setServiceData] =
    useState<ServiceData | null>(null);

  const [walletBalance, setWalletBalance] =
    useState<number | null>(null);

  const [buying, setBuying] =
    useState(false);

  const [checkingOtp, setCheckingOtp] =
    useState(false);

  const [order, setOrder] = useState<{
    number: string;
    orderId: string | number;
  } | null>(null);

  const [otp, setOtp] =
    useState<string | null>(null);

  const [otpMessage, setOtpMessage] =
    useState("");

  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: PopupType;
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
              "We couldn't load the selected service. Please return and select a service again.",
            type: "error",
          });

          return;
        }

        const selected =
          JSON.parse(stored);

        const response =
          await fetch("/api/pricing", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              country: selected.country,
              service: selected.serviceId,
              pool: selected.pool,
            }),
            cache: "no-store",
          });

        const price =
          await response.json();

        if (
          !response.ok ||
          !price.success
        ) {
          setServiceData({
            ...selected,
            livePrice: undefined,
          });

          return;
        }

        setServiceData({
          ...selected,
          livePrice:
            Number(price.price),
          costPrice:
            Number(price.costPrice),
          margin:
            Number(price.margin),
          pool: price.pool,
        });
      } catch (error) {
        console.error(
          "Pricing error:",
          error
        );

        setPopup({
          title: "Unable to Load",
          message:
            "We couldn't load this service right now. Please try again later.",
          type: "error",
        });
      }
    };

    loadService();
  }, []);

  useEffect(() => {
    const loadWallet = async () => {
      const user =
        auth.currentUser;

      if (!user) return;

      try {
        const snapshot =
          await getDoc(
            doc(
              db,
              "users",
              user.uid
            )
          );

        if (!snapshot.exists())
          return;

        const data =
          snapshot.data();

        setWalletBalance(
          Number(data.balance || 0)
        );
      } catch (error) {
        console.error(
          "Wallet error:",
          error
        );
      }
    };

    loadWallet();
  }, []);

  const refreshWallet =
    async () => {
      const user =
        auth.currentUser;

      if (!user) return null;

      try {
        const snapshot =
          await getDoc(
            doc(
              db,
              "users",
              user.uid
            )
          );

        if (!snapshot.exists())
          return null;

        const data =
          snapshot.data();

        const balance =
          Number(data.balance || 0);

        setWalletBalance(balance);

        return balance;
      } catch (error) {
        console.error(
          "Wallet refresh error:",
          error
        );

        return null;
      }
    };

  const handleBuyNumber =
    async () => {
      if (buying) return;

      const user =
        auth.currentUser;

      if (!user) {
        setPopup({
          title: "Login Required",
          message:
            "Please log in before purchasing an OTP number.",
          type: "info",
        });

        return;
      }

      if (!serviceData) {
        setPopup({
          title: "Please Wait",
          message:
            "The service is still loading.",
          type: "info",
        });

        return;
      }

      const price =
        Number(
          serviceData.livePrice
        );

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        setPopup({
          title: "Price Unavailable",
          message:
            "The current service price could not be loaded.",
          type: "error",
        });

        return;
      }

      if (
        serviceData.pool ===
          undefined ||
        serviceData.pool === null ||
        serviceData.pool === ""
      ) {
        setPopup({
          title: "Unavailable",
          message:
            "This number pool is currently unavailable.",
          type: "error",
        });

        return;
      }

      try {
        setBuying(true);

        const balance =
          await refreshWallet();

        if (balance === null) {
          setPopup({
            title: "Wallet Error",
            message:
              "We couldn't verify your wallet balance.",
            type: "error",
          });

          return;
        }

        if (balance < price) {
          setPopup({
            title: "Insufficient Balance",
            message:
              `You have ₦${Math.floor(
                balance
              ).toLocaleString()} available, but this number costs ₦${Math.ceil(
                price
              ).toLocaleString()}.`,
            type: "error",
          });

          return;
        }

        const token =
          await getIdToken(
            user,
            true
          );

        const response =
          await fetch(
            "/api/buy-number",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify({
                country:
                  serviceData.country,
                service:
                  serviceData.serviceId,
                pool:
                  serviceData.pool,
              }),
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          setPopup({
            title: "Purchase Unavailable",
            message:
              result.message ||
              "This number is currently unavailable.",
            type: "error",
          });

          return;
        }

        setOrder({
          number:
            String(
              result.number || ""
            ),
          orderId:
            result.orderId,
        });

        setOtp(null);
        setOtpMessage(
          "Waiting for verification code..."
        );

        setPopup({
          title: "Number Purchased",
          message:
            "Your number is ready. We're now waiting for the verification code.",
          type: "success",
        });

        await refreshWallet();

        checkOtp(
          result.orderId
        );
      } catch (error) {
        console.error(
          "Purchase error:",
          error
        );

        setPopup({
          title: "Purchase Failed",
          message:
            "Something went wrong while processing your purchase.",
          type: "error",
        });
      } finally {
        setBuying(false);
      }
    };

  const checkOtp =
    async (
      orderId: string | number
    ) => {
      if (checkingOtp) return;

      try {
        setCheckingOtp(true);

        const started =
          Date.now();

        const timeout =
          5 * 60 * 1000;

        while (
          Date.now() - started <
          timeout
        ) {
          try {
            const response =
              await fetch(
                "/api/otp",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    orderId,
                  }),
                  cache: "no-store",
                }
              );

            const data =
              await response.json();

            if (
              data.success &&
              data.code
            ) {
              setOtp(
                String(data.code)
              );

              setOtpMessage(
                "Verification code received."
              );

              return;
            }

            if (
              data.fullMessage
            ) {
              setOtpMessage(
                "Waiting for SMS..."
              );
            }
          } catch (error) {
            console.error(
              "OTP polling error:",
              error
            );
          }

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                5000
              )
          );
        }

        setOtpMessage(
          "No verification code received yet. You can check the order again later."
        );
      } finally {
        setCheckingOtp(false);
      }
    };

  const closePopup =
    () => {
      setPopup(null);
    };

  return (
    <main className="min-h-screen bg-[#07111f] text-white px-4 py-6">

      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">

          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em]">
              Lowkey OTP
            </p>

            <h1 className="text-3xl font-black mt-1">
              {order
                ? "Your OTP"
                : "Buy Number"}
            </h1>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-gray-500 uppercase">
              Wallet
            </p>

            <p className="font-bold text-sm">
              {walletBalance !== null
                ? `₦${Math.floor(
                    walletBalance
                  ).toLocaleString()}`
                : "—"}
            </p>
          </div>

        </div>

        {/* OTP result */}
        {order ? (
          <div className="space-y-5">

            <div className="rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 p-7">

              <p className="text-gray-400 text-sm">
                Your number
              </p>

              <h2 className="text-3xl font-black mt-2 tracking-wide">
                {order.number}
              </h2>

              <div className="mt-6 h-px bg-white/10" />

              <p className="text-gray-400 text-sm mt-5">
                Verification code
              </p>

              {otp ? (
                <div className="mt-3 text-center">

                  <div className="rounded-2xl bg-black/30 border border-primary/20 py-6">

                    <p className="text-5xl font-black tracking-[0.3em] text-primary-light">
                      {otp}
                    </p>

                  </div>

                  <p className="text-green-400 text-sm font-semibold mt-4">
                    ✓ Code received
                  </p>

                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-white/5 p-5 text-center">

                  <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />

                  <p className="text-gray-300 mt-4 font-semibold">
                    Waiting for SMS
                  </p>

                  <p className="text-gray-500 text-sm mt-2">
                    {otpMessage}
                  </p>

                </div>
              )}

            </div>

            <button
              onClick={() =>
                checkOtp(order.orderId)
              }
              disabled={checkingOtp}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-bold disabled:opacity-50"
            >
              {checkingOtp
                ? "Checking..."
                : "Check for OTP"}
            </button>

            <button
              onClick={() =>
                window.location.href =
                  "/orders"
              }
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary text-[#03101d] font-black"
            >
              View My Orders
            </button>

          </div>
        ) : (

          /* Purchase card */
          <div className="rounded-[2rem] bg-white/[0.04] border border-white/10 backdrop-blur-xl p-6">

            <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 border border-white/10 p-5 mb-6">

              <p className="text-gray-500 text-sm">
                Country
              </p>

              <h2 className="text-xl font-bold mt-1">
                {serviceData?.country ||
                  "Loading..."}
              </h2>

              <p className="text-gray-500 text-sm mt-5">
                Service
              </p>

              <h2 className="text-xl font-bold mt-1">
                {serviceData?.serviceName ||
                  "Loading..."}
              </h2>

            </div>

            <div className="flex items-end justify-between mb-6">

              <div>
                <p className="text-gray-500 text-sm">
                  Price
                </p>

                <h2 className="text-4xl font-black text-primary-light mt-1">
                  {serviceData?.livePrice
                    ? `₦${Math.ceil(
                        serviceData.livePrice
                      ).toLocaleString()}`
                    : "—"}
                </h2>
              </div>

              <span className="text-green-400 text-sm font-bold">
                ● Available
              </span>

            </div>

            <div className="rounded-2xl bg-black/20 border border-white/5 p-4 mb-6">

              <div className="flex justify-between text-sm">

                <span className="text-gray-500">
                  Wallet balance
                </span>

                <span className="font-bold">
                  {walletBalance !== null
                    ? `₦${Math.floor(
                        walletBalance
                      ).toLocaleString()}`
                    : "—"}
                </span>

              </div>

            </div>

            <button
              onClick={handleBuyNumber}
              disabled={
                buying ||
                !serviceData
              }
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary text-[#03101d] font-black text-lg shadow-lg shadow-primary/10 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {buying
                ? "Processing..."
                : "Buy Number"}
            </button>

          </div>
        )}

        {/* Help */}
        <a
          href="https://wa.me/2347038167338"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-gray-500 text-sm mt-7"
        >
          Need help?{" "}
          <span className="text-green-400 font-semibold">
            WhatsApp Support
          </span>
        </a>

      </div>

      {/* Modern popup */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-5"
          onClick={closePopup}
        >

          <div
            className="w-full max-w-sm rounded-[2rem] bg-[#101c2d] border border-white/10 shadow-2xl p-7"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-5 ${
                popup.type === "success"
                  ? "bg-green-400/10 text-green-400"
                  : popup.type === "info"
                  ? "bg-primary/10 text-primary"
                  : "bg-red-400/10 text-red-400"
              }`}
            >
              {popup.type === "success"
                ? "✓"
                : popup.type === "info"
                ? "i"
                : "!"}
            </div>

            <h2 className="text-2xl font-black">
              {popup.title}
            </h2>

            <p className="text-gray-400 leading-6 mt-3">
              {popup.message}
            </p>

            <button
              onClick={closePopup}
              className="w-full mt-7 py-4 rounded-2xl bg-white text-black font-black"
            >
              Continue
            </button>

          </div>

        </div>
      )}

    </main>
  );
}
