<?php
/**
 * Where the tracking numbers and the live status are kept.
 *
 * Tracking numbers use the Advanced Shipment Tracking meta format so nothing
 * else (WhatsApp alerts, the storefront, old orders) has to change.
 *
 * @package GrahaKavach\Tracking
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Order meta access.
 */
final class GKT_Store {

	public const ITEMS  = '_wc_shipment_tracking_items';
	public const STATUS = '_gkt_status';
	public const DONE   = '_gkt_done';

	/**
	 * @return array<int,array<string,mixed>>
	 */
	public static function items( WC_Order $order ): array {
		$items = $order->get_meta( self::ITEMS );
		return is_array( $items ) ? array_values( $items ) : array();
	}

	/**
	 * Add one tracking number. Returns its tracking id, or '' when it was already there.
	 */
	public static function add( WC_Order $order, string $courier, string $number, int $shipped_at, string $custom_link = '' ): string {
		$number = trim( $number );
		if ( '' === $number ) {
			return '';
		}

		$items = self::items( $order );
		foreach ( $items as $item ) {
			if ( (string) ( $item['tracking_number'] ?? '' ) === $number && (string) ( $item['tracking_provider'] ?? '' ) === $courier ) {
				return '';
			}
		}

		$id      = md5( $order->get_id() . $courier . $number . microtime() );
		$items[] = array(
			'tracking_provider'        => $courier,
			'custom_tracking_provider' => 'other' === $courier ? 'Other courier' : '',
			'custom_tracking_link'     => $custom_link,
			'tracking_number'          => $number,
			'tracking_product_code'    => '',
			'source'                   => 'edit_order',
			'date_shipped'             => (string) ( $shipped_at > 0 ? $shipped_at : time() ),
			'status_shipped'           => '1',
			'tracking_id'              => $id,
			'user_id'                  => get_current_user_id(),
		);

		$order->update_meta_data( self::ITEMS, $items );
		$order->delete_meta_data( self::DONE );
		$order->save();

		return $id;
	}

	public static function remove( WC_Order $order, string $tracking_id ): void {
		$items = array_values(
			array_filter(
				self::items( $order ),
				static function ( $item ) use ( $tracking_id ): bool {
					return (string) ( $item['tracking_id'] ?? '' ) !== $tracking_id;
				}
			)
		);

		$order->update_meta_data( self::ITEMS, $items );
		$order->delete_meta_data( self::DONE );
		$order->save();
	}

	/**
	 * Live status per tracking number.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public static function statuses( WC_Order $order ): array {
		$map = $order->get_meta( self::STATUS );
		return is_array( $map ) ? $map : array();
	}

	/**
	 * @param array<string,array<string,mixed>> $map Status per tracking number.
	 */
	public static function save_statuses( WC_Order $order, array $map ): void {
		$order->update_meta_data( self::STATUS, $map );
		$order->save_meta_data();
	}
}
