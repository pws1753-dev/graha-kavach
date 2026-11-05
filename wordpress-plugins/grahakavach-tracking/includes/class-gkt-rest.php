<?php
/**
 * REST output for the storefront (read with the WooCommerce API keys).
 *
 *   GET /wp-json/wc/v3/orders/<id>/shipment-status     live status, ETA and scans
 *   GET /wp-json/wc/v3/orders/<id>/shipment-trackings  courier and tracking number
 *
 * The second route is only added when Advanced Shipment Tracking is switched
 * off, which is what normally provides it. The first one is also served by the
 * Headless Core plugin; this plugin feeds it through a filter when it is there.
 *
 * @package GrahaKavach\Tracking
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST routes and data shaping.
 */
final class GKT_Rest {

	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register' ), 99 );
		add_filter( 'gk_shipment_status_rows', array( __CLASS__, 'rows_filter' ), 10, 2 );
	}

	public static function register(): void {
		$routes  = array_keys( rest_get_server()->get_routes() );
		$has_ast = false;
		$has_st  = false;
		foreach ( $routes as $route ) {
			if ( preg_match( '#^/wc/v3/orders/.+/shipment-trackings#', $route ) ) {
				$has_ast = true;
			}
			if ( preg_match( '#^/wc/v3/orders/.+/shipment-status#', $route ) ) {
				$has_st = true;
			}
		}

		$permission = static function (): bool {
			return current_user_can( 'manage_woocommerce' );
		};

		if ( ! $has_ast ) {
			register_rest_route(
				'wc/v3',
				'/orders/(?P<id>\d+)/shipment-trackings',
				array(
					'methods'             => 'GET',
					'permission_callback' => $permission,
					'callback'            => static function ( $request ) {
						return rest_ensure_response( self::trackings( (int) $request['id'] ) );
					},
				)
			);
		}

		if ( ! $has_st ) {
			register_rest_route(
				'wc/v3',
				'/orders/(?P<id>\d+)/shipment-status',
				array(
					'methods'             => 'GET',
					'permission_callback' => $permission,
					'callback'            => static function ( $request ) {
						return rest_ensure_response( array( 'shipments' => self::rows( (int) $request['id'] ) ) );
					},
				)
			);
		}
	}

	/**
	 * @return array<int,array<string,string>>
	 */
	public static function trackings( int $order_id ): array {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return array();
		}
		$out = array();
		foreach ( GKT_Store::items( $order ) as $item ) {
			$courier = (string) ( $item['tracking_provider'] ?? '' );
			$number  = (string) ( $item['tracking_number'] ?? '' );
			$out[]   = array(
				'tracking_id'       => (string) ( $item['tracking_id'] ?? '' ),
				'tracking_provider' => GKT_Couriers::label( $courier ),
				'tracking_link'     => GKT_Couriers::link( $courier, $number, (string) ( $item['custom_tracking_link'] ?? '' ) ),
				'tracking_number'   => $number,
				'date_shipped'      => gmdate( 'Y-m-d', (int) ( $item['date_shipped'] ?? 0 ) ),
			);
		}
		return $out;
	}

	/**
	 * Live rows in the shape the storefront reads.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function rows( int $order_id ): array {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return array();
		}

		$labels = GKT_Couriers::statuses();
		$map    = GKT_Store::statuses( $order );
		$rows   = array();

		foreach ( GKT_Store::items( $order ) as $item ) {
			$number = (string) ( $item['tracking_number'] ?? '' );
			if ( ! isset( $map[ $number ] ) ) {
				continue;
			}
			$live   = $map[ $number ];
			$key    = (string) ( $live['status'] ?? 'unknown' );
			$events = array_map(
				static function ( array $e ): array {
					return array(
						'message'  => (string) $e['message'],
						'location' => (string) $e['location'],
						'time'     => (string) $e['time'],
					);
				},
				array_values( (array) ( $live['events'] ?? array() ) )
			);

			$rows[] = array(
				'tracking_number'   => $number,
				'provider'          => (string) ( $item['tracking_provider'] ?? '' ),
				'status'            => $key,
				'status_label'      => $labels[ $key ] ?? $key,
				'est_delivery_date' => (string) ( $live['eta'] ?? '' ),
				'shipped_on'        => gmdate( 'Y-m-d', (int) ( $item['date_shipped'] ?? 0 ) ),
				'last_event'        => $events ? $events[0]['message'] : '',
				'last_event_time'   => $events ? $events[0]['time'] : '',
				'events'            => $events,
			);
		}

		return $rows;
	}

	/**
	 * Headless Core asks here first; whatever this plugin knows wins.
	 *
	 * @param array<int,array<string,mixed>> $rows     Rows already found (TrackShip).
	 * @param int                            $order_id Order id.
	 * @return array<int,array<string,mixed>>
	 */
	public static function rows_filter( $rows, $order_id ) {
		$mine = self::rows( (int) $order_id );
		return $mine ? $mine : $rows;
	}
}
