import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);

    const body = await req.json();
    const orderId = String(body.orderId ?? "").trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const ordersSnap = await adminDb
      .collection("orders")
      .where("orderId", "==", orderId)
      .where("uid", "==", decodedToken.uid)
      .limit(1)
      .get();

    if (ordersSnap.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "This order could not be found.",
        },
        { status: 404 }
      );
    }

    const orderDoc = ordersSnap.docs[0];
    const orderRef = orderDoc.ref;
    const orderData = orderDoc.data();

    if (orderData.status !== "waiting") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        status: orderData.status,
        orderId,
      });
    }

    const expiresAt =
      orderData.expiresAt instanceof Date
        ? orderData.expiresAt.getTime()
        : orderData.expiresAt?.toMillis?.() ??
          Number(orderData.expiresAt);

    if (!Number.isFinite(expiresAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "This order has no valid expiry time.",
        },
        { status: 500 }
      );
    }

    if (Date.now() < expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: "This number has not expired yet.",
          expiresAt,
        },
        { status: 409 }
      );
    }

    const refundAmount = Number(orderData.price ?? 0);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid refund amount.",
        },
        { status: 500 }
      );
    }

    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      console.error("SMSPOOL_API_KEY is not configured.");

      return NextResponse.json(
        {
          success: false,
          message: "SMSPool service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const cancelForm = new FormData();
    cancelForm.append("key", apiKey);
    cancelForm.append("orderid", orderId);

    const smsPoolResponse = await fetch(
      "https://api.smspool.net/sms/cancel",
      {
        method: "POST",
        body: cancelForm,
        cache: "no-store",
      }
    );

    const smsPoolData = await smsPoolResponse.json();

    console.log("V2 SMSPool expiry cancel response:", smsPoolData);

    if (
      !smsPoolData ||
      Number(smsPoolData.success) !== 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            smsPoolData?.message ||
            "SMSPool could not cancel the expired number. The wallet was not refunded.",
        },
        { status: 409 }
      );
    }

    const refundRef = adminDb
      .collection("platformTransactions")
      .doc(`refund_${orderId}`);

    let newBalance = 0;

    await adminDb.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      const userRef = adminDb
        .collection("users")
        .doc(decodedToken.uid);

      const userSnap = await transaction.get(userRef);
      const refundSnap = await transaction.get(refundRef);

      if (refundSnap.exists) {
        throw new Error("REFUND_ALREADY_PROCESSED");
      }

      if (!orderSnap.exists) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (!userSnap.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      if (orderSnap.data()?.status !== "waiting") {
        throw new Error("ORDER_ALREADY_PROCESSED");
      }

      const balance = Number(
        userSnap.data()?.balance ?? 0
      );

      if (!Number.isFinite(balance)) {
        throw new Error("INVALID_WALLET_BALANCE");
      }

      newBalance = balance + refundAmount;

      transaction.update(userRef, {
        balance: newBalance,
      });

      transaction.update(orderRef, {
        status: "expired",
        expiredAt: new Date(),
        refundAmount,
        expiredAutomatically: true,
      });

      transaction.set(refundRef, {
        uid: decodedToken.uid,
        orderId,
        type: "refund",
        amount: refundAmount,
        status: "completed",
        createdAt: new Date(),
        createdBy: "v2-auto-expiry",
        smsPoolCancelled: true,
      });
    });

    return NextResponse.json({
      success: true,
      orderId,
      status: "expired",
      refundAmount,
      newBalance,
    });
  } catch (error) {
    console.error("V2 expiry error:", error);

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (message === "REFUND_ALREADY_PROCESSED") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        status: "expired",
      });
    }

    if (message === "ORDER_ALREADY_PROCESSED") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        status: "expired",
      });
    }

    if (message === "ORDER_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "This order could not be found.",
        },
        { status: 404 }
      );
    }

    if (message === "USER_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "The order's user account could not be found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to expire this order.",
      },
      { status: 500 }
    );
  }
}
