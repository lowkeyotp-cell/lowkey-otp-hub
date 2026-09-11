import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const authorization =
      request.headers.get("authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const token = authorization.slice(7);
    const decodedToken =
      await adminAuth.verifyIdToken(token);

    const orderId =
      new URL(request.url).searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("orders")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const order = doc.data();

    if (String(order.uid) !== decodedToken.uid) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const expiresAt =
      order.expiresAt?.toDate?.()?.getTime?.() ??
      null;

    const createdAt =
      order.createdAt?.toDate?.()?.getTime?.() ??
      null;

    return NextResponse.json({
      success: true,
      order: {
        orderId: String(order.orderId),
        number: String(order.number || ""),
        service: String(order.service || ""),
        status: String(order.status || ""),
        createdAt,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Order lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load order.",
      },
      { status: 500 }
    );
  }
}
