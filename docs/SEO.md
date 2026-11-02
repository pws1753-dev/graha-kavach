# Graha Kavach — Headless SEO Management Guide

This guide explains how Search Engine Optimization (SEO) is managed from the WordPress backend (`https://admin.grahakavach.in`) and served by the Next.js storefront (`https://grahakavach.in`).

---

## 1. Architectural Overview

- **Single Source of Truth**: **Yoast SEO 28.5** is the single SEO management system configured in WordPress. No competing duplicate SEO plugins or custom field systems exist.
- **WPGraphQL SEO 5.1.0**: Exposes Yoast SEO fields over GraphQL (`title`, `metaDesc`, `canonical`, `metaRobotsNoindex`, `metaRobotsNofollow`, `opengraphTitle`, `opengraphDescription`, `opengraphImage`).
- **Next.js `generateMetadata()`**: Server-renders all meta tags, canonical links, robots directives, and OpenGraph / Twitter previews.
- **Canonical Protection**: Any canonical URL containing `admin.grahakavach.in` is automatically rewritten by Next.js to `https://grahakavach.in/`.
- **Backend Search Shielding**: The backend `admin.grahakavach.in` is shielded with `noindex, nofollow` headers and `Disallow: /` in `robots.txt` via `class-gk-noindex.php`, ensuring search engines index only the public storefront.

---

## 2. How to Edit SEO in WordPress Admin

Log in to the WordPress admin panel at `https://admin.grahakavach.in/wp-admin`.

### A. Editing SEO for Pages (Home, About Us, Contact, etc.)
1. Navigate to **Pages** in the left sidebar.
2. Click **Edit** on the page you wish to optimize (e.g., **Home**, **About Us**, or **Contact Us**).
3. Scroll down below the page content to the **Yoast SEO** metabox.
4. **Google Preview (Snippet)**:
   - Click **Edit snippet**.
   - **SEO title**: Enter your custom title tag (e.g., `About Graha Kavach | Manufacturing Experience, Udaipur`).
   - **Slug**: Leave as-is (e.g., `about-us`).
   - **Meta description**: Write a concise, compelling description (up to 155–160 characters) explaining the page content.
5. **Social Tab (OpenGraph / Facebook / Twitter)**:
   - Click the **Social** icon in the Yoast metabox.
   - Upload a high-resolution 1200x630px image to serve as the default preview when shared on WhatsApp, Facebook, LinkedIn, or Twitter/X.
   - Customize the social title and description if different from Google search.
6. **Advanced Tab**:
   - *Allow search engines to show this Page in search results?* Keep as **Yes**.
   - *Canonical URL*: Optional override. Any URL entered will be sanitized to `https://grahakavach.in/<path>`.
7. Click **Update** to save. The changes are immediately fetched by Next.js.

### B. Editing SEO for the WooCommerce Product (Fire Safety Kit)
1. Navigate to **Products** in the left sidebar.
2. Click **Edit** on **Graha Kavach Complete Fire Safety Kit** (Product ID 32).
3. Scroll to the **Yoast SEO** metabox below the product data panel.
4. Customize the **SEO title** and **Meta description**.
5. Set the primary social share image under the **Social** tab.
6. Click **Update**.

### C. Editing SEO for Blog Posts
1. Navigate to **Posts** in the left sidebar.
2. Click **Edit** on an article or click **Add New Post**.
3. In the right sidebar:
   - Set **Featured image** (used in cards, OpenGraph previews, and Google Article schema).
   - Assign appropriate **Categories** (e.g., `Home Safety`, `Equipment Guides`, `Fire Prevention`).
   - Fill in the **Excerpt** (serves as fallback description if Yoast meta description is left blank).
4. In the **Yoast SEO** metabox below:
   - Fill in **SEO title** and **Meta description**.
5. Click **Publish** or **Update**.

---

## 3. Structured Data (JSON-LD) Implementation

The Next.js storefront automatically injects Google-compliant Schema.org JSON-LD structured data into the `<head>` of each page:

| Schema Type | Applied Where | Details |
|---|---|---|
| **Organization** | Homepage, Contact | Brand name, logo, phone (`+91 7891111390`), email, Udaipur address, social links (Facebook, Instagram). |
| **WebSite** | Homepage | Site name, canonical URL, language `en-IN`. |
| **Product & Offer** | Homepage, `/fire-safety-kit` | Name, description, image gallery, SKU, price (₹2,499), currency (`INR`), stock status, seller (`Speciality Geochem`). |
| **AggregateRating & Review** | `/fire-safety-kit` | **Strict Integrity**: Only output if real approved reviews exist in WooCommerce (`rating_count > 0`). Never fabricated. |
| **BreadcrumbList** | All public subpages | Hierarchical trail (e.g. `Home` > `Blog` > `Category` > `Article`). |
| **Article** | Blog posts (`/blog/[slug]`) | Headline, publication date, modification date, author, publisher, and featured image. |
| **FAQPage** | `/safety-guide`, Homepage | Contextual: **only output when FAQs are physically rendered** on the page. |

---

## 4. Dynamic XML Sitemap (`/sitemap.xml`)

The storefront generates a dynamic, real-time sitemap at `https://grahakavach.in/sitemap.xml`:
- **Included Routes**:
  - Main marketing pages (`/`, `/fire-safety-kit`, `/how-it-works`, `/safety-guide`, `/about`, `/contact`, `/blog`)
  - All published WordPress blog articles (`/blog/[slug]`)
  - All active category archives (`/blog?category=[slug]`)
- **Excluded Routes**:
  - Customer account pages (`/account/*`)
  - Checkout & cart (`/cart`, `/checkout`, `/order-confirmation`)
  - Order tracking verification (`/track-order`)
  - Internal API routes (`/api/*`)
  - Backend WordPress admin (`/wp-admin`, `/wp-json`)

---

## 5. Robots Rules (`/robots.txt`)

Accessible at `https://grahakavach.in/robots.txt`:
```txt
User-agent: *
Allow: /
Disallow: /account/
Disallow: /cart
Disallow: /checkout
Disallow: /order-confirmation
Disallow: /track-order
Disallow: /api/

Sitemap: https://grahakavach.in/sitemap.xml
Host: https://grahakavach.in
```

---

## 6. Technical SEO Checklist & QA

- [x] **Single `<h1>` per page**: Every public page contains exactly one semantic `<h1>` tag.
- [x] **Heading Hierarchy**: Subheadings strictly follow `<h2>` and `<h3>` without skipping levels.
- [x] **Canonical URLs**: Strictly sanitized to `https://grahakavach.in/`.
- [x] **OpenGraph & Twitter Cards**: Complete with image previews and localized descriptions.
- [x] **Image SEO**: Meaningful `alt` text applied on all images; no keyword stuffing.
- [x] **404 Handling**: Proper 404 response with helpful navigation back to the homepage.
- [x] **Mobile Optimization & Core Web Vitals**: Responsive images with `sizes` and `priority` on LCP hero visuals.

---

## Redirects (SEO manager)

Manage redirects in WordPress admin under **Redirects** (left menu). Available to administrators and the Yoast **SEO Manager** / **SEO Editor** roles and WooCommerce **Shop Manager**.

- Add a rule: old path, new path or full grahakavach.in URL (no external sites), and a type (301 permanent, 302/307 temporary, 308, or 410 Gone for removed pages). Tick the wildcard box to also match everything below the old path.
- Edit, enable/disable, delete in bulk, search, import from CSV (`old-path,new-path,code,note`) and export.
- The plugin blocks loops, duplicate sources and reserved paths (`/api`, `/_next`, `/wp-admin`, `/robots.txt`, `/sitemap.xml`, and the home page).
- Rules are served from `https://admin.grahakavach.in/wp-json/gk/v1/redirects` and applied by `src/proxy.ts` on the storefront. Changes go live within about a minute, with no deploy. If WordPress is unreachable, the storefront serves pages normally.
- Redirects set in `next.config.ts` (www to non-www, `/home` to `/`) run first and are not editable here.
