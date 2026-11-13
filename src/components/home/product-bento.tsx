"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Flame,
  Hand,
  Home,
  Shield,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { Media } from "@/types";

export type BentoItem = {
  name: string;
  role: string;
  description: string;
  image: Media | null;
  placeholderLabel: string;
};

export function ProductBento(_props?: {
  heroImage?: Media | null;
  items?: BentoItem[];
  pieceCount?: number;
  [key: string]: unknown;
}) {
  void _props;
  return (
    <section className="bg-[#faf8f5] py-10 lg:py-14 border-b border-[#ede7df]">
      <Container width="wide">
        {/* Top Eyebrow & Header with 3 Quick Role Cards */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-[0.2em] text-[#dc2626] uppercase">
                The Protection System
              </span>
              <span className="h-0.5 w-6 bg-[#dc2626]" />
            </div>

            <h2 className="mt-3.5 text-3xl leading-[1.12] font-bold tracking-tight text-foreground sm:text-4xl lg:text-[44px]">
              Three products.
              <br />
              <span className="text-[#dc2626]">One home fire protection system.</span>
            </h2>

            <p className="mt-3.5 max-w-xl text-sm sm:text-base leading-relaxed text-foreground-muted">
              Built like a layered safety wardrobe for the home: one piece you use by hand, one that
              waits near the risk, and one that smothers kitchen flames. Together they make the fire
              extinguisher for home use that covers more than one kind of fire.
            </p>
          </div>

          {/* 3 Role Cards in horizontal row on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#ede7df] bg-white p-4 shadow-sm flex flex-col justify-between">
              <div className="size-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2.5">
                <Hand className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Manual action</p>
                <p className="text-xs font-medium text-foreground-muted mt-0.5">Extinguisher</p>
                <p className="text-[11px] text-foreground-muted/80 mt-0.5">You aim. You control.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#ede7df] bg-white p-4 shadow-sm flex flex-col justify-between">
              <div className="size-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2.5">
                <Flame className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Auto response</p>
                <p className="text-xs font-medium text-foreground-muted mt-0.5">Fire ball</p>
                <p className="text-[11px] text-foreground-muted/80 mt-0.5">Activates on its own.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#ede7df] bg-white p-4 shadow-sm flex flex-col justify-between">
              <div className="size-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2.5">
                <UtensilsCrossed className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Kitchen control</p>
                <p className="text-xs font-medium text-foreground-muted mt-0.5">Fire blanket</p>
                <p className="text-[11px] text-foreground-muted/80 mt-0.5">Smothers flames fast.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Bento Grid: Left Large Card + Right Stacked Cards */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 items-stretch">
          {/* Left Big Card with products background (using mobile-section-img for desktop as well to prevent cropping) */}
          <div className="relative rounded-3xl overflow-hidden border border-[#ede7df] bg-[#f8f6f2] shadow-sm flex flex-col justify-between p-6 sm:p-9 lg:p-10 sm:min-h-[560px] lg:min-h-[620px]">
            {/* Background Image: mobile-section-img.png (1254x1254) anchored to right-bottom so products are fully visible */}
            <div className="absolute inset-0 hidden sm:block pointer-events-none select-none">
              <Image
                src="/protection-system/mobile-section-img.png"
                alt="Graha Kavach Fire Safety Kit"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-right-bottom sm:object-right"
              />
            </div>

            {/* Top Right Script Text */}
            <span
              className="absolute hidden sm:block top-5 right-6 sm:top-6 sm:right-8 text-base sm:text-2xl font-serif italic text-zinc-500/80 pointer-events-none select-none z-10"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Safety lives here
            </span>

            {/* Left Content Area */}
            <div className="relative z-10 max-w-[250px] xs:max-w-[280px] sm:max-w-xs text-left">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#dc2626] uppercase">
                A Safer Home Starts Here
              </span>

              <h3 className="mt-2 sm:mt-2.5 text-2xl xs:text-3xl lg:text-4xl font-bold tracking-tight text-[#111827] leading-[1.12]">
                Be ready for the unexpected.
              </h3>

              <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
                Three trusted solutions. One complete home fire-safety kit.
              </p>

              <Link
                href="/fire-safety-kit"
                className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md transition-colors"
              >
                View full kit
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>

            {/* Phones: the artwork gets its own block so no text is drawn over the products */}
            <div className="relative -mx-6 mt-5 aspect-square sm:hidden">
              <Image
                src="/protection-system/mobile-section-img.png"
                alt="Graha Kavach Fire Safety Kit"
                fill
                sizes="100vw"
                className="object-cover object-bottom"
              />
            </div>

            {/* Bottom Trust Icons Strip */}
            <div className="relative z-10 mt-5 sm:mt-auto sm:pt-6 flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-[11px] sm:text-xs font-semibold text-zinc-800">
              <div className="flex items-center gap-1.5">
                <Shield className="size-3.5 sm:size-4 text-[#dc2626]" />
                <span>Trusted Protection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Home className="size-3.5 sm:size-4 text-[#dc2626]" />
                <span>Safer Homes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 sm:size-4 text-[#dc2626]" />
                <span>Peace of Mind</span>
              </div>
            </div>
          </div>

          {/* Right Column: 6 Pieces Box Card + 3 Product Items */}
          <div className="flex flex-col gap-4 justify-between">
            {/* Top Red Card: 6 PIECES IN THE BOX - Exact 1448/1086 aspect ratio to avoid any bottom crop */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm aspect-[1448/1086] w-full border border-red-800/10 shrink-0 bg-[#e01925]">
              <Image
                src="/protection-system/asset-3.png"
                alt="6 Pieces In The Box"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-contain sm:object-cover"
              />
            </div>

            {/* Product Card 1: ABC Dry Powder Extinguisher */}
            <Link
              href="/fire-safety-kit"
              className="group rounded-2xl border border-[#ede7df] bg-white p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
            >
              <div className="relative size-16 sm:size-18 shrink-0 rounded-xl bg-zinc-50 border border-zinc-100 p-1 flex items-center justify-center">
                <Image
                  src="/protection-system/asset-4.png"
                  alt="ABC Dry Powder Fire Extinguisher"
                  fill
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                  sizes="80px"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold tracking-wider text-[#dc2626] uppercase">
                  MANUAL ACTION
                </span>
                <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug truncate">
                  ABC Dry Powder Fire Extinguisher
                </h4>
                <p className="text-xs text-foreground-muted line-clamp-2 mt-0.5 leading-relaxed">
                  Roughly 10–12 seconds of discharge with a 3–4 metre throw.
                </p>
              </div>

              <span className="size-8 sm:size-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-[#dc2626] group-hover:text-white transition-colors">
                <ChevronRight className="size-4" />
              </span>
            </Link>

            {/* Product Card 2: Automatic Fire Ball */}
            <Link
              href="/fire-safety-kit"
              className="group rounded-2xl border border-[#ede7df] bg-white p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
            >
              <div className="relative size-16 sm:size-18 shrink-0 rounded-xl bg-zinc-50 border border-zinc-100 p-1 flex items-center justify-center">
                <Image
                  src="/protection-system/asset-6.png"
                  alt="Automatic Fire Ball"
                  fill
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                  sizes="80px"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold tracking-wider text-[#dc2626] uppercase">
                  AUTOMATIC RESPONSE
                </span>
                <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug truncate">
                  Automatic Fire Ball
                </h4>
                <p className="text-xs text-foreground-muted line-clamp-2 mt-0.5 leading-relaxed">
                  It acts on its own. Placed near a risk point, it discharges on contact with flame.
                </p>
              </div>

              <span className="size-8 sm:size-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-[#dc2626] group-hover:text-white transition-colors">
                <ChevronRight className="size-4" />
              </span>
            </Link>

            {/* Product Card 3: Fire Blanket */}
            <Link
              href="/fire-safety-kit"
              className="group rounded-2xl border border-[#ede7df] bg-white p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
            >
              <div className="relative size-16 sm:size-18 shrink-0 rounded-xl bg-zinc-50 border border-zinc-100 p-1 flex items-center justify-center">
                <Image
                  src="/protection-system/asset-5.png"
                  alt="Fire Blanket"
                  fill
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                  sizes="80px"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold tracking-wider text-[#dc2626] uppercase">
                  KITCHEN CONTROL
                </span>
                <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug truncate">
                  Fire Blanket
                </h4>
                <p className="text-xs text-foreground-muted line-clamp-2 mt-0.5 leading-relaxed">
                  You cover with it. Cuts off the air supply, which is what a cooking-oil fire needs.
                </p>
              </div>

              <span className="size-8 sm:size-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-[#dc2626] group-hover:text-white transition-colors">
                <ChevronRight className="size-4" />
              </span>
            </Link>
          </div>
        </div>

        {/* Bottom Trust Strip below the main bento */}
        <div className="mt-8 rounded-2xl border border-[#ede7df] bg-white p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center divide-y sm:divide-y-0 sm:divide-x divide-border/60">
            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3 first:pt-0 first:px-0">
              <Award className="size-5 text-[#dc2626] shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Trusted Indian Brand</p>
                <p className="text-[11px] text-foreground-muted">Safety for a secure tomorrow</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
              <CheckCircle2 className="size-5 text-[#dc2626] shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Certified Quality</p>
                <p className="text-[11px] text-foreground-muted">ISO 9001:2015 | CE | IAF</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
              <Users className="size-5 text-[#dc2626] shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Protecting Homes</p>
                <p className="text-[11px] text-foreground-muted">Across India</p>
              </div>
            </div>

            <div className="flex items-center justify-start sm:justify-end gap-2 pt-3 sm:pt-0 sm:px-3">
              <span className="text-[11px] font-bold tracking-[0.16em] text-zinc-400 uppercase">
                SAFER HOMES | HAPPIER TOMORROWS
              </span>
              <span className="h-0.5 w-5 bg-red-400" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
