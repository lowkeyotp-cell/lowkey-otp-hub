import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("EXCHANGE_RATE_REQUEST_FAILED");
    }

    const data = await response.json();

    const usdToNgn = Number(
      data?.rates?.NGN
    );

    if (
      !Number.isFinite(usdToNgn) ||
      usdToNgn <= 0
    ) {
      throw new Error("INVALID_USD_NGN_RATE");
    }

    return NextResponse.json({
      success: true,
      usdToNgn,
    });

  } catch (error) {
    console.error(
      "Market rate error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load live USD/NGN rate.",
      },
      {
        status: 500,
      }
    );
  }
}
