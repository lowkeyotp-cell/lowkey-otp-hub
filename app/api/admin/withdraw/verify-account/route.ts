import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

export async function POST(req: Request) {
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

    const body = await req.json();

    const accountNumber = String(body.accountNumber ?? "").trim();
    const bankCode = String(body.bankCode ?? "").trim();

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid 10-digit account number.",
        },
        { status: 400 }
      );
    }

    if (!bankCode) {
      return NextResponse.json(
        { success: false, message: "Please select a bank." },
        { status: 400 }
      );
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      return NextResponse.json(
        { success: false, message: "Paystack is not configured." },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    });

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?${params.toString()}`,
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
        {
          success: false,
          message: data.message || "Unable to verify this account.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
      bankId: data.data.bank_id ?? null,
    });
  } catch (error) {
    console.error("Account verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Account verification failed.",
      },
      { status: 500 }
    );
  }
}
