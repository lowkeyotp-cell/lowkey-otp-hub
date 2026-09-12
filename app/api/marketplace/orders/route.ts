import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const snapshot = await adminDb
      .collection("marketplaceOrders")
      .where("uid", "==", uid)
      .get();

    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        orderId: data.orderId ?? doc.id,
        uid: data.uid,
        productId: data.productId,
        productName: data.productName ?? "Marketplace Product",
        price: Number(data.price ?? 0),
        credential: data.credential ?? "",
        status: data.status ?? "completed",
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    orders.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Marketplace orders API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load marketplace orders.",
      },
      { status: 500 }
    );
  }
}
