"use client";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Retry only the confirmation of an existing payment; never open or charge again. */
export async function confirmRazorpayPayment(input: RazorpaySuccess & { wooOrderId: number; orderKey: string }): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch("/api/checkout/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(10_000),
      });
      const result = await response.json().catch(() => ({})) as { success?: boolean; code?: string };
      if (response.ok && result.success === true) return true;
      if (response.status < 500 && result.code !== "payment_pending_capture") return false;
    } catch {
      // A lost response can follow a successful write. Retrying is idempotent.
    }
    if (attempt < 4) await new Promise((resolve) => window.setTimeout(resolve, (attempt + 1) * 750));
  }
  return false;
}

let scriptPromise: Promise<void> | null = null;

function loadScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay needs a browser."));
  if (window.Razorpay) return Promise.resolve();

  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    const fail = () => {
      window.clearTimeout(timer);
      script.remove();
      scriptPromise = null;
      reject(new Error("Could not load the secure payment window. Check your connection and try again."));
    };
    const timer = window.setTimeout(fail, 15_000);
    script.onload = () => {
      if (!window.Razorpay) { fail(); return; }
      window.clearTimeout(timer);
      resolve();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export type RazorpayResult =
  | { status: "paid"; payment: RazorpaySuccess }
  | { status: "dismissed" }
  | { status: "failed"; message: string };

type PayInput = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: Partial<{ name: string; email: string; contact: string; method: string }>;
  one_click_checkout?: boolean;
};

/** Opens the Razorpay popup and resolves once the customer pays, closes it, or the payment fails. */
export async function payWithRazorpay(input: PayInput): Promise<RazorpayResult> {
  await loadScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Secure payment window is unavailable.");

  return new Promise<RazorpayResult>((resolve) => {
    let lastFailure = "";
    const options: Record<string, unknown> = {
      key: input.keyId,
      order_id: input.orderId,
      amount: input.amount,
      currency: input.currency,
      name: input.name || "Graha Kavach",
      description: input.description || "Fire Safety Order",
      theme: { color: "#E01820" },
      one_click_checkout: input.one_click_checkout ?? false,
      handler: (payment: RazorpaySuccess) => resolve({ status: "paid", payment }),
      modal: {
        ondismiss: () => resolve(lastFailure ? { status: "failed", message: lastFailure } : { status: "dismissed" }),
        backdropclose: false,
        escape: true,
      },
    };

    if (input.prefill) {
      options.prefill = input.prefill;
    }

    const instance = new Razorpay(options);

    // Razorpay permits a retry inside the same popup. Do not settle the promise
    // on its first failure: that would discard a later successful payment.
    instance.on("payment.failed", (response) => {
      lastFailure = response.error?.description || "The payment could not be completed.";
    });

    instance.open();
  });
}
