import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "SMSPool API key is missing." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");

    if (!country) {
      return NextResponse.json(
        { success: false, message: "Country is required." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.smspool.net/service/retrieve_all?key=${apiKey}`,
      { cache: "no-store" }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("SMSPool services error:", response.status, text);

      return NextResponse.json(
        { success: false, message: "Failed to load services." },
        { status: 502 }
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid services response." },
        { status: 502 }
      );
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { success: false, message: "Invalid services data." },
        { status: 502 }
      );
    }

    const services = data
      .map((service: any) => ({
        id: service.ID ?? service.id,
        name: service.name ?? service.service ?? service.serviceName ?? "",
        favourite: service.favourite ?? 0,
        pool: service.pool ?? null,
      }))
      .filter((service: any) => service.id !== undefined && service.name);

    services.sort((a: any, b: any) =>
      String(a.name).localeCompare(String(b.name))
    );

    return NextResponse.json({
      success: true,
      country: String(country),
      services,
    });
  } catch (error) {
    console.error("Buy Number V2 services error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load services." },
      { status: 500 }
    );
  }
}
