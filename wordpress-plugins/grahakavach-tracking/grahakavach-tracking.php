<?php
/**
 * Plugin Name:       Graha Kavach Shipment Tracking
 * Plugin URI:        https://grahakavach.in
 * Description:       One plugin for shipment tracking: add a courier and tracking number to an order, and the live status, expected delivery and courier scans update by themselves from the courier's official API. Feeds the storefront's Track Order page. Replaces Advanced Shipment Tracking and TrackShip; no third-party account.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Graha Kavach
 * License:           GPL-2.0-or-later
 * Text Domain:       grahakavach-tracking
 *
 * The tracking data is stored in the same order meta Advanced Shipment Tracking
 * uses (`_wc_shipment_tracking_items`), so existing orders, the WhatsApp alerts and
 * the storefront keep working, and AST can be switched off once this is verified.
 *
 * @package GrahaKavach\Tracking
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GKT_VERSION', '1.0.0' );
define( 'GKT_DIR', plugin_dir_path( __FILE__ ) );

require_once GKT_DIR . 'includes/class-gkt-couriers.php';
require_once GKT_DIR . 'includes/class-gkt-providers.php';
require_once GKT_DIR . 'includes/class-gkt-store.php';
require_once GKT_DIR . 'includes/class-gkt-sync.php';
require_once GKT_DIR . 'includes/class-gkt-admin.php';
require_once GKT_DIR . 'includes/class-gkt-rest.php';

add_action(
	'plugins_loaded',
	static function (): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		GKT_Sync::init();
		GKT_Admin::init();
		GKT_Rest::init();
	}
);

register_activation_hook(
	__FILE__,
	static function (): void {
		if ( ! wp_next_scheduled( GKT_Sync::CRON ) ) {
			wp_schedule_event( time() + 300, 'gkt_four_hours', GKT_Sync::CRON );
		}
	}
);

register_deactivation_hook(
	__FILE__,
	static function (): void {
		wp_clear_scheduled_hook( GKT_Sync::CRON );
	}
);
