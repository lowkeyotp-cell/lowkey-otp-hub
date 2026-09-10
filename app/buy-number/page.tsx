"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Country = {
  ID?: string | number;
  id?: string | number;

  name?: string;
  country?: string;

  short_name?: string;

  region?: string;

  cc?: string;

  code?: string;
  iso?: string;
  flag?: string;
};

type Service = {
  ID?: string | number;
  id?: string | number;
  name?: string;
  service?: string;
  pool?: string | number | null;
  customerPrice?: number;
};

export default function BuyNumberPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCountry, setSelectedCountry] =
    useState<Country | null>(null);

  const [countrySearch, setCountrySearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] =
    useState(false);

  const [popup, setPopup] = useState("");

  const router = useRouter();

  const normalize = (value: unknown) =>
    String(value ?? "")
      .toLowerCase()
      .trim();

const getFlag = (countryCode?: string) => {
  if (!countryCode || countryCode.length !== 2) {
    return "🌍";
  }

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(
        127397 + char.charCodeAt(0)
      )
    );
};

const getServiceIcon = (serviceName?: string) => {
  const name = normalize(serviceName);

  if (name.includes("whatsapp")) return "💬";
  if (name.includes("telegram")) return "✈️";
  if (name.includes("facebook")) return "📘";
  if (name.includes("instagram")) return "📸";
  if (name.includes("tiktok")) return "🎵";
  if (name.includes("google")) return "🔎";
  if (name.includes("gmail")) return "✉️";
  if (name.includes("microsoft")) return "🪟";
  if (name.includes("twitter") || name === "x") return "𝕏";
  if (name.includes("discord")) return "🎮";
  if (name.includes("uber")) return "🚗";
  if (name.includes("paypal")) return "💳";
  if (name.includes("amazon")) return "🛒";
  if (name.includes("snapchat")) return "👻";
  if (name.includes("reddit")) return "🔴";

  return "📱";
};

/*
 * Load all countries.
   */
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/countries", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          console.error("Countries response:", data);
          setPopup(
            "We couldn't load the countries right now. Please try again."
          );
          return;
        }

        const countryList = data.filter(
          (country: Country) =>
            country &&
           <div className="flex items-center gap-3">
  <span className="text-2xl">
    {getFlag(country.short_name)}
  </span>

  <div>
    <p className="font-semibold">
      {country.name}
    </p>

    <p className="text-sm text-gray-500">
      {country.region}
    </p>
  </div>
</div>
        );

        countryList.sort((a, b) =>
          String(a.name || a.country || "").localeCompare(
            String(b.name || b.country || "")
          )
        );

        setCountries(countryList);
      } catch (error) {
        console.error("Countries error:", error);

        setPopup(
          "We couldn't load the countries right now. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  /*
   * Filter countries.
   */
  const filteredCountries = useMemo(() => {
    const search = normalize(countrySearch);

    if (!search) return countries;

    return countries.filter((country) => {
      const name = normalize(
        country.name || country.country
      );

      const id = normalize(
        country.ID ?? country.id
      );

      const code = normalize(
        country.code || country.iso
      );

      return (
        name.includes(search) ||
        id.includes(search) ||
        code.includes(search)
      );
    });
  }, [countries, countrySearch]);

  /*
   * Load services for the selected country.
   */
  const loadServices = async (country: Country) => {
    try {
      setLoadingServices(true);
      setSelectedCountry(country);
      setServices([]);
      setServiceSearch("");

      const countryId =
        country.ID ?? country.id;

      if (
        countryId === undefined ||
        countryId === null ||
        String(countryId).trim() === ""
      ) {
        setPopup(
          "This country does not have a valid SMSPool country ID."
        );
        return;
      }

      const response = await fetch(
        `/api/services?country=${encodeURIComponent(
          String(countryId)
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        console.error("Services response:", data);

        setPopup(
          "Services are temporarily unavailable. Please try again later."
        );

        return;
      }

      const serviceList = data.filter(
        (service: Service) =>
          service && service.name
      );

      serviceList.sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );

      setServices(serviceList);
    } catch (error) {
      console.error("Services error:", error);

      setPopup(
        "We couldn't load the services right now. Please try again later."
      );
    } finally {
      setLoadingServices(false);
    }
  };

  /*
   * Filter services.
   */
  const filteredServices = useMemo(() => {
    const search = normalize(serviceSearch);

    if (!search) return services;

    return services.filter((service) => {
      const name = normalize(service.name);
      const id = normalize(
        service.ID ?? service.id
      );

      return (
        name.includes(search) ||
        id.includes(search)
      );
    });
  }, [services, serviceSearch]);

  /*
   * Select a service.
   */
  const handleServiceClick = (
    service: Service
  ) => {
    if (!selectedCountry) return;

    const countryId =
      selectedCountry.ID ??
      selectedCountry.id;

    const serviceId =
      service.ID ?? service.id;

    if (
      countryId === undefined ||
      serviceId === undefined
    ) {
      setPopup(
        "This service is missing required information."
      );
      return;
    }

    localStorage.setItem(
      "selectedService",
      JSON.stringify({
        country: String(countryId),
        serviceName:
          service.name ||
          service.service ||
          "Unknown Service",
        serviceId: serviceId,
        pool: service.pool ?? null,
      })
    );

    router.push("/buy-number/service");
  };

  const countryName = (country: Country) =>
    country.name ||
    country.country ||
    "Unknown Country";

  const countryCode = (country: Country) =>
    country.code ||
    country.iso ||
    "";

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6">

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
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
              className="w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition active:scale-95"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl">

        <h1 className="mb-2 text-4xl font-black text-primary">
          Buy OTP Number
        </h1>

        <p className="mb-8 text-gray-500">
          Choose a country and select the service you need.
        </p>

        {!selectedCountry ? (
          <>
            <div className="mb-6">
              <h2 className="mb-4 text-2xl font-bold">
                Select Country
              </h2>

              <div className="relative">
                <input
                  type="search"
                  value={countrySearch}
                  onChange={(event) =>
                    setCountrySearch(event.target.value)
                  }
                  placeholder="Search country..."
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 pl-12 text-gray-900 outline-none shadow-sm focus:border-primary"
                />

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <p className="font-semibold text-gray-600">
                  Loading countries...
                </p>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <p className="font-bold text-gray-700">
                  No countries found
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Try another country name or code.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredCountries.map(
                  (country, index) => {
                    const id =
                      country.ID ??
                      country.id ??
                      index;

                    return (
                      <button
                        key={String(id)}
                        onClick={() =>
                          loadServices(country)
                        }
                        className="group rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg active:scale-[0.97]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                           {getFlag(country.short_name)}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-900">
                              {countryName(country)}
                            </p>

                            {countryCode(country) && (
                              <p className="mt-1 text-xs uppercase text-gray-400">
                                {countryCode(country)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setSelectedCountry(null);
                setServices([]);
                setServiceSearch("");
              }}
              className="mb-6 rounded-2xl bg-black px-5 py-3 font-semibold text-white transition active:scale-95"
            >
              ← Back to Countries
            </button>

            <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-400">
                Selected Country
              </p>

              <h2 className="mt-1 text-2xl font-black text-gray-900">
                {countryName(selectedCountry)}
              </h2>
            </div>

            <div className="mb-6">
              <h2 className="mb-4 text-2xl font-bold">
                Select Service
              </h2>

              <div className="relative">
                <input
                  type="search"
                  value={serviceSearch}
                  onChange={(event) =>
                    setServiceSearch(event.target.value)
                  }
                  placeholder="Search service..."
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 pl-12 text-gray-900 outline-none shadow-sm focus:border-primary"
                />

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            {loadingServices ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />

                <p className="font-semibold text-gray-600">
                  Loading available services...
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <p className="font-bold text-gray-700">
                  No services found
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Try another service name.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredServices.map(
                  (service, index) => {
                    const id =
                      service.ID ??
                      service.id ??
                      index;

                 return (
  <button
    key={String(id)}
    onClick={() =>
      handleServiceClick(service)
    }
    className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg active:scale-[0.97]"
  >
    <div className="flex items-center justify-between gap-3">

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
          {getServiceIcon(
            service.name ||
            service.service
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">
            {service.name ||
              service.service ||
              "Unknown Service"}
          </p>

          <p className="mt-1 text-xs text-green-600">
            Available
          </p>
        </div>

      </div>

      <div className="ml-2 shrink-0 text-right">
        <p className="text-sm font-black text-primary">
          {service.customerPrice !== undefined
            ? `₦${Math.ceil(
                service.customerPrice
              ).toLocaleString()}`
            : "Price unavailable"}
        </p>

        <span className="text-xl">
          →
        </span>
      </div>

    </div>
  </button>
);
                  }
                )}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
