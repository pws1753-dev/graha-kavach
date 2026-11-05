<?php
/**
 * Courier connectors. Each one signs in with the courier account the shop
 * already has and asks the courier's official tracking API for one parcel.
 *
 * A connector returns:
 *   array{ status:string, eta:string, events:array<int,array{message:string,location:string,time:string}> }
 * or a WP_Error. Times are "Y-m-d H:i:s" in the shop's timezone as sent by the courier.
 *
 * @package GrahaKavach\Tracking
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registry and shared helpers.
 */
final class GKT_Providers {

	/**
	 * Fetch live data for a parcel, or a WP_Error when the courier has no live
	 * connector or the credentials are missing.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	public static function fetch( string $courier, string $awb ) {
		switch ( $courier ) {
			case 'delhivery':
				return GKT_Delhivery::fetch( $awb );
			case 'xpressbees':
				return GKT_Xpressbees::fetch( $awb );
		}
		return new WP_Error( 'gkt_no_live', 'No live tracking for this courier.' );
	}

	/**
	 * Settings, filled in under WooCommerce > Shipment Tracking.
	 *
	 * @return array<string,mixed>
	 */
	public static function settings(): array {
		$saved = get_option( 'gkt_settings', array() );
		return is_array( $saved ) ? $saved : array();
	}

	/**
	 * GET or POST JSON and decode the answer.
	 *
	 * @param array<string,mixed> $args wp_remote_request arguments.
	 * @return array<string,mixed>|WP_Error
	 */
	public static function json( string $url, array $args = array() ) {
		$args += array( 'timeout' => 20 );
		$res   = wp_remote_request( $url, $args );
		if ( is_wp_error( $res ) ) {
			return $res;
		}
		$code = (int) wp_remote_retrieve_response_code( $res );
		$body = json_decode( (string) wp_remote_retrieve_body( $res ), true );
		if ( $code >= 400 || ! is_array( $body ) ) {
			return new WP_Error( 'gkt_http', sprintf( 'Courier answered HTTP %d.', $code ), array( 'code' => $code ) );
		}
		return $body;
	}

	/** Normalise a courier timestamp to "Y-m-d H:i:s", or "" when it is not a date. */
	public static function time( $value ): string {
		$value = trim( (string) $value );
		if ( '' === $value ) {
			return '';
		}
		$stamp = strtotime( $value );
		return $stamp ? gmdate( 'Y-m-d H:i:s', $stamp ) : '';
	}

	/**
	 * Newest first, capped.
	 *
	 * @param array<int,array<string,string>> $events Events.
	 * @return array<int,array<string,string>>
	 */
	public static function sort_events( array $events ): array {
		usort(
			$events,
			static function ( array $a, array $b ): int {
				return strcmp( $b['time'], $a['time'] );
			}
		);
		return array_slice( $events, 0, 40 );
	}
}

/**
 * Delhivery: https://track.delhivery.com/api/v1/packages/json/ with the
 * account's API token (Delhivery panel > Settings > API Setup).
 */
final class GKT_Delhivery {

	/**
	 * @return array<string,mixed>|WP_Error
	 */
	public static function fetch( string $awb ) {
		$token = trim( (string) ( GKT_Providers::settings()['delhivery_token'] ?? '' ) );
		if ( '' === $token ) {
			return new WP_Error( 'gkt_no_credentials', 'Add the Delhivery API token in WooCommerce > Shipment Tracking.' );
		}

		$data = GKT_Providers::json(
			add_query_arg(
				array(
					'waybill' => $awb,
					'token'   => $token,
				),
				'https://track.delhivery.com/api/v1/packages/json/'
			)
		);
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$shipment = $data['ShipmentData'][0]['Shipment'] ?? null;
		if ( ! is_array( $shipment ) ) {
			return new WP_Error( 'gkt_not_found', (string) ( $data['Error'] ?? 'Delhivery has no record of this tracking number yet.' ) );
		}

		$now    = is_array( $shipment['Status'] ?? null ) ? $shipment['Status'] : array();
		$label  = (string) ( $now['Status'] ?? '' );
		$type   = strtoupper( (string) ( $now['StatusType'] ?? '' ) );
		$detail = trim( $label . ' ' . (string) ( $now['Instructions'] ?? '' ) );

		if ( 'DL' === $type || 'delivered' === strtolower( $label ) ) {
			$status = 'delivered';
		} elseif ( 'RT' === $type ) {
			$status = 'return_to_sender';
		} elseif ( 'dispatched' === strtolower( $label ) ) {
			$status = 'out_for_delivery';
		} elseif ( 'manifested' === strtolower( $label ) ) {
			$status = 'pre_transit';
		} else {
			$status = GKT_Couriers::from_text( $detail );
			$status = 'unknown' === $status ? 'in_transit' : $status;
		}

		$events = array();
		foreach ( (array) ( $shipment['Scans'] ?? array() ) as $scan ) {
			$d = is_array( $scan['ScanDetail'] ?? null ) ? $scan['ScanDetail'] : array();
			$m = trim( (string) ( $d['Scan'] ?? '' ) );
			if ( '' === $m ) {
				continue;
			}
			$note = trim( (string) ( $d['Instructions'] ?? '' ) );
			$events[] = array(
				'message'  => '' !== $note && $note !== $m ? $m . ' - ' . $note : $m,
				'location' => trim( (string) ( $d['ScannedLocation'] ?? '' ) ),
				'time'     => GKT_Providers::time( $d['ScanDateTime'] ?? '' ),
			);
		}

		$eta = GKT_Providers::time( $shipment['ExpectedDeliveryDate'] ?? ( $shipment['PromisedDeliveryDate'] ?? '' ) );

		return array(
			'status' => $status,
			'eta'    => '' !== $eta ? substr( $eta, 0, 10 ) : '',
			'events' => GKT_Providers::sort_events( $events ),
		);
	}
}

/**
 * Xpressbees: the shipping API at shipment.xpressbees.com. It signs in with the
 * email and password of the Xpressbees account used to book parcels.
 */
final class GKT_Xpressbees {

	private const BASE = 'https://shipment.xpressbees.com/api/';

	/**
	 * @return string|WP_Error Bearer token.
	 */
	private static function token( bool $fresh = false ) {
		$s = GKT_Providers::settings();
		if ( '' === trim( (string) ( $s['xpressbees_email'] ?? '' ) ) || '' === (string) ( $s['xpressbees_password'] ?? '' ) ) {
			return new WP_Error( 'gkt_no_credentials', 'Add the Xpressbees login in WooCommerce > Shipment Tracking.' );
		}

		$cached = get_transient( 'gkt_xb_token' );
		if ( ! $fresh && is_string( $cached ) && '' !== $cached ) {
			return $cached;
		}

		$data = GKT_Providers::json(
			self::BASE . 'users/login',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'email'    => trim( (string) $s['xpressbees_email'] ),
						'password' => (string) $s['xpressbees_password'],
					)
				),
			)
		);
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$token = is_string( $data['data'] ?? null ) ? $data['data'] : (string) ( $data['data']['token'] ?? $data['token'] ?? '' );
		if ( '' === $token ) {
			return new WP_Error( 'gkt_login', 'Xpressbees did not accept the login.' );
		}

		set_transient( 'gkt_xb_token', $token, 12 * HOUR_IN_SECONDS );
		return $token;
	}

	/**
	 * @return array<string,mixed>|WP_Error
	 */
	public static function fetch( string $awb ) {
		$token = self::token();
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		$url  = self::BASE . 'shipments2/track/' . rawurlencode( $awb );
		$args = array( 'headers' => array( 'Authorization' => 'Bearer ' . $token ) );
		$data = GKT_Providers::json( $url, $args );

		// An expired token is refreshed once.
		if ( is_wp_error( $data ) && 401 === (int) ( $data->get_error_data()['code'] ?? 0 ) ) {
			$token = self::token( true );
			if ( is_wp_error( $token ) ) {
				return $token;
			}
			$data = GKT_Providers::json( $url, array( 'headers' => array( 'Authorization' => 'Bearer ' . $token ) ) );
		}
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$body = is_array( $data['data'] ?? null ) ? $data['data'] : array();
		if ( ! $body ) {
			return new WP_Error( 'gkt_not_found', 'Xpressbees has no record of this tracking number yet.' );
		}

		$history = $body['history'] ?? ( $body['tracking_history'] ?? ( $body['events'] ?? array() ) );
		$events  = array();
		foreach ( (array) $history as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$m = trim( (string) ( $row['message'] ?? $row['status'] ?? $row['status_description'] ?? $row['remark'] ?? '' ) );
			if ( '' === $m ) {
				continue;
			}
			$events[] = array(
				'message'  => $m,
				'location' => trim( (string) ( $row['location'] ?? $row['city'] ?? '' ) ),
				'time'     => GKT_Providers::time( $row['event_time'] ?? $row['datetime'] ?? $row['created_at'] ?? $row['date'] ?? '' ),
			);
		}
		$events = GKT_Providers::sort_events( $events );

		$label  = trim( (string) ( $body['status'] ?? $body['current_status'] ?? '' ) );
		$status = GKT_Couriers::from_text( $label );
		if ( 'unknown' === $status && $events ) {
			$status = GKT_Couriers::from_text( $events[0]['message'] );
		}
		$status = 'unknown' === $status ? 'in_transit' : $status;

		$eta = GKT_Providers::time( $body['expected_delivery_date'] ?? $body['edd'] ?? $body['estimated_delivery'] ?? '' );

		return array(
			'status' => $status,
			'eta'    => '' !== $eta ? substr( $eta, 0, 10 ) : '',
			'events' => $events,
		);
	}
}
