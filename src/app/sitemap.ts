import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";
import { getCmsPages, getPosts } from "@/lib/wordpress/adapters";

/**
 * Every URL that should be indexed, built from WordPress on each request cycle,
 * so a newly published post or policy page appears without a deploy.
 *
 * `changeFrequency` and `priority` are left out on purpose: Google ignores both.
 * `lastModified` is only given where a real date exists; a date of "now" on every
 * URL teaches crawlers to ignore the field.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.frontendUrl.replace(/\/$/, "");

  const [posts, cmsPages] = await Promise.all([getPosts(100), getCmsPages()]);

  // /book-now and /lp/* are campaign pages (noindex), so they are not listed.
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl },
    { url: `${baseUrl}/fire-safety-kit` },
    { url: `${baseUrl}/how-it-works` },
    { url: `${baseUrl}/safety-guide` },
    { url: `${baseUrl}/blog` },
    { url: `${baseUrl}/become-a-dealer` },
    { url: `${baseUrl}/about` },
    { url: `${baseUrl}/contact` },
    { url: `${baseUrl}/privacy-policy` },
  ];

  // Policy pages come from WordPress, so only URLs that really resolve are listed.
  const known = new Set(staticPages.map((entry) => entry.url));
  const policyPages: MetadataRoute.Sitemap = cmsPages
    .map((page) => `${baseUrl}${page.href}`)
    .filter((url) => !known.has(url))
    .map((url) => ({ url }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...staticPages, ...policyPages, ...postPages];
}
