<?php
/** Tax-inclusive prices for storefront orders. */
declare( strict_types = 1 );
if ( ! defined( 'ABSPATH' ) ) { exit; }
final class GK_Order_Tax {
 public static function init(): void {
  add_filter( 'woocommerce_rest_pre_insert_shop_order_object', array( __CLASS__, 'keep_prices_inclusive' ), 20, 3 );
  add_filter( 'wc_order_statuses', array( __CLASS__, 'checkout_status' ) );
  add_filter( 'woocommerce_valid_order_statuses_for_payment', array( __CLASS__, 'payable_statuses' ), 10, 2 );
  add_filter( 'woocommerce_valid_order_statuses_for_payment_complete', array( __CLASS__, 'payable_statuses' ), 10, 2 );
  add_filter( 'woocommerce_rest_prepare_shop_order_object', array( __CLASS__, 'payment_status_response' ), 20, 3 );
 }
 /** Allow REST clients to use WooCommerce's existing, search-excluded draft status. */
 public static function checkout_status( $statuses ): array {
  $statuses['wc-checkout-draft'] = __( 'Unpaid checkout attempts', 'grahakavach-headless-core' );
  return $statuses;
 }
 /** Keep the hosted payment-page fallback and native gateway callbacks working. */
 public static function payable_statuses( $statuses, $order ): array {
  if ( $order instanceof WC_Order && 0 === strpos( (string) $order->get_meta( '_source' ), 'nextjs' ) ) {
   $statuses[] = 'checkout-draft';
  }
  return array_values( array_unique( $statuses ) );
 }
 /** Older storefront builds expect pending when verifying an individual unpaid order. */
 public static function payment_status_response( $response, $order, $request ) {
  if ( 'GET' === $request->get_method() && (int) $request['id'] === $order->get_id() && 'checkout-draft' === $order->get_status() && 0 === strpos( (string) $order->get_meta( '_source' ), 'nextjs' ) ) {
   $data = $response->get_data();
   $data['status'] = 'pending';
   $response->set_data( $data );
  }
  return $response;
 }
 public static function keep_prices_inclusive( $order, $request, $creating ) {
  if ( ! $creating || ! $order instanceof WC_Order || 0 !== strpos( (string) $order->get_meta( '_source' ), 'nextjs' ) ) { return $order; }
  // Protect existing deployed storefront builds too: they still submit pending.
  if ( 'pending' === $request['status'] && ( (int) $order->get_meta( '_cod_advance_minor' ) > 0 || ! in_array( $order->get_payment_method(), array( 'cod', 'bacs', 'cheque' ), true ) ) ) {
   $request['status'] = 'checkout-draft';
   $order->set_status( 'checkout-draft' );
  }
  if ( ! wc_tax_enabled() || ! wc_prices_include_tax() ) { return $order; }
  try {
   // get_tax_location() is protected. Use the public wrapper where available.
   if ( is_callable( array( $order, 'get_taxable_location' ) ) ) {
    $location = $order->get_taxable_location();
   } else {
    $customer = new WC_Customer();
    $customer->set_billing_country( $order->get_billing_country() );
    $customer->set_billing_state( $order->get_billing_state() );
    $customer->set_billing_postcode( $order->get_billing_postcode() );
    $customer->set_billing_city( $order->get_billing_city() );
    $customer->set_shipping_country( $order->get_shipping_country() );
    $customer->set_shipping_state( $order->get_shipping_state() );
    $customer->set_shipping_postcode( $order->get_shipping_postcode() );
    $customer->set_shipping_city( $order->get_shipping_city() );
    $location = array_combine( array( 'country', 'state', 'postcode', 'city' ), $customer->get_taxable_address() );
   }
   foreach ( $order->get_items( 'line_item' ) as $item ) {
    if ( ! $item instanceof WC_Order_Item_Product ) { continue; }
    $product = $item->get_product();
    if ( ! $product ) { throw new RuntimeException( 'Product unavailable during tax calculation.' ); }
    $gross = (float) $product->get_price() * (int) $item->get_quantity();
    $rates = WC_Tax::find_rates( array_merge( $location, array( 'tax_class' => $item->get_tax_class() ) ) );
    $taxes = 'taxable' === $product->get_tax_status() ? WC_Tax::calc_inclusive_tax( $gross, $rates ) : array();
    // Let WooCommerce round taxes and apply coupons after converting the gross price.
    $net = $gross - array_sum( $taxes );
    $item->set_subtotal( $net );
    $item->set_total( $net );
    $item->set_taxes( array( 'subtotal' => $taxes, 'total' => $taxes ) );
   }
   $order->set_prices_include_tax( true );
   return $order;
  } catch ( Throwable $error ) {
   wc_get_logger()->error( $error->getMessage(), array( 'source' => 'grahakavach-tax' ) );
   return new WP_Error( 'gk_tax_calculation_failed', 'Could not calculate the tax-inclusive order price. Please retry.', array( 'status' => 503 ) );
  }
 }
}
