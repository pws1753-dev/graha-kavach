import { NextResponse } from "next/server";
import { getSessionCustomer } from "@/lib/auth/session";
import { listAccountOrders } from "@/lib/woocommerce/customer-orders";
import { buildTracking, type TrackableOrder } from "@/lib/woocommerce/order-tracking";

type RawOrder = Omit<TrackableOrder, "line_items"> & {
  number: string;
  order_key: string;
  currency: string;
  customer_id?: number;
  line_items: {
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
    price: number;
  }[];
  shipping: Record<string, string>;
  billing: Record<string, string>;
};

export async function GET() {
  try {
    const session = await getSessionCustomer();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Orders placed while logged in, plus guest orders with the same email or phone
    const orders = await listAccountOrders<RawOrder>(session);

    // Live tracking and payment for each order, read fresh so the account page
    // always shows the courier's latest status without the customer doing anything.
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const tracking = await buildTracking(order);

        return {
          id: order.id,
          number: order.number || String(order.id),
          orderKey: order.order_key,
          status: order.status,
          dateCreated: order.date_created,
          total: order.total,
          currency: order.currency,
          itemCount: order.line_items.reduce((acc, item) => acc + item.quantity, 0),
          items: order.line_items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            total: item.total,
          })),
          shipping: order.shipping,
          billing: order.billing,
          shipments: tracking.shipments.map((s) => ({
            trackingNumber: s.trackingNumber,
            trackingProvider: s.carrier,
            trackingLink: s.trackingUrl,
            dateShipped: s.shippedOn,
          })),
          isShipped: tracking.isShipped,
          tracking,
        };
      }),
    );

    return NextResponse.json(
      { orders: enrichedOrders },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load orders", details: String(error) },
      { status: 500 },
    );
  }
}
