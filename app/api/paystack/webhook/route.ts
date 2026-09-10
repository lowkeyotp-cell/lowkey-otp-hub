import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { applyReferralReward } from "@/lib/referral-reward";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, message: "Missing signature" },
        { status: 401 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Paystack secret key not configured",
        },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    // We only process successful charges.
    if (event.event !== "charge.success") {
      return NextResponse.json({
        success: true,
        message: "Event received",
      });
    }

    const payment = event.data;

    const reference = String(payment?.reference ?? "").trim();
    const uid = String(payment?.metadata?.uid ?? "").trim();

    if (!reference || !uid) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment reference or user ID missing",
        },
        { status: 400 }
      );
    }

    const amount = Number(payment.amount) / 100;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment amount",
        },
        { status: 400 }
      );
    }

    const paymentRef = adminDb
      .collection("walletTransactions")
      .doc(reference);

    const userRef = adminDb
      .collection("users")
      .doc(uid);

    const result = await adminDb.runTransaction(async (transaction) => {
      const paymentSnap = await transaction.get(paymentRef);
      const userSnap = await transaction.get(userRef);

      // Already processed by webhook or /verify.
      if (paymentSnap.exists) {
        return {
          alreadyProcessed: true,
          referralRewarded: false,
        };
      }

      if (!userSnap.exists) {
        throw new Error("User not found");
      }

      const currentBalance = Number(
        userSnap.data()?.balance || 0
      );

      const newBalance = currentBalance + amount;

      // Referral reward must be checked before any transaction writes.
      const referralRewarded = await applyReferralReward(
        transaction,
        userRef,
        userSnap,
        reference,
        amount
      );

      // Credit wallet.
      transaction.update(userRef, {
        balance: newBalance,
      });

      // Record payment.
      transaction.set(paymentRef, {
        reference,
        uid,
        amount,
        currency: payment.currency || "NGN",
        status: "success",
        channel: payment.channel || null,
        paidAt: payment.paid_at || null,
        createdAt: new Date(),
        source: "paystack_webhook",
      });

      return {
        alreadyProcessed: false,
        referralRewarded,
      };
    });

    return NextResponse.json({
      success: true,
      processed: !result.alreadyProcessed,
      reference,
      referralRewarded: result.referralRewarded,
    });
  } catch (error) {
    console.error("Paystack webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing error",
      },
      { status: 500 }
    );
  }
}
