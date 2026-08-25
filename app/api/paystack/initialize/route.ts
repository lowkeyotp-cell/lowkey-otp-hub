import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const idToken = authorization.substring(7);

    const decodedToken =
      await getAuth().verifyIdToken(idToken);

    const body = await req.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum funding amount is ₦100",
        },
        { status: 400 }
      );
    }

    const userSnap = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (!userSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found",
        },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    const email =
      userData?.email || decodedToken.email;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "User email not found",
        },
        { status: 400 }
      );
    }

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100),
          currency: "NGN",
          metadata: {
            uid: decodedToken.uid,
            purpose: "wallet_funding",
          },
        }),
        cache: "no-store",
      }
    );

    const data = await paystackResponse.json();

    console.log("Paystack initialize:", data);

    if (
      !paystackResponse.ok ||
      !data?.status ||
      !data?.data?.access_code
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            "Paystack initialization failed",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error(
      "Paystack initialize error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error while initializing payment",
      },
      { status: 500 }
    );
  }
}
