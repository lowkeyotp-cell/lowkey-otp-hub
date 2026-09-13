import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

import { adminDb } from "@/lib/firebase-admin";
import { adminAudit } from "@/lib/adminAudit";

const ADMIN_UID = "KSXJJqnu3FhuFcTye2lRlxxct6r2";
const SETTINGS_ID = "platform";

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  depositsEnabled: true,
  withdrawalsEnabled: true,
  marketplaceEnabled: true,
  minDeposit: 100,
  maxDeposit: 1000000,
  minWithdrawal: 500,
  maxWithdrawal: 500000,
};

async function verifyAdmin(req: Request) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authorization.substring(7);
  const decoded = await getAuth().verifyIdToken(token);

  if (decoded.uid !== ADMIN_UID) {
    throw new Error("FORBIDDEN");
  }

  return decoded;
}

function getErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      {
        success: false,
        message: "Admin access required.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: "Unable to process platform settings.",
    },
    { status: 500 }
  );
}

export async function GET(req: Request) {
  try {
    await verifyAdmin(req);

    const snap = await adminDb
      .collection("settings")
      .doc(SETTINGS_ID)
      .get();

    const settings = snap.exists
      ? {
          ...DEFAULT_SETTINGS,
          ...snap.data(),
        }
      : DEFAULT_SETTINGS;

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Settings GET error:", error);

    return getErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin(req);

    const body = await req.json();

    const settings = {
      maintenanceMode: Boolean(body.maintenanceMode),
      depositsEnabled: Boolean(body.depositsEnabled),
      withdrawalsEnabled: Boolean(body.withdrawalsEnabled),
      marketplaceEnabled: Boolean(body.marketplaceEnabled),
      minDeposit: Number(body.minDeposit),
      maxDeposit: Number(body.maxDeposit),
      minWithdrawal: Number(body.minWithdrawal),
      maxWithdrawal: Number(body.maxWithdrawal),
    };

    if (
      !Number.isFinite(settings.minDeposit) ||
      settings.minDeposit < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum deposit must be a valid non-negative number.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(settings.maxDeposit) ||
      settings.maxDeposit < settings.minDeposit
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum deposit must be greater than or equal to minimum deposit.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(settings.minWithdrawal) ||
      settings.minWithdrawal < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Minimum withdrawal must be a valid non-negative number.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(settings.maxWithdrawal) ||
      settings.maxWithdrawal < settings.minWithdrawal
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum withdrawal must be greater than or equal to minimum withdrawal.",
        },
        { status: 400 }
      );
    }

    await adminDb
      .collection("settings")
      .doc(SETTINGS_ID)
      .set(
        {
          ...settings,
          updatedAt: new Date(),
          updatedBy: admin.uid,
        },
        { merge: true }
      );

    await adminAudit(
      admin.uid,
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

    return getErrorResponse(error);
  }
}
