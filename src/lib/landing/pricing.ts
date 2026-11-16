import "server-only";

import { computeAdvanceMinor } from "@/lib/config/checkout";
import { getCodAdvanceConfig } from "@/lib/woocommerce/checkout-settings";
import { getProductBySlug } from "@/lib/woocommerce/products";
import type { LandingPricing } from "./text";
import { isFullCodLanding } from "./routes";

const DEFAULT_PRODUCT_SLUG = "graha-kavach-complete-fire-safety-kit";

const toMinor = (value: string) => Math.round((parseFloat(value) || 0) * 100);

/** Live price, regular price and advance for the page's product. Null when the product cannot be read. */
export async function getLandingPricing(productSlug?: string, landingSlug = ""): Promise<LandingPricing | null> {
  try {
    const requested = productSlug?.trim() || DEFAULT_PRODUCT_SLUG;
    // If the slug set on the landing page matches no published product, use the default kit instead of failing the page.
    const productPromise = getProductBySlug(requested).catch((error) => {
      if (requested === DEFAULT_PRODUCT_SLUG) throw error;
      console.warn(`Landing product "${requested}" not found, using ${DEFAULT_PRODUCT_SLUG}`);
      return getProductBySlug(DEFAULT_PRODUCT_SLUG);
    });
    const [product, advanceConfig] = await Promise.all([productPromise, getCodAdvanceConfig()]);

    const priceMinor = toMinor(product.price);
    if (priceMinor <= 0) return null;

    const mrpMinor = Math.max(toMinor(product.regular_price), priceMinor);

    return {
      productId: product.id,
      currency: "INR",
      priceMinor,
      mrpMinor,
      advanceMinor: isFullCodLanding(landingSlug) ? 0 : computeAdvanceMinor(advanceConfig, priceMinor),
    };
  } catch (error) {
    console.warn("Failed to load landing page pricing:", error);
    return null;
  }
}
