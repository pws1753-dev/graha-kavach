<?php
/**
 * One-time migration: the primary contact number changed from +91 96102 51841 to +91 78911 11390.
 *
 * The number is stored in the Graha Kavach settings post (what GraphQL and /settings serve), so a code change
 * alone does not update the live site. This rewrites the stored phone and WhatsApp values once and revalidates.
 *
 * @package GrahaKavachHeadlessCore
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class GK_Contact_Migrate {

	const FLAG = 'gk_contact_migrated_7891111390';

	public static function init(): void {
		add_action( 'init', array( __CLASS__, 'run' ), 30 );
	}

	public static function run(): void {
		if ( get_option( self::FLAG ) || ! class_exists( 'GK_CPT' ) ) {
			return;
		}
		$id = GK_CPT::settings_post_id();
		if ( ! $id ) {
			return;
		}

		$old_forms = array( '+91 96102 51841', '+91 9610251841', '+91-9610251841', '+919610251841', '91 96102 51841', '919610251841', '96102 51841', '9610251841' );
		$new_phone = '+91 78911 11390';
		$new_wa    = '917891111390';

		foreach ( array( 'contact_phone_primary', 'contact_whatsapp_number' ) as $name ) {
			$value = function_exists( 'get_field' ) ? get_field( $name, $id ) : get_post_meta( $id, $name, true );
			if ( ! is_scalar( $value ) || '' === (string) $value ) {
				continue;
			}
			$str = (string) $value;
			$hit = false;
			foreach ( $old_forms as $old ) {
				if ( false !== strpos( $str, $old ) ) {
					$hit = true;
					break;
				}
			}
			if ( ! $hit ) {
				continue;
			}
			$next = 'contact_whatsapp_number' === $name ? $new_wa : $new_phone;
			if ( function_exists( 'update_field' ) ) {
				update_field( $name, $next, $id );
			} else {
				update_post_meta( $id, $name, $next );
			}
		}

		update_option( self::FLAG, gmdate( 'c' ), false );
		do_action( 'acf/save_post', $id ); // Lets the revalidation hook refresh the storefront cache.
	}
}

GK_Contact_Migrate::init();
