import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

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

    if (decodedToken.uid !== ADMIN_UID) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const [ordersSnapshot, transactionsSnapshot] = await Promise.all([
      adminDb.collection("marketplaceOrders").get(),
      adminDb.collection("marketplaceTransactions").get(),
    ]);

    const orders = ordersSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        orderId: data.orderId ?? doc.id,
        uid: data.uid ?? "",
        productId: data.productId ?? "",
        productName: data.productName ?? "Marketplace Product",
        price: Number(data.price ?? 0),
        credential: data.credential ?? "",
        status: data.status ?? "completed",
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    const transactions = transactionsSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        uid: data.uid ?? "",
        orderId: data.orderId ?? "",
        productId: data.productId ?? "",
        type: data.type ?? "sale",
        amount: Number(data.amount ?? 0),
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

    transactions.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      orders,
      transactions,
    });
  } catch (error) {
    console.error("Admin marketplace orders API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load marketplace records.",
      },
      { status: 500 }
    );
  }
}
