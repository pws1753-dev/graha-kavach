/** The first campaign keeps its short address; every other landing page lives under /lp. */
export const DEFAULT_LANDING_SLUG = "book-now";

/** Only the original campaign offers full cash on delivery. */
export function isFullCodLanding(slug: string) {
  return slug === DEFAULT_LANDING_SLUG;
}

export function landingPaths(slug: string) {
  return slug === DEFAULT_LANDING_SLUG
    ? { page: "/book-now", book: "/book-now/details" }
    : { page: `/lp/${slug}`, book: `/lp/${slug}/book` };
}
