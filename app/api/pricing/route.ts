import { NextResponse } from "next/server";

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

    const exchangeData = await exchangeResponse.json();

    const usdToNgn = Number(
      exchangeData?.rates?.NGN
    );

    if (!usdToNgn || !Number.isFinite(usdToNgn)) {
      return NextResponse.json({
        success: false,
        message: "Failed to get live USD/NGN rate",
      });
    }

    // ─────────────────────────────
    // 5. Convert SMSPool cost to NGN
    // ─────────────────────────────

    const costPrice = usdPrice * usdToNgn;

    // ─────────────────────────────
    // 6. Add your ₦350 markup
    // ─────────────────────────────

    const PROFIT_MARKUP = 350;

    const sellingPrice =
      costPrice + PROFIT_MARKUP;

    // ─────────────────────────────
    // 7. Return everything
    // ─────────────────────────────

    return NextResponse.json({
      success: true,

      // Customer pays this
      price: sellingPrice,

      // Your estimated SMSPool cost
      costPrice: costPrice,

      // Your gross markup
      margin: PROFIT_MARKUP,

      // Original SMSPool USD price
      usdPrice: usdPrice,

      // Live USD → NGN exchange rate
      usdToNgn: usdToNgn,

      // Pool selected
      pool: cheapest.pool,

      country: cheapest.country,
      service: cheapest.service,
    });

  } catch (error) {
    console.error("Pricing error:", error);

    return NextResponse.json({
      success: false,
      message: "Server Error",
    });
  }
}
