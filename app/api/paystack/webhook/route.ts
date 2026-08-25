import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

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
      console.error("PAYSTACK_SECRET_KEY is missing");

      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    if (
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

    if (event.event !== "charge.success") {
      return NextResponse.json({
        success: true,
        message: "Event received",
      });
    }

    const payment = event.data;

    const reference = payment?.reference;
    const uid = payment?.metadata?.uid;

    if (!reference || !uid) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing payment reference or user ID",
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

    const result = await adminDb.runTransaction(
      async (transaction) => {
        const paymentSnap =
          await transaction.get(paymentRef);

        const userSnap =
          await transaction.get(userRef);

        // Prevent duplicate wallet credit.
        if (paymentSnap.exists) {
          return {
            alreadyProcessed: true,
          };
        }

        if (!userSnap.exists) {
          throw new Error("User not found");
        }

        const currentBalance =
          Number(userSnap.data()?.balance || 0);

        const newBalance =
          currentBalance + amount;

        transaction.update(userRef, {
          balance: newBalance,
        });

        transaction.set(paymentRef, {
          reference,
          uid,
          amount,
          currency:
            payment.currency || "NGN",
          status: "success",
          channel:
            payment.channel || null,
          paidAt:
            payment.paid_at || null,
          createdAt:
            new Date(),
          source: "paystack_webhook",
        });

        return {
          alreadyProcessed: false,
        };
      }
    );

    return NextResponse.json({
      success: true,
      processed: !result.alreadyProcessed,
      reference,
    });
  } catch (error) {
    console.error(
      "Paystack webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
