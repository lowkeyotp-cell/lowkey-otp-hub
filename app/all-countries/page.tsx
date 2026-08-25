"use client";

import { useState } from "react";

interface OrderResponse {
success?: number;
type?: string;
phonenumber?: string;
order_code?: string;
message?: string;
}

export default function AllCountriesPage() {
const [country, setCountry] = useState("");
const [service, setService] = useState("");
const [status, setStatus] = useState("");
const [isLoading, setIsLoading] = useState(false);

async function buyNumber() {
if (!country.trim()) {
setStatus("❌ Please enter a country");
return;
}

if (!service.trim()) {
  setStatus("❌ Please enter a service ID");
  return;
}

setIsLoading(true);
setStatus("⏳ Processing order...");

try {
  const response = await fetch("/api/smspool/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      country: country.trim(),
      service: service.trim(),
      pool: "",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: OrderResponse = await response.json();

  console.log("Order response:", data);

  if (data.success === 1) {
    setStatus(
      `✅ Number Purchased Successfully\n` +
      `Number: ${data.phonenumber || "N/A"}\n` +
      `Order ID: ${data.order_code || "N/A"}`
    );

    setCountry("");
    setService("");
  } else {
    setStatus(
      "⚠️ Service temporarily unavailable. Please try again later."
    );
  }
} catch (error) {
  console.error("Purchase error:", error);

  setStatus(
    "⚠️ Service temporarily unavailable. Please try again later."
  );
} finally {
  setIsLoading(false);
}

}

return (
<main className="min-h-screen bg-gray-100 p-6">
<div className="max-w-xl mx-auto">
<h1 className="text-3xl font-bold mb-6 text-gray-800">
Buy Number - All Countries
</h1>

    <div className="bg-white p-6 rounded-3xl shadow-lg">
      {status && (
        <div
          className={`mb-4 p-4 rounded-xl whitespace-pre-line ${
            status.startsWith("✅")
              ? "bg-green-50 text-green-800"
              : status.startsWith("⚠️")
              ? "bg-yellow-50 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </div>
      )}

      <label className="block font-semibold mb-2 text-gray-700">
        Country
      </label>

      <input
        type="text"
        placeholder="Country ID (e.g. US)"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-4"
        disabled={isLoading}
      />

      <label className="block font-semibold mb-2 text-gray-700">
        Service
      </label>

      <input
        type="text"
        placeholder="Service ID"
        value={service}
        onChange={(e) => setService(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-6"
        disabled={isLoading}
      />

      <button
        onClick={buyNumber}
        disabled={isLoading || !country || !service}
        className={`w-full py-4 rounded-2xl font-bold ${
          isLoading || !country || !service
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {isLoading ? "Processing..." : "Buy Number"}
      </button>
    </div>
  </div>
</main>

);
}
