<?php
/**
 * Plugin Name:       Graha Kavach Headless Core
 * Plugin URI:        https://grahakavach.in
 * Description:       Project-specific integration code for the Graha Kavach headless stack. Keeps backend noindex, exposes global settings to GraphQL without ACF Pro, signs revalidation webhooks to Next.js, and applies a strict CORS allowlist.
 * Version:           1.3.9
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Graha Kavach
 * License:           GPL-2.0-or-later
 * Text Domain:       grahakavach-headless-core
 *
 * This plugin holds all project-specific customisation so that no third-party
 * plugin and no WordPress core file is ever modified.
 *
 * @package GrahaKavach\HeadlessCore
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GK_HEADLESS_VERSION', '1.3.9' );
define( 'GK_HEADLESS_FILE', __FILE__ );
define( 'GK_HEADLESS_DIR', plugin_dir_path( __FILE__ ) );

/**
 * Configuration is read from wp-config.php constants first, then from the
 * options table. Secrets should only ever live in wp-config.php so that they
 * are not readable through the database or an admin screen.
 *
 * Add to wp-config.php:
 *
 *   define( 'GK_HEADLESS_FRONTEND_URL',      'https://grahakavach.in' );
 *   define( 'GK_HEADLESS_REVALIDATE_URL',    'https://grahakavach.in/api/revalidate' );
 *   define( 'GK_HEADLESS_REVALIDATE_SECRET', '<long random string>' );
 *   define( 'GK_HEADLESS_ALLOWED_ORIGINS',   'https://grahakavach.in,http://localhost:3000' );
 */

require_once GK_HEADLESS_DIR . 'includes/class-gk-config.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-urls.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-noindex.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-cors.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-cache-control.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-settings.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-graphql.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-rest.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-revalidation.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-admin.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-redirects.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-structured.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-cpt.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-model.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-fields.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-content-graphql.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-seed.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-landing.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-contact-migrate.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-order-tax.php';
require_once GK_HEADLESS_DIR . 'includes/class-gk-shipment-status.php';

/**
 * Boot every module.
 *
 * Each module is defensive: if an optional dependency (WPGraphQL, WooCommerce)
 * is missing, that module simply does nothing rather than fataling. This keeps
 * the backend recoverable even if a plugin is deactivated.
 */
function gk_headless_bootstrap(): void {
	GK_Urls::init();
	GK_Noindex::init();
	GK_Cors::init();
	GK_Cache_Control::init();
	GK_Settings::init();
	GK_GraphQL::init();
	GK_Rest::init();
	GK_Revalidation::init();
	GK_Admin::init();
	GK_Redirects::init();
	GK_Order_Tax::init();
	GK_Shipment_Status::init();

	// Phase 3 content model.
	GK_CPT::init();
	GK_Fields::init();
	GK_Content_GraphQL::init();
	GK_Seed::init();
	GK_Landing::init();
}
add_action( 'plugins_loaded', 'gk_headless_bootstrap' );

/**
 * Flush rewrite rules on activation so clean permalinks are always correct.
 */
register_activation_hook(
	__FILE__,
	static function (): void {
		// Enforce clean permalinks. Postname is the structure the frontend maps to.
		$structure = get_option( 'permalink_structure' );
		if ( '/%postname%/' !== $structure ) {
			update_option( 'permalink_structure', '/%postname%/' );
		}
		flush_rewrite_rules();
	}
);

register_deactivation_hook(
	__FILE__,
	static function (): void {
		flush_rewrite_rules();
	}
);
