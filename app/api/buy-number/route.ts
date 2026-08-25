import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { country, service, pool } = await req.json();

    if (!country || !service) {
      return NextResponse.json(
        {
          success: false,
          message: "Country and service are required",
        },
        { status: 400 }
      );
    }

    const formData = new FormData();

    formData.append(
      "key",
      process.env.SMSPOOL_API_KEY || ""
    );

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

    console.log("SMSPool purchase:", data);

    if (!data || Number(data.success) !== 1) {
      return NextResponse.json({
        success: false,
        message:
          data?.message ||
          "SMSPool could not provide a number",
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

    return NextResponse.json({
      success: false,
      message: "Server error while purchasing number",
    });
  }
}
