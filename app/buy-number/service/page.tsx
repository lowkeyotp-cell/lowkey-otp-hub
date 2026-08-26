"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ServiceData = {
  country: string;
  serviceName: string;
  serviceId: string | number;
  pool: string | number;
  livePrice?: string | number | null;
};

export default function ServicePage() {
  const router = useRouter();

  const [serviceData, setServiceData] =
    useState<ServiceData | null>(null);

  const [buying, setBuying] = useState(false);
  const [checkingOtp, setCheckingOtp] = useState(false);

  const [number, setNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const [popup, setPopup] = useState("");

  useEffect(() => {
    const loadService = async () => {
      try {
        const saved = localStorage.getItem(
          "selectedService"
        );

        if (!saved) {
          setPopup(
            "Service information could not be found."
          );
          return;
        }

        const selected = JSON.parse(saved);

        setServiceData(selected);

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
        });

        const price = await response.json();

        if (price?.success) {
          setServiceData({
            ...selected,
            livePrice: price.price,
            pool: price.pool ?? selected.pool,
          });
        }
      } catch (error) {
        console.error("Pricing error:", error);

        setPopup(
          "We couldn't load the service information."
        );
      }
    };

    loadService();

    const savedOrder =
      localStorage.getItem("activeOtpOrder");

    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);

        setNumber(order.number || "");
        setOrderId(String(order.orderId || ""));
      } catch {
        localStorage.removeItem("activeOtpOrder");
      }
    }
  }, []);

  const handleBuyNumber = async () => {
    if (!serviceData) {
      setPopup(
        "Service information is still loading."
      );
      return;
    }

    if (!serviceData.serviceId) {
      setPopup(
        "This service is currently unavailable."
      );
      return;
    }

    if (
      serviceData.pool === undefined ||
      serviceData.pool === null
    ) {
      setPopup(
        "Number availability information is missing."
      );
      return;
    }

    try {
      setBuying(true);
      setPopup("");
      setMessage("");

      const response = await fetch(
        "/api/buy-number",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            country: serviceData.country,
            service: serviceData.serviceId,
            pool: serviceData.pool,
          }),
        }
      );

      const result = await response.json();

      console.log(
        "Buy Number result:",
        result
      );

      if (!response.ok || !result.success) {
        setPopup(
          result.message ||
            "We couldn't complete the purchase. Please try again."
        );
        return;
      }

      const newNumber = String(
        result.number || ""
      );

      const newOrderId = String(
        result.orderId || ""
      );

      if (!newNumber || !newOrderId) {
        setPopup(
          "The number was purchased, but the order information was incomplete."
        );
        return;
      }

      setNumber(newNumber);
      setOrderId(newOrderId);

      localStorage.setItem(
        "activeOtpOrder",
        JSON.stringify({
          number: newNumber,
          orderId: newOrderId,
          country: serviceData.country,
          serviceName:
            serviceData.serviceName,
          serviceId: serviceData.serviceId,
          pool: serviceData.pool,
        })
      );

      setMessage(
        "Number purchased successfully. Waiting for OTP..."
      );
    } catch (error) {
      console.error(
        "Buy Number error:",
        error
      );

      setPopup(
        "Something went wrong while purchasing the number. Please try again."
      );
    } finally {
      setBuying(false);
    }
  };

  const handleRefreshOtp = async () => {
    if (!orderId) {
      setPopup(
        "There is no active order to check."
      );
      return;
    }

    try {
      setCheckingOtp(true);
      setPopup("");
      setMessage("");

      const response = await fetch(
        "/api/otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
          }),
          cache: "no-store",
        }
      );

      const result = await response.json();

      console.log(
        "OTP result:",
        result
      );

      if (!response.ok || !result.success) {
        setPopup(
          result.message ||
            "Unable to check for an OTP right now."
        );
        return;
      }

      if (result.code) {
        setOtp(String(result.code));
        setMessage(
          "Your verification code has arrived."
        );
        return;
      }

      if (result.fullMessage) {
        setMessage(
          result.fullMessage
        );
        return;
      }

      setMessage(
        "No OTP received yet. Tap Refresh OTP again shortly."
      );
    } catch (error) {
      console.error(
        "OTP refresh error:",
        error
      );

      setPopup(
        "We couldn't check for a new OTP. Please try again."
      );
    } finally {
      setCheckingOtp(false);
    }
  };

  const handleClearOrder = () => {
    setNumber("");
    setOrderId("");
    setOtp("");
    setMessage("");

    localStorage.removeItem(
      "activeOtpOrder"
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-xl font-bold text-blue-600">
                !
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
              className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white active:scale-95"
            >
              Okay
            </button>

          </div>
        </div>
      )}

      <div className="mx-auto max-w-md">

        <button
          onClick={() => router.back()}
          className="mb-5 rounded-2xl bg-black px-5 py-3 font-semibold text-white"
        >
          Back
        </button>

        <div className="rounded-3xl bg-white p-6 shadow-lg">

          <h1 className="mb-6 text-3xl font-bold text-blue-600">
            {number
              ? "OTP Verification"
              : "Service Details"}
          </h1>

          {!number ? (
            <>
              <div className="space-y-5">

                <div>
                  <p className="text-sm text-gray-500">
                    Country
                  </p>

                  <p className="text-xl font-semibold">
                    {serviceData?.country ||
                      "Loading..."}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Service
                  </p>

                  <p className="text-xl font-semibold">
                    {serviceData?.serviceName ||
                      "Loading..."}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Price
                  </p>

                  <p className="text-2xl font-bold text-green-600">
                    {serviceData?.livePrice
                      ? `₦${Math.ceil(
                          Number(
                            serviceData.livePrice
                          )
                        ).toLocaleString()}`
                      : "Loading..."}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Status
                  </p>

                  <p className="font-semibold text-green-600">
                    ● Available
                  </p>
                </div>

              </div>

              <button
                onClick={handleBuyNumber}
                disabled={
                  buying ||
                  !serviceData
                }
                className="mt-8 w-full rounded-2xl bg-blue-600 py-4 font-bold text-white transition active:scale-95 disabled:opacity-50"
              >
                {buying
                  ? "Processing..."
                  : "Buy Number"}
              </button>
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-gray-50 p-5">

                <p className="mb-2 text-sm text-gray-500">
                  Your Number
                </p>

                <p className="text-2xl font-bold tracking-wide text-gray-900">
                  {number}
                </p>

              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 p-5">

                <p className="text-sm font-semibold text-blue-700">
                  Order Status
                </p>

                <p className="mt-1 text-gray-700">
                  {otp
                    ? "OTP received"
                    : "Waiting for OTP..."}
                </p>

              </div>

              {otp && (
                <div className="mt-5 rounded-2xl bg-green-50 p-5 text-center">

                  <p className="text-sm font-semibold text-green-700">
                    Verification Code
                  </p>

                  <p className="mt-2 text-4xl font-black tracking-[0.35em] text-green-700">
                    {otp}
                  </p>

                </div>
              )}

              {message && (
                <p className="mt-5 rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-600">
                  {message}
                </p>
              )}

              <button
                onClick={handleRefreshOtp}
                disabled={
                  checkingOtp ||
                  !orderId
                }
                className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-bold text-white transition active:scale-95 disabled:opacity-50"
              >
                {checkingOtp
                  ? "Checking OTP..."
                  : "Refresh OTP"}
              </button>

              <button
                onClick={handleClearOrder}
                className="mt-3 w-full rounded-2xl border border-gray-300 bg-white py-3 font-semibold text-gray-700"
              >
                Finish / Clear Order
              </button>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
