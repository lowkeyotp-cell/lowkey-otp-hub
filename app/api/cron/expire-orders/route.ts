import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "CRON_SECRET is not configured.",
        },
        { status: 500 }
      );
    }

    const authorization = req.headers.get("authorization");

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const now = Date.now();

    const ordersSnap = await adminDb
      .collection("orders")
      .where("status", "==", "waiting")
      .get();

    const expiredOrders: string[] = [];

    for (const orderDoc of ordersSnap.docs) {
      const data = orderDoc.data();

      const expiresAt = data.expiresAt?.toDate?.();

      if (!expiresAt) {
        continue;
      }

      if (expiresAt.getTime() <= now) {
        const orderId = String(data.orderId ?? "").trim();

        if (orderId) {
          expiredOrders.push(orderId);
        }
      }
    }

    if (expiredOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired orders found.",
        processed: 0,
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${process.env.VERCEL_URL}`;

    const results: Array<{
      orderId: string;
      success: boolean;
      message?: string;
    }> = [];

    for (const orderId of expiredOrders) {
      try {
        const response = await fetch(
          `${baseUrl}/api/expire-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId }),
            cache: "no-store",
          }
        );

        const result = await response.json();

        results.push({
          orderId,
          success: Boolean(result.success),
          message: result.message,
        });
      } catch (error) {
        results.push({
          orderId,
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to process order.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error(
      "Automatic expiration scanner error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Expiration scanner failed.",
      },
      { status: 500 }
    );
  }
}
