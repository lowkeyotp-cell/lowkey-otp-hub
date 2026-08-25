import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.smspool.net/country/retrieve_all"
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch countries",
      },
      {
        status: 500,
      }
    );
  }
}
