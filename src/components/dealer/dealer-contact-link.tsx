"use client";

import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

type Props = {
  href: string;
  /** What the visitor tapped, for the analytics event. */
  channel: "whatsapp" | "phone";
  className?: string;
  children: React.ReactNode;
};

/** A WhatsApp or call link that reports a Contact event to Meta (browser + server) before it opens. */
export function DealerContactLink({ href, channel, className, children }: Props) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => {
        trackMetaEvent("Contact", { content_name: "Dealer page", content_category: channel });
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "dealer_contact_click", channel });
      }}
    >
      {children}
    </a>
  );
}
