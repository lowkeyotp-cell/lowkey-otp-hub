"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type Bank = {
  id: number;
  name: string;
  code: string;
  active: boolean;
};

export default function AdminWithdraw() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [available, setAvailable] = useState(0);

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    async (user: User | null) => {
      if (!user) {
        setMessage("Please log in as admin.");
        setLoading(false);
        return;
      }

      try {
        await loadBanks(user);
        await loadFinance();
      } catch (error) {
        console.error("Withdrawal page loading error:", error);
      }
    }
  );

  return () => unsubscribe();
}, []);

  async function token() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in as admin.");
  }

  return user.getIdToken();
}

  async function loadBanks(user?: User) {
    try {
     const idToken = await (user ?? auth.currentUser)?.getIdToken();

if (!idToken) {
  throw new Error("Please log in as admin.");
}

      const res = await fetch("/api/admin/withdraw/banks", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setBanks(
        (data.banks ?? []).filter(
          (bank: Bank) => bank.active
        )
      );
    } catch (error: any) {
      setMessage(error.message || "Unable to load banks.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFinance() {
    try {
      const res = await fetch("/api/admin/finance");
      const data = await res.json();

      if (data.success) {
        setAvailable(Number(data.withdrawable ?? 0));
      }
    } catch {
      console.log("Unable to load finance.");
    }
  }

  async function verifyAccount() {
    setMessage("");
    setSuccess(false);
    setAccountName("");

    if (!bankCode) {
      setMessage("Select a bank first.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setMessage("Enter a valid 10-digit account number.");
      return;
    }

    try {
      setVerifying(true);

      const idToken = await token();

      const res = await fetch(
        "/api/admin/withdraw/verify-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            accountNumber,
            bankCode,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setAccountName(data.accountName);
      setMessage("Account verified successfully.");
      setSuccess(true);
    } catch (error: any) {
      setMessage(
        error.message || "Account verification failed."
      );
    } finally {
      setVerifying(false);
    }
  }

  async function createWithdrawal() {
    setMessage("");
    setSuccess(false);

    const value = Number(amount);

    if (!accountName) {
      setMessage("Verify the account first.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Enter a valid amount.");
      return;
    }

    if (value > available) {
      setMessage(
        "Withdrawal amount is greater than the available amount."
      );
      return;
    }

    const bank = banks.find(
      (item) => item.code === bankCode
    );

    if (!bank) {
      setMessage("Select a valid bank.");
      return;
    }

    const confirmed = window.confirm(
      `Create withdrawal request for ₦${value.toLocaleString(
        "en-NG"
      )} to ${accountName}?`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);

      const idToken = await token();

      const res = await fetch("/api/admin/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          amount: value,
          bankCode,
          bankName: bank.name,
          accountNumber,
          accountName,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setSuccess(true);
      setMessage(
        `Withdrawal request created successfully. ID: ${data.withdrawalId}`
      );

      setAmount("");
    } catch (error: any) {
      setMessage(
        error.message ||
          "Unable to create withdrawal request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-xl">

        <button
          onClick={() =>
            (window.location.href = "/admin-finance")
          }
          className="mb-6 rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-bold"
        >
          ← Finance Center
        </button>

        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-green-400">
            Admin Finance
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Withdraw To Bank
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Verify the destination account before creating
            a withdrawal request.
          </p>
        </div>

        <div className="mb-5 rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-950 to-gray-950 p-6">
          <p className="text-sm text-gray-400">
            Available To Withdraw
          </p>

          <p className="mt-2 text-4xl font-black text-green-400">
            ₦
            {available.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-950 p-5">

          <label className="text-sm font-bold">
            Select Bank
          </label>

          <select
            value={bankCode}
            onChange={(e) => {
              setBankCode(e.target.value);
              setAccountName("");
              setMessage("");
            }}
            disabled={loading}
            className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 p-4 outline-none"
          >
            <option value="">
              {loading
                ? "Loading banks..."
                : "Choose bank"}
            </option>

            {banks.map((bank) => (
              <option
                key={`${bank.code}-${bank.id}`}
                value={bank.code}
              >
                {bank.name}
              </option>
            ))}
          </select>

          <label className="mt-5 block text-sm font-bold">
            Account Number
          </label>

          <input
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10)
              );
              setAccountName("");
            }}
            inputMode="numeric"
            placeholder="Enter 10-digit account number"
            className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 p-4 outline-none"
          />

          <button
            onClick={verifyAccount}
            disabled={verifying}
            className="mt-3 w-full rounded-2xl bg-blue-500 py-4 font-black disabled:opacity-50"
          >
            {verifying
              ? "Verifying Account..."
              : "Verify Account"}
          </button>

          {accountName && (
            <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-950/30 p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Verified Account Name
              </p>

              <p className="mt-1 font-black text-green-400">
                {accountName}
              </p>
            </div>
          )}

          <label className="mt-5 block text-sm font-bold">
            Withdrawal Amount
          </label>

          <input
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value.replace(/[^\d.]/g, "")
              )
            }
            inputMode="decimal"
            placeholder="₦0.00"
            className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 p-4 outline-none"
          />

          <button
            onClick={createWithdrawal}
            disabled={
              submitting ||
              !accountName ||
              available <= 0
            }
            className="mt-5 w-full rounded-2xl bg-green-500 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Creating Request..."
              : "Create Withdrawal Request"}
          </button>

          {message && (
            <div
              className={`mt-4 rounded-2xl border p-4 text-sm ${
                success
                  ? "border-green-500/20 bg-green-950/30 text-green-400"
                  : "border-gray-800 bg-gray-900 text-gray-300"
              }`}
            >
              {message}
            </div>
          )}

        </div>

        <p className="mt-5 text-center text-xs text-gray-600">
          Withdrawal requests are recorded securely.
          Bank transfer execution is currently disabled.
        </p>

      </div>
    </main>
  );
}
