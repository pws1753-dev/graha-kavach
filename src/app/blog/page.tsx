import type { Metadata } from "next";
import { BookOpen, ShieldAlert } from "lucide-react";
import { getPosts, getCategories } from "@/lib/wordpress/adapters";
import { BlogCard } from "@/components/blog/blog-card";
import { CategoryFilter } from "@/components/blog/category-filter";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seo/structured-data";

interface BlogPageProps {
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const categories = await getCategories();
  const activeCat = categories.find((c) => c.slug === category);

  const fallbackTitle = activeCat
    ? `${activeCat.name} Guides — Fire Safety Blog`
    : "Fire Safety Blog: Guides for Indian Homes";

  const fallbackDescription = activeCat
    ? `Browse official Graha Kavach ${activeCat.name.toLowerCase()} articles, operating manuals, and expert fire safety recommendations.`
    : "Explore practical fire safety guides, technical operating instructions, equipment comparisons, and prevention tips curated by the Graha Kavach engineering team.";

  // Filtered views repeat the main list: canonical to /blog and keep them out of the index.
  const isFiltered = Boolean(category);

  return buildSeoMetadata({
    fallbackTitle,
    fallbackDescription,
    path: "/blog",
    noindex: isFiltered,
    keywords: [
      "fire safety blog",
      "fire prevention articles",
      "home fire preparedness guides",
      "extinguisher user manuals",
      "fire safety ball instructions",
      "Graha Kavach blog",
      activeCat ? `${activeCat.name.toLowerCase()} fire safety` : "fire safety articles",
    ],
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category } = await searchParams;

  const [allPosts, categories] = await Promise.all([
    getPosts(30),
    getCategories(),
  ]);

  const activeCat = categories.find((c) => c.slug === category);
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(activeCat ? [{ name: activeCat.name, path: `/blog?category=${activeCat.slug}` }] : []),
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
  const orgSchema = buildOrganizationSchema();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, orgSchema],
  };

  const filteredPosts = category && category !== "all"
    ? allPosts.filter((post) =>
        post.categories?.nodes.some((cat) => cat.slug === category)
      )
    : allPosts;

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  return (
    <div className="bg-background py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge Base & Practical Guides
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Fire Safety Blog: Guides for Indian Homes
          </h1>
          <p className="mt-4 text-base text-foreground-muted sm:text-lg">
            Practical knowledge for home preparedness, equipment maintenance, and emergency response. Sourced directly from our engineering team in Udaipur.
          </p>
        </div>

        {/* Category Filters */}
        <div className="mt-8 border-y border-border py-4">
          <CategoryFilter categories={categories} />
        </div>

        {/* Content Section */}
        {filteredPosts.length > 0 ? (
          <div className="mt-10 space-y-10">
            {/* Featured Post */}
            {featuredPost && (
              <BlogCard post={featuredPost} featured={true} />
            )}

            {/* Grid of Other Posts */}
            {regularPosts.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-12 rounded-xl border border-dashed border-border bg-background-subtle p-12 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-foreground-muted/40" />
            <h3 className="mt-4 text-lg font-bold text-foreground">
              No Articles Found in this Category
            </h3>
            <p className="mt-2 text-sm text-foreground-muted">
              Check back soon as our fire safety specialists publish new technical guides.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
