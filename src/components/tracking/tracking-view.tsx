"use client";

import { useState } from "react";

import type { OrderPayment, TrackingData, TrackingShipment } from "@/lib/tracking/types";

export type { OrderPayment, TrackingData, TrackingShipment };

export const TRACKING_STEPS = ["Order confirmed", "Shipped", "Out for delivery", "Delivered"];

/** How far along a parcel is: 0 confirmed, 1 shipped, 2 out for delivery, 3 delivered. */
function stageOf(shipment: TrackingShipment | undefined, data: TrackingData): number {
  if (data.state === "completed") return 3;
  if (shipment?.status === "delivered") return 3;
  if (shipment?.status === "out_for_delivery") return 2;
  if (data.isShipped) return 1;
  return 0;
}

function formatDay(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** Courier scan times are already Indian clock times ("2026-11-05 12:11:00"); show them as written. */
function formatTime(value: string): { day: string; time: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(value);
  if (!m) return { day: value, time: "" };
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  return {
    day: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    time: date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

function headline(shipment: TrackingShipment | undefined, data: TrackingData, stage: number): { text: string; sub: string; tone: "good" | "warn" | "bad" } {
  if (data.state === "cancelled") return { text: "Order cancelled", sub: "", tone: "bad" };
  if (data.state === "refunded") return { text: "Order refunded", sub: "", tone: "bad" };
  if (stage === 3) return { text: "Delivered", sub: shipment?.events[0]?.time ? formatDay(shipment.events[0].time.slice(0, 10)) : "", tone: "good" };
  if (shipment?.status === "failed_attempt" || shipment?.status === "exception") {
    return { text: shipment.statusLabel ?? "Delivery issue", sub: "We are in touch with the courier.", tone: "warn" };
  }
  if (shipment?.status === "return_to_sender") return { text: "Returning to sender", sub: "", tone: "bad" };
  if (stage === 2) return { text: "Out for delivery", sub: "Arriving today", tone: "good" };
  if (shipment?.estimatedDelivery) return { text: `Arriving by ${formatDay(shipment.estimatedDelivery)}`, sub: shipment.statusLabel ?? "", tone: "good" };
  if (stage === 1) return { text: shipment?.statusLabel && shipment.status !== "unknown" ? shipment.statusLabel : "Shipped", sub: "On its way to you", tone: "good" };
  if (data.state === "awaiting_payment" || data.state === "confirming") return { text: "Waiting for payment confirmation", sub: "", tone: "warn" };
  return { text: "Packing your order", sub: "It will be shipped soon", tone: "good" };
}

/** Stage and headline for the order cards on My Orders (first parcel). */
export function summarizeTracking(data: TrackingData): { stage: number; text: string; sub: string; tone: "good" | "warn" | "bad" } {
  const shipment = data.shipments[0];
  const stage = stageOf(shipment, data);
  return { stage, ...headline(shipment, data, stage) };
}

const toneClass = { good: "text-emerald-700", warn: "text-amber-700", bad: "text-red-700" } as const;

function Check() {
  return (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Flipkart-style order tracking: headline, four-step progress, and a vertical scan history. */
export function TrackingView({ data }: { data: TrackingData }) {
  const shipments: (TrackingShipment | undefined)[] = data.shipments.length > 0 ? data.shipments : [undefined];

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h2 className="text-lg font-bold text-foreground">Order #{data.orderNumber}</h2>
        <span className="text-xs text-muted-foreground">
          Placed on {new Date(data.placedOn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      {shipments.map((shipment, index) => (
        <ShipmentCard key={shipment?.trackingNumber ?? index} shipment={shipment} data={data} multiple={shipments.length > 1} number={index + 1} />
      ))}

      {data.payment ? <PaymentCard payment={data.payment} /> : null}

      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-foreground">In this order</h3>
        <ul className="mt-2 divide-y divide-border text-sm">
          {data.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3 py-2 text-stone-700">
              <span>{item.name}</span>
              <span className="shrink-0 font-semibold text-foreground">Qty {item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-foreground">Need help with this order?</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Call our dispatch desk at{" "}
          <a href="tel:+917891111390" className="font-semibold text-primary underline">
            +91 78911 11390
          </a>{" "}
          or write to{" "}
          <a href="mailto:support@grahakavach.in" className="font-semibold text-primary underline">
            support@grahakavach.in
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function ShipmentCard({ shipment, data, multiple, number }: { shipment: TrackingShipment | undefined; data: TrackingData; multiple: boolean; number: number }) {
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const stage = stageOf(shipment, data);
  const top = headline(shipment, data, stage);
  const events = shipment?.events ?? [];
  const visible = showAll ? events : events.slice(0, 4);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
      <div className="border-b border-border bg-stone-50/60 px-5 py-4">
        {multiple ? <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Package {number}</p> : null}
        <p className={`text-xl font-bold ${toneClass[top.tone]}`}>{top.text}</p>
        {top.sub ? <p className="mt-0.5 text-sm text-stone-600">{top.sub}</p> : null}
      </div>

      {/* Four-step progress */}
      <div className="px-5 pt-6 pb-2">
        <ol className="relative flex justify-between">
          <div className="absolute top-3 right-8 left-8 h-1 rounded bg-stone-200" />
          <div className="absolute top-3 left-8 h-1 rounded bg-emerald-600 transition-all duration-500" style={{ width: `calc((100% - 4rem) * ${stage / 3})` }} />
          {TRACKING_STEPS.map((label, i) => {
            const done = i <= stage;
            return (
              <li key={label} className="relative z-10 flex w-16 flex-col items-center text-center">
                <span className={`flex size-7 items-center justify-center rounded-full border-2 ${done ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300 bg-white text-transparent"}`}>
                  {done ? <Check /> : null}
                </span>
                <span className={`mt-2 text-[11px] leading-tight ${i === stage ? "font-bold text-foreground" : done ? "font-medium text-stone-700" : "text-stone-400"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {shipment ? (
        <div className="px-5 pt-4 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{shipment.carrier}</p>
              <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-stone-600">
                <span className="truncate">{shipment.trackingNumber}</span>
                <button
                  type="button"
                  className="shrink-0 rounded border border-border px-1.5 py-0.5 font-sans text-[10px] font-semibold text-stone-700 hover:bg-white"
                  onClick={() => {
                    void navigator.clipboard?.writeText(shipment.trackingNumber).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    });
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </p>
              {shipment.shippedOn ? <p className="mt-0.5 text-[11px] text-muted-foreground">Shipped on {shipment.shippedOn}</p> : null}
            </div>
            {shipment.trackingUrl ? (
              <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary underline">
                Track on {shipment.carrier}
              </a>
            ) : null}
          </div>

          {events.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-foreground">Shipment updates</h3>
              <ol className="mt-3">
                {visible.map((event, i) => {
                  const when = event.time ? formatTime(event.time) : null;
                  const last = i === visible.length - 1;
                  return (
                    <li key={i} className="flex gap-3">
                      <div className="w-14 shrink-0 pt-0.5 text-right">
                        {when ? (
                          <>
                            <p className="text-xs font-semibold text-stone-800">{when.day}</p>
                            <p className="text-[11px] text-stone-500">{when.time}</p>
                          </>
                        ) : null}
                      </div>
                      <div className="relative flex flex-col items-center">
                        <span className={`mt-1 size-3 rounded-full ${i === 0 ? "bg-emerald-600 ring-4 ring-emerald-100" : "bg-stone-300"}`} />
                        {!last ? <span className="w-0.5 flex-1 bg-stone-200" /> : null}
                      </div>
                      <div className={`min-w-0 pb-5 ${last ? "pb-0" : ""}`}>
                        <p className={`text-sm ${i === 0 ? "font-semibold text-foreground" : "text-stone-700"}`}>{event.message}</p>
                        {event.location ? <p className="text-xs text-stone-500">{event.location}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {events.length > 4 ? (
                <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? "Show less" : `See all ${events.length} updates`}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Courier scans will appear here as soon as the parcel moves. They refresh automatically.
            </p>
          )}
        </div>
      ) : (
        <p className="px-5 pt-4 pb-5 text-xs text-muted-foreground">
          Your order is being prepared. The courier and tracking number will appear here once it is handed over.
        </p>
      )}
    </div>
  );
}

const inr = (value: number) =>
  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`;

const paymentTone: Record<OrderPayment["kind"], string> = {
  online: "bg-emerald-100 text-emerald-800",
  paid: "bg-emerald-100 text-emerald-800",
  part: "bg-amber-100 text-amber-900",
  cod: "bg-stone-100 text-stone-800",
  awaiting: "bg-red-100 text-red-800",
};

/** Small coloured label: "Part paid", "Paid online", "Pay on delivery"... */
export function PaymentBadge({ payment }: { payment: OrderPayment }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentTone[payment.kind]}`}>{payment.label}</span>
  );
}

/** One line under an order card: what has been paid and what is still due. */
export function paymentSentence(payment: OrderPayment): string {
  switch (payment.kind) {
    case "part":
      return `${inr(payment.paid)} paid online · ${inr(payment.due)} to pay on delivery`;
    case "paid":
      return `${inr(payment.total)} paid, advance online and balance on delivery`;
    case "online":
      return `${inr(payment.total)} paid online`;
    case "cod":
      return `${inr(payment.total)} to pay on delivery`;
    default:
      return `${inr(payment.total)} awaiting payment`;
  }
}

/** What has been paid and what is left, so a part-paid order is never mistaken for a fully paid one. */
function PaymentCard({ payment }: { payment: OrderPayment }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Payment</h3>
        <PaymentBadge payment={payment} />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Order total</dt>
          <dd className="font-semibold text-foreground">{inr(payment.total)}</dd>
        </div>
        {payment.paid > 0 && payment.kind !== "paid" && payment.kind !== "online" ? (
          <div className="flex justify-between gap-3">
            <dt className="text-stone-600">Paid online</dt>
            <dd className="font-semibold text-emerald-700">- {inr(payment.paid)}</dd>
          </div>
        ) : null}
        {payment.due > 0 ? (
          <div className="flex justify-between gap-3 border-t border-border pt-2">
            <dt className="font-semibold text-foreground">{payment.kind === "awaiting" ? "Amount due" : "Pay on delivery"}</dt>
            <dd className="text-base font-bold text-foreground">{inr(payment.due)}</dd>
          </div>
        ) : (
          <div className="flex justify-between gap-3 border-t border-border pt-2">
            <dt className="font-semibold text-foreground">Balance</dt>
            <dd className="font-bold text-emerald-700">{inr(0)}</dd>
          </div>
        )}
      </dl>
      {payment.kind === "part" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          You paid an advance online. Please pay the balance in cash or UPI to the delivery person.
        </p>
      ) : null}
    </div>
  );
}
