import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const idToken = authorization.substring(7);
    const decodedToken = await getAuth().verifyIdToken(idToken);

   let reference = "";

try {
  const body = await req.json();
  reference = body.reference;
} catch {
  return NextResponse.json(
    {
      success: false,
      message: "Payment reference missing.",
    },
    { status: 400 }
  );
}

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Payment reference is required" },
        { status: 400 }
      );
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    const paystackData = await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      !paystackData?.status ||
      paystackData?.data?.status !== "success"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment has not been verified as successful",
        },
        { status: 400 }
      );
    }

    const payment = paystackData.data;

    // Paystack amounts are returned in kobo.
    const paidAmount = Number(payment.amount) / 100;

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // Make sure this payment belongs to the logged-in user.
    const metadataUid = payment.metadata?.uid;

    if (metadataUid && metadataUid !== decodedToken.uid) {
      return NextResponse.json(
        { success: false, message: "Payment ownership mismatch" },
        { status: 403 }
      );
    }

    const transactionRef = adminDb
      .collection("walletTransactions")
      .doc(reference);

    const userRef = adminDb
      .collection("users")
      .doc(decodedToken.uid);

    const result = await adminDb.runTransaction(async (transaction) => {
      const transactionSnap = await transaction.get(transactionRef);
      const userSnap = await transaction.get(userRef);

      // Already credited.
      if (transactionSnap.exists) {
        return {
          alreadyCredited: true,
          balance: Number(userSnap.data()?.balance || 0),
        };
      }

      if (!userSnap.exists) {
        throw new Error("User account not found");
      }

      const currentBalance = Number(
        userSnap.data()?.balance || 0
      );

      const newBalance = currentBalance + paidAmount;

      transaction.update(userRef, {
        balance: newBalance,
      });

      transaction.set(transactionRef, {
        reference,
        uid: decodedToken.uid,
        amount: paidAmount,
        currency: payment.currency || "NGN",
        status: "success",
        channel: payment.channel || null,
        paidAt: payment.paid_at || null,
        createdAt: new Date(),
      });

      return {
        alreadyCredited: false,
        balance: newBalance,
      };
    });

    return NextResponse.json({
      success: true,
      credited: !result.alreadyCredited,
      amount: paidAmount,
      balance: result.balance,
    });
  } catch (error) {
    console.error("Paystack verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error while verifying payment",
      },
      { status: 500 }
    );
  }
}
