<?php
/**
 * Couriers, status names and text-to-status matching.
 *
 * @package GrahaKavach\Tracking
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The list of couriers and the shared status vocabulary.
 */
final class GKT_Couriers {

	/**
	 * Courier slug => label, public tracking link ({n} is the tracking number)
	 * and whether live status is available.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public static function all(): array {
		return array(
			'xpressbees'  => array( 'label' => 'Xpressbees', 'link' => 'https://www.xpressbees.com/shipment/tracking?awbNo={n}', 'live' => true ),
			'delhivery'   => array( 'label' => 'Delhivery', 'link' => 'https://www.delhivery.com/track-v2/package/{n}', 'live' => true ),
			'india-post'  => array( 'label' => 'India Post', 'link' => 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx', 'live' => false ),
			'bluedart'    => array( 'label' => 'Blue Dart', 'link' => 'https://www.bluedart.com/tracking?trackFor=0&trackNo={n}', 'live' => false ),
			'dtdc'        => array( 'label' => 'DTDC', 'link' => 'https://www.dtdc.in/tracking/shipment-tracking.asp', 'live' => false ),
			'ecom-express' => array( 'label' => 'Ecom Express', 'link' => 'https://ecomexpress.in/tracking/?awb_field={n}', 'live' => false ),
			'shadowfax'   => array( 'label' => 'Shadowfax', 'link' => 'https://tracker.shadowfax.in/#/track/{n}', 'live' => false ),
			'other'       => array( 'label' => 'Other courier', 'link' => '', 'live' => false ),
		);
	}

	public static function label( string $slug ): string {
		$all = self::all();
		return isset( $all[ $slug ] ) ? (string) $all[ $slug ]['label'] : ucwords( str_replace( array( '-', '_' ), ' ', $slug ) );
	}

	public static function link( string $slug, string $number, string $custom = '' ): string {
		if ( '' !== $custom ) {
			return str_replace( '{n}', rawurlencode( $number ), $custom );
		}
		$all = self::all();
		return isset( $all[ $slug ] ) ? str_replace( '{n}', rawurlencode( $number ), (string) $all[ $slug ]['link'] ) : '';
	}

	/**
	 * Customer-facing status names.
	 *
	 * @return array<string,string>
	 */
	public static function statuses(): array {
		return array(
			'pending'          => 'Shipment received',
			'pre_transit'      => 'Packed, awaiting pickup',
			'in_transit'       => 'In transit',
			'out_for_delivery' => 'Out for delivery',
			'delivered'        => 'Delivered',
			'failed_attempt'   => 'Delivery attempt failed',
			'exception'        => 'Delivery exception',
			'return_to_sender' => 'Returning to sender',
			'unknown'          => 'Waiting for courier update',
		);
	}

	/**
	 * Map free courier text to one of our statuses. The most specific words win.
	 */
	public static function from_text( string $text ): string {
		$t = strtolower( $text );
		$rules = array(
			'delivered'        => array( 'delivered' ),
			'return_to_sender' => array( 'rto', 'return to origin', 'returned to', 'return to sender', 'returning' ),
			'out_for_delivery' => array( 'out for delivery', 'out-for-delivery', 'dispatched for delivery', 'with delivery' ),
			'failed_attempt'   => array( 'undelivered', 'attempt', 'not delivered', 'customer not available', 'refused' ),
			'exception'        => array( 'exception', 'damaged', 'lost', 'misrouted', 'held', 'on hold' ),
			'pre_transit'      => array( 'manifest', 'pickup pending', 'pending pickup', 'awaiting pickup', 'picked up', 'pickup done', 'booked', 'created', 'ready to ship' ),
			'in_transit'       => array( 'transit', 'dispatched', 'arrived', 'reached', 'departed', 'received at', 'in-scan', 'inscan', 'forwarded', 'shipped' ),
		);
		foreach ( $rules as $status => $needles ) {
			foreach ( $needles as $needle ) {
				if ( false !== strpos( $t, $needle ) ) {
					// "Not delivered" must not read as delivered.
					if ( 'delivered' === $status && ( false !== strpos( $t, 'not delivered' ) || false !== strpos( $t, 'undelivered' ) ) ) {
						continue;
					}
					return $status;
				}
			}
		}
		return 'unknown';
	}
}
