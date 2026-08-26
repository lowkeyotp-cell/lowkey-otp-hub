"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyNumberPage() {
  const [countries, setCountries] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [popup, setPopup] = useState("");

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
        setPopup(
          "We couldn't load the countries right now. Please try again."
        );
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
      setServices([]);

      const response = await fetch("/api/services", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        console.error("Services response:", data);

        setServices([]);

        setPopup(
          "Services are temporarily unavailable. Please try again later."
        );

        return;
      }

      const serviceList = data.filter(
        (service: any) => service && service.name
      );

      serviceList.sort((a: any, b: any) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );

      setServices(serviceList);
    } catch (error) {
      console.error("Services error:", error);
      setServices([]);

      setPopup(
        "We couldn't load the services right now. Please try again later."
      );
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
      setPopup(
        `${serviceName} is currently unavailable. Please choose another service.`
      );
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

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl">!</span>
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Lowkey OTP
            </h2>

            <p className="mb-6 text-sm leading-6 text-gray-600">
              {popup}
            </p>

            <button
              onClick={() => setPopup("")}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition active:scale-95"
            >
              Okay
            </button>

          </div>
        </div>
      )}

      <h1 className="mb-8 text-4xl font-bold text-blue-600">
        Buy OTP Number
      </h1>

      {!selectedCountry ? (
        <>
          <h2 className="mb-5 text-2xl font-bold">
            Select Country
          </h2>

          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold">
              Popular Countries
            </h3>

            <div className="grid grid-cols-2 gap-3">

              <button
                onClick={() => fetchServices("1")}
                className="rounded-xl bg-white p-4 shadow transition active:scale-95"
              >
                🇺🇸 USA
              </button>

              <button
                onClick={() => fetchServices("2")}
                className="rounded-xl bg-white p-4 shadow transition active:scale-95"
              >
                🇬🇧 UK
              </button>

              <button
                onClick={() => fetchServices("43")}
                className="rounded-xl bg-white p-4 shadow transition active:scale-95"
              >
                🇩🇪 Germany
              </button>

              <button
                onClick={() => fetchServices("39")}
                className="rounded-xl bg-white p-4 shadow transition active:scale-95"
              >
                🇳🇱 Netherlands
              </button>

              <button
                onClick={() => fetchServices("8")}
                className="rounded-xl bg-white p-4 shadow transition active:scale-95"
              >
                🇦🇫 Afghanistan
              </button>

              <button
                onClick={() => fetchServices("24")}
                className="rounded-xl bg-white p-4 shadow transition active:scale-95"
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
            className="mb-5 rounded-2xl bg-black px-5 py-3 text-white"
          >
            Back
          </button>

          <h2 className="mb-5 text-3xl font-bold">
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
                    className={`rounded-3xl p-5 shadow-sm transition ${
                      available
                        ? "bg-white text-black active:scale-95"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
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
