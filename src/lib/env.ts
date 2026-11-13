import { z } from "zod";

/**
 * Environment contract.
 *
 * Only `NEXT_PUBLIC_SITE_URL` is public. Everything else — including the
 * WordPress and WooCommerce origins — is server-only, because `NEXT_PUBLIC_*`
 * values are inlined into the browser bundle at build time and cannot be
 * revoked without a redeploy. The backend origin is not a secret, but it also
 * does not need to be advertised in page source.
 *
 * `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET` must never appear in a
 * `NEXT_PUBLIC_*` name. They are read exclusively through `serverEnv()`, which
 * is guarded by `server-only`.
 */

/**
 * `.default()` only substitutes when the *raw* input is `undefined` — it
 * inspects the value handed to the schema before any preprocessing runs. An
 * env var that exists but is set to `""` (easy to do by accident in the
 * Vercel dashboard) is not `undefined`, so nesting `.default()` inside a
 * preprocessed schema never sees it and `.url()` validation fails instead.
 * Putting `z.preprocess` on the outside fixes that: it coerces `""` to
 * `undefined` first, and *that* is what `.default()` downstream then sees.
 */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const url = (fallback: string) =>
  z.preprocess(blankToUndefined, z.string().url().default(fallback));
const str = (fallback: string) =>
  z.preprocess(blankToUndefined, z.string().default(fallback));

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: url("https://grahakavach.in"),
  NEXT_PUBLIC_META_PIXEL_ID: str("1790598735635524"),
});

const serverSchema = z.object({
  WORDPRESS_URL: url("https://admin.grahakavach.in"),
  WORDPRESS_GRAPHQL_URL: url("https://admin.grahakavach.in/graphql"),
  WOOCOMMERCE_URL: url("https://admin.grahakavach.in"),
  WC_CONSUMER_KEY: str(""),
  WC_CONSUMER_SECRET: str(""),
  REVALIDATION_SECRET: str(""),
  // Razorpay Checkout. The secret is server-only; the key id is handed to the browser by the order API.
  RAZORPAY_KEY_ID: str(""),
  RAZORPAY_KEY_SECRET: str(""),
  // Resend transactional email. Key is server-only; sending is skipped when it is blank.
  RESEND_API_KEY: str(""),
  RESEND_FROM: str("Graha Kavach <no-reply@grahakavach.in>"),
  CONTACT_NOTIFY_EMAIL: str("grahakavach@gmail.com"),
  // Meta Pixel & Conversions API
  META_PIXEL_ID: str("1790598735635524"),
  META_CONVERSIONS_API_ACCESS_TOKEN: str(""),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

/** Server-only environment. Throws if a value is malformed rather than guessing. */
export function serverEnv() {
  if (cachedServerEnv) return cachedServerEnv;

  cachedServerEnv = serverSchema.parse({
    WORDPRESS_URL: process.env.WORDPRESS_URL,
    WORDPRESS_GRAPHQL_URL: process.env.WORDPRESS_GRAPHQL_URL,
    WOOCOMMERCE_URL: process.env.WOOCOMMERCE_URL,
    WC_CONSUMER_KEY: process.env.WC_CONSUMER_KEY ?? process.env.WOO_CONSUMER_KEY,
    WC_CONSUMER_SECRET:
      process.env.WC_CONSUMER_SECRET ?? process.env.WOO_CONSUMER_SECRET,
    REVALIDATION_SECRET:
      process.env.REVALIDATION_SECRET ?? process.env.REVALIDATE_SECRET,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    CONTACT_NOTIFY_EMAIL: process.env.CONTACT_NOTIFY_EMAIL,
    META_PIXEL_ID:
      process.env.NEXT_PUBLIC_META_PIXEL_ID ??
      process.env.META_PIXEL_ID ??
      "1790598735635524",
    META_CONVERSIONS_API_ACCESS_TOKEN:
      process.env.META_CONVERSIONS_API_ACCESS_TOKEN ??
      process.env.META_ACCESS_TOKEN,
  });

  return cachedServerEnv;
}

/** True when WooCommerce REST credentials are configured. */
export function hasWooCredentials(): boolean {
  const env = serverEnv();
  return env.WC_CONSUMER_KEY !== "" && env.WC_CONSUMER_SECRET !== "";
}
