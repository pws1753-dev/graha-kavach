import type { Metadata } from "next";
import { ReviewsOrCommitment } from "@/components/home/brand-trust";
import { FounderSection } from "@/components/home/founder-section";
import { FactorySection } from "@/components/home/factory-section";
import { CertificationMarquee } from "@/components/home/certification-marquee";
import { ProductBento, type BentoItem } from "@/components/home/product-bento";
import { SafetyGuides } from "@/components/home/safety-guides";
import { BuySection, FaqSection, FinalCta } from "@/components/home/conversion";
import { Hero } from "@/components/home/hero";
import { HeroBanners } from "@/components/home/hero-banners";
import { FeatureCarouselSection } from "@/components/home/feature-carousel-section";
import { HomeSeoContent } from "@/components/home/seo-content";
import { CompleteKit, HomeTextMarquee, TrustBar, type ProductRole } from "@/components/home/product-story";
import { HowItWorks, Placement, RiskAreas } from "@/components/home/safety-education";
import { wooProductGallery, wooProductToSummary } from "@/lib/woocommerce/adapters";
import { getPrimaryProduct } from "@/lib/woocommerce/products";
import { getCodAdvanceConfig } from "@/lib/woocommerce/checkout-settings";
import { getProductReviews } from "@/lib/woocommerce/reviews";
import {
  getHomePage,
  getProductContent,
  getSafetyGuides,
  getTestimonials,
} from "@/lib/wordpress/adapters";
import { stripHtml } from "@/lib/wordpress/format";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/config/site";
import {
  buildFaqSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildLocalBusinessSchema,
} from "@/lib/seo/structured-data";
import type { Media } from "@/types";

export const dynamic = "force-dynamic";

const SITE_URL = siteConfig.frontendUrl.replace(/\/$/, "");
const HOME_H1 = "Fire Extinguisher for Home: 2 kg ABC, Ready for Indian Homes";
const HOME_INTRO =
  "Buy a 2 kg ABC fire extinguisher for home, packed with an automatic fire ball and a fire blanket in one complete kit. Made in Udaipur by Speciality Geochem, with free delivery and cash on delivery across India.";

export async function generateMetadata(): Promise<Metadata> {
  // The CMS "home" page only carries the title "Home", so the home SEO is defined here.
  return buildSeoMetadata({
    fallbackTitle: "Buy Fire Extinguisher for Home | 2 kg ABC | Graha Kavach",
    fallbackDescription:
      "Buy a 2 kg ABC fire extinguisher for home, packed with an automatic fire ball and fire blanket. Free delivery and COD across India.",
    path: "/",
    keywords: [
      "home fire safety kit",
      "fire extinguisher for home",
      "automatic fire ball",
      "fire blanket for kitchen",
      "residential fire safety India",
      "Graha Kavach",
      "Speciality Geochem Udaipur",
      "fire safety equipment Rajasthan",
      "kitchen fire safety kit",
      "2kg ABC dry powder extinguisher",
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Fallback copy                                                       */
/*                                                                     */
/* Used only where the CMS has nothing yet. Every line here is either  */
/* a statement of fact about the kit or a description of its purpose:  */
/* no certifications, no ratings, no claims about performance.         */
/* ------------------------------------------------------------------ */

const HOME_TRUST = [
  { title: "Three-in-one safety kit", text: "2 kg ABC fire extinguisher, fire ball and fire blanket together" },
  { title: "Ready to mount", text: "Bracket, stand and fixings included in the box" },
  { title: "Made in India", text: "Manufactured by Speciality Geochem, Udaipur, delivered across India" },
  { title: "Built for real homes", text: "Designed for kitchens, electrical panels and everyday risk spots" },
];

const HOME_KIT_CONTENTS = [
  {
    title: "2 kg ABC Dry Powder Fire Extinguisher",
    summary: "Manual first response for small, early-stage fires when it is safe to approach",
  },
  {
    title: "Automatic Fire Extinguisher Ball",
    summary:
      "Flame-activated support for risk points such as an electrical panel, gas cylinder area or store room",
  },
  {
    title: "Fire Blanket, 1 m x 1 m",
    summary:
      "Smothers a small contained fire by cutting off oxygen, especially useful for kitchen pan fires",
  },
  {
    title: "Extinguisher Wall Bracket",
    summary: "Keeps the extinguisher visible, upright and easy to lift in an emergency",
  },
  {
    title: "Fire Ball Stand",
    summary: "Holds the fire ball near the risk point you want covered",
  },
  {
    title: "Screws and Wall Plugs",
    summary: "Five screws and five wall plugs supplied for the bracket and fire ball stand",
  },
];

const HOME_IMAGE_CARDS = [
  { caption: "Electrical panel", alt: "Fire ball and fire extinguisher for home near an electrical panel" },
  { caption: "Living area", alt: "ABC fire extinguisher mounted in a home living area" },
  { caption: "Kitchen", alt: "Fire blanket and kitchen fire extinguisher within reach of the stove" },
  { caption: "Gas cylinder and store room", alt: "Automatic fire ball placed near a gas cylinder area" },
];

const HOME_FAQS = [
  {
    q: "What is inside the Graha Kavach fire safety kit?",
    a: "The kit has a 2 kg ABC dry powder fire extinguisher, an automatic fire ball and a 1 m x 1 m fire blanket. It also includes a wall bracket, a fire ball stand, five screws and five wall plugs, so it is ready to mount.",
  },
  {
    q: "Which is the best fire extinguisher for home use?",
    a: "It depends on the risks in your home. A 2 kg ABC dry powder extinguisher suits most small household fires, and pairing it with a fire blanket and an automatic fire ball adds coverage for kitchen and electrical risk points.",
  },
  {
    q: "When should I use this kit?",
    a: "Use it on small, early-stage fires only. If a fire is spreading or you cannot reach the exit safely, leave the house and call 101 or 112.",
  },
  {
    q: "What is the extinguisher capacity?",
    a: "The extinguisher is a 2 kg ABC dry powder unit. It is compact and easy to lift, with a discharge time of roughly 10-12 seconds.",
  },
  {
    q: "Can I use an ABC fire extinguisher in a home kitchen?",
    a: "It can handle small fires involving solids, liquids and gases. For burning oil in a pan, cover it with the fire blanket instead of spraying.",
  },
  {
    q: "How does the automatic fire ball work?",
    a: "Place it near a risk point such as an electrical panel, gas cylinder area or store room. It releases its powder when flame reaches it. It needs no electricity and no one has to operate it.",
  },
  {
    q: "Where should I place each item?",
    a: "Keep the extinguisher visible and reachable on your way out. Keep the blanket near the kitchen, within reach without crossing the cooking area. Set the fire ball near the electrical or gas risk point it is meant to cover.",
  },
  {
    q: "Can I use water on an oil or grease fire?",
    a: "No. Water can spread burning oil and cause a flare-up. Use the fire blanket for a small pan fire.",
  },
  {
    q: "Do you deliver the fire safety kit across India?",
    a: "Yes. Graha Kavach delivers across India with free delivery. You can also choose Cash on Delivery by booking with Rs 199 and paying the remaining Rs 2,300 on delivery.",
  },
  {
    q: "Is this fire safety kit suitable for flats and apartments?",
    a: "Yes. The kit is compact, and the bracket, stand, screws and wall plugs are included, so you can mount it in a flat, house or shop.",
  },
  {
    q: "Does the kit replace the fire service?",
    a: "No. It is meant for small, early-stage fires. If a fire is spreading, evacuate first and call 101 or 112.",
  },
  {
    q: "How often should I check the kit?",
    a: "Check the extinguisher gauge and the physical condition of all three items every month, and follow the manufacturer's guidance for replacement or servicing.",
  },
].map((faq, index) => ({ id: String(index + 1), title: faq.q, answer: faq.a }));

const FALLBACK_ROLES: Array<Omit<ProductRole, "image">> = [
  {
    name: "2 kg ABC Dry Powder Extinguisher",
    role: "Used by hand",
    description:
      "The device you reach for when a fire is small and you can approach it safely. ABC powder covers ordinary combustibles, flammable liquids and live electrical equipment.",
    placeholderLabel: "Fire Extinguisher Image",
  },
  {
    name: "Automatic Fire Ball",
    role: "Acts on its own",
    description:
      "Mounted near a known risk area, it responds to flame contact without anyone present — which matters for a cupboard or a panel nobody is standing next to.",
    placeholderLabel: "Fire Ball Image",
  },
  {
    name: "Fire Blanket, 1 m × 1 m",
    role: "Smothers",
    description:
      "Cuts off air to a small contained fire. The right first response to a pan on a stove, where powder would spread burning oil.",
    placeholderLabel: "Fire Blanket Image",
  },
];

const FALLBACK_FEATURES = [
  "2 kg ABC dry powder extinguisher with pressure gauge",
  "Automatic fire ball with mounting stand",
  "1 m × 1 m fibreglass fire blanket in a quick-release pouch",
  "Wall bracket, screws and wall plugs included",
];

/**
 * Picks the gallery image that matches a product by name.
 *
 * WooCommerce returns gallery images in upload order, so relying on the index
 * alone would silently mis-label the three role cards the first time someone
 * reorders the gallery in the admin. Matching on the filename and alt text is
 * stable across that, and the index is only the last resort.
 */
function pickImage(gallery: Media[], keywords: string[], fallbackIndex: number): Media | null {
  const match = gallery.find((image) => {
    const haystack = `${image.url} ${image.alt}`.toLowerCase();
    return keywords.every((keyword) => haystack.includes(keyword));
  });

  return match ?? gallery[fallbackIndex] ?? null;
}

export default async function Home() {
  const [product, codAdvance] = await Promise.all([getPrimaryProduct(), getCodAdvanceConfig()]);
  const summary = wooProductToSummary(product);

  const [homePage, productContent, reviews, testimonials, safetyGuides] = await Promise.all([
    getHomePage().catch((err) => {
      console.error("Failed to load homePage from CMS:", err);
      return null;
    }),
    getProductContent(product.slug).catch((err) => {
      console.error("Failed to load productContent from CMS:", err);
      return null;
    }),
    getProductReviews(product.id).catch((err) => {
      console.error("Failed to load product reviews:", err);
      return [];
    }),
    getTestimonials(9).catch((err) => {
      console.error("Failed to load testimonials:", err);
      return [];
    }),
    getSafetyGuides(8).catch((err) => {
      console.error("Failed to load safety guides:", err);
      return [];
    }),
  ]);

  const gallery: Media[] = [
    ...(productContent?.heroMedia ? [productContent.heroMedia] : []),
    ...wooProductGallery(product),
    ...(productContent?.galleryAdditions ?? []),
  ];

  const kitImage = pickImage(gallery, ["kit"], 0) ?? summary.image;
  const extinguisherImage = pickImage(gallery, ["extinguisher"], 1);
  const ballImage = pickImage(gallery, ["ball"], 2);
  const blanketImage = pickImage(gallery, ["blanket"], 3);

  const unpublished = product.status !== "publish";
  const unavailable = unpublished || summary.stockStatus === "outofstock";

  /* Hero copy: CMS first, then the product content, then the fallback. */
  const heroTitle =
    homePage?.heroTitle ||
    productContent?.headline ||
    "Three layers of fire preparedness. One complete kit.";

  const heroDescription =
    homePage?.heroDescription ||
    productContent?.heroSupportingText ||
    stripHtml(product.short_description) ||
    "An extinguisher for when you can act, a fire ball for when nobody is there, and a blanket for the kitchen — packed together with the hardware to mount them.";

  const trustItems = HOME_TRUST;

  /* The carousel replaces the built hero whenever banners exist in the CMS. */
  const hasBanners =
    (homePage?.heroBannersDesktop?.length ?? 0) > 0 ||
    (homePage?.heroBannersMobile?.length ?? 0) > 0;

  const roles: ProductRole[] = productContent?.roleCards.length
    ? productContent.roleCards.map((card, index) => ({
        name: card.title,
        role: card.role,
        description: card.text,
        image: [extinguisherImage, ballImage, blanketImage][index] ?? null,
        placeholderLabel: `${card.title} Image`,
      }))
    : FALLBACK_ROLES.map((role, index) => ({
        ...role,
        image: [extinguisherImage, ballImage, blanketImage][index] ?? null,
      }));

  const kitContents = HOME_KIT_CONTENTS;

  const features = productContent?.keyBenefits.length
    ? productContent.keyBenefits.map((benefit) => benefit.title)
    : FALLBACK_FEATURES;

  const faqItems = HOME_FAQS;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildLocalBusinessSchema(),
      // The full Product lives on /fire-safety-kit only. Two pages with the same Product @id told Google they were one page.
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: "Buy Fire Extinguisher for Home | 2 kg ABC | Graha Kavach",
        description:
          "Buy a 2 kg ABC fire extinguisher for home, packed with an automatic fire ball and fire blanket. Free delivery and COD across India.",
        inLanguage: "en-IN",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        mainEntity: { "@id": `${SITE_URL}/fire-safety-kit/#product` },
      },
      ...(buildFaqSchema(faqItems.map((faq) => ({ q: faq.title, a: faq.answer })))
        ? [buildFaqSchema(faqItems.map((faq) => ({ q: faq.title, a: faq.answer })))]
        : []),
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {hasBanners ? (
        <>
          {/*
           * The page still needs exactly one H1, and the banner artwork
           * carries its headline as pixels rather than text. This keeps the
           * document outline and the search result intact without drawing
           * anything over the banner. The built hero below renders its own
           * H1, so this one only exists on the carousel path.
           */}
          <HeroBanners
            desktop={homePage?.heroBannersDesktop ?? []}
            mobile={homePage?.heroBannersMobile ?? []}
            links={homePage?.heroBannerLinks ?? []}
            autoplaySeconds={homePage?.heroBannerAutoplay ?? null}
          />

          {/* The visible H1: the banner artwork is pixels, and a hidden H1 carries little weight. */}
          <section className="mx-auto w-[90%] max-w-[1100px] py-8 text-center lg:py-12">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">{HOME_H1}</h1>
            <p className="mt-4 text-base text-foreground-muted sm:text-lg">{HOME_INTRO}</p>
          </section>
        </>
      ) : (
        /* No banners uploaded yet — the built hero keeps the page complete. */
        <Hero
          eyebrow={homePage?.heroEyebrow || "Fire safety, made ready"}
          title={heroTitle}
          description={heroDescription}
          primaryCta={{
            label: homePage?.heroCtaPrimaryLabel || "Shop the Kit",
            href: homePage?.heroCtaPrimaryUrl || "/fire-safety-kit",
          }}
          secondaryCta={{
            label: homePage?.heroCtaSecondaryLabel || "How It Works",
            href: homePage?.heroCtaSecondaryUrl || "#how-it-works",
          }}
          kitImage={kitImage}
          partImages={[extinguisherImage, ballImage, blanketImage].filter(
            (image): image is Media => Boolean(image),
          )}
          trustItems={trustItems.map((item) => item.title)}
        />
      )}

      <TrustBar items={trustItems} />

      <HomeTextMarquee />

      <ProductBento
        heroImage={kitImage}
        items={roles as BentoItem[]}
        pieceCount={kitContents.length}
      />

      <CompleteKit image={kitImage} contents={kitContents} />

      <FeatureCarouselSection
        title={homePage?.featureCarouselTitle || ""}
        intro={homePage?.featureCarouselIntro || ""}
        images={homePage?.featureCarouselImages ?? []}
        autoplaySeconds={homePage?.featureCarouselAutoplay ?? 5}
        cards={HOME_IMAGE_CARDS}
      />

      <RiskAreas />

      <HowItWorks />

      <BuySection
        product={summary}
        stockQuantity={product.stock_quantity ?? null}
        gallery={gallery}
        features={features}
        unavailable={unavailable}
        unpublished={unpublished}
        codAdvance={codAdvance}
      />

      <Placement />

      <FounderSection notesHtml={productContent?.manufacturerNotes || null} />

      <FactorySection />

      <CertificationMarquee
        title="Certified and tested"
        certifications={productContent?.certifications ?? []}
      />

      <SafetyGuides
        guides={safetyGuides.map((g) => ({ id: g.id, title: g.title, summary: g.summary }))}
      />

      <ReviewsOrCommitment reviews={reviews} testimonials={testimonials} />

      <FaqSection
        title={homePage?.faqTitle || "Common questions"}
        items={faqItems.map((faq) => ({ id: faq.id, title: faq.title, answer: faq.answer }))}
      />

      <FinalCta image={kitImage} product={summary} unavailable={unavailable} codAdvance={codAdvance} />

      <HomeSeoContent />
    </main>
  );
}
