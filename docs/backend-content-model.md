# Backend Content Model

This document defines the WordPress and ACF content model expected by the Next.js frontend.

No production data should be deleted while implementing this model.

## Global Site Settings

Recommended implementation:

- ACF Options Page: `Graha Kavach Settings`
- GraphQL type/name target: `grahaKavachSettings.siteSettings`
- Expose in WPGraphQL for ACF

Fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `brandName` | Text | Yes | Default: `Graha Kavach` |
| `announcement` | Text | No | Header announcement bar |
| `contact.phone` | Text | Yes | Initial value: `+91 7891111390` |
| `contact.email` | Email | Yes | Initial value: `grahakavach@gmail.com` |
| `contact.address` | Textarea | Yes | Initial value: `103, Ostwal Plaza 2, Sundarwas, Udaipur (Raj.) India` |
| `contact.whatsapp` | Text | No | Do not guess if missing |
| `headerNavigation` | Repeater | Yes | `label`, `href` |
| `footerNavigation` | Repeater | Yes | `label`, `href` |
| `socialLinks` | Repeater | No | `label`, `url` |

Current frontend fallback values live in `src/lib/wordpress/settings.ts` and should be treated only as fallbacks until ACF is configured.

## Homepage

WordPress should manage:

- Hero eyebrow
- Hero headline
- Hero summary
- Primary and secondary CTA labels/links
- Product education sections
- Safety warning copy
- Installation guide summary
- Usage guide summary
- FAQ references
- Downloadable booklet/manual
- Product and lifestyle images

## Product Education

The core kit is one WooCommerce product/combo:

1. ABC Dry Powder Fire Extinguisher
2. Automatic Fire Ball
3. Fire Blanket

Do not create separate purchasable products unless explicitly requested.

Approved brochure-listed specs:

- Fire extinguisher: ABC dry powder, 2 kg capacity, approx. 10-12 sec discharge, approx. 3-4 m throw.
- Fire ball: approx. 1.3 kg unit weight, MAP powder, 5-year listed shelf life, flame activated.
- Fire blanket: 1 x 1 metre, fibreglass, brochure lists 550°C heat resistance.

Do not add certifications, ratings, or compliance claims unless backed by supplied material or backend fields.

## Safety Messaging

Any usage guide must include evacuation-first guidance:

- Leave immediately when a fire is spreading.
- Avoid smoke exposure.
- Keep a clear exit path.
- Use equipment only for small, early-stage incidents where it is safe to do so.

## SEO

Yoast SEO fields should remain editable in WordPress.

The frontend maps Yoast metadata to public `grahakavach.in` canonical URLs. Admin URLs must not be used as public canonical URLs.

Structured data support planned:

- Organization
- Product
- BreadcrumbList
- Article
- FAQPage where valid

Never fabricate AggregateRating or Review schema.
