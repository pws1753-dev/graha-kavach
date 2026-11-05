import { CreditCard, Landmark } from "lucide-react";
import { PaymentLogo, type PaymentLogoId } from "@/components/commerce/payment-logos";
import { cn } from "@/lib/utils/cn";

const LOGO_IDS: PaymentLogoId[] = ["upi", "gpay", "phonepe", "visa", "mastercard", "rupay"];

const pill =
  "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs";

/**
 * Accepted payment methods with the real logos.
 *
 * `stacked` puts the logos on their own line under the heading, wrapping onto more
 * lines when needed. Use it in a narrow column (the product page); the default sits
 * the logos beside the heading, for a full-width bar (the footer).
 */
export function SecurePaymentStrip({ className, stacked = false }: { className?: string; stacked?: boolean }) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-gray-200/90 bg-white/95 px-3 py-3 shadow-xs backdrop-blur-xs sm:px-4",
        className,
      )}
    >
      <div className={cn("flex w-full flex-col gap-3", !stacked && "lg:flex-row lg:items-center lg:justify-between")}>
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#fff0ed] text-[#e63920] sm:size-9">
            <CreditCard className="size-4 sm:size-[18px]" />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight tracking-tight text-gray-900 sm:text-sm">Secure payment options</p>
            <p className="mt-0.5 text-[10px] leading-normal text-gray-500 sm:text-[11px]">
              Pay safely through supported Indian payment methods at checkout.
            </p>
          </div>
        </div>

        {/* Wraps instead of scrolling, so no method is ever hidden. */}
        <div className={cn("flex flex-wrap items-center gap-1.5", !stacked && "lg:justify-end")}>
          {LOGO_IDS.map((id) => (
            <PaymentLogo key={id} id={id} height={20} />
          ))}
          <span className={pill}>
            <Landmark className="size-3.5 text-[#0066B2]" aria-hidden />
            NetBanking
          </span>
          <span className={pill}>
            <span className="font-bold text-gray-900">₹</span>
            COD
          </span>
        </div>
      </div>
    </div>
  );
}
