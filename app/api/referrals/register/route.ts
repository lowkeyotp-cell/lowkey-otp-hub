import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const idToken = String(body.idToken ?? "").trim();
    const referralCode = String(body.referralCode ?? "")
      .trim()
      .toUpperCase();

    if (!idToken || !referralCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Referral code and authentication are required.",
        },
        { status: 400 }
      );
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const referredUserId = decodedToken.uid;

    const usersSnapshot = await adminDb
      .collection("users")
      .where("referralCode", "==", referralCode)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid referral code.",
        },
        { status: 404 }
      );
    }

    const referrerDoc = usersSnapshot.docs[0];
    const referrerId = referrerDoc.id;

    if (referrerId === referredUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot use your own referral code.",
        },
        { status: 400 }
      );
    }

    const referralId = `${referrerId}_${referredUserId}`;
    const referralRef = adminDb
      .collection("referrals")
      .doc(referralId);

    const existingReferral = await referralRef.get();

    if (existingReferral.exists) {
      return NextResponse.json({
        success: true,
        message: "Referral already recorded.",
      });
    }

    const userRef = adminDb
      .collection("users")
      .doc(referredUserId);

    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "User account was not found.",
        },
        { status: 404 }
      );
    }

    const userData = userSnapshot.data();

    if (userData?.referredBy) {
      return NextResponse.json(
        {
          success: false,
          message: "This account already has a referrer.",
        },
        { status: 400 }
      );
    }

    await adminDb.runTransaction(async (transaction) => {
      transaction.update(userRef, {
        referredBy: referrerId,
        referredAt: FieldValue.serverTimestamp(),
      });

     transaction.set(referralRef, {
  referrerId,
  referredUserId,

  // User information
  referredEmail: decodedToken.email || "",
  referredName: userData?.username || "",

  // Referral details
  referralCode,

  // Reward information
  status: "pending",
  reward: 0,
  qualifyingDeposit: 0,

  // Dates
  createdAt: FieldValue.serverTimestamp(),
  qualifiedAt: null,
  rewardedAt: null,
});
    });

    return NextResponse.json({
      success: true,
      message: "Referral recorded successfully.",
    });
  } catch (error) {
    console.error("Referral registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process referral.",
      },
      { status: 500 }
    );
  }
}
