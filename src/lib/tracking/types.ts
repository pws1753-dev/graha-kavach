/** What the storefront knows about one parcel of an order. */
export type TrackingShipment = {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  shippedOn: string | null;
  status: string | null;
  statusLabel: string | null;
  estimatedDelivery: string | null;
  lastEvent: string | null;
  events: { message: string; location: string; time: string }[];
};

/**
 * How the order is being paid for, in rupees.
 *
 * - online: paid in full online
 * - part:   cash on delivery with an advance paid online; `due` is collected on delivery
 * - paid:   cash on delivery with an advance, and the balance is collected (delivered)
 * - cod:    plain cash on delivery, nothing paid yet
 * - awaiting: payment not confirmed yet
 */
export type OrderPayment = {
  kind: "online" | "part" | "paid" | "cod" | "awaiting";
  label: string;
  total: number;
  paid: number;
  due: number;
};

export type TrackingState =
  | "awaiting_payment"
  | "confirming"
  | "preparing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export type TrackingData = {
  orderNumber: string;
  placedOn: string;
  state: TrackingState;
  isShipped: boolean;
  shipments: TrackingShipment[];
  items: { name: string; quantity: number }[];
  payment?: OrderPayment;
};
