import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";
import { getCmsPages, getLandingSlugs, getPosts } from "@/lib/wordpress/adapters";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.frontendUrl.replace(/\/$/, "");

  const [posts, cmsPages, landingSlugs] = await Promise.all([getPosts(100), getCmsPages(), getLandingSlugs()]);

  /*
   * No `lastModified` on pages that have no real modification date. A date of
   * "now" on every URL teaches crawlers to ignore the field.
   */
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/fire-safety-kit`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/book-now`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/how-it-works`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/safety-guide`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/become-a-dealer`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy-policy`, changeFrequency: "yearly", priority: 0.4 },
  ];

  // Policy pages come from WordPress, so only URLs that really resolve are
  // listed (a hard-coded list had /terms-conditions, which is a 404).
  const known = new Set(staticPages.map((entry) => entry.url));
  const policyPages: MetadataRoute.Sitemap = cmsPages
    .map((page) => `${baseUrl}${page.href}`)
    .filter((url) => !known.has(url))
    .map((url) => ({ url, changeFrequency: "yearly" as const, priority: 0.4 }));

  // /book-now is listed above; every other landing page lives at /lp/<slug>.
  const landingPages: MetadataRoute.Sitemap = landingSlugs
    .filter((slug) => slug !== "book-now")
    .map((slug) => ({ url: `${baseUrl}/lp/${slug}`, changeFrequency: "weekly" as const, priority: 0.6 }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));


  return [...staticPages, ...policyPages, ...landingPages, ...postPages];
}
