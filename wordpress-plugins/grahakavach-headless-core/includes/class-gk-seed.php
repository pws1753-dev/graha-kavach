<?php
/**
 * One-time seeding of initial content values.
 *
 * These are *initial values written into the CMS*, not frontend constants.
 * Once seeded they are owned by whoever edits them in wp-admin, and this code
 * never overwrites them again — the seed flag makes it run exactly once, and
 * each field is only written when it is still empty.
 *
 * Every value below was read from the live grahakavach.in site on 2026-09-20.
 * Nothing is invented: the live site publishes no WhatsApp number and no social
 * profiles, so those fields are deliberately left empty for an editor to fill.
 *
 * @package GrahaKavach\HeadlessCore
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Seeds initial CMS values once.
 */
final class GK_Seed {

	private const FLAG = 'gk_headless_seeded_v1';

	public static function init(): void {
		// Runs late on admin page loads so ACF and the CPTs are fully ready.
		add_action( 'admin_init', array( __CLASS__, 'maybe_seed' ), 20 );
	}

	/**
	 * Values confirmed on the live site.
	 *
	 * @return array<string,string>
	 */
	private static function values(): array {
		return array(
			'contact_phone_primary' => '+91 78911 11390',
			'contact_email_primary' => 'grahakavach@gmail.com',
			'contact_address'       => "103, Ostwal Plaza 2,\nSundarwas, Udaipur (Raj.)\nIndia",
			'contact_maps_url'      => 'https://maps.google.com/maps?q=103%2C%20Ostwal%20Plaza%202%2C%20Sundarwas%2C%20Udaipur%20%28Raj.%29%20India',
			'footer_copyright'      => sprintf( '© %s Graha Kavach. All rights reserved.', gmdate( 'Y' ) ),

			// Safety copy follows the evacuation-first guidance recorded in
			// docs/backend-content-model.md. No certification or compliance
			// claim is seeded, because none is backed by supplied material.
			'emergency_phone_instruction'  => 'In a fire emergency, call 101 immediately.',
			'emergency_disclaimer'         => 'If a fire is spreading, leave immediately. Avoid smoke exposure and keep a clear exit path. Use fire equipment only for small, early-stage incidents and only when it is safe to do so.',
			'emergency_fire_disclaimer'    => 'Graha Kavach products are intended for early-stage fire response. They are not a substitute for evacuation or for the fire services.',
		);
	}

	/**
	 * Seed once, filling only fields that are still empty.
	 */
	public static function maybe_seed(): void {
		if ( get_option( self::FLAG ) ) {
			return;
		}

		if ( ! function_exists( 'update_field' ) ) {
			// ACF not ready; try again on the next admin request.
			return;
		}

		$post_id = GK_CPT::settings_post_id();

		if ( ! $post_id ) {
			return;
		}

		foreach ( self::values() as $field => $value ) {
			$existing = get_field( $field, $post_id );

			// Never overwrite something an editor has already written.
			if ( is_string( $existing ) && '' !== trim( $existing ) ) {
				continue;
			}

			update_field( $field, $value, $post_id );
		}

		update_option( self::FLAG, gmdate( 'c' ), false );
	}
}
