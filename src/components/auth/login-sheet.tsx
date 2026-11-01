"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useCustomer } from "@/lib/auth/use-customer";
import { useLoginModal } from "@/lib/auth/login-modal-context";
import { useOverlayBehavior } from "@/lib/hooks/use-overlay-behavior";
import { brandAssets } from "@/lib/config/brand";
import { LoginTabs } from "./login-tabs";

const DISMISSED_KEY = "gk_login_prompt_dismissed";
const PROMPT_DELAY_MS = 3000;
const SNOOZE_MS = 24 * 60 * 60 * 1000;
// /become-a-dealer is an ad landing page: a popup over its form would cost enquiries.
const NO_PROMPT_PATHS = ["/account", "/checkout", "/order-confirmation", "/become-a-dealer"];

function wasRecentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

/**
 * The login popup. Desktop: centred card, product image on the left and the OTP
 * form on the right. Mobile: a sheet that slides up from the bottom. It opens by
 * itself a few seconds after load for signed-out visitors (once a day), and can
 * be opened any time from the header.
 */
export function LoginSheet() {
  const { customer, isLoading } = useCustomer();
  const { isOpen, openLogin, closeLogin } = useLoginModal();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Auto-prompt once the session check has finished and nobody is signed in.
  useEffect(() => {
    if (isLoading || customer) return;
    if (NO_PROMPT_PATHS.some((p) => pathname.startsWith(p))) return;
    if (wasRecentlyDismissed()) return;
    const timer = window.setTimeout(openLogin, PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isLoading, customer, pathname, openLogin]);

  const open = isOpen && !customer;

  // Slide-in: mount first, flip to visible on the next frame so the transition runs.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(frame);
      setVisible(false);
    };
  }, [open]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
    closeLogin();
  };

  useOverlayBehavior({ open, onClose: dismiss, panelRef });

  // `open` only turns true after a timer or a click, so this is closed during SSR and hydration.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex items-end justify-center bg-foreground/50 backdrop-blur-[2px] transition-opacity duration-300 md:items-center md:p-6 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Login or sign up"
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl outline-none transition-transform duration-300 ease-out md:max-h-[600px] md:max-w-4xl md:flex-row md:rounded-2xl ${
          visible ? "translate-y-0" : "translate-y-full md:translate-y-6"
        }`}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition-colors hover:bg-white"
        >
          <X className="size-4" />
        </button>

        {/* Left: image only, no text over it. Desktop only. */}
        <div className="relative hidden md:block md:w-[46%]">
          <Image
            src="/cta/cta-mobile.png"
            alt=""
            fill
            sizes="(min-width: 768px) 440px, 0px"
            className="object-cover object-bottom"
          />
        </div>

        {/* Right: OTP login */}
        <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 pt-8 pb-8 md:px-10 md:py-12">
          <div className="mx-auto mb-6 w-full max-w-sm">
            <Image
              src={brandAssets.logo.url}
              alt={brandAssets.logo.alt}
              width={brandAssets.logo.width}
              height={brandAssets.logo.height}
              className="mb-5 h-10 w-auto"
            />
            <h2 className="text-xl font-medium text-foreground">Login / Sign up</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with a one-time password on your mobile, or with your email.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <LoginTabs onSuccess={closeLogin} onNavigate={closeLogin} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
