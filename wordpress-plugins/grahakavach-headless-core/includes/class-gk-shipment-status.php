<?php
/**
 * Live shipment status for the storefront's "Track order" page.
 *
 * TrackShip for WooCommerce follows each parcel with the courier and keeps the
 * status and the list of courier events in its own tables. WooCommerce's REST
 * API does not expose them, so this adds one authenticated read-only route that
 * the storefront calls with its WooCommerce API keys:
 *
 *   GET /wp-json/wc/v3/orders/<id>/shipment-status
 *
 * When TrackShip is not installed or has nothing for the order, the list is empty.
 *
 * @package GrahaKavach\HeadlessCore
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Reads TrackShip's shipment tables.
 */
final class GK_Shipment_Status {

	/**
	 * Customer-facing names for TrackShip statuses.
	 *
	 * @var array<string,string>
	 */
	private const LABELS = array(
		'pending_trackship'    => 'Shipment received',
		'pre_transit'          => 'Label created, awaiting pickup',
		'in_transit'           => 'In transit',
		'available_for_pickup' => 'Ready for pickup',
		'out_for_delivery'     => 'Out for delivery',
		'failed_attempt'       => 'Delivery attempt failed',
		'delivered'            => 'Delivered',
		'return_to_sender'     => 'Returning to sender',
		'exception'            => 'Delivery exception',
		'carrier_unreachable'  => 'Waiting for courier update',
		'unknown'              => 'Waiting for courier update',
	);

	/**
	 * Register the route.
	 */
	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register_route' ) );
	}

	/**
	 * Route under the WooCommerce namespace so API-key authentication applies.
	 */
	public static function register_route(): void {
		register_rest_route(
			'wc/v3',
			'/orders/(?P<id>\d+)/shipment-status',
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'handle' ),
				'permission_callback' => static function (): bool {
					return current_user_can( 'manage_woocommerce' );
				},
			)
		);
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function handle( $request ) {
		return rest_ensure_response( array( 'shipments' => self::for_order( (int) $request['id'] ) ) );
	}

	/**
	 * @return array<int,array<string,mixed>>
	 */
	public static function for_order( int $order_id ): array {
		// The Graha Kavach Shipment Tracking plugin answers first when it is active.
		$rows = apply_filters( 'gk_shipment_status_rows', self::from_trackship( $order_id ), $order_id );
		return is_array( $rows ) ? $rows : array();
	}

	/**
	 * @return array<int,array<string,mixed>>
	 */
	private static function from_trackship( int $order_id ): array {
		global $wpdb;

		$shipments = $wpdb->prefix . 'trackship_shipment';
		$meta      = $wpdb->prefix . 'trackship_shipment_meta';

		// TrackShip not installed: nothing to report.
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $shipments ) ) !== $shipments ) { // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			return array();
		}

		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->prepare(
				"SELECT s.tracking_number, s.shipping_provider, s.shipment_status, s.est_delivery_date, s.last_event, s.last_event_time, s.shipping_date, m.tracking_events
				FROM {$shipments} s LEFT JOIN {$meta} m ON m.meta_id = s.id
				WHERE s.order_id = %d ORDER BY s.id ASC",
				$order_id
			),
			ARRAY_A
		);

		$out = array();
		foreach ( (array) $rows as $row ) {
			$status = (string) $row['shipment_status'];
			$out[]  = array(
				'tracking_number'   => (string) $row['tracking_number'],
				'provider'          => (string) $row['shipping_provider'],
				'status'            => $status,
				'status_label'      => self::LABELS[ $status ] ?? ucwords( str_replace( '_', ' ', $status ) ),
				'est_delivery_date' => self::clean_date( $row['est_delivery_date'] ),
				'shipped_on'        => self::clean_date( $row['shipping_date'] ),
				'last_event'        => self::plain( $row['last_event'] ),
				'last_event_time'   => (string) $row['last_event_time'],
				'events'            => self::events( $row['tracking_events'] ),
			);
		}

		return $out;
	}

	/**
	 * TrackShip keeps the courier's events as JSON (or a serialized array). Each
	 * event is read defensively because carriers send different fields.
	 *
	 * @param mixed $raw Stored value.
	 * @return array<int,array<string,string>>
	 */
	private static function events( $raw ): array {
		if ( ! is_string( $raw ) || '' === trim( $raw ) ) {
			return array();
		}

		$data = json_decode( $raw, true );
		if ( ! is_array( $data ) ) {
			$data = maybe_unserialize( $raw );
		}
		if ( ! is_array( $data ) ) {
			return array();
		}

		$events = array();
		foreach ( $data as $event ) {
			if ( ! is_array( $event ) ) {
				continue;
			}
			$message = '';
			foreach ( array( 'message', 'status_description', 'description', 'status', 'event' ) as $key ) {
				if ( ! empty( $event[ $key ] ) && is_string( $event[ $key ] ) ) {
					$message = self::plain( $event[ $key ] );
					break;
				}
			}
			if ( '' === $message ) {
				continue;
			}

			$place = '';
			foreach ( array( 'location', 'city', 'event_location' ) as $key ) {
				if ( ! empty( $event[ $key ] ) && is_string( $event[ $key ] ) ) {
					$place = self::plain( $event[ $key ] );
					break;
				}
			}

			$time = '';
			foreach ( array( 'datetime', 'event_time', 'time', 'date' ) as $key ) {
				if ( ! empty( $event[ $key ] ) && is_string( $event[ $key ] ) ) {
					$time = $event[ $key ];
					break;
				}
			}

			$events[] = array(
				'message'  => $message,
				'location' => $place,
				'time'     => $time,
			);
		}

		// Newest first, whichever way the courier listed them.
		usort(
			$events,
			static function ( array $a, array $b ): int {
				return strcmp( $b['time'], $a['time'] );
			}
		);

		return array_slice( $events, 0, 30 );
	}

	/**
	 * @param mixed $value Stored text.
	 */
	private static function plain( $value ): string {
		return trim( wp_strip_all_tags( (string) $value ) );
	}

	/**
	 * @param mixed $value A MySQL date, possibly the zero date.
	 */
	private static function clean_date( $value ): string {
		$value = (string) $value;
		return ( '' === $value || 0 === strpos( $value, '0000' ) ) ? '' : $value;
	}
}
