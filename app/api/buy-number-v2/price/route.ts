import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const country = searchParams.get("country");
    const service = searchParams.get("service");
    const pool = searchParams.get("pool");

    if (!country || !service) {
      return NextResponse.json(
        { success: false, message: "Country and service are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "SMSPool API key is missing." },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("country", country);
    formData.append("service", service);

    if (pool) {
      formData.append("pool", pool);
    }

    const response = await fetch(
      "https://api.smspool.net/request/price",
      {
        method: "POST",
        body: formData,
        cache: "no-store",
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("V2 SMSPool price error:", response.status, text);

      return NextResponse.json(
        { success: false, message: "Failed to load current price." },
        { status: 502 }
      );
    }

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid SMSPool price response." },
        { status: 502 }
      );
    }

    const usdPrice = Number(data?.price);

    if (!Number.isFinite(usdPrice) || usdPrice <= 0) {
      return NextResponse.json(
        { success: false, message: "No valid price found." },
        { status: 404 }
      );
    }

    const settingsSnap = await adminDb
      .collection("platformSettings")
      .doc("pricing")
      .get();

    const settings = settingsSnap.exists ? settingsSnap.data() : null;

    const useCustomUsdRate = Boolean(settings?.useCustomUsdRate);
    const customUsdToNgn = Number(settings?.customUsdToNgn ?? 0);
    const markupPercent = Number(settings?.markupPercent ?? 0);

    let liveUsdToNgn = 0;

    try {
      const exchangeResponse = await fetch(
        "https://open.er-api.com/v6/latest/USD",
        { cache: "no-store" }
      );

      if (exchangeResponse.ok) {
        const exchangeData = await exchangeResponse.json();
        liveUsdToNgn = Number(exchangeData?.rates?.NGN ?? 0);
      }
    } catch (error) {
      console.error("V2 exchange rate error:", error);
    }

    const usdToNgn =
      useCustomUsdRate &&
      Number.isFinite(customUsdToNgn) &&
      customUsdToNgn > 0
        ? customUsdToNgn
        : liveUsdToNgn;

    if (!Number.isFinite(usdToNgn) || usdToNgn <= 0) {
      return NextResponse.json(
        { success: false, message: "Unable to determine exchange rate." },
        { status: 502 }
      );
    }

    const costPrice = usdPrice * usdToNgn;
    const markupAmount = costPrice * (markupPercent / 100);
    const sellingPrice = costPrice + markupAmount;

    return NextResponse.json({
      success: true,
      country,
      service,
      pool: pool || null,
      usdPrice,
      usdToNgn,
      costPrice,
      markupPercent,
      sellingPrice,
      highPrice: data?.high_price ?? null,
      successRate: data?.success_rate ?? null,
    });
  } catch (error) {
    console.error("V2 price error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load price." },
      { status: 500 }
    );
  }
}
