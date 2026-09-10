import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

export async function POST(req: Request) {
  try {
    const authHeader =
      req.headers.get("authorization");

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

    const decodedToken =
      await getAuth().verifyIdToken(token);

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
     * Find the Firestore order.
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
          message:
            "This order could not be found.",
        },
        { status: 404 }
      );
    }

    const orderDoc = ordersSnap.docs[0];
    const orderRef = orderDoc.ref;
    const orderData = orderDoc.data();

    if (!orderData) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order data could not be loaded.",
        },
        { status: 404 }
      );
    }

    /*
     * Only waiting orders can be cancelled.
     */
    if (orderData.status !== "waiting") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order has already been processed and cannot be cancelled.",
        },
        { status: 409 }
      );
    }

    /*
     * Verify that the logged-in user owns the order,
     * unless the request is coming from the admin.
     */
    const orderUid = String(
      orderData.uid ?? ""
    ).trim();

    const isAdmin =
      decodedToken.uid === ADMIN_UID;

    if (
      !isAdmin &&
      decodedToken.uid !== orderUid
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to cancel this order.",
        },
        { status: 403 }
      );
    }

    const uid = orderUid;

    if (!uid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order has no associated user.",
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
          message:
            "Invalid refund amount.",
        },
        { status: 500 }
      );
    }

    /*
     * SMSPool API key.
     */
    const apiKey =
      process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      console.error(
        "SMSPOOL_API_KEY is not configured."
      );

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
     * STEP 1:
     * Cancel the actual SMSPool order first.
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
      "SMSPool cancel response:",
      smsPoolData
    );

    /*
     * Never refund the user unless SMSPool
     * confirms the cancellation.
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
            "SMSPool could not cancel this number. The wallet was not refunded.",
          smsPool:
            smsPoolData ?? null,
        },
        { status: 409 }
      );
    }

    /*
     * STEP 2:
     * SMSPool confirmed cancellation.
     *
     * Now refund the user's wallet and mark
     * the Firestore order as cancelled atomically.
     */
    const refundRef = adminDb
      .collection("platformTransactions")
      .doc(`refund_${orderId}`);

    let newBalance = 0;

    await adminDb.runTransaction(
      async (transaction) => {
        const orderSnap =
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

        if (!orderSnap.exists) {
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
          orderSnap.data()?.status !==
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
            cancelledBy:
              decodedToken.uid,
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
            createdBy:
              decodedToken.uid,
            smsPoolCancelled: true,
          }
        );
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Order cancelled and wallet refunded successfully.",
      orderId,
      refundAmount,
      newBalance,
    });

  } catch (error) {
    console.error(
      "Cancel order error:",
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
      return NextResponse.json(
        {
          success: false,
          message:
            "This order has already been refunded.",
        },
        { status: 409 }
      );
    }

    if (
      message ===
      "ORDER_ALREADY_PROCESSED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order has already been processed.",
        },
        { status: 409 }
      );
    }

    if (
      message === "ORDER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order could not be found.",
        },
        { status: 404 }
      );
    }

    if (
      message === "USER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The order's user account could not be found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to cancel this order.",
      },
      { status: 500 }
    );
  }
}
