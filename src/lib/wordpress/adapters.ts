import { z } from "zod";
import { CacheTag, Revalidate } from "@/lib/cache";
import { brandAssets } from "@/lib/config/brand";
import { isDataError } from "@/lib/errors";
import {
  ABOUT_QUERY,
  CATEGORIES_QUERY,
  FAQS_QUERY,
  GLOBAL_SETTINGS_QUERY,
  HOMEPAGE_QUERY,
  LANDING_QUERY,
  LANDING_SLUGS_QUERY,
  PAGE_SEO_BY_ID_QUERY,
  PAGE_BY_SLUG_QUERY,
  PAGES_INDEX_QUERY,
  POST_BY_SLUG_QUERY,
  POSTS_QUERY,
  PRODUCT_CONTENT_QUERY,
  SAFETY_GUIDES_QUERY,
  TESTIMONIALS_QUERY,
} from "@/lib/wordpress/queries";
import {
  wpAboutSchema,
  wpFaqSchema,
  wpLandingSchema,
  wpMediaSchema,
  wpPageIndexSchema,
  wpPageSchema,
  wpPostSchema,
  wpProductContentSchema,
  wpSafetyGuideSchema,
  wpSiteSettingsSchema,
  wpTestimonialSchema,
  type WpAbout,
  type WpFaq,
  type WpMedia,
  type WpPage,
  type WpPost,
  type WpProductContent,
  type WpSafetyGuide,
  type WpSiteSettings,
  type WpTestimonial,
} from "@/lib/wordpress/types";
import { wpGraphql } from "./client";

export type NavItem = { label: string; href: string };

export type GlobalSiteSettings = {
  brandName: string;
  logo: WpMedia | null;
  announcement: { text: string; href: string } | null;
  cta: NavItem;
  contact: {
    phone: string;
    alternatePhone: string;
    email: string;
    supportEmail: string;
    address: string;
    whatsapp: string;
    mapsUrl: string;
  };
  headerNavigation: NavItem[];
  footerGroups: Array<{ title: string; links: NavItem[] }>;
  legalLinks: NavItem[];
  socialLinks: NavItem[];
  description: string;
  copyright: string;
};

const settingsResponseSchema = z.object({
  grahaKavachSettings: wpSiteSettingsSchema.nullable(),
});

const pageResponseSchema = z.object({
  page: wpPageSchema.nullable(),
});

const postResponseSchema = z.object({
  post: wpPostSchema.nullable(),
});

const postsResponseSchema = z.object({
  posts: z.object({ nodes: z.array(wpPostSchema) }),
});

const faqsResponseSchema = z.object({
  grahaKavachFaqs: z.array(wpFaqSchema).nullable(),
});

const safetyGuidesResponseSchema = z.object({
  grahaKavachSafetyGuides: z.array(wpSafetyGuideSchema).nullable(),
});

const homepageResponseSchema = z.object({
  grahaKavachHomepage: z
    .object({
      heroBannersDesktop: z.array(wpMediaSchema).nullable().optional().default([]),
      heroBannersMobile: z.array(wpMediaSchema).nullable().optional().default([]),
      heroBannerLinks: z
        .array(z.object({ label: z.string().optional().default(""), url: z.string().optional().default("") }))
        .nullable()
        .optional()
        .default([]),
      heroBannerAutoplay: z.number().nullable().optional().default(null),
      featureCarouselTitle: z.string().optional().default(""),
      featureCarouselIntro: z.string().optional().default(""),
      featureCarouselImages: z.array(wpMediaSchema).nullable().optional().default([]),
      featureCarouselAutoplay: z.number().nullable().optional().default(null),
      heroEyebrow: z.string().optional().default(""),
      heroTitle: z.string().optional().default(""),
      heroDescription: z.string().optional().default(""),
      heroCtaPrimaryLabel: z.string().optional().default(""),
      heroCtaPrimaryUrl: z.string().optional().default(""),
      heroCtaSecondaryLabel: z.string().optional().default(""),
      heroCtaSecondaryUrl: z.string().optional().default(""),
      heroVisualDesktop: z.any().nullable().optional(),
      trustItems: z.array(z.object({ title: z.string(), text: z.string().optional().default("") })).optional().default([]),
      faqTitle: z.string().optional().default(""),
      faqs: z.array(wpFaqSchema).optional().default([]),
    })
    .nullable(),
});

const productContentResponseSchema = z.object({
  grahaKavachProductContent: wpProductContentSchema.nullable(),
});

const aboutResponseSchema = z.object({
  grahaKavachAbout: wpAboutSchema.nullable(),
});

const categoriesResponseSchema = z.object({
  categories: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        databaseId: z.number(),
        name: z.string(),
        slug: z.string(),
        count: z.number().nullable().optional(),
      })
    ),
  }),
});


function normalizeHref(href: string) {
  if (!href) return "/";
  if (href.startsWith("http")) return href;
  return href.startsWith("/") ? href : `/${href}`;
}

function groupFooterLinks(rows: WpSiteSettings["navGroups"]): GlobalSiteSettings["footerGroups"] {
  const groups = new Map<string, NavItem[]>();

  for (const row of rows) {
    const group = row.group || "Quick links";
    groups.set(group, [...(groups.get(group) || []), { label: row.label, href: normalizeHref(row.url) }]);
  }

  return Array.from(groups, ([title, links]) => ({ title, links }));
}

function socialLinks(settings: WpSiteSettings): NavItem[] {
  return [
    ["Facebook", settings.facebook],
    ["Instagram", settings.instagram],
    ["LinkedIn", settings.linkedin],
    ["YouTube", settings.youtube],
    ["X", settings.x],
  ]
    .filter((item): item is [string, string] => Boolean(item[1]))
    .map(([label, href]) => ({ label, href }));
}

export async function getGlobalSiteSettings(): Promise<GlobalSiteSettings> {
  const data = await wpGraphql<z.infer<typeof settingsResponseSchema>>({
    query: GLOBAL_SETTINGS_QUERY,
    schema: settingsResponseSchema,
    tags: [CacheTag.settings],
    revalidate: Revalidate.settings,
  });

  const settings = data.grahaKavachSettings;

  if (!settings) {
    throw new Error("Global site settings are missing in WordPress.");
  }

  const headerNavigation: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Fire Safety Kit", href: "/fire-safety-kit" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Safety Guide", href: "/safety-guide" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  return {
    brandName: "Graha Kavach",
    logo: brandAssets.logo,
    announcement:
      settings.announcementEnabled && settings.announcementText
        ? { text: settings.announcementText, href: normalizeHref(settings.announcementLink) }
        : null,
    cta: {
      // The header button recruits dealers; it overrides the CTA set in WordPress settings.
      label: "Become a Dealer",
      href: "/become-a-dealer",
    },
    contact: {
      phone: settings.phonePrimary,
      alternatePhone: settings.phoneAlternate,
      email: settings.emailPrimary,
      supportEmail: settings.emailSupport,
      address: settings.address,
      whatsapp: settings.whatsappNumber,
      mapsUrl: settings.mapsUrl,
    },
    headerNavigation,
    footerGroups: groupFooterLinks(settings.navGroups),
    legalLinks: settings.legalLinks.map((link) => ({
      label: link.label,
      href: normalizeHref(link.url),
    })),
    socialLinks: socialLinks(settings),
    description: settings.description,
    copyright: settings.copyright,
  };
}

export async function getPageBySlug(slug: string): Promise<WpPage | null> {
  const data = await wpGraphql<z.infer<typeof pageResponseSchema>>({
    query: PAGE_BY_SLUG_QUERY,
    variables: { slug },
    schema: pageResponseSchema,
    tags: [CacheTag.page(slug)],
    revalidate: Revalidate.content,
  });

  return data.page;
}

/** WordPress sample content that must never be public. */
const PLACEHOLDER_POST_SLUGS = new Set(["hello-world"]);

export async function getPosts(first = 9): Promise<WpPost[]> {
  const data = await wpGraphql<z.infer<typeof postsResponseSchema>>({
    query: POSTS_QUERY,
    variables: { first },
    schema: postsResponseSchema,
    tags: [CacheTag.posts],
    revalidate: Revalidate.posts,
  });

  return data.posts.nodes.filter((post) => !PLACEHOLDER_POST_SLUGS.has(post.slug));
}

export async function getPostBySlug(slug: string): Promise<WpPost | null> {
  if (PLACEHOLDER_POST_SLUGS.has(slug)) return null;

  const data = await wpGraphql<z.infer<typeof postResponseSchema>>({
    query: POST_BY_SLUG_QUERY,
    variables: { slug },
    schema: postResponseSchema,
    tags: [CacheTag.posts, CacheTag.post(slug)],
    revalidate: Revalidate.posts,
  });

  return data.post;
}

export async function getFaqs(limit = 100): Promise<WpFaq[]> {
  const data = await wpGraphql<z.infer<typeof faqsResponseSchema>>({
    query: FAQS_QUERY,
    variables: { limit },
    schema: faqsResponseSchema,
    tags: [CacheTag.faqs],
    revalidate: Revalidate.content,
  });

  return data.grahaKavachFaqs ?? [];
}

export async function getSafetyGuides(limit = 100): Promise<WpSafetyGuide[]> {
  const data = await wpGraphql<z.infer<typeof safetyGuidesResponseSchema>>({
    query: SAFETY_GUIDES_QUERY,
    variables: { limit },
    schema: safetyGuidesResponseSchema,
    tags: [CacheTag.safetyGuides],
    revalidate: Revalidate.content,
  });

  return data.grahaKavachSafetyGuides ?? [];
}

export async function getHomePage() {
  try {
    const data = await wpGraphql<z.infer<typeof homepageResponseSchema>>({
      query: HOMEPAGE_QUERY,
      schema: homepageResponseSchema,
      tags: [CacheTag.page("home"), CacheTag.faqs],
      revalidate: Revalidate.content,
    });

    return data.grahaKavachHomepage;
  } catch (error) {
    if (isDataError(error)) throw error;
    throw error;
  }
}

const landingResponseSchema = z.object({ grahaKavachLanding: wpLandingSchema.nullable() });
const landingSlugsResponseSchema = z.object({ grahaKavachLandingSlugs: z.array(z.string()).nullable() });
const pageSeoResponseSchema = z.object({ page: wpPageSchema.pick({ title: true, seo: true }).nullable() });

/** Content of one landing page by slug. Null when it is missing, unpublished or cannot be loaded. */
export async function getLanding(slug: string) {
  try {
    const data = await wpGraphql<z.infer<typeof landingResponseSchema>>({
      query: LANDING_QUERY,
      variables: { slug },
      schema: landingResponseSchema,
      tags: [CacheTag.page(slug), CacheTag.landings],
      revalidate: Revalidate.content,
    });

    return data.grahaKavachLanding;
  } catch (error) {
    console.warn("Failed to fetch landing page content:", error);
    return null;
  }
}

/** Slugs of every published landing page. */
export async function getLandingSlugs(): Promise<string[]> {
  try {
    const data = await wpGraphql<z.infer<typeof landingSlugsResponseSchema>>({
      query: LANDING_SLUGS_QUERY,
      schema: landingSlugsResponseSchema,
      tags: [CacheTag.landings],
      revalidate: Revalidate.content,
    });

    return data.grahaKavachLandingSlugs ?? [];
  } catch (error) {
    console.warn("Failed to fetch landing page slugs:", error);
    return [];
  }
}

/** Yoast SEO data of a landing page, by its WordPress page ID. */
export async function getLandingSeo(pageId: number, slug: string) {
  if (!pageId) return null;

  try {
    const data = await wpGraphql<z.infer<typeof pageSeoResponseSchema>>({
      query: PAGE_SEO_BY_ID_QUERY,
      variables: { id: String(pageId) },
      schema: pageSeoResponseSchema,
      tags: [CacheTag.page(slug)],
      revalidate: Revalidate.content,
    });

    return data.page;
  } catch (error) {
    console.warn("Failed to fetch landing page SEO:", error);
    return null;
  }
}

export async function getProductContent(slug: string): Promise<WpProductContent | null> {
  const data = await wpGraphql<z.infer<typeof productContentResponseSchema>>({
    query: PRODUCT_CONTENT_QUERY,
    variables: { slug },
    schema: productContentResponseSchema,
    tags: [CacheTag.product(slug), CacheTag.faqs, CacheTag.certifications, CacheTag.kitItems],
    revalidate: Revalidate.content,
  });

  return data.grahaKavachProductContent;
}

export async function getAboutContent(): Promise<WpAbout | null> {
  try {
    const data = await wpGraphql<z.infer<typeof aboutResponseSchema>>({
      query: ABOUT_QUERY,
      schema: aboutResponseSchema,
      tags: [CacheTag.page("about"), CacheTag.certifications],
      revalidate: Revalidate.content,
    });

    return data.grahaKavachAbout;
  } catch (error) {
    console.warn("Failed to fetch about content from GraphQL:", error);
    return null;
  }
}

export async function getCategories() {
  try {
    const data = await wpGraphql<z.infer<typeof categoriesResponseSchema>>({
      query: CATEGORIES_QUERY,
      schema: categoriesResponseSchema,
      tags: [CacheTag.posts],
      revalidate: Revalidate.content,
    });

    return data.categories.nodes.filter((cat) => cat.slug !== "uncategorized");
  } catch (error) {
    console.warn("Failed to fetch categories:", error);
    return [];
  }
}

export async function getRelatedPosts(categorySlug: string, currentSlug: string, limit = 3): Promise<WpPost[]> {
  const allPosts = await getPosts(15);
  return allPosts
    .filter(
      (post) =>
        post.slug !== currentSlug &&
        post.categories?.nodes.some((cat) => cat.slug === categorySlug)
    )
    .slice(0, limit);
}

const testimonialsResponseSchema = z.object({
  grahaKavachTestimonials: z.array(wpTestimonialSchema).nullable(),
});

const pagesIndexResponseSchema = z.object({
  pages: z.object({ nodes: z.array(wpPageIndexSchema) }),
});

/**
 * Editorial testimonials from the CMS.
 *
 * Rows without a quote are dropped: an empty testimonial card is worse than
 * one fewer card.
 */
export async function getTestimonials(limit = 12): Promise<WpTestimonial[]> {
  try {
    const data = await wpGraphql<z.infer<typeof testimonialsResponseSchema>>({
      query: TESTIMONIALS_QUERY,
      variables: { limit },
      schema: testimonialsResponseSchema,
      tags: [CacheTag.testimonials],
      revalidate: Revalidate.content,
    });

    return (data.grahaKavachTestimonials ?? []).filter((item) => item.quote.trim().length > 0);
  } catch (error) {
    console.warn("Failed to fetch testimonials:", error);
    return [];
  }
}

/*
 * Pages that already have a hand-built route in the app.
 *
 * These must never be served by the catch-all WordPress page route, or the CMS
 * copy of "home" would start competing with the real homepage. WooCommerce's
 * own pages are excluded for the same reason: the storefront implements cart
 * and checkout itself.
 */
const RESERVED_PAGE_SLUGS = new Set([
  "home",
  "about-us",
  "shop",
  "cart",
  "checkout",
  "my-account",
  "blog",
  "contact",
  "wishlist",
  // The campaign landing page has its own route and funnel.
  "book-now",
]);

export type PolicyPage = { slug: string; title: string; href: string; order: number };

/**
 * Every published WordPress page that the storefront should serve itself.
 *
 * This is what makes the policy pages CMS-driven end to end: the list of pages
 * decides both which URLs resolve and which links appear in the footer, so
 * publishing a new policy in wp-admin is the whole job.
 */
export async function getCmsPages(): Promise<PolicyPage[]> {
  try {
    const data = await wpGraphql<z.infer<typeof pagesIndexResponseSchema>>({
      query: PAGES_INDEX_QUERY,
      variables: { first: 100 },
      schema: pagesIndexResponseSchema,
      tags: [CacheTag.pages],
      revalidate: Revalidate.content,
    });

    return data.pages.nodes
      .filter((page) => !RESERVED_PAGE_SLUGS.has(page.slug) && !page.gkIsLanding)
      .map((page) => ({
        slug: page.slug,
        title: page.title,
        href: `/${page.slug}`,
        order: page.menuOrder,
      }))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  } catch (error) {
    console.warn("Failed to fetch CMS pages:", error);
    return [];
  }
}

/** True when a slug is served by its own route rather than the CMS page route. */
export function isReservedPageSlug(slug: string): boolean {
  return RESERVED_PAGE_SLUGS.has(slug);
}
