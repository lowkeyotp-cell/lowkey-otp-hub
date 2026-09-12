import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

async function verifyAdmin(req: Request) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.substring(7);
  const decoded = await getAuth().verifyIdToken(token);

  return decoded.uid === ADMIN_UID ? decoded : null;
}

export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const productId = new URL(req.url).searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required." },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("marketplaceInventory")
      .where("productId", "==", productId)
      .get();

    const inventory = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        productId: data.productId,
        status: data.status ?? "available",
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error("Marketplace inventory GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load inventory.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const productId = String(body.productId ?? "").trim();
    const quantity = Number(body.quantity ?? 0);

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be between 1 and 1000.",
        },
        { status: 400 }
      );
    }

    const productRef = adminDb
      .collection("marketplaceProducts")
      .doc(productId);

    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    if (productSnap.data()?.active !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "This product is currently disabled.",
        },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();

    for (let i = 0; i < quantity; i++) {
      const inventoryRef = adminDb
        .collection("marketplaceInventory")
        .doc();

      batch.set(inventoryRef, {
        productId,
        status: "available",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: admin.uid,
      });
    }

    await batch.commit();

    await adminDb.collection("marketplaceLogs").add({
      action: "inventory_added",
      productId,
      quantity,
      adminUid: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: `${quantity} inventory item(s) added successfully.`,
    });
  } catch (error) {
    console.error("Marketplace inventory POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to add inventory.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const inventoryId = String(body.inventoryId ?? "").trim();
    const status = String(body.status ?? "").trim();

    if (!inventoryId) {
      return NextResponse.json(
        { success: false, message: "Inventory ID is required." },
        { status: 400 }
      );
    }

    if (!["available", "disabled"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid inventory status.",
        },
        { status: 400 }
      );
    }

    const ref = adminDb
      .collection("marketplaceInventory")
      .doc(inventoryId);

    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, message: "Inventory item not found." },
        { status: 404 }
      );
    }

    const current = snap.data();

    if (current?.status === "sold") {
      return NextResponse.json(
        {
          success: false,
          message: "Sold inventory cannot be modified.",
        },
        { status: 400 }
      );
    }

    await ref.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("marketplaceLogs").add({
      action:
        status === "disabled"
          ? "inventory_disabled"
          : "inventory_enabled",
      inventoryId,
      productId: current?.productId ?? null,
      adminUid: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message:
        status === "disabled"
          ? "Inventory item disabled."
          : "Inventory item enabled.",
    });
  } catch (error) {
    console.error("Marketplace inventory PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update inventory.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const inventoryId = new URL(req.url).searchParams.get(
      "inventoryId"
    );

    if (!inventoryId) {
      return NextResponse.json(
        { success: false, message: "Inventory ID is required." },
        { status: 400 }
      );
    }

    const ref = adminDb
      .collection("marketplaceInventory")
      .doc(inventoryId);

    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, message: "Inventory item not found." },
        { status: 404 }
      );
    }

    const current = snap.data();

    if (current?.status === "sold") {
      return NextResponse.json(
        {
          success: false,
          message: "Sold inventory cannot be deleted.",
        },
        { status: 400 }
      );
    }

    await ref.delete();

    await adminDb.collection("marketplaceLogs").add({
      action: "inventory_deleted",
      inventoryId,
      productId: current?.productId ?? null,
      adminUid: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Inventory item deleted.",
    });
  } catch (error) {
    console.error("Marketplace inventory DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete inventory.",
      },
      { status: 500 }
    );
  }
}
