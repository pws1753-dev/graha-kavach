# Graha Kavach WhatsApp Alerts

Automated WhatsApp Cloud API alerts for the WooCommerce backend (`admin.grahakavach.in`) and the Next.js storefront.

| Message | Template | Triggered by |
| --- | --- | --- |
| Signup thank-you | `gk_welcome` | Customer account created (needs a phone number) |
| Abandoned cart, reminder 1 / 2 | `gk_cart_reminder_1` / `_2` | Cart idle 60 min / 24 h after the shopper typed a mobile number at checkout |
| Payment successful | `gk_payment_success` | Online order paid |
| COD confirmed | `gk_cod_advance_received` | COD order, online advance paid |
| Order being processed | `gk_order_processing` | 5 min after payment (setting) |
| Shipped + tracking | `gk_order_shipped` | Status -> Shipped or Partially Shipped, or a tracking number added (Advanced Shipment Tracking) |
| Delivered | `gk_order_delivered` | Status -> Delivered only |
| Cancelled / Refunded / Payment failed | `gk_order_cancelled`, `gk_order_refunded`, `gk_payment_failed` | Matching WooCommerce events |
| New order alert to the owner | `gk_admin_new_order` | Confirmed order |

`templates.json` is the single source of truth for all of them. The Meta approval document in `docs/whatsapp/` is generated from it.

## How it works

- Order messages hook into WooCommerce itself, so they fire no matter where the order was created (storefront, wp-admin, REST).
- Nothing sends inside a request. Each message is logged, queued in Action Scheduler and sent in the background with up to 4 attempts (2, 10, 30 min back-off). A Meta outage can never slow or break checkout.
- The cart lives in the browser, so the storefront posts a signed snapshot to `POST /wp-json/gk-whatsapp/v1/cart/capture` once a valid mobile number is typed at checkout. The signature is HMAC-SHA256 with the existing `GK_HEADLESS_REVALIDATE_SECRET`; no new secret is needed on either side.
- The reminder button opens `https://grahakavach.in/cart?recover=<token>`; the storefront restores the cart and goes to checkout.
- Reminders stop as soon as the customer's order is confirmed, are capped at 3 per number per 7 days, and are skipped for numbers that replied `STOP`.

## Install

1. Copy this folder to `wp-content/plugins/grahakavach-whatsapp/` on the WordPress host and activate it. WooCommerce must be active.
2. Add to `wp-config.php` (above "That's all, stop editing"):

   ```php
   define( 'GKWA_ACCESS_TOKEN', '<System User token, expiry Never>' );
   define( 'GKWA_APP_SECRET',   '<Meta app secret>' );
   define( 'GKWA_VERIFY_TOKEN', '<any long random string>' );
   // define( 'GKWA_DISABLED', true ); // emergency kill switch, no deploy needed
   ```

   `GK_HEADLESS_REVALIDATE_SECRET` must already be defined (it is, for the Next.js revalidation webhook).
3. WooCommerce -> WhatsApp Alerts -> Settings: fill in Phone number ID and WhatsApp Business Account ID, set the owner's number, tick **Enable**, save.
4. Templates tab -> **Submit missing templates to Meta**. Wait until each shows `APPROVED`.
5. In Meta (WhatsApp -> Configuration) set the callback URL shown on the Settings tab, paste the verify token, subscribe to **messages**, then press **Subscribe app to WhatsApp account**.
6. Settings tab -> send a test message to your own number. Check the **Message log** tab.

The Next.js side needs no new environment variable. Deploy the storefront as usual.

Templates stay PENDING until Meta approves them (a few minutes to 24 hours); messages sent before that fail with error 132001.

## Notes

- **Reliable timing**: the cart reminders use WP-Cron every 10 minutes. On low-traffic sites add a real cron: `*/10 * * * * curl -s https://admin.grahakavach.in/wp-cron.php?doing_wp_cron >/dev/null`.
- **Tracking**: the shipped message reads the `_wc_shipment_tracking_items` meta that Advanced Shipment Tracking writes (the same data `/api/track` uses).
- **Shipped vs Delivered**: on this shop the status labelled **Shipped** is WooCommerce's `completed` status renamed by Advanced Shipment Tracking, so `completed` never sends the delivered message. Only the real **Delivered** status does.
- **Status to template map**: Pending: none. Processing: `gk_cod_advance_received` or `gk_payment_success`, then `gk_order_processing`, plus the owner alert. Shipped / Partially Shipped: `gk_order_shipped` (courier and tracking number). Delivered: `gk_order_delivered`. Cancelled (from Processing or On hold): `gk_order_cancelled`. Refunded: `gk_order_refunded`. Failed: `gk_payment_failed`. A template must be Approved on Meta under the same language as Settings (en_US) or the send fails with error 132001.
- **Consent**: cart reminders are MARKETING. Add a line to the privacy policy and checkout saying order updates and reminders are sent on WhatsApp, and keep the STOP handling on.
- **Phone numbers** are normalised to `91XXXXXXXXXX`. Orders without a valid mobile are logged as `skipped`, never an error.

## Contacts API (audience data)

One row per WhatsApp number, for building ad audiences and excluding buyers.

1. Set a long random key, either in WooCommerce -> WhatsApp Alerts -> Settings -> "Contacts API key", or in `wp-config.php`:

   ```php
   define( 'GKWA_CONTACTS_API_KEY', '<long random string>' );
   ```

2. Call it:

   ```
   GET https://admin.grahakavach.in/wp-json/gk-whatsapp/v1/contacts?updated_after=2026-10-01&page=1&per_page=100
   Authorization: Bearer <GKWA_CONTACTS_API_KEY>
   ```

   `updated_after` is optional (ISO 8601 or `Y-m-d`); `per_page` is at most 200. A logged-in user who can manage WooCommerce may also call it. Without the key and without that role the endpoint returns 401.

3. Response:

   ```json
   {
     "total": 42, "page": 1, "per_page": 100, "pages": 1,
     "contacts": [{
       "phone": "919812345678",
       "name": "Asha Verma",
       "first_message_at": "2026-10-02T06:10:00+00:00",
       "last_message_at": "2026-10-05T11:02:00+00:00",
       "first_reply_at": "2026-10-02T06:12:00+00:00",
       "last_reply_at": "2026-10-04T09:30:00+00:00",
       "messages_sent": 3,
       "lead_status": "ordered",
       "orders": 1, "order_amount": 2499, "currency": "INR",
       "opted_out": false, "opted_out_at": null,
       "ad": { "ad_id": "1203...", "ctwa_clid": "AR...", "headline": "...", "source_url": "..." }
     }]
   }
   ```

`lead_status` is `ordered` (a paid order is linked to the number), `not_interested` (replied STOP), `interested` (replied, or has an active/clicked cart) or `no_reply` (we messaged, they never answered). Opted-out numbers are still listed so they can be excluded.

Notes: replies, profile name and ad referral (`ad_id`, `ctwa_clid`) are stored from the moment this version is installed, so earlier conversations have no reply times or ad data. Orders are linked to a number through the message log, so only orders that triggered a message are counted. Subscribe the Meta webhook to **messages** (step 5 above) or no replies are recorded.
