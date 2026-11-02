import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Boxes,
  ChevronDown,
  Factory,
  FlaskConical,
  Home,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  ReceiptText,
  Store,
  Users,
} from "lucide-react";
import { DealerForm } from "@/components/dealer/dealer-form";
import { DealerContactLink } from "@/components/dealer/dealer-contact-link";
import { Button } from "@/components/ui/button";
import { DEALER_EMAIL, DEALER_PHONE_DISPLAY, DEALER_PHONE_TEL, DEALER_WHATSAPP_URL } from "@/lib/dealer/contact";

const PAGE_URL = "https://grahakavach.in/become-a-dealer";
const WP = "https://admin.grahakavach.in/wp-content/uploads";

/** Only Graha Kavach branded photos: the product shots on the site and the three branded scenes. */
const IMG = {
  kit: `${WP}/graha-kavach-combo-1.webp`,
  kitBox: `${WP}/graha-kavach-combo-4.webp`,
  kitHome: `${WP}/graha-kavach-combo-3.webp`,
  kitCounter: `${WP}/graha-kavach-combo-2.webp`,
  extinguisher: `${WP}/kit-extinguisher.jpg`,
  fireBall: `${WP}/kit-fireball.jpg`,
  blanket: `${WP}/kit-blanket.jpg`,
  factory: `${WP}/Speciality-Geochem-Factory-Entrance.png`,
  iso9001: `${WP}/iso-9001-2015.png`,
  ce: `${WP}/ce-mark.png`,
};

/** Page width: 90% of the screen, centred, with no extra side padding. */
const WRAP = "mx-auto w-[90%] max-w-[1680px]";
const SECTION = "py-14 lg:py-20";

export const metadata: Metadata = {
  title: "Become a Fire Safety Kit Dealer | Graha Kavach Dealership",
  description:
    "Become a Graha Kavach dealer and sell India's 3-in-1 home fire safety kit. Manufacturer-direct from Udaipur, ISO 9001:2015 certified, minimum order 40 kits. Apply today.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Become a Graha Kavach Dealer",
    description:
      "Sell the 3-in-1 home fire safety kit: ABC extinguisher, automatic fire ball and fire blanket. Factory-direct. Minimum order 40 kits.",
    url: PAGE_URL,
    siteName: "Graha Kavach",
    locale: "en_IN",
    type: "website",
    images: [{ url: IMG.kit, width: 1254, height: 1254, alt: "Graha Kavach 3-in-1 fire safety kit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Graha Kavach Dealer",
    description: "Factory-direct 3-in-1 home fire safety kit. Minimum order 40 kits.",
    images: [IMG.kit],
  },
  robots: { index: true, follow: true },
};

const heroPoints = [
  "Factory-direct supply from Udaipur. No middlemen.",
  "ISO 9001:2015 certified, CE marked, tested in our own lab.",
  "One 3-piece box: extinguisher, fire ball and fire blanket.",
];

const stats = [
  { value: "2010", label: "Making fire safety gear since" },
  { value: "2", label: "Own RIICO units in Udaipur" },
  { value: "3", label: "Pieces in every kit box" },
  { value: "40", label: "Kits minimum order" },
];

const threeJobs = [
  {
    step: "01",
    role: "You grab it",
    name: "2 kg ABC dry powder fire extinguisher",
    text: "The first-response tool for a small fire you can reach. Mounted on its wall bracket by the main door, it is the first thing a family reaches for.",
    image: IMG.extinguisher,
  },
  {
    step: "02",
    role: "It acts on its own",
    name: "Automatic fire extinguisher ball",
    text: "Sits on its stand near the electrical panel and acts when flames reach it, even when nobody is home. The protection that works while the house is empty.",
    image: IMG.fireBall,
  },
  {
    step: "03",
    role: "You smother it",
    name: "Fire blanket, 1 m x 1 m",
    text: "Hangs by the stove, ready for a pan or small kitchen fire. Pull the tabs, cover the fire and cut off the oxygen.",
    image: IMG.blanket,
  },
];

const kitItems = [
  "2 kg ABC dry powder fire extinguisher",
  "Automatic fire extinguisher ball",
  "Fire blanket, 1 m x 1 m",
];

const reasons = [
  {
    icon: Factory,
    title: "Straight from the factory",
    text: "Made by Speciality Geochem in its own RIICO units in Udaipur, roots since 2010. You deal with the manufacturer, not a middleman.",
  },
  {
    icon: Award,
    title: "Certification you can show",
    text: "ISO 9001:2015 certified manufacturing, CE marking and an in-house testing lab. Proof your customers can see on the box.",
  },
  {
    icon: Boxes,
    title: "One box. Nothing else to sell.",
    text: "Three pieces with every screw and wall plug included. Your customer needs nothing else to get it on the wall.",
  },
  {
    icon: Home,
    title: "A customer in every building",
    text: "Homes, flats, shops, offices and small businesses all have a kitchen or a switchboard, and all need first-response fire safety.",
  },
];

const partnerBenefits = [
  { icon: MapPin, title: "Your own territory", text: "You are appointed as our authorised partner for an assigned territory." },
  { icon: Megaphone, title: "Marketing material provided", text: "Banners, brochures and digital creatives to build visibility in your local market." },
  { icon: Users, title: "Build your own network", text: "Appoint sub-dealers, salespersons or agents on a commission basis." },
  { icon: ReceiptText, title: "Clear account settlement", text: "Accounts reviewed and settled half-yearly, with official debit and credit notes." },
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

function SectionHeading({
  eyebrow,
  title,
  intro,
  light = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  light?: boolean;
}) {
  return (
    <div>
      <p className={`text-sm font-bold uppercase tracking-[0.18em] ${light ? "text-secondary" : "text-primary"}`}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
      {intro ? <p className={`mt-3 sm:text-lg ${light ? "text-white/70" : "text-foreground-muted"}`}>{intro}</p> : null}
    </div>
  );
}

export default function BecomeADealerPage() {
  return (
    <div className="overflow-x-clip bg-white text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* HERO: message on the left, application form on the right */}
      <section className="relative isolate overflow-hidden bg-[#150b0b] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_0%,rgba(224,24,32,0.45),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(248,120,24,0.22),transparent_50%)]"
        />
        <div className={`${WRAP} grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16`}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90">
              <BadgeCheck className="size-4 text-secondary" aria-hidden />
              Dealership open · Minimum order 40 kits
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
              Become a Graha Kavach Dealer
              <span className="mt-2 block bg-gradient-to-r from-[#ff5a3c] to-[#ffb347] bg-clip-text text-transparent">
                Sell the kit every home needs.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
              One box. Three layers of protection. No middlemen. Stock India&apos;s 3-in-1 home fire safety kit,
              made in Udaipur and supplied factory-direct to you.
            </p>

            <ul className="mt-6 space-y-3">
              {heroPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-base font-medium">
                  <span
                    aria-hidden
                    className="gk-button-gradient mt-0.5 flex size-6 flex-none items-center justify-center rounded-full text-xs font-bold text-white"
                  >
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#dealer-form" size="lg" className="lg:hidden">
                Get dealer pricing
                <ArrowRight className="size-5" aria-hidden />
              </Button>
              <DealerContactLink href={DEALER_WHATSAPP_URL} channel="whatsapp">
                <MessageCircle className="size-5 text-[#25D366]" aria-hidden />
                WhatsApp us
              </DealerContactLink>
              <DealerContactLink href={`tel:${DEALER_PHONE_TEL}`} channel="phone">
                <Phone className="size-5" aria-hidden />
                {DEALER_PHONE_DISPLAY}
              </DealerContactLink>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <Image src={IMG.iso9001} alt="ISO 9001:2015 certification" width={72} height={72} className="size-[72px] rounded-xl bg-white object-contain p-1" />
              <Image src={IMG.ce} alt="CE marking" width={72} height={72} className="size-[72px] rounded-xl bg-white object-contain p-1" />
              <p className="text-sm font-semibold text-white/80">
                Certified manufacturing
                <span className="block font-normal text-white/60">Speciality Geochem, Udaipur</span>
              </p>
            </div>
          </div>

          <div id="dealer-form" className="scroll-mt-28">
            <div className="rounded-3xl bg-white p-6 text-foreground shadow-2xl shadow-black/40 ring-1 ring-white/20 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Dealer application</p>
              <h2 className="mt-1 text-2xl font-extrabold">Get dealer pricing &amp; terms</h2>
              <p className="mt-1 mb-6 text-sm text-foreground-muted">
                Takes a minute. Our team calls you back with pricing and the dealer agreement.
              </p>
              <DealerForm />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section aria-label="At a glance" className="border-b border-foreground/10 bg-white">
        <dl className={`${WRAP} grid grid-cols-2 gap-y-6 py-8 md:grid-cols-4`}>
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse items-center text-center">
              <dt className="mt-1 max-w-[12rem] text-xs font-medium text-foreground-muted sm:text-sm">{stat.label}</dt>
              <dd className="bg-gradient-to-r from-[#b30f16] to-[#f87818] bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* THE KIT: product photo | what is in the box */}
      <section className={SECTION}>
        <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-muted shadow-lg ring-1 ring-foreground/5">
            <Image
              src={IMG.kit}
              alt="Graha Kavach 3-in-1 fire safety kit: 2 kg ABC fire extinguisher, fire blanket and automatic fire ball"
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-contain p-4"
            />
            <span className="absolute left-4 top-4 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-bold text-white">
              3 pieces · 1 box
            </span>
          </div>
          <div>
            <SectionHeading
              eyebrow="The product"
              title="The Graha Kavach 3-in-1 Fire Safety Kit"
              intro="One complete kit with three pieces in the box. Your customer opens it and has everything needed to protect the kitchen, the electrical panel and the doorway."
            />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {kitItems.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-foreground/10 bg-white p-3.5 text-sm font-semibold shadow-sm">
                  <span className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="#dealer-form" size="lg">
                Get dealer pricing
                <ArrowRight className="size-5" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ONE KIT, THREE JOBS: photo | text, alternating */}
      <section className={`bg-muted ${SECTION}`}>
        <div className={WRAP}>
          <SectionHeading
            eyebrow="How the kit protects"
            title="One kit. Three jobs. Every fire covered."
            intro="Every home has a kitchen stove, an electrical panel and a front door. The kit puts the right tool at each one."
          />
          <div className="mt-12 space-y-12 lg:space-y-16">
            {threeJobs.map((job, index) => (
              <article key={job.name} className="grid items-center gap-6 lg:grid-cols-2 lg:gap-16">
                <div className={`relative aspect-video overflow-hidden rounded-3xl shadow-xl ring-1 ring-foreground/10 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <Image
                    src={job.image}
                    alt={`${job.name}, Graha Kavach`}
                    fill
                    sizes="(min-width: 1024px) 45vw, 90vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="gk-text-gradient text-6xl font-black leading-none">{job.step}</p>
                  <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.18em] text-primary">{job.role}</p>
                  <h3 className="mt-2 text-2xl font-extrabold leading-snug sm:text-3xl">{job.name}</h3>
                  <p className="mt-3 text-foreground-muted sm:text-lg">{job.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PARTNER: heading | 2x2 cards */}
      <section className={`bg-foreground text-white ${SECTION}`}>
        <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
          <div>
            <SectionHeading
              light
              eyebrow="Why partner with us"
              title="A product that sells itself, from a factory you can trust"
              intro="You carry a kit that customers understand in seconds, backed by the people who make it."
            />
            <div className="mt-8">
              <Button href="#dealer-form" size="lg">
                Become a dealer
                <ArrowRight className="size-5" aria-hidden />
              </Button>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.title} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                <span className="gk-button-gradient flex size-12 items-center justify-center rounded-xl text-white">
                  <reason.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold">{reason.title}</h3>
                <p className="mt-2 text-sm text-white/70">{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORDER TERMS: MOQ and pricing | partner benefits */}
      <section className={SECTION}>
        <div className={`${WRAP} grid gap-10 lg:grid-cols-2 lg:gap-16`}>
          <div>
            <SectionHeading
              eyebrow="Dealer order terms"
              title="Simple terms to get you started"
              intro="Pricing is shared directly by our team, after we speak with you."
            />
            <div className="mt-8 space-y-5">
              <div className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-primary-subtle to-white p-7 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-primary">Minimum order</p>
                <p className="mt-2 text-5xl font-black">40 kits</p>
                <p className="mt-2 text-sm text-foreground-muted">Minimum order quantity for regular dealer orders.</p>
              </div>
              <div className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-secondary-subtle to-white p-7 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-primary">Dealer pricing</p>
                <p className="mt-2 text-3xl font-black">Shared on enquiry</p>
                <p className="mt-2 text-sm text-foreground-muted">
                  Send your details and our team will call you with pricing and full terms.
                </p>
              </div>
            </div>
          </div>
          <div className="grid content-start gap-5 sm:grid-cols-2 lg:self-end">
            {partnerBenefits.map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                  <benefit.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold">{benefit.title}</h3>
                <p className="mt-1 text-sm text-foreground-muted">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANUFACTURER: factory photo | story */}
      <section className={`bg-muted ${SECTION}`}>
        <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
          <div className="relative aspect-video overflow-hidden rounded-3xl shadow-xl">
            <Image
              src={IMG.factory}
              alt="Speciality Geochem factory entrance in the RIICO industrial area, Udaipur"
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-primary">
              <Factory className="size-4" aria-hidden /> Speciality Geochem, Udaipur
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              You deal with the factory, not a middleman
            </h2>
            <p className="mt-3 text-foreground-muted sm:text-lg">
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

      {/* WHO CAN APPLY: list | photo */}
      <section className={SECTION}>
        <div className={`${WRAP} grid items-stretch gap-10 lg:grid-cols-2 lg:gap-16`}>
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-primary">
              <Store className="size-4" aria-hidden /> Who can apply
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              If you sell to homes and businesses, this kit fits your counter
            </h2>
            <ul className="mt-6 space-y-3">
              {whoCanApply.map((who) => (
                <li key={who} className="flex items-start gap-3 rounded-xl border border-foreground/10 bg-white p-4 shadow-sm">
                  <span
                    aria-hidden
                    className="flex size-6 flex-none items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                  >
                    ✓
                  </span>
                  <span className="font-medium">{who}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl shadow-xl ring-1 ring-foreground/10">
            <Image
              src={IMG.kitHome}
              alt="Graha Kavach fire blanket in the kitchen, extinguisher on the wall and fire ball above the electrical panel"
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: steps | contact card */}
      <section className={`bg-muted ${SECTION}`}>
        <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
          <div>
            <SectionHeading eyebrow="How it works" title="Three steps to your first order" />
            <ol className="relative mt-8 space-y-8 border-l-2 border-dashed border-primary/30 pl-8">
              {steps.map((step, index) => (
                <li key={step.title} className="relative">
                  <span className="gk-button-gradient absolute -left-[3.2rem] flex size-11 items-center justify-center rounded-full text-base font-extrabold text-primary-foreground ring-4 ring-muted">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-foreground-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl bg-white p-7 shadow-lg ring-1 ring-foreground/10 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Prefer to talk first?</p>
            <h3 className="mt-2 text-2xl font-extrabold">Speak to our dealer team</h3>
            <p className="mt-2 text-foreground-muted">
              Call or message us. We will explain the kit, the terms and how your first order works.
            </p>
            <div className="mt-6 space-y-3 text-sm font-semibold">
              <p className="flex items-center gap-3">
                <Phone className="size-5 text-primary" aria-hidden /> {DEALER_PHONE_DISPLAY}
              </p>
              <p className="flex items-center gap-3">
                <Mail className="size-5 text-primary" aria-hidden /> {DEALER_EMAIL}
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <DealerContactLink href={DEALER_WHATSAPP_URL} channel="whatsapp">
                <MessageCircle className="size-5 text-[#25D366]" aria-hidden />
                WhatsApp us
              </DealerContactLink>
              <DealerContactLink href={`tel:${DEALER_PHONE_TEL}`} channel="phone" variant="primary">
                <Phone className="size-5" aria-hidden />
                Call now
              </DealerContactLink>
            </div>
          </div>
        </div>
      </section>

      {/* TERMS */}
      <section id="terms" className={SECTION}>
        <div className={WRAP}>
          <SectionHeading
            eyebrow="The agreement"
            title="Dealer terms and conditions"
            intro="Key terms of the Graha Kavach dealer (franchise partner) agreement."
          />
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {terms.map((term, index) => (
              <li key={term.title} className="flex gap-4 rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm">
                <span className="flex size-9 flex-none items-center justify-center rounded-full bg-primary-subtle text-sm font-extrabold text-primary">
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

      {/* FAQ: heading | accordion */}
      <section className={`bg-muted ${SECTION}`}>
        <div className={`${WRAP} grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16`}>
          <div>
            <SectionHeading eyebrow="Questions" title="Dealer FAQs" intro="Quick answers before you apply." />
            <div className="mt-6">
              <Button href="#dealer-form" size="lg">
                Apply for dealership
                <ArrowRight className="size-5" aria-hidden />
              </Button>
            </div>
          </div>
          <div className="divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-white shadow-sm">
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
        </div>
      </section>

      {/* CLOSING CTA: message | photo */}
      <section className="relative isolate overflow-hidden bg-[#150b0b] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_50%,rgba(224,24,32,0.4),transparent_55%)]"
        />
        <div className={`${WRAP} grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20`}>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to stock the Graha Kavach kit?
            </h2>
            <p className="mt-4 max-w-xl text-white/80 sm:text-lg">
              Send your details. Our team will call you with dealer pricing and terms.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#dealer-form" size="lg">
                Apply for dealership
                <ArrowRight className="size-5" aria-hidden />
              </Button>
              <DealerContactLink href={DEALER_WHATSAPP_URL} channel="whatsapp">
                <MessageCircle className="size-5 text-[#25D366]" aria-hidden />
                WhatsApp us
              </DealerContactLink>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl shadow-black/50 ring-1 ring-white/20">
            <Image
              src={IMG.kitCounter}
              alt="Graha Kavach fire extinguisher, fire ball and fire blanket on a kitchen counter"
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
