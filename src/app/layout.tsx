import type { Metadata } from "next";
import localFont from "next/font/local";
import { GoogleTagManagerNoScript, GoogleTags } from "@/components/analytics/google-tags";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { LoginSheet } from "@/components/auth/login-sheet";
import { CartRecovery } from "@/components/cart/cart-recovery";
import { ChromeGate } from "@/components/layout/chrome-gate";
import { HeaderSpacer } from "@/components/layout/header-spacer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ScrollToTopOnNav } from "@/components/layout/scroll-to-top-on-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ToastProvider } from "@/components/ui/toast";
import { CustomerProvider } from "@/lib/auth/customer-context";
import { LoginModalProvider } from "@/lib/auth/login-modal-context";
import { CartProvider } from "@/lib/cart/cart-context";
import { CommerceUIProvider } from "@/lib/commerce/ui-context";
import { buildWhatsAppUrl } from "@/lib/config/contact";
import { brandAssets } from "@/lib/config/brand";
import { siteConfig } from "@/lib/config/site";
import { WishlistProvider } from "@/lib/wishlist/wishlist-context";
import { getGlobalSiteSettings } from "@/lib/wordpress/adapters";
import "./globals.css";

// Fonts live in the repo (src/fonts), not on Google Fonts: a build must never depend on a
// network fetch, which failed on the Hostinger build server.
const manrope = localFont({
  variable: "--font-manrope",
  // Only 400 and 500 are ever used. Loading 600+ would let a stray utility
  // class introduce a weight the brand does not use.
  src: [
    { path: "../fonts/manrope-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/manrope-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.frontendUrl),
  title: {
    default: "Graha Kavach",
    template: "%s | Graha Kavach",
  },
  description:
    "Graha Kavach by Speciality Geochem, Udaipur: certified home fire safety kit with fire extinguisher, fire safety ball and fire blanket. COD available, delivery across India.",
  openGraph: {
    title: "Graha Kavach",
    description: "Explore the Graha Kavach fire-safety kit for homes and workplaces.",
    url: siteConfig.frontendUrl,
    siteName: "Graha Kavach",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/brand/graha-kavach-logo.png", width: 1200, height: 630, alt: "Graha Kavach" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  verification: { google: "zHKuzkyiampKOPGNuxyugsJG3nVvMb79lBcj2dtqX8U" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/brand/graha-kavach-favicon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const PRODUCT_HREF = "/fire-safety-kit";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getGlobalSiteSettings();
  const whatsappUrl = buildWhatsAppUrl(
    settings.contact.whatsapp,
    settings.contact.phone,
    "Hello Graha Kavach, I would like to know more about the fire safety kit.",
  );

  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
      /*
       * The announcement bar is optional and opaque, so its height is part of
       * every top offset on the site: the header spacer, the hero's top
       * padding and the scroll-margin of anchor targets all read it. Setting it
       * here, where whether the bar exists is actually known, keeps those three
       * in agreement.
       */
      style={
        settings.announcement
          ? ({ "--gk-announcement-h": "40px" } as React.CSSProperties)
          : undefined
      }
    >
      {/*
       * Provider order matters: the wishlist merges on sign-in, so it has to sit
       * inside the customer provider. The commerce UI provider owns which
       * overlay is open and is read by the header, the tab bar and the drawer.
       */}
      <body className="flex min-h-full flex-col bg-white text-foreground">
        <GoogleTagManagerNoScript />
        <GoogleTags />
        <MetaPixel />
        <CustomerProvider>
          <LoginModalProvider>
          <WishlistProvider>
            <CartProvider>
              <CommerceUIProvider>
                <ToastProvider>
                  <ScrollToTopOnNav />
                  <CartRecovery />
                  <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-[var(--radius)] focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-white"
                  >
                    Skip to content
                  </a>

                  <ChromeGate
                    before={
                      <>
                        <SiteHeader />
                        <HeaderSpacer />
                      </>
                    }
                    after={
                      <>
                        <SiteFooter />

                        {/* Reserves the height of the fixed tab bar on phones. */}
                        <div aria-hidden="true" className="gk-bottom-nav-offset" />

                        <MobileBottomNav productHref={PRODUCT_HREF} whatsappUrl={whatsappUrl} />
                        <CartDrawer />
                        <LoginSheet />
                      </>
                    }
                  >
                    {children}
                  </ChromeGate>
                </ToastProvider>
              </CommerceUIProvider>
            </CartProvider>
          </WishlistProvider>
          </LoginModalProvider>
        </CustomerProvider>
      </body>
    </html>
  );
}
