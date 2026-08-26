"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyNumberPage() {
  const [countries, setCountries] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);

  const router = useRouter();

  const normalize = (value: any) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("/api/countries");
        const data = await response.json();

        setCountries(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Countries error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const fetchServices = async (country: string) => {
    try {
      setLoadingServices(true);
      setSelectedCountry(country);

      const response = await fetch("/api/services");
      const data = await response.json();

      const serviceList = Array.isArray(data) ? data : [];

      serviceList.sort((a: any, b: any) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );

      setServices(serviceList);
    } catch (error) {
      console.error("Services error:", error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceClick = (serviceName: string) => {
    const service = services.find(
      (s: any) =>
        normalize(s.name) === normalize(serviceName)
    );

    if (!service) {
      alert(`${serviceName} is currently unavailable.`);
      return;
    }

    localStorage.setItem(
      "selectedService",
      JSON.stringify({
        country: selectedCountry,
        serviceName: service.name,
        serviceId: service.ID,
        pool: service.pool,
      })
    );

    router.push("/buy-number/service");
  };

  const serviceNames = [
    "WhatsApp",
    "Telegram",
    "Discord",
    "Facebook",
    "Instagram",
    "TikTok",
    "Signal",
    "Google",
    "POF",
    "Gmail",
    "YouTube",
    "X (Twitter)",
    "Snapchat",
    "Uber",
    "Bolt",
    "Airbnb",
    "Amazon",
    "eBay",
    "Netflix",
    "Spotify",
    "PayPal",
    "Binance",
    "Bybit",
    "Coinbase",
    "OKX",
    "Steam",
    "Epic Games",
    "PlayStation",
    "Xbox",
    "Yahoo",
    "Microsoft",
    "Apple",
    "LinkedIn",
    "Reddit",
    "Tinder",
    "Bumble",
    "WeChat",
    "LINE",
    "Viber",
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        Buy OTP Number
      </h1>

      {!selectedCountry ? (
        <>
          <h2 className="text-2xl font-bold mb-5">
            Select Country
          </h2>

          <div className="mb-8">
            <h3 className="font-bold text-xl mb-4">
              Popular Countries
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fetchServices("1")}
                className="bg-white p-4 rounded-xl shadow"
              >
                🇺🇸 USA
              </button>

              <button
                onClick={() => fetchServices("2")}
                className="bg-white p-4 rounded-xl shadow"
              >
                🇬🇧 UK
              </button>

              <button
                onClick={() => fetchServices("43")}
                className="bg-white p-4 rounded-xl shadow"
              >
                🇩🇪 Germany
              </button>

              <button
                onClick={() => fetchServices("39")}
                className="bg-white p-4 rounded-xl shadow"
              >
                🇳🇱 Netherlands
              </button>

              <button
                onClick={() => fetchServices("8")}
                className="bg-white p-4 rounded-xl shadow"
              >
                🇦🇫 Afghanistan
              </button>

              <button
                onClick={() => fetchServices("24")}
                className="bg-white p-4 rounded-xl shadow"
              >
                🇮🇳 India
              </button>
            </div>
          </div>

          {loading && (
            <p className="text-lg font-semibold">
              Loading countries...
            </p>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => {
              setSelectedCountry("");
              setServices([]);
            }}
            className="mb-5 bg-black text-white px-5 py-3 rounded-2xl"
          >
            Back
          </button>

          <h2 className="text-3xl font-bold mb-5">
            Services
          </h2>

          {loadingServices ? (
            <p className="text-lg font-semibold">
              Loading services...
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {serviceNames.map((serviceName) => {
                const available = services.some(
                  (s: any) =>
                    normalize(s.name) ===
                    normalize(serviceName)
                );

                return (
                  <button
                    key={serviceName}
                    onClick={() =>
                      handleServiceClick(serviceName)
                    }
                    disabled={!available}
                    className={`p-5 rounded-3xl shadow-sm transition ${
                      available
                        ? "bg-white text-black active:scale-95"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {serviceName}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
