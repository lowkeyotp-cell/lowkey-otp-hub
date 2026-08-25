import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { country, service, pool } = await req.json();

  const formData = new FormData();

  formData.append("country", country);
  formData.append("service", service);
  formData.append("pool", pool || "");
  formData.append("quantity", "1");
  formData.append("pricing_option", "0");
  formData.append("activation_type", "SMS");

  const response = await fetch(
    "https://api.smspool.net/purchase/sms",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SMSPOOL_API_KEY}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  return NextResponse.json(data);
}
