"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart/use-cart";
import { trackPurchase } from "@/lib/analytics/meta-pixel";
import { reportVerifiedPurchase } from "@/lib/analytics/google-purchase";

type OrderConfirmationData = {
  orderNumber: string;
  orderId: number;
  orderKey: string;
  status: string;
  dateCreated: string;
  currency: string;
  total: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  paymentMethodTitle: string;
  billing: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
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
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  gstin?: string;
  fees?: { name: string; total: string }[];
  codAdvance?: string;
  lineItems: {
    id: number;
    productId: number;
    name: string;
    quantity: number;
    total: string;
    price: number;
    image: string | null;
  }[];
  shipments: {
    trackingNumber: string;
    trackingProvider: string;
    trackingLink: string;
    dateShipped: string;
  }[];
  trackingAvailable: boolean;
};

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get("orderId");
  const key = searchParams.get("key");

  const [order, setOrder] = useState<OrderConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A link without both parameters cannot be looked up at all, so that is a
  // property of the URL rather than something to store in state.
  const linkIsIncomplete = !orderId || !key;

  useEffect(() => {
    if (linkIsIncomplete) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}?key=${key}`);
        if (!res.ok) {
          throw new Error("Unable to retrieve verified order details.");
        }
        const data: OrderConfirmationData = await res.json();
        setOrder(data);
        // Online orders keep the cart until the payment is confirmed.
        if (!["pending", "failed", "cancelled"].includes(data.status)) {
          clearCart();
          // Google Ads purchase: the server decides whether it is a paid, unreported order.
          void reportVerifiedPurchase(data.orderId, key as string);

          const storageKey = `meta_purchase_tracked_${data.orderId}`;
          if (typeof window !== "undefined" && !sessionStorage.getItem(storageKey)) {
            sessionStorage.setItem(storageKey, "1");
            trackPurchase({
              orderId: data.orderNumber || String(data.orderId),
              value: parseFloat(data.total) || 0,
              currency: data.currency || "INR",
              num_items: data.lineItems.reduce((acc, item) => acc + item.quantity, 0),
              content_ids: data.lineItems.map((item) => item.productId),
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading order.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, key, linkIsIncomplete]);

  const message = linkIsIncomplete ? "Missing order details in link." : error;

  if (loading && !linkIsIncomplete) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <div className="inline-block size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (message || !order) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100 text-danger">
          <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-medium text-foreground">Order Notice</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message || "Order not found."}</p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Return to Home
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
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-xs sm:p-8">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
          <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Order Successfully Placed!
        </h1>
        <p className="mt-2 text-sm text-emerald-900">
          Thank you for choosing Graha Kavach. Your fire safety equipment is being prepared for dispatch.
        </p>

        <div className="mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-4 rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Order Number:</span>
            <p className="font-mono font-bold text-foreground">#{order.orderNumber}</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-xs text-muted-foreground">Placed On:</span>
            <p className="font-medium text-foreground">{formattedDate}</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-xs text-muted-foreground">Payment Status:</span>
            <p className="font-medium text-emerald-700 capitalize">{order.status}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Line items and tracking */}
        <div className="space-y-8">
          {/* Line Items Card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
            <h3 className="text-lg font-medium text-foreground">Order Summary</h3>

            <div className="mt-4 divide-y divide-border">
              {order.lineItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Quantity: {item.quantity} × ₹{item.price}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-foreground">
                    ₹{item.total}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-medium text-foreground">
                  {parseFloat(order.shippingTotal) > 0 ? `₹${order.shippingTotal}` : "FREE"}
                </span>
              </div>

              {(order.fees ?? []).map((fee) => (
                <div key={fee.name} className="flex justify-between text-muted-foreground">
                  <span>{fee.name}</span>
                  <span className="font-medium text-foreground">₹{fee.total}</span>
                </div>
              ))}

              {parseFloat(order.discountTotal) > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-medium">-₹{order.discountTotal}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-muted-foreground">
                <span>Taxes</span>
                <span className="font-medium text-foreground">
                  {parseFloat(order.taxTotal) > 0 ? `₹${order.taxTotal}` : "₹0"}
                </span>
              </div>

              <div className="flex items-baseline justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
                <span>Total Amount</span>
                <span className="text-2xl font-bold text-foreground">₹{order.total}</span>
              </div>

              {order.codAdvance ? (
                <div className="mt-3 space-y-1 rounded-lg bg-stone-50 p-3">
                  <div className="flex justify-between text-foreground">
                    <span>Advance paid online</span>
                    <span className="font-semibold">₹{order.codAdvance}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Balance to pay on delivery</span>
                    <span className="font-medium text-foreground">
                      ₹{Math.max(0, parseFloat(order.total) - parseFloat(order.codAdvance)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Shipment Tracking Availability */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-2">
              <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <h3 className="text-lg font-medium text-foreground">Shipment Tracking</h3>
            </div>

            {order.trackingAvailable ? (
              <div className="mt-4 space-y-3">
                {order.shipments.map((shipment, i) => (
                  <div key={i} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-emerald-950">
                        {shipment.trackingProvider}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        AWB: {shipment.trackingNumber}
                      </span>
                    </div>
                    {shipment.trackingLink ? (
                      <div className="mt-3">
                        <a
                          href={shipment.trackingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                        >
                          <span>Track on Carrier Website</span>
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                <p className="font-medium text-foreground">Packaging & Dispatch in Progress</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your tracking number (Delhivery / India Post / BlueDart) will be assigned once the package leaves our Udaipur facility. An automated SMS & email with the direct tracking link will be dispatched to <strong>{order.billing.phone}</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Delivery Address & Support CTA */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
            <h3 className="text-base font-medium text-foreground">Delivery Destination</h3>

            <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">
                {order.shipping.first_name} {order.shipping.last_name}
              </p>
              <p>{order.shipping.address_1}</p>
              {order.shipping.address_2 ? <p>{order.shipping.address_2}</p> : null}
              <p>
                {order.shipping.city}, {order.shipping.state} - {order.shipping.postcode}
              </p>
              <p className="mt-2 font-medium text-foreground">India</p>
              <p className="mt-3 text-xs">
                Mobile: <span className="font-mono text-foreground">+91 {order.billing.phone}</span>
              </p>
              <p className="text-xs">
                Email: <span className="text-foreground">{order.billing.email}</span>
              </p>
            </div>
          </div>

          {/* Payment & Tax Invoice */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
            <h3 className="text-base font-medium text-foreground">Payment & Tax Invoice</h3>
            <p className="mt-2 text-sm font-medium text-foreground">
              {order.paymentMethodTitle}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Status: <span className="font-semibold capitalize text-foreground">{order.status}</span>
            </p>

            {order.gstin || order.billing.company ? (
              <div className="mt-4 border-t border-border pt-3 text-xs">
                <p className="font-semibold text-foreground">GST Tax Invoice Details:</p>
                {order.billing.company ? (
                  <p className="mt-1 text-muted-foreground">
                    Firm / Company: <span className="font-medium text-foreground">{order.billing.company}</span>
                  </p>
                ) : null}
                {order.gstin ? (
                  <p className="mt-1 text-muted-foreground">
                    GSTIN: <span className="font-mono font-medium text-foreground">{order.gstin}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Support CTA */}
          <div className="rounded-2xl border border-border bg-stone-900 p-6 text-white shadow-xs">
            <h3 className="text-base font-medium text-white">Need Help with Your Order?</h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-300">
              Our safety team in Udaipur is available for delivery assistance, invoice queries, and equipment guidance.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <p>
                <span className="text-stone-400">WhatsApp / Phone:</span>{" "}
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
              <p className="text-[11px] text-stone-400">
                Please mention Order #{order.orderNumber} in your message.
              </p>
            </div>
          </div>

          <Link
            href="/fire-safety-kit"
            className="flex w-full items-center justify-center rounded-xl border border-border bg-white px-6 py-3 text-center text-sm font-medium text-foreground shadow-xs hover:bg-stone-50"
          >
            ← Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <main className="min-h-screen bg-stone-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <Suspense fallback={<div className="text-center py-20">Loading order...</div>}>
          <OrderConfirmationContent />
        </Suspense>
      </div>
    </main>
  );
}
