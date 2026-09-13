import { NextRequest, NextResponse } from "next/server";
import { generateLowkeyReply } from "@/lib/whatsapp/reply-engine";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    VERIFY_TOKEN &&
    token === VERIFY_TOKEN
  ) {
    return new NextResponse(challenge || "", {
      status: 200,
    });
  }

  return NextResponse.json(
    {
      success: false,
      message: "Webhook verification failed.",
    },
    { status: 403 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log(
      "WhatsApp webhook received:",
      JSON.stringify(body)
    );

    const customerMessage =
      body?.message?.text ||
      body?.text ||
      "";

    if (customerMessage) {
      const reply = await generateLowkeyReply(customerMessage);

      console.log(
        "LOWKEY bot reply:",
        JSON.stringify(reply)
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid webhook payload.",
      },
      { status: 400 }
    );
  }
}
