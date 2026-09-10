import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { adminAudit } from "@/lib/adminAudit";

const SETTINGS_ID = "platform";

export async function GET() {
  try {
    const snap = await adminDb
      .collection("settings")
      .doc(SETTINGS_ID)
      .get();

    const settings = snap.exists
      ? snap.data()
      : {
          maintenanceMode: false,
          depositsEnabled: true,
          withdrawalsEnabled: true,
          marketplaceEnabled: true,
          minDeposit: 100,
          maxDeposit: 1000000,
          minWithdrawal: 500,
          maxWithdrawal: 500000,
        };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Settings GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load platform settings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const settings = {
      maintenanceMode: Boolean(body.maintenanceMode),
      depositsEnabled: Boolean(body.depositsEnabled),
      withdrawalsEnabled: Boolean(body.withdrawalsEnabled),
      marketplaceEnabled: Boolean(body.marketplaceEnabled),
      minDeposit: Number(body.minDeposit) || 0,
      maxDeposit: Number(body.maxDeposit) || 0,
      minWithdrawal: Number(body.minWithdrawal) || 0,
      maxWithdrawal: Number(body.maxWithdrawal) || 0,
    };

    if (settings.maxDeposit < settings.minDeposit) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum deposit must be greater than minimum deposit.",
        },
        { status: 400 }
      );
    }

    if (
      settings.maxWithdrawal <
      settings.minWithdrawal
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum withdrawal must be greater than minimum withdrawal.",
        },
        { status: 400 }
      );
    }

    await adminDb
      .collection("settings")
      .doc(SETTINGS_ID)
      .set(settings, { merge: true });

await adminAudit(
  "KSXJJqnu3FhuFcTye2lRlxxct6r2",
  "SETTINGS_UPDATED",
  "Updated platform settings"
);

    return NextResponse.json({
      success: true,
      message: "Platform settings saved successfully.",
      settings,
    });
  } catch (error) {
    console.error("Settings POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save platform settings.",
      },
      { status: 500 }
    );
  }
}
