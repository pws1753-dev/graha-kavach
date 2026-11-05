<?php
/**
 * Plugin Name:       Graha Kavach WhatsApp Alerts
 * Plugin URI:        https://grahakavach.in
 * Description:       Automated WhatsApp Cloud API messages for WooCommerce: signup thank-you, abandoned-cart recovery, payment confirmation, order processing, shipping, delivery, cancellation and refunds. Built for the headless Graha Kavach storefront.
 * Version:           1.1.1
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Requires Plugins:  woocommerce
 * Author:            Graha Kavach
 * License:           GPL-2.0-or-later
 * Text Domain:       grahakavach-whatsapp
 *
 * Secrets belong in wp-config.php (see README.md). Nothing in this plugin ever
 * blocks the order flow: every message is queued and sent in the background,
 * and a failed send is logged, never thrown.
 *
 * @package GrahaKavach\WhatsApp
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GKWA_VERSION', '1.1.1' );
define( 'GKWA_FILE', __FILE__ );
define( 'GKWA_DIR', plugin_dir_path( __FILE__ ) );

require_once GKWA_DIR . 'includes/class-gkwa-config.php';
require_once GKWA_DIR . 'includes/class-gkwa-db.php';
require_once GKWA_DIR . 'includes/class-gkwa-templates.php';
require_once GKWA_DIR . 'includes/class-gkwa-client.php';
require_once GKWA_DIR . 'includes/class-gkwa-sender.php';
require_once GKWA_DIR . 'includes/class-gkwa-events.php';
require_once GKWA_DIR . 'includes/class-gkwa-carts.php';
require_once GKWA_DIR . 'includes/class-gkwa-webhook.php';
require_once GKWA_DIR . 'includes/class-gkwa-contacts.php';
require_once GKWA_DIR . 'includes/class-gkwa-admin.php';

add_action(
	'before_woocommerce_init',
	static function (): void {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', GKWA_FILE, true );
		}
	}
);

add_action(
	'plugins_loaded',
	static function (): void {
		GKWA_DB::maybe_upgrade();
		GKWA_Sender::init();
		GKWA_Carts::init();
		GKWA_Webhook::init();
		GKWA_Contacts::init();
		GKWA_Admin::init();

		// Order events need WooCommerce; without it the plugin stays inert.
		if ( class_exists( 'WooCommerce' ) ) {
			GKWA_Events::init();
		}
	}
);

register_activation_hook(
	__FILE__,
	static function (): void {
		GKWA_DB::install();
		GKWA_Carts::schedule();
	}
);

register_deactivation_hook(
	__FILE__,
	static function (): void {
		GKWA_Carts::unschedule();
	}
);
