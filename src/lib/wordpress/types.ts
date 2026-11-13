import { z } from "zod";

const cmsString = z.string().nullable().optional().transform((value) => value ?? "");
const cmsEmail = z
  .string()
  .email()
  .or(z.literal(""))
  .nullable()
  .optional()
  .transform((value) => value ?? "");
const cmsUrl = z
  .string()
  .url()
  .or(z.literal(""))
  .nullable()
  .optional()
  .transform((value) => value ?? "");

export const wpMediaSchema = z.object({
  id: z.number().nullable().optional().transform((value) => value ?? 0),
  url: z.string().url(),
  alt: cmsString,
  width: z.number().nullable().optional().transform((value) => value ?? null),
  height: z.number().nullable().optional().transform((value) => value ?? null),
  mime: cmsString,
});

export const wpLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

export const wpNavRowSchema = z.object({
  group: cmsString,
  label: z.string().min(1),
  url: z.string().min(1),
});

export const wpTitleTextRowSchema = z.object({
  title: z.string().min(1),
  text: cmsString,
});

export const wpSpecRowSchema = z.object({
  group: cmsString,
  label: z.string().min(1),
  value: z.string().min(1),
});

export const wpWarningRowSchema = z.object({
  level: cmsString,
  title: z.string().min(1),
  text: cmsString,
});

export const wpLabelValueRowSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const wpFaqSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  answer: cmsString,
  group: cmsString,
});

export const wpSafetyGuideSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: cmsString,
  body: cmsString,
  image: wpMediaSchema.nullable().optional(),
  order: z.number().nullable().optional(),
});

export const wpSiteSettingsSchema = z.object({
  logoPrimary: wpMediaSchema.nullable().optional(),
  phonePrimary: cmsString,
  phoneAlternate: cmsString,
  emailPrimary: cmsEmail,
  emailSupport: cmsEmail,
  whatsappNumber: cmsString,
  whatsappMessage: cmsString,
  address: cmsString,
  mapsUrl: cmsUrl,
  facebook: cmsUrl,
  instagram: cmsUrl,
  linkedin: cmsUrl,
  youtube: cmsUrl,
  x: cmsUrl,
  announcementEnabled: z.boolean().optional().default(false),
  announcementText: cmsString,
  announcementLink: cmsString,
  ctaLabel: cmsString,
  ctaUrl: cmsString,
  description: cmsString,
  navGroups: z.array(wpNavRowSchema).optional().default([]),
  legalLinks: z.array(wpLinkSchema).optional().default([]),
  copyright: cmsString,
});

export const wpCertificationSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  issuer: cmsString,
  number: cmsString,
  summary: cmsString,
  image: wpMediaSchema.nullable().optional(),
  document: wpMediaSchema.nullable().optional(),
});

export const wpKitItemSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: cmsString,
  role: cmsString,
  quantity: cmsString,
  image: wpMediaSchema.nullable().optional(),
  specs: z.array(wpLabelValueRowSchema).optional().default([]),
});

/**
 * A customer testimonial as managed in WordPress.
 *
 * `rating` is nullable because the CMS field is optional and its hint tells
 * editors to record one only when a real customer actually gave it. The
 * storefront shows a rating only when there is one.
 */
export const wpTestimonialSchema = z.object({
  id: z.number(),
  title: cmsString,
  quote: cmsString,
  author: cmsString,
  location: cmsString,
  rating: z.number().nullable().optional().transform((value) => value ?? null),
  image: wpMediaSchema.nullable().optional(),
});

/** One published WordPress page, as listed for the policy routes. */
export const wpPageIndexSchema = z.object({
  gkIsLanding: z.boolean().nullable().optional().transform((value) => value ?? false),
  databaseId: z.number(),
  slug: z.string().min(1),
  title: z.string().min(1),
  menuOrder: z.number().nullable().optional().transform((value) => value ?? 0),
});

export const wpProductContentSchema = z.object({
  tagline: cmsString,
  headline: cmsString,
  heroSupportingText: cmsString,
  heroMedia: wpMediaSchema.nullable().optional(),
  galleryAdditions: z.array(wpMediaSchema).optional().default([]),
  videoUrl: cmsUrl,
  kitContents: z.array(wpKitItemSchema).optional().default([]),
  keyBenefits: z.array(wpTitleTextRowSchema).optional().default([]),
  riskLocations: z.array(wpTitleTextRowSchema).optional().default([]),
  roleCards: z
    .array(z.object({ title: z.string(), role: cmsString, text: cmsString }))
    .optional()
    .default([]),
  specifications: z.array(wpSpecRowSchema).optional().default([]),
  installation: cmsString,
  usage: cmsString,
  warnings: z.array(wpWarningRowSchema).optional().default([]),
  faqs: z.array(wpFaqSchema).optional().default([]),
  certifications: z.array(wpCertificationSchema).optional().default([]),
  brochure: wpMediaSchema.nullable().optional(),
  manufacturerNotes: cmsString,
  supportCtaLabel: cmsString,
  supportCtaUrl: cmsString,
});

export const wpYoastSeoSchema = z.object({
  title: cmsString,
  metaDesc: cmsString,
  canonical: cmsString,
  metaRobotsNoindex: cmsString,
  metaRobotsNofollow: cmsString,
  opengraphTitle: cmsString,
  opengraphDescription: cmsString,
  opengraphImage: z
    .object({
      sourceUrl: z.string().url().optional(),
    })
    .nullable()
    .optional(),
});

export const wpPageSchema = z.object({
  gkIsLanding: z.boolean().nullable().optional().transform((value) => value ?? false),
  id: z.string().optional(),
  databaseId: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  uri: cmsString,
  frontendUri: cmsString,
  excerpt: cmsString,
  content: cmsString,
  seo: wpYoastSeoSchema.nullable().optional(),
});

export const wpPostSchema = wpPageSchema.extend({
  date: z.string(),
  modified: z.string().nullable().optional().transform((value) => value ?? ""),
  categories: z
    .object({
      nodes: z.array(z.object({ name: z.string(), slug: z.string() })),
    })
    .optional(),
  featuredImage: z
    .object({
      node: z
        .object({
          sourceUrl: z.string().url().optional(),
          altText: z.string().optional().default(""),
          mediaDetails: z
            .object({
              width: z.number().nullable().optional(),
              height: z.number().nullable().optional(),
            })
            .optional(),
        })
        .nullable(),
    })
    .nullable()
    .optional(),
});

export const wpTimelineRowSchema = z.object({
  year: cmsString,
  title: z.string().min(1),
  text: cmsString,
});

export const wpAboutSchema = z.object({
  intro: cmsString,
  story: cmsString,
  mission: cmsString,
  vision: cmsString,
  manufacturer: cmsString,
  timeline: z.array(wpTimelineRowSchema).optional().default([]),
  experience: cmsString,
  quality: cmsString,
  certifications: z.array(wpCertificationSchema).optional().default([]),
  facilityImages: z.array(wpMediaSchema).optional().default([]),
  ctaTitle: cmsString,
  ctaText: cmsString,
  ctaLabel: cmsString,
  ctaUrl: cmsString,
});

const textRow = z.object({ text: z.string().min(1) });

/** The /book-now campaign landing page. Every field is optional so a half-filled page still renders. */
export const wpLandingSchema = z.object({
  pageId: z.number().nullable().optional().transform((v) => v ?? 0),
  productSlug: cmsString,
  hideTimer: z.boolean().nullable().optional().transform((v) => v ?? false),
  topbarText: cmsString,
  endTime: cmsString,
  endsAt: cmsString,
  cycleDays: cmsString,
  timerLabel: cmsString,
  timerUnits: cmsString,
  stickyLabel: cmsString,
  lockLabel: cmsString,
  headerTagline: cmsString,
  ctaShort: cmsString,
  ctaLabel: cmsString,
  ctaSticky: cmsString,
  ctaOffer: cmsString,
  heroBadge: cmsString,
  heroTitleBefore: cmsString,
  heroTitleHighlight: cmsString,
  heroTitleAfter: cmsString,
  heroText: cmsString,
  heroImage: wpMediaSchema.nullable().optional(),
  heroImageTag: cmsString,
  priceChip: cmsString,
  nowLabel: cmsString,
  nowNote: cmsString,
  laterLabel: cmsString,
  laterNote: cmsString,
  heroTrust: z.array(textRow).nullable().optional().transform((v) => v ?? []),
  ticker: z.array(textRow).nullable().optional().transform((v) => v ?? []),
  whyEyebrow: cmsString,
  whyTitle: cmsString,
  statBig: cmsString,
  statText: cmsString,
  statSource: cmsString,
  whyPoints: z.array(wpTitleTextRowSchema).nullable().optional().transform((v) => v ?? []),
  kitEyebrow: cmsString,
  kitTitle: cmsString,
  kitItems: z
    .array(z.object({ title: z.string().min(1), text: z.string().min(1), focus: z.string().min(1) }))
    .nullable()
    .optional()
    .transform((v) => v ?? []),
  kitImages: z.array(wpMediaSchema).nullable().optional().transform((v) => v ?? []),
  kitExtra: cmsString,
  kitBadges: z.array(textRow).nullable().optional().transform((v) => v ?? []),
  offerTitle: cmsString,
  offerPoints: z.array(textRow).nullable().optional().transform((v) => v ?? []),
  offerNote: cmsString,
  stepsTitle: cmsString,
  steps: z.array(wpTitleTextRowSchema).nullable().optional().transform((v) => v ?? []),
  whereTitle: cmsString,
  whereImage: wpMediaSchema.nullable().optional(),
  whereCaption: cmsString,
  whereTiles: z
    .array(z.object({ label: z.string().min(1), focus: z.string().min(1) }))
    .nullable()
    .optional()
    .transform((v) => v ?? []),
  whereTileImages: z.array(wpMediaSchema).nullable().optional().transform((v) => v ?? []),
  reviews: z
    .array(z.object({ quote: z.string().min(1), name: z.string().min(1) }))
    .nullable()
    .optional()
    .transform((v) => v ?? []),
  trustBold: cmsString,
  trustText: cmsString,
  faqTitle: cmsString,
  faqs: z
    .array(z.object({ q: z.string().min(1), a: z.string().min(1) }))
    .nullable()
    .optional()
    .transform((v) => v ?? []),
  finalKicker: cmsString,
  finalTitle: cmsString,
  finalText: cmsString,
  contactLabel: cmsString,
  phone: cmsString,
  footerText: cmsString,
  detailsTitle: cmsString,
  detailsSub: cmsString,
  detailsNote: cmsString,
  payTitle: cmsString,
  paySecure: cmsString,
  doneTitle: cmsString,
  doneText: cmsString,
  doneSteps: z.array(textRow).nullable().optional().transform((v) => v ?? []),
  doneWhatsappLabel: cmsString,
  whatsappKeyword: cmsString,
  doneHomeLabel: cmsString,
});

export type WpMedia = z.infer<typeof wpMediaSchema>;
export type WpLanding = z.infer<typeof wpLandingSchema>;
export type WpFaq = z.infer<typeof wpFaqSchema>;
export type WpCertification = z.infer<typeof wpCertificationSchema>;
export type WpKitItem = z.infer<typeof wpKitItemSchema>;
export type WpProductContent = z.infer<typeof wpProductContentSchema>;
export type WpTestimonial = z.infer<typeof wpTestimonialSchema>;
export type WpPageIndex = z.infer<typeof wpPageIndexSchema>;
export type WpSafetyGuide = z.infer<typeof wpSafetyGuideSchema>;
export type WpSiteSettings = z.infer<typeof wpSiteSettingsSchema>;
export type WpPage = z.infer<typeof wpPageSchema>;
export type WpPost = z.infer<typeof wpPostSchema>;
export type WpAbout = z.infer<typeof wpAboutSchema>;
export type WpTimelineRow = z.infer<typeof wpTimelineRowSchema>;

export type YoastHeadJson = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: Record<string, string>;
  og_title?: string;
  og_description?: string;
  og_url?: string;
  og_image?: Array<{ url?: string; width?: number; height?: number }>;
  twitter_title?: string;
  twitter_description?: string;
  twitter_card?: string;
  schema?: unknown;
};
