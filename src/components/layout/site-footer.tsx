import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SecurePaymentStrip } from "@/components/commerce/secure-payment-strip";
import { WhatsAppIcon } from "@/components/ui/icons";
import { buildTelUrl, buildWhatsAppUrl } from "@/lib/config/contact";
import { getCmsPages, getGlobalSiteSettings, type NavItem } from "@/lib/wordpress/adapters";
import { FooterNavGroup } from "./footer-nav-group";
import { FooterSubscribe } from "./footer-subscribe";

const EXPLORE: NavItem[] = [
  { label: "Fire Safety Kit", href: "/fire-safety-kit" },
];

const ACCOUNT: NavItem[] = [
  { label: "Your Account", href: "/account" },
  { label: "Track Order", href: "/track-order" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
];

const DEFAULT_POLICIES: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
];

const HELP: NavItem[] = [
  { label: "Contact Us", href: "/contact" },
  { label: "Become a Dealer", href: "/become-a-dealer" },
  { label: "FAQs", href: "/#faq" },
  { label: "How to Use", href: "/#how-it-works" },
  { label: "Placement Guide", href: "/#placement" },
];

export async function SiteFooter() {
  const [settings, cmsPages] = await Promise.all([getGlobalSiteSettings(), getCmsPages()]);
  const { contact } = settings;

  const whatsappUrl = buildWhatsAppUrl(contact.whatsapp, contact.phone);
  const telUrl = buildTelUrl(contact.phone);

  const policyLinks: NavItem[] =
    settings.legalLinks.length > 0
      ? settings.legalLinks
      : cmsPages.length > 0
        ? cmsPages.map((page) => ({ label: page.title, href: page.href }))
        : DEFAULT_POLICIES;

  const cmsGroups = settings.footerGroups.filter((group) => group.links.length > 0);

  const columns = [
    { title: "Explore", links: cmsGroups[0]?.links ?? EXPLORE },
    { title: "Account", links: ACCOUNT },
    { title: "Policy", links: policyLinks.length > 0 ? policyLinks : DEFAULT_POLICIES },
    { title: "Help", links: HELP },
  ];

  const address = contact.address || "103, Ostwal Plaza 2, Sundarwas, Udaipur (Raj.) India";
  const email = contact.email || "grahakavach@gmail.com";
  const phone = contact.phone || "+91 78911 11390";

  return (
    <footer className="relative overflow-hidden border-t border-border bg-[#fffcfb]">
      {/* 1. Base peach gradient waves background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/footer/soft-peach-gradient-waves.png"
          alt=""
          fill
          className="object-cover object-bottom"
          priority
        />
      </div>

      {/* 2. Additional wavy ribbon layer for clear wave sweep across the lower footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[480px] z-0 overflow-hidden">
        <Image
          src="/footer/img-pattern.png"
          alt=""
          fill
          className="object-cover object-bottom opacity-85"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pt-10 pb-6 xs:px-5 sm:pt-12 lg:px-8 lg:pt-16 xl:px-10">
        {/*
         * Six columns: 4 link directories, Subscribe block, and Contact block
         */}
        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[0.85fr_0.9fr_1fr_0.9fr_1.6fr_1.35fr] lg:gap-y-0">
          {columns.map((column) => (
            <FooterNavGroup key={column.title} title={column.title} links={column.links} />
          ))}

          {/* Column 5: BE THE FIRST TO KNOW */}
          <div className="border-b border-gray-100/70 pb-5 lg:border-0 lg:pb-0">
            <h3 className="text-sm font-bold tracking-wider text-gray-900 uppercase">
              BE THE FIRST TO KNOW
            </h3>
            <p className="mt-2 max-w-xs text-xs leading-5 text-gray-600">
              Safety guidance, product updates and offers — occasionally, never daily.
            </p>
            <FooterSubscribe />
          </div>

          {/* Column 6: Get in Touch */}
          <div className="pt-2 sm:pt-0">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Get in Touch</h3>
              <div className="mt-1.5 hidden h-0.5 w-6 rounded-full bg-[#f95738] lg:block" />
            </div>

            <ul className="mt-3.5 space-y-3 text-xs leading-5 text-gray-600">
              {address ? (
                <li>
                  <a
                    href={contact.mapsUrl || undefined}
                    target={contact.mapsUrl ? "_blank" : undefined}
                    rel={contact.mapsUrl ? "noopener noreferrer" : undefined}
                    className="group flex items-start gap-3 transition-colors hover:text-gray-900"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fff0ed] text-[#e63920] shadow-2xs transition-transform group-hover:scale-105">
                      <MapPin className="size-4" />
                    </span>
                    <span className="whitespace-pre-line leading-relaxed">{address}</span>
                  </a>
                </li>
              ) : null}

              {email ? (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="group flex items-center gap-3 break-all transition-colors hover:text-gray-900"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fff0ed] text-[#e63920] shadow-2xs transition-transform group-hover:scale-105">
                      <Mail className="size-4" />
                    </span>
                    <span>{email}</span>
                  </a>
                </li>
              ) : null}

              {phone ? (
                <li>
                  <a
                    href={telUrl || `tel:${phone}`}
                    className="group flex items-center gap-3 transition-colors hover:text-gray-900"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fff0ed] text-[#e63920] shadow-2xs transition-transform group-hover:scale-105">
                      <Phone className="size-4" />
                    </span>
                    <span>{phone}</span>
                  </a>
                </li>
              ) : null}

              {whatsappUrl ? (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 transition-colors hover:text-gray-900"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fff0ed] text-[#e63920] shadow-2xs transition-transform group-hover:scale-105">
                      <WhatsAppIcon className="size-4" />
                    </span>
                    <span>WhatsApp</span>
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        {/* Brand row with Logo on left and Watermark Shield + Script text on right */}
        <div className="relative mt-10 sm:mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-gray-200/80 pt-8 pb-3">
          {/* Left: Logo + Vertical divider + Description */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 z-10 w-full md:w-auto">
            <Link href="/" className="inline-flex items-center shrink-0" aria-label={`${settings.brandName} home`}>
              <Image
                src="/brand/graha-kavach-logo.png"
                alt={settings.brandName}
                width={240}
                height={75}
                className="h-10 sm:h-12 w-auto object-contain"
                priority
              />
            </Link>

            <div className="hidden h-10 w-px bg-gray-300 sm:block" />

            <p className="max-w-md text-xs sm:text-sm leading-relaxed text-gray-600">
              Graha Kavach brings a practical 3-in-1 fire safety kit
              <br className="hidden sm:inline" /> to Indian homes, shops and workplaces.
            </p>
          </div>

          {/* Right: Watermark Shield pattern and Script Text */}
          <div className="relative flex items-center justify-center sm:justify-end z-10 w-full md:w-auto mt-2 md:mt-0 pr-1 sm:pr-4">
            {/* Watermark shield pattern placed behind */}
            <div className="pointer-events-none absolute right-0 sm:-right-6 -bottom-12 sm:-bottom-24 w-[190px] sm:w-[270px] opacity-35 -z-10">
              <Image
                src="/footer/pattern.png"
                alt=""
                width={270}
                height={270}
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Script text "Safer Spaces Brighter Tomorrows" */}
            <div className="relative z-10 w-[180px] sm:w-[240px]">
              <Image
                src="/footer/text.png"
                alt="Safer Spaces Brighter Tomorrows"
                width={300}
                height={90}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Secure payment options strip */}
        <div className="mt-4 sm:mt-5 relative z-10">
          <SecurePaymentStrip />
        </div>

        {/* Bottom copyright & tagline bar */}
        <div className="relative z-10 mt-8 border-t border-gray-200/80 pt-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-gray-500">
              PREVENT &nbsp;|&nbsp; PROTECT &nbsp;|&nbsp; BE PREPARED
            </span>

            <span className="text-xs text-gray-500">
              {settings.copyright || `© ${new Date().getFullYear()} ${settings.brandName}. All rights reserved.`}
            </span>

            <div className="flex items-center gap-2.5">
              <span className="h-0.75 w-9 rounded-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] border border-gray-200/60 shadow-2xs" />
              <span className="text-xs font-medium text-gray-500">For a Safer India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
