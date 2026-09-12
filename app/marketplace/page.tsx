"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock?: number;
  imageUrl?: string | null;
};

const categories = [
  "All",
  "Facebook",
  "Instagram",
  "Discord",
  "LinkedIn",
  "X / Twitter",
  "Telegram",
  "WhatsApp",
  "TikTok",
  "Text / SMS",
  "Other",
];

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [successPurchase, setSuccessPurchase] = useState<{
    orderId: string;
    productName: string;
    price: number;
    credential: string;
    remainingBalance: number;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          "/api/marketplace/products",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (data.success) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error(
          "Marketplace products error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const userSnap = await getDoc(
          doc(db, "users", user.uid)
        );

        if (userSnap.exists()) {
          setBalance(Number(userSnap.data().balance || 0));
        }
      } catch (error) {
        console.error("Marketplace wallet error:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" ||
        product.category === category;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#090b10]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/"
              className="text-2xl font-black tracking-tight"
            >
              LOWKEY{" "}
              <span className="text-primary">
                OTP
              </span>
            </Link>

            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
              Marketplace
            </p>
          </div>

          <div className="flex max-w-[62%] flex-wrap justify-end gap-2 sm:max-w-none">
            <Link
              href="/marketplace"
              className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15 sm:px-4 sm:text-sm"
            >
              Marketplace
            </Link>

<Link
  href="/marketplace/orders"
  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/10 sm:px-4 sm:text-sm"
>
  View Orders
</Link>

            <Link
              href="/marketplace/transactions"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/10 sm:px-4 sm:text-sm"
            >
              Transactions
            </Link>

            <Link
              href="/profile"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/10 sm:px-4 sm:text-sm"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              LOWKEY Marketplace
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Discover digital products & services
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
              Browse products, choose what you need,
              and purchase securely using your LOWKEY
              wallet.
            </p>

            {/* Search */}
            <div className="mt-8">
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-2xl">
                <span className="mr-3 text-gray-500">
                  ⌕
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search marketplace..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-blue-500/20 bg-gradient-to-br from-[#101a33] to-[#0b1020] p-6 shadow-2xl shadow-blue-950/20">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Available Balance
              </p>

              <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-[11px] font-semibold text-green-400">
                ● Wallet
              </span>
            </div>

            <p className="mt-4 text-4xl font-black tracking-tight">
              ₦{balance.toLocaleString()}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Use your LOWKEY wallet balance to purchase marketplace products.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-lg font-bold">
            Categories
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Browse by service type
          </p>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => {
            const active = category === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Featured Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {products.length}{" "}
              {products.length === 1
                ? "product"
                : "products"}{" "}
              available
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-primary" />

            <p className="mt-4 text-sm text-gray-500">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
              🛍️
            </div>

            <h3 className="mt-5 text-lg font-bold">
              No products found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {products.length === 0
                ? "Products will appear here once they are added from the admin dashboard."
                : "Try another search or category."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-primary/30 hover:bg-white/[0.05]"
              >
{product.imageUrl && (
  <div className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
    <img
      src={product.imageUrl}
      alt={product.name}
      className="h-48 w-full object-cover"
    />
  </div>
)}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {product.category}
                    </span>

                    <h3 className="mt-4 text-lg font-bold">
                      {product.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-white">
                      ₦
                      {Number(
                        product.price
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="mt-4 min-h-[48px] text-sm leading-6 text-gray-400">
                  {product.description ||
                    "Digital product available through LOWKEY Marketplace."}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setCheckoutProduct(product);
                  }}
                  className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-90"
                >
                  Purchase
                </button>
              </div>
            ))}
          </div>
        )}
        {checkoutProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
            <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-[#0c1018] shadow-2xl">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                      Secure Checkout
                    </p>
                    <h3 className="mt-1 text-xl font-black">
                      Confirm purchase
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckoutProduct(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <span className="inline-flex rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {checkoutProduct.category}
                  </span>

                  <h4 className="mt-4 text-lg font-bold">
                    {checkoutProduct.name}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {checkoutProduct.description ||
                      "Digital product available through LOWKEY Marketplace."}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                    <span className="text-sm text-gray-500">
                      Total
                    </span>

                    <span className="text-2xl font-black">
                      ₦{Number(checkoutProduct.price).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Payment method
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold">
                      LOWKEY Wallet
                    </span>

                    <span className="text-sm font-bold text-primary">
                      ₦{balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutProduct(null)}
                    disabled={!!purchasingId}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!!purchasingId}
                    onClick={async () => {
                      try {
                        setMessage("");
                        setPurchasingId(checkoutProduct.id);

                        const user = auth.currentUser;

                        if (!user) {
                          setCheckoutProduct(null);
                          router.push("/login");
                          return;
                        }

                        const token = await user.getIdToken();

                        const response = await fetch(
                          "/api/marketplace/purchase",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              productId: checkoutProduct.id,
                            }),
                          }
                        );

                        const data = await response.json();

                        if (!response.ok || !data.success) {
                          throw new Error(
                            data.message || "Purchase failed."
                          );
                        }

                        setBalance(Number(data.remainingBalance || 0));

                        setProducts((currentProducts) =>
                          currentProducts
                            .map((product) =>
                              product.id === checkoutProduct.id
                                ? {
                                    ...product,
                                    stock: Math.max(
                                      Number(product.stock || 1) - 1,
                                      0
                                    ),
                                  }
                                : product
                            )
                            .filter(
                              (product) =>
                                product.id !== checkoutProduct.id ||
                                Number(product.stock || 0) > 0
                            )
                        );

                        setSuccessPurchase({
                          orderId: data.orderId,
                          productName: data.productName,
                          price: Number(data.price || 0),
                          credential: data.credential || "",
                          remainingBalance: Number(
                            data.remainingBalance || 0
                          ),
                        });

                        setCheckoutProduct(null);
                      } catch (error) {
                        console.error(
                          "Marketplace purchase error:",
                          error
                        );

                        setMessage(
                          error instanceof Error
                            ? error.message
                            : "Purchase failed."
                        );
                      } finally {
                        setPurchasingId(null);
                      }
                    }}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {purchasingId
                      ? "Processing..."
                      : "Confirm Purchase"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {successPurchase && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md">
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[32px] border border-green-400/20 bg-[#0a0f14] shadow-2xl shadow-green-950/30">

              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-green-500/10 to-transparent" />

              <div className="relative p-6 sm:p-8">

                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10 shadow-lg shadow-green-500/10">
                    <span className="text-4xl text-green-400">✓</span>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-400">
                    Payment Confirmed
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                    Purchase Successful
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Your product has been purchased successfully and is now available in your account.
                  </p>
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Product
                      </p>

                      <p className="mt-1 font-bold text-white">
                        {successPurchase.productName}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Paid
                      </p>

                      <p className="mt-1 font-black text-green-400">
                        ₦{successPurchase.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Order ID
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-gray-300">
                      {successPurchase.orderId}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.05] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Your Credential
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Keep this information secure.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            successPurchase.credential
                          );
                          setMessage("Credential copied successfully.");
                        } catch {
                          setMessage("Unable to copy credential.");
                        }
                      }}
                      className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/20"
                    >
                      Copy
                    </button>
                  </div>

                  <div className="mt-4 max-h-32 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="break-all font-mono text-sm leading-6 text-white">
                      {successPurchase.credential}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                  <span className="text-sm text-gray-500">
                    Remaining balance
                  </span>

                  <span className="font-black text-white">
                    ₦{successPurchase.remainingBalance.toLocaleString()}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessPurchase(null);
                      router.push("/marketplace/orders");
                    }}
                    className="rounded-xl bg-primary px-4 py-3 text-sm font-black text-black transition hover:opacity-90"
                  >
                    View Order
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuccessPurchase(null)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Done
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {message}
          </div>
        )}
      </section>
    </main>
  );
}
