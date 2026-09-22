"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Country = {
  ID: number | string;
  name: string;
  short_name?: string;
  cc?: string;
  region?: string;
};

type Service = {
  id: number | string;
  name: string;
  favourite?: number;
  pool?: string | number | null;
};

export default function BuyNumberV2Page() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [price, setPrice] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    async function loadCountries() {
      try {
        setLoadingCountries(true);
        setError("");

        const response = await fetch("/api/countries", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          throw new Error("Failed to load countries.");
        }

        setCountries(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load countries.");
      } finally {
        setLoadingCountries(false);
      }
    }

    loadCountries();
  }, []);

  async function selectCountry(country: Country) {
    try {
      setSelectedCountry(country);
      setServices([]);
      setServiceSearch("");
      setLoadingServices(true);
      setError("");

      const response = await fetch(
        `/api/buy-number-v2/services?country=${encodeURIComponent(
          String(country.ID)
        )}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.services)) {
        throw new Error(data.message || "Failed to load services.");
      }

      setServices(data.services);
    } catch (err) {
      console.error(err);
      setError("Unable to load services for this country.");
    } finally {
      setLoadingServices(false);
    }
  }

  function backToCountries() {
    setSelectedCountry(null);
    setServices([]);
    setServiceSearch("");
    setSelectedService(null);
    setPrice(null);
    setError("");
  }

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();

    if (!search) return countries;

    return countries.filter((country) =>
      [country.name, country.short_name, country.cc, country.region]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [countries, countrySearch]);

  const filteredServices = useMemo(() => {
    const search = serviceSearch.trim().toLowerCase();

    if (!search) return services;

    return services.filter((service) =>
      String(service.name).toLowerCase().includes(search)
    );
  }, [services, serviceSearch]);

  async function selectService(service: Service) {
    if (!selectedCountry) return;

    try {
      setSelectedService(service);
      setPrice(null);
      setLoadingPrice(true);
      setError("");

      const params = new URLSearchParams({
        country: String(selectedCountry.ID),
        service: String(service.id),
      });

      if (service.pool !== undefined && service.pool !== null) {
        params.set("pool", String(service.pool));
      }

      const response = await fetch(
        `/api/buy-number-v2/price?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load price.");
      }

      setPrice(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load the current price.");
      setSelectedService(null);
    } finally {
      setLoadingPrice(false);
    }
  }

  async function buyNumber() {
    if (!selectedCountry || !selectedService || !price) return;

    const user = auth.currentUser;

    if (!user) {
      setError("Please log in before buying a number.");
      return;
    }

    setShowPurchaseModal(true);
  }

  async function confirmPurchase() {
    if (!selectedCountry || !selectedService || !price) return;

    const user = auth.currentUser;

    if (!user) {
      setShowPurchaseModal(false);
      setError("Please log in before buying a number.");
      return;
    }

    try {
      setPurchasing(true);
      setError("");

      const idToken = await user.getIdToken();

      const response = await fetch("/api/buy-number-v2/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          country: String(selectedCountry.ID),
          service: String(selectedService.id),
          pool: selectedService.pool ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Purchase failed.");
      }

      setShowPurchaseModal(false);
      window.location.href = "/orders";
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unable to purchase number."
      );
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {showPurchaseModal && selectedService && price && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0e14] p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
                    Confirm purchase
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Ready to buy?
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="rounded-full px-3 py-1 text-xl text-gray-500 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Service</span>
                  <span className="font-semibold text-white">
                    {selectedService.name}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Country</span>
                  <span className="font-semibold text-white">
                    {selectedCountry?.name}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-sm text-gray-400">Total</span>
                  <span className="text-xl font-bold text-purple-400">
                    ₦{Math.ceil(Number(price.sellingPrice)).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                Your wallet will be charged after the number is successfully
                purchased. If the purchase cannot be completed, your wallet
                will be refunded automatically.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={purchasing}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-semibold text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmPurchase}
                  disabled={purchasing}
                  className="rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {purchasing ? "Processing..." : "Confirm & Buy"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-purple-400">
            LOWKEY OTP
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Buy Number
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Select a country and choose the service you need.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!selectedCountry ? (
          <>
            <div className="mb-5">
              <input
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            {loadingCountries ? (
              <div className="py-16 text-center text-gray-400">
                Loading countries...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCountries.map((country) => (
                  <button
                    key={country.ID}
                    onClick={() => selectCountry(country)}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-purple-500/50 hover:bg-purple-500/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-white">
                          {country.name}
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                          {country.short_name || "—"}{" "}
                          {country.cc ? `• +${country.cc}` : ""}
                        </p>
                      </div>

                      <span className="text-xl text-gray-500 transition group-hover:text-purple-400">
                        →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loadingCountries && filteredCountries.length === 0 && (
              <div className="py-16 text-center text-gray-500">
                No countries found.
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={backToCountries}
              className="mb-5 text-sm text-purple-400 hover:text-purple-300"
            >
              ← Back to countries
            </button>

            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Selected country
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {selectedCountry.name}
              </h2>
            </div>

            <div className="mb-5">
              <input
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search service..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            {loadingServices ? (
              <div className="py-16 text-center text-gray-400">
                Loading services...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => selectService(service)}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-purple-500/50 hover:bg-purple-500/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-white">
                          {service.name}
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                          Service ID: {service.id}
                        </p>
                      </div>

                      <span className="shrink-0 text-xl text-gray-500 transition group-hover:text-purple-400">
                        →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loadingServices && filteredServices.length === 0 && (
              <div className="py-16 text-center text-gray-500">
                No services found.
              </div>
            )}

            {selectedService && (
              <div className="mt-8 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-6">
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Selected service
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  {selectedService.name}
                </h2>

                {loadingPrice ? (
                  <p className="mt-5 text-gray-400">
                    Loading current price...
                  </p>
                ) : price ? (
                  <div className="mt-5">
                    <p className="text-sm text-gray-400">
                      Current price
                    </p>

                    <p className="mt-1 text-4xl font-bold text-white">
                      ₦{Math.ceil(Number(price.sellingPrice)).toLocaleString()}
                    </p>

                    <div className="mt-4">
                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-gray-500">Success rate</p>
                        <p className="mt-1 font-semibold">
                          {price.successRate ?? "—"}%
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={buyNumber}
                        disabled={purchasing}
                        className="mt-4 w-full rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {purchasing ? "Buying Number..." : "Buy Number"}
                      </button>

                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
