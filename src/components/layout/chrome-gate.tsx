"use client";

import { usePathname } from "next/navigation";

/** Routes that are standalone funnels: no site header, footer, tab bar or cart drawer. */
const BARE_PREFIXES = ["/book-now", "/lp"];

type Props = {
  /** Rendered above the page: header and its spacer. */
  before: React.ReactNode;
  /** Rendered below the page: footer, tab bar, cart drawer, login sheet. */
  after: React.ReactNode;
  children: React.ReactNode;
};

/**
 * The campaign landing page is a conversion funnel with its own header and
 * buttons. Showing the store navigation and the phone tab bar over it would
 * give visitors ways to leave in the middle of booking.
 */
export function ChromeGate({ before, after, children }: Props) {
  const pathname = usePathname();
  const bare = BARE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  return (
    <>
      {bare ? null : before}
      <div id="main" className="flex-1">
        {children}
      </div>
      {bare ? null : after}
    </>
  );
}
