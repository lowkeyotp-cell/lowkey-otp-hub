import { NextRequest, NextResponse } from "next/server";
import { generateLowkeyReply } from "@/lib/whatsapp/reply-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body?.message || "").trim();

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer message is required.",
        },
        { status: 400 }
      );
    }

    const reply = await generateLowkeyReply(message);

    return NextResponse.json({
      success: true,
      reply: reply.message,
      intent: reply.intent,
      needsHuman: reply.needsHuman,
    });
  } catch (error) {
    console.error("LOWKEY AI support error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process customer message.",
      },
      { status: 500 }
    );
  }
}
