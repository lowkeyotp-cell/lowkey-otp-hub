import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
export async function POST(req: Request) {
  try {
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

    // Check our order status before contacting SMSPool.
    const orderSnapshot = await adminDb
      .collection("orders")
      .where("orderId", "==", String(orderId))
      .limit(1)
      .get();

    if (!orderSnapshot.empty) {
      const orderData =
        orderSnapshot.docs[0].data();

      if (orderData.status === "cancelled") {
        return NextResponse.json({
          success: false,
          status: "cancelled",
          message: "This order has been cancelled.",
        });
      }

      if (orderData.status === "completed") {
        return NextResponse.json({
          success: false,
          status: "completed",
          message: "This order has already been completed.",
          code: orderData.otp || null,
        });
      }
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
  const snapshot = await adminDb
    .collection("orders")
    .where("orderId", "==", orderId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      otp: otpCode,
      status: "completed",
    });
  }
}
    console.log("SMSPool OTP response:", data);

   return NextResponse.json({
  success: true,
  status: data.status,
  fullMessage:
    data.full_message ||
    data.full_sms ||
    "",
  code:
    data.code ||
    data.sms ||
    null,
});
  } catch (error) {
    console.error("OTP check error:", error);

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
