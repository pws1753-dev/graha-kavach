<?php
/**
 * Keeps GST inside the price for orders created by the storefront.
 *
 * The shop enters prices inclusive of tax (WooCommerce > Settings > Tax). An
 * order created through the REST API takes the product price as the line total
 * and then adds tax on top, so a Rs 2,499 kit shipped to a taxable area became
 * Rs 2,948.82. This hook rewrites each new storefront order so the tax is taken
 * out of the price instead: the customer pays the advertised price and the
 * invoice still shows the GST inside it.
 *
 * @package GrahaKavach\HeadlessCore
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tax-inclusive totals for storefront (Next.js) orders.
 */
final class GK_Order_Tax {

	/**
	 * Hook into order creation over REST.
	 */
	public static function init(): void {
		add_action( 'woocommerce_rest_insert_shop_order_object', array( __CLASS__, 'keep_prices_inclusive' ), 20, 3 );
	}

	/**
	 * Re-split each line into price-without-tax plus tax, so the total equals the
	 * sum of the product prices.
	 *
	 * @param mixed $order    The new order.
	 * @param mixed $request  The REST request.
	 * @param bool  $creating True on create, false on update.
	 */
	public static function keep_prices_inclusive( $order, $request, $creating ): void {
		unset( $request );

		if ( ! $creating || ! $order instanceof WC_Order ) {
			return;
		}
		if ( ! function_exists( 'wc_tax_enabled' ) || ! wc_tax_enabled() || ! wc_prices_include_tax() ) {
			return;
		}
		if ( 0 !== strpos( (string) $order->get_meta( '_source' ), 'nextjs' ) ) {
			return;
		}
		// A coupon changes how the discount is shared out; leave those orders to WooCommerce.
		if ( $order->get_coupon_codes() ) {
			return;
		}

		try {
			$location = $order->get_tax_location();
			$decimals = wc_get_price_decimals();
			$expected = 0.0;

			foreach ( $order->get_items( 'line_item' ) as $item ) {
				if ( ! $item instanceof WC_Order_Item_Product ) {
					continue;
				}
				$product = $item->get_product();
				if ( ! $product ) {
					return;
				}

				$gross  = round( (float) $product->get_price() * max( 1, (int) $item->get_quantity() ), $decimals );
				$rates  = WC_Tax::find_rates( array_merge( $location, array( 'tax_class' => $item->get_tax_class() ) ) );
				$taxes  = 'taxable' === $product->get_tax_status() ? WC_Tax::calc_inclusive_tax( $gross, $rates ) : array();
				$net    = round( $gross - array_sum( $taxes ), $decimals );

				$item->set_subtotal( $net );
				$item->set_total( $net );
				$item->set_taxes(
					array(
						'subtotal' => $taxes,
						'total'    => $taxes,
					)
				);
				$item->save();

				$expected += $gross;
			}

			if ( $expected <= 0 ) {
				return;
			}

			$order->update_taxes();
			$order->calculate_totals( false );

			if ( abs( (float) $order->get_total() - ( $expected + (float) $order->get_shipping_total() + (float) $order->get_shipping_tax() ) ) > 0.05 ) {
				$order->add_order_note( 'Graha Kavach: total differs from the product price; please check the tax settings.' );
			}
		} catch ( Throwable $error ) {
			// Never block an order over a tax display problem.
			error_log( 'GK_Order_Tax: ' . $error->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}
	}
}
