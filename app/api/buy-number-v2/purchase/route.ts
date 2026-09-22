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
          message: "Please log in to purchase a number.",
        },
        { status: 401 }
      );
    }

    const idToken = authorization.substring(7);
    const decodedToken = await getAuth().verifyIdToken(idToken);

    const body = await req.json();

    const country = body.country;
    const service = body.service;
    const pool = body.pool;

    if (!country || !service) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a country and service.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.SMSPOOL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "The number service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    // Get the LIVE price from the working SMSPool price endpoint.
    const pricingForm = new FormData();

    pricingForm.append("key", apiKey);
    pricingForm.append("country", String(country));
    pricingForm.append("service", String(service));

    if (pool !== undefined && pool !== null && pool !== "") {
      pricingForm.append("pool", String(pool));
    }

    const pricingResponse = await fetch(
      "https://api.smspool.net/request/price",
      {
        method: "POST",
        body: pricingForm,
        cache: "no-store",
      }
    );

    const pricingText = await pricingResponse.text();

    if (!pricingResponse.ok) {
      console.error(
        "V2 SMSPool price error:",
        pricingResponse.status,
        pricingText
      );

      return NextResponse.json(
        {
          success: false,
          message: "Live pricing is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    let pricing: any;

    try {
      pricing = JSON.parse(pricingText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid live pricing response.",
        },
        { status: 503 }
      );
    }

    const usdPrice = Number(pricing?.price);

    if (!Number.isFinite(usdPrice) || usdPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This number is currently unavailable.",
        },
        { status: 404 }
      );
    }

    // Get exchange rate.
    const exchangeResponse = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      {
        cache: "no-store",
      }
    );

    if (!exchangeResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Exchange rate is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const exchangeData = await exchangeResponse.json();

    const liveUsdToNgn = Number(
      exchangeData?.rates?.NGN
    );

    // Load pricing settings.
    const settingsSnap = await adminDb
      .collection("platformSettings")
      .doc("pricing")
      .get();

    const settings = settingsSnap.exists
      ? settingsSnap.data()
      : null;

    const useCustomUsdRate = Boolean(
      settings?.useCustomUsdRate
    );

    const customUsdToNgn = Number(
      settings?.customUsdToNgn ?? 0
    );

    const markupPercent = Number(
      settings?.markupPercent ?? 0
    );

    const usdToNgn =
      useCustomUsdRate &&
      Number.isFinite(customUsdToNgn) &&
      customUsdToNgn > 0
        ? customUsdToNgn
        : liveUsdToNgn;

    if (!Number.isFinite(usdToNgn) || usdToNgn <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Exchange rate is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const costPrice = usdPrice * usdToNgn;

    const markupAmount =
      costPrice * (markupPercent / 100);

    const calculatedSellingPrice =
      costPrice + markupAmount;

    const walletAmount =
      String(country) === "1" &&
      Number(service) === 829
        ? 100
        : Math.ceil(calculatedSellingPrice);

    const userRef = adminDb
      .collection("users")
      .doc(decodedToken.uid);

    let previousBalance = 0;

    // Reserve wallet balance.
    await adminDb.runTransaction(
      async (transaction) => {
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists) {
          throw new Error("USER_NOT_FOUND");
        }

        const userData = userSnap.data();

        const balance = Number(
          userData?.balance ?? 0
        );

        if (
          !Number.isFinite(balance) ||
          balance < walletAmount
        ) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        previousBalance = balance;

        transaction.update(userRef, {
          balance: balance - walletAmount,
        });
      }
    );

    // Purchase the number from SMSPool.
    const purchaseForm = new FormData();

    purchaseForm.append("key", apiKey);
    purchaseForm.append("country", String(country));
    purchaseForm.append("service", String(service));

    if (pool !== undefined && pool !== null && pool !== "") {
      purchaseForm.append("pool", String(pool));
    }

    const purchaseResponse = await fetch(
      "https://api.smspool.net/purchase/sms",
      {
        method: "POST",
        body: purchaseForm,
        cache: "no-store",
      }
    );

    const purchaseText = await purchaseResponse.text();

    let purchaseData: any;

    try {
      purchaseData = JSON.parse(purchaseText);
    } catch {
      purchaseData = null;
    }

    console.log(
      "V2 SMSPool purchase response:",
      purchaseData
    );

    // Refund wallet if SMSPool fails.
    if (
      !purchaseData ||
      Number(purchaseData.success) !== 1
    ) {
      await adminDb.runTransaction(
        async (transaction) => {
          const userSnap = await transaction.get(userRef);

          if (!userSnap.exists) return;

          const currentBalance = Number(
            userSnap.data()?.balance ?? 0
          );

          transaction.update(userRef, {
            balance: currentBalance + walletAmount,
          });
        }
      );

      return NextResponse.json({
        success: false,
        message:
          "This number became unavailable. Your wallet has been refunded.",
      });
    }

    const orderExpiresAt = new Date(
      Date.now() + 600 * 1000
    );

    await adminDb.collection("orders").add({
      uid: decodedToken.uid,
      number: purchaseData.number,
      orderId: purchaseData.order_id,
      country,
      service,
      pool: purchaseData.pool ?? pool ?? null,
      price: walletAmount,
      smsPoolUsdPrice: usdPrice,
      usdToNgn,
      smsPoolCostNgn: costPrice,
      status: "waiting",
      otp: null,
      createdAt: new Date(),
      expiresAt: orderExpiresAt,
    });

    await adminDb.collection("platformTransactions").add({
      uid: decodedToken.uid,
      orderId: purchaseData.order_id,
      type: "sale",
      amount: walletAmount,
      smsPoolUsdPrice: usdPrice,
      usdToNgn,
      smsPoolCostNgn: costPrice,
      country: String(country),
      service: String(service),
      pool: purchaseData.pool ?? pool ?? null,
      status: "completed",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      number: purchaseData.number,
      orderId: purchaseData.order_id,
      country: purchaseData.country ?? country,
      service: purchaseData.service ?? service,
      pool: purchaseData.pool ?? pool ?? null,
      expiresIn: 600,
      expiresAt: orderExpiresAt.getTime(),
      price: walletAmount,
      costPrice,
      margin: markupPercent,
      remainingBalance:
        previousBalance - walletAmount,
    });
  } catch (error: any) {
    console.error("V2 buy number error:", error);

    if (error?.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    if (error?.message === "INSUFFICIENT_BALANCE") {
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
