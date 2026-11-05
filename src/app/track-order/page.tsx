"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCustomer } from "@/lib/auth/use-customer";
import { Field, Input } from "@/components/ui/form";

type TrackingShipment = {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  shippedOn: string | null;
};

type TrackingResult = {
  orderNumber: string;
  placedOn: string;
  state:
    | "awaiting_payment"
    | "confirming"
    | "preparing"
    | "shipped"
    | "completed"
    | "cancelled"
    | "refunded";
  isShipped: boolean;
  shipments: TrackingShipment[];
  items: { name: string; quantity: number }[];
};

type LoggedInOrder = {
  id: number;
  number: string;
  dateCreated: string;
  status: string;
  billing: { email?: string };
  shipments: { trackingProvider: string }[];
};

export default function TrackOrderPage() {
  const { customer } = useCustomer();

  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Logged-in customer orders for quick tracking
  const [customerOrders, setCustomerOrders] = useState<LoggedInOrder[]>([]);

  const handleTrack = async (targetOrderNumber: string, targetEmail: string) => {
    // A logged-in customer's own orders need no email or phone.
    if (!targetOrderNumber.trim() || (!customer && !targetEmail.trim())) {
      setError("Please enter both Order ID and your Email or Mobile number.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: targetOrderNumber.trim(),
          email: targetEmail.trim(),
        }),
      });

      if (res.status === 429) {
        throw new Error("Too many tracking attempts. Please wait a few minutes and try again.");
      }

      if (!res.ok) {
        throw new Error("No order found matching this order number and email or mobile number.");
      }

      const data: TrackingResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tracking lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer) {
      // Prefilling the email and flagging the load both happen once the
      // request is under way, so nothing is set while the effect body runs.
      fetch("/api/account/orders")
        .then((res) => res.json())
        .then((data) => {
          setEmail(customer.email || "");
          if (data.orders) {
            setCustomerOrders(data.orders);
            // Show the latest order straight away; nothing to fill in.
            if (data.orders[0]) {
              setOrderNumber(data.orders[0].number);
              handleTrack(data.orders[0].number, "");
            }
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(orderNumber, email);
  };

  const getMilestoneIndex = (state: TrackingResult["state"]) => {
    switch (state) {
      case "awaiting_payment":
      case "confirming":
        return 0; // Order Placed
      case "preparing":
        return 1; // Processing
      case "shipped":
        return 2; // Shipped
      case "completed":
        return 3; // Delivered / Completed
      default:
        return 1;
    }
  };

  return (
    <main className="min-h-screen bg-stone-50/50 py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-10">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Track Order</span>
        </div>

        {/* Title Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Track Your Shipment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor real-time package dispatch and delivery from our Udaipur manufacturing facility.
          </p>
        </div>

        {/* Quick select for Logged In Customers */}
        {customer && customerOrders.length > 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-xs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your Active Orders ({customerOrders.length})
            </h2>
            <div className="mt-3 divide-y divide-border">
              {customerOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <span className="font-mono font-bold text-foreground">
                      Order #{order.number}
                    </span>
                    <span className="ml-3 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium uppercase text-stone-700">
                      {order.status}
                    </span>
                    {order.shipments && order.shipments.length > 0 ? (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {order.shipments[0].trackingProvider}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderNumber(order.number);
                      handleTrack(order.number, "");
                    }}
                    className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200"
                  >
                    Track This Order →
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Lookup Form */}
        <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
          <h2 className="text-lg font-medium text-foreground">
            Order Verification
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your order number and the email address or mobile number you gave while ordering.
          </p>

          {error ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-danger">
              <svg className="mt-0.5 size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <Field id="orderNumber" label="Order Number" required>
              {({ id, "aria-describedby": describedBy }) => (
                <Input
                  id={id}
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. 34 or #34"
                  disabled={loading}
                  aria-describedby={describedBy}
                  required
                />
              )}
            </Field>

            <Field id="email" label="Email or Mobile Number" required={!customer}>
              {({ id, "aria-describedby": describedBy }) => (
                <Input
                  id={id}
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com or 98XXXXXXXX"
                  disabled={loading}
                  aria-describedby={describedBy}
                  required={!customer}
                />
              )}
            </Field>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !orderNumber.trim() || (!customer && !email.trim())}
                className="flex h-[44px] w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-stone-300 sm:w-auto"
              >
                {loading ? "Verifying..." : "Track"}
              </button>
            </div>
          </form>
        </div>

        {/* Tracking Results Display */}
        {result ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="font-mono text-xl font-bold text-foreground">
                    Order #{result.orderNumber}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Placed on{" "}
                    {new Date(result.placedOn).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <span className="rounded-full bg-stone-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700 border border-border">
                  {result.state.replace("_", " ")}
                </span>
              </div>

              {/* Milestone Stepper */}
              <div className="mt-8">
                <div className="relative flex justify-between">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-200" />
                  <div
                    className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
                    style={{
                      width: `${(getMilestoneIndex(result.state) / 3) * 100}%`,
                    }}
                  />

                  {/* Steps */}
                  {[
                    { title: "Order Placed", desc: "Confirmed" },
                    { title: "Processing", desc: "Packaging" },
                    { title: "Shipped", desc: "In Transit" },
                    { title: "Delivered", desc: "Fulfilled" },
                  ].map((step, idx) => {
                    const currentIdx = getMilestoneIndex(result.state);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
                        <div
                          className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                            isDone
                              ? "bg-primary text-white ring-4 ring-primary/20"
                              : "bg-white border-2 border-stone-300 text-stone-400"
                          }`}
                        >
                          {isDone ? "✓" : idx + 1}
                        </div>
                        <span className={`mt-2 text-xs font-semibold ${isCurrent ? "text-foreground font-bold" : "text-stone-600"}`}>
                          {step.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{step.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Carrier Shipments */}
              <div className="mt-10 border-t border-border pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Carrier Information
                </h3>

                {result.shipments.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {result.shipments.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-950 text-base">
                              {s.carrier}
                            </span>
                            <span className="rounded bg-emerald-200/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                              Verified Courier
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-xs text-stone-700">
                            AWB / Tracking #: <span className="font-bold">{s.trackingNumber}</span>
                          </p>
                          {s.shippedOn ? (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Handed over on {s.shippedOn}
                            </p>
                          ) : null}
                        </div>

                        {s.trackingUrl ? (
                          <a
                            href={s.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
                          >
                            <span>Track on {s.carrier} Portal</span>
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-muted-foreground">
                    Equipment is currently in our inspection & packaging queue. AWB tracking links will be issued as soon as Delhivery / India Post accepts the parcel.
                  </div>
                )}
              </div>

              {/* Items in this order */}
              <div className="mt-8 border-t border-border pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Package Contents
                </h3>
                <ul className="mt-3 divide-y divide-border text-xs">
                  {result.items.map((item, i) => (
                    <li key={i} className="flex justify-between py-2 text-stone-700">
                      <span>{item.name}</span>
                      <span className="font-semibold text-foreground">Qty: {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Support Box */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
              <h4 className="text-sm font-semibold text-foreground">
                Need Priority Assistance?
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                If your delivery is delayed or you require address changes before dispatch, reach out directly to our Udaipur dispatch desk at{" "}
                <a href="tel:+917891111390" className="font-semibold text-primary underline">
                  +91 78911 11390
                </a>{" "}
                or email{" "}
                <a href="mailto:support@grahakavach.in" className="font-semibold text-primary underline">
                  support@grahakavach.in
                </a>.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
