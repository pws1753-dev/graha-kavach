<?php
/**
 * Campaign landing pages.
 *
 * Every landing page is an ordinary WordPress page that sits under a private
 * "Landing Pages" parent. That one rule is what makes the editor show the
 * landing fields, the storefront serve the page at /lp/<slug> (the first one
 * keeps /book-now), and the policy-page list ignore it. Everything on a page
 * is edited in wp-admin: copy, images from the media library, and the SEO
 * title, description and social card through Yoast.
 *
 * Prices are not stored here. The storefront reads the live price from the
 * WooCommerce product chosen on the page and the advance from the Deposits
 * settings, and drops them into the copy through these tokens, so a page can
 * never show a figure the checkout does not charge:
 *
 *   {price}     offer price          {mrp}      regular price
 *   {discount}  mrp minus price      {advance}  amount paid now
 *   {balance}   price minus advance  {end}      offer end time, 12-hour
 *
 * Wrap words in **double asterisks** to make them bold.
 *
 * Starter content and images are written only into empty fields, from the
 * design supplied for the first campaign. After that, wp-admin owns them.
 *
 * @package GrahaKavach\HeadlessCore
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Landing pages: parent, lookup, field manifest, starter content, admin screen.
 */
final class GK_Landing {

	public const SLUG   = 'book-now';
	public const PARENT = 'lp';

	private const FLAG  = 'gk_landing_seeded_v1';
	private const MOVED = 'gk_landing_moved_v1';
	private const COPY_V2 = 'gk_landing_copy_v2';
	private const COPY_V3 = 'gk_landing_copy_v3';

	/**
	 * Cached parent page ID.
	 *
	 * @var int|null
	 */
	private static $parent_id = null;

	public static function init(): void {
		add_action( 'admin_init', array( __CLASS__, 'maybe_seed' ), 30 );
		add_action( 'admin_init', array( __CLASS__, 'maybe_update_copy' ), 40 );
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_post_gk_landing_new', array( __CLASS__, 'handle_new' ) );
		add_filter( 'display_post_states', array( __CLASS__, 'post_states' ), 10, 2 );
	}

	/* ------------------------------------------------------------------ *
	 * Lookup
	 * ------------------------------------------------------------------ */

	/**
	 * The private "Landing Pages" parent, created on first use.
	 */
	public static function parent_id(): int {
		if ( null !== self::$parent_id ) {
			return self::$parent_id;
		}

		$found = get_posts(
			array(
				'post_type'        => 'page',
				'post_status'      => array( 'publish', 'private', 'draft' ),
				'name'             => self::PARENT,
				'post_parent'      => 0,
				'numberposts'      => 1,
				'fields'           => 'ids',
				'suppress_filters' => true,
			)
		);

		if ( ! empty( $found ) ) {
			self::$parent_id = (int) $found[0];

			return self::$parent_id;
		}

		$id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_name'   => self::PARENT,
				'post_title'  => 'Landing Pages',
				'post_status' => 'private',
			)
		);

		self::$parent_id = is_wp_error( $id ) ? 0 : (int) $id;

		return self::$parent_id;
	}

	/**
	 * The landing page with this slug, or 0.
	 *
	 * @param string $slug      Page slug.
	 * @param bool   $published When true only a published page counts.
	 */
	public static function find( string $slug, bool $published = false ): int {
		$parent = self::parent_id();
		$slug   = sanitize_title( $slug );

		if ( ! $parent || '' === $slug ) {
			return 0;
		}

		$found = get_posts(
			array(
				'post_type'        => 'page',
				'post_status'      => $published ? 'publish' : array( 'publish', 'draft', 'pending', 'future', 'private' ),
				'name'             => $slug,
				'post_parent'      => $parent,
				'numberposts'      => 1,
				'fields'           => 'ids',
				'suppress_filters' => true,
			)
		);

		return empty( $found ) ? 0 : (int) $found[0];
	}

	/**
	 * Slugs of the published landing pages.
	 *
	 * @return string[]
	 */
	public static function slugs(): array {
		$parent = self::parent_id();
		if ( ! $parent ) {
			return array();
		}

		$posts = get_posts(
			array(
				'post_type'        => 'page',
				'post_status'      => 'publish',
				'post_parent'      => $parent,
				'numberposts'      => 200,
				'orderby'          => 'menu_order title',
				'order'            => 'ASC',
				'suppress_filters' => true,
			)
		);

		return array_values( array_map( static fn( $post ) => (string) $post->post_name, $posts ) );
	}

	/**
	 * Whether a post is a landing page.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function is_landing( int $post_id ): bool {
		$post = get_post( $post_id );

		return $post instanceof WP_Post
			&& 'page' === $post->post_type
			&& (int) $post->post_parent > 0
			&& (int) $post->post_parent === self::parent_id();
	}

	/**
	 * Storefront path of a landing page. The first campaign keeps its short URL.
	 *
	 * @param string $slug Page slug.
	 */
	public static function path( string $slug ): string {
		return self::SLUG === $slug ? '/book-now' : '/lp/' . $slug;
	}

	/**
	 * The first landing page (/book-now), created on first use.
	 */
	public static function page_id(): int {
		$id = self::find( self::SLUG );
		if ( $id ) {
			return $id;
		}

		$parent = self::parent_id();
		if ( ! $parent ) {
			return 0;
		}

		/*
		 * Never create a blank page while the real one exists elsewhere. If the
		 * campaign page was saved without its parent (it then lives at
		 * /book-now), put it back under "Landing Pages" instead of seeding an
		 * empty duplicate, which would replace the real content on the live site.
		 */
		$orphan = get_page_by_path( self::SLUG, OBJECT, 'page' );
		if ( $orphan instanceof WP_Post && 'trash' !== $orphan->post_status ) {
			wp_update_post(
				array(
					'ID'          => $orphan->ID,
					'post_parent' => $parent,
					'post_name'   => self::SLUG,
				)
			);

			return (int) $orphan->ID;
		}

		$created = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_name'   => self::SLUG,
				'post_title'  => 'Book Now',
				'post_status' => 'publish',
				'post_parent' => $parent,
			)
		);

		return is_wp_error( $created ) ? 0 : (int) $created;
	}

	/* ------------------------------------------------------------------ *
	 * Field manifest
	 * ------------------------------------------------------------------ */

	/**
	 * Field manifest.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function fields(): array {
		$tokens = 'Tokens: {price} {mrp} {discount} {advance} {balance} {end}. Wrap words in **double asterisks** for bold.';

		return array(
			// ---- Page settings -------------------------------------------
			array( 'name' => 'lp_product_slug', 'label' => 'WooCommerce product', 'type' => 'text', 'gql' => 'productSlug', 'tab' => 'Page settings', 'hint' => 'Slug of the WooCommerce product this page sells (the last part of its product address). The price, the discount and the payment come from this product. Leave empty for the main kit, graha-kavach-complete-fire-safety-kit.' ),
			array( 'name' => 'lp_hide_timer', 'label' => 'Hide the countdown', 'type' => 'true_false', 'gql' => 'hideTimer', 'tab' => 'Page settings', 'hint' => 'Tick for a campaign with no deadline. Every timer disappears from the page and the booking steps.' ),

			// ---- Offer & timer -------------------------------------------
			array( 'name' => 'lp_topbar_text', 'label' => 'Top bar text', 'type' => 'text', 'gql' => 'topbarText', 'tab' => 'Offer & timer', 'hint' => $tokens ),
			array( 'name' => 'lp_end_time', 'label' => 'Offer ends daily at', 'type' => 'text', 'gql' => 'endTime', 'tab' => 'Offer & timer', 'hint' => '24-hour time, India time, e.g. 23:59. The countdown restarts every day unless a fixed end below is set.' ),
			array( 'name' => 'lp_cycle_days', 'label' => 'Cycle days', 'type' => 'text', 'gql' => 'cycleDays', 'tab' => 'Offer & timer', 'hint' => 'Rolling countdown: it resets every this-many days (default 3), counted from 8 Nov 2026 00:00 India time, and starts the next cycle the moment it reaches zero. Enter 0 to use the daily cut-off above instead.' ),
			array( 'name' => 'lp_ends_at', 'label' => 'Fixed offer end (optional)', 'type' => 'text', 'gql' => 'endsAt', 'tab' => 'Offer & timer', 'hint' => 'Leave empty for the rolling cycle. India time, format YYYY-MM-DD HH:MM, e.g. 2026-11-10 23:59. Used only until that moment passes; after it the rolling cycle takes over, so the timer never sits at 00:00:00.' ),
			array( 'name' => 'lp_timer_label', 'label' => 'Countdown label', 'type' => 'text', 'gql' => 'timerLabel', 'tab' => 'Offer & timer' ),
			array( 'name' => 'lp_timer_units', 'label' => 'Countdown units', 'type' => 'text', 'gql' => 'timerUnits', 'tab' => 'Offer & timer', 'hint' => 'Words separated by commas: days, hours, minutes, seconds. Days appear only when a fixed offer end is set.' ),
			array( 'name' => 'lp_sticky_label', 'label' => 'Sticky bar label', 'type' => 'text', 'gql' => 'stickyLabel', 'tab' => 'Offer & timer', 'hint' => $tokens ),
			array( 'name' => 'lp_lock_label', 'label' => 'Booking steps: time-left label', 'type' => 'text', 'gql' => 'lockLabel', 'tab' => 'Offer & timer' ),

			// ---- Header & buttons ----------------------------------------
			array( 'name' => 'lp_header_tagline', 'label' => 'Header tagline', 'type' => 'text', 'gql' => 'headerTagline', 'tab' => 'Header & buttons' ),
			array( 'name' => 'lp_cta_short', 'label' => 'Header button', 'type' => 'text', 'gql' => 'ctaShort', 'tab' => 'Header & buttons' ),
			array( 'name' => 'lp_cta_label', 'label' => 'Main button', 'type' => 'text', 'gql' => 'ctaLabel', 'tab' => 'Header & buttons', 'hint' => $tokens ),
			array( 'name' => 'lp_cta_sticky', 'label' => 'Sticky bar button', 'type' => 'text', 'gql' => 'ctaSticky', 'tab' => 'Header & buttons', 'hint' => $tokens ),
			array( 'name' => 'lp_cta_offer', 'label' => 'Offer box button', 'type' => 'text', 'gql' => 'ctaOffer', 'tab' => 'Header & buttons' ),

			// ---- Hero ------------------------------------------------------
			array( 'name' => 'lp_hero_badge', 'label' => 'Badge', 'type' => 'text', 'gql' => 'heroBadge', 'tab' => 'Hero' ),
			array( 'name' => 'lp_hero_title_1', 'label' => 'Headline, first line', 'type' => 'text', 'gql' => 'heroTitleBefore', 'tab' => 'Hero' ),
			array( 'name' => 'lp_hero_title_hl', 'label' => 'Headline, red words', 'type' => 'text', 'gql' => 'heroTitleHighlight', 'tab' => 'Hero' ),
			array( 'name' => 'lp_hero_title_2', 'label' => 'Headline, rest', 'type' => 'text', 'gql' => 'heroTitleAfter', 'tab' => 'Hero' ),
			array( 'name' => 'lp_hero_text', 'label' => 'Intro', 'type' => 'textarea', 'gql' => 'heroText', 'tab' => 'Hero', 'hint' => $tokens ),
			array( 'name' => 'lp_hero_image', 'label' => 'Kit image', 'type' => 'image', 'gql' => 'heroImage', 'tab' => 'Hero', 'hint' => 'Square, 900x900 or larger. Set the alt text in the media library.' ),
			array( 'name' => 'lp_hero_image_tag', 'label' => 'Image tag', 'type' => 'text', 'gql' => 'heroImageTag', 'tab' => 'Hero' ),
			array( 'name' => 'lp_price_chip', 'label' => 'Price chip on the image', 'type' => 'text', 'gql' => 'priceChip', 'tab' => 'Hero', 'hint' => 'Small yellow chip above the price, e.g. {discount} OFF. Shown only when the product has a sale price. ' . $tokens ),
			array( 'name' => 'lp_now_label', 'label' => 'Pay-now card: label', 'type' => 'text', 'gql' => 'nowLabel', 'tab' => 'Hero' ),
			array( 'name' => 'lp_now_note', 'label' => 'Pay-now card: note', 'type' => 'text', 'gql' => 'nowNote', 'tab' => 'Hero' ),
			array( 'name' => 'lp_later_label', 'label' => 'Pay-on-delivery card: label', 'type' => 'text', 'gql' => 'laterLabel', 'tab' => 'Hero' ),
			array( 'name' => 'lp_later_note', 'label' => 'Pay-on-delivery card: note', 'type' => 'text', 'gql' => 'laterNote', 'tab' => 'Hero' ),
			array( 'name' => 'lp_hero_trust', 'label' => 'Trust line', 'type' => 'structured', 'gql' => 'heroTrust', 'gqltype' => 'GrahaKavachTextRow', 'shape' => array( 'text' ), 'tab' => 'Hero' ),
			array( 'name' => 'lp_ticker', 'label' => 'Red ticker', 'type' => 'structured', 'gql' => 'ticker', 'gqltype' => 'GrahaKavachTextRow', 'shape' => array( 'text' ), 'tab' => 'Hero', 'hint' => $tokens ),

			// ---- Why -------------------------------------------------------
			array( 'name' => 'lp_why_eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'gql' => 'whyEyebrow', 'tab' => 'Why it matters', 'hint' => 'Leave the whole tab empty to hide this section.' ),
			array( 'name' => 'lp_why_title', 'label' => 'Heading', 'type' => 'text', 'gql' => 'whyTitle', 'tab' => 'Why it matters' ),
			array( 'name' => 'lp_stat_big', 'label' => 'Big statistic', 'type' => 'text', 'gql' => 'statBig', 'tab' => 'Why it matters' ),
			array( 'name' => 'lp_stat_text', 'label' => 'Statistic text', 'type' => 'textarea', 'gql' => 'statText', 'tab' => 'Why it matters' ),
			array( 'name' => 'lp_stat_source', 'label' => 'Statistic source', 'type' => 'text', 'gql' => 'statSource', 'tab' => 'Why it matters' ),
			array( 'name' => 'lp_why_points', 'label' => 'Numbered points', 'type' => 'structured', 'gql' => 'whyPoints', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'Why it matters' ),

			// ---- Kit -------------------------------------------------------
			array( 'name' => 'lp_kit_eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'gql' => 'kitEyebrow', 'tab' => 'What is in the kit', 'hint' => 'Leave the whole tab empty to hide this section.' ),
			array( 'name' => 'lp_kit_title', 'label' => 'Heading', 'type' => 'text', 'gql' => 'kitTitle', 'tab' => 'What is in the kit' ),
			array( 'name' => 'lp_kit_items', 'label' => 'Kit items', 'type' => 'structured', 'gql' => 'kitItems', 'gqltype' => 'GrahaKavachTitleTextFocusRow', 'shape' => array( 'title', 'text', 'focus' ), 'tab' => 'What is in the kit', 'hint' => 'FOCUS is the crop position of the thumbnail, e.g. 30% 50%. Images below are matched to items in order.' ),
			array( 'name' => 'lp_kit_images', 'label' => 'Kit item images', 'type' => 'gallery_rel', 'gql' => 'kitImages', 'tab' => 'What is in the kit', 'hint' => 'One image per kit item, in the same order. Wide images (16:9) crop best.' ),
			array( 'name' => 'lp_kit_extra', 'label' => 'Also included', 'type' => 'textarea', 'gql' => 'kitExtra', 'tab' => 'What is in the kit' ),
			array( 'name' => 'lp_kit_badges', 'label' => 'Certification chips', 'type' => 'structured', 'gql' => 'kitBadges', 'gqltype' => 'GrahaKavachTextRow', 'shape' => array( 'text' ), 'tab' => 'What is in the kit' ),

			// ---- Offer box -------------------------------------------------
			array( 'name' => 'lp_offer_title', 'label' => 'Offer box heading', 'type' => 'text', 'gql' => 'offerTitle', 'tab' => 'Offer box', 'hint' => $tokens . ' Leave the points empty to hide this section.' ),
			array( 'name' => 'lp_offer_points', 'label' => 'Offer points', 'type' => 'structured', 'gql' => 'offerPoints', 'gqltype' => 'GrahaKavachTextRow', 'shape' => array( 'text' ), 'tab' => 'Offer box', 'hint' => $tokens ),
			array( 'name' => 'lp_offer_note', 'label' => 'Offer note', 'type' => 'text', 'gql' => 'offerNote', 'tab' => 'Offer box', 'hint' => $tokens . ' {timer} shows the live countdown.' ),

			// ---- Steps -----------------------------------------------------
			array( 'name' => 'lp_steps_title', 'label' => 'Heading', 'type' => 'text', 'gql' => 'stepsTitle', 'tab' => 'How booking works', 'hint' => 'Leave the steps empty to hide this section.' ),
			array( 'name' => 'lp_steps', 'label' => 'Steps', 'type' => 'structured', 'gql' => 'steps', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'How booking works', 'hint' => $tokens ),

			// ---- Where it goes ---------------------------------------------
			array( 'name' => 'lp_where_title', 'label' => 'Heading', 'type' => 'text', 'gql' => 'whereTitle', 'tab' => 'Where it goes', 'hint' => 'Leave the tab empty to hide the pictures. Reviews and the trust note below still show.' ),
			array( 'name' => 'lp_where_image', 'label' => 'Main image', 'type' => 'image', 'gql' => 'whereImage', 'tab' => 'Where it goes', 'hint' => 'Square, 900x900 or larger.' ),
			array( 'name' => 'lp_where_caption', 'label' => 'Main image caption', 'type' => 'text', 'gql' => 'whereCaption', 'tab' => 'Where it goes' ),
			array( 'name' => 'lp_where_tiles', 'label' => 'Small tiles', 'type' => 'structured', 'gql' => 'whereTiles', 'gqltype' => 'GrahaKavachLabelFocusRow', 'shape' => array( 'label', 'focus' ), 'tab' => 'Where it goes', 'hint' => 'FOCUS is the crop position, e.g. 70% 50%. Images below are matched to tiles in order.' ),
			array( 'name' => 'lp_where_tile_images', 'label' => 'Tile images', 'type' => 'gallery_rel', 'gql' => 'whereTileImages', 'tab' => 'Where it goes' ),

			// ---- Reviews & trust -------------------------------------------
			array( 'name' => 'lp_reviews', 'label' => 'Customer reviews', 'type' => 'structured', 'gql' => 'reviews', 'gqltype' => 'GrahaKavachQuoteRow', 'shape' => array( 'quote', 'name' ), 'tab' => 'Reviews & trust', 'hint' => 'Real customer words only. The section is hidden while this is empty.' ),
			array( 'name' => 'lp_trust_bold', 'label' => 'Trust note, bold part', 'type' => 'text', 'gql' => 'trustBold', 'tab' => 'Reviews & trust' ),
			array( 'name' => 'lp_trust_text', 'label' => 'Trust note', 'type' => 'textarea', 'gql' => 'trustText', 'tab' => 'Reviews & trust' ),

			// ---- FAQ -------------------------------------------------------
			array( 'name' => 'lp_faq_title', 'label' => 'Heading', 'type' => 'text', 'gql' => 'faqTitle', 'tab' => 'FAQ' ),
			array( 'name' => 'lp_faqs', 'label' => 'Questions', 'type' => 'structured', 'gql' => 'faqs', 'gqltype' => 'GrahaKavachQaRow', 'shape' => array( 'q', 'a' ), 'tab' => 'FAQ', 'hint' => 'These are also published to Google as FAQ structured data. Leave empty to hide the section. Use {br} inside an answer for a new line. ' . $tokens ),

			// ---- Closing ---------------------------------------------------
			array( 'name' => 'lp_final_kicker', 'label' => 'Closing: label above timer', 'type' => 'text', 'gql' => 'finalKicker', 'tab' => 'Closing', 'hint' => 'Shown only while the countdown is on.' ),
			array( 'name' => 'lp_final_title', 'label' => 'Closing heading', 'type' => 'text', 'gql' => 'finalTitle', 'tab' => 'Closing' ),
			array( 'name' => 'lp_final_text', 'label' => 'Closing text', 'type' => 'text', 'gql' => 'finalText', 'tab' => 'Closing' ),
			array( 'name' => 'lp_contact_label', 'label' => 'Contact line', 'type' => 'text', 'gql' => 'contactLabel', 'tab' => 'Closing' ),
			array( 'name' => 'lp_phone', 'label' => 'Phone / WhatsApp number', 'type' => 'text', 'gql' => 'phone', 'tab' => 'Closing', 'hint' => 'Ten digits, no country code.' ),
			array( 'name' => 'lp_footer_text', 'label' => 'Footer text', 'type' => 'textarea', 'gql' => 'footerText', 'tab' => 'Closing' ),

			// ---- Booking steps ---------------------------------------------
			array( 'name' => 'lp_d_title', 'label' => 'Step 1 heading', 'type' => 'text', 'gql' => 'detailsTitle', 'tab' => 'Booking steps' ),
			array( 'name' => 'lp_d_sub', 'label' => 'Step 1 sub-heading', 'type' => 'text', 'gql' => 'detailsSub', 'tab' => 'Booking steps' ),
			array( 'name' => 'lp_d_note', 'label' => 'Step 1 privacy note', 'type' => 'text', 'gql' => 'detailsNote', 'tab' => 'Booking steps' ),
			array( 'name' => 'lp_p_title', 'label' => 'Step 2 heading', 'type' => 'text', 'gql' => 'payTitle', 'tab' => 'Booking steps', 'hint' => $tokens ),
			array( 'name' => 'lp_p_secure', 'label' => 'Step 2 secure-payment note', 'type' => 'text', 'gql' => 'paySecure', 'tab' => 'Booking steps' ),
			array( 'name' => 'lp_done_title', 'label' => 'Confirmed heading', 'type' => 'text', 'gql' => 'doneTitle', 'tab' => 'Booking steps' ),
			array( 'name' => 'lp_done_text', 'label' => 'Confirmed text', 'type' => 'textarea', 'gql' => 'doneText', 'tab' => 'Booking steps', 'hint' => $tokens ),
			array( 'name' => 'lp_done_steps', 'label' => 'What happens next', 'type' => 'structured', 'gql' => 'doneSteps', 'gqltype' => 'GrahaKavachTextRow', 'shape' => array( 'text' ), 'tab' => 'Booking steps', 'hint' => $tokens ),
			array( 'name' => 'lp_done_wa_label', 'label' => 'WhatsApp button', 'type' => 'text', 'gql' => 'doneWhatsappLabel', 'tab' => 'Booking steps' ),
			array( 'name' => 'lp_wa_keyword', 'label' => 'WhatsApp keyword', 'type' => 'text', 'gql' => 'whatsappKeyword', 'tab' => 'Booking steps' ),
			array( 'name' => 'lp_done_home_label', 'label' => 'Back-to-page link', 'type' => 'text', 'gql' => 'doneHomeLabel', 'tab' => 'Booking steps' ),
		);
	}

	/* ------------------------------------------------------------------ *
	 * Starter content
	 * ------------------------------------------------------------------ */

	/**
	 * Starter copy, from the supplied design. Only written into empty fields.
	 *
	 * Reviews are deliberately absent: the design carried placeholders, and a
	 * review must be a real customer's words. The cancellation / refund FAQ is
	 * absent for the same reason: the policy wording belongs to the business.
	 *
	 * @return array<string,string>
	 */
	private static function copy(): array {
		return array(
			'lp_topbar_text'     => 'Limited Time Offer · {discount} OFF',
			'lp_end_time'        => '23:59',
			'lp_timer_label'     => 'Limited Time Offer ख़त्म होने में',
			'lp_timer_units'     => 'दिन, घंटे, मिनट, सेकंड',
			'lp_sticky_label'    => 'Offer ख़त्म होने में',
			'lp_lock_label'      => 'ऑफ़र लॉक करने के लिए बचा समय',

			'lp_header_tagline'  => 'By Speciality Geochem, Udaipur',
			'lp_cta_short'       => 'Book Now',
			'lp_cta_label'       => 'Book Now — सिर्फ़ {advance}',
			'lp_cta_sticky'      => 'Book Now · {advance}',
			'lp_cta_offer'       => 'Offer Price पर Book Now',

			'lp_hero_badge'      => '⏳ Limited Time Offer',
			'lp_hero_title_1'    => 'छोटी आग को बड़ा हादसा बनने से पहले रोकिए,',
			'lp_hero_title_hl'   => 'पहले 60 Seconds',
			'lp_hero_title_2'    => 'में।',
			'lp_hero_text'       => 'Fire Brigade के पहुँचने से पहले आग पर काबू पाने के लिए ज़रूरी सब कुछ, एक ही Kit में। Limited Time Offer में पाएँ **{mrp} की Kit सिर्फ़ {price} में**। Booking सिर्फ़ {advance} से।',
			'lp_hero_image_tag'  => '3-IN-1 KIT',
			'lp_price_chip'      => '{discount} OFF',
			'lp_now_label'       => 'अभी सिर्फ़',
			'lp_now_note'        => 'में Booking Confirm',
			'lp_later_label'     => 'डिलीवरी पर',
			'lp_later_note'      => 'Kit मिलने पर, Cash या UPI से',
			'lp_hero_trust'      => "✓ पूरे भारत में Free Delivery\n✓ Cash on Delivery\n✓ Certified Product",
			'lp_ticker'          => "Limited Time Offer: {discount} OFF\nBooking सिर्फ़ {advance}\nबाक़ी {balance} Delivery पर\nFree Delivery\nCash on Delivery",

			'lp_why_eyebrow'     => 'Fire Safety · हर घर की ज़रूरत',
			'lp_why_title'       => 'Fire Brigade के पहुँचने से पहले, पहला क़दम आपको ही उठाना होता है।',
			'lp_stat_big'        => '10 में से 6 मौतें घरों में',
			'lp_stat_text'       => '2024 में आग से हुई 5,888 मौतों में से 3,585 मौतें घरों और रिहायशी इमारतों में हुईं।',
			'lp_stat_source'     => 'स्रोत: NCRB, Accidental Deaths & Suicides in India 2024',
			'lp_why_points'      => "त्योहारों के दीये, लड़ियाँ और पटाखे|त्योहारों के दिनों में आग लगने का ख़तरा कई गुना बढ़ जाता है। समय रहते अपने घर को तैयार कर लीजिए।\nरसोई की कढ़ाई, LPG, गीज़र, AC, इन्वर्टर|तेल और बिजली की आग पर पानी डालने से ख़तरा और बढ़ जाता है। इसलिए सही Fire Safety उपकरण पास होना ज़रूरी है।\nघर में बच्चे और बड़े-बुज़ुर्ग|छोटी आग को शुरुआत में ही रोक लेने से उन्हें सुरक्षित बाहर निकलने का पूरा समय मिलता है।",

			'lp_kit_eyebrow'     => 'Kit में क्या-क्या है',
			'lp_kit_title'       => 'एक Kit, तीन तरह की सुरक्षा — घर में लगने वाली आम आग के लिए।',
			'lp_kit_items'       => "2 किलो ABC फ़ायर एक्सटिंग्विशर|लकड़ी, कपड़ा, कागज़, ज्वलनशील तरल, LPG और बिजली की आग के लिए। 10–12 Seconds Discharge Time, 3–4 मीटर Range, Wall Bracket साथ में।|30% 50%\nAutomatic Fire Ball, 1.3 किलो|आग के संपर्क में आने पर अपने-आप Activate होकर आग बुझाने में मदद करती है, तब भी जब आप घर पर न हों। 5 साल की Shelf Life।|25% 50%\nFire Blanket, 1 × 1 मीटर|Fiberglass से बना, 550 °C तक सुरक्षित। कढ़ाई या कपड़ों में लगी छोटी आग को ढककर तुरंत बुझाने के लिए।|70% 50%",
			'lp_kit_extra'       => 'साथ में: Extinguisher Wall Bracket, Fire Ball Stand, 5 Screws, 5 Wall Plugs और Printed Safety Guide।',
			'lp_kit_badges'      => "Certified Product\nISO 9001:2015\nNational Test House\nMSME ZED\nउदयपुर में निर्मित",

			'lp_offer_title'     => 'Limited Time Offer में आपको मिलेगा',
			'lp_offer_points'    => "{discount} की छूट: {mrp} की Kit सिर्फ़ {price} में\nसिर्फ़ {advance} में Booking Confirm, बाक़ी {balance} Delivery पर\nपूरे भारत में Free Delivery\nPrinted Safety Guide और Installation Kit साथ में",
			'lp_offer_note'      => 'Offer ख़त्म होते ही Kit की क़ीमत फिर से {mrp} हो जाएगी। {timer} बाक़ी।',

			'lp_steps_title'     => 'सिर्फ़ 1 मिनट में Booking करें',
			'lp_steps'           => "{advance} देकर आज ही Book करें|अपना नाम, मोबाइल नंबर और पता भरें, फिर UPI, Card या Net Banking से {advance} Pay करें।\nKit आपके घर पहुँचेगी|7–10 दिनों में Free Delivery, Courier के ज़रिए। Tracking Details WhatsApp पर मिलेंगी।\nबाक़ी {balance} Delivery पर दें|Kit मिलने पर Cash या UPI QR से Payment करें। कुल क़ीमत {price}।",

			'lp_where_title'    => 'घर में कहाँ लगाएँ?',
			'lp_where_caption'  => 'रसोई में Fire Blanket · गलियारे में Extinguisher · मीटर/Inverter के पास Fire Ball',
			'lp_where_tiles'    => "रसोई|70% 50%\nगलियारा|30% 50%\nमीटर / इन्वर्टर|25% 50%",

			'lp_trust_bold'     => 'Fire Safety में 16 साल का भरोसा।',
			'lp_trust_text'     => 'Speciality Geochem, उदयपुर — जो कंपनी सालों से Factories और Offices को Fire Safety Solutions दे रही है, अब आपके घर की सुरक्षा के लिए।',

			'lp_faq_title'      => 'अक्सर पूछे जाने वाले सवाल',
			'lp_faqs'           => "घर में Fire Safety Kit क्यों ज़रूरी है?|आग लगने के शुरुआती कुछ पल सबसे अहम होते हैं। Fire Brigade के पहुँचने से पहले छोटी आग पर काबू पाने और परिवार को सुरक्षित बाहर निकालने के लिए घर में सही उपकरण होना ज़रूरी है। सही समय पर उठाया गया एक क़दम किसी की जान बचा सकता है।\n{advance} के बाद बाक़ी Payment कब करना है?|बाक़ी {balance} Kit की Delivery के समय Cash या UPI से दें। कुल क़ीमत {price}।\nक्या यह छोटे Flat या किराये के घर के लिए सही है?|हाँ। Kit आसानी से दीवार पर Screws से लग जाती है, और घर बदलने पर आप इसे अपने साथ ले जा सकते हैं।\nक्या यह Kit Fire Brigade की जगह ले सकती है?|नहीं। यह Kit शुरुआती छोटी आग पर काबू पाने के लिए है। आग बड़ी हो तो सबसे पहले सभी को सुरक्षित बाहर निकालें और तुरंत 101 (Fire) या 112 पर कॉल करें।\nDelivery कितने दिनों में होगी?|Order Confirm होने के बाद 7–10 दिनों में Kit आपके घर पहुँच जाएगी। Tracking Details WhatsApp पर भेजी जाएँगी।\nReturn और Refund Policy क्या है?|**Damaged या गलत Product:** Product, Packaging, Shipping Label की Photos और Order Details के साथ तुरंत Support से संपर्क करें।{br}**Return Request:** Order Details, Product और Packaging की Photos और Return का कारण भेजें।{br}**Non-returnable:** Installed, Used, Discharged, Tampered, Incomplete, Expired या Customer द्वारा Damage किए गए Products Return/Refund के योग्य नहीं होंगे।{br}**Refund:** Approved Refund 7–10 दिनों में Original Payment Mode से किया जाएगा।{br}**Replacement:** Verified Transit Damage या गलत Dispatch होने पर Refund की जगह Replacement दिया जाएगा।",

			'lp_final_kicker'   => 'Limited Time Offer ख़त्म होने में',
			'lp_final_title'    => 'आपके परिवार की सुरक्षा, आपके हाथ में।',
			'lp_final_text'     => 'आग किसी भी दिन, किसी भी पल लग सकती है। आज ही अपने घर और परिवार को सुरक्षित करें।',
			'lp_contact_label'  => 'कोई सवाल? WhatsApp या Call करें:',
			'lp_phone'          => '7891111390',
			'lp_footer_text'    => "Speciality Geochem, उदयपुर · 16 साल\ngrahakavach.in",

			'lp_d_title'        => 'किट कहाँ भेजें?',
			'lp_d_sub'          => 'सिर्फ़ 5 चीज़ें भरनी हैं।',
			'lp_d_note'         => 'आपकी जानकारी सिर्फ़ डिलीवरी के लिए इस्तेमाल होगी।',
			'lp_p_title'        => '{advance} देकर बुकिंग पक्की करें',
			'lp_p_secure'       => 'सुरक्षित भुगतान · Razorpay',
			'lp_done_title'     => 'बुकिंग हो गई।',
			'lp_done_text'      => '{advance} मिल गए। आपकी Graha Kavach किट आज के ऑफ़र के साथ बुक है: {mrp} की किट {price} में।',
			'lp_done_steps'     => "WhatsApp पर बुकिंग की पुष्टि आएगी।\nकिट कूरियर से आपके पते पर पहुँचेगी; ट्रैकिंग WhatsApp पर मिलेगी।\nडिलीवरी पर बाक़ी {balance} दें।",
			'lp_done_wa_label'  => 'WhatsApp पर KAVACH भेजें',
			'lp_wa_keyword'     => 'KAVACH',
			'lp_done_home_label' => 'होम पर वापस जाएँ',
		);
	}

	/**
	 * Bundled image file => media library title and alt text.
	 *
	 * @return array<string,array{alt:string,title:string}>
	 */
	private static function assets(): array {
		return array(
			'hero-kit.jpg'          => array( 'title' => 'Graha Kavach 3-in-1 kit', 'alt' => 'Graha Kavach 3-in-1 किट: फ़ायर एक्सटिंग्विशर, फ़ायर बॉल, फ़ायर ब्लैंकेट' ),
			'kit-extinguisher.jpg'  => array( 'title' => 'ABC fire extinguisher', 'alt' => '2 किलो ABC फ़ायर एक्सटिंग्विशर' ),
			'kit-fireball.jpg'      => array( 'title' => 'Automatic fire ball', 'alt' => 'ऑटोमैटिक फ़ायर बॉल' ),
			'kit-blanket.jpg'       => array( 'title' => 'Fire blanket', 'alt' => 'फ़ायर ब्लैंकेट' ),
			'where-to-place.jpg'    => array( 'title' => 'Where to place the kit', 'alt' => 'रसोई में फ़ायर ब्लैंकेट, गलियारे में एक्सटिंग्विशर, मीटर के पास फ़ायर बॉल' ),
		);
	}

	/**
	 * Copy a bundled image into the media library, once.
	 *
	 * @param string $file Filename inside assets/landing.
	 * @return int Attachment ID, or 0.
	 */
	private static function import_image( string $file ): int {
		$existing = get_posts(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'inherit',
				'numberposts' => 1,
				'fields'      => 'ids',
				'meta_key'    => '_gk_seed_asset', // phpcs:ignore WordPress.DB.SlowDBQuery
				'meta_value'  => $file, // phpcs:ignore WordPress.DB.SlowDBQuery
			)
		);

		if ( ! empty( $existing ) ) {
			return (int) $existing[0];
		}

		$source = GK_HEADLESS_DIR . 'assets/landing/' . $file;
		$meta   = self::assets()[ $file ] ?? array( 'title' => $file, 'alt' => '' );

		if ( ! is_readable( $source ) ) {
			return 0;
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		// media_handle_sideload() moves the file, so hand it a temporary copy.
		$tmp = wp_tempnam( $file );
		if ( ! $tmp || ! copy( $source, $tmp ) ) {
			return 0;
		}

		$id = media_handle_sideload(
			array(
				'name'     => $file,
				'tmp_name' => $tmp,
			),
			0,
			$meta['title']
		);

		if ( is_wp_error( $id ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			@unlink( $tmp );

			return 0;
		}

		update_post_meta( (int) $id, '_wp_attachment_image_alt', $meta['alt'] );
		update_post_meta( (int) $id, '_gk_seed_asset', $file );

		return (int) $id;
	}

	/**
	 * Write the starter copy and images into the empty fields of a landing page.
	 *
	 * @param int $page_id Landing page ID.
	 */
	public static function apply_starter( int $page_id ): void {
		if ( ! function_exists( 'update_field' ) ) {
			return;
		}

		$empty = static function ( string $name ) use ( $page_id ): bool {
			$value = get_post_meta( $page_id, $name, true );

			return '' === $value || null === $value || array() === $value;
		};

		foreach ( self::copy() as $name => $value ) {
			if ( $empty( $name ) ) {
				update_field( $name, $value, $page_id );
			}
		}

		$images = array();
		foreach ( array_keys( self::assets() ) as $file ) {
			$images[ $file ] = self::import_image( $file );
		}

		$single = array(
			'lp_hero_image'  => $images['hero-kit.jpg'] ?? 0,
			'lp_where_image' => $images['where-to-place.jpg'] ?? 0,
		);
		$lists  = array(
			'lp_kit_images'        => array( $images['kit-extinguisher.jpg'] ?? 0, $images['kit-fireball.jpg'] ?? 0, $images['kit-blanket.jpg'] ?? 0 ),
			'lp_where_tile_images' => array( $images['kit-blanket.jpg'] ?? 0, $images['kit-extinguisher.jpg'] ?? 0, $images['kit-fireball.jpg'] ?? 0 ),
		);

		foreach ( $single as $name => $id ) {
			if ( $id && $empty( $name ) ) {
				update_field( $name, $id, $page_id );
			}
		}
		foreach ( $lists as $name => $ids ) {
			$ids = array_values( array_filter( $ids ) );
			if ( $ids && $empty( $name ) ) {
				update_field( $name, $ids, $page_id );
			}
		}
	}

	/**
	 * One-time set-up: move an older top-level /book-now page under the parent,
	 * write the starter content and the first page's Yoast defaults.
	 */
	public static function maybe_seed(): void {
		if ( ! current_user_can( 'edit_pages' ) ) {
			return;
		}

		// The first version created /book-now at the top level of the page tree.
		if ( ! get_option( self::MOVED ) ) {
			$parent = self::parent_id();
			$old    = get_page_by_path( self::SLUG, OBJECT, 'page' );

			if ( $parent && $old instanceof WP_Post && 0 === (int) $old->post_parent ) {
				wp_update_post(
					array(
						'ID'          => $old->ID,
						'post_parent' => $parent,
					)
				);
			}
			if ( $parent ) {
				update_option( self::MOVED, gmdate( 'c' ), false );
			}
		}

		if ( get_option( self::FLAG ) || ! function_exists( 'update_field' ) ) {
			return;
		}

		$page_id = self::page_id();
		if ( ! $page_id ) {
			return;
		}

		self::apply_starter( $page_id );

		// Yoast SEO: starting title and description, editable in the page's Yoast box.
		$seo = array(
			'_yoast_wpseo_title'    => 'Graha Kavach 3-in-1 फ़ायर सेफ़्टी किट: ₹199 में बुक करें',
			'_yoast_wpseo_metadesc' => 'Graha Kavach 3-in-1 होम फ़ायर सेफ़्टी किट सिर्फ़ ₹199 में बुक करें: फ़ायर एक्सटिंग्विशर, फ़ायर बॉल और फ़ायर ब्लैंकेट। मुफ़्त डिलीवरी, कैश ऑन डिलीवरी।',
			'_yoast_wpseo_focuskw'  => 'फ़ायर सेफ़्टी किट',
		);
		foreach ( $seo as $key => $value ) {
			if ( '' === (string) get_post_meta( $page_id, $key, true ) ) {
				update_post_meta( $page_id, $key, $value );
			}
		}

		update_option( self::FLAG, gmdate( 'c' ), false );
	}

	/**
	 * One-time: replace the text of the /book-now page with the revised campaign
	 * copy (fixed end date, new wording, full return policy). Images, the
	 * product and the countdown on/off setting are not touched. After this runs
	 * once, wp-admin owns the text again and it is never overwritten.
	 */
	public static function maybe_update_copy(): void {
		if ( ! function_exists( 'update_field' ) || ! current_user_can( 'edit_pages' ) ) {
			return;
		}

		// v3: the "only 3 days" badge text is gone. Only a badge that still carries
		// that wording is replaced, so a badge an editor already rewrote is kept.
		if ( ! get_option( self::COPY_V3 ) ) {
			$id = self::find( self::SLUG );
			if ( $id ) {
				$badge = (string) get_post_meta( $id, 'lp_hero_badge', true );
				if ( false !== strpos( $badge, '3 दिन' ) ) {
					update_field( 'lp_hero_badge', '⏳ Limited Time Offer', $id );
				}
				update_option( self::COPY_V3, gmdate( 'c' ), false );
			}
		}

		if ( get_option( self::COPY_V2 ) ) {
			return;
		}

		$page_id = self::find( self::SLUG );
		if ( ! $page_id ) {
			return;
		}

		foreach ( self::copy() as $name => $value ) {
			update_field( $name, $value, $page_id );
		}

		update_post_meta( $page_id, '_yoast_wpseo_title', 'Graha Kavach 3-in-1 Home Fire Safety Kit | Book Now ₹199' );
		update_post_meta( $page_id, '_yoast_wpseo_metadesc', 'Graha Kavach 3-in-1 Home Fire Safety Kit: 2 kg ABC Fire Extinguisher, Automatic Fire Ball और Fire Blanket. Limited Time Offer: ₹2,999 की Kit ₹2,499 में. ₹199 में Booking, बाक़ी Cash on Delivery. पूरे भारत में Free Delivery.' );

		update_option( self::COPY_V2, gmdate( 'c' ), false );
	}

	/* ------------------------------------------------------------------ *
	 * Admin: the "Landing Pages" screen
	 * ------------------------------------------------------------------ */

	public static function register_menu(): void {
		add_menu_page(
			__( 'Landing Pages', 'grahakavach-headless-core' ),
			__( 'Landing Pages', 'grahakavach-headless-core' ),
			'edit_pages',
			'gk-landing-pages',
			array( __CLASS__, 'render_screen' ),
			'dashicons-megaphone',
			24
		);
	}

	/**
	 * Label landing pages in the normal Pages list.
	 *
	 * @param string[] $states Post states.
	 * @param WP_Post  $post   Post.
	 * @return string[]
	 */
	public static function post_states( $states, $post ) {
		if ( $post instanceof WP_Post && self::is_landing( (int) $post->ID ) ) {
			$states               = (array) $states;
			$states['gk_landing'] = __( 'Landing page', 'grahakavach-headless-core' );
		}

		return $states;
	}

	/**
	 * Create a draft landing page, copying another one or the starter content.
	 */
	public static function handle_new(): void {
		if ( ! current_user_can( 'edit_pages' ) ) {
			wp_die( esc_html__( 'You do not have permission to create landing pages.', 'grahakavach-headless-core' ), 403 );
		}
		check_admin_referer( 'gk_landing_new' );

		$title  = sanitize_text_field( wp_unslash( (string) ( $_POST['title'] ?? '' ) ) ); // phpcs:ignore WordPress.Security.NonceVerification
		$source = sanitize_text_field( wp_unslash( (string) ( $_POST['source'] ?? 'starter' ) ) ); // phpcs:ignore WordPress.Security.NonceVerification
		$parent = self::parent_id();

		if ( '' === $title || ! $parent ) {
			wp_safe_redirect( admin_url( 'admin.php?page=gk-landing-pages&gk_error=title' ) );
			exit;
		}

		$id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_title'  => $title,
				'post_status' => 'draft',
				'post_parent' => $parent,
			),
			true
		);

		if ( is_wp_error( $id ) ) {
			wp_die( esc_html( $id->get_error_message() ) );
		}

		if ( 'starter' === $source ) {
			self::apply_starter( (int) $id );
		} elseif ( self::is_landing( (int) $source ) ) {
			self::copy_content( (int) $source, (int) $id );
		}

		wp_safe_redirect( admin_url( 'post.php?post=' . (int) $id . '&action=edit' ) );
		exit;
	}

	/**
	 * Copy every landing field, and the Yoast title and description, between pages.
	 *
	 * @param int $from Source page ID.
	 * @param int $to   Target page ID.
	 */
	private static function copy_content( int $from, int $to ): void {
		foreach ( get_post_meta( $from ) as $key => $values ) {
			$is_field = 0 === strpos( (string) $key, 'lp_' ) || 0 === strpos( (string) $key, '_lp_' );
			$is_seo   = in_array( $key, array( '_yoast_wpseo_title', '_yoast_wpseo_metadesc' ), true );

			if ( ! $is_field && ! $is_seo ) {
				continue;
			}

			foreach ( (array) $values as $value ) {
				add_post_meta( $to, wp_slash( (string) $key ), wp_slash( $value ) );
			}
		}
	}

	public static function render_screen(): void {
		if ( ! current_user_can( 'edit_pages' ) ) {
			wp_die( esc_html__( 'You do not have permission to manage landing pages.', 'grahakavach-headless-core' ), 403 );
		}

		$pages = get_posts(
			array(
				'post_type'        => 'page',
				'post_status'      => array( 'publish', 'draft', 'pending', 'future' ),
				'post_parent'      => self::parent_id(),
				'numberposts'      => 200,
				'orderby'          => 'date',
				'order'            => 'DESC',
				'suppress_filters' => true,
			)
		);
		$front = GK_Config::frontend_url();
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Landing Pages', 'grahakavach-headless-core' ); ?></h1>
			<p class="description"><?php esc_html_e( 'Ad landing pages in the Graha Kavach look. Create one, then change only the text and images. Each page has its own web address, SEO box (Yoast) and product.', 'grahakavach-headless-core' ); ?></p>

			<?php if ( isset( $_GET['gk_error'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification ?>
				<div class="notice notice-error"><p><?php esc_html_e( 'Enter a name for the new page.', 'grahakavach-headless-core' ); ?></p></div>
			<?php endif; ?>

			<h2><?php esc_html_e( 'Add a landing page', 'grahakavach-headless-core' ); ?></h2>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="gk_landing_new" />
				<?php wp_nonce_field( 'gk_landing_new' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="gk-lp-title"><?php esc_html_e( 'Page name', 'grahakavach-headless-core' ); ?></label></th>
						<td>
							<input type="text" id="gk-lp-title" name="title" class="regular-text" required />
							<p class="description"><?php esc_html_e( 'Also becomes the web address: "Holi Offer" gives /lp/holi-offer. You can change the address later in the page Permalink box.', 'grahakavach-headless-core' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="gk-lp-source"><?php esc_html_e( 'Start from', 'grahakavach-headless-core' ); ?></label></th>
						<td>
							<select id="gk-lp-source" name="source">
								<option value="starter"><?php esc_html_e( 'Starter content (Hindi fire safety kit design)', 'grahakavach-headless-core' ); ?></option>
								<?php foreach ( $pages as $page ) : ?>
									<option value="<?php echo esc_attr( (string) $page->ID ); ?>">
										<?php
										/* translators: %s: page title */
										echo esc_html( sprintf( __( 'A copy of: %s', 'grahakavach-headless-core' ), $page->post_title ) );
										?>
									</option>
								<?php endforeach; ?>
							</select>
						</td>
					</tr>
				</table>
				<?php submit_button( __( 'Create draft and edit', 'grahakavach-headless-core' ), 'primary', 'submit', false ); ?>
			</form>

			<hr />
			<h2><?php esc_html_e( 'Your landing pages', 'grahakavach-headless-core' ); ?></h2>
			<table class="widefat striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Name', 'grahakavach-headless-core' ); ?></th>
						<th><?php esc_html_e( 'Web address', 'grahakavach-headless-core' ); ?></th>
						<th><?php esc_html_e( 'Status', 'grahakavach-headless-core' ); ?></th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					<?php if ( empty( $pages ) ) : ?>
						<tr><td colspan="4"><?php esc_html_e( 'No landing pages yet.', 'grahakavach-headless-core' ); ?></td></tr>
					<?php endif; ?>
					<?php foreach ( $pages as $page ) : ?>
						<?php $url = $front . self::path( $page->post_name ); ?>
						<tr>
							<td><strong><a href="<?php echo esc_url( (string) get_edit_post_link( $page->ID ) ); ?>"><?php echo esc_html( $page->post_title ); ?></a></strong></td>
							<td><code><?php echo esc_html( $url ); ?></code></td>
							<td><?php echo 'publish' === $page->post_status ? esc_html__( 'Live', 'grahakavach-headless-core' ) : esc_html__( 'Draft', 'grahakavach-headless-core' ); ?></td>
							<td>
								<a href="<?php echo esc_url( (string) get_edit_post_link( $page->ID ) ); ?>"><?php esc_html_e( 'Edit', 'grahakavach-headless-core' ); ?></a>
								<?php if ( 'publish' === $page->post_status ) : ?>
									| <a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'View', 'grahakavach-headless-core' ); ?></a>
								<?php endif; ?>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
		<?php
	}
}
