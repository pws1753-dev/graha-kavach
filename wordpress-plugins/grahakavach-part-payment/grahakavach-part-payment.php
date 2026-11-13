<?php
/**
 * Plugin Name:       Graha Kavach Part Payment & Invoice
 * Plugin URI:        https://grahakavach.in
 *Description:       Shows Cash on Delivery orders that took an online advance as part-paid: "Paid online" and "Balance due on delivery" in wp-admin, emails, the thank-you page and the PDF invoice (PDF Invoices & Packing Slips by WP Overnight).
 * Version:           1.1.2
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Graha Kavach
 * License:           GPL-2.0-or-later
 * Text Domain:       grahakavach-part-payment
 *
 * The storefront records the advance on the order as `_cod_advance_paid` (rupees,
 * written once Razorpay confirms it) and `_cod_advance_minor` (paise, pinned when
 * the order is created). This plugin only reads those; it never changes amounts.
 *
 * @package GrahaKavach\PartPayment
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class GK_Part_Payment {

	/**
	 * Advance paid online on a COD order, in rupees. 0 when the order is not a
	 * COD order with an advance.
	 */
	public static function advance( $order ): float {
		if ( ! $order instanceof WC_Order || 'cod' !== $order->get_payment_method() ) {
			return 0.0;
		}

		$advance = (float) $order->get_meta( '_cod_advance_paid' );
		if ( $advance <= 0 && $order->get_transaction_id() ) {
			// Older orders: the amount pinned at checkout, valid once a payment id exists.
			$advance = (float) $order->get_meta( '_cod_advance_minor' ) / 100;
		}

		return max( 0.0, min( $advance, (float) $order->get_total() ) );
	}

	/**
	 * The COD balance counts as collected only once the order is Delivered.
	 * On this shop "Shipped" is WooCommerce's `completed` status renamed by the
	 * shipment-tracking plugin, so `completed` only means the parcel has left,
	 * not that anyone paid the courier.
	 */
	public static function delivered( $order ): bool {
		return $order instanceof WC_Order && 'delivered' === $order->get_status();
	}

	/** Balance still to be collected on delivery, in rupees. */
	public static function balance( $order ): float {
		$advance = self::advance( $order );
		if ( $advance <= 0 ) {
			return 0.0;
		}
		if ( self::delivered( $order ) ) {
			return 0.0; // Delivered: the balance was collected.
		}
		return max( 0.0, (float) $order->get_total() - $advance - (float) $order->get_total_refunded() );
	}

	/** "part" | "paid" | "cod" | "" for badges and labels. */
	public static function state( $order ): string {
		if ( ! $order instanceof WC_Order ) {
			return '';
		}
		if ( self::advance( $order ) > 0 ) {
			return self::delivered( $order ) ? 'paid' : 'part';
		}
		return 'cod' === $order->get_payment_method() ? 'cod' : '';
	}

	public static function init(): void {
		add_filter( 'woocommerce_order_get_payment_method_title', array( __CLASS__, 'payment_title' ), 10, 2 );
		add_filter( 'woocommerce_get_order_item_totals', array( __CLASS__, 'totals' ), 20, 2 );
		add_action( 'woocommerce_admin_order_totals_after_total', array( __CLASS__, 'admin_totals' ) );
		add_action( 'woocommerce_admin_order_data_after_order_details', array( __CLASS__, 'admin_badge' ) );

		// Order list column (HPOS and legacy post storage).
		add_filter( 'manage_woocommerce_page_wc-orders_columns', array( __CLASS__, 'column' ) );
		add_action( 'manage_woocommerce_page_wc-orders_custom_column', array( __CLASS__, 'column_content' ), 10, 2 );
		add_filter( 'manage_edit-shop_order_columns', array( __CLASS__, 'column' ) );
		add_action( 'manage_shop_order_posts_custom_column', array( __CLASS__, 'column_content_legacy' ), 10, 2 );

		// WooCommerce stamps "Paid on" when an order is first shipped (completed). For a
		// COD order the real date is when the advance came in, so keep that one.
		add_action( 'woocommerce_order_status_processing', array( __CLASS__, 'remember_advance_time' ), 5 );
		add_action( 'woocommerce_order_status_completed', array( __CLASS__, 'restore_advance_time' ), 99 );
		add_action( 'admin_init', array( __CLASS__, 'repair_shipped_orders' ) );

		// PDF Invoices & Packing Slips (WP Overnight).
		add_action( 'wpo_wcpdf_after_order_details', array( __CLASS__, 'invoice_summary' ), 10, 2 );
		add_filter( 'wpo_wcpdf_custom_styles', array( __CLASS__, 'invoice_styles' ), 10, 2 );
	}

	/** Remember when the advance arrived (the first time the order reaches Processing with one). */
	public static function remember_advance_time( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order || self::advance( $order ) <= 0 || $order->get_meta( '_gk_advance_paid_at' ) ) {
			return;
		}
		$order->update_meta_data( '_gk_advance_paid_at', time() );
		$order->save_meta_data();
	}

	/** Put "Paid on" back to the advance time after WooCommerce moved it to the shipping time. */
	public static function restore_advance_time( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order || self::advance( $order ) <= 0 ) {
			return;
		}
		$paid_at = (int) $order->get_meta( '_gk_advance_paid_at' );
		$current = $order->get_date_paid( 'edit' );
		if ( $paid_at > 0 && ( ! $current || (int) $current->getTimestamp() !== $paid_at ) ) {
			$order->set_date_paid( $paid_at );
			$order->save();
		}
	}

	/**
	 * One-time repair of orders already shipped: their "Paid on" date moved to the
	 * day they were marked Shipped. Set it back to when the advance came in (the
	 * WhatsApp advance message time, else the day the order was placed).
	 */
	public static function repair_shipped_orders(): void {
		if ( get_option( 'gk_pp_shipped_repair_v1' ) || ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		update_option( 'gk_pp_shipped_repair_v1', 1 );

		$orders = wc_get_orders(
			array(
				'status'         => 'completed',
				'limit'          => 200,
				'payment_method' => 'cod',
			)
		);
		foreach ( $orders as $order ) {
			if ( self::advance( $order ) <= 0 ) {
				continue;
			}
			$paid_at = (int) $order->get_meta( '_gkwa_q_payment' );
			if ( $paid_at <= 0 && $order->get_date_created() ) {
				$paid_at = (int) $order->get_date_created()->getTimestamp();
			}
			if ( $paid_at > 0 ) {
				$order->update_meta_data( '_gk_advance_paid_at', $paid_at );
				$order->set_date_paid( $paid_at );
				$order->save();
			}
		}
	}

	/**
	 * "Cash on delivery" next to a Razorpay payment id reads like a fully paid
	 * order. Say what actually happened instead.
	 */
	public static function payment_title( $title, $order ) {
		if ( self::advance( $order ) <= 0 ) {
			return $title;
		}
		return self::delivered( $order )
			? __( 'Advance online + balance paid on delivery', 'grahakavach-part-payment' )
			: __( 'Part payment: advance paid online, balance on delivery (COD)', 'grahakavach-part-payment' );
	}

	/** Extra rows for emails, thank-you page, My Account and the PDF invoice. */
	public static function totals( $rows, $order ) {
		$advance = self::advance( $order );
		if ( $advance <= 0 ) {
			return $rows;
		}

		$paid_label = __( 'Received (paid online)', 'grahakavach-part-payment' );
		$rows['gk_advance_paid'] = array(
			'label' => $paid_label . ':',
			'value' => '- ' . wc_price( $advance, array( 'currency' => $order->get_currency() ) ),
		);

		$completed = self::delivered( $order );
		$rows['gk_balance_due'] = array(
			'label' => ( $completed
				? __( 'Received on delivery (balance)', 'grahakavach-part-payment' )
				: __( 'Pending (pay on delivery)', 'grahakavach-part-payment' ) ) . ':',
			'value' => wc_price( $completed ? max( 0, (float) $order->get_total() - $advance ) : self::balance( $order ), array( 'currency' => $order->get_currency() ) ),
		);

		return $rows;
	}

	public static function admin_totals( $order_id ): void {
		$order   = wc_get_order( $order_id );
		$advance = self::advance( $order );
		if ( $advance <= 0 ) {
			return;
		}
		$completed = self::delivered( $order );
		?>
		<table class="wc-order-totals" style="border-top:1px solid #999;margin-top:12px;padding-top:12px">
			<tr>
				<td class="label"><?php esc_html_e( 'Received (paid online):', 'grahakavach-part-payment' ); ?></td>
				<td width="1%"></td>
				<td class="total"><?php echo wp_kses_post( wc_price( $advance, array( 'currency' => $order->get_currency() ) ) ); ?></td>
			</tr>
			<tr>
				<td class="label"><strong><?php echo $completed ? esc_html__( 'Received on delivery:', 'grahakavach-part-payment' ) : esc_html__( 'Pending (due on delivery):', 'grahakavach-part-payment' ); ?></strong></td>
				<td width="1%"></td>
				<td class="total"><strong><?php echo wp_kses_post( wc_price( $completed ? (float) $order->get_total() - $advance : self::balance( $order ), array( 'currency' => $order->get_currency() ) ) ); ?></strong></td>
			</tr>
		</table>
		<?php
	}

	public static function admin_badge( $order ): void {
		$state = self::state( $order );
		if ( ! in_array( $state, array( 'part', 'paid' ), true ) ) {
			return;
		}
		$label = 'part' === $state ? __( 'PART PAID - collect balance on delivery', 'grahakavach-part-payment' ) : __( 'FULLY PAID - balance collected', 'grahakavach-part-payment' );
		$color = 'part' === $state ? '#b45309' : '#15803d';
		printf(
			'<p class="form-field form-field-wide"><span style="display:inline-block;padding:4px 10px;border-radius:4px;background:%1$s;color:#fff;font-weight:600">%2$s</span></p>',
			esc_attr( $color ),
			esc_html( $label )
		);
	}

	public static function column( $columns ) {
		$out = array();
		foreach ( $columns as $key => $label ) {
			$out[ $key ] = $label;
			if ( 'order_total' === $key ) {
				$out['gk_payment'] = __( 'Payment', 'grahakavach-part-payment' );
			}
		}
		return isset( $out['gk_payment'] ) ? $out : $columns + array( 'gk_payment' => __( 'Payment', 'grahakavach-part-payment' ) );
	}

	public static function column_content( $column, $order ): void {
		if ( 'gk_payment' !== $column ) {
			return;
		}
		self::render_cell( $order );
	}

	public static function column_content_legacy( $column, $post_id ): void {
		if ( 'gk_payment' !== $column ) {
			return;
		}
		self::render_cell( wc_get_order( $post_id ) );
	}

	private static function render_cell( $order ): void {
		if ( ! $order instanceof WC_Order ) { return; }
		if ( in_array( $order->get_status(), array( 'checkout-draft', 'pending', 'failed', 'cancelled' ), true ) && self::advance( $order ) <= 0 && ! $order->is_paid() ) {
			echo '<strong style="color:#b45309">' . esc_html__( 'Payment not received - unconfirmed', 'grahakavach-part-payment' ) . '</strong>';
			return;
		}
		$state = self::state( $order );
		if ( '' === $state ) {
			echo $order->is_paid()
				? '<span style="color:#15803d">' . esc_html__( 'Paid online', 'grahakavach-part-payment' ) . '</span>'
				: '<span style="color:#b45309">' . esc_html__( 'Payment not received', 'grahakavach-part-payment' ) . '</span>';
			return;
		}
		if ( 'cod' === $state ) {
			echo '<span style="color:#b45309">' . esc_html__( 'COD - unpaid', 'grahakavach-part-payment' ) . '</span>';
			return;
		}
		$advance = self::advance( $order );
		if ( 'paid' === $state ) {
			echo '<span style="color:#15803d">' . esc_html__( 'Paid in full', 'grahakavach-part-payment' ) . '</span>';
			return;
		}
		echo '<strong style="color:#b45309">' . esc_html__( 'Part paid', 'grahakavach-part-payment' ) . '</strong><br>';
		echo wp_kses_post(
			sprintf(
				/* translators: 1: advance amount, 2: balance amount */
				__( 'Received %1$s &middot; Pending %2$s', 'grahakavach-part-payment' ),
				wc_price( $advance ),
				wc_price( self::balance( $order ) )
			)
		);
	}

	/** Payment summary box on the PDF invoice, under the item list. */
	public static function invoice_summary( $document_type, $order ): void {
		if ( 'invoice' !== $document_type ) {
			return;
		}
		$state = self::state( $order );
		if ( '' === $state ) {
			return;
		}
		$advance = self::advance( $order );
		?>
		<div class="gk-pay-box <?php echo esc_attr( 'gk-pay-' . $state ); ?>">
			<?php if ( 'part' === $state ) : ?>
				<strong><?php esc_html_e( 'PART PAYMENT', 'grahakavach-part-payment' ); ?></strong><br>
				<?php
				echo wp_kses_post(
					sprintf(
						/* translators: 1: advance amount, 2: balance amount */
						__( 'Received: %1$s (paid online). Pending: %2$s - please pay in cash to the delivery person.', 'grahakavach-part-payment' ),
						wc_price( $advance, array( 'currency' => $order->get_currency() ) ),
						wc_price( self::balance( $order ), array( 'currency' => $order->get_currency() ) )
					)
				);
				?>
			<?php elseif ( 'paid' === $state ) : ?>
				<strong><?php esc_html_e( 'PAID IN FULL', 'grahakavach-part-payment' ); ?></strong><br>
				<?php esc_html_e( 'Advance received online, balance collected on delivery. Thank you!', 'grahakavach-part-payment' ); ?>
			<?php else : ?>
				<strong><?php esc_html_e( 'CASH ON DELIVERY', 'grahakavach-part-payment' ); ?></strong><br>
				<?php
				echo wp_kses_post(
					sprintf(
						/* translators: %s: order total */
						__( 'Please pay %s in cash on delivery.', 'grahakavach-part-payment' ),
						wc_price( (float) $order->get_total(), array( 'currency' => $order->get_currency() ) )
					)
				);
				?>
			<?php endif; ?>
		</div>
		<?php
	}

	public static function invoice_styles( $css, $document = null ) {
		return $css . '
			.gk-pay-box { margin: 14px 0; padding: 10px 14px; border: 1px solid #d1d5db; border-left: 4px solid #b45309; font-size: 9pt; line-height: 1.5; }
			.gk-pay-box.gk-pay-paid { border-left-color: #15803d; }
			.gk-pay-box.gk-pay-cod { border-left-color: #1d4ed8; }
			.gk-pay-box strong { font-size: 10pt; }
			tr.gk_advance_paid td, tr.gk_balance_due td { font-weight: bold; }
		';
	}
}

add_action(
	'plugins_loaded',
	static function (): void {
		if ( class_exists( 'WooCommerce' ) ) {
			GK_Part_Payment::init();
		}
	}
);
