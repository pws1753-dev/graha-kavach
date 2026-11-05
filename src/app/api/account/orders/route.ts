import { NextResponse } from "next/server";
import { getSessionCustomer } from "@/lib/auth/session";
import { wooRequest } from "@/lib/woocommerce/client";
import { listAccountOrders } from "@/lib/woocommerce/customer-orders";

type ASTTrackingItem = {
  tracking_id: string;
  tracking_provider: string;
  tracking_number: string;
  tracking_link: string;
  date_shipped: string;
};

type RawOrder = {
  id: number;
  number: string;
  order_key: string;
  status: string;
  currency: string;
  date_created: string;
  customer_id?: number;
  total: string;
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

    // Fetch tracking for each order
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        let shipments: ASTTrackingItem[] = [];
        try {
          shipments = await wooRequest<ASTTrackingItem[]>({
            path: `/orders/${order.id}/shipment-trackings`,
            revalidate: false,
          });
        } catch {
          shipments = [];
        }

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
          shipments: shipments.map((s) => ({
            trackingNumber: s.tracking_number,
            trackingProvider: s.tracking_provider,
            trackingLink: s.tracking_link,
            dateShipped: s.date_shipped,
          })),
          isShipped:
            shipments.length > 0 ||
            order.status === "completed" ||
            order.status === "processing",
        };
      }),
    );

    return NextResponse.json({ orders: enrichedOrders });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load orders", details: String(error) },
      { status: 500 },
    );
  }
}
