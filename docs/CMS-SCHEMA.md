# Graha Kavach — CMS Schema

**Status:** Phase 3 complete. Model is live on `admin.grahakavach.in`.
**Last verified:** 2026-09-20
**Owner:** `grahakavach-headless-core` plugin (see `wordpress-plugins/`)

---

## 1. How this model is built

Every field is declared once, in PHP, in
`includes/class-gk-model.php`. That manifest generates **both** the ACF field
groups and the GraphQL schema, so the editor UI and the API cannot drift apart.

Nothing was clicked together in wp-admin. Consequences worth knowing:

- The whole content model is in version control and reviewable in a diff.
- A fresh environment gets the identical model on plugin activation — there is
  no field-group export to import.
- **Editing field definitions in wp-admin will not work.** Change
  `class-gk-model.php` and redeploy.

### The ACF free constraint

This install runs **ACF free 6.8.10**. Repeater, Flexible Content, Options
Page, Gallery, Group and Clone are ACF Pro features and are not available.
Installing an unlicensed ACF Pro build was ruled out. The model therefore uses
three substitutes:

| Needed | Substitute used | Where |
| --- | --- | --- |
| Options Page | A singleton `gk_settings` post, surfaced as **Site Settings** in the admin menu. Creating a second one, or deleting it, is blocked at the capability layer. | Global settings |
| Repeater (simple rows) | **Structured lists** — one item per line, `\|`-separated columns. Parsed server-side into typed GraphQL objects. | Trust items, specs, timeline, nav groups, … |
| Repeater (rich, reusable) | **Custom post types** + a Relationship picker. | FAQs, certifications, testimonials, safety guides, kit items |
| Gallery | Relationship field limited to `attachment`, which gives the same multi-select-and-reorder behaviour. | Facility imagery, product gallery |

### Structured list syntax

```
Fast response|Discharges in 10-12 seconds
Wide throw|Reaches 3-4 metres
# lines starting with # are comments
```

Rules enforced by `class-gk-structured.php`:

- A row is kept only when **every** column has a value; partial rows are dropped
  rather than half-rendered.
- URL columns must be `http(s)` or a site-relative `/path`. `javascript:`,
  `data:` and protocol-relative `//host` values are rejected.
- HTML tags are stripped from text columns.
- Extra `|` characters fall into the final column, so prose can contain pipes.

The frontend never sees this syntax — GraphQL returns parsed objects.

---

## 2. Where content is edited

| Admin location | What it holds | GraphQL root field |
| --- | --- | --- |
| **Site Settings** | Brand, contact, social, header, footer, commerce copy, emergency copy | `grahaKavachSettings` |
| **Pages → Home** | Homepage composition | `grahaKavachHomepage` |
| **Pages → About Us** | About page | `grahaKavachAbout` |
| **Products → (any product)** | Editorial content supplementing WooCommerce | `grahaKavachProductContent` |
| **FAQs** | Reusable Q&A | `grahaKavachFaqs` |
| **Certifications** | Reusable certifications | `grahaKavachCertifications` |
| **Testimonials** | Reusable reviews | `grahaKavachTestimonials` |
| **Safety Guides** | Standalone educational content | `grahaKavachSafetyGuides` |
| **Kit Items** | The three protection products | `grahaKavachKitItems` |
| **Appearance → Menus** | Header and footer navigation | `menuItems(where: {location: GK_HEADER})` |
| **Settings → Graha Kavach Headless** | *Technical only* — frontend URL, CORS, revalidation, noindex | not exposed |

> The last row is deliberately separate. Phase 2 briefly kept brand and contact
> details on that technical screen; Phase 3 moved them into the ACF model so
> there is exactly one place to edit any given value.

---

## 3. Global settings — `grahaKavachSettings`

| Tab | GraphQL field | Type |
| --- | --- | --- |
| Brand | `logoPrimary`, `logoAlternate`, `favicon`, `shareImage` | `GrahaKavachMedia` |
| Contact | `phonePrimary`, `phoneAlternate`, `emailPrimary`, `emailSupport`, `whatsappNumber`, `whatsappMessage`, `address`, `mapsUrl` | `String` |
| Contact | `businessHours` | `[GrahaKavachHoursRow]` — `days`, `hours` |
| Social | `facebook`, `instagram`, `linkedin`, `youtube`, `x` | `String` |
| Header | `announcementEnabled` | `Boolean` |
| Header | `announcementText`, `announcementLink`, `ctaLabel`, `ctaUrl` | `String` |
| Footer | `description`, `supportDetails`, `copyright` | `String` |
| Footer | `logo` | `GrahaKavachMedia` |
| Footer | `navGroups` | `[GrahaKavachNavRow]` — `group`, `label`, `url` |
| Footer | `legalLinks` | `[GrahaKavachLinkRow]` — `label`, `url` |
| Commerce | `supportMessage`, `deliveryNote`, `secureCheckoutText`, `returnSummary`, `codLabel`, `serviceCtaLabel`, `serviceCtaUrl` | `String` |
| Emergency | `disclaimer`, `phoneInstruction`, `fireSafetyDisclaimer` | `String` |

**Footer navigation groups** build columns by repeating the group name:

```
Company|About Us|/about-us/
Company|Contact|/contact-us/
Support|Shipping|/shipping/
```

### Seeded initial values

Written **into the CMS** once, on first admin load, and never overwritten.
Taken from the live grahakavach.in site on 2026-09-20 — they are initial
content, not frontend constants:

| Field | Value |
| --- | --- |
| `phonePrimary` | `+91 7891111390` |
| `emailPrimary` | `grahakavach@gmail.com` |
| `address` | `103, Ostwal Plaza 2, Sundarwas, Udaipur (Raj.) India` |
| `mapsUrl` | Google Maps link for that address |
| `copyright` | `© <year> Graha Kavach. All rights reserved.` |
| `phoneInstruction` | `In a fire emergency, call 101 immediately.` |
| `disclaimer` | Evacuation-first guidance per `backend-content-model.md` |
| `fireSafetyDisclaimer` | Early-stage-response scope statement |

**Deliberately left empty:** WhatsApp number and message, and every social URL.
The live site publishes none of these, and the content model forbids guessing.
No certification or compliance claim was seeded for the same reason.

---

## 4. Homepage — `grahaKavachHomepage`

| Section | Fields |
| --- | --- |
| Hero | `heroEyebrow`, `heroTitle`, `heroHighlight`, `heroDescription`, `heroCtaPrimaryLabel/Url`, `heroCtaSecondaryLabel/Url`, `heroVisualDesktop`, `heroVisualMobile` |
| Trust bar | `trustItems` `[TitleTextRow]` |
| Brand story | `storyTitle`, `storyText` (HTML), `storyImage` |
| Three-product protection | `protectionTitle`, `protectionIntro`, `protectionItems` `[GrahaKavachKitItem]` |
| Risk locations | `riskTitle`, `riskIntro`, `riskItems` `[TitleTextRow]` |
| Why Graha Kavach | `whyTitle`, `whyItems` `[TitleTextRow]` |
| Inside the box | `insideBoxTitle`, `insideBoxIntro`, `insideBoxItems` `[GrahaKavachKitItem]` |
| Installation | `installTitle`, `installIntro`, `installSteps` `[TitleTextRow]`, `installImage` |
| How it works | `howTitle`, `howSteps` `[TitleTextRow]` |
| Certifications | `certificationsTitle`, `certificationsIntro`, `certifications` `[GrahaKavachCertification]` |
| Manufacturer | `manufacturerTitle`, `manufacturerText` (HTML), `manufacturerImage` |
| Testimonials | `testimonialsTitle`, `testimonialsIntro`, `testimonials` `[GrahaKavachTestimonial]` |
| FAQ | `faqTitle`, `faqs` `[GrahaKavachFaq]` |
| Bottom CTA | `ctaTitle`, `ctaText`, `ctaLabel`, `ctaUrl` |

---

## 5. About page — `grahaKavachAbout`

`intro`, `story` (HTML), `mission`, `vision`, `manufacturer` (HTML),
`timeline` `[GrahaKavachTimelineRow]` (`year`, `title`, `text`), `experience`,
`quality` (HTML), `certifications` `[GrahaKavachCertification]`,
`facilityImages` `[GrahaKavachMedia]`, `ctaTitle`, `ctaText`, `ctaLabel`, `ctaUrl`.

---

## 6. Product supplemental content — `grahaKavachProductContent`

Takes `productId: Int` or `slug: String`.

**This never duplicates WooCommerce.** Price, stock, SKU, weight, tax class and
the core gallery stay in WooCommerce and are read by the frontend over the
WooCommerce REST API. This group carries only editorial content, joined to the
commerce payload on product ID.

| Tab | Fields |
| --- | --- |
| Hero | `tagline`, `headline`, `heroSupportingText`, `heroMedia` |
| Media | `galleryAdditions` `[Media]` (supplements, not replaces), `videoUrl` |
| Kit | `kitContents` `[GrahaKavachKitItem]` |
| Benefits | `keyBenefits` `[TitleTextRow]`, `riskLocations` `[TitleTextRow]`, `roleCards` `[RoleRow]` (`title`, `role`, `text`) |
| Specs | `specifications` `[SpecRow]` (`group`, `label`, `value`) |
| Instructions | `installation` (HTML), `usage` (HTML), `warnings` `[WarningRow]` (`level`, `title`, `text`) |
| Support | `faqs`, `certifications`, `brochure` (PDF), `manufacturerNotes`, `supportCtaLabel`, `supportCtaUrl` |

> **Why not on a `Product` GraphQL type?** WooGraphQL is not installed, so
> GraphQL has no Product type to extend. Adding it would mean a second commerce
> API alongside Woo REST. See `ARCHITECTURE.md` §3.

---

## 7. Reusable content types

All are `public => false` with `show_ui => true`: edited in wp-admin, never
served as pages on the backend host. Each exposes `id`, `title`, `slug` plus:

| Type | GraphQL type | Fields |
| --- | --- | --- |
| FAQ | `GrahaKavachFaq` | `answer` (HTML), `group` |
| Certification | `GrahaKavachCertification` | `issuer`, `number`, `summary`, `image`, `document` |
| Testimonial | `GrahaKavachTestimonial` | `quote`, `author`, `location`, `rating`, `image` |
| Safety Guide | `GrahaKavachSafetyGuide` | `summary`, `body` (HTML), `image`, `order` |
| Kit Item | `GrahaKavachKitItem` | `summary`, `role`, `quantity`, `image`, `specs` `[LabelValueRow]` |

**Why these five are post types and nothing else is:** each is referenced from
more than one surface. Kit Items are the clearest case — the same three
products appear in the homepage protection section, the "inside the box"
section, and the product kit contents. A one-off list that appears in exactly
one place is a structured field instead, because a post type for it would be
more machinery to maintain, not less.

Relationship resolvers return **published posts of the expected type only**, so
a draft or a deleted item cannot leak into the storefront.

---

## 8. SEO

**Yoast SEO 28.5 is the single SEO system.** No competing system was built.
`Add WPGraphQL SEO 5.1.0` exposes it, and every field in the brief is covered:

| Requirement | Yoast field via GraphQL |
| --- | --- |
| SEO title | `seo.title` |
| Meta description | `seo.metaDesc` |
| Canonical override | `seo.canonical` |
| Robots index/noindex | `seo.metaRobotsNoindex`, `seo.metaRobotsNofollow` |
| OG title | `seo.opengraphTitle` |
| OG description | `seo.opengraphDescription` |
| OG image | `seo.opengraphImage { sourceUrl }` |

Available on posts, pages and — because Yoast registers there too — products.

Two backend-specific behaviours, from `class-gk-noindex.php`:

- The backend suppresses its own canonical URL, so it can never publish
  `admin.grahakavach.in` as a canonical. Next.js maps canonicals to
  `grahakavach.in` using `frontendUri`.
- All sitemap routes return 404 on the backend. The storefront generates its own.

> The live site uses **Rank Math**, the backend uses **Yoast**. That is fine —
> the live site is being replaced. Yoast values must be authored on the backend;
> Rank Math data does not transfer automatically. This is a Phase 4 migration
> task.

---

## 9. What is *not* exposed

ACF field groups are registered with `show_in_graphql => false`. The GraphQL
surface is hand-built so exposure is opt-in per field. Consequences:

- Ticking a box in wp-admin cannot publish a field to the API.
- The technical settings (revalidation URL, CORS allowlist, webhook state) are
  **not** in GraphQL at all.
- The revalidation secret is never in the database — it is a `wp-config.php`
  constant only.
- `gk/v1/settings` (REST) returns only the public contact/social subset, read
  from the same ACF model so REST and GraphQL cannot disagree.

---

## 10. Verified queries

All six ran successfully against the live backend on 2026-09-20.

```graphql
# 1. Global settings
{ grahaKavachSettings {
    phonePrimary emailPrimary address mapsUrl
    businessHours { days hours }
    navGroups { group label url }
    logoPrimary { url width height alt }
} }

# 2. Homepage
{ grahaKavachHomepage {
    heroTitle heroHighlight heroVisualDesktop { url }
    trustItems { title text }
    protectionItems { id title summary role image { url } }
    faqs { id title answer }
} }

# 3. About
{ grahaKavachAbout {
    intro story timeline { year title text }
    facilityImages { url alt }
} }

# 4. FAQ
{ grahaKavachFaqs(limit: 20) { id title slug answer group } }

# 5. Post, with storefront URL and Yoast SEO
{ posts(first: 10) { nodes {
    title slug frontendUri
    seo { title metaDesc canonical opengraphImage { sourceUrl } }
} } }

# 6. Product supplemental content
{ grahaKavachProductContent(slug: "fire-safety-combo-kit") {
    tagline headline
    keyBenefits { title text }
    specifications { group label value }
    warnings { level title text }
    kitContents { id title image { url } }
    brochure { url }
} }
```

---

## 11. Known behaviour worth remembering

**Object cache and programmatic writes.** The backend runs a persistent object
cache. Content written by direct SQL does not invalidate it, so a value can be
in the database yet read back empty until the post cache is cleared. Phase 4
migration should write through WordPress APIs (`wp_insert_post`,
`update_field`) rather than raw SQL.

Resolvers fall back to raw post meta when ACF returns nothing, so imported
content that lacks ACF's internal `_fieldname` key reference still surfaces
through the API. This was added specifically to make the Phase 4 migration
safe.

**Cache tags.** Saving any reusable item invalidates its own tag, its type tag,
and `wp-page:home`, because that content is embedded in the homepage. Saving
Site Settings invalidates `wp-settings`, which affects every page.
