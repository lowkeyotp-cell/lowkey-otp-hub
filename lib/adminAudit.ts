import { adminDb } from "@/lib/firebase-admin";

export async function adminAudit(
  adminUid: string,
  action: string,
  description: string,
  targetUid?: string
) {
  await adminDb.collection("adminAuditLogs").add({
    adminUid,
    action,
    description,
    targetUid: targetUid ?? null,
    createdAt: new Date(),
  });
}
