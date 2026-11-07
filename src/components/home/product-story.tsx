import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/ui/icons";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import type { Media } from "@/types";

/* ------------------------------------------------------------------ */
/* Section 2 — quick trust bar                                         */
/* ------------------------------------------------------------------ */

/**
 * Four plain statements of fact about the kit.
 *
 * No certification marks appear here. Those live in the quality section and
 * only when a verified certificate exists in the CMS — a badge row this high
 * on the page is exactly where an unverified claim would do the most damage.
 */
export function TrustBar({ items }: { items: Array<{ title: string; text: string }> }) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-border bg-background-subtle">
      <Container width="wide">
        <ul className="grid gap-x-8 gap-y-5 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:py-9">
          {items.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 size-[18px] shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm leading-5 font-medium text-foreground">{item.title}</p>
                {item.text ? (
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">{item.text}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function HomeTextMarquee() {
  const messages = [
    "Kitchen ready",
    "Electrical panel ready",
    "Exit route ready",
    "One box, three responses",
    "Made for Indian homes",
    "Mount it before you need it",
  ];
  const track = [...messages, ...messages];

  return (
    <section className="overflow-hidden border-b border-border bg-foreground text-white">
      <div className="gk-text-marquee-mask">
        <div className="gk-text-marquee-track flex w-max items-center gap-6 py-4">
          {track.map((item, index) => (
            <span
              key={`${item}-${index}`}
              aria-hidden={index >= messages.length ? "true" : undefined}
              className="flex shrink-0 items-center gap-6 text-sm font-medium tracking-[0.22em] uppercase text-white/85"
            >
              {item}
              <span className="size-1.5 rounded-full bg-secondary" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3 — three products, three roles                             */
/* ------------------------------------------------------------------ */

export type ProductRole = {
  name: string;
  role: string;
  description: string;
  image: Media | null;
  placeholderLabel: string;
};

/**
 * The three parts of the kit, each with the job it does.
 *
 * Laid out asymmetrically on desktop — the first panel is taller and carries
 * more copy — so it reads as an art-directed composition rather than three
 * identical boxes. On a phone it becomes a snap-scrolling row, which keeps the
 * comparison side by side instead of burying the third item three screens down.
 */
export function ProductRoles({ items }: { items: ProductRole[] }) {
  return (
    <section className="bg-background py-10 lg:py-14">
      <Container width="wide">
        <div className="max-w-2xl">
          <p className="gk-text-gradient text-xs font-medium tracking-[0.18em] uppercase">
            The protection system
          </p>
          <h2 className="mt-4 text-3xl leading-[1.14] font-medium tracking-[-0.02em] text-balance text-foreground lg:text-[42px]">
            Three products, three distinct roles.
          </h2>
          <p className="mt-4 leading-7 text-foreground-muted">
            A fire does not give you one option. One is used by hand, one acts on its own, and one
            smothers — together they cover situations a single device cannot.
          </p>
        </div>

        {/* Phone: swipeable row. lg: an uneven three-column composition, the
            lead product given more width than the two supporting it. */}
        <ul className="gk-scroll-x mt-10 -mx-4 flex gap-4 px-4 pb-2 xs:-mx-5 xs:px-5 lg:mx-0 lg:grid lg:grid-cols-[1.3fr_1fr_1fr] lg:gap-6 lg:px-0 lg:pb-0">
          {items.map((item, index) => (
            <li
              key={item.name}
              className="w-[78vw] shrink-0 snap-start xs:w-[70vw] sm:w-[52vw] lg:w-auto lg:shrink"
            >
              <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-white">
                <div className="relative bg-background-subtle p-5">
                  {item.image?.url ? (
                    <div
                      className={
                        index === 0
                          ? "relative aspect-[4/3] w-full lg:aspect-[5/4]"
                          : "relative aspect-[4/3] w-full"
                      }
                    >
                      <Image
                        src={item.image.url}
                        alt={item.image.alt || item.name}
                        fill
                        sizes="(max-width: 1023px) 72vw, 32vw"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <MediaPlaceholder label={item.placeholderLabel} aspect="4/3" />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5 lg:p-6">
                  <p className="text-xs font-medium tracking-[0.14em] text-secondary uppercase">
                    {item.role}
                  </p>
                  <h3 className="mt-2 text-lg leading-6 font-medium text-foreground lg:text-xl">
                    {item.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-foreground-muted lg:text-[15px] lg:leading-7">
                    {item.description}
                  </p>
                  <Link
                    href="/fire-safety-kit"
                    className="mt-5 inline-flex min-h-11 items-center gap-2 gk-gradient-hover gk-text-gradient text-sm font-medium transition-colors"
                  >
                    Learn more
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 4 — one complete kit                                        */
/* ------------------------------------------------------------------ */

const KIT_PIECES = [
  { src: "/protection-system/asset-4.png", label: "Manual", name: "ABC Extinguisher" },
  { src: "/protection-system/asset-6.png", label: "Automatic", name: "Fire Ball" },
  { src: "/protection-system/asset-5.png", label: "Smother", name: "Fire Blanket" },
] as const;

/**
 * The kit as a single object, with everything in the box listed beside it.
 *
 * Contents come from the CMS when the client has filled them in, so the list
 * stays correct if the packaging changes without a code deploy. The imagery
 * is the site's own product photography rather than the single CMS `image`
 * prop — a lifestyle shot of all three pieces together, plus a real photo of
 * each piece instead of a generic icon, so the "three roles" claim above is
 * backed by something the visitor can actually see.
 */
export function CompleteKit({
  image,
  contents,
}: {
  image: Media | null;
  contents: Array<{ title: string; summary: string }>;
}) {
  void image;

  return (
    <section className="relative overflow-hidden bg-background py-10 lg:py-14">
      <Container width="wide">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1.5 text-xs font-medium tracking-[0.16em] text-foreground-muted uppercase">
              <ShieldIcon className="size-4 text-secondary" />
              One complete kit
            </span>
            <h2 className="mt-4 text-3xl leading-[1.14] font-medium tracking-[-0.02em] text-balance text-foreground lg:text-[42px]">
              Six pieces. Nothing left to source separately.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-foreground-muted">
              The extinguisher, the fire ball, the blanket, plus the bracket, stand and fixings to
              mount all three, packed as one order. There is no second trip to a hardware store
              before it can go on the wall.
            </p>

            {contents.length > 0 ? (
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {contents.map((item) => (
                  <li
                    key={item.title}
                    className="flex min-h-16 items-start gap-3 rounded-[8px] border border-border bg-background-subtle p-3"
                  >
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <span className="text-sm leading-6 text-foreground">{item.title}</span>
                      {item.summary ? (
                        <span className="block text-xs leading-5 text-foreground-muted">{item.summary}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <Button href="/fire-safety-kit" size="lg" className="mt-9">
              View Full Kit
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[20px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
              <Image
                src="/protection-system/asset-1.png"
                alt="The complete Graha Kavach fire safety kit — extinguisher, fire ball and fire blanket together"
                fill
                sizes="(max-width: 1023px) 92vw, 46vw"
                className="object-cover"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {KIT_PIECES.map((piece) => (
                <div
                  key={piece.label}
                  className="overflow-hidden rounded-[16px] border border-border bg-white text-center"
                >
                  <div className="relative aspect-square w-full bg-white">
                    <Image
                      src={piece.src}
                      alt={piece.name}
                      fill
                      sizes="(max-width: 1023px) 30vw, 15vw"
                      className="object-contain p-2"
                    />
                  </div>
                  <p className="px-2 py-2.5 text-xs font-medium tracking-[0.1em] text-foreground-muted uppercase">
                    {piece.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
