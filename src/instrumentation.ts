/**
 * Runs once when the server starts. It only writes to the log: a deployment whose
 * environment variables were lost (for example after the Git source was changed in
 * Hostinger) otherwise looks healthy while checkout quietly stops taking the
 * advance, emails stop and ad tracking goes dark.
 */
const REQUIRED: { name: string; why: string }[] = [
  { name: "RAZORPAY_KEY_ID", why: "online payment and the COD advance are switched off" },
  { name: "RAZORPAY_KEY_SECRET", why: "online payment and the COD advance are switched off" },
  { name: "RESEND_API_KEY", why: "contact, dealer and order emails are not sent" },
  { name: "META_CONVERSIONS_API_ACCESS_TOKEN", why: "Meta server-side events (Conversions API) are not sent" },
  { name: "REVALIDATION_SECRET", why: "content edits in WordPress do not refresh the site" },
  { name: "WC_CONSUMER_KEY", why: "WooCommerce products and checkout are unavailable" },
  { name: "WC_CONSUMER_SECRET", why: "WooCommerce products and checkout are unavailable" },
];

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED.filter(({ name }) => !process.env[name]);
  if (missing.length === 0) return;

  console.error(
    [
      "[env] These environment variables are NOT set on this server:",
      ...missing.map(({ name, why }) => `  - ${name}: ${why}`),
      "[env] Add them in Hostinger > Websites > this site > Environment variables, then redeploy.",
    ].join("\n"),
  );
}
