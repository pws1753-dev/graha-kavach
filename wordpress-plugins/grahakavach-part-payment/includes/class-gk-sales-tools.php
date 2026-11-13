<?php
/** Customer contact, dispatch checks and a compact sales work queue. */
declare( strict_types = 1 );
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class GK_Sales_Tools {
	private const CONFIRMED = array( 'processing', 'completed', 'shipped', 'delivered' );

	public static function init(): void {
		add_action( 'wpo_wcpdf_after_shipping_address', array( __CLASS__, 'packing_phone' ), 10, 2 );
		add_action( 'wpo_wcpdf_after_document_label', array( __CLASS__, 'packing_payment' ), 10, 2 );
		add_filter( 'wpo_wcpdf_document_is_allowed', array( __CLASS__, 'document_allowed' ), 20, 2 );
		add_filter( 'manage_woocommerce_page_wc-orders_columns', array( __CLASS__, 'columns' ), 20 );
		add_filter( 'manage_edit-shop_order_columns', array( __CLASS__, 'columns' ), 20 );
		add_action( 'manage_woocommerce_page_wc-orders_custom_column', array( __CLASS__, 'contact_column' ), 10, 2 );
		add_action( 'manage_shop_order_posts_custom_column', array( __CLASS__, 'legacy_contact' ), 10, 2 );
		add_action( 'admin_head', array( __CLASS__, 'styles' ) );
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
	}

	public static function phone( $order ): string {
		if ( ! $order instanceof WC_Order ) { return ''; }
		$shipping = is_callable( array( $order, 'get_shipping_phone' ) ) ? trim( (string) $order->get_shipping_phone() ) : '';
		return $shipping ?: trim( (string) $order->get_billing_phone() );
	}

	public static function dispatchable( $order ): bool {
		if ( ! $order instanceof WC_Order || ! in_array( $order->get_status(), self::CONFIRMED, true ) ) { return false; }
		// An advance-required COD booking must have a recorded payment before dispatch.
		if ( 'cod' === $order->get_payment_method() && (int) $order->get_meta( '_cod_advance_minor' ) > 0 ) {
			return GK_Part_Payment::advance( $order ) > 0 && '' !== $order->get_transaction_id();
		}
		return true;
	}

	public static function document_allowed( $allowed, $document ): bool {
		if ( ! is_object( $document ) || ! is_callable( array( $document, 'get_type' ) ) || ! in_array( $document->get_type(), array( 'invoice', 'packing-slip' ), true ) ) { return (bool) $allowed; }
		return (bool) $allowed && self::dispatchable( $document->order );
	}

	public static function packing_phone( $type, $order ): void {
		if ( 'packing-slip' !== $type ) { return; }
		$phone = self::phone( $order );
		echo '<div class="gk-customer-phone" style="margin-top:8px;font-size:12pt;font-weight:bold">';
		echo esc_html( $phone ? 'Customer phone: ' . $phone : 'Customer phone missing - confirm before dispatch' );
		echo '</div>';
	}

	public static function packing_payment( $type, $order ): void {
		if ( 'packing-slip' !== $type || ! $order instanceof WC_Order ) { return; }
		$advance = GK_Part_Payment::advance( $order );
		$currency = array( 'currency' => $order->get_currency() );
		echo '<div style="border:1px solid #999;padding:8px;margin:10px 0">';
		if ( ! self::dispatchable( $order ) ) {
			echo '<strong>NOT CONFIRMED - DO NOT DISPATCH</strong>';
		} elseif ( 'cod' === $order->get_payment_method() && ! GK_Part_Payment::delivered( $order ) ) {
			$due = max( 0, (float) $order->get_total() - $advance - (float) $order->get_total_refunded() );
			echo '<strong>Collect on delivery: ' . wp_kses_post( wc_price( $due, $currency ) ) . '</strong>';
			if ( $advance > 0 ) { echo '<br>Advance received online: ' . wp_kses_post( wc_price( $advance, $currency ) ); }
		} else {
			echo '<strong>No payment to collect on delivery</strong>';
		}
		echo '</div>';
	}

	public static function columns( $columns ): array {
		$columns['gk_contact'] = __( 'Customer contact', 'grahakavach-part-payment' );
		return $columns;
	}
	public static function contact_column( $column, $order ): void {
		if ( 'gk_contact' === $column ) { self::contact( $order ); }
	}
	public static function legacy_contact( $column, $id ): void {
		if ( 'gk_contact' === $column ) { self::contact( wc_get_order( $id ) ); }
	}
	public static function contact( $order ): void {
		if ( ! $order instanceof WC_Order ) { return; }
		$phone = self::phone( $order );
		$digits = preg_replace( '/\D+/', '', $phone );
		if ( 10 === strlen( $digits ) ) { $digits = '91' . $digits; }
		if ( $phone && strlen( $digits ) >= 10 && strlen( $digits ) <= 15 ) {
			echo '<a href="' . esc_url( 'tel:+' . $digits ) . '">' . esc_html( $phone ) . '</a><br>';
			// Opens a chat only. Never sends a message automatically.
			echo '<a href="' . esc_url( 'https://wa.me/' . $digits ) . '" target="_blank" rel="noopener noreferrer">WhatsApp</a>';
		} else { echo '<strong style="color:#b45309">Phone missing</strong>'; }
		echo '<br><small>' . esc_html( $order->get_shipping_city() . ' ' . $order->get_shipping_postcode() ) . '</small>';
	}

	public static function styles(): void {
		$screen = get_current_screen();
		if ( ! $screen || ! in_array( $screen->id, array( 'woocommerce_page_wc-orders', 'edit-shop_order', 'woocommerce_page_gk-sales-desk' ), true ) ) { return; }
		echo '<style>.column-gk_payment{width:175px}.column-gk_contact{width:155px}.column-order_total{width:95px}.column-gk_payment strong{font-size:12px}.gk-sales-cards{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}.gk-sales-card{background:#fff;border:1px solid #ddd;padding:16px;min-width:160px}.gk-sales-card strong{display:block;font-size:26px}.gk-sales-table td{vertical-align:top;padding:12px}.gk-sales-table th{text-align:left}</style>';
	}
	public static function menu(): void {
		add_submenu_page( 'woocommerce', 'Sales Desk', 'Sales Desk', 'manage_woocommerce', 'gk-sales-desk', array( __CLASS__, 'page' ) );
	}
	public static function page(): void {
		if ( ! current_user_can( 'manage_woocommerce' ) ) { return; }
		$orders = wc_get_orders( array( 'status' => self::CONFIRMED, 'limit' => 50, 'orderby' => 'date', 'order' => 'DESC' ) );
		$ready = 0; $due = 0.0; $missing = 0;
		foreach ( $orders as $order ) {
			if ( 'processing' === $order->get_status() && self::dispatchable( $order ) ) { ++$ready; }
			if ( ! self::phone( $order ) ) { ++$missing; }
			if ( 'cod' === $order->get_payment_method() && ! GK_Part_Payment::delivered( $order ) ) { $due += max( 0, (float) $order->get_total() - GK_Part_Payment::advance( $order ) - (float) $order->get_total_refunded() ); }
		}
		echo '<div class="wrap"><h1>Sales Desk</h1><p>Latest 50 confirmed orders. Unpaid checkout attempts are excluded. Open an order to update notes, delivery details or tracking.</p><div class="gk-sales-cards">';
		echo '<div class="gk-sales-card">Ready to dispatch<strong>' . esc_html( (string) $ready ) . '</strong></div>';
		echo '<div class="gk-sales-card">COD balance outstanding<strong>' . wp_kses_post( wc_price( $due ) ) . '</strong></div>';
		echo '<div class="gk-sales-card">Missing customer phone<strong>' . esc_html( (string) $missing ) . '</strong></div></div>';
		echo '<table class="widefat striped gk-sales-table"><thead><tr><th>Order / customer</th><th>Contact / delivery</th><th>Status</th><th>Payment</th><th>Dispatch</th></tr></thead><tbody>';
		foreach ( $orders as $order ) {
			echo '<tr><td><a href="' . esc_url( $order->get_edit_order_url() ) . '">#' . esc_html( $order->get_order_number() ) . '</a><br>' . esc_html( $order->get_formatted_billing_full_name() ) . '</td><td>';
			self::contact( $order );
			echo '</td><td>' . esc_html( wc_get_order_status_name( $order->get_status() ) ) . '</td><td>';
			GK_Part_Payment::column_content( 'gk_payment', $order );
			echo '</td><td>' . esc_html( self::dispatchable( $order ) ? ( self::phone( $order ) ? 'Contact available' : 'Confirm phone before dispatch' ) : 'Hold - payment requires review' ) . '</td></tr>';
		}
		echo '</tbody></table><p><a href="' . esc_url( admin_url( 'admin.php?page=wc-orders' ) ) . '">Open all orders and cancelled attempts</a></p></div>';
	}

	/** Authenticated document export, also used to verify the actual generated PDF. */
	public static function routes(): void {
		register_rest_route( 'gk-sales/v1', '/orders/(?P<id>\d+)/packing-slip', array(
			'methods' => 'GET',
			'permission_callback' => static function () { return current_user_can( 'manage_woocommerce' ); },
			'callback' => array( __CLASS__, 'export_packing_slip' ),
		) );
	}
	public static function export_packing_slip( $request ) {
		$order = wc_get_order( (int) $request['id'] );
		if ( ! $order ) { return new WP_Error( 'gk_order_missing', 'Order not found.', array( 'status' => 404 ) ); }
		if ( ! self::dispatchable( $order ) ) { return new WP_Error( 'gk_dispatch_blocked', 'Unconfirmed or cancelled orders cannot be dispatched.', array( 'status' => 409 ) ); }
		if ( ! function_exists( 'wcpdf_get_document' ) ) { return new WP_Error( 'gk_pdf_missing', 'PDF plugin unavailable.', array( 'status' => 503 ) ); }
		$document = wcpdf_get_document( 'packing-slip', $order, false );
		if ( ! $document || ! $document->is_allowed() ) { return new WP_Error( 'gk_document_disabled', 'Packing slip is unavailable.', array( 'status' => 409 ) ); }
		$result = new WP_REST_Response( array( 'filename' => 'packing-slip-' . $order->get_id() . '.pdf', 'content_type' => 'application/pdf', 'content_base64' => base64_encode( $document->get_pdf() ) ) );
		$result->header( 'Cache-Control', 'private, no-store, max-age=0' );
		return $result;
	}
}
