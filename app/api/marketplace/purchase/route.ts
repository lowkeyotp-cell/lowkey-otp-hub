import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const productId = String(body?.productId ?? "").trim();

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required." },
        { status: 400 }
      );
    }

    const productRef = adminDb
      .collection("marketplaceProducts")
      .doc(productId);

    const userRef = adminDb.collection("users").doc(uid);

    let purchaseData: {
      orderId: string;
      productId: string;
      productName: string;
      price: number;
      inventoryId: string;
      credential: string;
      previousBalance: number;
      remainingBalance: number;
    } = {
      orderId: "",
      productId: "",
      productName: "",
      price: 0,
      inventoryId: "",
      credential: "",
      previousBalance: 0,
      remainingBalance: 0,
    };

    await adminDb.runTransaction(async (transaction) => {
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const product = productSnap.data();

      if (product?.active !== true) {
        throw new Error("PRODUCT_INACTIVE");
      }

      const price = Number(product?.price ?? 0);

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("INVALID_PRODUCT_PRICE");
      }

      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      const userData = userSnap.data();
      const balance = Number(userData?.balance ?? 0);

      if (!Number.isFinite(balance) || balance < price) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const inventoryQuery = adminDb
        .collection("marketplaceInventory")
        .where("productId", "==", productId)
        .where("status", "==", "available")
        .limit(1);

      const inventorySnap = await transaction.get(inventoryQuery);

      if (inventorySnap.empty) {
        throw new Error("OUT_OF_STOCK");
      }

      const inventoryDoc = inventorySnap.docs[0];
      const inventory = inventoryDoc.data();

      const orderId = `LM-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      const orderRef = adminDb
        .collection("marketplaceOrders")
        .doc();

      const transactionRef = adminDb
        .collection("marketplaceTransactions")
        .doc();

      transaction.update(userRef, {
        balance: balance - price,
      });

      transaction.update(inventoryDoc.ref, {
        status: "sold",
        soldToUid: uid,
        soldAt: FieldValue.serverTimestamp(),
        orderId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(productRef, {
        stock: FieldValue.increment(-1),
        sold: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(orderRef, {
        orderId,
        uid,
        productId,
        productName: product?.name ?? "",
        inventoryId: inventoryDoc.id,
        price,
        credential: inventory?.credential ?? "",
        status: "completed",
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.set(transactionRef, {
        uid,
        orderId,
        productId,
        type: "sale",
        amount: price,
        status: "completed",
        createdAt: FieldValue.serverTimestamp(),
      });

      purchaseData = {
        orderId,
        productId,
        productName: product?.name ?? "",
        price,
        inventoryId: inventoryDoc.id,
        credential: inventory?.credential ?? "",
        previousBalance: balance,
        remainingBalance: balance - price,
      };
    });

    if (!purchaseData.orderId) {
      throw new Error("PURCHASE_FAILED");
    }

    return NextResponse.json({
      success: true,
      message: "Purchase completed successfully.",
      orderId: purchaseData.orderId,
      productId: purchaseData.productId,
      productName: purchaseData.productName,
      price: purchaseData.price,
      credential: purchaseData.credential,
      remainingBalance: purchaseData.remainingBalance,
    });
  } catch (error: any) {
    console.error("Marketplace purchase error:", error);

    if (error?.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    if (error?.message === "PRODUCT_INACTIVE") {
      return NextResponse.json(
        { success: false, message: "This product is no longer available." },
        { status: 400 }
      );
    }

    if (error?.message === "OUT_OF_STOCK") {
      return NextResponse.json(
        { success: false, message: "This product is currently out of stock." },
        { status: 409 }
      );
    }

    if (error?.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        {
          success: false,
          message: "Your wallet balance is insufficient for this purchase.",
        },
        { status: 402 }
      );
    }

    if (error?.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "We couldn't complete your purchase right now.",
      },
      { status: 500 }
    );
  }
}
