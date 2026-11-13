import localFont from "next/font/local";
import "./landing.css";

/*
 * The site body font is Manrope at 400/500 and has no Devanagari. Landing pages
 * are in Hindi and use heavier weights, so they load Mukta for the script and
 * Manrope 600-800 for numerals, buttons and the countdown, on these routes only.
 *
 * The fonts are files in src/fonts rather than Google Fonts, so a build never
 * depends on a network fetch. Mukta's Latin and Devanagari subsets are separate
 * families; landing.css lists both and the browser picks the right one per glyph.
 * (next/font needs literal values, so the weights are written out in full.)
 */
const mukta = localFont({
  variable: "--font-lp-mukta-latin",
  src: [
    { path: "../../fonts/mukta-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/mukta-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/mukta-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/mukta-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/mukta-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  adjustFontFallback: false,
});

const muktaDevanagari = localFont({
  variable: "--font-lp-mukta-dev",
  src: [
    { path: "../../fonts/mukta-devanagari-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/mukta-devanagari-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/mukta-devanagari-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/mukta-devanagari-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/mukta-devanagari-800-normal.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  adjustFontFallback: false,
});

const manrope = localFont({
  variable: "--font-lp-manrope",
  src: [
    { path: "../../fonts/manrope-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/manrope-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/manrope-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/manrope-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});

/** Fonts and base styles shared by /book-now and every /lp/<slug> page. */
export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      lang="hi"
      className={`${mukta.variable} ${muktaDevanagari.variable} ${manrope.variable} lp-root`}
    >
      {children}
    </div>
  );
}
