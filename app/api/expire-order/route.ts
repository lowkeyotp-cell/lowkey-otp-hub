import { NextResponse } from "next/server";
import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = req.headers.get(
      "authorization"
    );

    const isCronRequest =
      Boolean(cronSecret) &&
      authorization ===
        `Bearer ${cronSecret}`;

    let authenticatedUid: string | null = null;

    if (!isCronRequest) {
      if (
        !authorization ||
        !authorization.startsWith("Bearer ")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized.",
          },
          { status: 401 }
        );
      }

      const token =
        authorization.substring(7).trim();

      if (!token) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized.",
          },
          { status: 401 }
        );
      }

      try {
        const decodedToken =
          await adminAuth.verifyIdToken(token);

        authenticatedUid = decodedToken.uid;
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized.",
          },
          { status: 401 }
        );
      }
    }

    const body = await req.json();

    const orderId = String(
      body.orderId ?? ""
    ).trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Find the order.
     */
    const ordersSnap = await adminDb
      .collection("orders")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (ordersSnap.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    const orderDoc = ordersSnap.docs[0];
    const orderRef = orderDoc.ref;
    const orderData = orderDoc.data();
    /*
     * User requests may only expire their own order.
     * Cron requests are allowed to process any expired order.
     */
    if (
      !isCronRequest &&
      authenticatedUid !==
        String(orderData.uid ?? "").trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 403 }
      );
    }

    /*
     * Only waiting orders can expire.
     */
    if (orderData.status !== "waiting") {
      return NextResponse.json({
        success: true,
        expired: false,
        status: orderData.status,
      });
    }

    /*
     * Verify expiration time.
     */
    const expiresAt =
      orderData.expiresAt?.toDate?.();

    if (!expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Order expiration time is missing.",
        },
        { status: 500 }
      );
    }

    if (Date.now() < expiresAt.getTime()) {
      return NextResponse.json({
        success: true,
        expired: false,
        message: "Order has not expired yet.",
      });
    }

    const uid = String(
      orderData.uid ?? ""
    ).trim();

    if (!uid) {
      return NextResponse.json(
        {
          success: false,
          message: "Order has no associated user.",
        },
        { status: 500 }
      );
    }

    const refundAmount = Number(
      orderData.price ?? 0
    );

    if (
      !Number.isFinite(refundAmount) ||
      refundAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid refund amount.",
        },
        { status: 500 }
      );
    }

    const apiKey =
      process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "SMSPool service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    /*
     * Cancel the SMSPool order first.
     */
    const cancelForm = new FormData();

    cancelForm.append(
      "key",
      apiKey
    );

    cancelForm.append(
      "orderid",
      orderId
    );

    const smsPoolResponse =
      await fetch(
        "https://api.smspool.net/sms/cancel",
        {
          method: "POST",
          body: cancelForm,
          cache: "no-store",
        }
      );

    const smsPoolData =
      await smsPoolResponse.json();

    console.log(
      "SMSPool expiration cancel:",
      smsPoolData
    );

    /*
     * Never refund unless SMSPool confirms.
     */
    if (
      !smsPoolData ||
      Number(smsPoolData.success) !== 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            smsPoolData?.message ||
            "SMSPool could not cancel the expired number.",
        },
        { status: 409 }
      );
    }

    /*
     * Refund atomically.
     */
    const refundRef = adminDb
      .collection("platformTransactions")
      .doc(`refund_${orderId}`);

    let newBalance = 0;

    await adminDb.runTransaction(
      async (transaction) => {
        const currentOrder =
          await transaction.get(orderRef);

        const userRef = adminDb
          .collection("users")
          .doc(uid);

        const userSnap =
          await transaction.get(userRef);

        const refundSnap =
          await transaction.get(refundRef);

        if (refundSnap.exists) {
          throw new Error(
            "REFUND_ALREADY_PROCESSED"
          );
        }

        if (!currentOrder.exists) {
          throw new Error(
            "ORDER_NOT_FOUND"
          );
        }

        if (!userSnap.exists) {
          throw new Error(
            "USER_NOT_FOUND"
          );
        }

        if (
          currentOrder.data()?.status !==
          "waiting"
        ) {
          throw new Error(
            "ORDER_ALREADY_PROCESSED"
          );
        }

        const balance = Number(
          userSnap.data()?.balance ?? 0
        );

        if (!Number.isFinite(balance)) {
          throw new Error(
            "INVALID_WALLET_BALANCE"
          );
        }

        newBalance =
          balance + refundAmount;

        transaction.update(
          userRef,
          {
            balance: newBalance,
          }
        );

        transaction.update(
          orderRef,
          {
            status: "cancelled",
            cancelledAt: new Date(),
            refundAmount,
            cancelledBy: "system-expiration",
          }
        );

        transaction.set(
          refundRef,
          {
            uid,
            orderId,
            type: "refund",
            amount: refundAmount,
            status: "completed",
            createdAt: new Date(),
            createdBy: "system-expiration",
            smsPoolCancelled: true,
          }
        );
      }
    );

    return NextResponse.json({
      success: true,
      expired: true,
      message:
        "Expired order cancelled and wallet refunded.",
      orderId,
      refundAmount,
      newBalance,
    });

  } catch (error) {
    console.error(
      "Expire order error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message ===
      "REFUND_ALREADY_PROCESSED"
    ) {
      return NextResponse.json({
        success: true,
        expired: true,
        message:
          "This order has already been refunded.",
      });
    }

    if (
      message ===
      "ORDER_ALREADY_PROCESSED"
    ) {
      return NextResponse.json({
        success: true,
        expired: false,
        message:
          "This order has already been processed.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process expired order.",
      },
      { status: 500 }
    );
  }
}
