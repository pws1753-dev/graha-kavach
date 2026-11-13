# Commerce checks and sales workflow

## Sales team

- Open **WooCommerce → Sales Desk** for the latest 50 confirmed orders, contact links, dispatch readiness and outstanding COD balance. The cards describe this displayed queue, not lifetime revenue.
- Customer phone and WhatsApp links are also available in the normal Orders table. WhatsApp links open a chat; they do not send messages.
- Packing slips show shipping phone, falling back to billing phone for older orders, and the amount still to collect. Customer phone missing is explicitly flagged.
- Draft, pending, failed, cancelled and refunded orders cannot generate an invoice or packing slip. Existing invoice numbers are preserved.

## Payment and tax safeguards

- Prices include GST. WooCommerce splits the advertised amount into net price and tax before applying coupons. A frontend total mismatch prevents a payment request.
- Advance/online attempts remain checkout drafts until verified. Legacy storefront builds receive a compatible `pending` response for an individual draft while its stored status remains a draft.
- Confirmation checks gateway order, receipt, amount, currency and captured status. Retrying confirmation does not create a new charge. A failure inside the popup can be followed by a successful retry in that popup.
- `gk_reconcile_payments` runs through WordPress cron every five minutes. It checks recent, unconfirmed storefront orders against Razorpay using the existing gateway credentials. It confirms only captured, unrefunded payments with matching references and amounts. Cancelled orders require manual review and are never revived automatically.
- The frontend pins the gateway order ID and visitor attribution on the WooCommerce order. Background recovery reuses the verifier and the same Meta Purchase event ID.
- WordPress cron depends on traffic or the host's cron runner. Monitor it alongside WooCommerce scheduled actions and payment gateway records.

## Verification

`npm test`, `npm run lint`, `npm run build`, and `npm audit` run locally before deployment.

`node --env-file=.env scripts/audit-commerce.cjs` is read-only and logs IDs/counts rather than customer details. Its gateway window currently begins November 12, 2026 IST.

`scripts/verify-commerce-live.cjs` deliberately creates unpaid QA drafts and moves them to Trash in a `finally` block. It must be run only against the intended test/live backend. Never perform a real customer payment just to test checkout.

`scripts/verify-sales-live.cjs` requires the authorized WordPress Basic header in `GK_MCP_AUTH`. It verifies a real PDF for order 424, anonymous access rejection and cancellation rejection, saving customer data only under ignored `.local/audit/`. Adapt the fixture IDs for another installation.

## Deployment

Frontend: GitHub `pws1753-dev/graha-kavach`, branch `main`, auto-deployed to `grahakavach.in` by Hostinger. Check the deployed commit and completed build, then confirm the live HTML's `data-dpl-id` matches `.next/required-server-files.json` → `config.deploymentId`.

Backend: Headless Core 1.4.0 and Part Payment & Invoice 1.2.0 on `admin.grahakavach.in`. Deploy whole plugin directories atomically through hosting so included files are present before loaders change. The sales module has a defensive loader to preserve payment/order functions if an upload is interrupted.

Chunk failures trigger one guarded page reload. A stable source-based deployment ID makes stale client navigations reload across releases; it does not replace the host's atomic release switching.
