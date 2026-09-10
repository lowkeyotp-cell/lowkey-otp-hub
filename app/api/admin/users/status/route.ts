import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { adminAudit } from "@/lib/adminAudit";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.uid !== ADMIN_UID) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const userId = String(body.userId ?? "").trim();
    const banned = Boolean(body.banned);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    if (userId === ADMIN_UID) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot ban the admin account.",
        },
        { status: 400 }
      );
    }

    await adminDb
      .collection("users")
      .doc(userId)
      .update({
        banned,
      });

    await adminAudit(
      ADMIN_UID,
      banned ? "BAN_USER" : "UNBAN_USER",
      banned
        ? `Banned user ${userId}`
        : `Unbanned user ${userId}`,
      userId
    );

    return NextResponse.json({
      success: true,
      message: banned
        ? "User banned successfully."
        : "User unbanned successfully.",
    });
  } catch (error) {
    console.error("Admin user status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update user status.",
      },
      { status: 500 }
    );
  }
}
