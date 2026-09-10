"use client";

import { useEffect, useState } from "react";

type Settings = {
  maintenanceMode: boolean;
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  marketplaceEnabled: boolean;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
};

const DEFAULT_SETTINGS: Settings = {
  maintenanceMode: false,
  depositsEnabled: true,
  withdrawalsEnabled: true,
  marketplaceEnabled: true,
  minDeposit: 100,
  maxDeposit: 1000000,
  minWithdrawal: 500,
  maxWithdrawal: 500000,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] =
    useState<Settings>(DEFAULT_SETTINGS);

  const [savedSettings, setSavedSettings] =
    useState<Settings>(DEFAULT_SETTINGS);

  const [popup, setPopup] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "lowkey-otp-admin-settings"
      );

      if (stored) {
        const parsed = JSON.parse(stored);

        const merged = {
          ...DEFAULT_SETTINGS,
          ...parsed,
        };

        setSettings(merged);
        setSavedSettings(merged);
      }
    } catch (error) {
      console.error("Settings load error:", error);
    }
  }, []);

  const updateSetting = (
    key: keyof Settings,
    value: boolean | number
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      if (settings.minDeposit < 0) {
        setPopup("Minimum deposit cannot be negative.");
        return;
      }

      if (settings.maxDeposit < settings.minDeposit) {
        setPopup(
          "Maximum deposit must be greater than minimum deposit."
        );
        return;
      }

      if (settings.minWithdrawal < 0) {
        setPopup("Minimum withdrawal cannot be negative.");
        return;
      }

      if (
        settings.maxWithdrawal <
        settings.minWithdrawal
      ) {
        setPopup(
          "Maximum withdrawal must be greater than minimum withdrawal."
        );
        return;
      }

     const response = await fetch(
  "/api/admin/settings",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  }
);

const data = await response.json();

if (!response.ok || !data.success) {
  throw new Error(
    data.message ||
      "Failed to save platform settings."
  );
}

setSavedSettings(settings);

setPopup(
  "Platform settings saved successfully."
);
    } catch (error) {
      console.error("Settings save error:", error);
      setPopup("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setSettings(savedSettings);
    setPopup("Unsaved changes have been discarded.");
  };

  const resetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setPopup(
      "Default settings loaded. Press Save Changes to apply them."
    );
  };

  const hasChanges =
    JSON.stringify(settings) !==
    JSON.stringify(savedSettings);

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
              Platform Settings
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

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
            Lowkey OTP • Admin
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-5xl">
            Platform Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Manage marketplace availability, deposits,
            withdrawals and platform limits.
          </p>
        </div>

        <div className="space-y-6">
          {/* Platform controls */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-black">
                ⚙️ Platform Controls
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Control the availability of major platform
                functions.
              </p>
            </div>

            <div className="space-y-3">
              <ToggleRow
                title="Maintenance Mode"
                description="Temporarily place the marketplace into maintenance mode."
                enabled={settings.maintenanceMode}
                danger
                onChange={(value) =>
                  updateSetting("maintenanceMode", value)
                }
              />

              <ToggleRow
                title="Marketplace"
                description="Allow users to access and purchase available services."
                enabled={settings.marketplaceEnabled}
                onChange={(value) =>
                  updateSetting(
                    "marketplaceEnabled",
                    value
                  )
                }
              />

              <ToggleRow
                title="Deposits"
                description="Allow users to add funds to their wallet."
                enabled={settings.depositsEnabled}
                onChange={(value) =>
                  updateSetting(
                    "depositsEnabled",
                    value
                  )
                }
              />

              <ToggleRow
                title="Withdrawals"
                description="Allow users to submit wallet withdrawal requests."
                enabled={settings.withdrawalsEnabled}
                onChange={(value) =>
                  updateSetting(
                    "withdrawalsEnabled",
                    value
                  )
                }
              />
            </div>
          </section>

          {/* Deposit limits */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-black">
                💳 Deposit Limits
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure the minimum and maximum amount a
                user can deposit.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <MoneyInput
                label="Minimum Deposit"
                value={settings.minDeposit}
                onChange={(value) =>
                  updateSetting("minDeposit", value)
                }
              />

              <MoneyInput
                label="Maximum Deposit"
                value={settings.maxDeposit}
                onChange={(value) =>
                  updateSetting("maxDeposit", value)
                }
              />
            </div>
          </section>

          {/* Withdrawal limits */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-black">
                🏦 Withdrawal Limits
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure the minimum and maximum withdrawal
                amount.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <MoneyInput
                label="Minimum Withdrawal"
                value={settings.minWithdrawal}
                onChange={(value) =>
                  updateSetting(
                    "minWithdrawal",
                    value
                  )
                }
              />

              <MoneyInput
                label="Maximum Withdrawal"
                value={settings.maxWithdrawal}
                onChange={(value) =>
                  updateSetting(
                    "maxWithdrawal",
                    value
                  )
                }
              />
            </div>
          </section>

          {/* Status */}
          <section className="rounded-3xl border border-blue-400/10 bg-blue-500/[0.05] p-5 md:p-7">
            <h2 className="font-black text-blue-300">
              🛡️ Current Configuration
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatusCard
                label="Marketplace"
                enabled={settings.marketplaceEnabled}
              />

              <StatusCard
                label="Deposits"
                enabled={settings.depositsEnabled}
              />

              <StatusCard
                label="Withdrawals"
                enabled={settings.withdrawalsEnabled}
              />

              <StatusCard
                label="Maintenance"
                enabled={settings.maintenanceMode}
                inverse
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {hasChanges && (
              <button
                onClick={resetChanges}
                disabled={saving}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3.5 font-bold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Discard Changes
              </button>
            )}

            <button
              onClick={resetDefaults}
              disabled={saving}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3.5 font-bold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              Reset Defaults
            </button>

            <button
              onClick={saveSettings}
              disabled={saving || !hasChanges}
              className="rounded-2xl bg-blue-600 px-7 py-3.5 font-black text-white transition hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>

          <p className="pb-5 text-center text-xs leading-5 text-slate-600">
            Settings are currently stored locally in this
            browser. We will connect them to Firebase when
            we build the secure platform settings API.
          </p>
        </div>
      </div>
    </main>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onChange,
  danger = false,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-white/5 bg-black/10 p-4 md:p-5">
      <div className="min-w-0">
        <p
          className={`font-bold ${
            danger && enabled
              ? "text-red-300"
              : "text-white"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500 md:text-sm">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition ${
          enabled
            ? danger
              ? "bg-red-500"
              : "bg-blue-600"
            : "bg-slate-700"
        }`}
      >
        <span
          className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </span>

      <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-black/20 focus-within:border-blue-500">
        <span className="flex items-center border-r border-white/10 px-4 text-sm font-bold text-slate-500">
          ₦
        </span>

        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) =>
            onChange(
              Number(event.target.value) || 0
            )
          }
          className="w-full bg-transparent px-4 py-3.5 text-white outline-none"
        />
      </div>
    </label>
  );
}

function StatusCard({
  label,
  enabled,
  inverse = false,
}: {
  label: string;
  enabled: boolean;
  inverse?: boolean;
}) {
  const active = inverse ? !enabled : enabled;

  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-black ${
          active
            ? "text-emerald-400"
            : "text-red-400"
        }`}
      >
        {active ? "ACTIVE" : "DISABLED"}
      </p>
    </div>
  );
}
