import { NextResponse } from "next/server";
import { checkoutSubmissionSchema, landingSubmissionSchema } from "@/lib/validation/checkout";
import { validateCartServer } from "@/lib/woocommerce/cart-server";
import { wooRequest } from "@/lib/woocommerce/client";
import { getActivePaymentGateways } from "@/lib/woocommerce/payment-gateways";
import { computeAdvanceMinor, isCodMethod } from "@/lib/config/checkout";
import { getCodAdvanceConfig } from "@/lib/woocommerce/checkout-settings";
import { getWooCommerceUrls } from "@/lib/woocommerce/client";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  razorpayKeyId,
} from "@/lib/razorpay/server";
import {
  sendMetaCapiEvent,
  extractClientContext,
} from "@/lib/analytics/meta-capi";

type IdempotencyEntry = {
  response: {
    success: boolean;
    orderId: number;
    orderNumber: string;
    orderKey: string;
    status: string;
    total: string;
    currency: string;
    isOnline: boolean;
    paymentUrl: string | null;
    razorpay: { keyId: string; orderId: string; amount: number; currency: string } | null;
  };
  timestamp: number;
};

// In-memory idempotency cache (TTL 10 minutes)
const idempotencyStore = new Map<string, IdempotencyEntry>();

function cleanIdempotencyStore() {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) {
      idempotencyStore.delete(key);
    }
  }
}

export async function POST(request: Request) {
  try {
    cleanIdempotencyStore();
    const rawBody = await request.json();
    // The /book-now funnel sends a shorter form (no email), marked with its source.
    const isLanding = (rawBody as { source?: unknown } | null)?.source === "landing";
    const parsed = (isLanding ? landingSubmissionSchema : checkoutSubmissionSchema).safeParse(rawBody);
    const landingSlug = isLanding
      ? String((rawBody as { landing?: unknown }).landing ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80)
      : "";

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { address, paymentMethod, items, couponCode, idempotencyKey } = parsed.data;
    const checkoutContext = extractClientContext(request);

    // Check idempotency cache
    const cacheKey = `${idempotencyKey}:${paymentMethod}`;
    const existing = idempotencyStore.get(cacheKey);
    if (existing) {
      return NextResponse.json(existing.response);
    }

    // Server-side validation of live products, prices, stock, and coupon
    const validatedCart = await validateCartServer(items, couponCode);

    if (validatedCart.hasErrors) {
      return NextResponse.json(
        {
          error: "Cart validation failed",
          messages: validatedCart.errorMessages,
          cart: validatedCart,
        },
        { status: 400 },
      );
    }

    if (!validatedCart.items.length) {
      return NextResponse.json(
        { error: "Cannot create an order with an empty cart." },
        { status: 400 },
      );
    }

    // Check payment gateway
    const activeGateways = await getActivePaymentGateways();
    const selectedGateway = activeGateways.find((g) => g.id === paymentMethod);

    if (!selectedGateway) {
      return NextResponse.json(
        {
          error: `Payment method "${paymentMethod}" is not active.`,
        },
        { status: 400 },
      );
    }

    // Determine initial status based on payment method
    // COD is set to 'processing' (or 'on-hold') and unpaid
    const isCod = isCodMethod(selectedGateway.id);
    // COD takes a small advance online when Razorpay is set up; the order then
    // stays a draft until that advance is paid. Without Razorpay it is plain COD.
    // The advance amount comes from the WordPress deposit settings, so a price
    // change in wp-admin applies here without a deploy.
    const advanceMinor = isCod
      ? computeAdvanceMinor(await getCodAdvanceConfig(), validatedCart.totalMinor)
      : 0;
    const codAdvance = isCod && isRazorpayConfigured() && advanceMinor > 0;
    if ((isLanding || (isCod && advanceMinor > 0)) && !codAdvance) {
      return NextResponse.json({ error: "Online booking payment is temporarily unavailable. Please contact us." }, { status: 503 });
    }
    const initialStatus = "checkout-draft";

    // Construct WooCommerce Order Payload
    const orderPayload = {
      payment_method: selectedGateway.id,
      payment_method_title: selectedGateway.title,
      set_paid: false,
      status: initialStatus,
      billing: {
        first_name: address.firstName,
        last_name: address.lastName,
        company: address.company || "",
        address_1: address.address1,
        address_2: address.address2 || "",
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        country: "IN",
        email: address.email,
        phone: address.phone,
      },
      shipping: {
        phone: address.phone,
        first_name: address.firstName,
        last_name: address.lastName,
        company: address.company || "",
        address_1: address.address1,
        address_2: address.address2 || "",
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        country: "IN",
      },
      line_items: validatedCart.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
      coupon_lines: validatedCart.coupon ? [{ code: validatedCart.coupon.code }] : [],
      customer_note: address.orderNotes || "",
      meta_data: [
        { key: "_idempotency_key", value: idempotencyKey },
        { key: "_source", value: isLanding ? "nextjs-landing" : "nextjs-headless" },
        { key: "_gk_meta_context", value: checkoutContext },
        // Which landing page the order came from, for ad reporting.
        ...(isLanding && landingSlug ? [{ key: "_landing_page", value: landingSlug }] : []),
        // Pinned now so the payment check later does not depend on the setting still being the same.
        ...(codAdvance ? [{ key: "_cod_advance_minor", value: String(advanceMinor) }] : []),
        ...(address.gstin
          ? [
              { key: "_billing_gstin", value: address.gstin },
              { key: "GSTIN", value: address.gstin },
              { key: "gstin", value: address.gstin },
            ]
          : []),
      ],
    };

    // Create WooCommerce Order
    const wooOrder = await wooRequest<{
      id: number;
      number: string;
      order_key: string;
      status: string;
      total: string;
      currency: string;
      payment_url?: string;
    }>({
      path: "/orders",
      method: "POST",
      body: orderPayload,
      revalidate: false,
    });

    // Never request payment for a total different from the tax-inclusive cart.
    if (!Number.isFinite(Number(wooOrder.total)) || Math.abs(Math.round(Number(wooOrder.total) * 100) - validatedCart.totalMinor) > 1) {
      await wooRequest({
        path: `/orders/${wooOrder.id}`,
        method: "PUT",
        body: { status: "cancelled" },
        revalidate: false,
      });
      return NextResponse.json({ error: "The order total could not be confirmed. No payment was requested. Please contact us." }, { status: 502 });
    }

    // Confirm plain COD only after its total has passed validation.
    if (isCod && !codAdvance) {
      await wooRequest({
        path: `/orders/${wooOrder.id}`,
        method: "PUT",
        body: { status: "processing" },
        revalidate: false,
      });
      wooOrder.status = "processing";
    }

    // Razorpay pays inside the site's own popup. The Razorpay order is created
    // here because it needs the secret key; the browser only gets the order id.
    let razorpay: IdempotencyEntry["response"]["razorpay"] = null;
    const totalMinor = Math.round(parseFloat(wooOrder.total) * 100);
    if (codAdvance || (selectedGateway.id === "razorpay" && isRazorpayConfigured())) {
      try {
        const rzpOrder = await createRazorpayOrder({
          amountMinor: codAdvance ? Math.min(advanceMinor, totalMinor) : totalMinor,
          currency: wooOrder.currency || "INR",
          receipt: String(wooOrder.id),
          wooOrderId: wooOrder.id,
        });
        razorpay = {
          keyId: razorpayKeyId(),
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
        };
        await wooRequest({
          path: `/orders/${wooOrder.id}`,
          method: "PUT",
          body: { meta_data: [{ key: "razorpay_order_id", value: rzpOrder.id }] },
          revalidate: false,
        });
      } catch (error) {
        // Do not leave an unpayable pending order behind.
        await wooRequest({
          path: `/orders/${wooOrder.id}`,
          method: "PUT",
          body: { status: "cancelled" },
          revalidate: false,
        }).catch(() => undefined);
        return NextResponse.json(
          { error: "Could not start the online payment.", details: String(error) },
          { status: 502 },
        );
      }
    }

    const result = {
      success: true,
      orderId: wooOrder.id,
      orderNumber: wooOrder.number || String(wooOrder.id),
      orderKey: wooOrder.order_key,
      status: wooOrder.status,
      total: wooOrder.total,
      currency: wooOrder.currency,
      isOnline: !isCod && selectedGateway.isOnline,
      razorpay,
      // Fallback when the in-page Razorpay popup is unavailable: WooCommerce's order-pay page.
      paymentUrl:
        !isCod && selectedGateway.isOnline && !razorpay
          ? wooOrder.payment_url ||
            `${getWooCommerceUrls().checkout}order-pay/${wooOrder.id}/?pay_for_order=true&key=${wooOrder.order_key}`
          : null,
    };

    // Cache idempotency response
    idempotencyStore.set(cacheKey, {
      response: result,
      timestamp: Date.now(),
    });

    if (result.status === "processing") {
      const { clientIp, clientUserAgent, fbp, fbc } = extractClientContext(request);
      void sendMetaCapiEvent({
        eventName: "Purchase",
        eventId: result.orderNumber,
        eventSourceUrl: "https://grahakavach.in/checkout",
        userData: {
          email: address.email,
          phone: address.phone,
          firstName: address.firstName,
          lastName: address.lastName,
          city: address.city,
          state: address.state,
          postcode: address.postcode,
          country: address.country,
          clientIp,
          clientUserAgent,
          fbp,
          fbc,
        },
        customData: {
          value: parseFloat(result.total) || 0,
          currency: result.currency || "INR",
          num_items: validatedCart.items.reduce((acc, i) => acc + i.quantity, 0),
          content_type: "product",
          contents: validatedCart.items.map((i) => ({
            id: i.productId,
            quantity: i.quantity,
            item_price: i.unitPriceMinor / 100,
          })),
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Order creation failed", details: String(error) },
      { status: 500 },
    );
  }
}
