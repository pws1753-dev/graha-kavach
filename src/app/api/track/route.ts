import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { wooRequest } from "@/lib/woocommerce/client";
import { getSessionCustomer } from "@/lib/auth/session";
import { getAccountPhone, lastTenDigits, orderBelongsTo } from "@/lib/woocommerce/customer-orders";

const trackRequestSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required"),
  // The billing email or the mobile number used when ordering. Empty is fine
  // for a logged-in customer looking at their own order.
  email: z.string().trim().default(""),
});

type ASTTrackingItem = {
  tracking_id: string;
  tracking_provider: string;
  tracking_number: string;
  tracking_link: string;
  date_shipped: string;
};

/** Live courier status kept by TrackShip, exposed by the headless-core plugin. */
type LiveShipment = {
  tracking_number: string;
  status: string;
  status_label: string;
  est_delivery_date: string;
  last_event: string;
  last_event_time: string;
  events: { message: string; location: string; time: string }[];
};

type RawOrder = {
  id: number;
  number: string;
  status: string;
  date_created: string;
  customer_id?: number;
  billing: {
    email: string;
    phone?: string;
  };
  line_items: {
    name: string;
    quantity: number;
  }[];
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

function deriveOrderState(
  status: string,
  shipmentsCount: number,
): {
  state:
    | "awaiting_payment"
    | "confirming"
    | "preparing"
    | "shipped"
    | "completed"
    | "cancelled"
    | "refunded";
  isShipped: boolean;
} {
  switch (status) {
    case "pending":
    case "failed":
      return { state: "awaiting_payment", isShipped: false };
    case "on-hold":
      return { state: "confirming", isShipped: false };
    case "processing":
      return shipmentsCount > 0
        ? { state: "shipped", isShipped: true }
        : { state: "preparing", isShipped: false };
    case "completed":
      return { state: shipmentsCount > 0 ? "shipped" : "completed", isShipped: shipmentsCount > 0 };
    case "cancelled":
      return { state: "cancelled", isShipped: false };
    case "refunded":
      return { state: "refunded", isShipped: false };
    default:
      return { state: "preparing", isShipped: false };
  }
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

    // Fetch AST shipment tracking records
    let shipments: ASTTrackingItem[] = [];
    try {
      shipments = await wooRequest<ASTTrackingItem[]>({
        path: `/orders/${order.id}/shipment-trackings`,
        revalidate: false,
      });
    } catch {
      shipments = [];
    }

    let live: LiveShipment[] = [];
    try {
      const res = await wooRequest<{ shipments?: LiveShipment[] }>({
        path: `/orders/${order.id}/shipment-status`,
        revalidate: false,
      });
      live = res.shipments ?? [];
    } catch {
      live = [];
    }

    const derived = deriveOrderState(order.status, shipments.length);
    // Every parcel delivered means the order is delivered, whatever the Woo status says.
    const allDelivered = live.length > 0 && live.length >= shipments.length && live.every((l) => l.status === "delivered");
    const state = allDelivered ? ("completed" as const) : derived.state;
    const isShipped = derived.isShipped;

    // Return sanitized service contract response per docs/TRACKING.md §6
    const trackingResponse = {
      orderNumber: order.number || String(order.id),
      placedOn: order.date_created,
      state,
      isShipped,
      shipments: shipments.map((s) => {
        const status = live.find((l) => l.tracking_number === s.tracking_number);
        return {
          carrier: s.tracking_provider,
          trackingNumber: s.tracking_number,
          trackingUrl: s.tracking_link,
          shippedOn: s.date_shipped || null,
          status: status?.status ?? null,
          statusLabel: status?.status_label ?? null,
          estimatedDelivery: status?.est_delivery_date || null,
          lastEvent: status?.last_event || null,
          events: status?.events ?? [],
        };
      }),
      items: order.line_items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
    };

    return NextResponse.json(trackingResponse, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
