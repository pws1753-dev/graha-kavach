<?php
/** Recover captured storefront payments if the customer closes the browser. */
declare( strict_types = 1 );
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class GK_Payment_Reconciliation {
	public static function init(): void {
		add_filter( 'cron_schedules', array( __CLASS__, 'schedules' ) );
		add_action( 'gk_reconcile_payments', array( __CLASS__, 'run' ) );
		if ( ! wp_next_scheduled( 'gk_reconcile_payments' ) ) {
			wp_schedule_event( time() + 300, 'gk_five_minutes', 'gk_reconcile_payments' );
		}
	}
	public static function schedules( $schedules ): array {
		$schedules['gk_five_minutes'] = array( 'interval' => 300, 'display' => 'Every five minutes (payment reconciliation)' );
		return $schedules;
	}
	public static function run(): void {
		if ( ! function_exists( 'wc_get_orders' ) || get_transient( 'gk_payment_reconciliation_running' ) ) { return; }
		$settings = get_option( 'woocommerce_razorpay_settings', array() );
		if ( empty( $settings['key_id'] ) || empty( $settings['key_secret'] ) ) { return; }
		set_transient( 'gk_payment_reconciliation_running', 1, 240 );
		try {
			$orders = wc_get_orders( array( 'status' => array( 'checkout-draft', 'pending', 'on-hold' ), 'date_created' => '>' . ( time() - 2 * DAY_IN_SECONDS ), 'limit' => 20, 'orderby' => 'date', 'order' => 'DESC' ) );
			foreach ( $orders as $order ) {
				if ( 0 !== strpos( (string) $order->get_meta( '_source' ), 'nextjs' ) || $order->get_meta( '_gk_qa_test' ) ) { continue; }
				$gateway_id = (string) $order->get_meta( 'razorpay_order_id' );
				if ( ! preg_match( '/^order_[a-zA-Z0-9]+$/', $gateway_id ) ) { continue; }
				$headers = array( 'Authorization' => 'Basic ' . base64_encode( $settings['key_id'] . ':' . $settings['key_secret'] ) );
				$remote = self::fetch( 'orders/' . rawurlencode( $gateway_id ), $headers );
				$total = (int) round( (float) $order->get_total() * 100 );
				$advance = (int) $order->get_meta( '_cod_advance_minor' );
				$is_advance = 'cod' === $order->get_payment_method() && $advance > 0;
				$expected = $is_advance ? min( $advance, $total ) : $total;
				if ( ! $remote || (string) ( $remote['receipt'] ?? '' ) !== (string) $order->get_id() || (int) ( $remote['amount'] ?? 0 ) !== $expected || (string) ( $remote['currency'] ?? '' ) !== $order->get_currency() ) { continue; }
				$payments = self::fetch( 'orders/' . rawurlencode( $gateway_id ) . '/payments', $headers );
				foreach ( $payments['items'] ?? array() as $payment ) {
					if ( 'captured' !== ( $payment['status'] ?? '' ) || $gateway_id !== ( $payment['order_id'] ?? '' ) || (int) ( $payment['amount'] ?? 0 ) !== $expected || $order->get_currency() !== ( $payment['currency'] ?? '' ) || (int) ( $payment['amount_refunded'] ?? 0 ) > 0 ) { continue; }
					// The browser may have confirmed it while the gateway request was in flight.
					$current = wc_get_order( $order->get_id() );
					if ( ! $current || ! in_array( $current->get_status(), array( 'checkout-draft', 'pending', 'on-hold' ), true ) ) { break; }
					$current->set_transaction_id( sanitize_text_field( $payment['id'] ) );
					$current->update_meta_data( 'razorpay_payment_id', sanitize_text_field( $payment['id'] ) );
					$current->update_meta_data( '_gk_payment_reconciled', gmdate( 'c' ) );
					if ( $is_advance ) {
						$current->update_meta_data( '_cod_advance_paid', wc_format_decimal( $expected / 100, 2 ) );
						$current->set_status( 'processing' );
						$current->save();
					} else {
						$current->save();
						$current->payment_complete( sanitize_text_field( $payment['id'] ) );
					}
					$current->add_order_note( 'Captured Razorpay payment verified automatically after a missing browser confirmation. Do not collect this payment again.' );
					// Reuse the verifier and its stable event ID for recovered purchases.
					wp_remote_post( 'https://grahakavach.in/api/checkout/razorpay/verify', array(
						'timeout' => 8, 'redirection' => 0,
						'headers' => array( 'Content-Type' => 'application/json' ),
						'body' => wp_json_encode( array(
							'wooOrderId' => $current->get_id(), 'orderKey' => $current->get_order_key(),
							'razorpay_order_id' => $gateway_id, 'razorpay_payment_id' => $payment['id'],
							'razorpay_signature' => hash_hmac( 'sha256', $gateway_id . '|' . $payment['id'], $settings['key_secret'] ),
						) ),
					) );
					break;
				}
			}
		} finally {
			delete_transient( 'gk_payment_reconciliation_running' );
		}
	}
	private static function fetch( string $path, array $headers ): ?array {
		$response = wp_remote_get( 'https://api.razorpay.com/v1/' . $path, array( 'headers' => $headers, 'timeout' => 8 ) );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) { return null; }
		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		return is_array( $data ) ? $data : null;
	}
}
