import crypto from "crypto";

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "1790598735635524";

export const META_CONVERSIONS_API_ACCESS_TOKEN =
  process.env.META_CONVERSIONS_API_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || "";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email?: string): string[] | undefined {
  if (!email || typeof email !== "string") return undefined;
  const cleaned = email.trim().toLowerCase();
  return cleaned ? [sha256(cleaned)] : undefined;
}

function normalizePhone(phone?: string): string[] | undefined {
  if (!phone || typeof phone !== "string") return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  // If 10 digits (standard Indian mobile), prepend 91
  if (digits.length === 10) {
    digits = "91" + digits;
  }
  return [sha256(digits)];
}

function normalizeString(val?: string): string[] | undefined {
  if (!val || typeof val !== "string") return undefined;
  const cleaned = val.trim().toLowerCase();
  return cleaned ? [sha256(cleaned)] : undefined;
}

export type MetaCapiUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  clientIp?: string;
  clientUserAgent?: string;
  /** Meta browser id cookie (_fbp) and click id (_fbc): they tie this server event to the ad click. */
  fbp?: string;
  fbc?: string;
};

export type MetaCapiCustomData = {
  value?: number;
  currency?: string;
  content_type?: string;
  contents?: Array<{
    id: string | number;
    quantity: number;
    item_price?: number;
  }>;
  num_items?: number;
  order_id?: string | number;
  [key: string]: unknown;
};

export type SendMetaCapiOptions = {
  eventName: string;
  eventId?: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData: MetaCapiUserData;
  customData?: MetaCapiCustomData;
};

/**
 * Sends a server-side conversion event to Meta Conversions API (CAPI).
 * Deduplicates with browser pixel events when `eventId` matches browser `eventID`.
 */
export async function sendMetaCapiEvent(
  options: SendMetaCapiOptions,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const pixelId = META_PIXEL_ID;
    const token = META_CONVERSIONS_API_ACCESS_TOKEN;

    if (!pixelId || !token) {
      return { success: false, error: "Meta Pixel ID or Access Token is missing." };
    }

    const { eventName, eventId, eventTime, eventSourceUrl, userData, customData } =
      options;

    const formattedUserData: Record<string, unknown> = {};

    const em = normalizeEmail(userData.email);
    if (em) formattedUserData.em = em;

    const ph = normalizePhone(userData.phone);
    if (ph) formattedUserData.ph = ph;

    const fn = normalizeString(userData.firstName);
    if (fn) formattedUserData.fn = fn;

    const ln = normalizeString(userData.lastName);
    if (ln) formattedUserData.ln = ln;

    const ct = normalizeString(userData.city);
    if (ct) formattedUserData.ct = ct;

    const st = normalizeString(userData.state);
    if (st) formattedUserData.st = st;

    const zp = normalizeString(userData.postcode);
    if (zp) formattedUserData.zp = zp;

    formattedUserData.country = [sha256((userData.country || "in").toLowerCase())];

    if (userData.clientIp) {
      formattedUserData.client_ip_address = userData.clientIp;
    }
    if (userData.clientUserAgent) {
      formattedUserData.client_user_agent = userData.clientUserAgent;
    }
    // Sent as-is, never hashed.
    if (userData.fbp) formattedUserData.fbp = userData.fbp;
    if (userData.fbc) formattedUserData.fbc = userData.fbc;

    const eventPayload = {
      event_name: eventName,
      event_time: eventTime || Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: eventSourceUrl || "https://grahakavach.in",
      action_source: "website",
      user_data: formattedUserData,
      custom_data: customData,
    };

    const url = `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${token}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [eventPayload],
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      console.error("[Meta CAPI Error]", data.error || data);
      return { success: false, error: data.error?.message || "Failed to send event to Meta CAPI" };
    }

    return { success: true, result: data };
  } catch (err) {
    console.error("[Meta CAPI Exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Extracts client IP and User Agent from a standard Request.
 */
export function extractClientContext(request: Request): {
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const clientIp = (cfConnectingIp || forwarded?.split(",")[0] || realIp || "").trim() || undefined;
  const clientUserAgent = request.headers.get("user-agent") || undefined;

  const cookie = request.headers.get("cookie") || "";
  const readCookie = (name: string) =>
    cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) || undefined;

  return { clientIp, clientUserAgent, fbp: readCookie("_fbp"), fbc: readCookie("_fbc") };
}
