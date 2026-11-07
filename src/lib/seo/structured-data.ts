import { siteConfig } from "@/lib/config/site";
import { stripHtml } from "@/lib/wordpress/format";
import type { WooProduct } from "@/lib/woocommerce/types";
import type { WooReview as WooProductReview } from "@/lib/woocommerce/types";

const BASE_URL = siteConfig.frontendUrl.replace(/\/$/, "");

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "Graha Kavach",
    alternateName: "Graha Kavach Fire Safety",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      "@id": `${BASE_URL}/#logo`,
      url: `${BASE_URL}/brand/graha-kavach-logo.png`,
      caption: "Graha Kavach Home Fire Safety",
    },
    foundingDate: "2010",
    founder: {
      "@type": "Person",
      name: "Rakesh Mishra",
      url: "https://therakeshmishra.com/",
    },
    parentOrganization: {
      "@type": "Organization",
      name: "Speciality Geochem",
      url: "https://specialitygeochem.com/",
      address: {
        "@type": "PostalAddress",
        streetAddress: "RIICO Industrial Area",
        addressLocality: "Udaipur",
        addressRegion: "Rajasthan",
        postalCode: "313001",
        addressCountry: "IN",
      },
    },
    telephone: "+91-7891111390",
    email: "grahakavach@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "103, Ostwal Plaza 2, Sundarwas",
      addressLocality: "Udaipur",
      addressRegion: "Rajasthan",
      postalCode: "313001",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-7891111390",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
    sameAs: [
      "https://specialitygeochem.com/",
      "https://therakeshmishra.com/",
      "https://www.facebook.com/profile.php?id=61592687387001",
      "https://www.instagram.com/grahakavach/",
    ],
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "Graha Kavach",
    description: "Certified 3-in-1 residential and workplace fire safety solutions for Indian homes by Speciality Geochem, Udaipur.",
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    inLanguage: "en-IN",
    // No SearchAction: the site has no search page, and Google retired the sitelinks search box.
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path.startsWith("http")
        ? item.path
        : `${BASE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

/** A WebPage node that ties the page to the site, its breadcrumb and its main entity. */
export function buildWebPageSchema({
  path,
  name,
  description,
  image,
}: {
  path: string;
  name: string;
  description?: string;
  image?: string;
}) {
  const url = `${BASE_URL}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": ["WebPage", "ItemPage"],
    "@id": `${url}/#webpage`,
    url,
    name: stripHtml(name),
    description: description ? stripHtml(description) : undefined,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    about: { "@id": `${url}/#product` },
    primaryImageOfPage: image ? { "@type": "ImageObject", url: image } : undefined,
  };
}

export function buildProductSchema(
  product: WooProduct | null,
  reviews: WooProductReview[] = [],
  specs: string[][] = []
) {
  if (!product) return null;

  const cleanName = stripHtml(product.name);
  const cleanDescription = stripHtml(product.short_description || product.description);
  const price = product.sale_price || product.price || "2499";
  const inStock = product.stock_status === "instock";

  // Only include aggregateRating if real approved reviews exist!
  const hasApprovedReviews = reviews.length > 0 && product.rating_count > 0;
  const aggregateRating = hasApprovedReviews
    ? {
        "@type": "AggregateRating",
        ratingValue: product.average_rating || "5.0",
        reviewCount: product.rating_count,
        bestRating: "5",
        worstRating: "1",
      }
    : undefined;

  // Real review items if present
  const reviewSchema = hasApprovedReviews
    ? reviews.slice(0, 5).map((rev) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: rev.reviewer,
        },
        datePublished: rev.date_created,
        reviewBody: stripHtml(rev.review),
        reviewRating: {
          "@type": "Rating",
          ratingValue: rev.rating,
          bestRating: "5",
          worstRating: "1",
        },
      }))
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${BASE_URL}/fire-safety-kit/#product`,
    url: `${BASE_URL}/fire-safety-kit`,
    mainEntityOfPage: { "@id": `${BASE_URL}/fire-safety-kit/#webpage` },
    category: "Fire safety equipment",
    manufacturer: { "@type": "Organization", name: "Speciality Geochem", address: { "@type": "PostalAddress", addressLocality: "Udaipur", addressRegion: "Rajasthan", addressCountry: "IN" } },
    audience: { "@type": "Audience", audienceType: "Homeowners, kitchens, shops and small offices in India" },
    additionalProperty: specs
      .filter((row) => row[1] && row[2])
      .map(([group, label, value]) => ({
        "@type": "PropertyValue",
        name: `${group} ${label}`.trim(),
        value,
      })),
    name: cleanName,
    description: cleanDescription,
    image: product.images.map((img: { src: string }) => img.src),
    sku: product.sku || `GK-${product.id}`,
    mpn: "GK-KIT-001",
    brand: {
      "@type": "Brand",
      name: "Graha Kavach",
    },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/fire-safety-kit`,
      priceCurrency: "INR",
      price: price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "INR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Speciality Geochem",
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
      },
    },
    aggregateRating,
    review: reviewSchema,
  };
}

/** The named author of every guide: a person, not an organisation, so Google can attribute expertise. */
export const BLOG_AUTHOR = {
  name: "Rakesh Mishra",
  jobTitle: "Founder, Speciality Geochem",
  url: "https://therakeshmishra.com/",
} as const;

/**
 * WordPress sends dates without a zone ("2026-10-15T18:00:18", site time).
 * Schema dates need one, so India time is added when none is present.
 */
export function withIstOffset(date: string): string {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(date) ? date : `${date}+05:30`;
}

export function buildArticleSchema({
  title,
  excerpt,
  slug,
  date,
  modified,
  image,
}: {
  title: string;
  /** The page's meta description; falls back to the title, never a "[…]" excerpt. */
  excerpt?: string;
  slug: string;
  date: string;
  modified?: string;
  image?: string | null;
}) {
  const url = `${BASE_URL}/blog/${slug}`;
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    headline: stripHtml(title),
    description: stripHtml(excerpt || title),
    datePublished: withIstOffset(date),
    dateModified: withIstOffset(modified || date),
    author: {
      "@type": "Person",
      name: BLOG_AUTHOR.name,
      url: BLOG_AUTHOR.url,
      jobTitle: BLOG_AUTHOR.jobTitle,
      sameAs: [BLOG_AUTHOR.url],
    },
    publisher: { "@id": `${BASE_URL}/#organization` },
    about: { "@id": `${BASE_URL}/fire-safety-kit/#product` },
    image: image || undefined,
  };
}

export function buildFaqSchema(faqs: Array<{ q: string; a: string }>) {
  if (!faqs || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: stripHtml(faq.q),
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(faq.a),
      },
    })),
  };
}

export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/#localbusiness`,
    name: "Graha Kavach",
    description: "Certified fire safety equipment manufacturing and 3-in-1 domestic fire safety kits in Udaipur, Rajasthan.",
    url: BASE_URL,
    telephone: "+91-7891111390",
    email: "grahakavach@gmail.com",
    image: `${BASE_URL}/brand/graha-kavach-logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "103, Ostwal Plaza 2, Sundarwas",
      addressLocality: "Udaipur",
      addressRegion: "Rajasthan",
      postalCode: "313001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "24.5854",
      longitude: "73.7125",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:30",
        closes: "18:30",
      },
    ],
    priceRange: "₹₹",
  };
}

export function buildHowToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${BASE_URL}/how-it-works/#howto`,
    name: "How the Graha Kavach 3-in-1 Fire Safety System Protects Your Home",
    description: "Emergency fire response protocol combining 24/7 automated fire ball suppression, clean fire blanket smothering, and active PASS chemical extinguisher operation.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Layer 1: Automatic 24/7 Fire Ball Vigilance",
        text: "Position above electrical meter boards, kitchens or near LPG cylinders. Triggers automatically on direct flame contact within 3-5 seconds to disperse MAP powder and knock down flames without human presence.",
        url: `${BASE_URL}/how-it-works#layer-1`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Layer 2: Clean Kitchen Fire Blanket Smothering",
        text: "In the event of a kitchen oil fire or pan blaze, pull the quick-release tabs, protect your hands, and drape the 550°C fibreglass blanket gently over the fire to starve it of oxygen without toxic residues.",
        url: `${BASE_URL}/how-it-works#layer-2`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Layer 3: Active ABC Extinguisher PASS Protocol",
        text: "For spreading fires: Pull the safety pin, Aim nozzle at the base of the fire from 3-4 metres, Squeeze the lever, and Sweep side-to-side until extinguished.",
        url: `${BASE_URL}/how-it-works#layer-3`,
      },
    ],
  };
}

export function buildAboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${BASE_URL}/about/#webpage`,
    url: `${BASE_URL}/about`,
    name: "About Graha Kavach — 16 Years of Protection | Speciality Geochem (Est. 2010)",
    description: "Protecting workplaces for 16 years, now bringing certified 3-in-1 fire protection home. Founded by Rakesh Mishra with manufacturing roots dating back to 2010 in Udaipur, Rajasthan.",
    mainEntity: {
      "@type": "Organization",
      name: "Speciality Geochem",
      foundingDate: "2010",
      founder: {
        "@type": "Person",
        name: "Rakesh Mishra",
        sameAs: "https://therakeshmishra.com/",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Udaipur",
        addressRegion: "Rajasthan",
        addressCountry: "IN",
      },
    },
  };
}

export function buildContactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${BASE_URL}/contact/#webpage`,
    url: `${BASE_URL}/contact`,
    name: "Contact Graha Kavach — Fire Safety Consultation & Support, Udaipur",
    description: "Direct fire safety consultation, bulk orders, and support in Udaipur, Rajasthan.",
    mainEntity: {
      "@id": `${BASE_URL}/#organization`,
    },
  };
}
