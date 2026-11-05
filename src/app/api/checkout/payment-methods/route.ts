import { NextResponse } from "next/server";
import { getCodAdvanceConfig } from "@/lib/woocommerce/checkout-settings";
import { isRazorpayConfigured } from "@/lib/razorpay/server";
import { getActivePaymentGateways } from "@/lib/woocommerce/payment-gateways";

export async function GET() {
  try {
    const [methods, advance] = await Promise.all([getActivePaymentGateways(), getCodAdvanceConfig()]);

    if (advance.enabled && !isRazorpayConfigured()) {
      // The advance is ON in WordPress but this server has no Razorpay keys, so checkout would
      // silently fall back to plain cash on delivery. Say so in the log.
      console.error("[checkout] COD advance is enabled in WordPress but RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing on this server.");
    }
    return NextResponse.json({
      methods,
      // COD orders take an advance online when Razorpay is available and the
      // partial-payment setting in wp-admin is on. Amount is that setting, live.
      codAdvance: isRazorpayConfigured() ? advance : { ...advance, enabled: false },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load payment methods", details: String(error) },
      { status: 500 },
    );
  }
}
