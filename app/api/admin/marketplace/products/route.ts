import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";
const MAX_IMAGE_DATA_LENGTH = 900_000;

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.uid !== ADMIN_UID) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "").trim();
    const description = String(body.description ?? "").trim();
    const imageUrl = String(body.imageUrl ?? "").trim();
    const price = Number(body.price);

    const credentials = Array.isArray(body.credentials)
      ? body.credentials
          .map((item: unknown) => String(item).trim())
          .filter(Boolean)
      : [];

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Product name is required." },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Product category is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { success: false, message: "Enter a valid product price." },
        { status: 400 }
      );
    }

    if (credentials.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Add at least one credential/item.",
        },
        { status: 400 }
      );
    }

    if (credentials.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 1000 credentials per product.",
        },
        { status: 400 }
      );
    }

    if (imageUrl) {
      if (!imageUrl.startsWith("data:image/")) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product image.",
          },
          { status: 400 }
        );
      }

      if (imageUrl.length > MAX_IMAGE_DATA_LENGTH) {
        return NextResponse.json(
          {
            success: false,
            message: "Product image is too large after compression.",
          },
          { status: 400 }
        );
      }
    }

    const productRef = adminDb
      .collection("marketplaceProducts")
      .doc();

    await productRef.set({
      name,
      category,
      description,
      imageUrl: imageUrl || null,
      price,
      active: true,
      stock: credentials.length,
      sold: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: decoded.uid,
    });

    for (let i = 0; i < credentials.length; i += 450) {
      const batch = adminDb.batch();
      const chunk = credentials.slice(i, i + 450);

      for (const credential of chunk) {
        const inventoryRef = adminDb
          .collection("marketplaceInventory")
          .doc();

        batch.set(inventoryRef, {
          productId: productRef.id,
          credential,
          status: "available",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: decoded.uid,
        });
      }

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: "Product created successfully.",
      productId: productRef.id,
      inventoryAdded: credentials.length,
    });
  } catch (error) {
    console.error("Create marketplace product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create marketplace product.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.uid !== ADMIN_UID) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const snapshot = await adminDb
      .collection("marketplaceProducts")
      .orderBy("createdAt", "desc")
      .get();

    const products = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        description: data.description,
        imageUrl: data.imageUrl ?? null,
        price: Number(data.price ?? 0),
        stock: Number(data.stock ?? 0),
        sold: Number(data.sold ?? 0),
        active: data.active === true,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Load marketplace products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load marketplace products.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.uid !== ADMIN_UID) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const productId = String(body.productId ?? "").trim();
    const active = body.active;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required." },
        { status: 400 }
      );
    }

    if (typeof active !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Invalid product status." },
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

    await productRef.update({
      active,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: active
        ? "Product activated successfully."
        : "Product disabled successfully.",
      productId,
      active,
    });
  } catch (error) {
    console.error("Update marketplace product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update marketplace product.",
      },
      { status: 500 }
    );
  }
}
