import Image from "next/image";
import Link from "next/link";
import type { WpLanding, WpMedia } from "@/lib/wordpress/types";
import { fillTokens, localPhoneDigits, type LandingPricing } from "@/lib/landing/text";
import { formatMinorUnitsToCurrency } from "@/lib/woocommerce/adapters";
import { ArrowIcon, CheckIcon, Rich } from "./rich";
import { Timer, TimerBoxes } from "./countdown";
import { showsDays } from "@/lib/landing/countdown";

type Props = {
  landing: WpLanding;
  pricing: LandingPricing;
  /** Where the Book Now buttons go: the booking steps of this page. */
  bookHref: string;
  logo: { url: string; alt: string };
};

function Photo({
  media,
  className,
  focus,
  priority,
  sizes,
}: {
  media: WpMedia;
  className?: string;
  focus?: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <Image
      src={media.url}
      alt={media.alt}
      width={media.width ?? 900}
      height={media.height ?? 900}
      sizes={sizes}
      priority={priority}
      className={className}
      style={focus ? { objectPosition: focus } : undefined}
    />
  );
}

function BookButton({ label, href, className = "" }: { label: string; href: string; className?: string }) {
  return (
    <Link href={href} className={`lp-btn ${className}`}>
      {label}
      <ArrowIcon />
    </Link>
  );
}

export function LandingView({ landing, pricing, bookHref, logo }: Props) {
  const timerOn = !landing.hideTimer;
  const t = (text: string) => fillTokens(text, pricing, landing.endTime);
  const money = (minor: number) => formatMinorUnitsToCurrency(Math.max(0, minor), pricing.currency);

  const timerUnits = landing.timerUnits.split(",").map((u) => u.trim()).filter(Boolean);
  const dayWord = timerUnits.length > 3 ? timerUnits[0] : "दिन";
  const showDays = showsDays({ endTime: landing.endTime, endsAt: landing.endsAt, cycleDays: landing.cycleDays });

  const phone = localPhoneDigits(landing.phone);
  const bookLabel = t(landing.ctaLabel);
  const timerNote = timerOn ? (
    <div className="text-center text-sm font-semibold text-primary">
      {landing.timerLabel} <Timer dayStyle="word" dayWord={dayWord} />
    </div>
  ) : null;
  const hasWhere = Boolean(
    landing.whereTitle || landing.whereImage || landing.whereTiles.length || landing.reviews.length || landing.trustBold || landing.trustText,
  );
  const eyebrow = "text-[13px] font-bold tracking-[0.04em] text-primary";
  const h2 = "m-0 text-[22px] leading-[1.25] font-extrabold";

  return (
    <div className="mx-auto max-w-[480px] bg-white text-base leading-normal">
      {timerOn && landing.topbarText ? (
        <div className="flex items-center justify-center gap-2 bg-foreground px-3 py-2 text-[12.5px] font-semibold text-white">
          <span className="lp-dot size-2 rounded-full bg-accent" />
          <span>{t(landing.topbarText)}</span>
          <Timer className="rounded-md bg-primary px-1.5 py-0.5 text-[12.5px]" />
        </div>
      ) : null}

      <header className="flex items-center justify-between gap-3 border-b border-border bg-white px-5 py-3">
        <div className="flex flex-col gap-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.url} alt={logo.alt} className="block h-9 w-auto" />
          {landing.headerTagline ? (
            <div className="lp-display text-xs leading-[1.3] font-semibold text-muted-foreground">{landing.headerTagline}</div>
          ) : null}
        </div>
        <Link href={bookHref} className="lp-btn !min-h-10 !px-4 !text-sm whitespace-nowrap">
          {landing.ctaShort}
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="flex flex-col gap-[18px] bg-white px-5 pt-6 pb-8">
          {landing.heroBadge ? (
            <div className="lp-display self-start rounded-full border border-red-200 bg-primary-subtle px-3 py-1.5 text-[13px] font-bold text-primary">
              {landing.heroBadge}
            </div>
          ) : null}
          <h1 className="m-0 text-[29px] leading-[1.2] font-extrabold">
            {landing.heroTitleBefore}
            <br />
            <span className="text-primary">{landing.heroTitleHighlight}</span> {landing.heroTitleAfter}
          </h1>
          <p className="m-0 text-[15.5px] leading-[1.55] text-foreground-muted">
            <Rich text={t(landing.heroText)} />
          </p>

          {landing.heroImage ? (
            <div className="relative overflow-hidden rounded-[14px] border border-border bg-white">
              <Photo media={landing.heroImage} priority sizes="(max-width: 480px) 100vw, 480px" className="aspect-square w-full object-cover" />
              {landing.heroImageTag ? (
                <div className="lp-display absolute top-3 left-3 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-extrabold tracking-[0.04em] text-white">
                  {landing.heroImageTag}
                </div>
              ) : null}
              <div className="absolute right-3 bottom-3 flex flex-col items-end rounded-[10px] bg-foreground px-3 py-2 leading-[1.1] text-white">
                {landing.priceChip && pricing.mrpMinor > pricing.priceMinor ? (
                  <div className="lp-display mb-1 rounded bg-accent px-1.5 py-0.5 text-[11px] font-extrabold text-foreground">{t(landing.priceChip)}</div>
                ) : null}
                {pricing.mrpMinor > pricing.priceMinor ? (
                  <div className="lp-display text-xs font-semibold text-[#a8a29e] line-through">{money(pricing.mrpMinor)}</div>
                ) : null}
                <div className="lp-display text-[22px] font-extrabold">{money(pricing.priceMinor)}</div>
              </div>
            </div>
          ) : null}

          {timerOn ? (
            <div className="flex flex-col items-center gap-2.5 rounded-[14px] bg-foreground p-4 text-white">
              <div className="text-sm font-semibold text-accent">{landing.timerLabel}</div>
              <TimerBoxes units={timerUnits} />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5 rounded-xl border border-red-200 bg-primary-subtle px-4 py-3.5">
              <div className="text-sm font-semibold text-foreground-muted">{landing.nowLabel}</div>
              <div className="lp-display text-[30px] leading-[1.1] font-extrabold text-primary">{money(pricing.advanceMinor)}</div>
              <div className="text-[13px] leading-[1.3] font-semibold">{landing.nowNote}</div>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-muted px-4 py-3.5">
              <div className="text-sm font-semibold text-foreground-muted">{landing.laterLabel}</div>
              <div className="lp-display text-[30px] leading-[1.1] font-extrabold">{money(pricing.priceMinor - pricing.advanceMinor)}</div>
              <div className="text-[13px] leading-[1.3] text-foreground-muted">{landing.laterNote}</div>
            </div>
          </div>

          <BookButton href={bookHref} label={bookLabel} className="lp-pulse !min-h-14 !text-lg" />
          {landing.heroTrust.length ? (
            <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold text-foreground-muted">
              {landing.heroTrust.map((row) => (
                <span key={row.text}>{row.text}</span>
              ))}
            </div>
          ) : null}
        </section>

        {/* Ticker */}
        {landing.ticker.length ? (
          <div className="overflow-hidden bg-primary py-[9px] text-white" aria-hidden="true">
            <div className="lp-ticker flex w-max gap-7 text-sm font-bold whitespace-nowrap">
              {[0, 1].flatMap((copy) =>
                landing.ticker.flatMap((row, index) => [
                  <span key={`${copy}-${index}-t`}>{t(row.text)}</span>,
                  <span key={`${copy}-${index}-d`}>•</span>,
                ]),
              )}
            </div>
          </div>
        ) : null}

        {/* Why */}
        {landing.whyTitle || landing.statBig || landing.whyPoints.length ? (
        <section className="flex flex-col gap-5 bg-white px-5 py-10">
          <div className="flex flex-col gap-1.5">
            <div className={eyebrow}>{landing.whyEyebrow}</div>
            <h2 className={h2}>{landing.whyTitle}</h2>
          </div>
          {landing.statBig ? (
            <div className="flex flex-col gap-2 rounded-[14px] bg-foreground px-5 py-[22px] text-white">
              <div className={`lp-display font-extrabold text-accent ${landing.statBig.length > 14 ? "text-[27px] leading-[1.2]" : "text-[38px] leading-none"}`}>{landing.statBig}</div>
              <div className="text-[15px] leading-[1.5]">{landing.statText}</div>
              <div className="text-[13px] text-[#a8a29e]">{landing.statSource}</div>
            </div>
          ) : null}
          <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
            {landing.whyPoints.map((point, index) => (
              <li key={point.title} className="flex items-start gap-3.5">
                <div className="lp-display flex size-[38px] shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[17px] font-extrabold text-primary">
                  {index + 1}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[16.5px] leading-[1.3] font-bold">{point.title}</div>
                  <div className="text-[14.5px] leading-[1.5] text-foreground-muted">{point.text}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2.5">
            <BookButton href={bookHref} label={bookLabel} />
            {timerNote}
          </div>
        </section>
        ) : null}

        {/* Kit */}
        {landing.kitTitle || landing.kitItems.length ? (
        <section className="flex flex-col gap-5 bg-muted px-5 py-10">
          <div className="flex flex-col gap-1.5">
            <div className={eyebrow}>{landing.kitEyebrow}</div>
            <h2 className={h2}>{landing.kitTitle}</h2>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {landing.kitItems.map((item, index) => {
              const image = landing.kitImages[index];
              return (
                <li key={item.title} className="flex items-center gap-3.5 rounded-xl border border-border bg-white p-3">
                  {image ? (
                    <Photo media={image} focus={item.focus} sizes="96px" className="size-24 shrink-0 rounded-[10px] object-cover" />
                  ) : null}
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[16.5px] leading-[1.3] font-bold">{item.title}</div>
                    <div className="text-[14px] leading-[1.5] text-foreground-muted">{item.text}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          {landing.kitExtra ? <p className="m-0 text-[15px] text-foreground-muted">{landing.kitExtra}</p> : null}
          {landing.kitBadges.length ? (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {landing.kitBadges.map((badge) => (
                <li key={badge.text} className="lp-display rounded-full border border-border-strong bg-white px-3 py-1.5 text-[13px] font-semibold">
                  {badge.text}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col gap-2.5">
            <BookButton href={bookHref} label={bookLabel} />
            {timerNote}
          </div>
        </section>
        ) : null}

        {/* Offer box */}
        {landing.offerPoints.length ? (
          <section className="flex flex-col gap-4 border-y border-orange-200 bg-secondary-subtle px-5 pt-8 pb-9">
            <h2 className={h2}>{t(landing.offerTitle)}</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {landing.offerPoints.map((point) => (
                <li key={point.text} className="flex items-center gap-3 rounded-xl border border-orange-200 bg-white px-4 py-3.5">
                  <CheckIcon />
                  <div className="text-[16.5px] leading-[1.3] font-bold">{t(point.text)}</div>
                </li>
              ))}
            </ul>
            {landing.offerNote ? (
              <div className="text-base font-semibold text-orange-800">
                {t(landing.offerNote)
                  .split("{timer}")
                  .map((part, index, parts) => (
                    <span key={index}>
                      {part}
                      {index < parts.length - 1 ? <Timer dayStyle="word" dayWord={dayWord} /> : null}
                    </span>
                  ))}
              </div>
            ) : null}
            <BookButton href={bookHref} label={landing.ctaOffer || bookLabel} />
          </section>
        ) : null}

        {/* Steps */}
        {landing.steps.length ? (
        <section className="flex flex-col gap-5 bg-white px-5 py-10">
          <h2 className={h2}>{landing.stepsTitle}</h2>
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {landing.steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3.5">
                <div className="lp-display flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">
                  {index + 1}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[16.5px] leading-[1.3] font-bold">{t(step.title)}</div>
                  <div className="text-[14.5px] leading-[1.5] text-foreground-muted">{t(step.text)}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2.5">
            <BookButton href={bookHref} label={bookLabel} />
            {timerNote}
          </div>
        </section>
        ) : null}

        {/* Where it goes, reviews, trust */}
        {hasWhere ? (
        <section className="flex flex-col gap-5 bg-muted px-5 py-10">
          {landing.whereTitle ? <h2 className={h2}>{landing.whereTitle}</h2> : null}
          {landing.whereImage ? (
            <div className="relative overflow-hidden rounded-[14px] border border-border">
              <Photo media={landing.whereImage} sizes="(max-width: 480px) 100vw, 480px" className="aspect-square w-full object-cover" />
              {landing.whereCaption ? (
                <div className="absolute inset-x-0 bottom-0 bg-foreground/80 px-3.5 py-2.5 text-sm leading-[1.4] font-semibold text-white">
                  {landing.whereCaption}
                </div>
              ) : null}
            </div>
          ) : null}
          {landing.whereTiles.length ? (
            <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
              {landing.whereTiles.map((tile, index) => {
                const image = landing.whereTileImages[index];
                if (!image) return null;
                return (
                  <li key={tile.label} className="relative overflow-hidden rounded-[10px]">
                    <Photo media={image} focus={tile.focus} sizes="160px" className="aspect-square w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-foreground/80 px-2 py-[5px] text-center text-xs font-semibold text-white">{tile.label}</div>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {landing.reviews.length ? (
            <div className="flex flex-col gap-3">
              {landing.reviews.map((review) => (
                <figure key={review.name + review.quote} className="m-0 flex flex-col gap-1.5 rounded-xl border border-border bg-white p-4">
                  <blockquote className="m-0 text-base leading-normal">{review.quote}</blockquote>
                  <figcaption className="text-sm font-semibold text-muted-foreground">{review.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
          {landing.trustBold || landing.trustText ? (
            <div className="rounded-[10px] border-l-4 border-primary bg-white px-4 py-3.5 text-[15px] leading-normal text-foreground-muted">
              <span className="font-bold text-foreground">{landing.trustBold}</span> {landing.trustText}
            </div>
          ) : null}
          <BookButton href={bookHref} label={bookLabel} />
        </section>
        ) : null}

        {/* FAQ */}
        {landing.faqs.length ? (
          <section className="flex flex-col gap-[18px] bg-white px-5 py-10">
            <h2 className={h2}>{landing.faqTitle}</h2>
            <div className="flex flex-col gap-2.5">
              {landing.faqs.map((faq) => (
                <div key={faq.q} className="flex flex-col gap-1 rounded-xl bg-muted p-4">
                  <h3 className="m-0 text-[15.5px] leading-[1.35] font-bold">{t(faq.q)}</h3>
                  <p className="m-0 text-sm leading-[1.55] text-foreground-muted">
                    {t(faq.a)
                      .split("{br}")
                      .map((line, index) => (
                        <span key={index} className="block">
                          <Rich text={line} />
                        </span>
                      ))}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Closing */}
        <section className="flex flex-col gap-4 bg-foreground px-5 pt-11 pb-10 text-center text-white">
          {timerOn ? (
            <>
              <div className="text-sm font-semibold text-accent">{t(landing.finalKicker)}</div>
              <Timer dayStyle="small" dayWord={dayWord} className={`leading-none text-white ${showDays ? "text-[32px]" : "text-[42px]"}`} />
            </>
          ) : null}
          <div className="mt-1 text-[24px] leading-[1.25] font-extrabold">{landing.finalTitle}</div>
          <div className="text-[14.5px] leading-normal text-[#a8a29e]">{landing.finalText}</div>
          <BookButton href={bookHref} label={bookLabel} className="lp-pulse mt-1 !min-h-14 !text-lg" />
          {phone ? (
            <div className="mt-1.5 text-base text-[#d6d3d1]">
              {landing.contactLabel}{" "}
              <a href={`tel:+91${phone}`} className="font-bold text-accent">
                {phone}
              </a>
            </div>
          ) : null}
          <div className="text-[13px] leading-[1.6] whitespace-pre-line text-muted-foreground">{landing.footerText}</div>
        </section>
      </main>

      {/* Sticky bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2.5 border-t border-border bg-white px-3 py-2 shadow-[0_-6px_20px_rgba(26,26,26,0.08)]">
        {timerOn ? (
          <div className="flex min-w-0 flex-1 items-baseline gap-1.5 whitespace-nowrap">
            <span className="min-w-0 truncate text-[11px] leading-tight font-bold text-primary">{t(landing.stickyLabel)}</span>
            <Timer className="shrink-0 text-[15px] leading-tight text-foreground" />
          </div>
        ) : null}
        <Link href={bookHref} className={`lp-btn lp-pulse !min-h-11 !px-3.5 !text-[15px] whitespace-nowrap ${timerOn ? "shrink-0" : "w-full"}`}>
          {t(landing.ctaSticky || landing.ctaLabel)}
        </Link>
      </div>
    </div>
  );
}
