import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

function formatDate(value: any) {
  if (!value) return null;

  try {
    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
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
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get the user's referral code.
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

    const referralCode = String(
      userData?.referralCode ?? ""
    ).trim();

    // Get referrals belonging to this user.
    const snapshot = await adminDb
      .collection("referrals")
      .where("referrerId", "==", uid)
      .get();

    const referrals = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        referredUserId: String(
          data.referredUserId ?? ""
        ),
        referredEmail: String(
          data.referredEmail ?? ""
        ),
        referredName: String(
          data.referredName ?? ""
        ),
        referralCode: String(
          data.referralCode ?? ""
        ),
        status: String(
          data.status ?? "pending"
        ),
        reward: Number(
          data.reward ?? 0
        ),
        qualifyingDeposit: Number(
          data.qualifyingDeposit ?? 0
        ),
        createdAt: formatDate(
          data.createdAt
        ),
        qualifiedAt: formatDate(
          data.qualifiedAt
        ),
        rewardedAt: formatDate(
          data.rewardedAt
        ),
      };
    });

    // Newest referrals first.
    referrals.sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });

    const totalReferrals = referrals.length;

    const pendingReferrals = referrals.filter(
      (referral) =>
        referral.status === "pending"
    ).length;

    const creditedReferrals = referrals.filter(
      (referral) =>
        referral.status === "completed"
    ).length;

    const totalEarned = referrals.reduce(
      (total, referral) =>
        total + referral.reward,
      0
    );

    return NextResponse.json({
      success: true,
      referralCode,
      referrals,
      totals: {
        totalReferrals,
        pendingReferrals,
        creditedReferrals,
        totalEarned,
      },
    });
  } catch (error) {
    console.error(
      "Referral list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load referrals",
      },
      { status: 500 }
    );
  }
}
