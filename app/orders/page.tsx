"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  RefreshCw,
  Timer,
  XCircle,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleOtp, setVisibleOtp] = useState<Record<string, boolean>>({});
  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [expiring, setExpiring] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "orders"),
          where("uid", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const updatedData = await Promise.all(
          data.map(async (order: any) => {
            if (
              order.status === "waiting" &&
              order.orderId &&
              order.expiresAt
            ) {
              try {
                const idToken = await user.getIdToken();

                const response = await fetch(
                  "/api/buy-number-v2/otp",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                      orderId: order.orderId,
                    }),
                  }
                );

                const result = await response.json();

                if (result.success && result.code) {
                  return {
                    ...order,
                    otp: result.code,
                    status: "completed",
                  };
                }

                if (result.status === "cancelled") {
                  return {
                    ...order,
                    status: "cancelled",
                  };
                }

                if (result.status === "expired") {
                  return {
                    ...order,
                    status: "expired",
                  };
                }
              } catch (error) {
                console.log("V2 OTP refresh error:", error);
              }
            }

            return order;
          })
        );

        updatedData.sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setOrders(updatedData);
      } catch (error) {
        console.log("Orders loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const cancelOrder = async (orderId: string | number) => {
    if (!orderId) return;

    const user = auth.currentUser;

    if (!user) {
      setPopup({
        title: "Login Required",
        message:
          "Please log in again before cancelling this number.",
        type: "error",
      });
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this number? Your wallet will be refunded."
    );

    if (!confirmed) return;

    try {
      setCancelling(String(orderId));

      const idToken = await user.getIdToken();

      const response = await fetch("/api/buy-number-v2/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setPopup({
          title: "Cancellation Failed",
          message:
            result.message ||
            "Unable to cancel this number.",
          type: "error",
        });

        return;
      }

      setOrders((current) =>
        current.map((order) =>
          String(order.orderId) === String(orderId)
            ? {
                ...order,
                status: "cancelled",
                refundAmount:
                  result.refundAmount ?? order.price,
              }
            : order
        )
      );

      setPopup({
        title: "Number Cancelled",
        message: `Your number was cancelled successfully and ₦${Number(
          result.refundAmount ?? 0
        ).toLocaleString()} has been refunded to your wallet.`,
        type: "success",
      });
    } catch (error) {
      console.error("Cancel request error:", error);

      setPopup({
        title: "Network Error",
        message:
          "We couldn't complete the cancellation. Please try again.",
        type: "error",
      });
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";

    try {
      const date = timestamp?.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);

      return date.toLocaleString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getStatus = (status: string) => {
    if (status === "completed") {
      return {
        label: "Success",
        icon: CheckCircle2,
        className:
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    }

    if (status === "cancelled") {
      return {
        label: "Cancelled",
        icon: XCircle,
        className:
          "bg-red-500/10 text-red-400 border-red-500/20",
      };
    }

    if (status === "expired") {
      return {
        label: "Expired",
        icon: Clock3,
        className:
          "bg-orange-500/10 text-orange-400 border-orange-500/20",
      };
    }

    return {
      label: "Waiting",
      icon: Clock3,
      className:
        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };
  };

  const toggleOtp = (id: string) => {
    setVisibleOtp((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const copyOtp = async (otp: string, id: string) => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(id);

      setTimeout(() => {
        setCopied(null);
      }, 1500);
    } catch {
      setPopup({
        title: "Copy Failed",
        message: "Unable to copy the OTP.",
        type: "error",
      });
    }
  };

  const activeOrder = useMemo(() => {
    return orders.find(
      (order) =>
        order.status === "waiting" &&
        order.orderId &&
        order.expiresAt
    );
  }, [orders]);

  useEffect(() => {
    if (!activeOrder?.expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const getExpiryTime = () => {
      if (activeOrder.expiresAt?.seconds) {
        return activeOrder.expiresAt.seconds * 1000;
      }

      const parsed = new Date(activeOrder.expiresAt).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const updateCountdown = () => {
      const expiresAt = getExpiryTime();

      if (!expiresAt) {
        setRemainingSeconds(0);
        return;
      }

      setRemainingSeconds(
        Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      );
    };

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [activeOrder]);

  useEffect(() => {
    if (!activeOrder || remainingSeconds > 0 || expiring) return;

    const expireOrder = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setExpiring(true);

        const idToken = await user.getIdToken();

        const response = await fetch("/api/buy-number-v2/expire", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            orderId: activeOrder.orderId,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setOrders((current) =>
            current.map((order) =>
              String(order.orderId) === String(activeOrder.orderId)
                ? {
                    ...order,
                    status: "expired",
                    refundAmount:
                      result.refundAmount ?? order.price,
                  }
                : order
            )
          );

          setPopup({
            title: "Number Expired",
            message: `Your number expired and ₦${Number(
              result.refundAmount ?? activeOrder.price ?? 0
            ).toLocaleString()} has been refunded to your wallet.`,
            type: "success",
          });
        }
      } catch (error) {
        console.error("Expiry request error:", error);
      } finally {
        setExpiring(false);
      }
    };

    expireOrder();
  }, [activeOrder, remainingSeconds, expiring]);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  const successfulOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const waitingOrders = orders.filter(
    (order) => order.status === "waiting"
  ).length;

  const totalSpent = orders.reduce(
    (total, order) => total + Number(order.price || 0),
    0
  );

  return (
    <>
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                popup.type === "success"
                  ? "bg-emerald-500/10"
                  : "bg-red-500/10"
              }`}
            >
              {popup.type === "success" ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              ) : (
                <XCircle className="h-7 w-7 text-red-400" />
              )}
            </div>

            <h2 className="text-center text-xl font-black text-white">
              {popup.title}
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-gray-400">
              {popup.message}
            </p>

            <button
              onClick={() => setPopup(null)}
              className="mt-6 w-full rounded-2xl bg-cyan-500 py-3 font-bold text-white transition hover:bg-cyan-400"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-[#07080c] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Order Management
                </p>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  OTP Orders
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-gray-400">
                  View your purchased numbers, OTP codes, order status,
                  and transaction details.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
                <RefreshCw className="h-4 w-4 text-cyan-400" />
                Live updates every 5 seconds
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Orders
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {orders.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Successful
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-400">
                {successfulOrders}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Waiting
              </p>
              <p className="mt-2 text-2xl font-black text-yellow-400">
                {waitingOrders}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Spent
              </p>
              <p className="mt-2 text-xl font-black text-cyan-300">
                ₦{totalSpent.toLocaleString()}
              </p>
            </div>
          </div>

          {activeOrder && (
            <div className="mb-8 overflow-hidden rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.03] shadow-2xl shadow-cyan-950/20">
              <div className="border-b border-cyan-500/10 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-cyan-400" />
                      <h2 className="text-lg font-black text-white">
                        Active Order
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Waiting for your OTP
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    Waiting for OTP
                  </span>
                </div>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Service
                  </p>
                  <p className="mt-1 font-bold text-white">
                    {activeOrder.service || "Unknown Service"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Country
                  </p>
                  <p className="mt-1 font-bold text-white">
                    {activeOrder.country || "Unknown Country"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Number
                  </p>
                  <p className="mt-1 font-bold text-cyan-300">
                    {activeOrder.number || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Time Remaining
                  </p>
                  <p className="mt-1 font-mono text-2xl font-black text-yellow-400">
                    {formatCountdown(remainingSeconds)}
                  </p>
                </div>
              </div>

              <div className="border-t border-cyan-500/10 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Amount
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      ₦{Number(activeOrder.price || 0).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      If the number expires before an OTP arrives, the purchase
                      is cancelled and the amount is automatically refunded.
                    </p>
                  </div>

                  <button
                    onClick={() => cancelOrder(activeOrder.orderId)}
                    disabled={cancelling === String(activeOrder.orderId)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelling === String(activeOrder.orderId) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Cancel Number & Refund
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                Loading orders...
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
              <Phone className="mx-auto h-10 w-10 text-gray-600" />

              <h2 className="mt-4 text-xl font-bold text-white">
                No OTP orders yet
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Your purchased numbers and OTP history will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-[#0d1119] shadow-2xl md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-left">
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                          Service
                        </th>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                          Number
                        </th>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                          Amount
                        </th>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                          OTP
                        </th>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                          Date
                        </th>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((order) => {
                        const status = getStatus(order.status);
                        const StatusIcon = status.icon;
                        const rowId = String(order.id);

                        return (
                          <tr
                            key={rowId}
                            className="border-b border-white/5 transition hover:bg-white/[0.025]"
                          >
                            <td className="px-5 py-5">
                              <div>
                                <p className="font-bold text-white">
                                  {order.service || "Unknown Service"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {order.country || "Unknown Country"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <span className="font-semibold text-gray-200">
                                {order.number || "—"}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <span className="font-bold text-white">
                                ₦{Number(order.price || 0).toLocaleString()}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {status.label}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              {order.otp ? (
                                <div className="flex items-center gap-2">
                                  <span className="min-w-[75px] font-mono text-lg font-black tracking-[0.25em] text-cyan-300">
                                    {visibleOtp[rowId]
                                      ? order.otp
                                      : "••••••"}
                                  </span>

                                  <button
                                    onClick={() => toggleOtp(rowId)}
                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
                                    title={
                                      visibleOtp[rowId]
                                        ? "Hide OTP"
                                        : "View OTP"
                                    }
                                  >
                                    {visibleOtp[rowId] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>

                                  {visibleOtp[rowId] && (
                                    <button
                                      onClick={() =>
                                        copyOtp(order.otp, rowId)
                                      }
                                      className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-cyan-300"
                                      title="Copy OTP"
                                    >
                                      {copied === rowId ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-600">
                                  Waiting...
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-5 text-sm text-gray-400">
                              {formatDate(order.createdAt)}
                            </td>

                            <td className="px-5 py-5">
                              {order.status === "waiting" ? (
                                <button
                                  onClick={() =>
                                    cancelOrder(order.orderId)
                                  }
                                  disabled={
                                    cancelling ===
                                    String(order.orderId)
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {cancelling ===
                                  String(order.orderId) ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5" />
                                  )}
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-xs text-gray-600">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {orders.map((order) => {
                  const status = getStatus(order.status);
                  const StatusIcon = status.icon;
                  const rowId = String(order.id);

                  return (
                    <div
                      key={rowId}
                      className="rounded-3xl border border-white/10 bg-[#0d1119] p-5 shadow-xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white">
                            {order.service || "Unknown Service"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {order.country || "Unknown Country"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-gray-600">
                            Number
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-200">
                            {order.number || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-gray-600">
                            Amount
                          </p>
                          <p className="mt-1 text-sm font-bold text-white">
                            ₦{Number(order.price || 0).toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-gray-600">
                            OTP
                          </p>

                          {order.otp ? (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="font-mono text-base font-black tracking-[0.18em] text-cyan-300">
                                {visibleOtp[rowId]
                                  ? order.otp
                                  : "••••••"}
                              </span>

                              <button
                                onClick={() => toggleOtp(rowId)}
                                className="rounded-lg p-1.5 text-gray-500"
                              >
                                {visibleOtp[rowId] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>

                              {visibleOtp[rowId] && (
                                <button
                                  onClick={() =>
                                    copyOtp(order.otp, rowId)
                                  }
                                  className="rounded-lg p-1.5 text-gray-500"
                                >
                                  {copied === rowId ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-600">
                              Waiting...
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-gray-600">
                            Date
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      {order.status === "waiting" && (
                        <button
                          onClick={() =>
                            cancelOrder(order.orderId)
                          }
                          disabled={
                            cancelling === String(order.orderId)
                          }
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {cancelling === String(order.orderId) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Cancel Number & Refund
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
