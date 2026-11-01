"use client";

import { Button } from "@/components/ui/button";
import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

type Props = {
  href: string;
  /** What the visitor tapped, for the analytics event. */
  channel: "whatsapp" | "phone";
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

/**
 * A WhatsApp or call link in the site's standard button style. It reports a
 * Contact event to Meta (browser + server) and GTM before the link opens.
 */
export function DealerContactLink({ href, channel, variant = "outline", size = "lg", className, children }: Props) {
  const external = href.startsWith("http");

  return (
    <Button
      href={href}
      variant={variant}
      size={size}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => {
        trackMetaEvent("Contact", { content_name: "Dealer page", content_category: channel });
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "dealer_contact_click", channel });
      }}
    >
      {children}
    </Button>
  );
}
