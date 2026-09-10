import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

async function verifyAdmin(req: Request) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  try {
    const token = authorization.substring(7);
    const decoded = await getAuth().verifyIdToken(token);

    return decoded.uid === ADMIN_UID;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdmin(req);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const snapshot = await adminDb
      .collection("adminAuditLogs")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Security API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load security activity.",
      },
      { status: 500 }
    );
  }
}
