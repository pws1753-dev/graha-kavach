import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SocialProfileLinks } from "@/components/layout/social-profile-links";
import {
  Shield,
  Award,
  Factory,
  Flame,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Beaker,
  Heart,
  Eye,
  Target,
  Sparkles,
  Home,
} from "lucide-react";
import { buildBreadcrumbSchema, buildAboutPageSchema, buildOrganizationSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Fire Extinguisher Manufacturers in India",
  description:
    "Graha Kavach by Speciality Geochem, Udaipur: fire extinguisher manufacturer and fire safety equipment supplier in India since 2010. ISO and CE certified.",
  keywords: [
    "about Graha Kavach",
    "Speciality Geochem Udaipur",
    "Rakesh Mishra Udaipur",
    "fire equipment manufacturer Rajasthan",
    "RIICO fire safety manufacturing",
    "home fire safety legacy",
    "16 years fire protection",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Graha Kavach — 16 Years of Fire Protection Heritage",
    description:
      "From manufacturing facilities in Udaipur since 2010 to family homes nationwide: discover the story of Graha Kavach.",
    url: "https://grahakavach.in/about",
    siteName: "Graha Kavach",
    images: [{ url: "/brand/graha-kavach-logo.png", width: 1200, height: 630, alt: "About Graha Kavach" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Graha Kavach — 16 Years of Fire Protection Heritage",
    description:
      "From manufacturing facilities in Udaipur since 2010 to family homes nationwide: discover the story of Graha Kavach.",
    images: ["/brand/graha-kavach-logo.png"],
  },
};

const SPECIFICATIONS = [
  { device: "Fire Extinguisher", spec: "Extinguishing agent", detail: "ABC dry powder" },
  { device: "Fire Extinguisher", spec: "Capacity", detail: "2 kg" },
  { device: "Fire Extinguisher", spec: "Discharge time", detail: "Approximately 10-12 seconds" },
  { device: "Fire Extinguisher", spec: "Throw range", detail: "Approximately 3-4 metres" },
  { device: "Fire Ball", spec: "Extinguishing agent", detail: "MAP powder" },
  { device: "Fire Ball", spec: "Unit weight", detail: "Approximately 1.3 kg" },
  { device: "Fire Ball", spec: "Activation", detail: "Flame activated" },
  { device: "Fire Ball", spec: "Shelf life", detail: "5 years, as listed in the product brochure" },
  { device: "Fire Blanket", spec: "Material", detail: "100% woven fiberglass fabric" },
  { device: "Fire Blanket", spec: "Temperature rating", detail: "Withstands heat up to 550°C" },
  { device: "Fire Blanket", spec: "Single use guideline", detail: "Treat as single-use emergency item after flame exposure" },
];

const TIMELINE = [
  {
    year: "2010",
    title: "Speciality Geochem Established",
    text: "Founded in Udaipur, Rajasthan, specialising in chemical formulations, industrial minerals, and certified fire-fighting equipment for businesses.",
  },
  {
    year: "2018",
    title: "Residential Safety Awakening",
    text: "After witnessing severe residential fires, we asked: “Our clients protect their workplaces, but are their homes safe?” Dedicated domestic research began.",
  },
  {
    year: "2022",
    title: "Graha Kavach System Engineered",
    text: "Engineered the all-in-one 3-piece domestic fire kit: combining 24/7 automatic suppression, instant kitchen smothering, and active PASS knockdown.",
  },
  {
    year: "2026",
    title: "Nationwide Protection Brought Home",
    text: "Full direct-to-home delivery across all 28 states and 8 union territories with comprehensive family pictorial safety guides.",
  },
];

export default function AboutPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
  ]);
  const aboutSchema = buildAboutPageSchema();
  const orgSchema = buildOrganizationSchema();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, aboutSchema, orgSchema],
  };

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[#fff7f5] via-white to-background py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Shield className="size-3.5" />
              16 Years of Protection • Est. 2010
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[48px] lg:leading-[1.15]">
              16 Years as a Fire Extinguisher Manufacturer. Now, We’re Bringing That Protection Home.
            </h1>

            <p className="mt-5 text-lg font-medium leading-relaxed text-foreground sm:text-xl">
              Graha Kavach is the home safety brand of Speciality Geochem, a fire safety equipment manufacturer in Udaipur since 2010. For the people you love.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/fire-safety-kit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d92212] via-[#e63920] to-[#f95738] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95"
              >
                <span>Explore the Home Fire Safety Kit</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/safety-guide"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-semibold text-foreground shadow-xs transition hover:bg-stone-50"
              >
                <span>Read Free Safety Guide</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story — Home Is More Than Four Walls */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-primary">
                  Our Story
                </span>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  Home Is More Than Four Walls.
                </h2>
              </div>

              <div className="space-y-4 text-base leading-relaxed text-foreground-muted sm:text-lg">
                <p>
                  It’s where Maa cooks with love, where Papa returns after a long day, where children grow up, and where every little family memory is made. It holds the furniture you saved for, the appliances bought with your hard-earned money, and precious belongings no amount of money could replace.
                </p>

                <p>
                  For <strong className="text-foreground">16 years, Speciality Geochem, Udaipur</strong>, has helped businesses protect their workplaces from fire. With manufacturing roots dating back to <strong className="text-foreground">2010</strong>, established manufacturing infrastructure and export experience, we built our expertise around helping protect what matters.
                </p>
              </div>

              {/* Emotional Turning Point Quote */}
              <div className="rounded-2xl border-l-4 border-primary bg-primary-subtle/30 p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  The Turning Point
                </p>
                <p className="mt-2 text-base font-semibold italic text-foreground sm:text-xl sm:leading-relaxed">
                  “Humare itne saare customers apne businesses ko fire se protect karte hain, par kya unke ghar bhi safe hain?”
                </p>
                <p className="mt-3 text-sm text-foreground-muted">
                  Then, after reading about a major home fire, we asked ourselves that question. We realised that home fire safety had rarely entered those conversations. We had been helping protect the places where people work—but what about the places they call home? That question gave our experience a new purpose.
                </p>
              </div>

              <p className="text-base leading-relaxed text-foreground-muted sm:text-lg">
                That realisation gave birth to <strong className="text-foreground">Graha Kavach</strong>—bringing our fire safety experience into homes through an <strong className="text-foreground">Automatic Fire Ball, Fire Extinguisher and Fire Blanket, together in one kit</strong>. Created specifically for household preparedness, Graha Kavach helps families take a practical step towards protecting lives, cherished belongings and years of hard work. Because fire doesn’t warn us before it comes, and the people we love deserve a home that is prepared.
              </p>
            </div>

            {/* Right Card / Visual Feature */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-border bg-stone-50/70 p-6 shadow-sm sm:p-8 space-y-6">
                <div className="rounded-2xl border border-primary/20 bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                      <Heart className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">For What Cannot Be Replaced</h3>
                      <p className="text-xs text-muted-foreground">Family, memories, and peace of mind</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
                    Workplace safety codes protect offices and factories. But your home houses your entire world. Graha Kavach brings industrial-grade vigilance directly into residential spaces.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                      <Home className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">All 3 Critical Devices in One Fire Safety Kit</h3>
                      <p className="text-xs text-muted-foreground">Engineered for Indian residences</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-foreground-muted">
                    <li className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span><strong>Automatic Fire Ball:</strong> 24/7 protection over electrical boards & inverter batteries.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span><strong>2 kg ABC Fire Extinguisher:</strong> Active PASS knockdown for sudden room fires.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span><strong>550°C Fire Blanket:</strong> Instant kitchen oil flame smothering and personal wrap.</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
                    Everything ships together in our{" "}
                    <Link href="/fire-safety-kit" className="font-semibold text-primary underline-offset-2 hover:underline">
                      home fire safety kit
                    </Link>
                    , with wall brackets and screws included.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Zero Hesitation In An Emergency</h3>
                      <p className="text-xs text-muted-foreground">Designed for women, elders, and domestic helpers</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
                    No complicated valves or confusing manuals. Every kit includes step-by-step pictorial guides in simple language.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Cards */}
      <section className="border-y border-border bg-stone-50/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Vision */}
            <div className="flex flex-col justify-between rounded-3xl border border-border bg-white p-8 shadow-xs sm:p-10 transition-shadow hover:shadow-md">
              <div>
                <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-subtle text-primary">
                  <Eye className="size-6" />
                </div>
                <span className="mt-4 block text-xs font-bold tracking-widest text-primary uppercase">
                  Our Vision
                </span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Every Home Prepared. Every Family Aware.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground-muted sm:text-base sm:leading-8">
                  We envision a future where fire safety is a natural part of every Indian home—as thoughtfully considered as comfort and security. A future where families recognise everyday fire risks and understand how to prepare for them, helping protect both lives and the homes built through years of effort. We want the awareness that businesses bring to workplace safety to find an equally meaningful place at home.
                </p>
              </div>

              <div className="mt-8 border-t border-border pt-4 text-xs font-semibold text-foreground">
                Awareness • Prevention • Preparedness
              </div>
            </div>

            {/* Mission */}
            <div className="flex flex-col justify-between rounded-3xl border border-border bg-white p-8 shadow-xs sm:p-10 transition-shadow hover:shadow-md">
              <div>
                <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-subtle text-primary">
                  <Target className="size-6" />
                </div>
                <span className="mt-4 block text-xs font-bold tracking-widest text-primary uppercase">
                  Our Mission
                </span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Bringing Experience Home. Making Preparedness Practical.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground-muted sm:text-base sm:leading-8">
                  Our mission is to bring 16 years of manufacturing and fire safety experience closer to families through a home-focused kit and clear, accessible guidance. By combining essential equipment with awareness of its correct use, care and limitations, we aim to help households prepare before an emergency occurs and understand when a safe exit must come first. Through Graha Kavach, we want to make fire preparedness a decision families take today—for the people and memories that make tomorrow worth protecting.
                </p>
              </div>

              <div className="mt-8 border-t border-border pt-4 text-xs font-semibold text-foreground">
                Practical Equipment • Family Guidance • Certified Quality
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="bg-white py-16 md:py-20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border/90 bg-[#faf9f8] p-8 shadow-xs sm:p-12 lg:p-16">
            <div className="max-w-3xl">
              <p className="text-xs font-bold tracking-[0.2em] text-[#d92212] uppercase">
                THE FOUNDER
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Rakesh Mishra
              </h2>
              <p className="mt-1 text-sm font-medium text-foreground-muted sm:text-base">
                Founder & Business Owner, Speciality Geochem (Est. 2010)
              </p>

              <blockquote className="mt-6 border-l-2 border-[#d92212] pl-4 text-base italic leading-relaxed text-foreground sm:text-lg">
                &ldquo;A manufacturing business is only as strong as the systems behind it. Every facility we run is certified, every product is tested, and we never compromise on what leaves the factory.&rdquo;
              </blockquote>

              <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground-muted sm:text-base">
                <p>
                  Based in Udaipur, Rajasthan, Rakesh Mishra established <strong>Speciality Geochem in 2010</strong>. Over years of dedicated innovation, he expanded it into a premier manufacturing enterprise across two RIICO production units, engineering certified fire safety equipment and industrial minerals. He created <strong>Graha Kavach</strong> to bring that same uncompromising standard directly to family homes.
                </p>
                <p className="text-xs text-foreground-muted/90">
                  Graha Kavach is associated with Speciality Geochem, Udaipur, Rajasthan. Component presentation may vary by production batch; product specifications are kept to booklet-listed values.
                </p>
              </div>

              <div className="mt-8">
                <a
                  href="https://therakeshmishra.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground shadow-xs transition hover:border-[#d92212]/50 hover:bg-stone-50 hover:text-[#d92212]"
                >
                  <span>Visit therakeshmishra.com</span>
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing & Speciality Geochem, Udaipur */}
      <section className="bg-white py-16 md:py-24 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: Factory Image */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-stone-50 shadow-sm">
                <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src="https://admin.grahakavach.in/wp-content/uploads/office.webp"
                    alt="Speciality Geochem Office & Manufacturing Facility — Udaipur, Rajasthan"
                    width={1200}
                    height={800}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                <div className="p-4 border-t border-border bg-stone-50/80 flex items-center justify-between text-xs text-foreground-muted">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Factory className="size-4 text-primary" />
                    Speciality Geochem Manufacturing Unit
                  </span>
                  <span>Udaipur, Rajasthan</span>
                </div>
              </div>
            </div>

            {/* Right: Manufacturing Credentials */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Factory className="size-3.5" />
                Speciality Geochem • Udaipur, Rajasthan
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Fire Extinguisher Manufacturers in India Since 2010
              </h2>

              <p className="mt-5 text-sm sm:text-base leading-relaxed text-foreground-muted">
                Graha Kavach is made by Speciality Geochem, one of the few fire safety equipment manufacturers in India that designs, fills and tests its own products. Since 2010 we have run two RIICO production units in Udaipur, Rajasthan, serving businesses with certified manufacturing. Every Graha Kavach fire extinguisher, fire ball and fire blanket is checked in-house before it ships. As an extinguisher manufacturer, not a reseller, we control quality from raw material to the final box.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl border border-border bg-stone-50/60 p-3.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>2 RIICO Units</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-foreground-muted">Industrial facilities in Udaipur</p>
                </div>

                <div className="rounded-xl border border-border bg-stone-50/60 p-3.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                    <Award className="size-4 text-primary" />
                    <span>ISO / CE Certified</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-foreground-muted">Rigorous standards compliance</p>
                </div>

                <div className="rounded-xl border border-border bg-stone-50/60 p-3.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                    <Beaker className="size-4 text-primary" />
                    <span>In-House Testing</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-foreground-muted">Thermal & pressure endurance lab</p>
                </div>

                <div className="rounded-xl border border-border bg-stone-50/60 p-3.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                    <Factory className="size-4 text-primary" />
                    <span>Est. 2010</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-foreground-muted">16 years of trusted protection</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  href="https://specialitygeochem.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="md"
                >
                  <span>Visit Speciality Geochem Official Website</span>
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Focus: Udaipur Homes & Made in Udaipur */}
      <section className="bg-stone-50/60 py-16 md:py-20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="rounded-3xl border border-border bg-white p-8 shadow-xs sm:p-10">
            <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Why every Indian home needs a fire safety kit
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-foreground-muted sm:text-base">
              From old city homes with aging wiring to new high-rise flats, Indian homes share the same risks: LPG cylinders, overloaded MCB panels, inverter batteries and pooja diyas. Most homes still have no fire extinguisher at all. A{" "}
              <Link href="/" className="font-semibold text-primary underline-offset-2 hover:underline">
                fire extinguisher for home
              </Link>
              , kept with a fire ball and a fire blanket, lets your family act in the first minute, before a small fire spreads. Not sure what to buy? Read our{" "}
              <Link href="/blog/fire-extinguisher-for-home-buying-guide-india" className="font-semibold text-primary underline-offset-2 hover:underline">
                fire extinguisher buying guide for India
              </Link>
              .
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-white p-8 shadow-xs sm:p-10">
            <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Made in Udaipur, supplied across India
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-foreground-muted sm:text-base">
              Most fire safety kits listed online are imported and resold. Graha Kavach is different: we are the manufacturer and the fire extinguisher supplier. That means one point of contact for quality, warranty and refills, and direct delivery to all 28 states and 8 union territories.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Specifications Comparison Table */}
      <section className="bg-white py-16 md:py-20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Certified Technical Specifications
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Lab-Verified Component Metrics
            </h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Every element of the Graha Kavach system is manufactured to exact chemical and physical thresholds.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-stone-50 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-[#d92212]">Equipment</th>
                    <th scope="col" className="px-6 py-4">Specification Parameter</th>
                    <th scope="col" className="px-6 py-4">Certified Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {SPECIFICATIONS.map((row, index) => (
                    <tr key={index} className="transition-colors hover:bg-stone-50/70">
                      <td className="px-6 py-3.5 font-medium text-[#d92212]">
                        {row.device}
                      </td>
                      <td className="px-6 py-3.5 text-foreground">
                        {row.spec}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-foreground-muted sm:text-sm">
                        {row.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Single-Use Fire Blanket FAQ Card */}
          <div className="mt-8 rounded-2xl border border-red-100 bg-[#fffcfb] p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-[#d92212]">
                09
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground">
                  Can the fire blanket be reused?
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  No. Treat the fire blanket as a single-use emergency item after flame or hot-oil exposure and replace it after use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones Timeline */}
      <section className="border-b border-border bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Our Journey
            </span>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              16 Years of Protection (Est. 2010)
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TIMELINE.map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-border bg-stone-50/50 p-6 shadow-xs"
              >
                <div className="inline-flex rounded-lg bg-primary-subtle px-2.5 py-1 text-sm font-bold text-primary">
                  {item.year}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-foreground-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suppliers in India */}
      <section className="border-b border-border bg-stone-50/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-white p-8 shadow-xs sm:p-10">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Fire Extinguisher Suppliers in India for Homes, Societies and Offices
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground-muted sm:text-base">
              Families can order the complete kit online with free delivery and cash on delivery. Apartment societies, schools, offices and resellers looking for reliable fire safety equipment suppliers can buy direct from the factory. Share your requirement and our team will send a bulk quote and placement advice.{" "}
              <Link href="/contact" className="font-semibold text-primary underline-offset-2 hover:underline">
                Contact us for bulk orders
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-primary py-16 md:py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">
            Graha Kavach — Protection, Brought Home.
          </p>
          <h2 className="mt-3 text-2xl font-bold sm:text-4xl">
            For the people and memories that make tomorrow worth protecting.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-subtle sm:text-lg">
            Equip your home with the complete 3-in-1 Graha Kavach Fire Safety Kit, made and supplied directly by a fire extinguisher manufacturer you can verify. Automatic vigilance, kitchen smothering, and active knockdown—delivered directly from our Udaipur facility.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/fire-safety-kit"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-sm transition hover:bg-stone-100"
            >
              <span>Explore the Home Fire Safety Kit</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/safety-guide"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <span>Read Free Safety Guide</span>
            </Link>
          </div>
          <SocialProfileLinks className="mt-6 flex flex-col items-center text-sm text-white" />
        </div>
      </section>
    </div>
  );
}
