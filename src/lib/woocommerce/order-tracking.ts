import "server-only";

import { wooRequest } from "@/lib/woocommerce/client";
import type { OrderPayment, TrackingData, TrackingShipment, TrackingState } from "@/lib/tracking/types";

/** The parts of a WooCommerce REST order this module reads. */
export type TrackableOrder = {
  id: number;
  number?: string;
  status: string;
  date_created: string;
  total: string;
  total_refunded?: string;
  payment_method?: string;
  date_paid?: string | null;
  meta_data?: { key: string; value: unknown }[];
  line_items: { name: string; quantity: number }[];
  refunds?: { total: string }[];
};

type AstTrackingItem = {
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

function meta(order: TrackableOrder, key: string): string {
  const found = order.meta_data?.find((entry) => entry.key === key);
  return found && found.value != null ? String(found.value) : "";
}

const inr = (value: number) => Math.round(value * 100) / 100;

/**
 * Part payment, from the order itself. Mirrors the "Part Payment & Invoice" plugin
 * in WordPress: a cash-on-delivery order with `_cod_advance_paid` took an advance
 * online, and the balance counts as collected only once the order is Delivered
 * ("Shipped" is the Woo `completed` status, so it says nothing about the courier cash).
 */
export function derivePayment(order: TrackableOrder): OrderPayment | undefined {
  // A cancelled or refunded order has nothing left to pay; saying "pending" would mislead.
  if (order.status === "cancelled" || order.status === "refunded") return undefined;

  const total = Number.parseFloat(order.total) || 0;
  const refunded = Math.abs(Number.parseFloat(order.total_refunded ?? "0")) || 0;
  const delivered = order.status === "delivered";
  const unpaid = order.status === "pending" || order.status === "failed";

  if ((order.payment_method ?? "").toLowerCase() === "cod") {
    const advance = Math.min(Number.parseFloat(meta(order, "_cod_advance_paid")) || 0, total);

    if (advance > 0) {
      if (delivered) return { kind: "paid", label: "Paid in full", total, paid: total, due: 0 };
      return {
        kind: "part",
        label: "Part paid",
        total,
        paid: inr(advance),
        due: inr(Math.max(0, total - advance - refunded)),
      };
    }
    if (delivered) return { kind: "paid", label: "Paid in full", total, paid: total, due: 0 };
    if (unpaid && meta(order, "_cod_advance_minor")) {
      return { kind: "awaiting", label: "Advance payment pending", total, paid: 0, due: total };
    }
    return { kind: "cod", label: "Pay on delivery", total, paid: 0, due: total };
  }

  if (unpaid || order.status === "on-hold") {
    return { kind: "awaiting", label: "Payment pending", total, paid: 0, due: total };
  }
  return { kind: "online", label: "Paid online", total, paid: total, due: 0 };
}

/**
 * The customer-facing stage of an order. Woo's own statuses are not enough:
 * "Shipped" is `completed` renamed, `delivered` is added by TrackShip, and an
 * order with a tracking number counts as shipped whatever its status.
 */
export function deriveOrderState(status: string, shipmentsCount: number): { state: TrackingState; isShipped: boolean } {
  switch (status) {
    case "pending":
    case "failed":
      return { state: "awaiting_payment", isShipped: false };
    case "on-hold":
      return { state: "confirming", isShipped: false };
    case "processing":
      return shipmentsCount > 0 ? { state: "shipped", isShipped: true } : { state: "preparing", isShipped: false };
    case "shipped":
    case "partial-shipped":
    case "updated-tracking":
      return { state: "shipped", isShipped: true };
    case "completed":
      return { state: shipmentsCount > 0 ? "shipped" : "completed", isShipped: shipmentsCount > 0 };
    case "delivered":
      return { state: "completed", isShipped: true };
    case "cancelled":
      return { state: "cancelled", isShipped: false };
    case "refunded":
      return { state: "refunded", isShipped: false };
    default:
      return { state: "preparing", isShipped: false };
  }
}

/** The tracking numbers the sales team added (Advanced Shipment Tracking). */
async function loadTrackingItems(orderId: number): Promise<AstTrackingItem[]> {
  try {
    return await wooRequest<AstTrackingItem[]>({ path: `/orders/${orderId}/shipment-trackings`, revalidate: false });
  } catch {
    return [];
  }
}

/** Live courier status and scan history (TrackShip, through the headless-core plugin). */
async function loadLiveShipments(orderId: number): Promise<LiveShipment[]> {
  try {
    const res = await wooRequest<{ shipments?: LiveShipment[] }>({
      path: `/orders/${orderId}/shipment-status`,
      revalidate: false,
    });
    return res.shipments ?? [];
  } catch {
    return [];
  }
}

/**
 * Everything the tracking screens need for one order: parcels with live status,
 * the order stage and the payment summary. Read fresh on every call, so a status
 * the courier pushed a minute ago is already here.
 */
export async function buildTracking(order: TrackableOrder): Promise<TrackingData> {
  const [items, live] = await Promise.all([loadTrackingItems(order.id), loadLiveShipments(order.id)]);

  const derived = deriveOrderState(order.status, items.length);
  // Every parcel delivered means the order is delivered, whatever the Woo status says.
  const allDelivered = live.length > 0 && live.length >= items.length && live.every((l) => l.status === "delivered");
  const state: TrackingState = allDelivered ? "completed" : derived.state;

  const shipments: TrackingShipment[] = items.map((item) => {
    const status = live.find((l) => l.tracking_number === item.tracking_number);
    return {
      carrier: item.tracking_provider,
      trackingNumber: item.tracking_number,
      trackingUrl: item.tracking_link,
      shippedOn: item.date_shipped || null,
      status: status?.status ?? null,
      statusLabel: status?.status_label ?? null,
      estimatedDelivery: status?.est_delivery_date || null,
      lastEvent: status?.last_event || null,
      events: status?.events ?? [],
    };
  });

  return {
    orderNumber: order.number || String(order.id),
    placedOn: order.date_created,
    state,
    isShipped: derived.isShipped || allDelivered,
    shipments,
    items: order.line_items.map((item) => ({ name: item.name, quantity: item.quantity })),
    payment: derivePayment(order),
  };
}
