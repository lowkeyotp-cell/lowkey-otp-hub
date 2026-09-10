import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { adminAudit } from "@/lib/adminAudit";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.uid !== ADMIN_UID) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const userId = String(body.userId ?? "").trim();
    const action = String(body.action ?? "").trim();
    const amount = Number(body.amount);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        { status: 400 }
      );
    }

    if (action !== "add" && action !== "remove") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid wallet action.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid amount.",
        },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(userId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      const currentBalance = Number(
        userSnap.data()?.balance ?? 0
      );

      if (!Number.isFinite(currentBalance)) {
        throw new Error("INVALID_BALANCE");
      }

      const newBalance =
        action === "add"
          ? currentBalance + amount
          : currentBalance - amount;

      if (newBalance < 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      transaction.update(userRef, {
        balance: newBalance,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        previousBalance: currentBalance,
        newBalance,
      };
    });

    await adminAudit(
      ADMIN_UID,
      action === "add"
        ? "ADD_USER_BALANCE"
        : "REMOVE_USER_BALANCE",
      `${action === "add" ? "Added" : "Removed"} ₦${amount.toLocaleString(
        "en-NG"
      )} ${action === "add" ? "to" : "from"} user wallet`,
      userId
    );

    return NextResponse.json({
      success: true,
      message:
        action === "add"
          ? "Money added successfully."
          : "Money removed successfully.",
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    console.error("Admin wallet adjustment error:", error);

    if (error?.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    if (error?.message === "INVALID_BALANCE") {
      return NextResponse.json(
        {
          success: false,
          message: "User wallet balance is invalid.",
        },
        { status: 400 }
      );
    }

    if (error?.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        {
          success: false,
          message: "User does not have enough balance.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update user wallet.",
      },
      { status: 500 }
    );
  }
}
