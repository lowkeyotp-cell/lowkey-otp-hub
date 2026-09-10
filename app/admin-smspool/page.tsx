"use client";

import { useEffect, useMemo, useState } from "react";

type BalanceResponse = {
  success?: boolean;
  data?: {
    balance?: string | number;
  };
  error?: string;
};

type Country = {
  ID: number;
  name: string;
  short_name: string;
  cc: string;
  region: string;
};

type Service = {
  ID?: number;
  name?: string;
  [key: string]: unknown;
};

export default function AdminSmsPoolPage() {
  const [balance, setBalance] = useState<string>("—");
  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState("");
  const [search, setSearch] = useState("");

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [balanceRes, countriesRes, servicesRes] =
        await Promise.all([
          fetch("/api/smspool/balance", {
            cache: "no-store",
          }),
          fetch("/api/countries", {
            cache: "no-store",
          }),
          fetch("/api/services", {
            cache: "no-store",
          }),
        ]);

      const balanceData: BalanceResponse =
        await balanceRes.json();

      if (
        balanceData.success &&
        balanceData.data?.balance !== undefined
      ) {
        setBalance(
          Number(balanceData.data.balance).toFixed(2)
        );
      } else {
        throw new Error(
          balanceData.error ||
            "Unable to retrieve SMSPool balance."
        );
      }

      if (!countriesRes.ok) {
        throw new Error("Unable to load countries.");
      }

      const countryData = await countriesRes.json();

      if (Array.isArray(countryData)) {
        setCountries(countryData);
      }

      if (servicesRes.ok) {
        const serviceData = await servicesRes.json();

        if (Array.isArray(serviceData)) {
          setServices(serviceData);
        }
      }

      if (showRefresh) {
        setPopup("SMSPool information refreshed successfully.");
      }
    } catch (err) {
      console.error("SMSPool admin error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load SMSPool information."
      );

      setPopup(
        "We couldn't load the latest SMSPool information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCountries = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return countries;
    }

    return countries.filter((country) =>
      [
        country.name,
        country.short_name,
        country.region,
        country.cc,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [countries, search]);

  const filteredServices = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return services;
    }

    return services.filter((service) =>
      JSON.stringify(service)
        .toLowerCase()
        .includes(value)
    );
  }, [services, search]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-2xl">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15">
              <span className="text-2xl text-blue-400">
                ✓
              </span>
            </div>

            <h2 className="text-xl font-black">
              SMSPool Control
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {popup}
            </p>

            <button
              onClick={() => setPopup("")}
              className="mt-6 w-full rounded-2xl bg-blue-600 py-3.5 font-bold transition hover:bg-blue-500 active:scale-95"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
              Lowkey OTP • Admin
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              SMSPool Control
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
              Monitor your SMSPool connection, balance,
              countries and available services.
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-5 py-3 font-bold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-semibold text-slate-400">
              SMSPool Balance
            </p>

            <p className="mt-3 text-4xl font-black">
              ${loading ? "..." : balance}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Live account balance
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-semibold text-slate-400">
              API Status
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.7)]" />

              <span className="text-2xl font-black text-emerald-400">
                Connected
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              SMSPool API responding normally
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-semibold text-slate-400">
              Availability
            </p>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-black">
                {loading ? "..." : countries.length}
              </span>

              <span className="pb-1 text-sm text-slate-500">
                countries
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Countries returned by SMSPool
            </p>
          </div>
        </section>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">
                SMSPool Data
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search countries and services without
                displaying the full raw API response.
              </p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 md:w-72"
            />
          </div>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black">
                    🌍 Countries
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {filteredCountries.length} results
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Loading countries...
                </div>
              ) : filteredCountries.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No countries found.
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <div
                    key={`${country.ID}-${country.short_name}`}
                    className="flex items-center justify-between border-b border-white/5 p-4 last:border-0 hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {country.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {country.region}
                      </p>
                    </div>

                    <div className="ml-4 shrink-0 text-right">
                      <p className="font-black text-blue-300">
                        {country.short_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        +{country.cc}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 p-5">
              <h2 className="font-black">
                📱 Services
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredServices.length} results
              </p>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Loading services...
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No services found.
                </div>
              ) : (
                filteredServices.map(
                  (service, index) => {
                    const serviceName =
                      typeof service.name === "string"
                        ? service.name
                        : `Service ${service.ID ?? index + 1}`;

                    return (
                      <div
                        key={`${service.ID ?? "service"}-${index}`}
                        className="border-b border-white/5 p-4 last:border-0 hover:bg-white/[0.03]"
                      >
                        <p className="font-bold">
                          {serviceName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          ID:{" "}
                          {String(
                            service.ID ?? "N/A"
                          )}
                        </p>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 rounded-3xl border border-blue-400/10 bg-blue-500/[0.05] p-5 text-sm text-slate-400">
          <p className="font-bold text-blue-300">
            🔐 Security
          </p>

          <p className="mt-2 leading-6">
            Your SMSPool API key stays on the server.
            This dashboard communicates through your
            existing Next.js API routes and does not
            expose the secret to the browser.
          </p>
        </div>
      </div>
    </main>
  );
}
