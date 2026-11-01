import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Boxes,
  ChevronDown,
  Factory,
  FlaskConical,
  Handshake,
  Home,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { DealerForm } from "@/components/dealer/dealer-form";
import { DealerContactLink } from "@/components/dealer/dealer-contact-link";
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

const stats = [
  { value: "2010", label: "Making fire safety gear since" },
  { value: "2", label: "Own RIICO units in Udaipur" },
  { value: "6", label: "Pieces in every kit box" },
  { value: "40", label: "Kits minimum order" },
];

const threeJobs = [
  {
    step: "01",
    role: "You grab it",
    name: "2 kg ABC dry powder fire extinguisher",
    text: "The first-response tool for a small fire you can reach. Mounted on its wall bracket by the main door.",
    image: IMG.extinguisher,
  },
  {
    step: "02",
    role: "It acts on its own",
    name: "Automatic fire extinguisher ball",
    text: "Sits on its stand near the electrical panel and acts when flames reach it, even when nobody is home.",
    image: IMG.fireBall,
  },
  {
    step: "03",
    role: "You smother it",
    name: "Fire blanket, 1 m x 1 m",
    text: "Hangs by the stove, ready for a pan or small kitchen fire, in a quick-release pull-tab pouch.",
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
    text: "Six pieces with every screw and wall plug included. Your customer needs nothing else to get it on the wall.",
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

const primaryButton =
  "gk-button-gradient inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius)] px-6 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5";
const ghostButton =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius)] border border-white/25 bg-white/5 px-6 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/15";

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
      {intro ? <p className="mt-3 text-foreground-muted sm:text-lg">{intro}</p> : null}
    </div>
  );
}

export default function BecomeADealerPage() {
  return (
    <div className="bg-white text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* HERO + FORM */}
      <section className="relative isolate overflow-hidden bg-[#150b0b] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_0%,rgba(224,24,32,0.45),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(248,120,24,0.22),transparent_50%)]"
        />
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:px-8 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90">
              <BadgeCheck className="size-4 text-secondary" aria-hidden />
              Dealership open · Minimum order 40 kits
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Become a Graha Kavach Dealer
              <span className="mt-2 block bg-gradient-to-r from-[#ff5a3c] to-[#ffb347] bg-clip-text text-transparent">
                Sell the kit every home needs.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
              One box. Three layers of protection. No middlemen. Stock India&apos;s 3-in-1 home fire safety kit,
              made in Udaipur and supplied factory-direct to you.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
              {["Manufacturer-direct", "ISO 9001:2015", "CE marked", "Made in Udaipur"].map((chip) => (
                <li key={chip} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
                  <ShieldCheck className="size-4 text-secondary" aria-hidden />
                  {chip}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#dealer-form" className={`${primaryButton} lg:hidden`}>
                Get dealer pricing
                <ArrowRight className="size-5" aria-hidden />
              </a>
              <DealerContactLink href={DEALER_WHATSAPP_URL} channel="whatsapp" className={ghostButton}>
                <MessageCircle className="size-5 text-[#25D366]" aria-hidden />
                WhatsApp us
              </DealerContactLink>
              <DealerContactLink href={`tel:${DEALER_PHONE_TEL}`} channel="phone" className={`${ghostButton} hidden sm:inline-flex`}>
                <Phone className="size-5" aria-hidden />
                {DEALER_PHONE_DISPLAY}
              </DealerContactLink>
            </div>

            <div className="relative mt-10 aspect-square max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/40 ring-1 ring-white/20 sm:aspect-[5/4] sm:max-w-xl">
              <Image
                src={IMG.kit}
                alt="Graha Kavach 3-in-1 fire safety kit: 2 kg ABC fire extinguisher, automatic fire ball and fire blanket"
                fill
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-contain p-3"
              />
              <span className="absolute left-3 top-3 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-white">
                6 pieces · 1 box
              </span>
            </div>
          </div>

          {/* The form is in the first screen on desktop: ad visitors convert without scrolling. */}
          <div id="dealer-form" className="scroll-mt-28 lg:sticky lg:top-28">
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
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
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

      {/* ONE KIT, THREE JOBS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="The product"
          title="One kit. Three jobs. Every fire covered."
          intro="Every home has a kitchen stove, an electrical panel and a front door. The Graha Kavach kit puts the right tool at each one."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {threeJobs.map((job) => (
            <article key={job.name} className="group overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-foreground/10 transition-shadow hover:shadow-xl">
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={job.image}
                  alt={`${job.name}, Graha Kavach`}
                  fill
                  sizes="(min-width: 768px) 400px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-xs font-bold tracking-wider text-white backdrop-blur">
                  {job.step}
                </span>
              </div>
              <div className="p-6">
                <p className="text-sm font-extrabold uppercase tracking-wide text-primary">{job.role}</p>
                <h3 className="mt-1 text-lg font-bold leading-snug">{job.name}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{job.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid items-center gap-8 overflow-hidden rounded-3xl bg-muted p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-md">
            <Image
              src={IMG.kitBox}
              alt="Everything in one Graha Kavach kit box: fire extinguisher, fire blanket and automatic fire ball"
              fill
              sizes="(min-width: 1024px) 380px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="text-xl font-extrabold sm:text-2xl">What is in every box</h3>
            <p className="mt-2 text-foreground-muted">
              Your customer opens one box and has everything needed to protect the kitchen, the panel and the
              doorway.{" "}
              <Link href="/fire-safety-kit" className="font-semibold text-primary underline-offset-4 hover:underline">
                See the kit as customers see it
              </Link>
              .
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {kitItems.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm font-semibold shadow-sm">
                  <span className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* WHY PARTNER */}
      <section className="bg-foreground text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-secondary">Why partner with us</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              A product that sells itself, from a factory you can trust
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* ORDER TERMS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Dealer order terms"
          title="Simple terms to get you started"
          intro="Pricing is shared directly by our team, after we speak with you."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-primary-subtle to-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Minimum order</p>
            <p className="mt-2 text-5xl font-black">40 kits</p>
            <p className="mt-3 text-sm text-foreground-muted">Minimum order quantity for regular dealer orders.</p>
          </div>
          <div className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-secondary-subtle to-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Dealer pricing</p>
            <p className="mt-2 text-3xl font-black">Shared on enquiry</p>
            <p className="mt-3 text-sm text-foreground-muted">
              Send your details and our team will call you with pricing and full terms.
            </p>
            <a href="#dealer-form" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              Request pricing <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {partnerBenefits.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-foreground/10 p-6">
              <benefit.icon className="size-7 text-primary" aria-hidden />
              <h3 className="mt-4 font-bold">{benefit.title}</h3>
              <p className="mt-1 text-sm text-foreground-muted">{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MANUFACTURER */}
      <section className="bg-muted">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="relative aspect-video overflow-hidden rounded-3xl shadow-xl">
            <Image
              src={IMG.factory}
              alt="Speciality Geochem factory entrance in the RIICO industrial area, Udaipur"
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
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

      {/* WHO + STEPS */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-extrabold sm:text-3xl">
            <Store className="size-8 text-primary" aria-hidden /> Who can apply
          </h2>
          <ul className="mt-6 space-y-3">
            {whoCanApply.map((who) => (
              <li key={who} className="flex items-start gap-3 rounded-xl border border-foreground/10 p-4">
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
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
            <Image
              src={IMG.kitHome}
              alt="Graha Kavach fire blanket, extinguisher and fire ball placed in a kitchen and by the electrical panel"
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover object-top"
            />
          </div>
        </div>
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-extrabold sm:text-3xl">
            <Truck className="size-8 text-primary" aria-hidden /> How it works
          </h2>
          <ol className="relative mt-6 space-y-8 border-l-2 border-dashed border-primary/30 pl-8">
            {steps.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="gk-button-gradient absolute -left-[3.2rem] flex size-11 items-center justify-center rounded-full text-base font-extrabold text-primary-foreground ring-4 ring-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="mt-1 text-foreground-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 rounded-2xl bg-secondary-subtle p-6">
            <Handshake className="size-8 text-primary" aria-hidden />
            <p className="mt-3 font-bold">Ready to talk?</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Call {DEALER_PHONE_DISPLAY} or write to {DEALER_EMAIL}, or send the form and we will call you.
            </p>
          </div>
        </div>
      </section>

      {/* TERMS */}
      <section id="terms" className="bg-muted">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="The agreement"
            title="Dealer terms and conditions"
            intro="Key terms of the Graha Kavach dealer (franchise partner) agreement."
          />
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {terms.map((term, index) => (
              <li key={term.title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-foreground/5">
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

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading eyebrow="Questions" title="Dealer FAQs" />
        <div className="mt-8 divide-y divide-foreground/10 rounded-2xl border border-foreground/10">
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
      <section className="relative isolate overflow-hidden bg-[#150b0b] text-white">
        <Image
          src={IMG.kitCounter}
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-20"
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to stock the Graha Kavach kit?</h2>
          <p className="max-w-xl text-white/80 sm:text-lg">
            Send your details. Our team will call you with dealer pricing and terms.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#dealer-form" className={primaryButton}>
              Apply for dealership
              <ArrowRight className="size-5" aria-hidden />
            </a>
            <DealerContactLink href={DEALER_WHATSAPP_URL} channel="whatsapp" className={ghostButton}>
              <MessageCircle className="size-5 text-[#25D366]" aria-hidden />
              WhatsApp us
            </DealerContactLink>
          </div>
        </div>
      </section>
    </div>
  );
}
