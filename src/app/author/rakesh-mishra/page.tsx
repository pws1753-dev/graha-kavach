import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/wordpress/adapters";
import { stripHtml } from "@/lib/wordpress/format";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { BLOG_AUTHOR, buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seo/structured-data";
import { siteConfig } from "@/lib/config/site";

export const revalidate = 300;

const PATH = BLOG_AUTHOR.path;

export const generateMetadata = (): Metadata =>
  buildSeoMetadata({
    fallbackTitle: `${BLOG_AUTHOR.name}, ${BLOG_AUTHOR.jobTitle}`,
    fallbackDescription: `${BLOG_AUTHOR.name} is the founder of Speciality Geochem, the Udaipur manufacturer behind Graha Kavach, and the author of its home fire safety guides.`,
    path: PATH,
  });

export default async function AuthorPage() {
  const baseUrl = siteConfig.frontendUrl.replace(/\/$/, "");
  const posts = await getPosts(100);

  const { "@context": _orgContext, ...organization } = buildOrganizationSchema();
  const { "@context": _crumbContext, ...breadcrumb } = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: BLOG_AUTHOR.name, path: PATH },
  ]);
  void _orgContext;
  void _crumbContext;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${baseUrl}${PATH}#profile`,
        url: `${baseUrl}${PATH}`,
        name: `${BLOG_AUTHOR.name}, ${BLOG_AUTHOR.jobTitle}`,
        inLanguage: "en-IN",
        isPartOf: { "@id": `${baseUrl}/#website` },
        mainEntity: { "@id": `${baseUrl}${PATH}#person` },
      },
      {
        "@type": "Person",
        "@id": `${baseUrl}${PATH}#person`,
        name: BLOG_AUTHOR.name,
        jobTitle: BLOG_AUTHOR.jobTitle,
        url: `${baseUrl}${PATH}`,
        sameAs: [BLOG_AUTHOR.url],
        worksFor: { "@id": `${baseUrl}/#organization` },
      },
      breadcrumb,
      organization,
    ],
  };

  return (
    <main className="bg-background py-12 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-[90%] max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{BLOG_AUTHOR.name}</h1>
        <p className="mt-2 text-base font-medium text-foreground-muted">{BLOG_AUTHOR.jobTitle}</p>

        <p className="mt-6 text-base leading-relaxed text-foreground-muted">
          Rakesh Mishra founded Speciality Geochem in Udaipur, Rajasthan in 2010. The company has made fire safety equipment for factories and
          offices for years, and Graha Kavach brings the same certified protection to Indian homes. He is the author of the fire safety
          guides on this site. Find him online at{" "}
          <a href={BLOG_AUTHOR.url} rel="author noopener" className="font-medium text-primary underline">
            therakeshmishra.com
          </a>
          .
        </p>

        {posts.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Guides by {BLOG_AUTHOR.name}</h2>
            <ul className="mt-4 space-y-2">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="text-primary underline-offset-2 hover:underline">
                    {stripHtml(post.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
