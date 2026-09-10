import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "SMSPOOL_API_KEY is missing." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");

    if (!country) {
      return NextResponse.json(
        { error: "Country is required." },
        { status: 400 }
      );
    }

    // Get SMSPool services and pricing.
    const [servicesResponse, pricingResponse] =
      await Promise.all([
        fetch(
          `https://api.smspool.net/service/retrieve_all?key=${apiKey}`,
          {
            cache: "no-store",
          }
        ),
        fetch(
          "https://api.smspool.net/request/pricing",
          {
            method: "POST",
            cache: "no-store",
            body: (() => {
              const form = new FormData();

              form.append("key", apiKey);

              return form;
            })(),
          }
        ),
      ]);

    if (
      !servicesResponse.ok ||
      !pricingResponse.ok
    ) {
      return NextResponse.json(
        {
          error: "SMSPool request failed.",
        },
        { status: 502 }
      );
    }

    const services =
      await servicesResponse.json();

    const pricing =
      await pricingResponse.json();

    if (
      !Array.isArray(services) ||
      !Array.isArray(pricing)
    ) {
      return NextResponse.json(
        {
          error: "Invalid SMSPool response.",
        },
        { status: 502 }
      );
    }

    // Get your existing Admin Market pricing settings.
    const settingsSnap = await adminDb
      .collection("platformSettings")
      .doc("pricing")
      .get();

    const settings = settingsSnap.exists
      ? settingsSnap.data()
      : {
          markupPercent: 0,
          customUsdToNgn: null,
          useCustomUsdRate: false,
        };

    const markupPercent =
      Number(settings?.markupPercent ?? 0);

    const useCustomUsdRate =
      Boolean(settings?.useCustomUsdRate);

    const customUsdToNgn =
      Number(settings?.customUsdToNgn ?? 0);

    // Get live USD → NGN rate.
    const exchangeResponse = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      {
        cache: "no-store",
      }
    );

    if (!exchangeResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to load exchange rate.",
        },
        { status: 502 }
      );
    }

    const exchangeData =
      await exchangeResponse.json();

    const liveUsdToNgn = Number(
      exchangeData?.rates?.NGN
    );

    if (
      !Number.isFinite(liveUsdToNgn) ||
      liveUsdToNgn <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid USD/NGN exchange rate.",
        },
        { status: 502 }
      );
    }

    const usdToNgn =
      useCustomUsdRate &&
      Number.isFinite(customUsdToNgn) &&
      customUsdToNgn > 0
        ? customUsdToNgn
        : liveUsdToNgn;

    // Build country-specific service list.
    const filtered = services
      .map((service: any) => {
        const matches = pricing.filter(
          (item: any) =>
            String(item.country) ===
              String(country) &&
            Number(item.service) ===
              Number(service.ID)
        );

        if (!matches.length) {
          return null;
        }

        matches.sort(
          (a: any, b: any) =>
            Number(a.price) -
            Number(b.price)
        );

        const cheapest = matches[0];

        const usdPrice =
          Number(cheapest.price);

        if (
          !Number.isFinite(usdPrice) ||
          usdPrice <= 0
        ) {
          return null;
        }

        const costPrice =
          usdPrice * usdToNgn;

        const markupAmount =
          costPrice *
          (markupPercent / 100);

        const calculatedSellingPrice =
          costPrice + markupAmount;

        // Keep the existing special Signal rule.
        const sellingPrice =
          String(country) === "1" &&
          Number(service.ID) === 829
            ? 100
            : calculatedSellingPrice;

        return {
          ID: service.ID,
          name: service.name,
          favourite: service.favourite ?? 0,
          pool: cheapest.pool,

          // Customer-facing price.
          customerPrice: sellingPrice,
        };
      })
      .filter(Boolean);

    filtered.sort(
      (a: any, b: any) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error(
      "SMSPool services error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch services.",
      },
      { status: 500 }
    );
  }
}
