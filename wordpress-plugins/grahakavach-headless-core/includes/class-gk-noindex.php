<?php
/**
 * Keep the headless backend out of search engines.
 *
 * The backend serves the same content as the storefront. If it is indexed it
 * competes with grahakavach.in for the same queries and splits ranking signals.
 *
 * Scope is deliberately narrow: only *public front-end page views* are marked
 * noindex. wp-admin, wp-login, REST, GraphQL, admin-ajax, cron and feeds are
 * untouched, so nothing about API availability changes.
 *
 * @package GrahaKavach\HeadlessCore
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Applies noindex to the public backend surface only.
 */
final class GK_Noindex {

	public static function init(): void {
		if ( ! GK_Config::noindex_enabled() ) {
			return;
		}

		// 1. Meta robots tag on front-end page views.
		add_filter( 'wp_robots', array( __CLASS__, 'filter_wp_robots' ), 99 );

		// 2. X-Robots-Tag header on front-end page views.
		add_action( 'template_redirect', array( __CLASS__, 'send_header' ), 1 );

		// 3. robots.txt disallow.
		//
		// Runs at PHP_INT_MAX and *discards* whatever came before. Yoast appends
		// its own `User-agent: * / Disallow:` block plus a Sitemap: line at a
		// later priority, which would otherwise contradict our Disallow and keep
		// advertising backend URLs.
		add_filter( 'robots_txt', array( __CLASS__, 'filter_robots_txt' ), PHP_INT_MAX, 2 );

		// 4. Suppress sitemaps so backend URLs are never advertised.
		add_filter( 'wp_sitemaps_enabled', '__return_false' );

		// Yoast 14+ uses `wpseo_enable_xml_sitemap`. The older
		// `wpseo_sitemaps_enabled` name has no effect on current versions.
		add_filter( 'wpseo_enable_xml_sitemap', '__return_false' );

		// The Yoast filters above are advisory and were observed still serving
		// sitemap_index.xml on this install, so block the routes outright.
		// This is deterministic and does not depend on any SEO plugin's
		// internals continuing to honour a filter.
		add_action( 'init', array( __CLASS__, 'block_sitemaps' ), 0 );

		// 5. Stop Yoast writing a backend canonical that could leak into output.
		add_filter( 'wpseo_canonical', array( __CLASS__, 'filter_canonical' ), 99 );
	}

	/**
	 * True when this request is an API, admin, or system request that must be
	 * left completely alone.
	 */
	private static function is_exempt_request(): bool {
		// REST API — includes wp/v2, wc/v3, wc/store.
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return true;
		}

		// WPGraphQL.
		if ( defined( 'GRAPHQL_REQUEST' ) && GRAPHQL_REQUEST ) {
			return true;
		}

		// WP-CLI, cron, XML-RPC.
		if ( ( defined( 'WP_CLI' ) && WP_CLI )
			|| ( defined( 'DOING_CRON' ) && DOING_CRON )
			|| ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) ) {
			return true;
		}

		// Admin screens and admin-ajax.
		if ( is_admin() || ( defined( 'DOING_AJAX' ) && DOING_AJAX ) ) {
			return true;
		}

		// Login / registration.
		if ( function_exists( 'is_login' ) && is_login() ) {
			return true;
		}

		$self = isset( $_SERVER['PHP_SELF'] ) ? sanitize_text_field( wp_unslash( $_SERVER['PHP_SELF'] ) ) : '';
		if ( $self && preg_match( '#/wp-(login|register|cron|admin)#', $self ) ) {
			return true;
		}

		// The GraphQL endpoint may be hit before GRAPHQL_REQUEST is defined.
		$uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		if ( $uri && preg_match( '#^/(graphql|wp-json)(/|\?|$)#', $uri ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Return 404 for any sitemap route on the backend.
	 *
	 * Covers Yoast (`sitemap_index.xml`, `<type>-sitemap.xml`, the XSL
	 * stylesheets) and WordPress core (`wp-sitemap*.xml`). API paths are
	 * exempt, so nothing about REST or GraphQL is affected.
	 */
	public static function block_sitemaps(): void {
		if ( self::is_exempt_request() ) {
			return;
		}

		$uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';

		if ( '' === $uri ) {
			return;
		}

		$path = (string) wp_parse_url( $uri, PHP_URL_PATH );

		$patterns = array(
			'#^/sitemap[^/]*\.xml$#i',      // sitemap.xml, sitemap_index.xml
			'#^/.+-sitemap[0-9]*\.xml$#i',  // post-sitemap.xml, page-sitemap2.xml
			'#^/wp-sitemap.*\.xml$#i',      // core sitemaps
			'#^/.*sitemap.*\.xsl$#i',       // sitemap stylesheets
		);

		foreach ( $patterns as $pattern ) {
			if ( preg_match( $pattern, $path ) ) {
				status_header( 404 );
				header( 'X-Robots-Tag: noindex, nofollow, noarchive', true );
				header( 'Content-Type: text/plain; charset=utf-8', true );
				nocache_headers();
				echo 'Not found.';
				exit;
			}
		}
	}

	/**
	 * Force noindex/nofollow in the rendered <meta name="robots"> tag.
	 *
	 * @param array $robots Robots directives.
	 * @return array
	 */
	public static function filter_wp_robots( $robots ): array {
		if ( ! is_array( $robots ) ) {
			$robots = array();
		}

		if ( self::is_exempt_request() ) {
			return $robots;
		}

		// Drop any positive directives a SEO plugin added.
		unset( $robots['index'], $robots['follow'], $robots['max-snippet'], $robots['max-image-preview'], $robots['max-video-preview'] );

		$robots['noindex']  = true;
		$robots['nofollow'] = true;
		$robots['noarchive'] = true;

		return $robots;
	}

	/**
	 * Send the X-Robots-Tag header for front-end views.
	 *
	 * Uses template_redirect so it only ever runs on a themed page view.
	 */
	public static function send_header(): void {
		if ( headers_sent() || self::is_exempt_request() ) {
			return;
		}

		header( 'X-Robots-Tag: noindex, nofollow, noarchive', true );
	}

	/**
	 * Disallow everything in robots.txt except the API paths.
	 *
	 * Crawlers are told not to index, but the API paths stay explicitly
	 * allowed so that any crawler-based uptime or preview tooling still works.
	 *
	 * @param string $output Existing robots.txt body.
	 * @param bool   $public Whether the site is public.
	 * @return string
	 */
	public static function filter_robots_txt( $output, $public ): string {
		unset( $output, $public );

		$lines = array(
			'# Graha Kavach headless backend.',
			'# Public storefront: ' . GK_Config::frontend_url(),
			'User-agent: *',
			'Disallow: /',
			'',
			'# APIs remain reachable; they are simply not for indexing.',
			'Allow: /wp-json/',
			'Allow: /graphql',
			'Allow: /wp-content/uploads/',
			'',
		);

		return implode( "\n", $lines );
	}

	/**
	 * Never emit a backend canonical URL.
	 *
	 * Yoast metadata is consumed by Next.js, which rewrites canonicals to the
	 * public host. Emitting one here would only ever be wrong.
	 *
	 * @param string $canonical Canonical URL.
	 * @return string
	 */
	public static function filter_canonical( $canonical ): string {
		if ( self::is_exempt_request() ) {
			return (string) $canonical;
		}

		return '';
	}
}
