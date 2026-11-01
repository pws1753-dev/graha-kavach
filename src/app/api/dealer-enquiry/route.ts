import { NextResponse } from "next/server";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { escapeHtml, sendEmail } from "@/lib/email/resend";
import { extractClientContext, sendMetaCapiEvent } from "@/lib/analytics/meta-capi";

const BUSINESS_TYPES = [
  "Fire safety dealer / distributor",
  "Hardware / electrical store",
  "Kitchen / home appliance store",
  "Builder / interior / contractor",
  "Other",
] as const;

const dealerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  business: z.string().trim().max(150).optional().default(""),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+91|91|0)?[\s-]?[6-9]\d{4}[\s-]?\d{5}$/, "Please enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Please enter a valid email address").optional().or(z.literal("")),
  city: z.string().trim().min(2, "Please enter your city").max(100),
  state: z.string().trim().max(100).optional().default(""),
  type: z.enum(BUSINESS_TYPES, { message: "Please select your business type" }),
  gstin: z.string().trim().max(15).optional().default(""),
  message: z.string().trim().max(1500).optional().default(""),
  eventId: z.string().max(100).optional(),
  website_hp: z.string().optional().default(""), // honeypot
  timestamp: z.number().optional().default(0), // form load time
});

// IP -> request times. Small and per-process, enough to blunt a script hammering the form.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 4;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitMap.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

/** The WordPress inquiry endpoint needs an email; dealers may skip it, so this marks "not given". */
const NO_EMAIL = "not-provided@grahakavach.in";

export async function POST(req: Request) {
  try {
    const { clientIp, clientUserAgent, fbp, fbc } = extractClientContext(req);

    if (isRateLimited(clientIp || "unknown-ip")) {
      return NextResponse.json(
        { error: "Too many requests from your connection. Please wait a few minutes or WhatsApp us." },
        { status: 429 },
      );
    }

    const parsed = dealerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Please check the form and try again." },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Bots fill the hidden field: pretend it worked and drop it.
    if (data.website_hp.trim()) {
      return NextResponse.json({ success: true }, { status: 200 });
    }
    if (data.timestamp && Date.now() - data.timestamp < 1500) {
      return NextResponse.json({ error: "Please review your details and submit again." }, { status: 400 });
    }

    const phoneDigits = data.phone.replace(/\D/g, "").slice(-10);
    const lines = [
      `Business type: ${data.type}`,
      data.business && `Business name: ${data.business}`,
      `Mobile: ${phoneDigits}`,
      data.email && `Email: ${data.email}`,
      `City: ${data.city}`,
      data.state && `State: ${data.state}`,
      data.gstin && `GSTIN: ${data.gstin.toUpperCase()}`,
      data.message && `Message: ${data.message}`,
    ].filter(Boolean) as string[];

    const subject = `Dealer enquiry - ${data.city}`;

    const wpRes = await fetch("https://admin.grahakavach.in/wp-json/gk/v1/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email || NO_EMAIL,
        phone: phoneDigits,
        subject,
        message: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!wpRes.ok) {
      console.error("Dealer enquiry not saved in WordPress, status:", wpRes.status);
      return NextResponse.json(
        { error: "We could not save your enquiry right now. Please WhatsApp or call us and we will help right away." },
        { status: 502 },
      );
    }

    const safe = (value: string) => escapeHtml(value).replace(/\n/g, "<br>");
    await Promise.allSettled([
      sendEmail({
        to: serverEnv().CONTACT_NOTIFY_EMAIL,
        replyTo: data.email || undefined,
        subject: `New dealer enquiry: ${data.name}, ${data.city}`.replace(/[\r\n]+/g, " "),
        html: `<p><b>${escapeHtml(data.name)}</b> applied to become a dealer.</p><p>${safe(lines.join("\n"))}</p>`,
      }),
      data.email
        ? sendEmail({
            to: data.email,
            subject: "We received your dealer enquiry - Graha Kavach",
            html: `<p>Hi ${escapeHtml(data.name)},</p><p>Thank you for your interest in becoming a Graha Kavach dealer. Our team will call you shortly to share dealer pricing and terms.</p><p>Regards,<br>Team Graha Kavach</p>`,
          })
        : Promise.resolve(false),
      // Server-side Lead with hashed contact details: better ad matching than the browser event alone.
      sendMetaCapiEvent({
        eventName: "Lead",
        eventId: data.eventId,
        eventSourceUrl: req.headers.get("referer") || "https://grahakavach.in/become-a-dealer",
        userData: {
          email: data.email || undefined,
          phone: phoneDigits,
          firstName: data.name.split(/\s+/)[0],
          city: data.city,
          state: data.state || undefined,
          clientIp,
          clientUserAgent,
          fbp,
          fbc,
        },
        customData: { content_name: "Dealer enquiry", content_category: "dealer" },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Dealer enquiry error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or WhatsApp us." },
      { status: 500 },
    );
  }
}
