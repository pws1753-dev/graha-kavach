"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CodBookingNote } from "@/components/commerce/cod-booking-note";
import { PurchasePanel } from "@/components/commerce/purchase-panel";
import { StockStatus } from "@/components/commerce/stock-status";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/ui/icons";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { formatMinorUnitsToCurrency } from "@/lib/woocommerce/adapters";
import { Clock, Flame, Headphones, Minus, Plus, ShieldCheck } from "lucide-react";
import type { CodAdvanceConfig } from "@/lib/config/checkout";
import type { Media, ProductSummary } from "@/types";

/* ------------------------------------------------------------------ */
/* Section 7 — the buy section                                         */
/* ------------------------------------------------------------------ */

type BuyProps = {
  product: ProductSummary;
  stockQuantity: number | null;
  gallery: Media[];
  features: string[];
  unavailable: boolean;
  unpublished: boolean;
  codAdvance?: CodAdvanceConfig | null;
};

/**
 * The transaction, in the middle of the page.
 *
 * Price, sale price and stock are WooCommerce values passed straight through.
 * The sale price is only marked as a reduction when the regular price is
 * genuinely higher — there is no permanent "was" figure here.
 */
export function BuySection({
  product,
  stockQuantity,
  gallery,
  features,
  unavailable,
  unpublished,
  codAdvance,
}: BuyProps) {
  const onSale =
    typeof product.regularPriceMinor === "number" &&
    typeof product.priceMinor === "number" &&
    product.regularPriceMinor > product.priceMinor;

  const savingMinor =
    onSale && product.regularPriceMinor && product.priceMinor
      ? product.regularPriceMinor - product.priceMinor
      : 0;

  const main = gallery[0] ?? product.image;

  return (
    <section id="buy" className="bg-background-subtle py-10 lg:py-14">
      <Container width="wide">
        <div className="grid gap-8 rounded-[8px] border border-border bg-white p-4 shadow-xl shadow-red-950/5 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:p-8">
          <div>
            <div className="overflow-hidden rounded-[8px] bg-white">
              {main?.url ? (
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={main.url}
                    alt={main.alt || product.name}
                    fill
                    sizes="(max-width: 1023px) 92vw, 50vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <MediaPlaceholder label="Product Image" aspect="4/3" />
              )}
            </div>
          </div>

          <div className="lg:py-4">
            <p className="gk-text-gradient text-xs font-medium tracking-[0.18em] uppercase">
              Get protected
            </p>
            <h2 className="mt-4 text-3xl leading-[1.15] font-medium tracking-[-0.02em] text-balance text-foreground lg:text-[40px]">
              {product.name}
            </h2>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-3xl font-medium text-foreground">
                {formatMinorUnitsToCurrency(product.priceMinor, product.currency)}
              </span>
              {onSale ? (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatMinorUnitsToCurrency(product.regularPriceMinor, product.currency)}
                  </span>
                  <span className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-medium text-primary">
                    Save {formatMinorUnitsToCurrency(savingMinor, product.currency)}
                  </span>
                </>
              ) : null}
            </div>

            <CodBookingNote
              className="mt-4"
              priceMinor={product.priceMinor}
              currency={product.currency}
              config={codAdvance}
            />

            <div className="mt-3">
              <StockStatus status={product.stockStatus} quantity={stockQuantity} />
            </div>

            {features.length > 0 ? (
              <ul className="mt-6 grid gap-2.5 rounded-[8px] border border-border bg-background-subtle p-4">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted"
                  >
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : null}

            {unpublished ? (
              <p className="mt-6 rounded-[var(--radius)] border border-warning/30 bg-warning-subtle px-4 py-3 text-sm leading-6 text-warning">
                This product is not currently published in the store, so it cannot be ordered.
              </p>
            ) : null}

            <PurchasePanel
              className="mt-7"
              productId={product.id}
              productName={product.name}
              unitPriceMinor={product.priceMinor ?? undefined}
              disabled={unavailable}
              maxQuantity={stockQuantity}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 12 — FAQ                                                    */
/* ------------------------------------------------------------------ */

export type FaqItem = { id: string | number; title: string; answer: string };

const FALLBACK_10_FAQS: FaqItem[] = [
  {
    id: "1",
    title: "What is inside the Graha Kavach kit?",
    answer:
      "The complete kit includes 1 ABC dry powder fire extinguisher (2 KG capacity) with heavy-duty wall bracket, 1 automatic fire extinguishing ball with metal cradle stand, 1 certified fiberglass fire blanket (1.2m x 1.8m) in a quick-release emergency pouch, plus all necessary mounting hardware, wall plugs, and a comprehensive user safety guide.",
  },
  {
    id: "2",
    title: "When should I use this kit?",
    answer:
      "Use it at the earliest sign of flame or smoke. The fire blanket is specifically designed for kitchen cooking-oil or pan fires. The ABC extinguisher handles electrical short circuits, gas cylinder leaks, and solid material fires. The automatic fire ball works 24/7 passively even when nobody is present.",
  },
  {
    id: "3",
    title: "What is the extinguisher capacity?",
    answer:
      "The extinguisher holds 2 Kilograms of premium stored-pressure ABC dry chemical powder, engineered to deliver 10–12 seconds of strong continuous discharge with an effective 3–4 metre throw to knock down flames safely.",
  },
  {
    id: "4",
    title: "How does the fire ball work?",
    answer:
      "The automatic fire ball activates within 3 to 5 seconds upon direct contact with flame (reaching 70°C). It bursts with a harmless, distinct 120dB warning sound and instantly disperses non-toxic extinguishing chemical powder over an area of up to 3 square metres.",
  },
  {
    id: "5",
    title: "Where should I place the fire blanket?",
    answer:
      "Mount the fire blanket in or right beside the kitchen, near the cooking stove at an easily reachable eye-level height, but not directly over the gas burner where flames could prevent reaching it. Also recommended near inverter batteries or workshops.",
  },
  {
    id: "6",
    title: "Can I use water on an oil or grease fire?",
    answer:
      "NEVER throw water on a cooking oil, grease, or electrical fire! Water sinks under the burning oil, vaporizes explosively, and creates a violent flare-up fireball. Always pull the Graha Kavach Fire Blanket to cover and smother the pan, cutting off oxygen, or discharge the ABC extinguisher.",
  },
  {
    id: "7",
    title: "Does the kit replace the fire service?",
    answer:
      "No home kit replaces professional fire services. Graha Kavach is your vital first line of defense to extinguish or control small fires before they spread. In any serious situation, immediately evacuate all family members and dial 101 or 112.",
  },
  {
    id: "8",
    title: "How often should I check the kit?",
    answer:
      "Check the pressure gauge on the extinguisher once a month to ensure the needle points in the green operational zone. Visually inspect the fire ball stand and fire blanket pull tabs every six months to verify they remain free of obstruction.",
  },
  {
    id: "9",
    title: "Can the fire blanket be reused?",
    answer:
      "No. Fire blankets are intended for single emergency use. High-temperature flame exposure damages the microscopic fiberglass weave. After using a blanket on an active fire, discard it safely and replace it with a fresh unit.",
  },
  {
    id: "10",
    title: "What number should I call in a fire emergency?",
    answer:
      "In India, immediately dial 101 for the Fire Department or 112 for the unified National Emergency Support Services.",
  },
];

export function FaqSection({
  title: _title,
  items,
}: {
  title?: string;
  items?: FaqItem[];
}) {
  void _title;
  // Use CMS items if available, combined/filled up to 10 from the reference FAQs
  const displayFaqs =
    items && items.length >= 8
      ? items
      : items && items.length > 0
        ? [...items, ...FALLBACK_10_FAQS.slice(items.length)]
        : FALLBACK_10_FAQS;

  // First question open by default.
  const [openId, setOpenId] = useState<string>("1");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? "" : id));
  };

  return (
    <section id="faq" className="relative bg-[#faf8f5] py-10 lg:py-14 border-b border-[#ede7df]">
      <Container width="wide">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 items-start">
          {/* Left Column: Heading + Info + Help Card */}
          <div className="lg:sticky lg:top-[calc(var(--gk-header-h)+2rem)] lg:self-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-50/80 px-3.5 py-1 text-xs font-semibold tracking-wider text-orange-600 uppercase">
              <ShieldIcon className="size-3.5 text-orange-500" />
              FAQ
            </span>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[44px] leading-[1.14] font-bold tracking-tight text-foreground">
              Fire safety kit{" "}
              <span className="text-[#ea580c]">questions</span>
            </h2>

            <p className="mt-3.5 max-w-md text-sm sm:text-base leading-relaxed text-foreground-muted">
              Straight answers before checkout. Our FAQs cover everything you need to know, so you can buy with confidence.
            </p>

            {/* Dark "Still unsure?" Support Card */}
            <div className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-[#1c1d1f] p-5 sm:p-6 text-white shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-br from-[#dc2626] to-[#ea580c] flex items-center justify-center shrink-0 shadow-md">
                  <Flame className="size-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-white leading-tight">Still unsure?</p>
                  <p className="mt-0.5 text-xs sm:text-sm text-zinc-400">Ask before you mount.</p>
                </div>
              </div>

              <Link
                href="/contact"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold py-3 text-sm sm:text-base shadow-lg shadow-orange-600/25 transition-colors"
              >
                Contact Support
                <ArrowRightIcon className="size-4" />
              </Link>

              {/* Bottom Trust Items Strip */}
              <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-zinc-400">
                <div className="flex items-center justify-center gap-1.5">
                  <Headphones className="size-3.5 text-zinc-400 shrink-0" />
                  <span>Friendly team</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 border-x border-white/10 px-1">
                  <ShieldCheck className="size-3.5 text-zinc-400 shrink-0" />
                  <span>Expert advice</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="size-3.5 text-zinc-400 shrink-0" />
                  <span>Quick replies</span>
                </div>
              </div>
            </div>

            {/* Bottom-left Decorative Watermark */}
            <div className="mt-8 hidden lg:block text-left select-none opacity-40">
              <span className="block h-0.5 w-8 bg-zinc-400 mb-2" />
              <p className="text-[11px] font-bold tracking-[0.18em] text-zinc-400 uppercase leading-relaxed">
                SAFER HOMES
                <br />
                BRIGHTER TOMORROWS
              </p>
            </div>
          </div>

          {/* Right Column: 10 Accordion Cards */}
          <div className="space-y-3">
            {displayFaqs.map((faq, index) => {
              const numStr = String(index + 1).padStart(2, "0");
              const itemId = String(faq.id || index + 1);
              const isOpen = openId === itemId || openId === numStr;
              const isHighlight = faq.title.toLowerCase().includes("water");

              return (
                <div
                  key={itemId}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "border-red-200 bg-[#fff5f5] shadow-sm ring-1 ring-red-100"
                      : "border-[#ede7df] bg-white hover:border-orange-200 shadow-sm"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(numStr)}
                    className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left select-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <span
                        className={`size-7 sm:size-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                          isOpen
                            ? "bg-red-100 text-red-600"
                            : isHighlight
                              ? "bg-red-100 text-red-600"
                              : "bg-orange-50 text-[#ea580c]"
                        }`}
                      >
                        {numStr}
                      </span>
                      <span
                        className={`text-sm sm:text-base font-semibold leading-snug ${
                          isOpen
                            ? "text-[#dc2626]"
                            : isHighlight
                              ? "text-[#dc2626]"
                              : "text-foreground"
                        }`}
                      >
                        {faq.title}
                      </span>
                    </div>

                    <span
                      className={`size-6 sm:size-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? "bg-red-100 text-red-600"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="size-3.5 stroke-[2.5]" />
                      ) : (
                        <Plus className="size-3.5 stroke-[2.5]" />
                      )}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
                      <div className="pl-10 sm:pl-12 text-xs sm:text-sm leading-relaxed text-zinc-700">
                        {faq.answer.startsWith("<") ? (
                          <span dangerouslySetInnerHTML={{ __html: faq.answer }} />
                        ) : (
                          faq.answer
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 13 — closing call to action                                 */
/* ------------------------------------------------------------------ */

export function FinalCta({
  product,
  unavailable,
  codAdvance,
}: {
  image?: Media | null;
  product: ProductSummary;
  unavailable?: boolean;
  codAdvance?: CodAdvanceConfig | null;
}) {
  return (
    <section className="relative w-full overflow-hidden bg-[#070607] text-white">
      {/* Mobile background (1122x1402) - Strictly NO overlay per user instruction */}
      <div className="absolute inset-0 md:hidden pointer-events-none select-none">
        <Image
          src="/cta/cta-mobile.png"
          alt="Graha Kavach Fire Safety Kit"
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      {/* Desktop background (1600x686) - Strictly NO overlay per user instruction */}
      <div className="absolute inset-0 hidden md:block pointer-events-none select-none">
        <Image
          src="/cta/cta-desktop.png"
          alt="Graha Kavach Fire Safety Kit"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right xl:object-center"
        />
      </div>

      {/* Content container */}
      <Container width="wide" className="relative z-10">
        {/* Mobile View (< md): Text and Button on TOP of the image */}
        <div className="flex flex-col items-start justify-start pt-7 pb-[300px] xs:pt-8 xs:pb-[340px] sm:pt-10 sm:pb-[380px] md:hidden">
          <div className="w-full max-w-sm text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/70 px-3 py-1 text-[11px] font-semibold tracking-wider text-red-200 uppercase">
              <ShieldIcon className="size-3 text-primary" />
              Complete Fire Safety Kit
            </span>

            <h2 className="mt-2.5 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl text-balance">
              The day you need it is not the day to buy it.
            </h2>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-white/85 max-w-xs">
              One kit, mounted where you can reach it — covering every critical second before fire spreads.
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              {product?.priceMinor ? (
                <span className="text-2xl font-bold tracking-tight text-white">
                  {formatMinorUnitsToCurrency(product.priceMinor, product.currency)}
                </span>
              ) : null}
              <Button
                href="/fire-safety-kit"
                size="md"
                className="bg-primary hover:bg-primary-hover text-white font-medium px-5 py-2 text-xs sm:text-sm shadow-md shadow-red-950/50"
                aria-disabled={unavailable ? true : undefined}
              >
                {unavailable ? "View Product" : "Get Graha Kavach"}
                <ArrowRightIcon className="size-3.5 ml-1" />
              </Button>
            </div>
            <CodBookingNote
              className="mt-3 !px-2.5 !py-1.5 !text-xs"
              tone="dark"
              priceMinor={product?.priceMinor}
              currency={product?.currency}
              config={codAdvance}
            />
          </div>
        </div>

        {/* Desktop View (>= md): Text and Button on LEFT side */}
        <div className="hidden md:flex flex-col items-start justify-center md:py-20 lg:py-28 md:min-h-[540px] lg:min-h-[600px] xl:min-h-[660px]">
          <div className="w-full max-w-lg lg:max-w-xl text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/60 px-3.5 py-1 text-xs font-semibold tracking-wider text-red-200 uppercase">
              <ShieldIcon className="size-3.5 text-primary" />
              Complete Home Fire Protection
            </span>

            {/* The mobile layout above carries the H2; a second one made the heading appear twice. */}
            <p className="mt-3.5 text-3xl leading-[1.12] font-semibold tracking-[-0.025em] text-white sm:text-4xl lg:text-[46px] text-balance">
              The day you need it is not the day to buy it.
            </p>

            <p className="mt-3.5 text-base lg:text-lg leading-relaxed text-white/80 max-w-md lg:max-w-lg">
              One kit, mounted where you can reach it — covering every critical second before a small fire becomes uncontrollable.
            </p>

            {product?.priceMinor ? (
              <div className="mt-5 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  {formatMinorUnitsToCurrency(product.priceMinor, product.currency)}
                </span>
                {product.regularPriceMinor && product.regularPriceMinor > product.priceMinor ? (
                  <>
                    <span className="text-lg text-white/45 line-through">
                      {formatMinorUnitsToCurrency(product.regularPriceMinor, product.currency)}
                    </span>
                    <span className="rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Special Offer
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}

            <CodBookingNote
              className="mt-3"
              tone="dark"
              priceMinor={product?.priceMinor}
              currency={product?.currency}
              config={codAdvance}
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                href="/fire-safety-kit"
                size="lg"
                className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 text-base shadow-lg shadow-red-950/50"
                aria-disabled={unavailable ? true : undefined}
              >
                {unavailable ? "View Product" : "Get Graha Kavach"}
                <ArrowRightIcon className="size-4 ml-1" />
              </Button>
              <Button
                href="/contact"
                variant="secondary"
                size="lg"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white text-base"
              >
                Ask a Question
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/70">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="size-3.5 text-primary" />
                5-Year Shelf Life
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="size-3.5 text-primary" />
                Free India Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="size-3.5 text-primary" />
                Cash on Delivery
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
