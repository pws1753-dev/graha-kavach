import { NextResponse } from "next/server";
import { z } from "zod";
import { computeAdvanceMinor, isCodMethod } from "@/lib/config/checkout";
import { getCodAdvanceConfig } from "@/lib/woocommerce/checkout-settings";
import { wooRequest } from "@/lib/woocommerce/client";
import {
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from "@/lib/razorpay/server";
import {
  sendMetaCapiEvent,
  extractClientContext,
} from "@/lib/analytics/meta-capi";

const bodySchema = z.object({
  wooOrderId: z.number().int().positive(),
  orderKey: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

type WooOrder = {
  id: number;
  number?: string;
  order_key: string;
  status: string;
  total: string;
  currency?: string;
  payment_method: string;
  transaction_id?: string;
  meta_data?: Array<{ key: string; value: unknown }>;
  billing?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  line_items?: Array<{
    product_id: number;
    quantity: number;
    total: string;
  }>;
};

export async function POST(request: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400 });
    }

    const { wooOrderId, orderKey, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parsed.data;

    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 400 });
    }

    const order = await wooRequest<WooOrder>({ path: `/orders/${wooOrderId}`, revalidate: false });
    if (order.order_key !== orderKey) {
      return NextResponse.json({ error: "Order key mismatch." }, { status: 403 });
    }

    // The signature proves this payment belongs to *a* Razorpay order. Make sure
    // that order is the one created for this Woo order, for the full amount.
    const rzpOrder = await fetchRazorpayOrder(razorpay_order_id);
    const totalMinor = Math.round(parseFloat(order.total) * 100);
    const isCodAdvance = isCodMethod(order.payment_method);
    // The advance pinned on the order when it was created; the live setting is only a fallback.
    const pinnedAdvance = Number(
      (order as { meta_data?: Array<{ key: string; value: unknown }> }).meta_data?.find(
        (m) => m.key === "_cod_advance_minor",
      )?.value ?? 0,
    );
    const expectedAmount = isCodAdvance
      ? Math.min(
          pinnedAdvance > 0
            ? pinnedAdvance
            : computeAdvanceMinor(await getCodAdvanceConfig(), totalMinor),
          totalMinor,
        )
      : totalMinor;
    const paymentDetails = await fetchRazorpayPayment(razorpay_payment_id);
    if (
      rzpOrder.receipt !== String(wooOrderId) ||
      rzpOrder.amount !== expectedAmount ||
      rzpOrder.currency !== (order.currency || "INR") ||
      paymentDetails.order_id !== razorpay_order_id ||
      paymentDetails.amount !== expectedAmount ||
      paymentDetails.currency !== (order.currency || "INR")
    ) {
      return NextResponse.json({ error: "Payment does not match this order." }, { status: 400 });
    }
    if (paymentDetails.status !== "captured") {
      return NextResponse.json({ code: "payment_pending_capture", error: "Payment capture is being confirmed. Do not pay again." }, { status: 409 });
    }
    if (Number(paymentDetails.amount_refunded || 0) > 0) {
      return NextResponse.json({ error: "This payment has a refund and requires manual review." }, { status: 409 });
    }
    const awaitingPayment = ["checkout-draft", "pending", "failed", "on-hold"].includes(order.status);
    if (!awaitingPayment) {
      if (!["processing", "completed", "shipped", "delivered"].includes(order.status) || order.transaction_id !== razorpay_payment_id) {
        return NextResponse.json({ error: "This order cannot be confirmed automatically. Please contact support." }, { status: 409 });
      }
    }

    if (isCodAdvance && awaitingPayment) {
      // Advance received: the order is confirmed, the balance is collected on delivery.
      const balance = ((totalMinor - expectedAmount) / 100).toFixed(2);

      // The booking page does not require an email. If the customer typed one into the
      // payment window, use it, so the confirmation email and the PDF invoice reach them.
      // It goes in the same update as the status change, so the email sees it.
      let billingEmail = "";
      if (!order.billing?.email) {
        const candidate = typeof paymentDetails.email === "string" ? paymentDetails.email.trim() : "";
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) billingEmail = candidate;
      }

      await wooRequest({
        path: `/orders/${wooOrderId}`,
        method: "PUT",
        body: {
          ...(billingEmail ? { billing: { email: billingEmail } } : {}),
          status: "processing",
          transaction_id: razorpay_payment_id,
          meta_data: [
            { key: "_cod_advance_paid", value: (expectedAmount / 100).toFixed(2) },
            { key: "razorpay_payment_id", value: razorpay_payment_id },
            { key: "razorpay_order_id", value: razorpay_order_id },
          ],
        },
        revalidate: false,
      });
      await wooRequest({
        path: `/orders/${wooOrderId}/notes`,
        method: "POST",
        body: {
          note: `COD advance of ₹${(expectedAmount / 100).toFixed(2)} paid via Razorpay (${razorpay_payment_id}). Collect balance ₹${balance} on delivery.`,
          customer_note: false,
        },
        revalidate: false,
      });
    } else if (awaitingPayment) {
      const updateBody: Record<string, unknown> = {
        set_paid: true,
        status: "processing",
        transaction_id: razorpay_payment_id,
        meta_data: [
          { key: "razorpay_payment_id", value: razorpay_payment_id },
          { key: "razorpay_order_id", value: razorpay_order_id },
        ],
      };

      if (paymentDetails) {
        const contact = typeof paymentDetails.contact === "string" ? paymentDetails.contact : "";
        const email = typeof paymentDetails.email === "string" ? paymentDetails.email : "";
        if (contact || email) {
          updateBody.billing = {
            ...(contact ? { phone: contact } : {}),
            ...(email ? { email } : {}),
          };
        }
      }

      await wooRequest({
        path: `/orders/${wooOrderId}`,
        method: "PUT",
        body: updateBody,
        revalidate: false,
      });
    }

    // Report verified payment to Meta Conversions API
    const savedContext = order.meta_data?.find((m) => m.key === "_gk_meta_context")?.value;
    const context = savedContext && typeof savedContext === "object"
      ? savedContext as ReturnType<typeof extractClientContext>
      : extractClientContext(request);
    const { clientIp, clientUserAgent, fbp, fbc } = context;
    await sendMetaCapiEvent({
      eventName: "Purchase",
      eventId: order.number || String(wooOrderId),
      eventSourceUrl: "https://grahakavach.in/checkout",
      userData: {
        email: order.billing?.email || (typeof paymentDetails.email === "string" ? paymentDetails.email : undefined),
        phone: order.billing?.phone,
        firstName: order.billing?.first_name,
        lastName: order.billing?.last_name,
        city: order.billing?.city,
        state: order.billing?.state,
        postcode: order.billing?.postcode,
        country: order.billing?.country,
        clientIp,
        clientUserAgent,
        fbp,
        fbc,
      },
      customData: {
        value: parseFloat(order.total) || 0,
        currency: order.currency || "INR",
        num_items: order.line_items?.reduce((acc, i) => acc + i.quantity, 0) || 1,
        content_type: "product",
        contents: order.line_items?.map((i) => ({
          id: i.product_id,
          quantity: i.quantity,
        })),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not confirm the payment.", details: String(error) },
      { status: 500 },
    );
  }
}
