import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { country, service, pool } = await req.json();

    if (!country || !service) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a country and service.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      console.error("SMSPool API key is not configured.");

      return NextResponse.json(
        {
          success: false,
          message:
            "This service is temporarily unavailable. Please try again later.",
        },
        { status: 500 }
      );
    }

    const formData = new FormData();

    formData.append("key", apiKey);
    formData.append("country", String(country));
    formData.append("service", String(service));

    if (pool !== undefined && pool !== null) {
      formData.append("pool", String(pool));
    }

    const response = await fetch(
      "https://api.smspool.net/purchase/sms",
      {
        method: "POST",
        body: formData,
        cache: "no-store",
      }
    );

    const data = await response.json();

    // Keep the real API response in server logs for debugging.
    console.log("SMSPool purchase response:", data);

    if (!data || Number(data.success) !== 1) {
      return NextResponse.json({
        success: false,
        message:
          "This number is currently unavailable. Please try another service or try again later.",
      });
    }

    return NextResponse.json({
      success: true,
      number: data.number,
      orderId: data.order_id,
      country: data.country,
      service: data.service,
      pool: data.pool,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    console.error("Buy number error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "We couldn't complete your request right now. Please try again later.",
      },
      { status: 500 }
    );
  }
}
