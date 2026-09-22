import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "SMSPool API key is missing." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.smspool.net/country/retrieve_all?key=${apiKey}`,
      { cache: "no-store" }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("SMSPool countries error:", response.status, text);
      return NextResponse.json(
        { success: false, message: "Failed to load countries." },
        { status: 502 }
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid countries response." },
        { status: 502 }
      );
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { success: false, message: "Invalid countries data." },
        { status: 502 }
      );
    }

    const countries = data
      .map((country: any) => ({
        id: country.ID ?? country.id,
        name: country.name ?? country.country ?? "",
        shortName: country.short_name ?? country.shortName ?? "",
        code: country.code ?? country.cc ?? "",
        flag: country.flag ?? "",
      }))
      .filter((country: any) => country.id !== undefined && country.name);

    countries.sort((a: any, b: any) =>
      String(a.name).localeCompare(String(b.name))
    );

    return NextResponse.json({
      success: true,
      countries,
    });
  } catch (error) {
    console.error("Buy Number V2 countries error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load countries." },
      { status: 500 }
    );
  }
}
