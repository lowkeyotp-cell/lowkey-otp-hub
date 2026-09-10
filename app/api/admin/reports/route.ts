import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { adminAudit } from "@/lib/adminAudit";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";

async function verifyAdmin(req: Request) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  try {
    const token = authorization.substring(7);
    const decoded = await getAuth().verifyIdToken(token);

    return decoded.uid === ADMIN_UID;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const transactions = await adminDb
      .collection("platformTransactions")
      .get();

    let revenue = 0;
    let profit = 0;
    let refunds = 0;
    let sales = 0;

    transactions.forEach((doc) => {
      const data = doc.data();

      if (data.type === "sale") {
        sales += 1;
        revenue += Number(data.amount ?? 0);
        profit += Number(data.profit ?? 0);
      }

      if (data.type === "refund") {
        refunds += Number(data.amount ?? 0);
      }
    });

    const walletTransactions = await adminDb
      .collection("walletTransactions")
      .get();

    let deposits = 0;

    walletTransactions.forEach((doc) => {
      const data = doc.data();
      const type = String(data.type ?? "").toLowerCase();

      if (
        type === "deposit" ||
        type === "fund" ||
        type === "wallet_deposit"
      ) {
        deposits += Number(
          data.amount ??
          data.paidAmount ??
          0
        );
      }
    });

await adminAudit(
  ADMIN_UID,
  "VIEW_REPORTS",
  "Opened Financial Reports"
);

return NextResponse.json({
  success: true,
  revenue,
  profit,
  refunds,
  deposits,
  sales,
});
  } catch (error) {
    console.error("Reports API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load financial reports.",
      },
      { status: 500 }
    );
  }
}
