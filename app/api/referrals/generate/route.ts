import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function generateReferralCode(length = 8) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < length; i++) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return code;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const idToken = String(body.idToken ?? "").trim();

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const uid = decodedToken.uid;

    const userRef = adminDb.collection("users").doc(uid);

    const userSnap = await userRef.get();

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

    // IMPORTANT:
    // If the user already has a referral code,
    // ALWAYS return the same code.
    if (userData?.referralCode) {
      return NextResponse.json({
        success: true,
        referralCode: userData.referralCode,
        existing: true,
      });
    }

    let referralCode = "";

    // Generate a unique code.
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = generateReferralCode();

      const existing = await adminDb
        .collection("users")
        .where("referralCode", "==", candidate)
        .limit(1)
        .get();

      if (existing.empty) {
        referralCode = candidate;
        break;
      }
    }

    if (!referralCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not generate referral code",
        },
        { status: 500 }
      );
    }

    // Final check immediately before saving.
    // If another request already assigned a code,
    // never overwrite it.
    const latestSnap = await userRef.get();

    const latestData = latestSnap.data();

    if (latestData?.referralCode) {
      return NextResponse.json({
        success: true,
        referralCode: latestData.referralCode,
        existing: true,
      });
    }

    await userRef.update({
      referralCode,
    });

    return NextResponse.json({
      success: true,
      referralCode,
      existing: false,
    });
  } catch (error) {
    console.error("Referral code generation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error generating referral code",
      },
      { status: 500 }
    );
  }
}
