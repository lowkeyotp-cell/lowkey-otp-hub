import { NextResponse } from "next/server";

export async function GET() {
  try {
    const formData = new FormData();

    formData.append("key", process.env.SMSPOOL_API_KEY || "");

    const response = await fetch(
      "https://api.smspool.net/request/balance",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch balance",
      },
      { status: 500 }
    );
  }
}
