"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";

type AdminOrder = {
  id: string;
  orderId: string;
  uid: string;
  productId: string;
  productName: string;
  price: number;
  credential: string;
  status: string;
  createdAt: string | null;
};

type AdminTransaction = {
  id: string;
  uid: string;
  orderId: string;
  productId: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string | null;
};

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  sold: number;
  active: boolean;
  createdAt: string | null;
  imageUrl?: string | null;
};

const categories = [
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

export default function AdminMarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [adminTransactions, setAdminTransactions] =
    useState<AdminTransaction[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productCreated, setProductCreated] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [credentials, setCredentials] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");


  const getToken = async () => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Please sign in as admin.");
    }

    return user.getIdToken();
  };

  const loadAdminRecords = async () => {
    try {
      setRecordsLoading(true);

      const token = await getToken();

      const response = await fetch(
        "/api/admin/marketplace/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load marketplace records."
        );
      }

      setAdminOrders(data.orders || []);
      setAdminTransactions(data.transactions || []);
    } catch (error) {
      console.error(
        "Marketplace admin records error:",
        error
      );
    } finally {
      setRecordsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const response = await fetch(
        "/api/admin/marketplace/products",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load products."
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error("Marketplace products error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setLoading(false);
          return;
        }

        await loadProducts();
        await loadAdminRecords();
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleProduct = async (product: Product) => {
    try {
      const token = await getToken();

      const response = await fetch(
        "/api/admin/marketplace/products",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
            active: !product.active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update product."
        );
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, active: !product.active }
            : item
        )
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to update product."
      );
    }
  };

  const createProduct = async () => {
    const numericPrice = Number(price);

    if (!name.trim()) {
      alert("Enter a product name.");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      alert("Enter a valid price.");
      return;
    }

    try {
      setSaving(true);

      const user = auth.currentUser;

      if (!user) {
        throw new Error("Admin session not found. Please sign in again.");
      }

      const token = await user.getIdToken(true);

      let imageUrl = "";

      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          throw new Error("Please select an image file.");
        }

        if (imageFile.size > 10 * 1024 * 1024) {
          throw new Error("Image must be 10MB or smaller.");
        }

        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            const image = new Image();

            image.onload = () => {
              const maxSize = 900;
              const scale = Math.min(
                1,
                maxSize / Math.max(image.width, image.height)
              );

              const canvas = document.createElement("canvas");

              canvas.width = Math.max(
                1,
                Math.round(image.width * scale)
              );

              canvas.height = Math.max(
                1,
                Math.round(image.height * scale)
              );

              const context = canvas.getContext("2d");

              if (!context) {
                reject(new Error("Unable to process image."));
                return;
              }

              context.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
              );

              const compressed = canvas.toDataURL(
                "image/jpeg",
                0.72
              );

              if (compressed.length > 900000) {
                reject(
                  new Error(
                    "Image is still too large. Please choose a smaller image."
                  )
                );
                return;
              }

              resolve(compressed);
            };

            image.onerror = () => {
              reject(new Error("Unable to read the selected image."));
            };

            image.src = String(reader.result);
          };

          reader.onerror = () => {
            reject(new Error("Unable to read the selected image."));
          };

          reader.readAsDataURL(imageFile);
        });
      }

      const response = await fetch(
        "/api/admin/marketplace/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            category,
            price: numericPrice,
            description: description.trim(),
            credentials: credentials
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
            imageUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create product."
        );
      }

      setName("");
      setPrice("");
      setDescription("");
      setCredentials("");
      setImageFile(null);
      setImagePreview("");

      await loadProducts();

      setProductCreated(true);
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to create product."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {productCreated && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[30px] border border-green-400/20 bg-[#0a0f14] p-7 text-white shadow-2xl shadow-green-950/30">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10">
                <span className="text-4xl font-black text-green-400">
                  ✓
                </span>
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-400">
                Marketplace
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Product Created
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Your product has been successfully added to the LOWKEY Marketplace.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Status
                </span>

                <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-bold text-green-400">
                  ● Active
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setProductCreated(false)}
              className="mt-6 w-full rounded-xl bg-green-400 px-4 py-3 text-sm font-black text-black transition hover:bg-green-300"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-[#020617] text-white">
      <section className="mx-auto max-w-7xl p-5 sm:p-8">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
              Marketplace Management
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Marketplace
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Create and manage your marketplace products.
            </p>
          </div>

          <Link
            href="/admin-dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            ← Admin Dashboard
          </Link>
        </div>

        {/* Add Product */}
        <section className="rounded-3xl border border-cyan-400/20 bg-white/[0.03] p-6">
          <h2 className="text-xl font-black text-cyan-300">
            Add Product
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-300">
                Product Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImageFile(file);

                  if (file) {
                    setImagePreview(URL.createObjectURL(file));
                  } else {
                    setImagePreview("");
                  }
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-black"
              />

              {imagePreview && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG, WEBP or other image format. Maximum 5MB.
              </p>
            </div>


            <div>
              <label className="text-sm font-semibold text-gray-300">
                Product Name
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter product name"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400/50"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300">
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-[#020617]"
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300">
                Price (₦)
              </label>

              <input
                type="number"
                min="1"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="Enter price"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400/50"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300">
                Credentials
              </label>

              <textarea
                value={credentials}
                onChange={(event) =>
                  setCredentials(event.target.value)
                }
                placeholder="Enter credentials, one per line"
                rows={6}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400/50"
              />

              <p className="mt-2 text-xs text-gray-500">
                Enter each credential on a separate line. Stock is created automatically.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe the product"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400/50"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={createProduct}
            disabled={saving}
            className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
        </section>

        {/* Marketplace Overview */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
              Marketplace Overview
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              Control Center
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Products
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {products.length}
              </p>
            </div>

            <div className="rounded-2xl border border-green-400/20 bg-green-400/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                Available Stock
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {products.reduce(
                  (total, product) =>
                    total + Number(product.stock || 0),
                  0
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Items Sold
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {products.reduce(
                  (total, product) =>
                    total + Number(product.sold || 0),
                  0
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-400/20 bg-purple-400/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Orders
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {adminOrders.length}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                Revenue
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                ₦
                {adminOrders
                  .reduce(
                    (total, order) =>
                      total + Number(order.price || 0),
                    0
                  )
                  .toLocaleString("en-NG")}
              </p>
            </div>

          </div>
        </section>

        {/* Security Audit */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-red-500/20 bg-red-950/10">
          <div className="border-b border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-xl">
                ⚠️
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">
                  Security Audit
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Marketplace Security Center
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-400">
              Monitor marketplace controls, inventory exposure and product
              availability from the admin panel.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-red-500/20 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                Products
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {products.length}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Total marketplace products
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                Active
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {products.filter((product) => product.active).length}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Currently visible to customers
              </p>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Disabled
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {products.filter((product) => !product.active).length}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Customer access blocked
              </p>
            </div>
          </div>

          <div className="mx-6 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-black text-red-300">
              🛡️ ADMIN SECURITY MODE
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Product status changes are restricted to the authenticated
              marketplace administrator.
            </p>
          </div>
        </section>

        {/* Admin Orders + Transactions */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* Orders */}
          <div className="rounded-3xl border border-orange-500/20 bg-orange-950/10 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                  Marketplace Orders
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Orders
                </h2>
              </div>

              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-300">
                {adminOrders.length}
              </span>
            </div>

            {recordsLoading ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-gray-500">
                Loading orders...
              </div>
            ) : adminOrders.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-center">
                <p className="text-sm font-bold text-gray-300">
                  No marketplace orders yet.
                </p>
              </div>
            ) : (
              <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {adminOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">
                          {order.productName}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-gray-500">
                          Order: {order.orderId}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-green-400/10 px-2 py-1 text-[10px] font-black uppercase text-green-400">
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase text-gray-500">
                          Amount
                        </p>
                        <p className="mt-1 text-sm font-black text-orange-300">
                          ₦{order.price.toLocaleString("en-NG")}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase text-gray-500">
                          User
                        </p>
                        <p className="mt-1 truncate text-[10px] font-bold text-gray-300">
                          {order.uid}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-[10px] text-gray-600">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString("en-NG")
                        : "Unknown date"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions */}
          <div className="rounded-3xl border border-green-500/20 bg-green-950/10 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-green-400">
                  Wallet Activity
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Transactions
                </h2>
              </div>

              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-300">
                {adminTransactions.length}
              </span>
            </div>

            {recordsLoading ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-gray-500">
                Loading transactions...
              </div>
            ) : adminTransactions.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-center">
                <p className="text-sm font-bold text-gray-300">
                  No marketplace transactions yet.
                </p>
              </div>
            ) : (
              <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {adminTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black uppercase text-white">
                          {transaction.type}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          Order: {transaction.orderId || "N/A"}
                        </p>
                      </div>

                      <span className="text-sm font-black text-green-400">
                        ₦{transaction.amount.toLocaleString("en-NG")}
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase text-gray-500">
                        User
                      </p>
                      <p className="mt-1 truncate text-[10px] font-bold text-gray-300">
                        {transaction.uid}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-green-400/10 px-2 py-1 text-[10px] font-black uppercase text-green-400">
                        {transaction.status}
                      </span>

                      <p className="text-[10px] text-gray-600">
                        {transaction.createdAt
                          ? new Date(
                              transaction.createdAt
                            ).toLocaleString("en-NG")
                          : "Unknown date"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>

        {/* Products */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-black">
              Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {products.length} product
              {products.length === 1 ? "" : "s"}
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-gray-400">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="text-lg font-bold">
                No products yet
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Create your first marketplace product above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="mb-4 h-40 w-full rounded-2xl object-cover"
                        />
                      )}

                      <h3 className="text-lg font-black">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs uppercase tracking-wider text-cyan-400">
                        {product.category}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        product.active
                          ? "bg-green-400/10 text-green-400"
                          : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {product.active
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-400">
                    {product.description ||
                      "No description provided."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        Available
                      </p>
                      <p className="mt-1 text-xl font-black text-white">
                        {Number(product.stock || 0)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-orange-400/10 bg-orange-400/5 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                        Sold
                      </p>
                      <p className="mt-1 text-xl font-black text-white">
                        {Number(product.sold || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-red-400">
                        ⚠ Security Control
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Control customer access to this product.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                        product.active
                          ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {product.active
                        ? "⚠ Disable"
                        : "✓ Activate"}
                    </button>
                  </div>

                  <p className="mt-5 text-2xl font-black text-white">
                    ₦
                    {Number(
                      product.price
                    ).toLocaleString("en-NG")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </section>
    </main>
    </>
  );
}
