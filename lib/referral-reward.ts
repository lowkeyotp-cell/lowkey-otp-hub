import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const REFERRAL_MIN_DEPOSIT = 500;
export const REFERRAL_REWARD = 100;

export async function applyReferralReward(
  transaction: FirebaseFirestore.Transaction,
  userRef: FirebaseFirestore.DocumentReference,
  userSnap: FirebaseFirestore.DocumentSnapshot,
  paymentReference: string,
  depositAmount: number
) {
  if (depositAmount < REFERRAL_MIN_DEPOSIT) {
    return false;
  }

  const userData = userSnap.data();

  const referrerId = String(
    userData?.referredBy ?? ""
  ).trim();

  if (!referrerId) {
    return false;
  }

  const referralRef = adminDb
    .collection("referrals")
    .doc(`${referrerId}_${userRef.id}`);

  const rewardRef = adminDb
    .collection("walletTransactions")
    .doc(
      `referral_${referrerId}_${userRef.id}`
    );

  const referrerRef = adminDb
    .collection("users")
    .doc(referrerId);

  const referralSnap =
    await transaction.get(referralRef);

  const rewardSnap =
    await transaction.get(rewardRef);

  const referrerSnap =
    await transaction.get(referrerRef);

  if (!referralSnap.exists) {
    return false;
  }

  // This also makes the reward idempotent.
  if (rewardSnap.exists) {
    return false;
  }

  if (!referrerSnap.exists) {
    throw new Error(
      "Referrer account not found"
    );
  }

  const referralData =
    referralSnap.data();

  if (
    referralData?.status !== "pending"
  ) {
    return false;
  }

  const referrerData =
    referrerSnap.data();

  const currentBalance = Number(
    referrerData?.balance ?? 0
  );

  if (!Number.isFinite(currentBalance)) {
    throw new Error(
      "Referrer wallet balance is invalid"
    );
  }

  transaction.update(referrerRef, {
    balance:
      currentBalance + REFERRAL_REWARD,
  });

  transaction.update(referralRef, {
    status: "completed",
    reward: REFERRAL_REWARD,
    qualifyingDeposit: depositAmount,
    rewardReference: paymentReference,
    qualifiedAt:
      FieldValue.serverTimestamp(),
  });

  transaction.set(rewardRef, {
    uid: referrerId,
    type: "referral_reward",
    amount: REFERRAL_REWARD,
    status: "success",
    referredUserId: userRef.id,
    paymentReference,
    qualifyingDeposit: depositAmount,
    createdAt:
      FieldValue.serverTimestamp(),
  });

  return true;
}
