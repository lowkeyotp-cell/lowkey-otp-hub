import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    const snapshot = await adminDb
      .collection("orders")
      .where("status", "==", "waiting")
      .where("expiresAt", "<=", now)
      .limit(50)
      .get();

    let processed = 0;
    let expired = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      processed++;

      const order = doc.data();
      const orderId = order.orderId;
      const uid = order.uid;

      if (!orderId || !uid) {
        skipped++;
        continue;
      }

      try {
        const apiKey = process.env.SMSPOOL_API_KEY;

        if (!apiKey) {
          console.error("SMSPOOL_API_KEY is not configured.");
          skipped++;
          continue;
        }

        const cancelForm = new FormData();
        cancelForm.append("key", apiKey);
        cancelForm.append("orderid", String(orderId));

        const smsPoolResponse = await fetch(
          "https://api.smspool.net/sms/cancel",
          {
            method: "POST",
            body: cancelForm,
            cache: "no-store",
          }
        );

        const smsPoolData = await smsPoolResponse.json();

        console.log(
          `V2 cron SMSPool expiry cancel response for ${orderId}:`,
          smsPoolData
        );

        if (
          !smsPoolData ||
          Number(smsPoolData.success) !== 1
        ) {
          console.error(
            `SMSPool could not cancel expired order ${orderId}:`,
            smsPoolData
          );
          skipped++;
          continue;
        }

        const result = await adminDb.runTransaction(async (transaction) => {
          const orderRef = adminDb.collection("orders").doc(doc.id);
          const userRef = adminDb.collection("users").doc(uid);
          const refundRef = adminDb
            .collection("platformTransactions")
            .doc(`refund_${orderId}`);

          const [freshOrderSnap, userSnap, refundSnap] = await Promise.all([
            transaction.get(orderRef),
            transaction.get(userRef),
            transaction.get(refundRef),
          ]);

          if (!freshOrderSnap.exists) {
            return { status: "missing" };
          }

          const freshOrder = freshOrderSnap.data() || {};

          if (freshOrder.status !== "waiting") {
            return { status: "already_processed" };
          }

          if (refundSnap.exists) {
            return { status: "already_refunded" };
          }

          if (!userSnap.exists) {
            return { status: "user_missing" };
          }

          const refundAmount = Number(freshOrder.price || 0);
          const userData = userSnap.data() || {};
          const currentBalance = Number(userData.balance || 0);

          if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
            return { status: "invalid_refund" };
          }

          transaction.update(userRef, {
            balance: currentBalance + refundAmount,
          });

          transaction.update(orderRef, {
            status: "expired",
            expiredAt: new Date(),
            refundAmount,
            expiredAutomatically: true,
          });

          transaction.set(refundRef, {
            uid,
            orderId,
            type: "refund",
            amount: refundAmount,
            status: "completed",
            createdAt: new Date(),
            createdBy: "v2-auto-expiry-cron",
            smsPoolCancelled: true,
          });

          return {
            status: "expired",
            refundAmount,
          };
        });

        if (result.status === "expired") {
          expired++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Failed to expire order ${orderId}:`, error);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      expired,
      skipped,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron expiry error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process expired orders.",
      },
      { status: 500 }
    );
  }
}
