"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Order = {
  id: string;
  orderId?: string;
  uid?: string;
  phone?: string;
  number?: string;
  country?: string | number;
  service?: string | number;
  price?: number;
  amount?: number;
  status?: string;
  otp?: string;
  refundAmount?: number;
  createdAt?: unknown;
  cancelledAt?: unknown;
  provider?: string;
};

type Notice = {
  type: "success" | "error" | "info";
  title: string;
  message: string;
};

const normalizeStatus = (value: unknown) =>
  String(value ?? "unknown").trim().toLowerCase();

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const showNotice = (next: Notice) => setNotice(next);

  const loadOrders = async () => {
    try {
      setRefreshing(true);
      const snapshot = await getDocs(collection(db, "orders"));
      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as Order[];

      data.sort((a, b) => {
        const aTime = Number((a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0);
        const bTime = Number((b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0);
        return bTime - aTime;
      });

      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
      showNotice({
        type: "error",
        title: "Unable to load orders",
        message: "The order list could not be loaded. Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredOrders = useMemo(() => {
    const text = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = normalizeStatus(order.status);
      const searchable = [
        order.orderId,
        order.id,
        order.uid,
        order.phone,
        order.number,
        order.country,
        order.service,
        order.provider,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      return (
        (!text || searchable.includes(text)) &&
        (filter === "all" || status === filter)
      );
    });
  }, [orders, search, filter]);

  const waiting = orders.filter((order) => normalizeStatus(order.status) === "waiting").length;
  const completed = orders.filter((order) => normalizeStatus(order.status) === "completed").length;
  const cancelled = orders.filter((order) => normalizeStatus(order.status) === "cancelled").length;

  const formatMoney = (value: unknown) =>
    `₦${Number(value ?? 0).toLocaleString("en-NG")}`;

  const formatDate = (value: unknown) => {
    if (!value) return "—";
    try {
      if (typeof (value as { toDate?: unknown }).toDate === "function") {
        return (value as { toDate: () => Date }).toDate().toLocaleString("en-NG");
      }
      if (typeof value === "object" && value !== null && "seconds" in value) {
        return new Date(Number((value as { seconds: number }).seconds) * 1000).toLocaleString("en-NG");
      }
      const date = new Date(value as string | number | Date);
      return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-NG");
    } catch {
      return "—";
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "waiting":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "completed":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "cancelled":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const cancelOrder = async (order: Order) => {
    const orderId = String(order.orderId ?? order.id).trim();
    if (!orderId) {
      showNotice({ type: "error", title: "Missing order ID", message: "This order does not have a valid order ID." });
      return;
    }

    try {
      setCancelling(order.id);
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in to the admin account again.");

      const token = await user.getIdToken();
      const response = await fetch("/api/cancel-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(String(result.message ?? "The order could not be cancelled."));
      }

      setConfirmOrder(null);
      setSelectedOrder(null);
      showNotice({
        type: "success",
        title: "Order cancelled",
        message: `${orderId} was cancelled and the wallet refund was processed.`,
      });
      await loadOrders();
    } catch (error) {
      console.error("Cancel order error:", error);
      showNotice({
        type: "error",
        title: "Cancellation failed",
        message: error instanceof Error ? error.message : "The order could not be cancelled.",
      });
    } finally {
      setCancelling(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(37,99,235,0.18),_transparent_32%)]">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400">Secure Control Center</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">Orders Management</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">Monitor OTP orders, inspect customer details, and safely manage eligible cancellations and refunds.</p>
            </div>
            <button type="button" onClick={() => void loadOrders()} disabled={refreshing} className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 font-bold text-cyan-300 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50">
              {refreshing ? "Refreshing..." : "↻ Refresh Orders"}
            </button>
          </header>

          <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Total Orders", orders.length, "text-cyan-300"],
              ["Waiting", waiting, "text-amber-300"],
              ["Completed", completed, "text-emerald-300"],
              ["Cancelled", cancelled, "text-red-300"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-xl backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
                <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </section>

          <section className="mb-6 rounded-3xl border border-white/10 bg-white p-4 shadow-2xl md:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order ID, UID, phone, country or service..."
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
              />
              <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-cyan-500">
                <option value="all">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-950">Order Activity</h2>
              <p className="mt-1 text-sm text-slate-500">{filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"} displayed</p>
            </div>

            {loading ? (
              <div className="py-24 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
                <p className="mt-4 font-semibold text-slate-500">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-24 text-center">
                <div className="text-5xl">📦</div>
                <p className="mt-4 font-black text-slate-800">No orders found</p>
                <p className="mt-1 text-sm text-slate-500">Try changing your search or status filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const status = normalizeStatus(order.status);
                  const price = Number(order.price ?? order.amount ?? 0);
                  const phone = order.phone ?? order.number ?? "—";

                  return (
                    <div key={order.id} className="p-5 transition hover:bg-slate-50 md:p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="break-all font-black text-slate-950">#{order.orderId ?? order.id}</h3>
                            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyle(status)}`}>{status}</span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p><p className="mt-1 break-all font-bold text-slate-700">{phone}</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service</p><p className="mt-1 font-bold text-slate-700">{String(order.service ?? "—")}</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Country</p><p className="mt-1 font-bold text-slate-700">{String(order.country ?? "—")}</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</p><p className="mt-1 font-black text-cyan-700">{formatMoney(price)}</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OTP</p><p className="mt-1 font-black text-slate-700">{order.otp ? "Received" : "—"}</p></div>
                          </div>

                          <p className="mt-4 text-xs text-slate-400">Created: {formatDate(order.createdAt)}</p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button type="button" onClick={() => setSelectedOrder(order)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700">View Details</button>
                          {status === "waiting" && (
                            <button type="button" onClick={() => setConfirmOrder(order)} disabled={cancelling === order.id} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-50">Cancel & Refund</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-widest text-cyan-600">Order Details</p><h2 className="mt-1 break-all text-2xl font-black text-slate-950">#{selectedOrder.orderId ?? selectedOrder.id}</h2></div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-xl bg-slate-100 px-3 py-2 font-black text-slate-500 hover:bg-slate-200" aria-label="Close">✕</button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Status", selectedOrder.status ?? "—"],
                ["Phone", selectedOrder.phone ?? selectedOrder.number ?? "—"],
                ["Country", selectedOrder.country ?? "—"],
                ["Service", selectedOrder.service ?? "—"],
                ["Amount", formatMoney(selectedOrder.price ?? selectedOrder.amount)],
                ["OTP", selectedOrder.otp ?? "Not received"],
                ["Provider", selectedOrder.provider ?? "—"],
                ["User UID", selectedOrder.uid ?? "—"],
                ["Created", formatDate(selectedOrder.createdAt)],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 break-words text-sm font-bold text-slate-800">{String(value)}</p>
                </div>
              ))}
            </div>

            {normalizeStatus(selectedOrder.status) === "waiting" && (
              <button type="button" onClick={() => { setConfirmOrder(selectedOrder); setSelectedOrder(null); }} className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-4 font-black text-white shadow-lg shadow-red-600/20 hover:bg-red-700">Cancel & Refund Order</button>
            )}
          </div>
        </div>
      )}

      {confirmOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" onClick={() => { if (!cancelling) setConfirmOrder(null); }}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">⚠️</div>
            <div className="mt-5 text-center">
              <h2 className="text-2xl font-black text-slate-950">Cancel this order?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">This will cancel <span className="font-black text-slate-800">#{confirmOrder.orderId ?? confirmOrder.id}</span> and refund the order amount to the user&apos;s wallet.</p>
            </div>
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4"><div className="flex items-center justify-between gap-4"><span className="text-sm font-bold text-red-700">Refund amount</span><span className="text-lg font-black text-red-700">{formatMoney(confirmOrder.price ?? confirmOrder.amount)}</span></div></div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" disabled={!!cancelling} onClick={() => setConfirmOrder(null)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Keep Order</button>
              <button type="button" disabled={!!cancelling} onClick={() => void cancelOrder(confirmOrder)} className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{cancelling ? "Processing..." : "Yes, Cancel"}</button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed right-4 top-4 z-[80] w-[calc(100%-2rem)] max-w-md">
          <div className={`rounded-3xl border bg-white p-4 shadow-2xl ${notice.type === "success" ? "border-emerald-200" : notice.type === "error" ? "border-red-200" : "border-cyan-200"}`}>
            <div className="flex gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ${notice.type === "success" ? "bg-emerald-50 text-emerald-600" : notice.type === "error" ? "bg-red-50 text-red-600" : "bg-cyan-50 text-cyan-600"}`}>{notice.type === "success" ? "✓" : notice.type === "error" ? "!" : "i"}</div>
              <div className="min-w-0 flex-1"><p className="font-black text-slate-950">{notice.title}</p><p className="mt-1 text-sm leading-5 text-slate-500">{notice.message}</p></div>
              <button type="button" onClick={() => setNotice(null)} className="h-8 rounded-lg px-2 font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close notification">✕</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
