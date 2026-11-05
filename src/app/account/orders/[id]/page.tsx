"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useCustomer } from "@/lib/auth/use-customer";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { TrackingView, type TrackingData } from "@/components/tracking/tracking-view";

type OrderDetail = {
  id: number;
  number: string;
  status: string;
  dateCreated: string;
  total: string;
  shipping: Record<string, string>;
  tracking: TrackingData;
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

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch("/api/account/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      const found = (data.orders || []).find((o: { id: number }) => String(o.id) === id);

      if (!found) {
        throw new Error("Order not found or access denied.");
      }

      setOrder(found);
      setError(null);
    } catch (err) {
      // A failed refresh keeps the order already on screen.
      setError((current) => current ?? (err instanceof Error ? err.message : "Error loading order"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (customer) {
      void loadOrder();
    }
  }, [customer, loadOrder]);

  // Courier updates reach the page by themselves while it stays open.
  useAutoRefresh(loadOrder, Boolean(customer));

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        <div className="inline-block size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="mt-3">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
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

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-block text-xs font-semibold text-primary hover:underline">
        ← All orders
      </Link>

      {/* Headline, progress, courier scans, payment and items: the same screen guests see. */}
      <TrackingView data={order.tracking} />

      <div>
        <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Delivery Destination</h3>
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

      </div>
    </div>
  );
}
