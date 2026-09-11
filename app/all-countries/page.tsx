"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Country {
  ID?: string | number;
  id?: string | number;
  name?: string;
  country?: string;
  code?: string;
  iso?: string;
}

export default function AllCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCountries() {
      try {
        const response = await fetch("/api/countries");

        if (!response.ok) {
          throw new Error("Failed to load countries");
        }

        const data = await response.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.countries)
          ? data.countries
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setCountries(list);
      } catch (err) {
        console.error("Countries error:", err);
        setError("Unable to load countries right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCountries();
  }, []);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return countries;
    }

    return countries.filter((item) => {
      const name = String(
        item.name || item.country || ""
      ).toLowerCase();

      const code = String(
        item.code || item.iso || ""
      ).toLowerCase();

      const id = String(
        item.ID || item.id || ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        code.includes(query) ||
        id.includes(query)
      );
    });
  }, [countries, search]);

  return (
    <main className="min-h-screen bg-gray-100 px-5 py-10">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <Link
            href="/"
            className="text-indigo-600 hover:underline text-sm"
          >
            ← Back to LOWKEY OTP
          </Link>

          <h1 className="text-4xl font-black text-gray-900 mt-4">
            OTP Numbers by Country
          </h1>

          <p className="text-gray-600 mt-3 max-w-2xl">
            Browse countries currently supported by LOWKEY OTP
            for temporary phone numbers and OTP verification
            services.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-5 mb-6">
          <label
            htmlFor="country-search"
            className="block font-semibold text-gray-800 mb-2"
          >
            Search countries
          </label>

          <input
            id="country-search"
            type="search"
            placeholder="Search by country name, code, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {isLoading && (
          <div className="bg-white rounded-3xl shadow p-8 text-center">
            <p className="text-gray-600">
              Loading supported countries...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-2xl p-5">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Supported Countries
              </h2>

              <span className="text-sm text-gray-500">
                {filteredCountries.length} found
              </span>
            </div>

            {filteredCountries.length === 0 ? (
              <div className="bg-white rounded-3xl shadow p-8 text-center">
                <p className="text-gray-600">
                  No matching countries found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCountries.map((item, index) => {
                  const name =
                    item.name ||
                    item.country ||
                    "Unknown Country";

                  const code =
                    item.code ||
                    item.iso ||
                    "";

                  const id =
                    item.ID ||
                    item.id ||
                    "";

                  return (
                    <div
                      key={`${id}-${code}-${index}`}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition"
                    >
                      <h3 className="font-bold text-lg text-gray-900">
                        {name}
                      </h3>

                      <div className="flex gap-3 mt-3 text-sm text-gray-500">
                        {code && (
                          <span>
                            Code: {code}
                          </span>
                        )}

                        {id && (
                          <span>
                            ID: {id}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="mt-10 bg-white rounded-3xl shadow p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Ready to get a number?
          </h2>

          <p className="text-gray-600 mt-2">
            Choose a supported service and purchase a number
            through LOWKEY OTP.
          </p>

          <Link
            href="/buy-number"
            className="inline-block mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl transition"
          >
            Buy Number
          </Link>
        </div>

      </div>
    </main>
  );
}
