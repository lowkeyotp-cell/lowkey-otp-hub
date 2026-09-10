import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { adminAudit } from "@/lib/adminAudit";

const SETTINGS_ID = "pricing";

export async function GET() {
  try {
    const ref = adminDb
      .collection("platformSettings")
      .doc(SETTINGS_ID);

    const snap = await ref.get();

    if (!snap.exists) {
      const defaults = {
        pricingMode: "markup",
        markupPercent: 0,
        customUsdToNgn: null,
        useCustomUsdRate: false,
        updatedAt: new Date(),
      };

      await ref.set(defaults);

      return NextResponse.json({
        success: true,
        settings: defaults,
      });
    }

    return NextResponse.json({
      success: true,
      settings: snap.data(),
    });
  } catch (error) {
    console.error(
      "Pricing settings GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load pricing settings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const markupPercent = Number(
      body.markupPercent ?? 0
    );

    const useCustomUsdRate =
      Boolean(body.useCustomUsdRate);

    const customUsdToNgn =
      body.customUsdToNgn === null ||
      body.customUsdToNgn === "" ||
      body.customUsdToNgn === undefined
        ? null
        : Number(body.customUsdToNgn);

    if (
      !Number.isFinite(markupPercent) ||
      markupPercent < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid markup percentage.",
        },
        { status: 400 }
      );
    }

    if (
      useCustomUsdRate &&
      (!customUsdToNgn ||
        !Number.isFinite(customUsdToNgn) ||
        customUsdToNgn <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid custom USD/NGN rate.",
        },
        { status: 400 }
      );
    }

    const settings = {
      pricingMode: "markup",
      markupPercent,
      customUsdToNgn,
      useCustomUsdRate,
      updatedAt: new Date(),
    };

    await adminDb
      .collection("platformSettings")
      .doc(SETTINGS_ID)
      .set(settings, { merge: true });

await adminAudit(
  "KSXJJqnu3FhuFcTye2lRlxxct6r2",
  "PRICING_UPDATED",
  `Updated marketplace pricing: ${markupPercent}% markup`
);

    return NextResponse.json({
      success: true,
      message: "Pricing settings saved.",
      settings,
    });
  } catch (error) {
    console.error(
      "Pricing settings POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save pricing settings.",
      },
      { status: 500 }
    );
  }
}
