import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { adminAudit } from "@/lib/adminAudit";

export async function GET() {
  try {
    const transactions = await adminDb
      .collection("platformTransactions")
      .get();

    const users = await adminDb
      .collection("users")
      .get();

    let revenue = 0;
    let profit = 0;
    let refundsTotal = 0;
    let usersWallet = 0;

    transactions.forEach((doc) => {
      const data = doc.data();

      if (data.type === "sale") {
        revenue += Number(data.amount ?? 0);
        profit += Number(data.profit ?? 0);
      }

      if (data.type === "refund") {
        refundsTotal += Number(
          data.amount ?? 0
        );
      }
    });

    users.forEach((doc) => {
      const data = doc.data();

      usersWallet += Number(
        data.balance ?? 0
      );
    });

    // Money belonging to the platform.
    const withdrawable =
      Math.max(
        0,
        revenue -
          refundsTotal
      );

    const recentSalesSnap =
      await adminDb
        .collection("platformTransactions")
        .where("type", "==", "sale")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

    const recentSales =
      recentSalesSnap.docs.map(
        (doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            orderId:
              data.orderId ?? "-",
            amount:
              Number(data.amount ?? 0),
            profit:
              Number(data.profit ?? 0),
            country:
              data.country ?? "-",
            service:
              data.service ?? "-",
            createdAt:
              data.createdAt ?? null,
          };
        }
      );

    await adminAudit(
  "KSXJJqnu3FhuFcTye2lRlxxct6r2",
  "VIEW_FINANCE",
  "Viewed Finance Center"
);

return NextResponse.json({
  success: true,
  revenue,
  profit,
  refunds: refundsTotal,
  usersWallet,
  withdrawable,
  recentSales,
});
  } catch (err) {
    console.error(
      "Admin finance error:",
      err
    );

    return NextResponse.json({
      success: false,
    });
  }
}
