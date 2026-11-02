"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useCustomer } from "@/lib/auth/use-customer";

type LineItem = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: string;
};

type OrderDetail = {
  id: number;
  number: string;
  orderKey: string;
  status: string;
  dateCreated: string;
  currency: string;
  total: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  paymentMethodTitle: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  lineItems: LineItem[];
  shipments: {
    trackingNumber: string;
    trackingProvider: string;
    trackingLink: string;
    dateShipped: string;
  }[];
  trackingAvailable: boolean;
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { customer } = useCustomer();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch("/api/account/orders");
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        const found = (data.orders || []).find((o: { id: number }) => String(o.id) === id);

        if (!found) {
          throw new Error("Order not found or access denied.");
        }

        setOrder({
          ...found,
          discountTotal: "0",
          shippingTotal: "0",
          taxTotal: "0",
          paymentMethodTitle: "Cash on Delivery / Direct",
          lineItems: found.items || [],
          trackingAvailable: (found.shipments && found.shipments.length > 0) || false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading order");
      } finally {
        setLoading(false);
      }
    }

    if (customer) {
      loadOrder();
    }
  }, [id, customer]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        <div className="inline-block size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="mt-3">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-xs">
        <h2 className="text-xl font-medium text-foreground">Order Notice</h2>
        <p className="mt-2 text-xs text-muted-foreground">{error || "Order not found."}</p>
        <div className="mt-6">
          <Link
            href="/account/orders"
            className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            ← Back to All Orders
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(order.dateCreated).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/account/orders" className="text-xs font-semibold text-primary hover:underline">
                ← Orders
              </Link>
              <span className="text-stone-300">/</span>
              <h1 className="font-mono text-xl font-bold text-foreground">
                Order #{order.number}
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Placed on {formattedDate}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700 border border-border">
              {order.status}
            </span>
          </div>
        </div>

        {/* Tracking Card */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Shipment Status
          </h3>

          {order.trackingAvailable ? (
            <div className="mt-3 space-y-3">
              {order.shipments.map((shipment, i) => (
                <div key={i} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-emerald-950">
                        Dispatched via {shipment.trackingProvider}
                      </p>
                      <p className="font-mono text-xs text-emerald-800">
                        AWB: {shipment.trackingNumber}
                      </p>
                    </div>

                    {shipment.trackingLink ? (
                      <a
                        href={shipment.trackingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                      >
                        <span>Live Carrier Tracking</span>
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-muted-foreground">
              Equipment is undergoing final testing & packing at our Udaipur warehouse. Once handed over to Delhivery / India Post, your direct tracking link will appear here.
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
            Items in Order
          </h3>

          <div className="divide-y divide-border">
            {order.lineItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-4">
                <div>
                  <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold text-foreground text-sm">₹{item.total}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold text-foreground">
            <span>Total Amount:</span>
            <span>₹{order.total}</span>
          </div>
        </div>
      </div>

      {/* Delivery & Support Details */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Delivery Destination
          </h3>
          <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">
              {order.shipping.first_name} {order.shipping.last_name}
            </p>
            <p>{order.shipping.address_1}</p>
            {order.shipping.address_2 ? <p>{order.shipping.address_2}</p> : null}
            <p>
              {order.shipping.city}, {order.shipping.state} - {order.shipping.postcode}
            </p>
            <p>India</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-stone-900 p-6 text-white shadow-xs">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-300">
            Order Support
          </h3>
          <p className="mt-2 text-xs text-stone-300">
            Have questions regarding this shipment? Our Udaipur safety team is available on WhatsApp & Phone.
          </p>
          <div className="mt-4 space-y-1 text-xs">
            <p>
              <span className="text-stone-400">Phone:</span>{" "}
              <a href="tel:+917891111390" className="font-medium text-white underline">
                +91 78911 11390
              </a>
            </p>
            <p>
              <span className="text-stone-400">Email:</span>{" "}
              <a href="mailto:support@grahakavach.in" className="font-medium text-white underline">
                support@grahakavach.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
