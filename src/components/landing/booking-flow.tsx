"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackInitiateCheckout, trackPurchase } from "@/lib/analytics/meta-pixel";
import { reportVerifiedPurchase } from "@/lib/analytics/google-purchase";
import type { CountdownConfig } from "@/lib/landing/countdown";
import { confirmRazorpayPayment, payWithRazorpay } from "@/lib/razorpay/client";
import { CARD_LOGOS, PaymentLogos, UPI_LOGOS, type PaymentLogoId } from "@/components/commerce/payment-logos";
import { INDIAN_STATES } from "@/lib/validation/checkout";
import { CountdownProvider, Timer, useCountdown } from "./countdown";
import { ArrowIcon } from "./rich";

export type BookingContent = {
  logoUrl: string;
  logoAlt: string;
  lockLabel: string;
  detailsTitle: string;
  detailsSub: string;
  detailsNote: string;
  payTitle: string;
  paySecure: string;
  doneTitle: string;
  doneText: string;
  doneSteps: string[];
  doneWhatsappLabel: string;
  whatsappKeyword: string;
  doneHomeLabel: string;
  phone: string;
};

export type BookingMoney = {
  productId: number;
  priceMinor: number;
  advanceMinor: number;
  currency: string;
  price: string;
  advance: string;
  balance: string;
  discount: string;
};

type Step = "details" | "pay" | "done";
type Method = "upi" | "card" | "netbanking";
type Fields = { name: string; phone: string; email: string; pin: string; city: string; address: string; state: string };
type Errors = Partial<Record<keyof Fields, string>>;

const STORAGE_KEY_PREFIX = "gk_booking_done";
const STORAGE_TTL_MS = 30 * 60 * 1000;

const METHODS: Array<{ id: Method; label: string; hint?: string; logos?: PaymentLogoId[] }> = [
  { id: "upi", label: "UPI", hint: "कोई भी UPI ऐप", logos: UPI_LOGOS },
  { id: "card", label: "डेबिट / क्रेडिट कार्ड", logos: CARD_LOGOS },
  { id: "netbanking", label: "नेट बैंकिंग" },
];

function newKey() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `gk_lp_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

function cleanPhone(raw: string) {
  return raw.replace(/^(\+91|0)/, "").replace(/\D/g, "");
}

function validate(f: Fields, needsState: boolean): Errors {
  const errors: Errors = {};
  if (f.name.trim().length < 2) errors.name = "अपना पूरा नाम लिखिए।";
  if (!/^[6-9]\d{9}$/.test(cleanPhone(f.phone))) errors.phone = "10 अंक का सही मोबाइल नंबर लिखिए।";
  if (!/^[1-9][0-9]{5}$/.test(f.pin.trim())) errors.pin = "6 अंक का सही पिनकोड लिखिए।";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = "सही ईमेल लिखिए, या इसे खाली छोड़ दीजिए।";
  if (f.city.trim().length < 2) errors.city = "शहर का नाम लिखिए।";
  if (f.address.trim().length < 3) errors.address = "मकान नं., गली और कॉलोनी लिखिए।";
  if (needsState && !f.state) errors.state = "राज्य चुनिए।";
  return errors;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[100svh] max-w-[480px] flex-col gap-3.5 bg-white px-5 pt-0 pb-5 text-base leading-[1.4]">{children}</div>;
}

function LockBar({ label }: { label: string }) {
  const timer = useCountdown();
  if (!timer || !label) return null;

  return (
    <div className="-mx-5 flex items-center justify-center gap-2.5 bg-foreground px-3 py-2 text-[12.5px] font-semibold text-white">
      <span>{label}</span>
      <Timer className="rounded-md bg-primary px-2 py-0.5" />
    </div>
  );
}

function Progress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`h-[5px] rounded-[3px] ${n <= step ? "bg-primary" : "bg-border"}`} />
      ))}
    </div>
  );
}

function Header({ logoUrl, logoAlt, onBack, backHref }: { logoUrl: string; logoAlt: string; onBack?: () => void; backHref?: string }) {
  const arrow = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
  const backClass = "-ml-3 flex size-11 items-center justify-center text-foreground";

  return (
    <div className="flex items-center justify-between">
      {backHref ? (
        <Link href={backHref} aria-label="वापस" className={backClass}>
          {arrow}
        </Link>
      ) : (
        <button type="button" aria-label="वापस" onClick={onBack} className={`${backClass} cursor-pointer border-0 bg-transparent`}>
          {arrow}
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={logoAlt} className="block h-[30px] w-auto" />
      <div className="w-8" />
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="m-0 text-[13px] font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function BookingFlow({
  slug,
  landingHref,
  hideTimer,
  content,
  money,
  countdown,
}: {
  /** The landing page this booking came from, saved on the order. */
  slug: string;
  landingHref: string;
  hideTimer: boolean;
  content: BookingContent;
  money: BookingMoney;
  countdown: CountdownConfig;
}) {
  const [step, setStep] = useState<Step>("details");
  const [fields, setFields] = useState<Fields>({ name: "", phone: "", email: "", pin: "", city: "", address: "", state: "" });
  const [errors, setErrors] = useState<Errors>({});
  // The PIN whose lookup came back without a state; only then does the form ask for one.
  const [failedPin, setFailedPin] = useState("");
  const [method, setMethod] = useState<Method>("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");

  const storageKey = `${STORAGE_KEY_PREFIX}:${slug}`;
  const idempotencyKey = useRef(newKey());
  const order = useRef<{ orderId: number; orderKey: string; orderNumber: string; razorpay: { keyId: string; orderId: string; amount: number; currency: string } | null } | null>(null);
  const cityTouched = useRef(false);
  const stateKnown = failedPin !== fields.pin;

  // A refresh on the confirmation screen must not drop the customer back on an empty form.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as { id: string; at: number } | null;
      if (saved && Date.now() - saved.at < STORAGE_TTL_MS) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
        setBookingId(saved.id);
        setStep("done");
      }
    } catch {
      // Storage can be blocked; the form simply starts empty.
    }
  }, [storageKey]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // PIN code fills the state, and the city when the customer has not typed one.
  useEffect(() => {
    const pin = fields.pin;
    if (!/^[1-9][0-9]{5}$/.test(pin)) return;

    const controller = new AbortController();
    fetch(`/api/book-now/pincode?pin=${pin}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { found?: boolean; state?: string | null; district?: string }) => {
        if (data.found && data.state) {
          setFailedPin("");
          setFields((prev) => ({
            ...prev,
            state: data.state ?? "",
            city: !cityTouched.current && !prev.city.trim() ? (data.district ?? "") : prev.city,
          }));
        } else {
          setFailedPin(pin);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailedPin(pin);
      });

    return () => controller.abort();
  }, [fields.pin]);

  const update = (key: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (key === "city") cityTouched.current = true;
    const value = key === "pin" ? event.target.value.replace(/\D/g, "").slice(0, 6) : event.target.value;
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const goToPay = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(fields, !stateKnown);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`gk-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    // Details may have changed since an earlier attempt: start a fresh order.
    idempotencyKey.current = newKey();
    order.current = null;
    setError("");
    trackInitiateCheckout({ value: money.priceMinor / 100, currency: money.currency, content_ids: [money.productId] });
    setStep("pay");
  };

  const pay = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const nameParts = fields.name.trim().split(/\s+/);

      if (!order.current) {
        const res = await fetch("/api/checkout/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "landing",
            landing: slug,
            address: {
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(" "),
              email: fields.email.trim(),
              phone: fields.phone,
              address1: fields.address.trim(),
              city: fields.city.trim(),
              state: fields.state,
              postcode: fields.pin,
              country: "IN",
            },
            paymentMethod: "cod",
            items: [{ productId: money.productId, quantity: 1 }],
            idempotencyKey: idempotencyKey.current,
          }),
        });

        const raw = await res.text();
        let data: {
          success?: boolean;
          error?: string;
          messages?: string[];
          orderId?: number;
          orderKey?: string;
          orderNumber?: string;
          razorpay?: { keyId: string; orderId: string; amount: number; currency: string } | null;
        };
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error("अभी बुकिंग नहीं हो पाई। कोई पैसा नहीं कटा। कृपया एक मिनट बाद फिर कोशिश कीजिए।");
        }

        if (!res.ok || !data.success || !data.orderId || !data.orderKey) {
          throw new Error(data.messages?.[0] || "बुकिंग शुरू नहीं हो पाई। कृपया फिर कोशिश कीजिए।");
        }

        order.current = {
          orderId: data.orderId,
          orderKey: data.orderKey,
          orderNumber: data.orderNumber || String(data.orderId),
          razorpay: data.razorpay ?? null,
        };
      }

      const current = order.current;
      if (!current.razorpay) {
        throw new Error("ऑनलाइन भुगतान अभी चालू नहीं है। कृपया हमें कॉल कीजिए और बुकिंग करवाइए।");
      }

      const result = await payWithRazorpay({
        ...current.razorpay,
        name: "Graha Kavach",
        description: `Booking #${current.orderNumber}`,
        prefill: { name: fields.name.trim(), contact: cleanPhone(fields.phone), ...(fields.email.trim() ? { email: fields.email.trim() } : {}), method },
        one_click_checkout: false,
      });

      if (result.status === "dismissed") throw new Error("भुगतान पूरा नहीं हुआ। बुकिंग सेव है, दोबारा बटन दबाइए।");
      if (result.status === "failed") throw new Error(`${result.message} कृपया दोबारा कोशिश कीजिए।`);

      const confirmed = await confirmRazorpayPayment({ wooOrderId: current.orderId, orderKey: current.orderKey, ...result.payment });
      if (!confirmed) {
        throw new Error(`आपका भुगतान हो गया है, पर पुष्टि में देरी है। दोबारा भुगतान न करें। कृपया बुकिंग ID ${current.orderNumber} के साथ हमें कॉल कीजिए।`);
      }

      void reportVerifiedPurchase(current.orderId, current.orderKey);
      trackPurchase({ orderId: current.orderNumber, value: money.priceMinor / 100, currency: money.currency, content_ids: [money.productId] });
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ id: current.orderNumber, at: Date.now() }));
      } catch {
        // Not critical.
      }
      setBookingId(current.orderNumber);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "बुकिंग नहीं हो पाई। कृपया फिर कोशिश कीजिए।");
    } finally {
      setBusy(false);
    }
  }, [fields, method, money.currency, money.priceMinor, money.productId, slug, storageKey]);

  const phoneDigits = content.phone.replace(/\D/g, "").slice(-10);
  const priceBox = (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-red-200 bg-primary-subtle px-4 py-3">
      <div className="flex flex-col">
        <div className="text-[13px] font-semibold text-foreground-muted">अभी देना है</div>
        <div className="lp-display text-[22px] leading-[1.1] font-extrabold text-primary">{money.advance}</div>
      </div>
      <div className="flex flex-col text-right">
        <div className="text-[13px] font-semibold text-foreground-muted">डिलीवरी पर</div>
        <div className="lp-display text-[22px] leading-[1.1] font-extrabold">{money.balance}</div>
      </div>
    </div>
  );

  return (
    <CountdownProvider config={countdown} enabled={!hideTimer}>
      {step === "details" ? (
        <Shell>
          <LockBar label={content.lockLabel} />
          <Header logoUrl={content.logoUrl} logoAlt={content.logoAlt} backHref={landingHref} />
          <div className="flex flex-col gap-2">
            <Progress step={1} />
            <div className="text-[13px] font-semibold text-muted-foreground">चरण 1 / 3 · आपकी जानकारी</div>
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="m-0 text-[23px] leading-[1.2] font-extrabold">{content.detailsTitle}</h1>
            <div className="text-[15px] text-foreground-muted">{content.detailsSub}</div>
          </div>

          <form onSubmit={goToPay} noValidate className="m-0 flex flex-1 flex-col gap-2.5">
            <Field id="gk-name" label="पूरा नाम" error={errors.name}>
              <input id="gk-name" type="text" autoComplete="name" value={fields.name} onChange={update("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "gk-name-error" : undefined} className="lp-input" />
            </Field>
            <Field id="gk-phone" label="मोबाइल नंबर (WhatsApp वाला)" error={errors.phone}>
              <input id="gk-phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10 अंक" value={fields.phone} onChange={update("phone")} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "gk-phone-error" : undefined} className="lp-input" />
            </Field>
            <Field id="gk-email" label="ईमेल (वैकल्पिक, बिल भेजने के लिए)" error={errors.email}>
              <input id="gk-email" type="email" inputMode="email" autoComplete="email" value={fields.email} onChange={update("email")} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "gk-email-error" : undefined} className="lp-input" />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field id="gk-pin" label="पिनकोड" error={errors.pin}>
                <input id="gk-pin" type="text" inputMode="numeric" autoComplete="postal-code" value={fields.pin} onChange={update("pin")} aria-invalid={Boolean(errors.pin)} aria-describedby={errors.pin ? "gk-pin-error" : undefined} className="lp-input" />
              </Field>
              <Field id="gk-city" label="शहर" error={errors.city}>
                <input id="gk-city" type="text" autoComplete="address-level2" value={fields.city} onChange={update("city")} aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? "gk-city-error" : undefined} className="lp-input" />
              </Field>
            </div>
            {!stateKnown ? (
              <Field id="gk-state" label="राज्य" error={errors.state}>
                <select id="gk-state" value={fields.state} onChange={update("state")} aria-invalid={Boolean(errors.state)} aria-describedby={errors.state ? "gk-state-error" : undefined} className="lp-input">
                  <option value="">राज्य चुनिए</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field id="gk-address" label="घर का पता" error={errors.address}>
              <textarea id="gk-address" rows={3} autoComplete="street-address" placeholder="मकान नं., गली, कॉलोनी" value={fields.address} onChange={update("address")} aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? "gk-address-error" : undefined} className="lp-input !h-[68px] resize-none !py-2.5 leading-[1.35]" />
            </Field>

            {priceBox}

            <div className="mt-auto flex flex-col gap-2.5 pt-2">
              <button type="submit" className="lp-btn">
                Book Now — {money.advance} दें
                <ArrowIcon />
              </button>
              <div className="text-center text-[13px] text-muted-foreground">{content.detailsNote}</div>
            </div>
          </form>
        </Shell>
      ) : null}

      {step === "pay" ? (
        <Shell>
          <LockBar label={content.lockLabel} />
          <Header logoUrl={content.logoUrl} logoAlt={content.logoAlt} onBack={() => setStep("details")} />
          <div className="flex flex-col gap-2">
            <Progress step={2} />
            <div className="text-[13px] font-semibold text-muted-foreground">चरण 2 / 3 · बुकिंग राशि</div>
          </div>
          <h1 className="m-0 text-[23px] leading-[1.2] font-extrabold">{content.payTitle}</h1>

          <div className="flex flex-col gap-2.5 rounded-[14px] bg-foreground p-[18px] text-white">
            <div className="flex justify-between gap-3 text-base">
              <div>Graha Kavach 3-in-1 किट × 1</div>
              <div className="lp-display font-bold">{money.price}</div>
            </div>
            <div className="flex justify-between gap-3 text-base text-[#a8a29e]">
              <div>डिलीवरी पर देना है</div>
              <div className="lp-display font-bold">{money.balance}</div>
            </div>
            {money.discount ? (
              <div className="flex justify-between gap-3 text-base font-semibold text-accent">
                <div>आज का ऑफ़र</div>
                <div>{money.discount} की छूट लागू</div>
              </div>
            ) : null}
            <div className="h-px bg-[#3f3f3f]" />
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-bold">अभी देना है</div>
              <div className="lp-display text-[28px] leading-none font-extrabold text-accent">{money.advance}</div>
            </div>
          </div>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 p-0 text-sm font-semibold">भुगतान का तरीक़ा</legend>
            {METHODS.map((option) => {
              const selected = method === option.id;
              return (
                <label
                  key={option.id}
                  htmlFor={`pm-${option.id}`}
                  className={`flex min-h-[52px] cursor-pointer items-center gap-3.5 rounded-[10px] px-4 py-2 ${selected ? "border-2 border-primary bg-primary-subtle" : "border border-border-strong bg-white"}`}
                >
                  <input id={`pm-${option.id}`} type="radio" name="pm" checked={selected} onChange={() => setMethod(option.id)} className="m-0 size-5 accent-primary" />
                  <span className="flex flex-col">
                    <span className="text-[17px] leading-tight font-bold">{option.label}</span>
                    {option.hint ? <span className="text-sm leading-tight text-foreground-muted">{option.hint}</span> : null}
                  </span>
                  {option.logos ? <PaymentLogos ids={option.logos} height={16} className="ml-auto justify-end" /> : null}
                </label>
              );
            })}
          </fieldset>

          {error ? (
            <p role="alert" className="m-0 rounded-[10px] bg-danger-subtle px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-auto flex flex-col gap-2.5 pt-2">
            <button type="button" onClick={pay} disabled={busy} className="lp-btn">
              {busy ? "कृपया रुकिए…" : `${money.advance} दें और Book करें`}
              {busy ? null : <ArrowIcon />}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {content.paySecure}
            </div>
          </div>
        </Shell>
      ) : null}

      {step === "done" ? (
        <Shell>
          <div className="pt-6">
            <Progress step={3} />
          </div>
          <div className="mt-2 flex flex-col items-center gap-3.5 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.logoUrl} alt={content.logoAlt} className="block h-[34px] w-auto" />
            <svg width="96" height="96" viewBox="0 0 128 128" role="img" aria-label={content.doneTitle}>
              <circle cx="64" cy="64" r="56" fill="#fef2f2" stroke="#e01820" strokeWidth="6" />
              <path d="M42 66l15 15 29-32" fill="none" stroke="#e01820" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="m-0 text-[26px] leading-[1.2] font-extrabold">{content.doneTitle}</h1>
            <div className="text-[15.5px] leading-normal text-foreground-muted">{content.doneText}</div>
            {bookingId ? (
              <div className="rounded-[10px] border border-border-strong px-[18px] py-2.5 text-[15px] text-foreground-muted">
                बुकिंग ID <span className="lp-display font-extrabold text-foreground">{bookingId}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3.5 rounded-[14px] bg-muted p-[18px]">
            <div className="text-[17px] font-bold">अब आगे क्या होगा</div>
            {content.doneSteps.map((text, index) => (
              <div key={text} className="flex items-start gap-3">
                <div className="lp-display flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">{index + 1}</div>
                <div className="text-base leading-[1.45] text-foreground-muted">{text}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-2">
            {phoneDigits ? (
              <a href={`https://wa.me/91${phoneDigits}?text=${encodeURIComponent(content.whatsappKeyword)}`} className="lp-btn" target="_blank" rel="noopener noreferrer">
                {content.doneWhatsappLabel}
              </a>
            ) : null}
            {phoneDigits ? (
              <div className="text-center text-[15px] text-foreground-muted">
                सवाल है? कॉल करें{" "}
                <a href={`tel:+91${phoneDigits}`} className="font-bold text-primary">
                  {phoneDigits}
                </a>
              </div>
            ) : null}
            <Link
              href={landingHref}
              onClick={() => {
                try {
                  sessionStorage.removeItem(storageKey);
                } catch {
                  // Not critical.
                }
              }}
              className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-foreground-muted"
            >
              {content.doneHomeLabel}
            </Link>
          </div>
        </Shell>
      ) : null}
    </CountdownProvider>
  );
}
