import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

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

    const idToken = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const orderSnapshot = await adminDb
      .collection("orders")
      .where("orderId", "==", String(orderId))
      .where("uid", "==", decodedToken.uid)
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    const orderData = orderSnapshot.docs[0].data();

    if (orderData.status === "cancelled") {
      return NextResponse.json({
        success: false,
        status: "cancelled",
        message: "This order has been cancelled.",
      });
    }

    if (orderData.status === "expired") {
      return NextResponse.json({
        success: false,
        status: "expired",
        message: "This order has expired.",
      });
    }

    if (orderData.status === "completed" && orderData.otp) {
      return NextResponse.json({
        success: true,
        status: "completed",
        code: orderData.otp,
      });
    }

    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      console.error("SMSPool API key is missing.");

      return NextResponse.json(
        {
          success: false,
          message: "OTP service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("orderid", String(orderId));

    const response = await fetch(
      "https://api.smspool.net/sms/check",
      {
        method: "POST",
        body: formData,
        cache: "no-store",
      }
    );

    const data = await response.json();

    const otpCode =
      data.code ||
      data.sms ||
      null;

    if (otpCode) {
      await orderSnapshot.docs[0].ref.update({
        otp: otpCode,
        status: "completed",
      });
    }

    return NextResponse.json({
      success: true,
      status: data.status,
      fullMessage:
        data.full_message ||
        data.full_sms ||
        "",
      code: otpCode,
    });
  } catch (error) {
    console.error("V2 OTP check error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "We couldn't check for a new OTP. Please try again.",
      },
      { status: 500 }
    );
  }
}
