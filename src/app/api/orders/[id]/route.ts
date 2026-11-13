import { NextResponse } from "next/server";
import { wooRequest } from "@/lib/woocommerce/client";

type WooOrderItem = {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  price: number;
  image?: { id: number; src: string };
};

type ASTTrackingItem = {
  tracking_id: string;
  tracking_provider: string;
  tracking_number: string;
  tracking_link: string;
  date_shipped: string;
};

type WooRawOrder = {
  id: number;
  number: string;
  order_key: string;
  status: string;
  currency: string;
  date_created: string;
  total: string;
  discount_total: string;
  shipping_total: string;
  total_tax: string;
  payment_method: string;
  payment_method_title: string;
  billing: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: WooOrderItem[];
  fee_lines?: { id: number; name: string; total: string }[];
  meta_data?: { key: string; value: unknown }[];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!id || !key) {
      return NextResponse.json(
        { error: "Order ID and Order Key are required" },
        { status: 400 },
      );
    }

    // Fetch order from WooCommerce
    const order = await wooRequest<WooRawOrder>({
      path: `/orders/${id}`,
      revalidate: false,
    });

    // Validate security key
    if (order.order_key !== key) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid order key" },
        { status: 403 },
      );
    }

    // Fetch AST tracking if available
    let shipments: ASTTrackingItem[] = [];
    try {
      shipments = await wooRequest<ASTTrackingItem[]>({
        path: `/orders/${id}/shipment-trackings`,
        revalidate: false,
      });
    } catch {
      // AST might not have trackings yet
      shipments = [];
    }

    return NextResponse.json({
      orderNumber: order.number || String(order.id),
      orderId: order.id,
      orderKey: order.order_key,
      status: order.status,
      dateCreated: order.date_created,
      currency: order.currency,
      total: order.total,
      discountTotal: order.discount_total,
      shippingTotal: order.shipping_total,
      taxTotal: order.total_tax,
      paymentMethodTitle: order.payment_method_title,
      billing: order.billing,
      shipping: order.shipping,
      gstin:
        order.meta_data?.find(
          (m) => m.key === "_billing_gstin" || m.key === "GSTIN" || m.key === "gstin",
        )?.value || "",
      codAdvance:
        order.meta_data?.find((m) => m.key === "_cod_advance_paid")?.value || "",
      fees: (order.fee_lines ?? []).map((f) => ({ name: f.name, total: f.total })),
      lineItems: order.line_items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        total: item.total,
        price: item.price,
        image: item.image?.src || null,
      })),
      shipments: shipments.map((s) => ({
        trackingNumber: s.tracking_number,
        trackingProvider: s.tracking_provider,
        trackingLink: s.tracking_link,
        dateShipped: s.date_shipped,
      })),
      trackingAvailable: shipments.length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch order", details: String(error) },
      { status: 500 },
    );
  }
}
