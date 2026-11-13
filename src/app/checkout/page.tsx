"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/use-cart";
import { useCartCapture } from "@/lib/cart/use-cart-capture";
import { AddressForm } from "@/components/checkout/address-form";
import { PaymentSelector } from "@/components/checkout/payment-selector";
import { CheckoutReview } from "@/components/checkout/checkout-review";
import { indianAddressSchema, type IndianAddress } from "@/lib/validation/checkout";
import { payWithRazorpay } from "@/lib/razorpay/client";
import { computeAdvanceMinor, isCodMethod, type CodAdvanceConfig } from "@/lib/config/checkout";
import { formatMinorUnitsToCurrency } from "@/lib/woocommerce/adapters";
import { trackInitiateCheckout } from "@/lib/analytics/meta-pixel";
import type { ValidatedCart } from "@/lib/cart/types";
import type { PaymentMethodInfo } from "@/lib/woocommerce/payment-gateways";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, couponCode, clearCart, isReady } = useCart();

  const [validatedCart, setValidatedCart] = useState<ValidatedCart | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [codAdvance, setCodAdvance] = useState<CodAdvanceConfig | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const hasTrackedCheckoutRef = useRef(false);

  const [address, setAddress] = useState<IndianAddress>({
    firstName: "",
    lastName: "",
    company: "",
    gstin: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "RJ", // Default to Rajasthan (Udaipur region)
    postcode: "",
    country: "IN",
    orderNotes: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof IndianAddress, string>>>({});

  // Lets us follow up on WhatsApp if the shopper leaves before paying.
  useCartCapture({
    items,
    phone: address.phone,
    name: `${address.firstName} ${address.lastName}`,
    email: address.email,
  });

  // Unique Idempotency Key generated once per checkout session
  const [idempotencyKey] = useState(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `gk_idemp_${Math.random().toString(36).substring(2)}${Date.now()}`;
  });

  const loadCheckoutData = useCallback(async () => {
    if (!items.length) {
      setLoading(false);
      return;
    }

    try {
      // 1. Validate Cart against WooCommerce
      const cartRes = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, couponCode: couponCode || undefined }),
      });
      if (!cartRes.ok) throw new Error("Failed to validate cart with store.");
      const cartData: ValidatedCart = await cartRes.json();
      setValidatedCart(cartData);

      if (!hasTrackedCheckoutRef.current && cartData.items.length > 0) {
        hasTrackedCheckoutRef.current = true;
        trackInitiateCheckout({
          value: cartData.totalMinor / 100,
          currency: cartData.currency || "INR",
          num_items: cartData.items.reduce((acc, i) => acc + i.quantity, 0),
          content_ids: cartData.items.map((i) => i.productId),
        });
      }

      // 2. Fetch Payment Methods
      const payRes = await fetch("/api/checkout/payment-methods");
      if (payRes.ok) {
        const payData = await payRes.json();
        const methods: PaymentMethodInfo[] = payData.methods || [];
        setPaymentMethods(methods);
        setCodAdvance((payData.codAdvance as CodAdvanceConfig | undefined) ?? null);
        if (methods.length > 0) {
          // Partial payment (COD with an advance) is the default; the customer can
          // switch to paying the full amount online.
          const preferred = methods.find((m) => isCodMethod(m.id)) ?? methods[0];
          setSelectedPaymentMethod(preferred.id);
        }
      }
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Error loading checkout");
    } finally {
      setLoading(false);
    }
  }, [items, couponCode]);

  useEffect(() => {
    if (!isReady) return;

    const timer = window.setTimeout(() => {
      void loadCheckoutData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isReady, loadCheckoutData]);

  const handleAddressChange = (field: keyof IndianAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setGeneralError(null);

    // Validate Indian Address
    const parsedAddress = indianAddressSchema.safeParse(address);
    if (!parsedAddress.success) {
      const fieldErrors: Partial<Record<keyof IndianAddress, string>> = {};
      for (const issue of parsedAddress.error.issues) {
        const path = issue.path[0] as keyof IndianAddress;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setFormErrors(fieldErrors);
      setGeneralError("Please complete all required address fields.");
      window.scrollTo({ top: 150, behavior: "smooth" });
      return;
    }

    if (!selectedPaymentMethod) {
      setGeneralError("Please select a payment method.");
      return;
    }

    if (!validatedCart || validatedCart.hasErrors) {
      setGeneralError("Your cart has items with errors. Please return to cart.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: parsedAddress.data,
          paymentMethod: selectedPaymentMethod,
          items,
          couponCode: couponCode || undefined,
          idempotencyKey,
        }),
      });

      // A proxy or CDN error page is HTML, not JSON — say so instead of surfacing a parser error.
      const raw = await res.text();
      let data: {
        success?: boolean;
        error?: string;
        details?: string;
        messages?: string[];
        isOnline?: boolean;
        paymentUrl?: string | null;
        razorpay?: { keyId: string; orderId: string; amount: number; currency: string } | null;
        orderId?: number;
        orderKey?: string;
      };
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `The server could not process your order right now (error ${res.status}). No payment was taken — please try again in a minute.`,
        );
      }

      if (!res.ok || !data.success) {
        const reason = data.error || (data.messages && data.messages[0]) || "Order creation failed.";
        throw new Error(data.details ? `${reason} (${data.details})` : reason);
      }

      // Razorpay: pay in the popup on this page, then confirm with the server.
      if (data.razorpay && data.orderId && data.orderKey) {
        const result = await payWithRazorpay({
          ...data.razorpay,
          name: "Graha Kavach",
          description: `Order #${data.orderId}`,
          prefill: {
            name: `${parsedAddress.data.firstName} ${parsedAddress.data.lastName}`,
            email: parsedAddress.data.email,
            contact: parsedAddress.data.phone,
          },
        });

        if (result.status === "dismissed") {
          throw new Error("Payment was cancelled. Your booking is unconfirmed. Press Pay to try again.");
        }
        if (result.status === "failed") {
          throw new Error(`${result.message} Please try again or choose Cash on Delivery.`);
        }

        const confirmRes = await fetch("/api/checkout/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wooOrderId: data.orderId,
            orderKey: data.orderKey,
            ...result.payment,
          }),
        });
        if (!confirmRes.ok) {
          throw new Error(
            "Your payment went through but we could not confirm it yet. Please do not pay again — contact support with order #" +
              data.orderId +
              ".",
          );
        }

        clearCart();
        router.push(`/order-confirmation?orderId=${data.orderId}&key=${data.orderKey}`);
        return;
      }

      // Fallback when Razorpay keys are not set on the server: hand over to the payment page. The cart is
      // kept until the confirmation page sees a paid order.
      if (data.isOnline && data.paymentUrl) {
        window.location.assign(data.paymentUrl);
        return;
      }

      clearCart();
      router.push(`/order-confirmation?orderId=${data.orderId}&key=${data.orderKey}`);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
      setSubmitting(false);
      window.scrollTo({ top: 100, behavior: "smooth" });
    }
  };

  const isCod = isCodMethod(selectedPaymentMethod);
  const totalMinor = validatedCart?.totalMinor ?? 0;
  // COD takes an advance online; the rest is paid on delivery. The total does not change.
  const advanceMinor = isCod ? computeAdvanceMinor(codAdvance, totalMinor) : 0;
  const currency = validatedCart?.currency ?? "INR";
  const dueNowMinor = advanceMinor > 0 ? advanceMinor : totalMinor;

  if (!isReady || loading) {
    return (
      <main className="min-h-screen bg-stone-50/50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
            <div className="h-96 animate-pulse rounded-2xl bg-white p-6" />
            <div className="h-96 animate-pulse rounded-2xl bg-white p-6" />
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-stone-50/50 py-16">
        <div className="mx-auto max-w-md px-6 text-center">
          <h1 className="text-2xl font-medium text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please add fire safety equipment to your cart before proceeding to checkout.
          </p>
          <div className="mt-6">
            <Link
              href="/fire-safety-kit"
              className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-xs hover:bg-primary/90"
            >
              Browse Equipment
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-50/50 py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Breadcrumb */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-foreground">
            Cart
          </Link>
          <span>/</span>
          <span className="text-foreground">Checkout</span>
        </div>

        <h1 className="text-2xl font-medium sm:text-3xl tracking-tight text-foreground lg:text-4xl">
          Complete Your Order
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Safe dispatch directly from Udaipur manufacturing warehouse
        </p>

        {generalError ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger">
            <svg
              className="mt-0.5 size-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-semibold">Unable to place order</p>
              <p className="mt-0.5">{generalError}</p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handlePlaceOrder} className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
          {/* Left Column: Delivery Address & Payment Selection */}
          <div className="min-w-0 space-y-6 sm:space-y-8">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-xs sm:p-6 lg:p-8">
              <AddressForm
                address={address}
                onChange={handleAddressChange}
                errors={formErrors}
                disabled={submitting}
              />
            </div>

            <div className="rounded-2xl border border-border bg-white p-4 shadow-xs sm:p-6 lg:p-8">
              <h3 className="text-lg font-medium text-foreground">
                3. Payment Method
              </h3>
              <p className="text-xs text-muted-foreground">
                All transactions are logged securely with verified invoices.
              </p>

              <div className="mt-4">
                <PaymentSelector
                  methods={paymentMethods}
                  codAdvanceMinor={computeAdvanceMinor(codAdvance, totalMinor)}
                  totalMinor={totalMinor}
                  selectedMethod={selectedPaymentMethod}
                  onSelectMethod={setSelectedPaymentMethod}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Submit */}
          <div className="min-w-0 space-y-6 lg:sticky lg:top-24">
            {validatedCart ? (
              <CheckoutReview cart={validatedCart} advanceMinor={advanceMinor} />
            ) : (
              <div className="h-64 animate-pulse rounded-2xl bg-white" />
            )}

            <div className="rounded-2xl border border-border bg-white p-4 shadow-xs sm:p-6">
              <button
                type="submit"
                disabled={submitting || paymentMethods.length === 0 || validatedCart?.hasErrors}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-center text-base font-semibold text-white shadow-md transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {submitting ? (
                  <>
                    <svg
                      className="size-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>{isCod && advanceMinor === 0 ? "Placing your order..." : "Opening secure payment..."}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isCod && advanceMinor === 0
                        ? `Place COD Order · ${formatMinorUnitsToCurrency(totalMinor, currency)}`
                        : isCod
                          ? `Pay ${formatMinorUnitsToCurrency(advanceMinor, currency)} & Place COD Order`
                          : `Pay Securely · ${formatMinorUnitsToCurrency(dueNowMinor, currency)}`}
                    </span>
                    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                By placing order, you agree to Graha Kavach terms & verified safety policies.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
