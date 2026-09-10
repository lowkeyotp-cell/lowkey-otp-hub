"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type User = {
  id: string;
  email?: string;
  balance?: number;
  banned?: boolean;
  createdAt?: any;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyUser, setBusyUser] = useState<string | null>(null);

const [walletAmount, setWalletAmount] = useState("");
const [walletAction, setWalletAction] = useState<
  "add" | "remove" | null
>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(
        collection(db, "users")
      );

      const usersData = snapshot.docs.map(
        (userDoc) => ({
          id: userDoc.id,
          ...userDoc.data(),
        })
      ) as User[];

      setUsers(usersData);
    } catch (error) {
      console.error(
        "Failed to load users:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) return users;

    return users.filter((user) =>
      `${user.email ?? ""} ${user.id}`
        .toLowerCase()
        .includes(term)
    );
  }, [users, search]);

  const changeBanStatus = async (
    userId: string,
    banned: boolean
  ) => {
    try {
      setBusyUser(userId);

      const user = auth.currentUser;

      if (!user) {
        throw new Error(
          "Please log in as admin."
        );
      }

      const idToken = await user.getIdToken();

      const res = await fetch(
        "/api/admin/users/status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId,
            banned,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update user status."
        );
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? {
                ...user,
                banned,
              }
            : user
        )
      );
    } catch (error: any) {
      console.error(
        "Ban status update failed:",
        error
      );

      alert(
        error.message ||
          "Unable to update this user's status."
      );
    } finally {
      setBusyUser(null);
    }
  };

  const adjustWallet = async (
    userId: string,
    action: "add" | "remove"
  ) => {
    const value = Number(walletAmount);

    if (!Number.isFinite(value) || value <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      alert("Please log in as admin.");
      return;
    }

    try {
      setWalletAction(action);

      const idToken = await user.getIdToken();

      const res = await fetch(
        "/api/admin/users/balance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId,
            action,
            amount: value,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update wallet."
        );
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? {
                ...user,
                balance: data.newBalance,
              }
            : user
        )
      );

      setWalletAmount("");

      alert(
        action === "add"
          ? "Money added successfully."
          : "Money removed successfully."
      );
    } catch (error: any) {
      console.error(
        "Wallet adjustment failed:",
        error
      );

      alert(
        error.message ||
          "Unable to update wallet."
      );
    } finally {
      setWalletAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-4xl font-bold text-primary">
              Users Management
            </h1>

            <p className="text-gray-500 mt-2">
              Accounts, balances, bans and user activity.
            </p>
          </div>

          <div className="bg-white rounded-2xl px-5 py-3 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Users
            </p>

            <p className="text-2xl font-bold text-primary">
              {users.length}
            </p>
          </div>

        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">

          <input
            type="text"
            placeholder="Search by email or UID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 outline-none focus:border-primary focus:bg-white"
          />

        </div>

        {loading ? (

          <div className="bg-white rounded-3xl p-10 text-center">
            <p className="text-gray-500">
              Loading users...
            </p>
          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="bg-white rounded-3xl p-10 text-center">
            <p className="text-gray-500">
              No users found.
            </p>
          </div>

        ) : (

          <div className="grid gap-5">

            {filteredUsers.map((user) => {

              const balance =
                Number(user.balance ?? 0);

              const banned =
                Boolean(user.banned);

              const busy =
                busyUser === user.id;

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black">
                          {(user.email?.[0] ?? "U")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="font-bold text-lg text-gray-900 truncate">
                            {user.email ||
                              "No email"}
                          </p>

                          <p className="text-xs text-gray-400 break-all mt-1">
                            UID: {user.id}
                          </p>

                        </div>

                      </div>

                    </div>

                    <div
                      className={
                        banned
                          ? "rounded-full bg-red-100 text-red-700 px-4 py-2 text-sm font-bold"
                          : "rounded-full bg-green-100 text-green-700 px-4 py-2 text-sm font-bold"
                      }
                    >
                      {banned
                        ? "🔴 Banned"
                        : "🟢 Active"}
                    </div>

                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-6">

                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        Wallet Balance
                      </p>

                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        ₦
                        {balance.toLocaleString(
                          "en-NG"
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        Account Status
                      </p>

                      <p className="font-bold text-gray-900 mt-2">
                        {banned
                          ? "Access Restricted"
                          : "Account Active"}
                      </p>
                    </div>

                  </div>

                  <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">

                    <p className="text-sm font-bold text-gray-900">
                      Wallet Adjustment
                    </p>

                    <div className="mt-3 flex flex-col md:flex-row gap-3">

                      <input
                        type="number"
                        min="1"
                        placeholder="Amount (₦)"
                        value={walletAmount}
                        onChange={(e) =>
                          setWalletAmount(e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 outline-none"
                      />

                      <button
                        disabled={walletAction !== null}
                        onClick={() =>
                          adjustWallet(user.id, "add")
                        }
                        className="w-full rounded-xl bg-green-600 py-3 font-bold text-white disabled:opacity-50"
                      >
                        {walletAction === "add"
                          ? "Adding..."
                          : "Add Money"}
                      </button>

                      <button
                        disabled={walletAction !== null}
                        onClick={() =>
                          adjustWallet(user.id, "remove")
                        }
                        className="w-full rounded-xl bg-orange-600 py-3 font-bold text-white disabled:opacity-50"
                      >
                        {walletAction === "remove"
                          ? "Removing..."
                          : "Remove Money"}
                      </button>

                    </div>

                  </div>

                  <div className="flex flex-col md:flex-row gap-3 mt-6">

                    {!banned ? (

                      <button
                        disabled={busy}
                        onClick={() =>
                          changeBanStatus(
                            user.id,
                            true
                          )
                        }
                        className="w-full rounded-2xl bg-red-600 py-3.5 text-white font-bold disabled:opacity-50"
                      >
                        {busy
                          ? "Updating..."
                          : "Ban User"}
                      </button>

                    ) : (

                      <button
                        disabled={busy}
                        onClick={() =>
                          changeBanStatus(
                            user.id,
                            false
                          )
                        }
                        className="w-full rounded-2xl bg-green-600 py-3.5 text-white font-bold disabled:opacity-50"
                      >
                        {busy
                          ? "Updating..."
                          : "Unban User"}
                      </button>

                    )}

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </div>

    </main>
  );
}
