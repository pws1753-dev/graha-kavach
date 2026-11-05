<?php
/**
 * WooCommerce events -> WhatsApp templates.
 *
 * Every handler only decides *what* to send and defers the work to a
 * background job (so meta written in the same request, such as the COD advance
 * or tracking numbers, is always committed before it is read).
 *
 * @package GrahaKavach\WhatsApp
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class GKWA_Events {

	private const JOB_WELCOME  = 'gkwa_job_welcome';
	private const JOB_PAID     = 'gkwa_job_paid';
	private const JOB_SHIPMENT = 'gkwa_job_shipment';

	public static function init(): void {
		// Signup. The REST hook fires after billing details are saved, which is
		// where the Next.js storefront puts the phone number.
		add_action( 'woocommerce_rest_insert_customer', array( __CLASS__, 'on_rest_customer' ), 20, 3 );
		add_action( 'woocommerce_created_customer', array( __CLASS__, 'on_created_customer' ), 20, 1 );

		add_action( 'woocommerce_order_status_processing', array( __CLASS__, 'on_paid' ), 20, 1 );
		add_action( 'woocommerce_order_status_completed', array( __CLASS__, 'on_completed' ), 20, 1 );
		add_action( 'woocommerce_order_status_partial-shipped', array( __CLASS__, 'on_shipped' ), 20, 1 );
		add_action( 'woocommerce_order_status_delivered', array( __CLASS__, 'on_delivered' ), 20, 1 );
		add_action( 'admin_init', array( __CLASS__, 'reset_wrong_delivered' ) );
		add_action( 'woocommerce_order_status_failed', array( __CLASS__, 'on_failed' ), 20, 1 );
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'on_status_changed' ), 20, 3 );
		add_action( 'woocommerce_order_refunded', array( __CLASS__, 'on_refunded' ), 20, 2 );
		add_action( 'woocommerce_update_order', array( __CLASS__, 'on_order_saved' ), 20, 1 );

		add_action( self::JOB_WELCOME, array( __CLASS__, 'job_welcome' ), 10, 1 );
		add_action( self::JOB_PAID, array( __CLASS__, 'job_paid' ), 10, 1 );
		add_action( self::JOB_SHIPMENT, array( __CLASS__, 'job_shipment' ), 10, 1 );
	}

	/* ------------------------------------------------------------ helpers */

	/**
	 * @param array<int,mixed> $args Job arguments.
	 */
	private static function defer( string $hook, array $args, int $delay ): void {
		$when = time() + max( 5, $delay );

		if ( function_exists( 'as_schedule_single_action' ) ) {
			if ( function_exists( 'as_has_scheduled_action' ) && as_has_scheduled_action( $hook, $args, 'gkwa' ) ) {
				return;
			}
			as_schedule_single_action( $when, $hook, $args, 'gkwa' );
			return;
		}

		if ( ! wp_next_scheduled( $hook, $args ) ) {
			wp_schedule_single_event( $when, $hook, $args );
		}
	}

	/** @var array<string,bool> */
	private static $shutdown_jobs = array();

	/**
	 * Run a job once, at the very end of this request. By then every meta write
	 * (COD advance, tracking numbers) is committed, and the customer's message
	 * goes out within a second or two instead of waiting for the scheduler.
	 */
	private static function at_shutdown( callable $job, int $id ): void {
		$key = ( is_array( $job ) ? (string) $job[1] : 'job' ) . ':' . $id;
		if ( isset( self::$shutdown_jobs[ $key ] ) ) {
			return;
		}
		self::$shutdown_jobs[ $key ] = true;

		add_action(
			'shutdown',
			static function () use ( $job, $id ): void {
				call_user_func( $job, $id );
			},
			0
		);
	}

	/**
	 * Claim an order+event pair exactly once. Returns false if already claimed.
	 */
	private static function claim( WC_Order $order, string $key ): bool {
		$meta = '_gkwa_q_' . $key;
		if ( $order->get_meta( $meta ) ) {
			return false;
		}

		$order->update_meta_data( $meta, time() );
		$order->save_meta_data();

		return true;
	}

	private static function order_phone( WC_Order $order ): string {
		$phone = $order->get_billing_phone();

		if ( '' === GKWA_Client::normalize_phone( $phone ) && method_exists( $order, 'get_shipping_phone' ) ) {
			$phone = $order->get_shipping_phone();
		}
		if ( '' === GKWA_Client::normalize_phone( $phone ) && $order->get_customer_id() ) {
			$phone = (string) get_user_meta( $order->get_customer_id(), 'billing_phone', true );
		}

		return (string) $phone;
	}

	private static function first_name( WC_Order $order ): string {
		$name = trim( $order->get_billing_first_name() );

		return '' !== $name ? $name : 'Customer';
	}

	private static function money( $amount ): string {
		return number_format( (float) $amount, 2, '.', ',' );
	}

	/**
	 * @return array<string,mixed>
	 */
	private static function ctx( WC_Order $order, array $extra = array() ): array {
		return array_merge(
			array(
				'order_id' => $order->get_id(),
				'user_id'  => $order->get_customer_id(),
			),
			$extra
		);
	}

	/* ------------------------------------------------------------- signup */

	public static function on_rest_customer( $user, $request, $creating ): void {
		if ( $creating && $user instanceof WP_User ) {
			self::at_shutdown( array( __CLASS__, 'job_welcome' ), (int) $user->ID );
		}
	}

	public static function on_created_customer( $customer_id ): void {
		self::defer( self::JOB_WELCOME, array( (int) $customer_id ), 60 );
	}

	public static function job_welcome( $user_id ): void {
		$user_id = (int) $user_id;
		if ( $user_id <= 0 || get_user_meta( $user_id, '_gkwa_welcome', true ) ) {
			return;
		}

		$phone = (string) get_user_meta( $user_id, 'billing_phone', true );
		if ( '' === GKWA_Client::normalize_phone( $phone ) ) {
			// Phone not saved (yet, or the customer did not give one). Leave the
			// flag unset so the later hook can still pick it up.
			return;
		}

		update_user_meta( $user_id, '_gkwa_welcome', time() );

		$name = trim( (string) get_user_meta( $user_id, 'first_name', true ) );
		GKWA_Sender::queue(
			'gk_welcome',
			$phone,
			array( 'customer_name' => '' !== $name ? $name : 'there' ),
			array( 'user_id' => $user_id )
		);
	}

	/* ----------------------------------------------------- payment & ship */

	public static function on_paid( $order_id ): void {
		self::at_shutdown( array( __CLASS__, 'job_paid' ), (int) $order_id );
	}

	/**
	 * On this shop "Shipped" is WooCommerce's `completed` status under a new name
	 * (the shipment-tracking plugin renames it), so completed means the parcel has
	 * left, not that it arrived. The delivered message belongs to the Delivered status.
	 */
	public static function on_completed( $order_id ): void {
		// An order marked Shipped straight from Pending/On hold was never "paid"
		// through the processing hook (e.g. manual COD), so confirm it as well.
		self::at_shutdown( array( __CLASS__, 'job_paid' ), (int) $order_id );
		self::on_shipped( $order_id );
	}

	/** Shipped / Partially Shipped: send the shipped message with courier and tracking number. */
	public static function on_shipped( $order_id ): void {
		self::at_shutdown( array( __CLASS__, 'job_shipment' ), (int) $order_id );
	}

	/** Delivered: the only status that sends the delivered message. */
	public static function on_delivered( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( $order && self::claim( $order, 'delivered' ) ) {
			GKWA_Sender::queue(
				'gk_order_delivered',
				self::order_phone( $order ),
				array(
					'customer_name' => self::first_name( $order ),
					'order_id'      => $order->get_order_number(),
				),
				self::ctx( $order )
			);
		}
	}

	/**
	 * Earlier versions sent "delivered" when an order was marked Shipped and
	 * recorded it as done, which would block the real message later. Clear that
	 * flag on orders that have not reached Delivered. Runs once.
	 */
	public static function reset_wrong_delivered(): void {
		if ( get_option( 'gkwa_delivered_reset_v1' ) || ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		update_option( 'gkwa_delivered_reset_v1', 1 );

		$orders = wc_get_orders(
			array(
				'limit'      => 500,
				'status'     => array( 'completed', 'processing', 'partial-shipped' ),
				'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					array(
						'key'     => '_gkwa_q_delivered',
						'compare' => 'EXISTS',
					),
				),
			)
		);
		foreach ( $orders as $order ) {
			$order->delete_meta_data( '_gkwa_q_delivered' );
			$order->save_meta_data();
		}
	}

	public static function job_paid( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order || ! in_array( $order->get_status(), array( 'processing', 'completed' ), true ) ) {
			return;
		}

		$phone   = self::order_phone( $order );
		$name    = self::first_name( $order );
		$number  = $order->get_order_number();
		$total   = (float) $order->get_total();
		$is_cod  = 'cod' === $order->get_payment_method();
		$advance = (float) $order->get_meta( '_cod_advance_paid' );
		$delay   = max( 0, (int) GKWA_Config::get( 'processing_delay' ) ) * MINUTE_IN_SECONDS;

		if ( $is_cod && $advance > 0 ) {
			if ( self::claim( $order, 'payment' ) ) {
				GKWA_Sender::queue(
					'gk_cod_advance_received',
					$phone,
					array(
						'customer_name' => $name,
						'order_id'      => $number,
						'advance'       => self::money( $advance ),
						'balance'       => self::money( max( 0, $total - $advance ) ),
					),
					self::ctx( $order )
				);
			}
		} elseif ( ! $is_cod ) {
			if ( self::claim( $order, 'payment' ) ) {
				GKWA_Sender::queue(
					'gk_payment_success',
					$phone,
					array(
						'customer_name' => $name,
						'amount'        => self::money( $total ),
						'order_id'      => $number,
					),
					self::ctx( $order )
				);
			}
		} else {
			// COD with no advance: there is no payment message, so the processing
			// message doubles as the order confirmation and goes out at once.
			$delay = 0;
		}

		if ( self::claim( $order, 'processing' ) ) {
			GKWA_Sender::queue(
				'gk_order_processing',
				$phone,
				array(
					'customer_name' => $name,
					'order_id'      => $number,
				),
				self::ctx( $order, array( 'delay' => $delay ) )
			);
		}

		if ( self::claim( $order, 'admin' ) ) {
			$admin = (string) GKWA_Config::get( 'admin_phone' );
			if ( '' !== $admin ) {
				GKWA_Sender::queue(
					'gk_admin_new_order',
					$admin,
					array(
						'order_id'       => $number,
						'customer_name'  => trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
						'customer_phone' => GKWA_Client::normalize_phone( $phone ),
						'amount'         => self::money( $total ),
						'payment_method' => $order->get_payment_method_title(),
					),
					array( 'order_id' => $order->get_id() )
				);
			}
		}

		// The customer has ordered: stop any abandoned-cart reminders.
		GKWA_Carts::mark_converted( GKWA_Client::normalize_phone( $phone ) );
	}

	public static function on_failed( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( $order && self::claim( $order, 'failed' ) ) {
			GKWA_Sender::queue(
				'gk_payment_failed',
				self::order_phone( $order ),
				array(
					'customer_name' => self::first_name( $order ),
					'order_id'      => $order->get_order_number(),
				),
				self::ctx( $order )
			);
		}
	}

	public static function on_status_changed( $order_id, $from, $to ): void {
		// Only a confirmed order counts. Unpaid orders that WooCommerce cancels on
		// its own after the hold-stock timeout must not message the customer.
		if ( 'cancelled' !== $to || ! in_array( $from, array( 'processing', 'on-hold' ), true ) ) {
			return;
		}

		$order = wc_get_order( (int) $order_id );
		if ( ! $order || ! $order->get_meta( '_gkwa_q_processing' ) ) {
			return;
		}

		if ( self::claim( $order, 'cancelled' ) ) {
			GKWA_Sender::queue(
				'gk_order_cancelled',
				self::order_phone( $order ),
				array(
					'customer_name' => self::first_name( $order ),
					'order_id'      => $order->get_order_number(),
				),
				self::ctx( $order )
			);
		}
	}

	public static function on_refunded( $order_id, $refund_id ): void {
		$order  = wc_get_order( (int) $order_id );
		$refund = wc_get_order( (int) $refund_id );
		if ( ! $order || ! $refund ) {
			return;
		}

		if ( self::claim( $order, 'refund_' . (int) $refund_id ) ) {
			GKWA_Sender::queue(
				'gk_order_refunded',
				self::order_phone( $order ),
				array(
					'customer_name' => self::first_name( $order ),
					'amount'        => self::money( abs( (float) $refund->get_amount() ) ),
					'order_id'      => $order->get_order_number(),
				),
				self::ctx( $order )
			);
		}
	}

	/* ------------------------------------------------------------ shipping */

	/**
	 * Advanced Shipment Tracking stores items in _wc_shipment_tracking_items.
	 * Cheap check on every order save; the job does the real work.
	 */
	public static function on_order_saved( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order ) {
			return;
		}

		$items = $order->get_meta( '_wc_shipment_tracking_items' );
		if ( ! is_array( $items ) || empty( $items ) ) {
			return;
		}

		$notified = $order->get_meta( '_gkwa_shipped_ids' );
		if ( count( $items ) > ( is_array( $notified ) ? count( $notified ) : 0 ) ) {
			self::at_shutdown( array( __CLASS__, 'job_shipment' ), (int) $order_id );
		}
	}

	public static function job_shipment( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order || in_array( $order->get_status(), array( 'cancelled', 'refunded', 'failed', 'pending' ), true ) ) {
			return;
		}

		$items = $order->get_meta( '_wc_shipment_tracking_items' );
		if ( ! is_array( $items ) ) {
			return;
		}

		$notified = $order->get_meta( '_gkwa_shipped_ids' );
		$notified = is_array( $notified ) ? $notified : array();
		$sent     = 0;

		foreach ( $items as $item ) {
			$id = (string) ( $item['tracking_id'] ?? md5( wp_json_encode( $item ) ) );
			if ( in_array( $id, $notified, true ) ) {
				continue;
			}
			$notified[] = $id;

			if ( $sent >= 3 ) {
				continue;
			}
			++$sent;

			$courier = (string) ( $item['formatted_tracking_provider'] ?? $item['tracking_provider'] ?? '' );
			$courier = '' !== trim( $courier ) ? ucwords( str_replace( array( '-', '_' ), ' ', $courier ) ) : 'our delivery partner';

			GKWA_Sender::queue(
				'gk_order_shipped',
				self::order_phone( $order ),
				array(
					'customer_name'   => self::first_name( $order ),
					'order_id'        => $order->get_order_number(),
					'courier'         => $courier,
					'tracking_number' => (string) ( $item['tracking_number'] ?? '' ),
					'eta'             => (string) GKWA_Config::get( 'delivery_eta' ),
				),
				self::ctx( $order )
			);
		}

		$order->update_meta_data( '_gkwa_shipped_ids', $notified );
		$order->save_meta_data();
	}
}
