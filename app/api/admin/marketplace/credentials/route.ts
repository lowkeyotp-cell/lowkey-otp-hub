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
        credential: data.credential,
        status: data.status ?? "available",
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error("Marketplace credentials GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load credentials.",
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
    const credential = String(body.credential ?? "").trim();

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required." },
        { status: 400 }
      );
    }

    if (!credential) {
      return NextResponse.json(
        { success: false, message: "Credential is required." },
        { status: 400 }
      );
    }

    if (credential.length > 10000) {
      return NextResponse.json(
        { success: false, message: "Credential is too long." },
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

    const inventoryRef = adminDb
      .collection("marketplaceInventory")
      .doc();

    await inventoryRef.set({
      productId,
      credential,
      status: "available",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: admin.uid,
    });

    await adminDb.collection("marketplaceLogs").add({
      action: "credential_added",
      inventoryId: inventoryRef.id,
      productId,
      adminUid: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Credential added successfully.",
      inventoryId: inventoryRef.id,
    });
  } catch (error) {
    console.error("Marketplace credentials POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to add credential.",
      },
      { status: 500 }
    );
  }
}
