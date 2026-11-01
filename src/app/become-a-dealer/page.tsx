import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Boxes,
  ChevronDown,
  Factory,
  FlaskConical,
  Home,
  MessageCircle,
  Phone,
  Store,
  Truck,
} from "lucide-react";
import { DealerForm } from "@/components/dealer/dealer-form";
import { DealerContactLink } from "@/components/dealer/dealer-contact-link";
import { DEALER_EMAIL, DEALER_PHONE_DISPLAY, DEALER_PHONE_TEL, DEALER_WHATSAPP_URL } from "@/lib/dealer/contact";

const PAGE_URL = "https://grahakavach.in/become-a-dealer";
const WP = "https://admin.grahakavach.in/wp-content/uploads";

const IMG = {
  kit: `${WP}/graha-kavach-combo-1.webp`,
  kitWide: `${WP}/graha-kavach-complete-fire-safety-kit.png`,
  extinguisher: `${WP}/abc-dry-powder-fire-extinguisher-2kg.png`,
  fireBall: `${WP}/graha-kavach-fire-ball-1-3kg.png`,
  blanket: `${WP}/fire-blanket-1m-x-1m.png`,
  factory: `${WP}/Speciality-Geochem-Factory-Entrance.png`,
  kitchen: `${WP}/Modern-Kitchen-with-Fire-Blanket-Safety.png`,
  panel: `${WP}/Modern-Utility-Wall-with-Fire-Safety-Ball.png`,
  hallway: `${WP}/Fire-Extinguisher-in-Modern-Hallway.png`,
  iso9001: `${WP}/iso-9001-2015.png`,
  ce: `${WP}/ce-mark.png`,
};

export const metadata: Metadata = {
  title: "Become a Fire Safety Kit Dealer | Graha Kavach Dealership",
  description:
    "Become a Graha Kavach dealer and sell India's 3-in-1 home fire safety kit. Manufacturer-direct from Udaipur, ISO 9001:2015 certified. Minimum order 40 kits.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Become a Graha Kavach Dealer",
    description:
      "Sell the 3-in-1 home fire safety kit: ABC extinguisher, automatic fire ball and fire blanket. Factory-direct. Minimum order 40 kits.",
    url: PAGE_URL,
    siteName: "Graha Kavach",
    locale: "en_IN",
    type: "website",
    images: [{ url: IMG.kitWide, width: 1600, height: 840, alt: "Graha Kavach 3-in-1 fire safety kit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Graha Kavach Dealer",
    description: "Factory-direct 3-in-1 home fire safety kit. Minimum order 40 kits.",
    images: [IMG.kitWide],
  },
  robots: { index: true, follow: true },
};

const stats = [
  { value: "2010", label: "Manufacturing since" },
  { value: "2", label: "Own RIICO units, Udaipur" },
  { value: "6", label: "Pieces in every box" },
  { value: "40", label: "Kits minimum order" },
];

const kitProducts = [
  {
    name: "2 kg ABC dry powder fire extinguisher",
    role: "Manual response",
    text: "For a small fire you can reach. Comes with its wall bracket.",
    image: IMG.extinguisher,
  },
  {
    name: "Automatic fire extinguisher ball",
    role: "Automatic response",
    text: "Sits on its stand near a risk point, such as the electrical panel, and acts when flames reach it.",
    image: IMG.fireBall,
  },
  {
    name: "Fire blanket, 1 m x 1 m",
    role: "Smothers kitchen fires",
    text: "In a quick-release pouch, ready for a pan or small kitchen fire.",
    image: IMG.blanket,
  },
];

const kitItems = [
  "2 kg ABC dry powder fire extinguisher",
  "Automatic fire extinguisher ball",
  "Fire blanket, 1 m x 1 m",
  "Extinguisher wall bracket",
  "Fire ball stand",
  "Screws and wall plugs",
];

const reasons = [
  {
    icon: Factory,
    title: "Manufacturer-direct",
    text: "Made by Speciality Geochem in its own RIICO units in Udaipur, roots since 2010. You deal with the factory, not a middleman.",
  },
  {
    icon: Award,
    title: "Certified quality",
    text: "ISO 9001:2015 certified manufacturing with CE marking and an in-house testing lab.",
  },
  {
    icon: Boxes,
    title: "One box, easy to sell",
    text: "Six pieces with all mounting hardware. Your customer needs nothing else to get it on the wall.",
  },
  {
    icon: Home,
    title: "Fits every customer",
    text: "Homes, flats, shops, offices and small businesses all need first-response fire safety.",
  },
];

const placements = [
  { image: IMG.kitchen, title: "Kitchen", text: "Fire blanket within reach of the stove." },
  { image: IMG.panel, title: "Electrical panel", text: "Automatic fire ball mounted near the meter and MCB." },
  { image: IMG.hallway, title: "Hallway or entrance", text: "Extinguisher on its wall bracket by the main door." },
];

const whoCanApply = [
  "Fire safety equipment dealers and distributors",
  "Hardware, electrical and sanitary stores",
  "Kitchen, home appliance and home improvement stores",
  "Builders, interior designers and electrical contractors",
  "Society, office and facility suppliers",
];

const steps = [
  { title: "Send your enquiry", text: "Fill in the form or message us on WhatsApp with your business details." },
  { title: "Talk to our team", text: "We call you back to share dealer pricing and terms." },
  { title: "Place your first order", text: "Sign the dealer agreement and place your order as per the terms and conditions below." },
];

const terms = [
  { title: "Appointment", text: "The Company appoints the Franchise Partner as its authorised franchisee for promoting, marketing and selling the Company's products in the assigned territory." },
  { title: "Duration", text: "The initial term of this agreement is one year from the date of execution, renewable for additional terms subject to mutual consent." },
  { title: "Minimum order quantity", text: "The minimum order quantity for regular orders is 40 kits." },
  { title: "Trial order for new partners", text: "A new Franchise Partner may place a first trial order of 10 kits." },
  { title: "Promotional support", text: "The Company shall provide promotional and branding materials (banners, brochures, digital creatives, etc.) to support marketing and visibility in the local market." },
  { title: "Account settlement", text: "All financial accounts between both parties shall be reviewed and settled on a half-yearly basis, with necessary adjustments through official debit/credit notes." },
  { title: "Performance review and termination", text: "If the Franchise Partner is found inactive or not meeting mutually agreed sales performance, the Company reserves the right to terminate this agreement with 30 days' prior notice. The decision of the Company shall be final in such matters." },
  { title: "Return of unsold stock", text: "Upon termination, the Company shall not be liable to accept or refund any unsold stock in possession of the Franchise Partner. Accounts must be settled within 7–15 days of termination." },
  { title: "Sub-dealers and representatives", text: "The Franchise Partner may appoint sub-dealers, salespersons or agents on a commission basis." },
];

const faqs = [
  { q: "What is the minimum order quantity for dealers?", a: "The minimum order quantity (MOQ) for regular dealer orders is 40 kits." },
  { q: "Where can I read the dealer terms?", a: "The key terms of the dealer (franchise partner) agreement are listed in the Dealer terms and conditions section on this page." },
  { q: "Where can I see the dealer price?", a: "Dealer pricing is not published on the website. Our team shares it with you directly after you send an enquiry." },
  { q: "What does one kit contain?", a: "Each kit has a 2 kg ABC dry powder fire extinguisher, an automatic fire ball, a 1 m x 1 m fire blanket, a wall bracket, a fire ball stand, and screws and wall plugs." },
  { q: "Who manufactures Graha Kavach?", a: "Graha Kavach kits are manufactured by Speciality Geochem in Udaipur, Rajasthan." },
];

const schema = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://grahakavach.in/" },
      { "@type": "ListItem", position: 2, name: "Become a Dealer", item: PAGE_URL },
    ],
  },
];

const primaryButton =
  "gk-button-gradient inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius)] px-6 text-base font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-transform hover:-translate-y-0.5";
const whatsappButton =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius)] border border-foreground/15 bg-white px-6 text-base font-semibold transition-colors hover:bg-muted";

export default function BecomeADealerPage() {
  return (
    <div className="bg-white text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Top bar: a funnel page, so no store navigation to wander off to. */}
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="Graha Kavach home">
            <Image src="/brand/graha-kavach-logo.png" alt="Graha Kavach" width={40} height={40} className="size-10" priority />
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight">Graha Kavach</span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                Dealer partnership
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <DealerContactLink
              href={`tel:${DEALER_PHONE_TEL}`}
              channel="phone"
              className="hidden items-center gap-2 text-sm font-semibold sm:inline-flex"
            >
              <Phone className="size-4 text-primary" aria-hidden />
              {DEALER_PHONE_DISPLAY}
            </DealerContactLink>
            <a
              href="#dealer-form"
              className="gk-button-gradient inline-flex min-h-[40px] items-center rounded-[var(--radius)] px-4 text-sm font-bold text-primary-foreground"
            >
              Apply now
            </a>
          </div>
        </div>
      </header>

      <main id="dealer-main">
        {/* HERO + FORM */}
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary-subtle to-white">
          <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <BadgeCheck className="size-4" aria-hidden />
                Dealers wanted across India
              </p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Become a Graha Kavach Dealer
              </h1>
              <p className="mt-4 max-w-xl text-base text-foreground-muted sm:text-lg">
                Sell India&apos;s 3-in-1 home fire safety kit: an ABC fire extinguisher, an automatic fire ball and a fire
                blanket in one box. Made in Udaipur and supplied factory-direct.
              </p>

              <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
                {["Manufacturer-direct", "ISO 9001:2015", "CE marked", "MOQ 40 kits"].map((chip) => (
                  <li key={chip} className="rounded-full border border-foreground/10 bg-white px-3 py-1.5 shadow-sm">
                    {chip}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#dealer-form" className={`${primaryButton} lg:hidden`}>
                  Apply for dealership
                </a>
                <DealerContactLink href={DEALER_WHATSAPP_URL} channel="whatsapp" className={whatsappButton}>
                  <MessageCircle className="size-5 text-[#25D366]" aria-hidden />
                  WhatsApp us
                </DealerContactLink>
              </div>

              <div className="relative mt-10 aspect-square max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-foreground/5 sm:aspect-[4/3]">
                <Image
                  src={IMG.kit}
                  alt="Graha Kavach 3-in-1 fire safety kit with ABC fire extinguisher, automatic fire ball and fire blanket"
                  fill
                  priority
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="object-contain"
                />
              </div>
            </div>

            {/* The form sits in the first screen on desktop: ad visitors convert without scrolling. */}
            <div id="dealer-form" className="scroll-mt-24 lg:sticky lg:top-24">
              <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-foreground/10 sm:p-8">
                <h2 className="text-xl font-extrabold sm:text-2xl">Apply to become a dealer</h2>
                <p className="mt-1 mb-6 text-sm text-foreground-muted">
                  Share your details. Our team calls you back with dealer pricing and terms.
                </p>
                <DealerForm />
              </div>
              <p className="mt-4 text-center text-sm text-foreground-muted">
                Prefer to call?{" "}
                <DealerContactLink href={`tel:${DEALER_PHONE_TEL}`} channel="phone" className="font-bold text-primary">
                  {DEALER_PHONE_DISPLAY}
                </DealerContactLink>
              </p>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section aria-label="At a glance" className="border-y border-foreground/10 bg-foreground text-white">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl font-black sm:text-4xl">{stat.value}</dd>
                <p className="mt-1 text-xs font-medium text-white/70 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </dl>
        </section>

        {/* ORDER TERMS */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Dealer order terms</h2>
          <p className="mt-2 text-foreground-muted">Simple terms to get started. Pricing is shared directly by our team.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Minimum order</p>
              <p className="mt-2 text-4xl font-black">40 kits</p>
              <p className="mt-2 text-sm text-foreground-muted">Minimum order quantity for regular dealer orders.</p>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Dealer pricing</p>
              <p className="mt-2 text-2xl font-extrabold">Shared on enquiry</p>
              <p className="mt-2 text-sm text-foreground-muted">
                Send your details and our team will share pricing and full terms.
              </p>
            </div>
          </div>
        </section>

        {/* THE PRODUCT */}
        <section className="bg-muted">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold sm:text-3xl">The Graha Kavach 3-in-1 Fire Safety Kit</h2>
            <p className="mt-3 max-w-3xl text-foreground-muted">
              One complete{" "}
              <Link href="/fire-safety-kit" className="font-semibold text-primary underline-offset-4 hover:underline">
                3-in-1 fire safety kit
              </Link>{" "}
              with six pieces in the box. Each kit covers manual action, automatic response near a risk point, and
              smothering a kitchen fire.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {kitProducts.map((product) => (
                <article key={product.name} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-foreground/5">
                  <div className="relative aspect-square bg-white">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 768px) 360px, 100vw"
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="border-t border-foreground/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{product.role}</p>
                    <h3 className="mt-1 font-bold">{product.name}</h3>
                    <p className="mt-2 text-sm text-foreground-muted">{product.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-foreground/5">
              <h3 className="font-bold">What is in every box</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kitItems.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-medium">
                    <span aria-hidden className="mt-1.5 h-2 w-2 flex-none rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* WHY PARTNER */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Why partner with us</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason) => (
              <div key={reason.title} className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                  <reason.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold">{reason.title}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{reason.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {placements.map((place) => (
              <figure key={place.title} className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
                <div className="relative aspect-video">
                  <Image
                    src={place.image}
                    alt={`${place.title}: ${place.text}`}
                    fill
                    sizes="(min-width: 768px) 400px, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="p-4">
                  <p className="font-bold">{place.title}</p>
                  <p className="text-sm text-foreground-muted">{place.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* MANUFACTURER */}
        <section className="bg-muted">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-lg">
              <Image
                src={IMG.factory}
                alt="Speciality Geochem factory entrance in the RIICO industrial area, Udaipur"
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary">
                <Factory className="size-4" aria-hidden /> Speciality Geochem, Udaipur
              </p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">You deal with the factory</h2>
              <p className="mt-3 text-foreground-muted">
                Graha Kavach is made by Speciality Geochem in its own RIICO units in Udaipur, Rajasthan, with roots
                since 2010. Manufacturing is ISO 9001:2015 certified, the kit carries CE marking, and products are
                checked in our in-house testing lab.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-6">
                <Image src={IMG.iso9001} alt="ISO 9001:2015 quality management certification" width={96} height={96} className="size-24 object-contain" />
                <Image src={IMG.ce} alt="CE marking" width={96} height={96} className="size-24 object-contain" />
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FlaskConical className="size-5 text-primary" aria-hidden />
                  In-house testing lab
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHO + STEPS */}
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
              <Store className="size-7 text-primary" aria-hidden /> Who can apply
            </h2>
            <ul className="mt-6 space-y-3">
              {whoCanApply.map((who) => (
                <li key={who} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-6 flex-none items-center justify-center rounded-full bg-primary-subtle text-sm font-bold text-primary"
                  >
                    ✓
                  </span>
                  <span>{who}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
              <Truck className="size-7 text-primary" aria-hidden /> How it works
            </h2>
            <ol className="mt-6 space-y-6">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="gk-button-gradient flex size-10 flex-none items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="text-sm text-foreground-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TERMS */}
        <section id="terms" className="bg-muted">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Dealer terms and conditions</h2>
            <p className="mt-2 text-foreground-muted">Key terms of the Graha Kavach dealer (franchise partner) agreement.</p>
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {terms.map((term, index) => (
                <li key={term.title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-foreground/5">
                  <span className="flex size-8 flex-none items-center justify-center rounded-full bg-primary-subtle text-sm font-extrabold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold">{term.title}</h3>
                    <p className="mt-1 text-sm text-foreground-muted">{term.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Dealer FAQs</h2>
          <div className="mt-6 divide-y divide-foreground/10 rounded-2xl border border-foreground/10">
            {faqs.map((faq) => (
              <details key={faq.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {faq.q}
                  <ChevronDown className="size-5 flex-none text-primary transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 text-sm text-foreground-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="gk-button-gradient text-primary-foreground">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-12 text-center sm:px-6">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to stock the Graha Kavach kit?</h2>
            <p className="max-w-xl text-white/90">Send your details and our team will call you with dealer pricing and terms.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="#dealer-form"
                className="inline-flex min-h-[52px] items-center justify-center rounded-[var(--radius)] bg-white px-6 text-base font-bold text-primary transition-transform hover:-translate-y-0.5"
              >
                Apply for dealership
              </a>
              <DealerContactLink
                href={DEALER_WHATSAPP_URL}
                channel="whatsapp"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius)] border border-white/60 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                <MessageCircle className="size-5" aria-hidden />
                WhatsApp us
              </DealerContactLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground/10 bg-white pb-24 sm:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-sm text-foreground-muted sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p>© {new Date().getFullYear()} Graha Kavach by Speciality Geochem, Udaipur, Rajasthan.</p>
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <a href={`mailto:${DEALER_EMAIL}`} className="font-semibold text-foreground">
              {DEALER_EMAIL}
            </a>
            <Link href="/privacy-policy" className="underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/" className="underline-offset-4 hover:underline">
              grahakavach.in
            </Link>
          </p>
        </div>
      </footer>

      {/* Phone-only action bar: the form and WhatsApp stay one tap away while scrolling. */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-foreground/10 bg-white p-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:hidden">
        <a
          href="#dealer-form"
          className="gk-button-gradient inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius)] text-sm font-bold text-primary-foreground"
        >
          Apply now
        </a>
        <DealerContactLink
          href={DEALER_WHATSAPP_URL}
          channel="whatsapp"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius)] bg-[#25D366] text-sm font-bold text-white"
        >
          <MessageCircle className="size-5" aria-hidden />
          WhatsApp
        </DealerContactLink>
      </div>
    </div>
  );
}
