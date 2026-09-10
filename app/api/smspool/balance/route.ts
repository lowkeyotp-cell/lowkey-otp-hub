import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "SMSPool API key is not configured",
        },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append("key", apiKey);

    const response = await fetch(
      "https://api.smspool.net/request/balance",
      {
        method: "POST",
        body: formData,
        cache: "no-store",
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "SMSPool request failed",
          status: response.status,
          details: text,
        },
        { status: 502 }
      );
    }

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "SMSPool returned an invalid response",
          details: text,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SMSPool balance error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to SMSPool",
      },
      { status: 500 }
    );
  }
}
