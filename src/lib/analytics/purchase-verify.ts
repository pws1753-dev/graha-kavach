import { isCodMethod } from "@/lib/config/checkout";

export type PurchaseCheckOrder = {
  id: number;
  order_key: string;
  status: string;
  total: string;
  currency?: string;
  payment_method: string;
  transaction_id?: string;
  date_paid?: string | null;
  meta_data?: { key: string; value: unknown }[];
};

/** Order meta that records the Google Ads purchase event was already released for this order. */
export const GADS_TRACKED_META = "_gads_purchase_tracked";

const COUNTED_STATUSES = ["processing", "completed", "shipped", "delivered"];

function meta(order: PurchaseCheckOrder, key: string): string {
  const value = order.meta_data?.find((m) => m.key === key)?.value;
  return value == null ? "" : String(value).trim();
}

/**
 * True only when money has really been collected online for this order:
 * a prepaid order with a payment on record, or a COD booking whose online
 * advance was confirmed by the Razorpay verification step. Pending, failed,
 * cancelled and on-hold orders never count, and neither does plain COD.
 */
export function isPaidOnline(order: PurchaseCheckOrder): boolean {
  if (!COUNTED_STATUSES.includes(order.status)) return false;

  const razorpayPayment = meta(order, "razorpay_payment_id");
  if (isCodMethod(order.payment_method)) {
    return Number(meta(order, "_cod_advance_paid")) > 0 && razorpayPayment !== "";
  }
  return razorpayPayment !== "" || Boolean(order.transaction_id) || Boolean(order.date_paid);
}

export function alreadyReported(order: PurchaseCheckOrder): boolean {
  return meta(order, GADS_TRACKED_META) !== "";
}
