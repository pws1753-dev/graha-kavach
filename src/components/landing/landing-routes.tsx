import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLandingPricing } from "@/lib/landing/pricing";
import { landingPaths } from "@/lib/landing/routes";
import { fillTokens, plainText } from "@/lib/landing/text";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/seo/structured-data";
import { formatMinorUnitsToCurrency } from "@/lib/woocommerce/adapters";
import { getGlobalSiteSettings, getLanding, getLandingSeo } from "@/lib/wordpress/adapters";
import { BookingFlow } from "./booking-flow";
import { CountdownProvider } from "./countdown";
import { LandingView } from "./landing-view";
import { LandingViewTracker } from "./landing-view-tracker";

/*
 * Shared by /book-now and /lp/[slug]: the page itself and its booking steps.
 * Copy and images come from the landing page in WordPress, SEO from its Yoast
 * box and prices from the WooCommerce product chosen on the page, so nothing
 * here is specific to one campaign.
 */

const FALLBACK_TITLE = "Graha Kavach फ़ायर सेफ़्टी किट: अभी बुक करें";
const FALLBACK_DESCRIPTION =
  "Graha Kavach होम फ़ायर सेफ़्टी किट बुक करें: फ़ायर एक्सटिंग्विशर, फ़ायर बॉल और फ़ायर ब्लैंकेट। मुफ़्त डिलीवरी, कैश ऑन डिलीवरी।";

export async function landingMetadata(slug: string): Promise<Metadata> {
  const landing = await getLanding(slug);
  if (!landing) return { robots: { index: false, follow: false } };

  const page = await getLandingSeo(landing.pageId, slug);

  return buildSeoMetadata({
    seo: page?.seo,
    fallbackTitle: page?.title || FALLBACK_TITLE,
    fallbackDescription: FALLBACK_DESCRIPTION,
    path: landingPaths(slug).page,
    noindex: true,
  });
}

/** Booking steps are a transactional funnel: not for search results. */
export const bookingMetadata: Metadata = {
  title: "Book Now",
  robots: { index: false, follow: false },
};

export async function LandingPageRoute({ slug }: { slug: string }) {
  const landing = await getLanding(slug);
  if (!landing) notFound();

  const [pricing, settings] = await Promise.all([getLandingPricing(landing.productSlug), getGlobalSiteSettings()]);
  if (!pricing) notFound();

  const paths = landingPaths(slug);
  const faqSchema = buildFaqSchema(
    landing.faqs.map((faq) => ({
      q: plainText(fillTokens(faq.q, pricing, landing.endTime)),
      a: plainText(fillTokens(faq.a, pricing, landing.endTime)),
    })),
  );
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Book Now", path: paths.page },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
      <LandingViewTracker productId={pricing.productId} valueMinor={pricing.priceMinor} />
      <CountdownProvider config={{ endTime: landing.endTime, endsAt: landing.endsAt, cycleDays: landing.cycleDays }} enabled={!landing.hideTimer}>
        <LandingView
          landing={landing}
          pricing={pricing}
          bookHref={paths.book}
          logo={{ url: settings.logo?.url ?? "/brand/graha-kavach-logo.png", alt: settings.logo?.alt || "Graha Kavach" }}
        />
      </CountdownProvider>
    </>
  );
}

export async function BookingRoute({ slug }: { slug: string }) {
  const landing = await getLanding(slug);
  if (!landing) notFound();

  const [pricing, settings] = await Promise.all([getLandingPricing(landing.productSlug), getGlobalSiteSettings()]);
  if (!pricing) notFound();

  const t = (text: string) => fillTokens(text, pricing, landing.endTime);
  const money = (minor: number) => formatMinorUnitsToCurrency(Math.max(0, minor), pricing.currency);
  const discountMinor = pricing.mrpMinor - pricing.priceMinor;

  return (
    <BookingFlow
      slug={slug}
      landingHref={landingPaths(slug).page}
      hideTimer={landing.hideTimer}
      countdown={{ endTime: landing.endTime, endsAt: landing.endsAt, cycleDays: landing.cycleDays }}
      content={{
        logoUrl: settings.logo?.url ?? "/brand/graha-kavach-logo.png",
        logoAlt: settings.logo?.alt || "Graha Kavach",
        lockLabel: landing.lockLabel,
        detailsTitle: landing.detailsTitle,
        detailsSub: landing.detailsSub,
        detailsNote: landing.detailsNote,
        payTitle: t(landing.payTitle),
        paySecure: landing.paySecure,
        doneTitle: landing.doneTitle,
        doneText: t(landing.doneText),
        doneSteps: landing.doneSteps.map((row) => t(row.text)),
        doneWhatsappLabel: landing.doneWhatsappLabel,
        whatsappKeyword: landing.whatsappKeyword,
        doneHomeLabel: landing.doneHomeLabel,
        phone: landing.phone,
      }}
      money={{
        productId: pricing.productId,
        priceMinor: pricing.priceMinor,
        advanceMinor: pricing.advanceMinor,
        currency: pricing.currency,
        price: money(pricing.priceMinor),
        advance: money(pricing.advanceMinor),
        balance: money(pricing.priceMinor - pricing.advanceMinor),
        discount: discountMinor > 0 ? money(discountMinor) : "",
      }}
    />
  );
}
