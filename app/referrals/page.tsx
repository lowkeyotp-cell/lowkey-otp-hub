"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  Gift,
  Users,
  Wallet,
} from "lucide-react";
import { auth } from "@/lib/firebase";

type Referral = {
  id: string;
  referredUserId: string;
  referredEmail: string;
  referredName: string;
  status: string;
  reward: number;
  qualifyingDeposit: number;
  createdAt: string | null;
  qualifiedAt: string | null;
  rewardedAt: string | null;
};

export default function ReferralsPage() {
  const router = useRouter();

  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [pendingReferrals, setPendingReferrals] = useState(0);
  const [creditedReferrals, setCreditedReferrals] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          router.push("/login");
          return;
        }

        const idToken = await user.getIdToken();

        const response = await fetch("/api/referrals/list", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load referrals"
          );
        }

        setReferralCode(result.referralCode || "");
        setReferrals(result.referrals || []);

        setTotalReferrals(
          result.totals?.totalReferrals || 0
        );

        setPendingReferrals(
          result.totals?.pendingReferrals || 0
        );

        setCreditedReferrals(
          result.totals?.creditedReferrals || 0
        );

        setTotalEarned(
          result.totals?.totalEarned || 0
        );
      } catch (error) {
        console.error("Referral Center error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReferrals();
  }, [router]);

  const referralLink =
    typeof window !== "undefined" && referralCode
      ? `${window.location.origin}/register?ref=${referralCode}`
      : "";

  const copyText = async (
    text: string,
    type: string
  ) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(type);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleDateString(
        "en-NG",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "—";
    }
  };

  const getStatus = (status: string) => {
    if (status === "completed") {
      return {
        label: "Credited",
        icon: CheckCircle,
        className:
          "bg-green-500/10 text-green-400 border-green-500/20",
      };
    }

    return {
      label: "Pending",
      icon: Clock,
      className:
        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Referral Center
            </h1>

            <p className="text-sm text-gray-400">
              Invite friends and earn rewards
            </p>
          </div>
        </div>

        {/* Reward Notice */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Gift size={22} />
            </div>

            <div>
              <h2 className="font-semibold">
                🎁 Referral Reward
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-400">
                Share your referral code and earn{" "}
                <span className="font-semibold text-white">
                  ₦100
                </span>{" "}
                when a referred user makes their first
                successful deposit of{" "}
                <span className="font-semibold text-white">
                  ₦500 or more
                </span>
                .
              </p>

              <p className="mt-1 text-xs text-yellow-400">
                Deposits below ₦500 do not qualify for a
                referral reward.
              </p>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="mb-2 text-sm text-gray-400">
            Your referral code
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-black/30 px-4">
              <span className="text-xl font-bold tracking-[0.25em] text-white">
                {loading ? "LOADING..." : referralCode || "—"}
              </span>
            </div>

            <button
              onClick={() =>
                copyText(referralCode, "code")
              }
              disabled={!referralCode}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy size={18} />

              {copied === "code"
                ? "Copied!"
                : "Copy Code"}
            </button>
          </div>

          <p className="mt-3 break-all text-xs text-gray-500">
            {referralLink || "Referral link loading..."}
          </p>

          <button
            onClick={() =>
              copyText(referralLink, "link")
            }
            disabled={!referralLink}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 disabled:opacity-50"
          >
            <Copy size={16} />

            {copied === "link"
              ? "Referral link copied!"
              : "Copy referral link"}
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <Users
              size={20}
              className="mb-3 text-blue-400"
            />

            <p className="text-2xl font-bold">
              {totalReferrals}
            </p>

            <p className="text-xs text-gray-500">
              Total referrals
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <Clock
              size={20}
              className="mb-3 text-yellow-400"
            />

            <p className="text-2xl font-bold">
              {pendingReferrals}
            </p>

            <p className="text-xs text-gray-500">
              Pending
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <CheckCircle
              size={20}
              className="mb-3 text-green-400"
            />

            <p className="text-2xl font-bold">
              {creditedReferrals}
            </p>

            <p className="text-xs text-gray-500">
              Credited
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <Wallet
              size={20}
              className="mb-3 text-purple-400"
            />

            <p className="text-2xl font-bold">
              ₦{totalEarned.toLocaleString()}
            </p>

            <p className="text-xs text-gray-500">
              Total earned
            </p>
          </div>

        </div>

        {/* Referral List */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">

          <div className="border-b border-white/10 p-5">
            <h2 className="font-semibold">
              Your Referrals
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track your invited users and rewards.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading referrals...
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-10 text-center">
              <Users
                size={36}
                className="mx-auto mb-3 text-gray-600"
              />

              <p className="font-medium">
                No referrals yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Share your referral link to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-white/10 bg-white/[0.02]">
                  <tr className="text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-5 py-4">
                      Email
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Deposit
                    </th>

                    <th className="px-5 py-4">
                      Reward
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {referrals.map((referral) => {
                    const status =
                      getStatus(referral.status);

                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={referral.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium">
                              {referral.referredName ||
                                "User"}
                            </p>

                            <p className="mt-1 max-w-[180px] truncate text-xs text-gray-600">
                              {referral.referredUserId}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-400">
                          {referral.referredEmail ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
                          >
                            <StatusIcon size={13} />
                            {status.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {referral.qualifyingDeposit > 0
                            ? `₦${referral.qualifyingDeposit.toLocaleString()}`
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold">
                          {referral.reward > 0
                            ? `₦${referral.reward.toLocaleString()}`
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-400">
                          {formatDate(
                            referral.createdAt
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
