import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Lock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

import { buildBreadcrumbSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Privacy Policy & Customer Data Protection",
  description:
    "How Graha Kavach (Speciality Geochem) collects, uses and safeguards customer personal information and order records under applicable Indian data protection law.",
  keywords: [
    "Graha Kavach privacy policy",
    "customer data protection India",
    "Speciality Geochem privacy policy",
    "fire safety ecommerce privacy",
    "data security Graha Kavach",
  ],
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Privacy Policy", path: "/privacy-policy" },
  ]);

  return (
    <main className="bg-background py-10 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Container width="default">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground sm:text-sm">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground">Privacy Policy</li>
          </ol>
        </nav>

        {/* Page Header */}
        <header className="mt-6 border-b border-border pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-3.5" />
            Legal & Data Protection
          </div>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[42px]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-foreground-muted sm:text-base">
            Effective Date & Last Updated: September 2026 • Graha Kavach (Speciality Geochem), Udaipur, Rajasthan
          </p>
        </header>

        {/* Summary Callout */}
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary-subtle/30 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="text-xs leading-relaxed text-foreground-muted sm:text-sm">
              <strong className="font-semibold text-foreground">Your Privacy Commitment:</strong> We respect your confidentiality. We collect only what is strictly necessary to fulfill your fire-safety equipment orders, coordinate insured delivery across India, provide technical equipment guidance, and satisfy statutory tax and invoicing regulations. We never sell your personal data to third-party marketers.
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          {/* Main Policy Content */}
          <div className="space-y-10 lg:col-span-8">
            {/* Section 1 */}
            <section id="information-collected" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                1. Information We Collect
              </h2>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                When you interact with the Graha Kavach storefront, purchase equipment, or contact our support desk, we collect information necessary to fulfill your request:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground-muted sm:text-base">
                <li>
                  <strong className="text-foreground">Contact & Identity Details:</strong> Full name, phone number, and email address.
                </li>
                <li>
                  <strong className="text-foreground">Shipping & Delivery Details:</strong> Complete street address, apartment/house number, landmark, city, state, and 6-digit postal PIN code for parcel dispatch.
                </li>
                <li>
                  <strong className="text-foreground">Business & Tax Details (Optional):</strong> Registered firm or company name and 15-digit GSTIN when requesting a commercial GST Tax Invoice.
                </li>
                <li>
                  <strong className="text-foreground">Order & Transaction Logs:</strong> Items purchased, quantity, date of order, transaction identifier, payment method selected (e.g. COD, UPI, Card), and shipment tracking status.
                </li>
                <li>
                  <strong className="text-foreground">Customer Support Correspondence:</strong> Messages, safety consultation queries, and feedback submitted via our contact forms, email, or WhatsApp line.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="how-we-use" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                2. How We Use Your Information
              </h2>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                We process your information under lawful grounds including contractual necessity, legitimate operational interest, and statutory compliance:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground-muted sm:text-base">
                <li>Processing and fulfilling your domestic and commercial fire safety kit orders.</li>
                <li>Generating and issuing valid GST Tax Invoices and e-way bills as mandated by Indian tax laws.</li>
                <li>Sharing delivery coordinates with certified courier partners (Delhivery, India Post, BlueDart) for timely parcel transit.</li>
                <li>Sending transactional updates via SMS, WhatsApp, and email regarding order status and real-time tracking numbers.</li>
                <li>Assisting with product guidance, fire safety questions, replacements, and warranty coverage.</li>
                <li>Detecting and mitigating payment fraud, unauthorized access, and malicious bot activity.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="payment-security" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                3. Payment Security & Financial Data
              </h2>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                Financial transactions conducted on Graha Kavach are routed through certified, PCI-DSS Level 1 compliant payment gateways and authorized banking partners.
              </p>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                <strong className="text-foreground">Graha Kavach never stores:</strong> Your full credit or debit card number, CVV code, UPI PIN, net banking credentials, or bank passwords on our servers. All sensitive financial authentication is handled exclusively within the encrypted ecosystem of the payment gateway.
              </p>
            </section>

            {/* Section 4 */}
            <section id="third-party-sharing" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                4. Third-Party Service Providers
              </h2>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                We only share personal data with external service providers to the extent strictly necessary to operate our business:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground-muted sm:text-base">
                <li>
                  <strong className="text-foreground">Logistics & Courier Partners:</strong> Name, phone number, and delivery address are shared with carriers to complete doorstep delivery and SMS coordination.
                </li>
                <li>
                  <strong className="text-foreground">Payment Gateways:</strong> Order total, billing details, and transaction tokens for processing approved charges.
                </li>
                <li>
                  <strong className="text-foreground">Statutory & Law Enforcement Authorities:</strong> When required under applicable Indian laws, judicial summons, or GST tax audits.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="cookies-analytics" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                5. Cookies & Local Storage
              </h2>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                Our web storefront uses lightweight cookies and browser local storage to provide essential commerce functionality:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground-muted sm:text-base">
                <li>Remembering items in your shopping cart and saved wishlist across page reloads.</li>
                <li>Maintaining authenticated customer login sessions securely.</li>
                <li>Preventing repeated notification alerts and maintaining user interface preferences.</li>
              </ul>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                You can configure your browser to block or alert you about these cookies, though some features of the storefront (such as the cart drawer and checkout) may not function properly without them.
              </p>
            </section>

            {/* Section 6 */}
            <section id="data-retention" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                6. Data Retention & Integrity
              </h2>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                We retain order and billing records for the period necessary to honor equipment warranty terms, facilitate product replacements, and satisfy Indian statutory record-keeping obligations (including accounting standards and Central Goods and Services Tax Act mandates).
              </p>
            </section>

            {/* Section 7 */}
            <section id="your-rights" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                7. Your Data Protection Rights
              </h2>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                In accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000 of India, you hold the following rights regarding your personal information:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground-muted sm:text-base">
                <li><strong className="text-foreground">Right of Access:</strong> You can review your saved profile information, order history, and address book directly in your customer account dashboard.</li>
                <li><strong className="text-foreground">Right to Correction:</strong> You may update or correct inaccurate personal details via your profile settings or by contacting our team.</li>
                <li><strong className="text-foreground">Right to Erasure:</strong> You can request deletion of your account and personal details, subject to records that must be preserved for legal, tax, or active warranty purposes.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="grievance" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                8. Grievance Officer & Contact Information
              </h2>
              <p className="text-sm leading-7 text-foreground-muted sm:text-base">
                For questions, clarifications, or grievances regarding this Privacy Policy or the handling of your data, please contact our designated grievance team:
              </p>

              <div className="mt-4 rounded-xl border border-border bg-stone-50 p-5 text-sm text-foreground">
                <p className="font-bold text-foreground">Graha Kavach — Speciality Geochem</p>
                <div className="mt-3 space-y-2 text-xs sm:text-sm text-foreground-muted">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <span>103, Ostwal Plaza 2, Sundarwas, Udaipur, Rajasthan 313001, India</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <a href="tel:+917891111390" className="font-medium text-foreground hover:underline">
                      +91 78911 11390
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-primary" />
                    <a href="mailto:grahakavach@gmail.com" className="font-medium text-foreground hover:underline">
                      grahakavach@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Quick Navigation Sticky Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-2xl border border-border bg-white p-6 shadow-xs">
              <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
                Policy Sections
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs text-foreground-muted">
                <li>
                  <a href="#information-collected" className="transition-colors hover:text-primary">
                    1. Information We Collect
                  </a>
                </li>
                <li>
                  <a href="#how-we-use" className="transition-colors hover:text-primary">
                    2. How We Use Information
                  </a>
                </li>
                <li>
                  <a href="#payment-security" className="transition-colors hover:text-primary">
                    3. Payment Security & Financial Data
                  </a>
                </li>
                <li>
                  <a href="#third-party-sharing" className="transition-colors hover:text-primary">
                    4. Third-Party Service Providers
                  </a>
                </li>
                <li>
                  <a href="#cookies-analytics" className="transition-colors hover:text-primary">
                    5. Cookies & Local Storage
                  </a>
                </li>
                <li>
                  <a href="#data-retention" className="transition-colors hover:text-primary">
                    6. Data Retention & Integrity
                  </a>
                </li>
                <li>
                  <a href="#your-rights" className="transition-colors hover:text-primary">
                    7. Your Data Protection Rights
                  </a>
                </li>
                <li>
                  <a href="#grievance" className="transition-colors hover:text-primary">
                    8. Grievance Officer & Contact
                  </a>
                </li>
              </ul>

              <div className="mt-6 border-t border-border pt-4">
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-stone-100 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-white"
                >
                  Contact Privacy Desk
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
