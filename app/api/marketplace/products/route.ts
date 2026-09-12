import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("marketplaceProducts")
      .where("active", "==", true)
      .get();

    const products = (
      await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();

          const inventorySnapshot = await adminDb
            .collection("marketplaceInventory")
            .where("productId", "==", doc.id)
            .where("status", "==", "available")
            .get();

          const stock = inventorySnapshot.size;

          if (stock <= 0) {
            return null;
          }

          return {
            id: doc.id,
            name: data.name,
            category: data.category,
     description: data.description,
imageUrl: data.imageUrl ?? null,
price: Number(data.price ?? 0),
stock,
          };
        })
      )
    ).filter(Boolean);

    products.sort((a, b) => a!.name.localeCompare(b!.name));

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Marketplace products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load marketplace products.",
      },
      { status: 500 }
    );
  }
}
