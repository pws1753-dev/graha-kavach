import "server-only";

import { decimalToMinorUnits } from "./adapters";
import { wooRequest } from "./client";
import {
  wooCouponSchema,
  wooProductSchema,
  type WooCoupon,
  type WooProduct,
} from "./types";
import type {
  CartItem,
  ValidatedCart,
  ValidatedCoupon,
  ValidatedLineItem,
} from "@/lib/cart/types";

export async function validateCartServer(
  items: CartItem[],
  couponCode?: string,
): Promise<ValidatedCart> {
  if (!items.length) {
    return {
      items: [],
      subtotalMinor: 0,
      discountMinor: 0,
      shippingMinor: 0,
      shippingNotice: "Free Delivery",
      taxMinor: 0,
      taxNotice: "Taxes included / Not applicable",
      totalMinor: 0,
      currency: "INR",
      hasErrors: false,
      errorMessages: [],
    };
  }

  const validatedItems: ValidatedLineItem[] = [];
  const errorMessages: string[] = [];
  let subtotalMinor = 0;

  // Validate each product against live WooCommerce REST API
  for (const item of items) {
    try {
      const product = await wooRequest<WooProduct>({
        path: `/products/${item.productId}`,
        schema: wooProductSchema,
        revalidate: false,
      });

      if (product.status !== "publish") {
        validatedItems.push({
          productId: item.productId,
          name: product.name,
          slug: product.slug,
          sku: product.sku || "",
          image: product.images[0]?.src || "/images/placeholder.png",
          unitPriceMinor: 0,
          quantity: item.quantity,
          lineSubtotalMinor: 0,
          lineTotalMinor: 0,
          stockStatus: "outofstock",
          stockQuantity: 0,
          error: "This item is currently unavailable.",
        });
        errorMessages.push(`"${product.name}" is no longer available.`);
        continue;
      }

      const unitPriceMinor = decimalToMinorUnits(product.price) ?? 0;
      const regularPriceMinor = decimalToMinorUnits(product.regular_price) ?? undefined;

      // Validate Stock
      let itemError: string | undefined;
      const isOutOfStock = product.stock_status === "outofstock";
      const availableQty = product.stock_quantity;

      if (isOutOfStock) {
        itemError = "Item is out of stock.";
        errorMessages.push(`"${product.name}" is out of stock.`);
      } else if (
        product.stock_status === "instock" &&
        availableQty !== null &&
        availableQty !== undefined &&
        item.quantity > availableQty
      ) {
        itemError = `Only ${availableQty} in stock.`;
        errorMessages.push(
          `Only ${availableQty} units of "${product.name}" are available.`,
        );
      }

      const lineSubtotalMinor = unitPriceMinor * item.quantity;
      if (!isOutOfStock) {
        subtotalMinor += lineSubtotalMinor;
      }

      validatedItems.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku || "",
        image: product.images[0]?.src || "/images/placeholder.png",
        unitPriceMinor,
        regularPriceMinor,
        quantity: item.quantity,
        lineSubtotalMinor,
        lineTotalMinor: lineSubtotalMinor,
        stockStatus: product.stock_status,
        stockQuantity: product.stock_quantity ?? null,
        error: itemError,
      });
    } catch {
      validatedItems.push({
        productId: item.productId,
        name: "Unknown Product",
        slug: "",
        sku: "",
        image: "/images/placeholder.png",
        unitPriceMinor: 0,
        quantity: item.quantity,
        lineSubtotalMinor: 0,
        lineTotalMinor: 0,
        stockStatus: "outofstock",
        stockQuantity: 0,
        error: "Product could not be retrieved.",
      });
      errorMessages.push(`Product #${item.productId} could not be validated.`);
    }
  }

  // Validate Coupon if provided
  let validatedCoupon: ValidatedCoupon | undefined;
  let discountMinor = 0;

  if (couponCode && couponCode.trim()) {
    const cleanCode = couponCode.trim();
    try {
      const coupons = await wooRequest<WooCoupon[]>({
        path: "/coupons",
        query: { code: cleanCode },
        revalidate: false,
      });

      const coupon = coupons.find(
        (c) => c.code.toLowerCase() === cleanCode.toLowerCase(),
      );

      if (!coupon) {
        errorMessages.push(`Coupon code "${cleanCode}" is invalid.`);
      } else {
        const parsedCoupon = wooCouponSchema.safeParse(coupon);
        if (!parsedCoupon.success) {
          errorMessages.push(`Coupon "${cleanCode}" has an invalid configuration.`);
        } else {
          // Check expiry
          const isExpired =
            coupon.date_expires &&
            new Date(coupon.date_expires).getTime() < Date.now();

          if (isExpired) {
            errorMessages.push(`Coupon "${cleanCode}" has expired.`);
          } else {
            const amountNum = parseFloat(coupon.amount);
            if (coupon.discount_type === "percent") {
              discountMinor = Math.round((subtotalMinor * amountNum) / 100);
            } else if (
              coupon.discount_type === "fixed_cart" ||
              coupon.discount_type === "fixed_product"
            ) {
              discountMinor = Math.min(subtotalMinor, Math.round(amountNum * 100));
            }

            validatedCoupon = {
              code: coupon.code,
              discountType: coupon.discount_type,
              amount: coupon.amount,
              discountMinor,
              description: coupon.discount_type === "percent" ? `${amountNum}% off` : `₹${amountNum} off`,
            };
          }
        }
      }
    } catch {
      errorMessages.push(`Could not validate coupon "${cleanCode}".`);
    }
  }

  // Shipping from WooCommerce config:
  // Currently zone 0 has 0 methods configured. Default to 0 with standard notice.
  const shippingMinor = 0;
  const shippingNotice = "Free Standard Shipping";

  // Product prices already include GST. taxMinor is additional tax, not the
  // included GST breakdown recorded by WooCommerce on the final order.
  const taxMinor = 0;
  const taxNotice = "Inclusive of all taxes";

  const totalMinor = Math.max(0, subtotalMinor - discountMinor + shippingMinor + taxMinor);

  return {
    items: validatedItems,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    shippingNotice,
    taxMinor,
    taxNotice,
    totalMinor,
    currency: "INR",
    coupon: validatedCoupon,
    hasErrors: errorMessages.length > 0,
    errorMessages,
  };
}
