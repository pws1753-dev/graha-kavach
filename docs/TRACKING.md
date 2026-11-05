# Graha Kavach — Order Shipment Tracking

**Status:** Phase 5 complete. AST installed, configured and tested end-to-end.
**Last verified:** 2026-09-20 (dummy order, since deleted)

---

## 1. What is installed

| | |
| --- | --- |
| Plugin | **Advanced Shipment Tracking for WooCommerce** (AST) |
| Author | Zorem — official wordpress.org build, slug `woo-advanced-shipment-tracking` |
| Version | 4.0.3 |
| Cost | Free, open source. **No TrackShip, no paid service installed.** |

### Compatibility, checked before activation

| Requirement | AST 4.0.3 | This install | |
| --- | --- | --- | --- |
| WordPress | requires 5.3, tested 7.1 | 7.1.1 | ✅ |
| WooCommerce | requires 5.0, tested **11.1.0** | **11.1.1** | ⚠️ one patch ahead |
| PHP | requires 7.2 | 8.3.33 | ✅ |
| HPOS | supported | available | ✅ |

The WooCommerce gap is a patch release, not a minor one. Everything in this
document was exercised against 11.1.1 and worked. Re-check after any AST or
WooCommerce upgrade.

---

## 2. ⚠️ AST does not create a "Shipped" order status

This is the single most important thing to know, and it is not what the plugin
name suggests. It was confirmed by reading AST's source and then by a live test.

`wc_ast_status_shipped` does **not** register a new order status. It only
changes the wording of the admin "Mark order as:" radio button from *Completed*
to *Shipped* (`class-wc-advanced-shipment-tracking.php:553-563`). AST registers
post statuses for `wc-delivered`, `wc-updated-tracking` and `wc-partial-shipped`
— but **never** `wc-shipped`.

Proven on the dummy order:

```
POST /wc/v3/orders/33/shipment-trackings  { ..., "status_shipped": 1 }
     → 201 Created
GET  /wc/v3/orders/33
     → "status": "completed"        ← not "shipped"
```

`partial-shipped` was enabled in settings but is **still not reachable over
REST**: it is absent from `/wc/v3/orders/statuses`, and setting it returns
`rest_invalid_param`. AST registers it only in an admin context, so a headless
frontend cannot rely on it.

### What this means for the frontend

**Do not branch on a `shipped` status — it does not exist.** Derive the
fulfilment state from the order status *plus* the presence of tracking:

| Woo status | Tracking items | Show the customer |
| --- | --- | --- |
| `pending`, `failed` | — | Awaiting payment |
| `on-hold` | — | Payment being confirmed |
| `processing` | none | Preparing your order |
| `processing` | ≥ 1 | **Shipped** — show tracking |
| `completed` | ≥ 1 | **Shipped** — show tracking |
| `completed` | none | Completed |
| `cancelled`, `refunded` | — | Cancelled / Refunded |

The `derive` logic belongs in one place in the frontend, not scattered per page.

---

## 3. Does AST alone satisfy the five requirements?

| # | Requirement | AST free | Evidence |
| --- | --- | --- | --- |
| 1 | Tracking number display | ✅ **Yes** | `tracking_number` |
| 2 | Carrier display | ✅ **Yes** | `tracking_provider`, human-readable ("Delhivery") |
| 3 | Tracking link | ✅ **Yes** | `tracking_link`, **already substituted** — the frontend never builds URLs |
| 4 | Shipped status | ⚠️ **No, not as a status** | Maps to `completed`; derive per §2 |
| 5 | Frontend Track Order page | ❌ **No** | AST renders into WooCommerce My Account and emails only. A headless page must be built — see §6 |

**Verdict:** AST covers the data layer completely (1–3). Requirement 4 needs a
documented convention rather than a plugin feature. Requirement 5 is ours to build.

---

## 4. Configuration applied

**Statuses** (`ast_general_settings`)

- `wc_ast_status_shipped` → `true` — admin action reads "Shipped"
- `wc_ast_status_partial_shipped` → `true` — admin only, not REST-visible
- `wc_ast_status_delivered` → `false` — nothing would ever set it without
  real-time carrier events, so an always-empty status would mislead

**Carriers** — 9 activated from 1078 available, all Indian, and every one has a
`%number%` placeholder so the tracking link actually resolves. Carriers whose
stored URL has no placeholder (Gati, Safexpress, Trackon, The Professional
Couriers) were deliberately left off: they would produce a dead link.

| Carrier | Tracking URL pattern |
| --- | --- |
| Delhivery | `delhivery.com/track-v2/package/%number%` |
| India Post | `indiapost.gov.in/track-result/article-number/%number%` |
| DTDC | `dtdc.com/track-your-shipment/?awb=%number%` |
| Xpressbees | `xpressbees.com/shipment/tracking?awbNo=%number%` |
| Bluedart | `bluedart.com/?%number%` |
| Ekart | `ekartlogistics.com/shipmenttrack/%number%/` |
| Shadowfax | `track.shadowfax.in/track?order=new&trackingId=%number%` |
| TCI Express | `tciexpress.in/trackingdocket.aspx?trackshipment=%number%` |
| Shiprocket | `shiprocket.co/tracking/%number%` |

Add more in **WooCommerce → Shipment Tracking → Shipping Providers**.

---

## 5. REST API — verified working

AST registers under four namespaces; they are the same routes. **Use `wc/v3`.**

```
GET    /wp-json/wc/v3/orders/{order_id}/shipment-trackings
POST   /wp-json/wc/v3/orders/{order_id}/shipment-trackings
DELETE /wp-json/wc/v3/orders/{order_id}/shipment-trackings/{tracking_id}
GET    /wp-json/wc/v3/orders/{order_id}/shipment-trackings/providers
```

Authentication is the standard WooCommerce consumer key/secret — **server-side
only**, never in a browser.

### Verified response

```json
[
  {
    "tracking_id": "1a74566ba8db99e6b4e02c98c932ab8e",
    "tracking_provider": "Delhivery",
    "tracking_link": "https://www.delhivery.com/track-v2/package/TESTDLV123456789",
    "tracking_number": "TESTDLV123456789",
    "date_shipped": "2026-09-20"
  }
]
```

`tracking_link` arrives fully resolved. `date_shipped` is `YYYY-MM-DD`.

### Adding tracking

```json
POST /wp-json/wc/v3/orders/{id}/shipment-trackings
{
  "tracking_provider": "Delhivery",
  "tracking_number":   "ABC123456789",
  "date_shipped":      "2026-09-20",
  "status_shipped":    1
}
```

`status_shipped: 1` moves the order to `completed` and triggers the customer
email. Omit it to attach tracking without changing status or notifying.

### What the Store API does *not* give you

`/wc/store/v1/order/{id}?key=…&billing_email=…` works anonymously and returns
status, items, totals and addresses — but **contains no tracking data at all**
(verified). It cannot back a Track Order page on its own.

---

## 6. Service contract for the Next.js frontend

> **The frontend must never scrape WooCommerce HTML, and the consumer
> key/secret must never reach the browser.** Both are satisfied by putting a
> single server-side route between the customer and WooCommerce.

### Route

```
POST /api/track
```

Runs server-side in Next.js. It is the only place that holds Woo credentials.

**Request**

```ts
{ orderNumber: string; email: string }
```

What a customer actually knows from their confirmation email. No order key
required, so the page works from a bookmark.

**Response — 200**

```ts
type TrackingResponse = {
  orderNumber: string;
  placedOn: string;              // ISO 8601
  state: "awaiting_payment" | "confirming" | "preparing"
       | "shipped" | "completed" | "cancelled" | "refunded";
  isShipped: boolean;            // derived per §2
  shipments: {
    carrier: string;             // "Delhivery"
    trackingNumber: string;
    trackingUrl: string;         // already resolved — render as-is
    shippedOn: string | null;    // YYYY-MM-DD
  }[];
  items: { name: string; quantity: number }[];
};
```

**Response — 404** `{ error: "not_found" }` — returned for *both* a missing
order and a mismatched email, so the endpoint cannot be used to test whether an
email address has ordered.

**Response — 429** `{ error: "rate_limited" }`.

### Server-side rules

1. Look the order up by number via `GET /wc/v3/orders?search=` or by ID.
2. Compare `billing.email` case-insensitively using a **constant-time**
   comparison. A plain `===` leaks timing.
3. Fetch `/wc/v3/orders/{id}/shipment-trackings`.
4. **Return only the fields above.** Never pass the raw WooCommerce order
   through — it contains the full billing address, phone, payment method and
   customer notes.
5. Rate-limit by IP *and* by order number — roughly 5 attempts per 10 minutes.
   Without this, order numbers are sequential and guessable.
6. Never cache a tracking response in a shared cache. Per-request only.

### Cache policy

Tracking is customer-specific and changes without notice. `no-store`. It is the
one part of the storefront that must never be statically rendered.

---

## 7. Real-time carrier events — what it would take

AST free records *the tracking number you enter*. It does **not** poll carriers,
so there is no "In transit → Out for delivery → Delivered" timeline inside our
own UI, and `delivered` will never set itself. The customer gets that detail by
following `trackingUrl` to the carrier's own site.

To show live milestones in our own interface, one of these is required:

| Option | What it gives | Cost / trade-off |
| --- | --- | --- |
| **TrackShip for WooCommerce** (Zorem) | Purpose-built for AST. Polls 1000+ carriers, writes status back to the order, enables the `delivered` status and per-milestone emails. | Paid subscription, priced per shipment. **Not installed** — explicitly out of scope. |
| **Shiprocket / Delhivery API direct** | Native Indian coverage, webhooks on status change. Shiprocket already aggregates most Indian carriers. | One integration per provider; we own the polling, retries and mapping. Best fit if fulfilment already runs through Shiprocket. |
| **AfterShip / EasyPost** | Carrier-agnostic aggregator with a clean webhook model. | Paid; another vendor holding customer shipment data. |
| **Build it ourselves** | Full control. | Each carrier's API is different and several Indian carriers have no public API. Not worth it at this volume. |

**Recommendation:** ship without real-time events. The tracking link covers the
customer need at launch. If fulfilment moves to Shiprocket, integrate its
webhook directly — it would cover most Indian carriers in one integration and
avoids a second subscription. Revisit TrackShip only if fulfilment stays spread
across many carriers.

Whichever is chosen, the frontend contract in §6 does not change: extra
milestones would arrive as an optional `events[]` array on each shipment.

---

## 8. Test performed

A dummy order was created and fully exercised, then removed.

| Step | Result |
| --- | --- |
| Order created (`test@example.com`, a reserved non-deliverable domain) | ✅ #33, `processing` |
| Carrier list before configuration | 0 active of 1078 — providers endpoint returned `[]` |
| 9 Indian carriers activated | ✅ providers endpoint populated |
| Tracking added over REST | ✅ 201, `tracking_link` resolved |
| Tracking read back | ✅ identical payload |
| Status after `status_shipped: 1` | ⚠️ `completed` — the §2 finding |
| Store API checked for tracking | ❌ absent |
| Order deleted permanently | ✅ 0 orders, 0 customers |
| Stock restored | ✅ the test order left stock at `-1`; reset to `0` |

`test@example.com` is an IANA-reserved domain that cannot receive mail, so no
real person could have been emailed at any point.

---

## 9. Live status today (Nov 2026): how the whole chain works

Sections 1 to 8 describe the first AST-only setup. Since then **TrackShip for
WooCommerce** has been added (connected 2026-11-05, Free Trial plan, 100 trackers),
and the storefront shows live courier status.

```
Sales team ──► order > "Shipment Tracking" box (AST): courier + tracking number
                 └─ order marked Shipped (Woo status "completed")
                      └─ TrackShip receives the parcel and follows it with the courier
                           └─ status and scan history are stored in wp_trackship_shipment(_meta)
Headless Core ──► GET /wc/v3/orders/{id}/shipment-status   (reads those tables)
Next.js  ──► /api/track (guest + login) and /api/account/orders (login)
                 └─ one shared builder: src/lib/woocommerce/order-tracking.ts
```

### What the sales team does (the only manual step)

1. Open the order in WooCommerce > Orders.
2. In **Shipment Tracking** pick the courier, type the tracking number, tick
   **Mark order as Shipped**, save.

Nothing else. TrackShip then updates the status by itself and the customer's page
shows it. A parcel that TrackShip reports as delivered sets the order to
**Delivered**.

### Parcels shipped before TrackShip was connected

TrackShip only picks up orders when they are marked Shipped *after* it is
connected. Orders shipped earlier (383, 384, 395, 396, 397, 399 on 2026-11-05)
have a tracking number but no live status. To start tracking them without emailing
the customer again:

WooCommerce > Orders > tick those orders > Bulk actions > **Get Shipment Status** > Apply.

### What each customer screen shows

| Screen | Who | What |
| --- | --- | --- |
| `/track-order` | guest (order number + email or mobile) or login | headline, 4-step progress, courier scans, payment |
| `/account/orders` | login | every order (including guest orders with the same email or mobile): headline, progress, latest scan, payment |
| `/account/orders/<id>` | login | the same full tracking screen as `/track-order` |

Logged-in pages refresh by themselves every 5 minutes and when the tab is opened
again. The data is read fresh from WordPress on every request (never cached).

### Payment shown to the customer

| Order | Label | Detail |
| --- | --- | --- |
| COD with an advance, not yet delivered | **Part paid** | advance paid online, balance due on delivery |
| COD with an advance, Delivered | **Paid in full** | balance collected |
| COD without an advance | **Pay on delivery** | total due |
| Online (Razorpay) | **Paid online** | nothing due |
| Pending or failed | **Payment pending** | |

The advance is read from the order (`_cod_advance_paid`, written when Razorpay
confirms). "Shipped" (`completed`) does not count as the balance being paid;
only Delivered does. WordPress shows the same in WooCommerce > Orders, in the
**Payment** column added by the Graha Kavach Part Payment & Invoice plugin.

### Production environment variables (Hostinger)

These are read at runtime, so the site must have them in Hostinger > Websites >
grahakavach.in > Environment variables. After the Git source was switched on
2026-11-05 the builds reported `no .env file`; if the variables are not listed
there, the advance and online payment are off. The server logs a `[env]` line at
start-up naming any that are missing (`src/instrumentation.ts`).

`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`,
`CONTACT_NOTIFY_EMAIL`, `META_CONVERSIONS_API_ACCESS_TOKEN`,
`NEXT_PUBLIC_META_PIXEL_ID`, `REVALIDATION_SECRET`, `WC_CONSUMER_KEY`,
`WC_CONSUMER_SECRET`, `NEXT_PUBLIC_SITE_URL`, `WORDPRESS_URL`,
`WORDPRESS_GRAPHQL_URL`, `WOOCOMMERCE_URL` and the `NEXT_PUBLIC_FIREBASE_*` set.

### Cost note

TrackShip's Free Trial covers 100 shipments; after that it is a paid plan. The
repository also contains `wordpress-plugins/grahakavach-tracking`, which reads
Delhivery and Xpressbees directly and needs no subscription, only the couriers'
API credentials. It is not installed. Install it only after removing the
duplicate tracking box (do not run it next to AST).
