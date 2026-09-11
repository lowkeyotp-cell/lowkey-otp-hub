import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    // ─────────────────────────────
    // 1. Authenticate user
    // ─────────────────────────────

    const authorization =
      req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to purchase a number.",
        },
        { status: 401 }
      );
    }

    const idToken = authorization.substring(7);

    const decodedToken =
      await getAuth().verifyIdToken(idToken);

    // ─────────────────────────────
    // Marketplace availability
    // ─────────────────────────────

   const marketplaceSettingsSnap = await adminDb
  .collection("settings")
  .doc("platform")
  .get();

const marketplaceSettings =
  marketplaceSettingsSnap.exists
    ? marketplaceSettingsSnap.data() ?? {}
    : {};

  if (
  marketplaceSettings.marketplaceEnabled === false
) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The marketplace is temporarily unavailable. Please check back later.",
        },
        { status: 503 }
      );
    }

    // ─────────────────────────────
    // 2. Read purchase request
    // ─────────────────────────────

    const body = await req.json();

    const country = body.country;
    const service = body.service;

    if (!country || !service) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a country and service.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      console.error(
        "SMSPool API key is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "The number service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────
    // 3. Get LIVE SMSPool pricing
    //    Never trust price from browser
    // ─────────────────────────────

    const pricingForm = new FormData();

    pricingForm.append("key", apiKey);

    const pricingResponse = await fetch(
      "https://api.smspool.net/request/pricing",
      {
        method: "POST",
        body: pricingForm,
        cache: "no-store",
      }
    );

    const pricing = await pricingResponse.json();

    if (!Array.isArray(pricing)) {
      console.error(
        "Invalid SMSPool pricing response:",
        pricing
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Live pricing is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    // ─────────────────────────────
    // 4. Find selected country/service
    // ─────────────────────────────

    const matches = pricing.filter(
      (item: any) =>
        String(item.country) ===
          String(country) &&
        Number(item.service) ===
          Number(service)
    );

console.log("COUNTRY:", country);
console.log("SERVICE ID:", service);
console.log("MATCHING PRICES:", matches);

    if (matches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This number is currently unavailable.",
        },
        { status: 404 }
      );
    }

    matches.sort(
      (a: any, b: any) =>
        Number(a.price) -
        Number(b.price)
    );

    const cheapest = matches[0];

    const usdPrice =
      Number(cheapest.price);

    if (
      !Number.isFinite(usdPrice) ||
      usdPrice <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid number pricing.",
        },
        { status: 503 }
      );
    }

    // ─────────────────────────────
    // 5. Get live USD → NGN rate
    // ─────────────────────────────

    const exchangeResponse = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      {
        cache: "no-store",
      }
    );

    const exchangeData =
      await exchangeResponse.json();

    const usdToNgn = Number(
      exchangeData?.rates?.NGN
    );

    if (
      !Number.isFinite(usdToNgn) ||
      usdToNgn <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Exchange rate is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    // ─────────────────────────────
// 6. Load Admin pricing settings
// ─────────────────────────────

const settingsRef = adminDb
  .collection("platformSettings")
  .doc("pricing");

const settingsSnap =
  await settingsRef.get();

const settings =
  settingsSnap.exists
    ? settingsSnap.data()
    : null;

const useCustomUsdRate =
  Boolean(settings?.useCustomUsdRate);

const customUsdToNgn =
  Number(settings?.customUsdToNgn ?? 0);

const markupPercent =
  Number(settings?.markupPercent ?? 0);

// ─────────────────────────────
// 7. Choose active USD/NGN rate
// ─────────────────────────────

const activeUsdToNgn =
  useCustomUsdRate &&
  Number.isFinite(customUsdToNgn) &&
  customUsdToNgn > 0
    ? customUsdToNgn
    : usdToNgn;

// ─────────────────────────────
// 8. Calculate SERVER-SIDE price
// ─────────────────────────────

const costPrice =
  usdPrice * activeUsdToNgn;

const markupAmount =
  costPrice *
  (markupPercent / 100);

const calculatedSellingPrice =
  costPrice + markupAmount;

// Keep existing Signal special price
const walletAmount =
  String(country) === "1" &&
  Number(service) === 829
    ? 100
    : Math.ceil(
        calculatedSellingPrice
      );

    const userRef = adminDb
      .collection("users")
      .doc(decodedToken.uid);

    // ─────────────────────────────
    // 7. Atomically reserve wallet
    // ─────────────────────────────

    let previousBalance = 0;

    await adminDb.runTransaction(
      async (transaction) => {
        const userSnap =
          await transaction.get(userRef);

        if (!userSnap.exists) {
          throw new Error(
            "USER_NOT_FOUND"
          );
        }

        const userData =
          userSnap.data();

        const balance =
          Number(userData?.balance ?? 0);

console.log("WALLET DEBUG:", {
  balance,
  walletAmount,
  country,
  service,
});

        if (
          !Number.isFinite(balance) ||
          balance < walletAmount
        ) {
          throw new Error(
            "INSUFFICIENT_BALANCE"
          );
        }

        previousBalance = balance;

        transaction.update(userRef, {
          balance:
            balance - walletAmount,
        });
      }
    );

    // ─────────────────────────────
    // 8. Purchase from SMSPool
    // ─────────────────────────────

    const purchaseForm = new FormData();

    purchaseForm.append(
      "key",
      apiKey
    );

    purchaseForm.append(
      "country",
      String(country)
    );

    purchaseForm.append(
      "service",
      String(service)
    );

    if (
      cheapest.pool !== undefined &&
      cheapest.pool !== null
    ) {
      purchaseForm.append(
        "pool",
        String(cheapest.pool)
      );
    }

    const purchaseResponse =
      await fetch(
        "https://api.smspool.net/purchase/sms",
        {
          method: "POST",
          body: purchaseForm,
          cache: "no-store",
        }
      );

    const purchaseData =
      await purchaseResponse.json();

    console.log(
      "SMSPool purchase response:",
      purchaseData
    );

    // ─────────────────────────────
    // 9. Refund if SMSPool fails
    // ─────────────────────────────

    if (
      !purchaseData ||
      Number(purchaseData.success) !== 1
    ) {
      await adminDb.runTransaction(
        async (transaction) => {
          const userSnap =
            await transaction.get(userRef);

          if (!userSnap.exists) {
            return;
          }

          const currentBalance =
            Number(
              userSnap.data()?.balance ?? 0
            );

          transaction.update(userRef, {
            balance:
              currentBalance +
              walletAmount,
          });
        }
      );

      return NextResponse.json({
        success: false,
        message:
          "This number became unavailable. Your wallet has been refunded.",
      });
    }

// Save the order in Firestore
await adminDb.collection("orders").add({
  uid: decodedToken.uid,

  number: purchaseData.number,
  orderId: purchaseData.order_id,

  country,
  service,
  pool: purchaseData.pool,

   price: walletAmount,

  // Accounting information
  smsPoolUsdPrice: usdPrice,
  usdToNgn: activeUsdToNgn,
  smsPoolCostNgn: costPrice,

  status: "waiting",

  otp: null,

  createdAt: new Date(),

  expiresAt: new Date(
    Date.now() + 600 * 1000
  ),
});

await adminDb.collection("platformTransactions").add({
  uid: decodedToken.uid,

  orderId: purchaseData.order_id,

  type: "sale",

  amount: walletAmount,

  smsPoolUsdPrice: usdPrice,
  usdToNgn: usdToNgn,
  smsPoolCostNgn: costPrice,

  country: String(country),
  service: String(service),
  pool: purchaseData.pool ?? null,

  status: "completed",

  createdAt: new Date(),
});

    // ─────────────────────────────
    // 10. Success
    // ─────────────────────────────

    return NextResponse.json({
      success: true,

      number:
        purchaseData.number,

      orderId:
        purchaseData.order_id,

      country:
        purchaseData.country ??
        country,

      service:
        purchaseData.service ??
        service,

      pool:
        purchaseData.pool ??
        cheapest.pool,

      expiresIn:
        purchaseData.expires_in,

      price:
        walletAmount,

      costPrice:
        costPrice,

      margin:
       markupPercent,

      remainingBalance:
        previousBalance -
        walletAmount,
    });

  } catch (error: any) {
    console.error(
      "Buy number error:",
      error
    );

    if (
      error?.message ===
      "USER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User account not found.",
        },
        { status: 404 }
      );
    }

    if (
      error?.message ===
      "INSUFFICIENT_BALANCE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your wallet balance is insufficient for this purchase.",
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "We couldn't complete your purchase right now. Please try again later.",
      },
      { status: 500 }
    );
  }
}
