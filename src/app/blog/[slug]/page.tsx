import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ChevronRight, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { getPostBySlug, getRelatedPosts } from "@/lib/wordpress/adapters";
import { stripHtml, calculateReadingTime, formatIndianDate } from "@/lib/wordpress/format";
import { ShareButtons } from "@/components/blog/share-buttons";
import { BlogCard } from "@/components/blog/blog-card";

import { buildSeoMetadata } from "@/lib/seo/metadata";
import { cleanPostContent, extractFaqs } from "@/lib/wordpress/post-content";
import {
  BLOG_AUTHOR,
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildOrganizationSchema,
} from "@/lib/seo/structured-data";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found | Graha Kavach",
    };
  }

  const cleanTitle = stripHtml(post.title);
  const cleanExcerpt = stripHtml(post.excerpt) || cleanTitle;
  const featuredImgUrl = post.featuredImage?.node?.sourceUrl;
  const categoryNames = post.categories?.nodes.map((c) => c.name.toLowerCase()) || [];
  const keywords = [
    ...categoryNames,
    cleanTitle.toLowerCase(),
    "home fire safety",
    "fire prevention tips",
    "Graha Kavach guide",
  ];

  return buildSeoMetadata({
    seo: post.seo,
    fallbackTitle: cleanTitle,
    fallbackDescription: cleanExcerpt,
    path: `/blog/${post.slug}`,
    fallbackImage: featuredImgUrl,
    keywords,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const cleanTitle = stripHtml(post.title);
  const primaryCategory = post.categories?.nodes[0];
  const categoryName = primaryCategory?.name || "Safety Guide";
  const categorySlug = primaryCategory?.slug || "safety-guides";
  const formattedDate = formatIndianDate(post.date);
  const readingTime = calculateReadingTime(post.content);
  const featuredImgUrl = post.featuredImage?.node?.sourceUrl;

  // A category that is also called "Blog" would read "Home > Blog > Blog > Article".
  const showCategory = Boolean(primaryCategory) && categoryName.trim().toLowerCase() !== "blog";

  const relatedPosts = await getRelatedPosts(categorySlug, post.slug, 3);

  const articleSchema = buildArticleSchema({
    title: cleanTitle,
    // The meta description, not the WordPress excerpt, which ends in "[…]".
    excerpt: stripHtml(post.seo?.metaDesc || "") || stripHtml(post.excerpt),
    slug: post.slug,
    date: post.date,
    modified: post.modified || undefined,
    image: featuredImgUrl,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(showCategory ? [{ name: categoryName, path: `/blog?category=${categorySlug}` }] : []),
    { name: cleanTitle, path: `/blog/${post.slug}` },
  ]);

  const { "@context": _organizationContext, ...organizationNode } = buildOrganizationSchema();
  const { "@context": _breadcrumbContext, ...breadcrumbNode } = breadcrumbSchema;
  void _organizationContext;
  void _breadcrumbContext;
  // FAQPage from the visible FAQ section: AI search reads it even where Google shows no rich result.
  const faqSchema = buildFaqSchema(extractFaqs(cleanPostContent(post.content, post.slug)));
  const faqNode = faqSchema ? (({ "@context": _faqContext, ...node }) => (void _faqContext, node))(faqSchema) : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [articleSchema, breadcrumbNode, organizationNode, ...(faqNode ? [faqNode] : [])],
  };

  return (
    <article className="bg-background py-10 md:py-16">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1400px] px-4 xs:px-5 lg:px-8 xl:px-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-muted">
            <li>
              <Link href="/" className="transition hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3 w-3 text-foreground-muted/60" />
            </li>
            <li>
              <Link href="/blog" className="transition hover:text-foreground">
                Blog
              </Link>
            </li>
            {showCategory && (
              <>
                <li>
                  <ChevronRight className="h-3 w-3 text-foreground-muted/60" />
                </li>
                <li>
                  <Link
                    href={`/blog?category=${categorySlug}`}
                    className="transition hover:text-foreground"
                  >
                    {categoryName}
                  </Link>
                </li>
              </>
            )}
            <li>
              <ChevronRight className="h-3 w-3 text-foreground-muted/60" />
            </li>
            <li className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
              {cleanTitle}
            </li>
          </ol>
        </nav>

        {/* Article Header */}
        <header className="border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/blog?category=${categorySlug}`}
              className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/20"
            >
              {categoryName}
            </Link>
            <span className="text-foreground-muted text-xs">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
              <Clock className="h-3.5 w-3.5" />
              {readingTime}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-tight">
            {cleanTitle}
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-subtle text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  <Link href={BLOG_AUTHOR.path} rel="author" className="hover:underline">
                    {BLOG_AUTHOR.name}
                  </Link>
                </p>
                <p className="text-[11px] text-foreground-muted">{BLOG_AUTHOR.jobTitle}</p>
                <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={post.date}>{formattedDate}</time>
                </div>
              </div>
            </div>

            <ShareButtons
              title={cleanTitle}
              url={`https://grahakavach.in/blog/${post.slug}`}
            />
          </div>
        </header>

        {/* Reading UX / Article Body */}
        <div className="mt-10">
          <div
            className="gk-article"
            dangerouslySetInnerHTML={{ __html: cleanPostContent(post.content, post.slug) }}
          />
        </div>

        {/* Author / Verification Footer Card */}
        <div className="mt-12 rounded-xl border border-border bg-background-subtle p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white p-3 shadow-xs text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Verified Technical Direction
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                This guide was prepared in accordance with official Indian fire safety standards, chemical specifications from Speciality Geochem Udaipur, and the Graha Kavach Home Safety Manual. Always adhere to evacuation-first principles in an active fire.
              </p>
            </div>
          </div>
        </div>

        {/* Social Share Bar at Bottom */}
        <div className="mt-8 flex items-center justify-between border-y border-border py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to All Guides
          </Link>
          <ShareButtons
            title={cleanTitle}
            url={`https://grahakavach.in/blog/${post.slug}`}
          />
        </div>

        {/* Product Promo Banner */}
        <div className="mt-12 rounded-2xl bg-primary p-6 text-white sm:p-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <span className="rounded-md bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Early-Stage Fire Protection
              </span>
              <h3 className="mt-2 text-xl font-bold">
                Equip Your Home with Graha Kavach
              </h3>
              <p className="mt-1 text-xs text-primary-subtle max-w-md">
                Get the complete 3-in-1 kit: 2kg ABC Extinguisher, Automatic Fire Ball, and 550°C Fire Blanket for ₹2,499.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/fire-safety-kit"
                className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-xs font-bold text-primary shadow transition hover:bg-stone-100"
              >
                Explore Kit
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Related Safety Articles
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <BlogCard key={related.id} post={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
