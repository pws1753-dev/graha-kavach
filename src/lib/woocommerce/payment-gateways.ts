import "server-only";

import { z } from "zod";
import { getWooCommerceUrls, wooRequest } from "./client";

export const wooPaymentGatewaySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullish().transform((value) => value ?? ""),
  instructions: z.string().nullish().transform((value) => value ?? ""),
  enabled: z.boolean(),
  method_title: z.string().optional().default(""),
  method_description: z.string().optional().default(""),
});

export type WooPaymentGateway = z.infer<typeof wooPaymentGatewaySchema>;

export type PaymentMethodInfo = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  isOnline: boolean;
};

const isOnlineGateway = (id: string) => !["cod", "bacs", "cheque"].includes(id.toLowerCase());

/*
 * The authenticated /payment_gateways endpoint needs a WooCommerce API key with
 * admin-level rights. When it is refused, the public Store API still lists the
 * gateways that are enabled at checkout, so checkout keeps working.
 */
const storeApiTitles: Record<string, { title: string; description: string }> = {
  razorpay: {
    title: "UPI, Cards, NetBanking",
    description: "Pay securely via UPI, Credit/Debit Card, or Internet Banking through Razorpay.",
  },
  cod: {
    title: "Cash on Delivery",
    description: "Pay in cash or via UPI QR code upon doorstep delivery.",
  },
};

async function getGatewaysFromStoreApi(): Promise<PaymentMethodInfo[]> {
  const response = await fetch(`${getWooCommerceUrls().base}/wp-json/wc/store/v1/cart`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Store API responded ${response.status}`);

  const cart = (await response.json()) as { payment_methods?: string[] };

  return (cart.payment_methods ?? []).map((id) => ({
    id,
    title: storeApiTitles[id]?.title ?? id,
    description: storeApiTitles[id]?.description ?? "",
    instructions: "",
    isOnline: isOnlineGateway(id),
  }));
}

export async function getActivePaymentGateways(): Promise<PaymentMethodInfo[]> {
  try {
    const gateways = await wooRequest<WooPaymentGateway[]>({
      path: "/payment_gateways",
      schema: z.array(wooPaymentGatewaySchema),
      revalidate: false,
    });

    return gateways
      .filter((g) => g.enabled)
      .map((g) => ({
        id: g.id,
        title: g.title || g.method_title || g.id,
        description: g.description || g.method_description || "",
        instructions: g.instructions || "",
        isOnline: isOnlineGateway(g.id),
      }));
  } catch (error) {
    console.error("[payment-gateways] REST lookup failed, using Store API:", error);
    try {
      return await getGatewaysFromStoreApi();
    } catch (fallbackError) {
      console.error("[payment-gateways] Store API lookup failed:", fallbackError);
      return [];
    }
  }
}
