import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { wooRequest } from "@/lib/woocommerce/client";
import { getSessionCustomer } from "@/lib/auth/session";
import { getAccountPhone, lastTenDigits, orderBelongsTo } from "@/lib/woocommerce/customer-orders";
import { buildTracking, type TrackableOrder } from "@/lib/woocommerce/order-tracking";

const trackRequestSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required"),
  // The billing email or the mobile number used when ordering. Empty is fine
  // for a logged-in customer looking at their own order.
  email: z.string().trim().default(""),
});

type RawOrder = TrackableOrder & {
  number: string;
  customer_id?: number;
  billing: {
    email: string;
    phone?: string;
  };
};

// In-memory rate limiting map: key = `${ip}:${orderNumber}`, value = { count, resetAt }
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 }); // 10 minutes window
    return true;
  }

  if (entry.count >= 5) {
    return false; // Rate limited
  }

  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = trackRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { orderNumber, email } = parsed.data;

    // Rate limiting key: IP + Order Number
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const rateLimitKey = `${ip}:${orderNumber.toLowerCase()}`;

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    // Look up order in WooCommerce
    let order: RawOrder | null = null;
    const cleanNumber = orderNumber.replace(/^#/, "").trim();

    // 1. Try search by number or ID
    try {
      const orders = await wooRequest<RawOrder[]>({
        path: "/orders",
        query: { search: cleanNumber, per_page: 5 },
        revalidate: false,
      });

      order = orders.find(
        (o) =>
          o.number.toLowerCase() === cleanNumber.toLowerCase() ||
          String(o.id) === cleanNumber,
      ) || null;
    } catch {
      order = null;
    }

    // 2. If not found by search, try direct ID lookup if numeric
    if (!order && /^\d+$/.test(cleanNumber)) {
      try {
        order = await wooRequest<RawOrder>({
          path: `/orders/${cleanNumber}`,
          revalidate: false,
        });
      } catch {
        order = null;
      }
    }

    if (!order) {
      // Uniform 404 response to prevent user enumeration
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // A logged-in customer may see their own orders, including guest orders made
    // with the same email or phone, without typing anything.
    const session = await getSessionCustomer();
    let allowed = false;
    if (session) {
      const phone = await getAccountPhone(session.customerId);
      allowed = orderBelongsTo(order, { customerId: session.customerId, email: session.email, phone });
    }

    // Everyone else proves it is their order with the billing email or mobile number.
    if (!allowed && email) {
      const contact = email.toLowerCase().trim();
      if (contact.includes("@")) {
        // Constant-time email comparison
        const targetEmail = Buffer.from(contact);
        const orderEmail = Buffer.from((order.billing.email || "").toLowerCase().trim());
        allowed = targetEmail.length === orderEmail.length && timingSafeEqual(targetEmail, orderEmail);
      } else {
        const digits = lastTenDigits(contact);
        allowed = digits.length === 10 && digits === lastTenDigits(order.billing.phone);
      }
    }

    if (!allowed) {
      // Uniform 404 response to prevent enumeration
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(await buildTracking(order), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
