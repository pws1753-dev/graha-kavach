<?php
/**
 * wp-admin: the tracking box on each order, the settings page, and the order
 * statuses (Delivered, Partially Shipped, and "Shipped" as the label of Completed).
 *
 * @package GrahaKavach\Tracking
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin screens and AJAX.
 */
final class GKT_Admin {

	private const NONCE = 'gkt_admin';

	public static function init(): void {
		add_action( 'init', array( __CLASS__, 'register_statuses' ) );
		add_filter( 'wc_order_statuses', array( __CLASS__, 'order_statuses' ) );

		add_action( 'add_meta_boxes', array( __CLASS__, 'add_box' ) );
		add_action( 'wp_ajax_gkt_add', array( __CLASS__, 'ajax_add' ) );
		add_action( 'wp_ajax_gkt_remove', array( __CLASS__, 'ajax_remove' ) );
		add_action( 'wp_ajax_gkt_refresh', array( __CLASS__, 'ajax_refresh' ) );
		add_action( 'wp_ajax_gkt_test', array( __CLASS__, 'ajax_test' ) );

		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_post_gkt_save', array( __CLASS__, 'save_settings' ) );
	}

	/* ------------------------------------------------------------ statuses */

	public static function register_statuses(): void {
		foreach ( array(
			'wc-delivered'       => 'Delivered',
			'wc-partial-shipped' => 'Partially Shipped',
		) as $slug => $label ) {
			register_post_status(
				$slug,
				array(
					'label'                     => $label,
					'public'                    => false,
					'exclude_from_search'       => false,
					'show_in_admin_all_list'    => true,
					'show_in_admin_status_list' => true,
					/* translators: %s: number of orders */
					'label_count'               => _n_noop( $label . ' <span class="count">(%s)</span>', $label . ' <span class="count">(%s)</span>' ),
				)
			);
		}
	}

	/**
	 * @param array<string,string> $statuses Order statuses.
	 * @return array<string,string>
	 */
	public static function order_statuses( $statuses ) {
		$statuses['wc-delivered']       = 'Delivered';
		$statuses['wc-partial-shipped'] = 'Partially Shipped';
		// On this shop "Completed" means the parcel has left, so it is called Shipped.
		if ( empty( GKT_Providers::settings()['keep_completed_label'] ) ) {
			$statuses['wc-completed'] = 'Shipped';
		}
		return $statuses;
	}

	/* ------------------------------------------------------------ order box */

	public static function add_box(): void {
		$screen = function_exists( 'wc_get_page_screen_id' ) ? wc_get_page_screen_id( 'shop-order' ) : 'shop_order';
		add_meta_box( 'gkt_tracking', 'Shipment tracking', array( __CLASS__, 'render_box' ), $screen, 'side', 'high' );
	}

	/**
	 * @param mixed $post_or_order WP_Post or WC_Order.
	 */
	public static function render_box( $post_or_order ): void {
		$order = $post_or_order instanceof WP_Post ? wc_get_order( $post_or_order->ID ) : $post_or_order;
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		$id       = $order->get_id();
		$nonce    = wp_create_nonce( self::NONCE );
		$statuses = GKT_Store::statuses( $order );
		$labels   = GKT_Couriers::statuses();

		echo '<div id="gkt-box" data-order="' . esc_attr( (string) $id ) . '" data-nonce="' . esc_attr( $nonce ) . '">';

		foreach ( GKT_Store::items( $order ) as $item ) {
			$number  = (string) ( $item['tracking_number'] ?? '' );
			$courier = (string) ( $item['tracking_provider'] ?? '' );
			$live    = $statuses[ $number ] ?? array();
			$link    = GKT_Couriers::link( $courier, $number, (string) ( $item['custom_tracking_link'] ?? '' ) );

			echo '<div style="border:1px solid #dcdcde;border-radius:4px;padding:8px;margin-bottom:8px">';
			echo '<strong>' . esc_html( GKT_Couriers::label( $courier ) ) . '</strong> ';
			echo $link ? '<a href="' . esc_url( $link ) . '" target="_blank" rel="noopener">' . esc_html( $number ) . '</a>' : esc_html( $number );

			if ( $live ) {
				$key = (string) ( $live['status'] ?? 'unknown' );
				echo '<div style="margin-top:4px"><span style="background:' . ( 'delivered' === $key ? '#15803d' : '#2271b1' ) . ';color:#fff;border-radius:3px;padding:1px 6px;font-size:11px">' . esc_html( $labels[ $key ] ?? $key ) . '</span>';
				if ( ! empty( $live['eta'] ) && 'delivered' !== $key ) {
					echo ' <small>Expected ' . esc_html( (string) $live['eta'] ) . '</small>';
				}
				echo '</div>';
				if ( ! empty( $live['events'][0]['message'] ) ) {
					echo '<small style="display:block;margin-top:3px;color:#50575e">' . esc_html( (string) $live['events'][0]['message'] ) . '</small>';
				}
				if ( ! empty( $live['error'] ) ) {
					echo '<small style="display:block;margin-top:3px;color:#b32d2e">' . esc_html( (string) $live['error'] ) . '</small>';
				}
			} elseif ( ! empty( GKT_Couriers::all()[ $courier ]['live'] ) ) {
				echo '<small style="display:block;margin-top:4px;color:#50575e">Status will appear in a minute.</small>';
			}

			echo '<a href="#" class="gkt-remove" data-id="' . esc_attr( (string) ( $item['tracking_id'] ?? '' ) ) . '" style="color:#b32d2e;font-size:11px;display:inline-block;margin-top:4px">Remove</a>';
			echo '</div>';
		}

		echo '<p style="margin-bottom:4px"><select id="gkt-courier" style="width:100%">';
		foreach ( GKT_Couriers::all() as $slug => $meta ) {
			echo '<option value="' . esc_attr( $slug ) . '">' . esc_html( (string) $meta['label'] ) . '</option>';
		}
		echo '</select></p>';
		echo '<p style="margin:4px 0"><input type="text" id="gkt-number" placeholder="Tracking number" style="width:100%"></p>';
		echo '<p style="margin:4px 0"><input type="date" id="gkt-date" value="' . esc_attr( gmdate( 'Y-m-d', time() + (int) ( 5.5 * HOUR_IN_SECONDS ) ) ) . '" style="width:100%"></p>';
		echo '<p style="margin:6px 0"><button type="button" class="button button-primary" id="gkt-add">Add tracking</button> <button type="button" class="button" id="gkt-refresh">Refresh status</button></p>';
		echo '<small id="gkt-msg"></small></div>';

		?>
		<script>
		(function () {
			var box = document.getElementById('gkt-box');
			if (!box) { return; }
			function post(action, extra) {
				var body = new URLSearchParams(Object.assign({ action: action, order: box.dataset.order, nonce: box.dataset.nonce }, extra || {}));
				return fetch(ajaxurl, { method: 'POST', credentials: 'same-origin', body: body }).then(function (r) { return r.json(); });
			}
			function done(res) {
				var msg = document.getElementById('gkt-msg');
				msg.textContent = res && res.data && res.data.message ? res.data.message : '';
				if (res && res.success) { window.location.reload(); }
			}
			document.getElementById('gkt-add').addEventListener('click', function () {
				post('gkt_add', {
					courier: document.getElementById('gkt-courier').value,
					number: document.getElementById('gkt-number').value,
					date: document.getElementById('gkt-date').value
				}).then(done);
			});
			document.getElementById('gkt-refresh').addEventListener('click', function () {
				document.getElementById('gkt-msg').textContent = 'Checking with the courier...';
				post('gkt_refresh').then(done);
			});
			box.addEventListener('click', function (e) {
				if (e.target.classList.contains('gkt-remove')) {
					e.preventDefault();
					if (confirm('Remove this tracking number?')) { post('gkt_remove', { id: e.target.dataset.id }).then(done); }
				}
			});
		})();
		</script>
		<?php
	}

	private static function guard(): WC_Order {
		check_ajax_referer( self::NONCE, 'nonce' );
		if ( ! current_user_can( 'edit_shop_orders' ) ) {
			wp_send_json_error( array( 'message' => 'Not allowed.' ), 403 );
		}
		$order = wc_get_order( (int) ( $_POST['order'] ?? 0 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( ! $order ) {
			wp_send_json_error( array( 'message' => 'Order not found.' ), 404 );
		}
		return $order;
	}

	public static function ajax_add(): void {
		$order   = self::guard();
		$courier = sanitize_key( wp_unslash( $_POST['courier'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$number  = preg_replace( '/\s+/', '', sanitize_text_field( wp_unslash( $_POST['number'] ?? '' ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$date    = strtotime( sanitize_text_field( wp_unslash( $_POST['date'] ?? '' ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		if ( ! isset( GKT_Couriers::all()[ $courier ] ) || '' === $number ) {
			wp_send_json_error( array( 'message' => 'Choose a courier and enter the tracking number.' ) );
		}
		if ( '' === GKT_Store::add( $order, $courier, (string) $number, (int) $date ) ) {
			wp_send_json_error( array( 'message' => 'That tracking number is already on this order.' ) );
		}

		$order->add_order_note( sprintf( 'Order was shipped with %s and tracking number is: %s', GKT_Couriers::label( $courier ), $number ) );
		GKT_Sync::refresh_order( $order->get_id() );
		wp_send_json_success( array( 'message' => 'Added.' ) );
	}

	public static function ajax_remove(): void {
		$order = self::guard();
		GKT_Store::remove( $order, sanitize_text_field( wp_unslash( $_POST['id'] ?? '' ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		wp_send_json_success( array( 'message' => 'Removed.' ) );
	}

	public static function ajax_refresh(): void {
		$order  = self::guard();
		$errors = GKT_Sync::refresh_order( $order->get_id() );
		wp_send_json_success( array( 'message' => $errors ? implode( ' ', array_unique( $errors ) ) : 'Updated.' ) );
	}

	/* ------------------------------------------------------------ settings */

	public static function menu(): void {
		add_submenu_page( 'woocommerce', 'Shipment Tracking', 'Shipment Tracking', 'manage_woocommerce', 'gkt-settings', array( __CLASS__, 'render_settings' ) );
	}

	public static function ajax_test(): void {
		check_ajax_referer( self::NONCE, 'nonce' );
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => 'Not allowed.' ), 403 );
		}
		$courier = sanitize_key( wp_unslash( $_POST['courier'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$number  = sanitize_text_field( wp_unslash( $_POST['number'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$data    = GKT_Providers::fetch( $courier, $number );
		if ( is_wp_error( $data ) ) {
			wp_send_json_error( array( 'message' => $data->get_error_message() ) );
		}
		$labels = GKT_Couriers::statuses();
		wp_send_json_success(
			array(
				'message' => sprintf(
					'Working. Status: %s. Expected: %s. %d scan(s). Latest: %s',
					$labels[ $data['status'] ] ?? $data['status'],
					'' !== $data['eta'] ? $data['eta'] : 'not given',
					count( $data['events'] ),
					$data['events'][0]['message'] ?? 'none'
				),
			)
		);
	}

	public static function save_settings(): void {
		check_admin_referer( 'gkt_save' );
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( 'Not allowed.' );
		}

		$old = GKT_Providers::settings();
		$new = array(
			'delhivery_token'      => trim( sanitize_text_field( wp_unslash( $_POST['delhivery_token'] ?? '' ) ) ),
			'xpressbees_email'     => sanitize_email( wp_unslash( $_POST['xpressbees_email'] ?? '' ) ),
			'xpressbees_password'  => (string) wp_unslash( $_POST['xpressbees_password'] ?? '' ),
			'auto_delivered'       => empty( $_POST['auto_delivered'] ) ? 0 : 1,
			'keep_completed_label' => empty( $_POST['keep_completed_label'] ) ? 0 : 1,
		);
		// A blank secret keeps what is saved.
		foreach ( array( 'delhivery_token', 'xpressbees_password' ) as $secret ) {
			if ( '' === $new[ $secret ] ) {
				$new[ $secret ] = (string) ( $old[ $secret ] ?? '' );
			}
		}

		update_option( 'gkt_settings', $new, false );
		delete_transient( 'gkt_xb_token' );
		wp_safe_redirect( admin_url( 'admin.php?page=gkt-settings&saved=1' ) );
		exit;
	}

	public static function render_settings(): void {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		$s     = GKT_Providers::settings();
		$nonce = wp_create_nonce( self::NONCE );
		?>
		<div class="wrap">
			<h1>Shipment Tracking</h1>
			<?php if ( isset( $_GET['saved'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
				<div class="notice notice-success"><p>Saved.</p></div>
			<?php endif; ?>
			<p>Add a courier and tracking number on any order. The status then updates by itself every 4 hours from the courier's own tracking service, and appears on the Track Order page. Passwords and tokens stay blank after saving; leave a field empty to keep the saved value.</p>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="gkt_save">
				<?php wp_nonce_field( 'gkt_save' ); ?>
				<table class="form-table" role="presentation">
					<tr><th colspan="2"><h2>Delhivery</h2></th></tr>
					<tr><th scope="row"><label for="dt">API token</label></th>
						<td><input type="password" id="dt" name="delhivery_token" class="regular-text" autocomplete="off" placeholder="<?php echo ! empty( $s['delhivery_token'] ) ? '(saved)' : ''; ?>">
						<p class="description">Delhivery panel > Settings > API Setup.</p></td></tr>
					<tr><th colspan="2"><h2>Xpressbees</h2></th></tr>
					<tr><th scope="row"><label for="xe">Login email</label></th>
						<td><input type="email" id="xe" name="xpressbees_email" class="regular-text" autocomplete="off" value="<?php echo esc_attr( (string) ( $s['xpressbees_email'] ?? '' ) ); ?>"></td></tr>
					<tr><th scope="row"><label for="xp">Password</label></th>
						<td><input type="password" id="xp" name="xpressbees_password" class="regular-text" autocomplete="new-password" placeholder="<?php echo ! empty( $s['xpressbees_password'] ) ? '(saved)' : ''; ?>">
						<p class="description">The login you use to book parcels on Xpressbees.</p></td></tr>
					<tr><th colspan="2"><h2>Orders</h2></th></tr>
					<tr><th scope="row">Delivered</th>
						<td><label><input type="checkbox" name="auto_delivered" value="1" <?php checked( ! empty( $s['auto_delivered'] ) ); ?>> Move the order to <strong>Delivered</strong> when the courier says it is delivered. This also sends the WhatsApp delivered message and counts the cash balance as received.</label></td></tr>
					<tr><th scope="row">Status name</th>
						<td><label><input type="checkbox" name="keep_completed_label" value="1" <?php checked( ! empty( $s['keep_completed_label'] ) ); ?>> Keep WooCommerce's own name "Completed". Unticked, Completed is shown as <strong>Shipped</strong>.</label></td></tr>
				</table>
				<?php submit_button( 'Save settings' ); ?>
			</form>

			<h2>Test a tracking number</h2>
			<p>Save the settings first, then check that a real parcel comes back.</p>
			<p>
				<select id="gkt-t-courier">
					<option value="xpressbees">Xpressbees</option>
					<option value="delhivery">Delhivery</option>
				</select>
				<input type="text" id="gkt-t-number" class="regular-text" placeholder="Tracking number">
				<button type="button" class="button" id="gkt-t-go">Test</button>
			</p>
			<p id="gkt-t-out"></p>
			<script>
			document.getElementById('gkt-t-go').addEventListener('click', function () {
				var out = document.getElementById('gkt-t-out');
				out.textContent = 'Checking...';
				fetch(ajaxurl, { method: 'POST', credentials: 'same-origin', body: new URLSearchParams({
					action: 'gkt_test', nonce: '<?php echo esc_js( $nonce ); ?>',
					courier: document.getElementById('gkt-t-courier').value,
					number: document.getElementById('gkt-t-number').value
				}) }).then(function (r) { return r.json(); }).then(function (res) {
					out.textContent = (res.data && res.data.message) || 'No answer.';
					out.style.color = res.success ? '#15803d' : '#b32d2e';
				});
			});
			</script>
		</div>
		<?php
	}
}
