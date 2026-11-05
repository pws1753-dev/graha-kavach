import "server-only";

import { wooRequest } from "@/lib/woocommerce/client";

type OrderLike = {
  id: number;
  date_created: string;
  customer_id?: number;
  billing?: { email?: string; phone?: string };
};

export function lastTenDigits(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "").slice(-10);
}

/** True when the order was placed by this account, as a member or as a guest with the same email or phone. */
export function orderBelongsTo(
  order: OrderLike,
  account: { customerId: number; email: string; phone?: string },
): boolean {
  if (order.customer_id && order.customer_id === account.customerId) return true;
  const email = (order.billing?.email ?? "").trim().toLowerCase();
  if (email && email === account.email.trim().toLowerCase()) return true;
  const phone = lastTenDigits(order.billing?.phone);
  return phone.length === 10 && phone === lastTenDigits(account.phone);
}

/** The phone saved on the customer's WooCommerce profile, or "" when there is none. */
export async function getAccountPhone(customerId: number): Promise<string> {
  try {
    const customer = await wooRequest<{ billing?: { phone?: string } }>({
      path: `/customers/${customerId}`,
      revalidate: false,
    });
    return customer.billing?.phone ?? "";
  } catch {
    return "";
  }
}

/**
 * Every order that belongs to the account: the ones placed while logged in plus
 * guest orders (such as ad-page bookings) made with the same email or phone, so
 * the customer sees them without having to enter anything.
 */
export async function listAccountOrders<T extends OrderLike>(account: {
  customerId: number;
  email: string;
}): Promise<T[]> {
  const phone = await getAccountPhone(account.customerId);
  const withPhone = { ...account, phone };

  const searches = [account.email, lastTenDigits(phone)].filter((term) => term.length >= 5);
  const lookups = [
    wooRequest<T[]>({ path: "/orders", query: { customer: account.customerId, per_page: 30 }, revalidate: false }).catch(() => [] as T[]),
    ...searches.map((term) =>
      wooRequest<T[]>({ path: "/orders", query: { search: term, per_page: 30 }, revalidate: false }).catch(() => [] as T[]),
    ),
  ];

  const byId = new Map<number, T>();
  for (const [index, batch] of (await Promise.all(lookups)).entries()) {
    for (const order of batch) {
      // The first lookup is already filtered by Woo; search results are matched exactly.
      if (index === 0 || orderBelongsTo(order, withPhone)) byId.set(order.id, order);
    }
  }
  return [...byId.values()].sort((a, b) => b.date_created.localeCompare(a.date_created));
}
