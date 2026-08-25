"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getIdToken } from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function FundWalletPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFundWallet = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first.");
      router.push("/login");
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 100) {
      alert("Enter at least ₦100.");
      return;
    }

    try {
      setLoading(true);

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
        alert(
          data.message ||
            "Unable to initialize payment."
        );
        return;
      }

      // Load Paystack only in the browser.
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
                alert(
                  verifyData.message ||
                    "Payment succeeded, but verification is pending."
                );
                return;
              }

              alert(
                `Payment successful! ₦${Number(
                  verifyData.amount
                ).toLocaleString()} was added to your wallet.`
              );

              router.push("/dashboard");
            } catch (error) {
              console.error(
                "Verification error:",
                error
              );

              alert(
                "Payment succeeded, but wallet verification is pending."
              );
            }
          },

          onCancel: () => {
            alert("Payment cancelled.");
          },
        }
      );
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      alert("Unable to start payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          Fund Wallet
        </h1>

        <p className="text-gray-500 mb-6">
          Add money to your OTP Marketplace wallet.
        </p>

        <input
          type="number"
          min="100"
          placeholder="Enter Amount"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          className="w-full border border-gray-300 p-4 rounded-2xl mb-6"
        />

        <button
          onClick={handleFundWallet}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50"
        >
          {loading
            ? "Starting Payment..."
            : "Fund Wallet"}
        </button>

      </div>
    </main>
  );
}
