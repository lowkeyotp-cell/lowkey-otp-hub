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

    const amount = Number(body.amount);
    const bankCode = String(body.bankCode ?? "").trim();
    const bankName = String(body.bankName ?? "").trim();
    const accountNumber = String(body.accountNumber ?? "").trim();
    const accountName = String(body.accountName ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid withdrawal amount." },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        { success: false, message: "Invalid account number." },
        { status: 400 }
      );
    }

    if (!bankCode || !bankName || !accountName) {
      return NextResponse.json(
        { success: false, message: "Complete the bank details first." },
        { status: 400 }
      );
    }

    // Safety: this creates a withdrawal request only.
    // No money is transferred yet.

    const withdrawalRef = await adminDb
      .collection("withdrawals")
      .add({
        amount,
        currency: "NGN",
        bankCode,
        bankName,
        accountNumber,
        accountName,
        status: "pending",
        transferInitiated: false,
        createdAt: new Date(),
        createdBy: ADMIN_UID,
      });

await adminAudit(
  ADMIN_UID,
  "WITHDRAWAL_CREATED",
  `Created withdrawal request of ₦${amount.toLocaleString("en-NG")}`
);

    return NextResponse.json({
      success: true,
      message: "Withdrawal request created successfully.",
      withdrawalId: withdrawalRef.id,
      status: "pending",
    });
  } catch (error) {
    console.error("Withdrawal creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create withdrawal request.",
      },
      { status: 500 }
    );
  }
}
