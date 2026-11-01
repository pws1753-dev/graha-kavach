"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fbq } from "@/lib/analytics/meta-pixel";
import { DEALER_WHATSAPP_URL } from "@/lib/dealer/contact";

const BUSINESS_TYPES = [
  "Fire safety dealer / distributor",
  "Hardware / electrical store",
  "Kitchen / home appliance store",
  "Builder / interior / contractor",
  "Other",
];

const inputClass =
  "mt-1 w-full rounded-[var(--radius)] border border-foreground/15 bg-white px-3 py-2.5 text-base outline-none transition placeholder:text-foreground-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

type Status = "idle" | "sending" | "done";

export function DealerForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const loadedAt = useRef(0);

  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    if (get("phone").replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setStatus("sending");

    // Same id in the browser Pixel and the server Conversions API, so Meta counts one lead.
    const eventId = `Lead-${crypto.randomUUID()}`;

    try {
      const res = await fetch("/api/dealer-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          business: get("business"),
          phone: get("phone"),
          email: get("email"),
          city: get("city"),
          state: get("state"),
          type: get("type"),
          gstin: get("gstin"),
          message: get("message"),
          website_hp: get("website_hp"),
          timestamp: loadedAt.current,
          eventId,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(body.error || "We could not send your enquiry. Please try again or WhatsApp us.");
        setStatus("idle");
        return;
      }

      fbq("track", "Lead", { content_name: "Dealer enquiry", content_category: "dealer" }, { eventID: eventId });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "generate_lead", lead_type: "dealer" });

      setStatus("done");
    } catch {
      setError("Network problem. Please check your connection and try again, or WhatsApp us.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="py-4 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h3 className="mt-3 text-xl font-extrabold">Enquiry received</h3>
        <p className="mt-2 text-sm text-foreground-muted">
          Thank you. Our team will call you shortly with dealer pricing and terms.
        </p>
        <Button
          href={DEALER_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          size="lg"
          className="mt-5"
        >
          <MessageCircle className="size-5" aria-hidden />
          Chat with us on WhatsApp
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">
        Full name *
        <input name="name" required minLength={2} autoComplete="name" className={inputClass} />
      </label>
      <label className="text-sm font-medium">
        Mobile number *
        <input
          name="phone"
          type="tel"
          required
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10-digit number"
          className={inputClass}
        />
      </label>
      <label className="text-sm font-medium">
        City *
        <input name="city" required autoComplete="address-level2" className={inputClass} />
      </label>
      <label className="text-sm font-medium">
        Business type *
        <select name="type" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select one
          </option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Business / firm name
        <input name="business" autoComplete="organization" placeholder="Optional" className={inputClass} />
      </label>
      <label className="text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="email" placeholder="Optional" className={inputClass} />
      </label>
      <label className="text-sm font-medium">
        State
        <input name="state" autoComplete="address-level1" placeholder="Optional" className={inputClass} />
      </label>
      <label className="text-sm font-medium">
        GSTIN
        <input name="gstin" maxLength={15} placeholder="Optional" className={`${inputClass} uppercase`} />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Message
        <textarea
          name="message"
          rows={3}
          maxLength={1500}
          className={inputClass}
          placeholder="Tell us about your shop, area or expected volume"
        />
      </label>

      {/* Honeypot: hidden from people, filled by bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website_hp" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-primary sm:col-span-2">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" fullWidth disabled={status === "sending"} className="sm:col-span-2">
        {status === "sending" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
        {status === "sending" ? "Sending…" : "Get dealer pricing & terms"}
      </Button>
      <p className="text-center text-xs text-foreground-muted sm:col-span-2">
        Our team will call you back. Your details are used only to contact you about the dealership.
      </p>
    </form>
  );
}
