"use client";

import { useEffect, useState } from "react";

type PricingSettings = {
  pricingMode: "markup";
  markupPercent: number;
  customUsdToNgn: number | null;
  useCustomUsdRate: boolean;
};

export default function AdminMarket() {
  const [liveRate, setLiveRate] = useState<number | null>(null);

  const [customRate, setCustomRate] =
    useState("");

  const [markup, setMarkup] =
    useState("0");

  const [useCustomRate, setUseCustomRate] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [rateResponse, settingsResponse] =
          await Promise.all([
            fetch("/api/market-rate"),
            fetch(
              "/api/admin/pricing-settings"
            ),
          ]);

        const rateData =
          await rateResponse.json();

        const settingsData =
          await settingsResponse.json();

        if (
          rateData?.success &&
          Number.isFinite(
            Number(rateData.usdToNgn)
          )
        ) {
          setLiveRate(
            Number(rateData.usdToNgn)
          );
        }

        if (settingsData?.success) {
          const settings =
            settingsData.settings;

          setMarkup(
            String(
              settings?.markupPercent ?? 0
            )
          );

          setUseCustomRate(
            Boolean(
              settings?.useCustomUsdRate
            )
          );

          if (
            settings?.customUsdToNgn
          ) {
            setCustomRate(
              String(
                settings.customUsdToNgn
              )
            );
          }
        }
      } catch (error) {
        console.log(
          "Market settings error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const activeRate =
    useCustomRate &&
    Number(customRate) > 0
      ? Number(customRate)
      : liveRate || 0;

  const saveSettings = async () => {
    setMessage("");

    if (
      useCustomRate &&
      (!Number(customRate) ||
        Number(customRate) <= 0)
    ) {
      setMessage(
        "Enter a valid custom USD/NGN rate."
      );
      return;
    }

    if (
      !Number.isFinite(Number(markup)) ||
      Number(markup) < 0
    ) {
      setMessage(
        "Enter a valid markup percentage."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/admin/pricing-settings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            markupPercent:
              Number(markup),
            customUsdToNgn:
              useCustomRate
                ? Number(customRate)
                : null,
            useCustomUsdRate:
              useCustomRate,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message ||
            "Unable to save settings."
        );
        return;
      }

      setMessage(
        "✓ Pricing settings saved successfully."
      );
    } catch (error) {
      console.log(
        "Save pricing error:",
        error
      );

      setMessage(
        "Unable to save pricing settings."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[130px] animate-pulse" />

        <div className="absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-purple-600/20 blur-[130px] animate-pulse" />

        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-green-500/10 blur-[130px] animate-pulse" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:45px_45px]" />

      </div>

      <section className="relative z-10 mx-auto max-w-5xl p-5 sm:p-8">

        <button
          onClick={() =>
            window.location.href =
              "/admin-dashboard"
          }
          className="mb-6 text-sm font-bold text-cyan-400"
        >
          ← Admin Dashboard
        </button>

        <div className="mb-8">

          <p className="text-xs font-bold uppercase tracking-[0.35em] text-yellow-400">
            Marketplace Control
          </p>

          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            Market & Pricing
          </h1>

          <p className="mt-2 text-gray-400">
            Control the exchange rate and markup used for new purchases.
          </p>

        </div>

        {/* Live rate */}
        <div className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6 backdrop-blur-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Live USD / NGN Rate
              </p>

              <p className="mt-2 text-4xl font-black text-cyan-300">
                {loading
                  ? "Loading..."
                  : liveRate
                    ? `₦${liveRate.toLocaleString(
                        "en-NG",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`
                    : "Unavailable"}
              </p>

            </div>

            <div className="rounded-2xl bg-green-400/10 px-4 py-3">
              <p className="text-xs font-bold text-green-400">
                ● LIVE
              </p>
            </div>

          </div>

        </div>

        {/* Custom rate */}
        <div className="mt-5 rounded-3xl border border-yellow-400/20 bg-white/[0.04] p-6 backdrop-blur-xl">

          <div className="flex items-center justify-between gap-4">

            <div>

              <h2 className="text-xl font-black">
                Custom USD / NGN Rate
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Override the live rate for new purchases.
              </p>

            </div>

            <button
              onClick={() =>
                setUseCustomRate(
                  !useCustomRate
                )
              }
              className={`rounded-full px-4 py-2 text-xs font-black ${
                useCustomRate
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {useCustomRate
                ? "ON"
                : "OFF"}
            </button>

          </div>

          <input
            value={customRate}
            onChange={(e) =>
              setCustomRate(
                e.target.value
              )
            }
            type="number"
            placeholder="Example: 1400"
            className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none focus:border-yellow-400/50"
          />

        </div>

        {/* Markup */}
        <div className="mt-5 rounded-3xl border border-purple-400/20 bg-white/[0.04] p-6 backdrop-blur-xl">

          <h2 className="text-xl font-black">
            Marketplace Markup
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Percentage added to the SMSPool cost.
          </p>

          <div className="relative mt-5">

            <input
              value={markup}
              onChange={(e) =>
                setMarkup(
                  e.target.value
                )
              }
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 pr-16 text-white outline-none focus:border-purple-400/50"
            />

            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-purple-300">
              %
            </span>

          </div>

        </div>

        {/* Preview */}
        <div className="mt-5 rounded-3xl border border-green-400/20 bg-green-400/[0.05] p-6">

          <p className="text-xs font-bold uppercase tracking-widest text-green-400">
            Pricing Preview
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">

            <div>
              <p className="text-xs text-gray-500">
                Active Rate
              </p>

              <p className="mt-1 text-xl font-black">
                ₦{activeRate.toLocaleString(
                  "en-NG",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Example $0.14 Cost
              </p>

              <p className="mt-1 text-xl font-black">
                ₦{(
                  0.14 *
                  activeRate
                ).toLocaleString(
                  "en-NG",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Customer Price
              </p>

              <p className="mt-1 text-xl font-black text-green-300">
                ₦{(
                  0.14 *
                  activeRate *
                  (
                    1 +
                    Number(markup || 0) /
                      100
                  )
                ).toLocaleString(
                  "en-NG",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>

          </div>

        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center text-sm font-bold text-cyan-300">
            {message}
          </div>
        )}

        <button
          onClick={saveSettings}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 py-4 text-lg font-black shadow-xl disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Pricing Settings"}
        </button>

        <p className="mt-5 text-center text-xs text-gray-600">
          Changes will apply to new purchases only. Existing orders keep their recorded pricing.
        </p>

      </section>

    </main>
  );
}
