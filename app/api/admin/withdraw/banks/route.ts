import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.uid !== ADMIN_UID) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      return NextResponse.json(
        { success: false, message: "Paystack is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.paystack.co/bank?country=nigeria&perPage=100",
      {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        { success: false, message: "Unable to load banks." },
        { status: 502 }
      );
    }

    const banks = (data.data ?? []).map((bank: any) => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      active: bank.active,
    }));

    return NextResponse.json({
      success: true,
      banks,
    });
  } catch (error) {
    console.error("Bank list error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load banks." },
      { status: 500 }
    );
  }
}
