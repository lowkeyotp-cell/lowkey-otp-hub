import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { adminAudit } from "@/lib/adminAudit";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

export async function GET(req: Request) {
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

    const snapshot = await adminDb
      .collection("withdrawals")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        amount: Number(data.amount ?? 0),
        currency: data.currency ?? "NGN",
        bankCode: data.bankCode ?? "",
        bankName: data.bankName ?? "",
        accountNumber: data.accountNumber ?? "",
        accountName: data.accountName ?? "",
        status: data.status ?? "pending",
        transferInitiated: data.transferInitiated === true,
        createdAt: data.createdAt ?? null,
        createdBy: data.createdBy ?? null,
      };
    });

await adminAudit(
  ADMIN_UID,
  "VIEW_WITHDRAWALS",
  "Viewed withdrawal transaction history"
);

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Withdrawal transactions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load withdrawal transactions.",
      },
      { status: 500 }
    );
  }
}
