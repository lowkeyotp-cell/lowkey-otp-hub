"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getIdToken } from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function FundWalletPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showPopup = (
    title: string,
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setPopup({
      title,
      message,
      type,
    });
  };

  const handleFundWallet = async () => {
    const user = auth.currentUser;

    if (!user) {
      showPopup(
        "Login required",
        "Please sign in to your Lowkey OTP account before funding your wallet.",
        "error"
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);

      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 100
    ) {
      showPopup(
        "Invalid amount",
        "Please enter an amount of at least ₦100.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      setPopup(null);

      const idToken = await getIdToken(user);

      const response = await fetch(
        "/api/paystack/initialize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            amount: numericAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        showPopup(
          "Payment unavailable",
          data.message ||
            "We couldn't start your payment. Please try again.",
          "error"
        );
        return;
      }

      const PaystackPop =
        (await import("@paystack/inline-js")).default;

      const popup = new PaystackPop();

      popup.resumeTransaction(
        data.accessCode,
        {
          onSuccess: async (transaction: {
            reference: string;
          }) => {
            try {
              const freshToken =
                await getIdToken(user, true);

              const verifyResponse =
                await fetch(
                  "/api/paystack/verify",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                      Authorization:
                        `Bearer ${freshToken}`,
                    },
                    body: JSON.stringify({
                      reference:
                        transaction.reference,
                    }),
                  }
                );

              const verifyData =
                await verifyResponse.json();

              if (
                !verifyResponse.ok ||
                !verifyData.success
              ) {
                showPopup(
                  "Verification pending",
                  verifyData.message ||
                    "Your payment was received, but wallet verification is still pending.",
                  "info"
                );
                return;
              }

              showPopup(
                "Wallet funded",
                `Payment successful. ₦${Number(
                  verifyData.amount
                ).toLocaleString()} has been added to your wallet.`,
                "success"
              );

              setTimeout(() => {
                router.push("/dashboard");
              }, 1200);

            } catch (error) {
              console.error(
                "Verification error:",
                error
              );

              showPopup(
                "Verification pending",
                "Your payment was successful, but wallet verification is still pending.",
                "info"
              );
            }
          },

          onCancel: () => {
            showPopup(
              "Payment cancelled",
              "No money was added to your wallet.",
              "info"
            );
          },
        }
      );
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      showPopup(
        "Payment unavailable",
        "We couldn't start the payment. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const popupIcon =
    popup?.type === "success"
      ? "✓"
      : popup?.type === "error"
      ? "!"
      : "i";

  const popupIconStyle =
    popup?.type === "success"
      ? "bg-green-100 text-green-600"
      : popup?.type === "error"
      ? "bg-red-100 text-red-600"
      : "bg-blue-100 text-blue-600";

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div
              className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full ${popupIconStyle}`}
            >
              <span className="text-2xl font-black">
                {popupIcon}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              {popup.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {popup.message}
            </p>

            <button
              onClick={() => setPopup(null)}
              className="mt-6 w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white transition active:scale-95"
            >
              Continue
            </button>

          </div>
        </div>
      )}

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">

        <div className="mb-8">

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-md">
            <span className="text-xl font-black text-white">
              ₦
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Fund Wallet
          </h1>

          <p className="mt-2 text-gray-500">
            Add funds securely to your Lowkey OTP wallet.
          </p>

        </div>

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Amount
        </label>

        <input
          type="number"
          min="100"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          disabled={loading}
          className="mb-6 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
        />

        <button
          onClick={handleFundWallet}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Starting Payment..."
            : "Fund Wallet"}
        </button>

        <p className="mt-5 text-center text-xs text-gray-400">
          Secure payment processing
        </p>

      </div>

    </main>
  );
}
