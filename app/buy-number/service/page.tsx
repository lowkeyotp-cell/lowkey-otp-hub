"use client";

import { useEffect, useState } from "react";

export default function ServicePage() {
  const [serviceData, setServiceData] = useState<any>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const loadService = async () => {
      try {
        const data = localStorage.getItem("selectedService");

        if (!data) return;

        const selected = JSON.parse(data);

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
        });

        const price = await response.json();

        console.log("Pricing result:", price);

        if (!price.success) {
          setServiceData({
            ...selected,
            livePrice: null,
            pool: selected.pool,
          });
          return;
        }

        setServiceData({
          ...selected,
          livePrice: price.price,
          costPrice: price.costPrice,
          margin: price.margin,
          pool: price.pool,
        });
      } catch (error) {
        console.error("Pricing error:", error);
      }
    };

    loadService();
  }, []);

  const handleBuyNumber = async () => {
    if (!serviceData) {
      alert("Service information is still loading.");
      return;
    }

    if (!serviceData.serviceId) {
      alert("Service ID is missing.");
      console.log("Missing service ID:", serviceData);
      return;
    }

    if (!serviceData.pool) {
      alert("Number pool is missing.");
      console.log("Missing pool:", serviceData);
      return;
    }

    try {
      setBuying(true);

      console.log("Starting purchase:", {
        country: serviceData.country,
        service: serviceData.serviceId,
        pool: serviceData.pool,
        price: serviceData.livePrice,
      });

      const response = await fetch("/api/buy-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: serviceData.country,
          service: serviceData.serviceId,
          pool: serviceData.pool,
        }),
      });

      const result = await response.json();

      console.log("Buy Number result:", result);

      if (!result.success) {
        alert(
          result.message ||
            "Unable to purchase number."
        );
        return;
      }

      alert(
        `Number purchased successfully:\n${result.number}`
      );
    } catch (error) {
      console.error("Buy Number error:", error);

      alert(
        "Something went wrong while purchasing the number."
      );
    } finally {
      setBuying(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-lg p-6">

        <h1 className="text-3xl font-bold text-blue-600 mb-6">
          Service Details
        </h1>

        <div className="space-y-4">

          <div>
            <p className="text-gray-500">
              Country
            </p>

            <h2 className="text-xl font-semibold">
              {serviceData?.country ||
                "Loading..."}
            </h2>
          </div>

          <div>
            <p className="text-gray-500">
              Service
            </p>

            <h2 className="text-xl font-semibold">
              {serviceData?.serviceName ||
                "Loading..."}
            </h2>
          </div>

          <div>
            <p className="text-gray-500">
              Price
            </p>

            <h2 className="text-2xl font-bold text-green-600">
              {serviceData?.livePrice
                ? `₦${Math.ceil(
                    Number(
                      serviceData.livePrice
                    )
                  ).toLocaleString()}`
                : "Loading..."}
            </h2>
          </div>

          <div>
            <p className="text-gray-500">
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
          className="w-full mt-8 bg-blue-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50"
        >
          {buying
            ? "Processing..."
            : "Buy Number"}
        </button>

      </div>
    </main>
  );
}
