<?php
/**
 * Keeps every open shipment up to date: when a tracking number is added, every
 * four hours for parcels still on the way, and on demand from the order screen.
 *
 * @package GrahaKavach\Tracking
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Scheduled refresh.
 */
final class GKT_Sync {

	public const CRON  = 'gkt_sync_all';
	public const ONE   = 'gkt_refresh_order';
	private const PAGE = 60;

	public static function init(): void {
		add_filter( 'cron_schedules', array( __CLASS__, 'schedules' ) ); // phpcs:ignore WordPress.WP.CronInterval.CronSchedulesInterval
		add_action( self::CRON, array( __CLASS__, 'run' ) );
		add_action( self::ONE, array( __CLASS__, 'refresh_order' ), 10, 1 );
		add_action( 'woocommerce_update_order', array( __CLASS__, 'on_saved' ), 30, 1 );
		add_action( 'init', array( __CLASS__, 'ensure_scheduled' ) );
	}

	/**
	 * @param array<string,mixed> $schedules Existing schedules.
	 * @return array<string,mixed>
	 */
	public static function schedules( $schedules ) {
		$schedules['gkt_four_hours'] = array(
			'interval' => 4 * HOUR_IN_SECONDS,
			'display'  => 'Every 4 hours',
		);
		return $schedules;
	}

	public static function ensure_scheduled(): void {
		if ( ! wp_next_scheduled( self::CRON ) ) {
			wp_schedule_event( time() + 300, 'gkt_four_hours', self::CRON );
		}
	}

	/** A tracking number was added by any means: fetch its status shortly. */
	public static function on_saved( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order ) {
			return;
		}
		// Only numbers of live-capable couriers that have never been looked up count.
		$known   = GKT_Store::statuses( $order );
		$pending = false;
		foreach ( GKT_Store::items( $order ) as $item ) {
			$live = ! empty( GKT_Couriers::all()[ (string) ( $item['tracking_provider'] ?? '' ) ]['live'] );
			if ( $live && ! isset( $known[ (string) ( $item['tracking_number'] ?? '' ) ] ) ) {
				$pending = true;
				break;
			}
		}
		if ( $pending && ! wp_next_scheduled( self::ONE, array( (int) $order_id ) ) ) {
			wp_schedule_single_event( time() + 30, self::ONE, array( (int) $order_id ) );
		}
	}

	/** The four-hourly pass over parcels that are not delivered yet. */
	public static function run(): void {
		$orders = wc_get_orders(
			array(
				'limit'        => self::PAGE,
				'orderby'      => 'date',
				'order'        => 'DESC',
				'status'       => array( 'completed', 'processing', 'partial-shipped', 'shipped' ),
				'date_created' => '>' . ( time() - 60 * DAY_IN_SECONDS ),
				'meta_query'   => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					'relation' => 'AND',
					array(
						'key'     => GKT_Store::ITEMS,
						'compare' => 'EXISTS',
					),
					array(
						'key'     => GKT_Store::DONE,
						'compare' => 'NOT EXISTS',
					),
				),
			)
		);

		foreach ( $orders as $order ) {
			self::refresh_order( $order->get_id() );
		}
	}

	/**
	 * Refresh every live-capable tracking number on one order.
	 *
	 * @return array<string,string> Error text per tracking number, empty when all went well.
	 */
	public static function refresh_order( $order_id ): array {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order ) {
			return array();
		}

		$map      = GKT_Store::statuses( $order );
		$errors   = array();
		$all_done = true;
		$any_live = false;

		foreach ( GKT_Store::items( $order ) as $item ) {
			$courier = (string) ( $item['tracking_provider'] ?? '' );
			$number  = (string) ( $item['tracking_number'] ?? '' );
			if ( '' === $number ) {
				continue;
			}

			$meta = GKT_Couriers::all()[ $courier ] ?? null;
			if ( ! $meta || empty( $meta['live'] ) ) {
				continue; // Link-only courier: nothing to fetch.
			}
			$any_live = true;

			if ( 'delivered' === ( $map[ $number ]['status'] ?? '' ) ) {
				continue;
			}

			$data = GKT_Providers::fetch( $courier, $number );
			if ( is_wp_error( $data ) ) {
				$errors[ $number ] = $data->get_error_message();
				$map[ $number ]    = array_merge( $map[ $number ] ?? array( 'status' => 'pending', 'events' => array(), 'eta' => '' ), array( 'error' => $data->get_error_message(), 'checked' => time() ) );
				$all_done          = false;
				continue;
			}

			$map[ $number ] = array(
				'courier' => $courier,
				'status'  => (string) $data['status'],
				'eta'     => (string) $data['eta'],
				'events'  => $data['events'],
				'checked' => time(),
				'error'   => '',
			);

			if ( 'delivered' !== $data['status'] ) {
				$all_done = false;
			}
		}

		GKT_Store::save_statuses( $order, $map );

		if ( $any_live && $all_done ) {
			$order->update_meta_data( GKT_Store::DONE, time() );
			$order->save_meta_data();
			self::mark_delivered( $order );
		}

		return $errors;
	}

	/** Move the order to Delivered when the shop has chosen that. */
	private static function mark_delivered( WC_Order $order ): void {
		$settings = GKT_Providers::settings();
		if ( empty( $settings['auto_delivered'] ) || $order->has_status( 'delivered' ) ) {
			return;
		}
		if ( ! array_key_exists( 'wc-delivered', wc_get_order_statuses() ) ) {
			return;
		}
		$order->update_status( 'delivered', 'Courier reports the parcel as delivered.' );
	}
}
