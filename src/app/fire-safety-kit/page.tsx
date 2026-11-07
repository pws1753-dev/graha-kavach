import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CodBookingNote } from "@/components/commerce/cod-booking-note";
import { Price } from "@/components/commerce/price";
import { PurchaseActions } from "@/components/commerce/purchase-actions";
import { SecurePaymentStrip } from "@/components/commerce/secure-payment-strip";
import { StockStatus } from "@/components/commerce/stock-status";
import { SafetyCarousel } from "@/components/home/safety-carousel";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { TrackProductView } from "@/components/analytics/track-view-content";
import { fallbackPostImage, kitFallbackItems } from "@/lib/wordpress/fallback-media";

import {
  formatMinorUnitsToCurrency,
  wooProductGallery,
  wooProductToSummary,
} from "@/lib/woocommerce/adapters";
import { getCodAdvanceConfig } from "@/lib/woocommerce/checkout-settings";
import { getPrimaryProduct } from "@/lib/woocommerce/products";
import { getProductReviews } from "@/lib/woocommerce/reviews";
import { getPosts, getProductContent } from "@/lib/wordpress/adapters";
import { stripHtml } from "@/lib/wordpress/format";
import { isNotFound } from "@/lib/errors";

// Static with a 60 s refresh (the price window); WordPress edits arrive through the webhook.
export const revalidate = 60;

const fallbackSpecs = [
  ["Extinguisher", "Capacity", "2 kg ABC dry powder"],
  ["Extinguisher", "Discharge", "10-12 sec brochure-listed discharge"],
  ["Extinguisher", "Throw", "3-4 m brochure-listed throw"],
  ["Fire Ball", "Weight", "1.3 kg"],
  ["Fire Ball", "Agent", "MAP powder"],
  ["Fire Ball", "Shelf life", "5-year brochure-listed shelf life"],
  ["Fire Blanket", "Size", "1 x 1 m"],
  ["Fire Blanket", "Material", "Fibreglass"],
  ["Fire Blanket", "Heat resistance", "550°C brochure-listed heat-resistance figure"],
];

/*
 * Shown (and marked up as FAQPage) only when no FAQs are published in the CMS,
 * so the page always answers the questions buyers search for. The price is
 * filled in from the live product.
 */
const kitPageFaqs: Array<{ q: string; a: string }> = [
  {
    q: "What is the price of the Graha Kavach fire safety kit?",
    a: "The complete 3-in-1 fire safety kit costs ₹2,499 (MRP ₹2,999). This includes the 2 kg ABC fire extinguisher, the automatic fire ball, the fire blanket and all mounting hardware, with free delivery across India.",
  },
  {
    q: "Is a fire extinguisher kit better than a single fire extinguisher?",
    a: "Yes, for most homes. A single extinguisher needs someone awake and nearby. The kit adds a fire ball that works automatically and a fire blanket for oil fires, where an extinguisher can spread burning oil.",
  },
  {
    q: "Is this fire safety kit suitable for a small flat or rented home?",
    a: "Yes. The 2 kg extinguisher and fire blanket fit on a kitchen or hallway wall, and the fire ball mounts above the MCB panel or inverter. Screws and wall plugs are included.",
  },
];

const fallbackFaqs = (price: string): Array<{ q: string; a: string }> => [
  {
    q: "What is included in the Graha Kavach fire safety kit?",
    a: "The kit has three items: a 2 kg ABC dry powder fire extinguisher, an automatic fire ball (1.3 kg) and a 1 m x 1 m fibreglass fire blanket, supplied with wall mounting hardware and a printed safety guide.",
  },
  {
    q: "What is the price of the Graha Kavach home fire safety kit?",
    a: `The complete 3-in-1 kit is priced at ${price}. Delivery is free across India.`,
  },
  {
    q: "Is cash on delivery available?",
    a: "Yes. Cash on delivery is available. A small advance paid online confirms your order and the balance is paid on delivery.",
  },
  {
    q: "Which fires can the ABC fire extinguisher be used on?",
    a: "An ABC dry powder extinguisher is designed for Class A (wood, paper, cloth), Class B (petrol, paint, oil) and Class C (flammable gases such as LPG) fires. For a small kitchen pan fire, the fire blanket is the safer first option.",
  },
  {
    q: "Does the automatic fire ball need electricity?",
    a: "No. The fire ball works without electricity or anyone operating it. It activates by itself when flame reaches it, which makes it useful near an electrical panel, gas cylinder area, garage or store room.",
  },
  {
    q: "Who manufactures Graha Kavach?",
    a: "Graha Kavach is manufactured by Speciality Geochem, Udaipur, Rajasthan, which has been making fire protection products since 2010.",
  },
];

const linkClass = "text-primary underline underline-offset-4";

const storySections: Array<[string, ReactNode]> = [
  [
    "Why Buy a Fire Extinguisher Combo?",
    <>
      One{" "}
      <Link className={linkClass} href="/">
        fire extinguisher for home
      </Link>{" "}
      can&apos;t handle every fire. This combo gives each fire the right tool, in one box.
    </>,
  ],
  [
    "3 Layers, One Fire Safety Kit",
    <>
      Extinguisher for you, fire ball that works on its own, blanket for kitchen fires. See{" "}
      <Link className={linkClass} href="/how-it-works">
        how each layer works
      </Link>
      .
    </>,
  ],
  [
    "Where to place each item",
    <>
      Keep each item visible and within reach. Our{" "}
      <Link className={linkClass} href="/safety-guide">
        home fire safety guide
      </Link>{" "}
      shows exact mounting heights.
    </>,
  ],
  ["Fire emergency do/don't", "Prioritize people, call emergency services when needed, and never fight a fire that is growing or blocking escape."],
];

/* Copy for the three kit items, matched by product so it applies to CMS and fallback items alike. */
const kitItemCopy: Array<[RegExp, { title: string; summary: string }]> = [
  [
    /ball/i,
    {
      title: "Automatic Fire Extinguisher Ball",
      summary: "1.3 kg MAP powder fire ball that bursts on contact with flame, even when no one is home.",
    },
  ],
  [
    /blanket/i,
    {
      title: "Fire Blanket for Kitchen, 1 m x 1 m",
      summary: "550°C fibreglass fire safety blanket for pan and oil fires. Pull the tapes and cover the flame.",
    },
  ],
  [
    /extinguisher/i,
    {
      title: "2 kg ABC Fire Extinguisher Cylinder",
      summary:
        "Fire extinguisher ABC type for wood, cloth, paper, oil, LPG and electrical fires. Small enough for a kitchen or hallway wall.",
    },
  ],
];

async function getKitData() {
  try {
    const product = await getPrimaryProduct();
    const [content, reviews, relatedPosts] = await Promise.all([
      getProductContent(product.slug),
      getProductReviews(product.id),
      getPosts(3),
    ]);

    return { product, content, reviews, relatedPosts };
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
}

import { buildSeoMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildOrganizationSchema,
  buildProductSchema,
  buildWebPageSchema,
} from "@/lib/seo/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const { product } = await getKitData();
  // The on-page H1 comes from the CMS headline; the search title is written for the query people type.
  const title = "Fire Safety Kit for Home | 3-in-1 Fire Extinguisher Kit";
  const description =
    "Buy the Graha Kavach fire safety kit for home: 2 kg ABC fire extinguisher, automatic fire ball and fire blanket in one combo. Free delivery, COD.";

  return buildSeoMetadata({
    fallbackTitle: title,
    fallbackDescription: description,
    path: "/fire-safety-kit",
    fallbackImage: product.images[0]?.src,
    keywords: [
      "buy fire safety kit",
      "home fire extinguisher online",
      "fire safety ball price",
      "kitchen fire blanket",
      "3 in 1 fire safety kit India",
      "Graha Kavach kit",
      "residential fire extinguisher price",
      "fire safety equipment Udaipur",
      "ABC fire extinguisher 2kg",
      "automatic fire ball",
    ],
  });
}

export default async function FireSafetyKitPage() {
  // The COD advance is read from the WooCommerce deposit settings, so the amounts follow wp-admin.
  const [{ product, content, reviews, relatedPosts }, codAdvance] = await Promise.all([getKitData(), getCodAdvanceConfig()]);
  const summary = wooProductToSummary(product);
  // Product images come only from the WooCommerce product, so what is shown matches the store admin.
  const gallery = wooProductGallery(product);
  const galleryImages = gallery.length ? gallery : summary.image ? [summary.image] : [];
  const baseKitItems = content?.kitContents.length
    ? content.kitContents.map((item, i) => ({
        id: item.id,
        title: item.title,
        summary: item.summary || item.quantity,
        image: item.image ?? kitFallbackItems[i % kitFallbackItems.length].image,
      }))
    : kitFallbackItems;
  const kitItems = baseKitItems.map((item) => {
    const copy = kitItemCopy.find(([pattern]) => pattern.test(item.title))?.[1];
    return copy ? { ...item, ...copy } : item;
  });
  const unavailable = product.status !== "publish" || summary.stockStatus === "outofstock";

  const specs = content?.specifications.length ? content.specifications.map((spec) => [spec.group, spec.label, spec.value]) : fallbackSpecs;

  const existingFaqs = content?.faqs.length
    ? content.faqs.map((faq) => ({ id: String(faq.id), q: faq.title, a: faq.answer }))
    : fallbackFaqs(formatMinorUnitsToCurrency(summary.priceMinor, summary.currency)).map((faq, i) => ({
        id: `faq-${i}`,
        ...faq,
      }));
  const faqItems = [...kitPageFaqs.map((faq, i) => ({ id: `kit-faq-${i}`, ...faq })), ...existingFaqs];

  const productSchema = buildProductSchema(product, reviews, specs as string[][]);
  const faqSchema = buildFaqSchema(faqItems.map(({ q, a }) => ({ q, a })));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Fire Safety Kit", path: "/fire-safety-kit" },
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildWebPageSchema({
        path: "/fire-safety-kit",
        name: content?.headline || stripHtml(product.name),
        description: content?.heroSupportingText || stripHtml(product.short_description),
        image: product.images[0]?.src,
      }),
      ...(productSchema ? [productSchema] : []),
      breadcrumbSchema,
      ...(faqSchema ? [faqSchema] : []),
    ],
  };

  return (
    <main className="overflow-x-hidden pb-24 lg:pb-0">
      <TrackProductView
        productId={product.id}
        productName={product.name}
        price={parseFloat(product.price) || 2499}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 text-sm text-muted-foreground lg:px-10">
          <Link href="/">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Fire Safety Kit</span>
        </div>
      </section>

      <section className="bg-white py-6 sm:py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="min-w-0">
            <ProductGallery images={galleryImages} alt={product.name} />
          </div>

          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <Badge tone="primary">Fire Safety Kit</Badge>
            <h1 className="mt-4 break-words text-3xl font-medium leading-tight sm:text-4xl text-foreground lg:text-5xl">
              Fire Safety Kit for Home: 3-in-1 Fire Extinguisher Combo
            </h1>
            <p className="mt-4 text-base leading-7 sm:mt-5 sm:text-lg sm:leading-8 text-foreground-muted">
              {content?.heroSupportingText || stripHtml(product.short_description)}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Price
                amountMinor={summary.priceMinor}
                compareAtMinor={summary.regularPriceMinor}
                currency={summary.currency}
                size="lg"
              />
              <StockStatus status={summary.stockStatus} quantity={product.stock_quantity} />
            </div>

            <CodBookingNote
              className="mt-4"
              priceMinor={summary.priceMinor}
              currency={summary.currency}
              config={codAdvance}
            />

            {product.status !== "publish" ? (
              <div className="mt-6 border border-warning bg-warning-subtle p-4 text-sm text-warning">
                This product is not available to order right now.
              </div>
            ) : null}

            {product.sku ? (
              <p className="mt-3 text-sm text-muted-foreground">SKU: {product.sku}</p>
            ) : null}

            <div className="mt-8">
              <PurchaseActions
                productId={product.id}
                productName={product.name}
                maxQuantity={product.stock_quantity ?? null}
                unitPriceMinor={summary.priceMinor ?? undefined}
                disabled={unavailable}
              />
            </div>

            <div className="mt-8 grid gap-3 border-y border-border py-5 text-sm text-foreground-muted sm:grid-cols-3">
              <span>Free delivery across India</span>
              <span>Cash on delivery available</span>
              <span>Made in Udaipur by Speciality Geochem</span>
            </div>

            <SecurePaymentStrip className="mt-6" stacked />
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-medium text-foreground sm:text-3xl">
            Buy a complete home fire safety kit online in India
          </h2>
          <div className="mt-4 space-y-4 leading-8 text-foreground-muted">
            <p>
              The Graha Kavach fire safety kit puts three layers of protection in one box: a 2 kg ABC fire
              extinguisher, an automatic fire extinguisher ball and a 1 m x 1 m fire blanket. It is a complete fire
              extinguisher kit for Indian homes, covering kitchen, electrical and furniture fires with one order. Buy
              online at ₹2,499 with free delivery across India and cash on delivery.
            </p>
            <p>
              It is made by Speciality Geochem in Udaipur, comes with wall mounting hardware and a printed safety
              guide, and is delivered across India with cash on delivery available. Not sure where to place each
              item? Read the{" "}
              <Link className="text-primary underline underline-offset-4" href="/safety-guide">
                home fire safety guide
              </Link>{" "}
              or see{" "}
              <Link className="text-primary underline underline-offset-4" href="/how-it-works">
                how the three layers work
              </Link>
              . Before you pay, read our{" "}
              <Link className="text-primary underline underline-offset-4" href="/blog/fire-extinguisher-for-home-buying-guide-india">
                Fire Extinguisher for Home: Complete Buying Guide for India (2026)
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background-subtle py-10 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {storySections.map(([title, text]) => (
            <article className="border border-border bg-white p-5" key={title}>
              <h2 className="font-medium text-foreground">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-foreground-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <p className="gk-text-gradient text-sm font-medium uppercase tracking-[0.18em]">Inside the box</p>
          <h2 className="mt-3 text-3xl font-medium text-foreground">Everything in the kit.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kitItems.map((item) => (
              <article className="border border-border bg-background-subtle p-4" key={item.id}>
                <ResponsiveImage media={item.image ?? null} alt={item.title} aspect="square" fit="contain" />
                <h3 className="mt-4 font-medium">{item.title}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background-subtle py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <p className="gk-text-gradient text-sm font-medium uppercase tracking-[0.18em]">Specifications</p>
          <h2 className="mt-3 text-3xl font-medium text-foreground">Verified product information.</h2>
          <div className="mt-8 overflow-hidden border border-border bg-white">
            {specs.map(([group, label, value]) => (
              <div className="grid gap-2 border-b border-border p-4 last:border-b-0 md:grid-cols-[0.8fr_1fr_1.4fr]" key={`${group}-${label}`}>
                <span className="gk-text-gradient text-sm font-medium">{group}</span>
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-foreground-muted">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <p className="gk-text-gradient text-sm font-medium uppercase tracking-[0.18em]">Placement and use</p>
          <h2 className="mt-3 text-3xl font-medium text-foreground">Use safely, and only when appropriate.</h2>

          <div className="gk-article mt-8 min-w-0 space-y-6 text-base leading-7 lg:w-[90%]">
            {content?.installation ? <div dangerouslySetInnerHTML={{ __html: content.installation }} /> : null}
            {content?.usage ? <div dangerouslySetInnerHTML={{ __html: content.usage }} /> : null}
            {content?.warnings.length ? (
              <div className="grid gap-3">
                {content.warnings.map((warning) => (
                  <div className="border border-border bg-background-subtle p-4" key={warning.title}>
                    <p className="gk-text-gradient text-sm font-medium">{warning.level || "Safety note"}</p>
                    <h3 className="mt-1 font-medium text-foreground">{warning.title}</h3>
                    <p className="mt-2 text-sm">{warning.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-background-subtle py-10 sm:py-14" id="first-minute">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span className="gk-text-gradient text-xs font-medium tracking-[0.18em] uppercase">
              From the safety guide
            </span>
            <h2 className="text-balance text-3xl leading-[1.12] font-medium tracking-[-0.03em] text-foreground lg:text-[44px]">
              What to do in the first minute.
            </h2>
            <p className="mt-1 max-w-xl leading-7 text-foreground-muted">
              The short version of the guide that ships with the kit. Read it before you need it.
            </p>
          </div>

          <SafetyCarousel />
        </div>
      </section>

      <section className="bg-background-subtle py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <p className="gk-text-gradient text-sm font-medium uppercase tracking-[0.18em]">Manufacturer</p>
          <h2 className="mt-3 text-3xl font-medium text-foreground">Speciality Geochem.</h2>
          <div className="mt-5 max-w-3xl leading-8 text-foreground-muted">
            {content?.manufacturerNotes ? (
              <div dangerouslySetInnerHTML={{ __html: content.manufacturerNotes }} />
            ) : (
              <p>Source material indicates manufacturing experience since 2010 in Udaipur.</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <p className="gk-text-gradient text-sm font-medium uppercase tracking-[0.18em]">Certifications</p>
          <h2 className="mt-3 text-3xl font-medium text-foreground">Certified and tested.</h2>
          {content?.certifications.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {content.certifications.map((cert) => (
                <article className="border border-border bg-background-subtle p-5" key={cert.id}>
                  <h3 className="font-medium text-foreground">{cert.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">{cert.summary || cert.issuer}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-border p-6 text-foreground-muted">
              Certificates and test reports are available on request. Contact us for copies.
            </div>
          )}
        </div>
      </section>

      <section className="bg-background-subtle py-10 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div className="min-w-0">
            <p className="gk-text-gradient text-sm font-medium uppercase tracking-[0.18em]">FAQ</p>
            <h2 className="mt-3 text-3xl font-medium text-foreground">Product questions.</h2>
            <Accordion
              className="mt-8"
              items={faqItems.map((faq) => ({
                id: faq.id,
                question: faq.q,
                answer: <span dangerouslySetInnerHTML={{ __html: faq.a }} />,
              }))}
            />
          </div>

          <div className="min-w-0">
            <p className="gk-text-gradient text-sm font-medium uppercase tracking-[0.18em]">Reviews</p>
            <h2 className="mt-3 text-3xl font-medium text-foreground">Customer reviews.</h2>
            {reviews.length ? (
              <div className="mt-8 grid gap-4">
                {reviews.map((review) => (
                  <article className="border border-border bg-white p-5" key={review.id}>
                    <Badge tone="success">{review.rating}/5</Badge>
                    <p className="mt-4 leading-7 text-foreground-muted" dangerouslySetInnerHTML={{ __html: review.review }} />
                    <p className="mt-4 font-medium text-foreground">{review.reviewer}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-8 border border-dashed border-border bg-white p-6 text-foreground-muted">
                No reviews have been published yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <p className="gk-text-gradient text-sm font-medium uppercase tracking-[0.18em]">Related safety articles</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {relatedPosts.map((post) => (
              <article className="overflow-hidden border border-border bg-background-subtle" key={post.databaseId}>
                <ResponsiveImage
                  media={
                    post.featuredImage?.node?.sourceUrl
                      ? {
                          id: post.databaseId,
                          url: post.featuredImage.node.sourceUrl,
                          alt: post.featuredImage.node.altText || stripHtml(post.title),
                          width: null,
                          height: null,
                        }
                      : fallbackPostImage(stripHtml(post.title))
                  }
                  aspect="16/9"
                  fit="cover"
                  sizes="(max-width: 767px) 92vw, 33vw"
                />
                <div className="p-5">
                <h3 className="text-lg font-medium text-foreground">{stripHtml(post.title)}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground-muted">{stripHtml(post.excerpt)}</p>
                <Link className="gk-text-gradient mt-5 inline-flex text-sm font-medium" href={`/blog/${post.slug}`}>
                  Read article
                </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PurchaseActions
        productId={product.id}
        productName={product.name}
        maxQuantity={product.stock_quantity ?? null}
        unitPriceMinor={summary.priceMinor ?? undefined}
        disabled={unavailable}
        priceLabel={formatMinorUnitsToCurrency(summary.priceMinor, summary.currency)}
        mobile
      />
    </main>
  );
}
