import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * SEO redirects managed in WordPress (wp-admin > Redirects).
 *
 * Rules come from the public `gk/v1/redirects` endpoint and are cached for a
 * minute, so an SEO manager's change is live without a deploy. The proxy fails
 * open: if WordPress is slow or down, pages are served normally.
 */

type Rule = { from: string; to: string; code: number; wild: boolean };

const WORDPRESS_URL = (process.env.WORDPRESS_URL || "https://admin.grahakavach.in").replace(/\/$/, "");
const REFRESH_SECONDS = 60;
const FETCH_TIMEOUT_MS = 1500;

// Permanent editorial consolidations. These remain here as a safety net even
// if the WordPress redirect service is temporarily unavailable.
const FALLBACK_REDIRECTS: Rule[] = [
  {
    from: "/blog/best-fire-extinguisher-for-home-in-india-types-size-guide",
    to: "/blog/fire-extinguisher-for-home-buying-guide-india",
    code: 301,
    wild: false,
  },
  {
    from: "/blog/fire-extinguisher-for-home-in-india-buying-guide",
    to: "/blog/fire-extinguisher-for-home-buying-guide-india",
    code: 301,
    wild: false,
  },
];

async function loadRules(): Promise<Rule[]> {
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/gk/v1/redirects`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: REFRESH_SECONDS, tags: ["wp-redirects"] },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { redirects?: Rule[] };
    return Array.isArray(data.redirects) ? data.redirects : [];
  } catch {
    return [];
  }
}

function findRule(rules: Rule[], pathname: string): Rule | undefined {
  const path = (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname).toLowerCase();

  return (
    rules.find((rule) => rule.from === path) ??
    rules.find((rule) => rule.wild && (rule.from === "/" || path.startsWith(`${rule.from}/`)))
  );
}

export async function proxy(request: NextRequest) {
  const rule = findRule(await loadRules(), request.nextUrl.pathname) ?? findRule(FALLBACK_REDIRECTS, request.nextUrl.pathname);

  if (!rule) return NextResponse.next();

  if (rule.code === 410) {
    return new NextResponse("Gone", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
    });
  }

  // Root-relative destinations resolve against the request, so they follow the live domain.
  const destination = new URL(rule.to, request.url);

  // Redirects stay on this site, whatever the rule says.
  if (destination.host.replace(/^www\./, "") !== request.nextUrl.host.replace(/^www\./, "")) {
    return NextResponse.next();
  }

  if (destination.href === request.nextUrl.href) return NextResponse.next();

  return NextResponse.redirect(destination, rule.code);
}

export const config = {
  // Skip the API, Next internals and any file with an extension (images, fonts, robots.txt, sitemap.xml...).
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
