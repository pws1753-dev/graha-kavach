"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCustomer } from "@/lib/auth/use-customer";
import { Field, Input } from "@/components/ui/form";
import { PaymentBadge, TrackingView, summarizeTracking, type TrackingData } from "@/components/tracking/tracking-view";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";

type TrackingResult = TrackingData;

type LoggedInOrder = {
  id: number;
  number: string;
  dateCreated: string;
  status: string;
  billing: { email?: string };
  shipments: { trackingProvider: string }[];
  tracking: TrackingData;
};

export default function TrackOrderPage() {
  const { customer, isLoading: authLoading } = useCustomer();

  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Logged-in customer orders for quick tracking
  const [customerOrders, setCustomerOrders] = useState<LoggedInOrder[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // The order on screen, so it can be refreshed in the background without asking again.
  const lastQuery = useRef<{ orderNumber: string; email: string } | null>(null);

  const handleTrack = async (targetOrderNumber: string, targetEmail: string) => {
    // A logged-in customer's own orders need no email or phone.
    if (!targetOrderNumber.trim() || (!customer && !targetEmail.trim())) {
      setError("Please enter both Order ID and your Email or Mobile number.");
      return;
    }

    lastQuery.current = { orderNumber: targetOrderNumber.trim(), email: targetEmail.trim() };
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

  // Pick up courier updates while the page stays open, without clearing what is on screen.
  useAutoRefresh(() => {
    const query = lastQuery.current;
    if (!query) return;
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TrackingResult | null) => {
        if (data) setResult(data);
      })
      .catch(() => {});
  }, Boolean(result));

  useEffect(() => {
    if (customer) {
      // Prefilling the email and flagging the load both happen once the
      // request is under way, so nothing is set while the effect body runs.
      fetch("/api/account/orders")
        .then((res) => res.json())
        .then((data) => {
          // A phone-login account has a placeholder email; the phone is what identifies it.
          const realEmail = customer.email && !customer.email.endsWith("@phone.grahakavach.in") ? customer.email : "";
          setEmail(customer.billing?.phone || realEmail);
          setOrdersLoaded(true);
          if (data.orders) {
            setCustomerOrders(data.orders);
            // Show the latest order straight away; nothing to fill in.
            if (data.orders[0]) {
              setOrderNumber(data.orders[0].number);
              handleTrack(data.orders[0].number, "");
            }
          }
        })
        .catch(() => setOrdersLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(orderNumber, email);
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

        {authLoading ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-xs">
            Checking your account...
          </div>
        ) : null}

        {customer && ordersLoaded && customerOrders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            No orders are linked to this account yet. Enter your order number below; your mobile number is already filled in.
          </div>
        ) : null}

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
                    <span className="ml-3 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                      {summarizeTracking(order.tracking).text}
                    </span>
                    {order.tracking.payment ? (
                      <span className="ml-2 inline-block align-middle">
                        <PaymentBadge payment={order.tracking.payment} />
                      </span>
                    ) : null}
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
        <div className={`mt-8 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8 ${authLoading ? "hidden" : ""}`}>
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
        {result ? <TrackingView data={result} /> : null}
      </div>
    </main>
  );
}
