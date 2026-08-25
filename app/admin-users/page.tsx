"use client";

import {
  useEffect,
  useState
} from "react";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function AdminUsersPage() {

  const [users, setUsers] =
    useState<any[]>([]);

  const loadUsers = async () => {

    try {

      const snapshot =
        await getDocs(
          collection(db, "users")
        );

      const usersData =
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

      setUsers(usersData);

    } catch (error) {

      console.log(error);

    }

  };

  useEffect(() => {

    loadUsers();

  }, []);

  const banUser = async (
    userId: string
  ) => {

    try {

      await updateDoc(
        doc(db, "users", userId),
        {
          banned: true
        }
      );

      alert("User Banned");

      loadUsers();

    } catch (error) {

      console.log(error);

    }

  };

  const unbanUser = async (
    userId: string
  ) => {

    try {

      await updateDoc(
        doc(db, "users", userId),
        {
          banned: false
        }
      );

      alert("User Unbanned");

      loadUsers();

    } catch (error) {

      console.log(error);

    }

  };

  return (

    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        Users Management
      </h1>

      <div className="grid gap-4">

        {users.map((user) => (

          <div
            key={user.id}
            className="bg-white p-6 rounded-3xl shadow-sm"
          >

            <p className="font-bold text-lg">
              {user.email}
            </p>

            <p className="text-gray-600 mt-2">
              Balance: ₦
              {user.balance || 0}
            </p>

            <p className="text-gray-500 text-sm mt-2">
              UID:
              {user.id}
            </p>

            <p className="mt-2 font-bold">

              Status:

              {user.banned
                ? " Banned"
                : " Active"}

            </p>

            <div className="flex gap-4 mt-5">

              <button
                onClick={() =>
                  banUser(user.id)
                }
                className="bg-red-600 text-white py-3 rounded-2xl font-bold w-full"
              >
                Ban User
              </button>

              <button
                onClick={() =>
                  unbanUser(user.id)
                }
                className="bg-green-600 text-white py-3 rounded-2xl font-bold w-full"
              >
                Unban User
              </button>

            </div>

          </div>

        ))}

      </div>

    </main>

  );

}
