"use client";

import { PaymentLogos, CARD_LOGOS, UPI_LOGOS } from "@/components/commerce/payment-logos";
import { isCodMethod } from "@/lib/config/checkout";
import type { PaymentMethodInfo } from "@/lib/woocommerce/payment-gateways";

type PaymentSelectorProps = {
  methods: PaymentMethodInfo[];
  selectedMethod: string;
  onSelectMethod: (id: string) => void;
  /** Advance taken online on COD orders, in paise. 0 when COD is plain pay-on-delivery. */
  codAdvanceMinor?: number;
  /** Order total in paise, used to word the COD advance message. */
  totalMinor?: number;
  disabled?: boolean;
};

export function PaymentSelector({
  methods,
  selectedMethod,
  onSelectMethod,
  codAdvanceMinor = 0,
  totalMinor = 0,
  disabled = false,
}: PaymentSelectorProps) {
  if (methods.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <svg className="size-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Payment Gateways Pending Setup
        </div>
        <p className="mt-1.5 text-xs text-amber-800">
          No payment gateways are currently activated on the WooCommerce store. Please enable Cash on Delivery (COD) or configure an online gateway in WooCommerce settings to accept orders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const isSelected = selectedMethod === method.id;

        return (
          <label
            key={method.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 sm:gap-4 sm:p-4.5 transition-all ${
              isSelected
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-border bg-white hover:border-stone-400"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={isSelected}
              onChange={() => onSelectMethod(method.id)}
              disabled={disabled}
              className="mt-1 size-4.5 text-primary accent-[var(--primary)]"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="font-medium text-foreground">
                  {method.title}
                </span>

                {isCodMethod(method.id) ? (
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-stone-700">
                    {codAdvanceMinor > 0 ? `Pay ₹${codAdvanceMinor / 100} now` : "Pay on Delivery"}
                  </span>
                ) : (
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Online
                  </span>
                )}
              </div>

              <p className="mt-1 break-words text-sm text-muted-foreground">
                {method.description ||
                  (method.id === "cod"
                    ? codAdvanceMinor > 0
                      ? `Pay ₹${codAdvanceMinor / 100} to confirm your order worth ₹${totalMinor / 100}. Pay the remaining ₹${Math.max(0, totalMinor - codAdvanceMinor) / 100} on delivery.`
                      : "Pay securely in cash or via UPI QR code upon doorstep delivery."
                    : "Secure instant payment via certified payment gateway.")}
              </p>

              {!isCodMethod(method.id) ? (
                <PaymentLogos ids={[...UPI_LOGOS, ...CARD_LOGOS]} height={16} className="mt-2.5" />
              ) : null}
            </div>
          </label>
        );
      })}
    </div>
  );
}
