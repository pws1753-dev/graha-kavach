import { decodeEntities } from "./format";

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

/** Tables pasted from an editor have no header cells; the first row becomes the header row. */
function addTableHeaders(html: string): string {
  return html.replace(/<table[\s\S]*?<\/table>/gi, (table) => {
    if (/<th[\s>]/i.test(table)) return table;
    return table.replace(/<tr[\s\S]*?<\/tr>/i, (row) =>
      row
        .replace(/<td(\s[^>]*)?>/gi, (_cell, attrs: string | undefined) => `<th scope="col"${attrs ?? ""}>`)
        .replace(/<\/td>/gi, "</th>"),
    );
  });
}

export function cleanPostContent(html: string): string {
  return (
    addTableHeaders(html)
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

const FAQ_SECTION = /<h([23])[^>]*>\s*Frequently Asked Questions\s*<\/h\1>/i;

/**
 * Question and answer pairs from a post's "Frequently Asked Questions" section,
 * for the FAQPage schema. Only text that is visible on the page is used, so the
 * schema always matches what a reader sees: each question is a heading (with its
 * "1." or "Q1." number removed) and its answer is the text up to the next heading.
 */
export function extractFaqs(html: string): Array<{ q: string; a: string }> {
  const start = FAQ_SECTION.exec(html);
  if (!start) return [];

  const level = start[1];
  let section = html.slice(start.index + start[0].length);
  // The section ends at the next heading of its own level (or higher).
  const end = new RegExp(`<h[2-${level}][\s>]`, "i").exec(section);
  if (end) section = section.slice(0, end.index);

  const text = (value: string) =>
    decodeEntities(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

  const faqs: Array<{ q: string; a: string }> = [];
  const parts = section.split(/(<h[3-6][^>]*>[\s\S]*?<\/h[3-6]>)/i);

  for (let i = 1; i < parts.length; i += 2) {
    const q = text(parts[i]).replace(/^(?:Q\s*\d+|\d+)\s*[.:)]\s*/i, "");
    const a = text(parts[i + 1] ?? "");
    if (q && a) faqs.push({ q, a });
  }

  return faqs.slice(0, 15);
}
