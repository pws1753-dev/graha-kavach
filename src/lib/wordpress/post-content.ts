/**
 * Clean-up applied to a WordPress post body before it is rendered.
 *
 * The editor content has a few recurring defects that hurt SEO or look broken:
 *  - headings ending in a stray "-" ("One kit for the riskiest spots-"),
 *  - FAQ headings written five different ways,
 *  - links to retired or misspelled blog URLs that only work through a redirect,
 *  - a pasted JSON-LD block that shows up as visible text.
 * The fixes live here so every post gets them, whatever the editor typed.
 */

const OLD_BUYING_GUIDE = "/blog/fire-extinguisher-for-home-in-india-buying-guide";
const NEW_BUYING_GUIDE = "/blog/fire-extinguisher-for-home-buying-guide-india";

const FAQ_HEADING = /^\s*(?:faq['’]?s?|frequently asked questions?)\s*[:?-]?\s*$/i;

export function cleanPostContent(html: string): string {
  return (
    html
      // "...riskiest spots-" -> "...riskiest spots" (headings only)
      .replace(/(<h[2-4][^>]*>)([^<]*?)\s*-\s*(<\/h[2-4]>)/gi, "$1$2$3")
      // One FAQ heading everywhere
      .replace(/(<h[2-4][^>]*>)([^<]*)(<\/h[2-4]>)/gi, (whole, open: string, text: string, close: string) =>
        FAQ_HEADING.test(text) ? `${open}Frequently Asked Questions${close}` : whole,
      )
      // Links straight to the final URL instead of through a 301
      .replace(new RegExp(`${OLD_BUYING_GUIDE}(?=["'/?#])`, "g"), NEW_BUYING_GUIDE)
      .replace(/entinguisher/g, "extinguisher")
      // A schema block pasted into the body as text
      .replace(/<p>\s*(?:<code>)?\s*(?:&lt;script[^<]*&gt;)?\s*\{\s*(?:"|&quot;|“|&#8220;)@context[\s\S]*?<\/p>/gi, "")
  );
}
