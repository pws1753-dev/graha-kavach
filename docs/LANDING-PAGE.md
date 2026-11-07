# Landing pages (/book-now and /lp/<slug>)

Hindi campaign pages with a three-step booking funnel, all in the Graha Kavach look. Create as many as you need in WordPress; each one only needs its text and images changed.

## Make a new landing page

1. wp-admin > **Landing Pages** (left menu).
2. Enter a **Page name** and pick **Start from**: the starter content, or a copy of any existing landing page (copy is the quickest way to run a variation).
3. **Create draft and edit** opens the page. Fill the tabs, set the **Yoast SEO** box, then **Publish**.
4. The page is live at `https://grahakavach.in/lp/<slug>` within a few minutes. The slug comes from the page name; change it in the page's Permalink box if you want something shorter. The first page keeps `https://grahakavach.in/book-now`.

The booking steps for a page are at `/lp/<slug>/book` (`/book-now/details` for the first page). They are `noindex` and blocked in robots.txt.

## What each page controls

| What | Where |
|---|---|
| All copy, button labels, FAQ, timer | The tabs of the page's "Landing Page Content" box |
| Images | Same tabs; pick from the **Media Library** (alt text is set there) |
| SEO title, description, social card, noindex | The **Yoast SEO** box on the page |
| Which product it sells | **Page settings** tab > WooCommerce product (slug). Empty uses the main kit, `graha-kavach-complete-fire-safety-kit` |
| Prices and discount | That WooCommerce product (regular price and sale price) |
| Amount paid now (balance on delivery) | WooCommerce **Deposits & Partial Payments** |
| Countdown on or off | **Page settings** tab > Hide the countdown |

## Prices in the copy

Do not type prices into the text. Use these tokens and the page fills in the live figure, so it can never show an amount the checkout does not charge:

`{price}` offer price, `{mrp}` regular price, `{discount}` difference, `{advance}` paid now, `{balance}` paid on delivery, `{end}` offer end time. Wrap words in `**double asterisks**` for bold. In FAQ answers `{br}` starts a new line, and in the offer note `{timer}` shows the live countdown.

## Hiding sections

Leave a section's fields empty and it disappears: Why it matters, What is in the kit, Offer box, How booking works, Where it goes, Reviews, FAQ. Reviews stay hidden until you add real ones. Tick "Hide the countdown" for a campaign with no deadline; every timer and the "time left" bars go away.

## Countdown

Runs in India time and, by default, as a rolling cycle: the offer ends every "Cycle days" days (default 3, i.e. 72 hours) on a grid anchored at 8 Nov 2026 00:00 IST (`end = anchor + ceil((now - anchor) / cycle) * cycle`). It reads "2 दिन 23:59:59", then "1 दिन …", then "0 दिन …", and the moment it hits 00:00:00 the next cycle starts. Change the length with "Cycle days" in Offer & timer; `0` switches to the daily cut-off in "Offer ends daily at". "Fixed offer end" is optional and only used while it is still in the future; once it passes, the rolling cycle takes over so the timer never sits at 00:00:00. The price itself always follows WooCommerce, so end the sale there too.

## Orders

A booking is a normal WooCommerce COD order with the advance collected through Razorpay, created by the same API as the main checkout. The order carries `_source = nextjs-landing` and `_landing_page = <slug>`, so you can see which page an order came from. The store header, footer and tab bar are hidden on landing routes.

## How it works

Every landing page is a WordPress page under a private **Landing Pages** parent. That parent is what shows the editor fields, serves the page at `/lp/<slug>`, and keeps it out of the policy-page list and the catch-all route. Do not move landing pages out from under it. Plugin v1.3.3 or later is required.

## First setup

Upload the plugin and open wp-admin once. The first page (`/book-now`) is created or moved under the parent, and starter copy, the five images and a Yoast title and description are written into empty fields, once. Then check the one item the design left open: **customer reviews** (the design had placeholders, so none are published; add real ones in the Reviews & trust tab as `Quote|Name`).
