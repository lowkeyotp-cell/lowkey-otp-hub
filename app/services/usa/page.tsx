"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  ID: string | number;
  name?: string;
  service?: string;
  livePrice?: string | number;
  pool?: string | number | null;
};

export default function USAServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch("/api/services", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          console.error("Services error:", data);
          return;
        }

        setServices(data);
      } catch (error) {
        console.error("Failed to load services:", error);
      } finally {
        setLoading(false);
      }
    };

    loadServices();

    const interval = setInterval(loadServices, 30000);

    return () => clearInterval(interval);
  }, []);

  const handlePurchase = (service: Service) => {
    router.push(
      `/buy-number/service?country=USA&service=${encodeURIComponent(
        String(service.ID)
      )}`
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">

      <h1 className="text-4xl font-bold text-primary mb-6">
        USA OTP Services
      </h1>

<div className="mb-6 flex flex-wrap gap-3 text-sm">
  <a
    href="/all-countries"
    className="text-blue-600 hover:underline"
  >
    ← All Countries
  </a>

  <a
    href="/buy-number"
    className="text-blue-600 hover:underline"
  >
    Buy Number
  </a>
</div>

<section className="mb-8 max-w-3xl">
  <p className="text-gray-600 leading-relaxed">
    Get temporary USA phone numbers for supported OTP and SMS
    verification services through LOWKEY OTP. Choose an available
    service below to view the current price and purchase a number.
  </p>
</section>

      {loading ? (
        <p className="text-gray-600">
          Loading live services...
        </p>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl p-6">
          <p>No USA services available.</p>
        </div>
      ) : (
        <div className="grid gap-4">

          {services.map((service) => (

            <div
              key={service.ID}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >

              <h2 className="text-2xl font-bold text-gray-900">
                {service.name || service.service || "Unknown Service"}
              </h2>

              <p className="text-gray-500 mt-3">
                Live SMSPool Price
              </p>

              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                ${service.livePrice ?? "0"}
              </h3>

              <button
                onClick={() => handlePurchase(service)}
                className="mt-5 bg-primary text-white px-5 py-3 rounded-2xl font-semibold w-full"
              >
                Purchase Number
              </button>

            </div>

          ))}

        </div>
      )}

    </main>
  );
}
