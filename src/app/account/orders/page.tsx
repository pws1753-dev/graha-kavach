"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  PaymentBadge,
  TRACKING_STEPS,
  paymentSentence,
  summarizeTracking,
  type TrackingData,
} from "@/components/tracking/tracking-view";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";

type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  total: string;
};

type OrderSummary = {
  id: number;
  number: string;
  status: string;
  dateCreated: string;
  total: string;
  items: OrderItem[];
  tracking: TrackingData;
};

const toneClass = { good: "text-emerald-700", warn: "text-amber-700", bad: "text-red-700" } as const;

/** Four small steps under the headline, filled up to where the parcel is. */
function MiniProgress({ stage }: { stage: number }) {
  return (
    <ol className="mt-3 grid grid-cols-4 gap-1.5" aria-label="Order progress">
      {TRACKING_STEPS.map((label, i) => (
        <li key={label}>
          <span className={`block h-1.5 rounded-full ${i <= stage ? "bg-emerald-600" : "bg-stone-200"}`} />
          <span className={`mt-1 block text-[10px] leading-tight ${i === stage ? "font-bold text-foreground" : "text-stone-500"}`}>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/account/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setOrders(data.orders || []);
      setFailed(false);
    } catch {
      // Keep whatever is already on screen; only flag it when there is nothing to show.
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The fetch settles asynchronously; state is only set after it resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders();
  }, [loadOrders]);

  // Courier updates reach the page by themselves while it stays open.
  useAutoRefresh(loadOrders);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">My Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every order with its live delivery status and payment. The status updates by itself as your parcel moves.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <div className="inline-block size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="mt-3">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-foreground">
              {failed ? "We could not load your orders" : "No Orders Found"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {failed
                ? "Please refresh the page in a moment."
                : "You haven't placed any orders with Graha Kavach yet."}
            </p>
            <div className="mt-6">
              <Link
                href="/fire-safety-kit"
                className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
              >
                Browse Fire Safety Kit
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const formattedDate = new Date(order.dateCreated).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const summary = summarizeTracking(order.tracking);
              const parcel = order.tracking.shipments[0];
              const payment = order.tracking.payment;

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-stone-50/50 p-5 transition-all hover:border-stone-300 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-base font-bold text-foreground">Order #{order.number}</span>
                      <p className="text-xs text-muted-foreground">Placed on {formattedDate}</p>
                    </div>
                    {payment ? <PaymentBadge payment={payment} /> : null}
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-white p-4">
                    <p className={`text-lg font-bold ${toneClass[summary.tone]}`}>{summary.text}</p>
                    {summary.sub ? <p className="text-sm text-stone-600">{summary.sub}</p> : null}
                    <MiniProgress stage={summary.stage} />
                    {parcel?.lastEvent ? (
                      <p className="mt-3 text-xs text-stone-600">
                        <span className="font-semibold text-foreground">Latest:</span> {parcel.lastEvent}
                      </p>
                    ) : null}
                    {parcel ? (
                      <p className="mt-1 font-mono text-[11px] text-stone-500">
                        {parcel.carrier} · {parcel.trackingNumber}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                        <span className="truncate">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium text-foreground">₹{item.total}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Total:</span>{" "}
                      <span className="text-base font-bold text-foreground">₹{order.total}</span>
                      {payment ? <p className="mt-0.5 text-xs text-stone-600">{paymentSentence(payment)}</p> : null}
                    </div>

                    <div className="flex items-center gap-3">
                      {parcel?.trackingUrl ? (
                        <a
                          href={parcel.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          Track on {parcel.carrier} ↗
                        </a>
                      ) : null}

                      <Link
                        href={`/account/orders/${order.id}`}
                        className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-xs border border-border hover:bg-stone-100"
                      >
                        Track &amp; Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
