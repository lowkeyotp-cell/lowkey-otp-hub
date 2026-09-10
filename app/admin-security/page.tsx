"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuditLog = {
  id: string;
  action?: string;
  adminUid?: string;
  targetUid?: string;
  description?: string;
  createdAt?: any;
};

export default function AdminSecurity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadLogs();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadLogs() {
    try {
      const { getAuth } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase");

      const user = getAuth().currentUser;

      if (!user) {
        throw new Error("Admin session not found.");
      }

      const token = await user.getIdToken();

      const res = await fetch("/api/admin/security", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load security activity."
        );
      }

      setLogs(data.logs || []);
    } catch (error) {
      console.error("Security logs error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() =>
            (window.location.href = "/admin-dashboard")
          }
          className="mb-6 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold"
        >
          ← Admin Dashboard
        </button>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
            Security Center
          </p>

          <h1 className="mt-2 text-4xl font-black">
            🛡️ Security & Audit
          </h1>

          <p className="mt-2 text-gray-400">
            Monitor administrative actions and important financial activity.
          </p>
        </div>

        <div className="rounded-3xl border border-red-400/20 bg-white/[0.04] p-6">
          <h2 className="text-xl font-black">
            Audit Activity
          </h2>

          {loading ? (
            <p className="mt-6 text-gray-400">
              Loading security activity...
            </p>
          ) : logs.length === 0 ? (
            <p className="mt-6 text-gray-500">
              No security activity recorded yet.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="font-bold">
                    {log.action || "Admin action"}
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    {log.description || "Administrative activity recorded."}
                  </p>

                  <p className="mt-2 text-xs text-gray-600">
                    Admin: {log.adminUid || "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
