import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { country, service } = await req.json();

    console.log("Pricing request:", {
      country,
      service,
    });

    // ─────────────────────────────
    // 1. Get SMSPool live pricing
    // ─────────────────────────────

    const formData = new FormData();

    formData.append(
      "key",
      process.env.SMSPOOL_API_KEY || ""
    );

    const pricingResponse = await fetch(
      "https://api.smspool.net/request/pricing",
      {
        method: "POST",
        body: formData,
        cache: "no-store",
      }
    );

    const pricing = await pricingResponse.json();

    if (!Array.isArray(pricing)) {
      return NextResponse.json({
        success: false,
        message: "Failed to load pricing",
      });
    }

    // ─────────────────────────────
    // 2. Find selected country/service
    // ─────────────────────────────

    const matches = pricing.filter(
      (item: any) =>
        String(item.country) === String(country) &&
        Number(item.service) === Number(service)
    );

    if (matches.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No pricing found",
      });
    }

    // ─────────────────────────────
    // 3. Pick cheapest available price
    // ─────────────────────────────

    matches.sort(
      (a: any, b: any) =>
        Number(a.price) - Number(b.price)
    );

    const cheapest = matches[0];

    const usdPrice = Number(cheapest.price);

    if (!Number.isFinite(usdPrice)) {
      return NextResponse.json({
        success: false,
        message: "Invalid SMSPool price",
      });
    }

    // ─────────────────────────────
    // 4. Get live USD → NGN rate
    // ─────────────────────────────

    const exchangeResponse = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      {
        cache: "no-store",
      }
    );

    const exchangeData =
      await exchangeResponse.json();

    const liveUsdToNgn = Number(
      exchangeData?.rates?.NGN
    );

    if (
      !liveUsdToNgn ||
      !Number.isFinite(liveUsdToNgn)
    ) {
      return NextResponse.json({
        success: false,
        message:
          "Failed to get live USD/NGN rate",
      });
    }

    // ─────────────────────────────
    // 5. Load Admin pricing settings
    // ─────────────────────────────

    const settingsRef = adminDb
      .collection("platformSettings")
      .doc("pricing");

    const settingsSnap =
      await settingsRef.get();

    const settings =
      settingsSnap.exists
        ? settingsSnap.data()
        : null;

    const useCustomUsdRate =
      Boolean(
        settings?.useCustomUsdRate
      );

    const customUsdToNgn =
      Number(
        settings?.customUsdToNgn ?? 0
      );

    const markupPercent =
      Number(
        settings?.markupPercent ?? 0
      );

    // ─────────────────────────────
    // 6. Choose active exchange rate
    // ─────────────────────────────

    const usdToNgn =
      useCustomUsdRate &&
      Number.isFinite(customUsdToNgn) &&
      customUsdToNgn > 0
        ? customUsdToNgn
        : liveUsdToNgn;

    // ─────────────────────────────
    // 7. Convert SMSPool cost to NGN
    // ─────────────────────────────

    const costPrice =
      usdPrice * usdToNgn;

    // ─────────────────────────────
    // 8. Apply Admin markup
    // ─────────────────────────────

    const markupAmount =
      costPrice *
      (markupPercent / 100);

    const calculatedSellingPrice =
      costPrice + markupAmount;

    // ─────────────────────────────
    // 9. Signal special price
    // ─────────────────────────────
    // Keep your existing Signal rule.
    // Change this later from Admin if desired.

    const sellingPrice =
      String(country) === "1" &&
      Number(service) === 829
        ? 100
        : calculatedSellingPrice;

    const grossProfit =
      sellingPrice - costPrice;

    // ─────────────────────────────
    // 10. Return pricing information
    // ─────────────────────────────

    return NextResponse.json({
      success: true,

      // Customer pays this
      price: sellingPrice,

      // Estimated SMSPool cost in NGN
      costPrice: costPrice,

      // Gross profit on this purchase
      profit: grossProfit,

      // Admin markup percentage
      markupPercent: markupPercent,

      // Actual markup amount
      markupAmount: markupAmount,

      // Original SMSPool USD price
      usdPrice: usdPrice,

      // Live market rate
      liveUsdToNgn: liveUsdToNgn,

      // Rate actually used
      usdToNgn: usdToNgn,

      // Whether Admin custom rate is active
      usingCustomUsdRate:
        useCustomUsdRate,

      // Pool selected
      pool: cheapest.pool,

      country: cheapest.country,
      service: cheapest.service,
    });
  } catch (error) {
    console.error(
      "Pricing error:",
      error
    );

    return NextResponse.json({
      success: false,
      message: "Server Error",
    });
  }
}
