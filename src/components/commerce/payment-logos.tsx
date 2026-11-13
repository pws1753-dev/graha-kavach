import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * The real brand logos, as files in /public/payment-icons (UPI, PhonePe and Google Pay
 * from the brands' own artwork, Visa, Mastercard and RuPay from their official marks).
 * `ratio` is width / height of each file, so a logo never stretches.
 */
const LOGOS = {
  upi: { src: "/payment-icons/upi.svg", alt: "UPI", ratio: 130.54 / 46.118 },
  phonepe: { src: "/payment-icons/phonepe.svg", alt: "PhonePe", ratio: 230 / 69.746 },
  gpay: { src: "/payment-icons/gpay.svg", alt: "Google Pay", ratio: 64 / 24 },
  visa: { src: "/payment-icons/visa.svg", alt: "Visa", ratio: 1000.046 / 323.653 },
  mastercard: { src: "/payment-icons/mastercard.svg", alt: "Mastercard", ratio: 999.2 / 776 },
  rupay: { src: "/payment-icons/rupay.png", alt: "RuPay", ratio: 360 / 93 },
} as const;

export type PaymentLogoId = keyof typeof LOGOS;

export const UPI_LOGOS: PaymentLogoId[] = ["upi", "gpay", "phonepe"];
export const CARD_LOGOS: PaymentLogoId[] = ["visa", "mastercard", "rupay"];

/** One logo in a small white tile. `height` is the logo's height in px. */
export function PaymentLogo({ id, height = 20, className }: { id: PaymentLogoId; height?: number; className?: string }) {
  const logo = LOGOS[id];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 shadow-2xs",
        className,
      )}
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={Math.round(height * logo.ratio)}
        height={height}
        unoptimized={logo.src.endsWith(".svg")}
        style={{ height, width: "auto" }}
      />
    </span>
  );
}

export function PaymentLogos({
  ids,
  height = 20,
  className,
}: {
  ids: PaymentLogoId[];
  height?: number;
  className?: string;
}) {
  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {ids.map((id) => (
        <PaymentLogo key={id} id={id} height={height} />
      ))}
    </span>
  );
}
