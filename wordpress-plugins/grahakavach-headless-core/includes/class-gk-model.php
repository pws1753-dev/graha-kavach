<?php
/**
 * The content model manifest — single source of truth.
 *
 * Every editable field is declared exactly once here. Both the ACF field
 * groups (class-gk-fields.php) and the GraphQL schema (class-gk-content-graphql.php)
 * are generated from these declarations, so the editor UI and the API can
 * never drift apart. Adding a field is a one-line change in one file.
 *
 * Field declaration keys:
 *   name    (string)  ACF field name / meta key, unique within its group
 *   label   (string)  Editor label
 *   type    (string)  ACF field type
 *   gql     (string)  GraphQL field name (camelCase)
 *   tab     (string)  Editor tab this field sits under
 *   shape   (array)   For 'structured' lists: the ordered column names
 *   gqltype (string)  GraphQL object type name for a structured list
 *   post_type (string) For 'relationship': which post type may be selected
 *   hint    (string)  Optional editor instructions
 *
 * Internal type 'structured' renders as an ACF textarea and is exposed to
 * GraphQL as a typed list, never as the raw string.
 *
 * @package GrahaKavach\HeadlessCore
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Declarative description of the whole CMS content model.
 */
final class GK_Model {

	/**
	 * Global site settings, edited on the singleton Site Settings screen.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function settings(): array {
		return array(
			// ---- Brand -------------------------------------------------
			array( 'name' => 'brand_logo_primary', 'label' => 'Primary logo', 'type' => 'image', 'gql' => 'logoPrimary', 'tab' => 'Brand' ),
			array( 'name' => 'brand_logo_alternate', 'label' => 'Alternate logo', 'type' => 'image', 'gql' => 'logoAlternate', 'tab' => 'Brand', 'hint' => 'Used on dark backgrounds.' ),
			array( 'name' => 'brand_favicon', 'label' => 'Favicon', 'type' => 'image', 'gql' => 'favicon', 'tab' => 'Brand' ),
			array( 'name' => 'brand_share_image', 'label' => 'Default social share image', 'type' => 'image', 'gql' => 'shareImage', 'tab' => 'Brand', 'hint' => 'Fallback Open Graph image, 1200x630.' ),

			// ---- Contact -----------------------------------------------
			array( 'name' => 'contact_phone_primary', 'label' => 'Primary phone', 'type' => 'text', 'gql' => 'phonePrimary', 'tab' => 'Contact' ),
			array( 'name' => 'contact_phone_alternate', 'label' => 'Alternate phone', 'type' => 'text', 'gql' => 'phoneAlternate', 'tab' => 'Contact' ),
			array( 'name' => 'contact_email_primary', 'label' => 'Primary email', 'type' => 'email', 'gql' => 'emailPrimary', 'tab' => 'Contact' ),
			array( 'name' => 'contact_email_support', 'label' => 'Support email', 'type' => 'email', 'gql' => 'emailSupport', 'tab' => 'Contact' ),
			array( 'name' => 'contact_whatsapp_number', 'label' => 'WhatsApp number', 'type' => 'text', 'gql' => 'whatsappNumber', 'tab' => 'Contact', 'hint' => 'Digits with country code, e.g. 917891111390. Leave empty if there is no WhatsApp line.' ),
			array( 'name' => 'contact_whatsapp_message', 'label' => 'WhatsApp default message', 'type' => 'textarea', 'gql' => 'whatsappMessage', 'tab' => 'Contact' ),
			array( 'name' => 'contact_address', 'label' => 'Head office address', 'type' => 'textarea', 'gql' => 'address', 'tab' => 'Contact' ),
			array( 'name' => 'contact_maps_url', 'label' => 'Google Maps URL', 'type' => 'url', 'gql' => 'mapsUrl', 'tab' => 'Contact' ),
			array( 'name' => 'contact_hours', 'label' => 'Business hours', 'type' => 'structured', 'gql' => 'businessHours', 'gqltype' => 'GrahaKavachHoursRow', 'shape' => array( 'days', 'hours' ), 'tab' => 'Contact' ),

			// ---- Social ------------------------------------------------
			array( 'name' => 'social_facebook', 'label' => 'Facebook', 'type' => 'url', 'gql' => 'facebook', 'tab' => 'Social' ),
			array( 'name' => 'social_instagram', 'label' => 'Instagram', 'type' => 'url', 'gql' => 'instagram', 'tab' => 'Social' ),
			array( 'name' => 'social_linkedin', 'label' => 'LinkedIn', 'type' => 'url', 'gql' => 'linkedin', 'tab' => 'Social' ),
			array( 'name' => 'social_youtube', 'label' => 'YouTube', 'type' => 'url', 'gql' => 'youtube', 'tab' => 'Social' ),
			array( 'name' => 'social_x', 'label' => 'X (Twitter)', 'type' => 'url', 'gql' => 'x', 'tab' => 'Social' ),

			// ---- Header ------------------------------------------------
			array( 'name' => 'header_announcement_on', 'label' => 'Announcement enabled', 'type' => 'true_false', 'gql' => 'announcementEnabled', 'tab' => 'Header' ),
			array( 'name' => 'header_announcement_text', 'label' => 'Announcement text', 'type' => 'text', 'gql' => 'announcementText', 'tab' => 'Header' ),
			array( 'name' => 'header_announcement_link', 'label' => 'Announcement link', 'type' => 'url', 'gql' => 'announcementLink', 'tab' => 'Header' ),
			array( 'name' => 'header_cta_label', 'label' => 'Main CTA label', 'type' => 'text', 'gql' => 'ctaLabel', 'tab' => 'Header' ),
			array( 'name' => 'header_cta_url', 'label' => 'Main CTA URL', 'type' => 'url', 'gql' => 'ctaUrl', 'tab' => 'Header' ),

			// ---- Footer ------------------------------------------------
			array( 'name' => 'footer_description', 'label' => 'Short brand description', 'type' => 'textarea', 'gql' => 'description', 'tab' => 'Footer' ),
			array( 'name' => 'footer_logo', 'label' => 'Footer logo', 'type' => 'image', 'gql' => 'logo', 'tab' => 'Footer' ),
			array( 'name' => 'footer_nav_groups', 'label' => 'Footer navigation groups', 'type' => 'structured', 'gql' => 'navGroups', 'gqltype' => 'GrahaKavachNavRow', 'shape' => array( 'group', 'label', 'url' ), 'tab' => 'Footer', 'hint' => 'Repeat the same GROUP name to add more links to that column.' ),
			array( 'name' => 'footer_support_details', 'label' => 'Support details', 'type' => 'textarea', 'gql' => 'supportDetails', 'tab' => 'Footer' ),
			array( 'name' => 'footer_copyright', 'label' => 'Copyright text', 'type' => 'text', 'gql' => 'copyright', 'tab' => 'Footer' ),
			array( 'name' => 'footer_legal_links', 'label' => 'Legal links', 'type' => 'structured', 'gql' => 'legalLinks', 'gqltype' => 'GrahaKavachLinkRow', 'shape' => array( 'label', 'url' ), 'tab' => 'Footer' ),

			// ---- Commerce ----------------------------------------------
			array( 'name' => 'commerce_support_message', 'label' => 'Support message', 'type' => 'text', 'gql' => 'supportMessage', 'tab' => 'Commerce' ),
			array( 'name' => 'commerce_delivery_note', 'label' => 'Delivery note', 'type' => 'text', 'gql' => 'deliveryNote', 'tab' => 'Commerce' ),
			array( 'name' => 'commerce_secure_checkout', 'label' => 'Secure checkout text', 'type' => 'text', 'gql' => 'secureCheckoutText', 'tab' => 'Commerce' ),
			array( 'name' => 'commerce_return_summary', 'label' => 'Return summary', 'type' => 'textarea', 'gql' => 'returnSummary', 'tab' => 'Commerce' ),
			array( 'name' => 'commerce_cod_label', 'label' => 'COD availability label', 'type' => 'text', 'gql' => 'codLabel', 'tab' => 'Commerce' ),
			array( 'name' => 'commerce_service_cta_label', 'label' => 'Customer-service CTA label', 'type' => 'text', 'gql' => 'serviceCtaLabel', 'tab' => 'Commerce' ),
			array( 'name' => 'commerce_service_cta_url', 'label' => 'Customer-service CTA URL', 'type' => 'url', 'gql' => 'serviceCtaUrl', 'tab' => 'Commerce' ),

			// ---- Emergency ---------------------------------------------
			array( 'name' => 'emergency_disclaimer', 'label' => 'Emergency disclaimer', 'type' => 'textarea', 'gql' => 'disclaimer', 'tab' => 'Emergency' ),
			array( 'name' => 'emergency_phone_instruction', 'label' => 'Emergency phone instruction', 'type' => 'text', 'gql' => 'phoneInstruction', 'tab' => 'Emergency' ),
			array( 'name' => 'emergency_fire_disclaimer', 'label' => 'Fire safety disclaimer', 'type' => 'textarea', 'gql' => 'fireSafetyDisclaimer', 'tab' => 'Emergency' ),
		);
	}

	/**
	 * Homepage composition.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function homepage(): array {
		return array(
			// ---- Hero banner carousel -----------------------------------
			//
			// The storefront hero is a full-width image carousel. Desktop and
			// mobile are separate lists because a 2:1 desktop banner crops
			// badly on a phone — the client uploads artwork sized for each.
			// Slides are paired by position: desktop slide 1 with mobile
			// slide 1. If the mobile list is left empty the desktop artwork is
			// used on phones too, so the carousel never renders blank.
			array( 'name' => 'hero_banners_desktop', 'label' => 'Desktop banners', 'type' => 'gallery_rel', 'gql' => 'heroBannersDesktop', 'tab' => 'Hero banners', 'hint' => 'Full-width desktop banners, in display order. Any text must be part of the artwork — the storefront never draws text over a banner.' ),
			array( 'name' => 'hero_banners_mobile', 'label' => 'Mobile banners', 'type' => 'gallery_rel', 'gql' => 'heroBannersMobile', 'tab' => 'Hero banners', 'hint' => 'Optional. Same order as the desktop list. Leave empty to reuse the desktop banners on phones.' ),
			array( 'name' => 'hero_banner_links', 'label' => 'Banner links', 'type' => 'structured', 'gql' => 'heroBannerLinks', 'gqltype' => 'GrahaKavachLinkRow', 'shape' => array( 'label', 'url' ), 'tab' => 'Hero banners', 'hint' => 'Optional, one row per slide in the same order. LABEL is used as the link description for screen readers. Leave empty for non-clickable banners.' ),
			array( 'name' => 'hero_banner_autoplay', 'label' => 'Autoplay seconds', 'type' => 'number', 'gql' => 'heroBannerAutoplay', 'tab' => 'Hero banners', 'hint' => 'Seconds each slide is held before advancing. Leave empty or 0 to turn autoplay off.' ),

			// ---- Hero ---------------------------------------------------
			array( 'name' => 'hero_eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'gql' => 'heroEyebrow', 'tab' => 'Hero' ),
			array( 'name' => 'hero_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'heroTitle', 'tab' => 'Hero' ),
			array( 'name' => 'hero_highlight', 'label' => 'Highlighted phrase', 'type' => 'text', 'gql' => 'heroHighlight', 'tab' => 'Hero', 'hint' => 'A phrase inside the title that the storefront emphasises.' ),
			array( 'name' => 'hero_description', 'label' => 'Description', 'type' => 'textarea', 'gql' => 'heroDescription', 'tab' => 'Hero' ),
			array( 'name' => 'hero_cta1_label', 'label' => 'Primary CTA label', 'type' => 'text', 'gql' => 'heroCtaPrimaryLabel', 'tab' => 'Hero' ),
			array( 'name' => 'hero_cta1_url', 'label' => 'Primary CTA URL', 'type' => 'url', 'gql' => 'heroCtaPrimaryUrl', 'tab' => 'Hero' ),
			array( 'name' => 'hero_cta2_label', 'label' => 'Secondary CTA label', 'type' => 'text', 'gql' => 'heroCtaSecondaryLabel', 'tab' => 'Hero' ),
			array( 'name' => 'hero_cta2_url', 'label' => 'Secondary CTA URL', 'type' => 'url', 'gql' => 'heroCtaSecondaryUrl', 'tab' => 'Hero' ),
			array( 'name' => 'hero_visual_desktop', 'label' => 'Desktop product visual', 'type' => 'image', 'gql' => 'heroVisualDesktop', 'tab' => 'Hero' ),
			array( 'name' => 'hero_visual_mobile', 'label' => 'Mobile product visual', 'type' => 'image', 'gql' => 'heroVisualMobile', 'tab' => 'Hero' ),

			// ---- Mid-page feature carousel ------------------------------
			//
			// A second, smaller carousel that sits between the homepage
			// sections. Images only, same rule as the hero banners: whatever
			// wording the slide needs must be part of the artwork.
			array( 'name' => 'feature_carousel_title', 'label' => 'Section title', 'type' => 'text', 'gql' => 'featureCarouselTitle', 'tab' => 'Feature carousel' ),
			array( 'name' => 'feature_carousel_intro', 'label' => 'Section intro', 'type' => 'text', 'gql' => 'featureCarouselIntro', 'tab' => 'Feature carousel' ),
			array( 'name' => 'feature_carousel_images', 'label' => 'Carousel images', 'type' => 'gallery_rel', 'gql' => 'featureCarouselImages', 'tab' => 'Feature carousel', 'hint' => 'Images in display order. Use one consistent size for every slide. The storefront never draws text over these.' ),
			array( 'name' => 'feature_carousel_autoplay', 'label' => 'Autoplay seconds', 'type' => 'number', 'gql' => 'featureCarouselAutoplay', 'tab' => 'Feature carousel', 'hint' => 'Leave empty or 0 to turn autoplay off.' ),

			// ---- Trust bar ----------------------------------------------
			array( 'name' => 'trust_items', 'label' => 'Trust bar items', 'type' => 'structured', 'gql' => 'trustItems', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'Trust' ),

			// ---- Brand story --------------------------------------------
			array( 'name' => 'story_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'storyTitle', 'tab' => 'Story' ),
			array( 'name' => 'story_text', 'label' => 'Body', 'type' => 'wysiwyg', 'gql' => 'storyText', 'tab' => 'Story' ),
			array( 'name' => 'story_image', 'label' => 'Image', 'type' => 'image', 'gql' => 'storyImage', 'tab' => 'Story' ),

			// ---- Three-product protection -------------------------------
			array( 'name' => 'protection_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'protectionTitle', 'tab' => 'Protection' ),
			array( 'name' => 'protection_intro', 'label' => 'Intro', 'type' => 'textarea', 'gql' => 'protectionIntro', 'tab' => 'Protection' ),
			array( 'name' => 'protection_items', 'label' => 'Protection items', 'type' => 'relationship', 'post_type' => GK_CPT::KIT_ITEM, 'gql' => 'protectionItems', 'tab' => 'Protection', 'hint' => 'Pick the three kit items. Managed under Kit Items.' ),

			// ---- Risk locations -----------------------------------------
			array( 'name' => 'risk_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'riskTitle', 'tab' => 'Risk' ),
			array( 'name' => 'risk_intro', 'label' => 'Intro', 'type' => 'textarea', 'gql' => 'riskIntro', 'tab' => 'Risk' ),
			array( 'name' => 'risk_items', 'label' => 'Risk locations', 'type' => 'structured', 'gql' => 'riskItems', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'Risk' ),

			// ---- Why Graha Kavach ---------------------------------------
			array( 'name' => 'why_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'whyTitle', 'tab' => 'Why' ),
			array( 'name' => 'why_items', 'label' => 'Reasons', 'type' => 'structured', 'gql' => 'whyItems', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'Why' ),

			// ---- Inside the box -----------------------------------------
			array( 'name' => 'box_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'insideBoxTitle', 'tab' => 'Inside the box' ),
			array( 'name' => 'box_intro', 'label' => 'Intro', 'type' => 'textarea', 'gql' => 'insideBoxIntro', 'tab' => 'Inside the box' ),
			array( 'name' => 'box_items', 'label' => 'Contents', 'type' => 'relationship', 'post_type' => GK_CPT::KIT_ITEM, 'gql' => 'insideBoxItems', 'tab' => 'Inside the box' ),

			// ---- Installation / placement -------------------------------
			array( 'name' => 'install_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'installTitle', 'tab' => 'Installation' ),
			array( 'name' => 'install_intro', 'label' => 'Intro', 'type' => 'textarea', 'gql' => 'installIntro', 'tab' => 'Installation' ),
			array( 'name' => 'install_steps', 'label' => 'Placement guidance', 'type' => 'structured', 'gql' => 'installSteps', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'Installation' ),
			array( 'name' => 'install_image', 'label' => 'Image', 'type' => 'image', 'gql' => 'installImage', 'tab' => 'Installation' ),

			// ---- How it works -------------------------------------------
			array( 'name' => 'how_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'howTitle', 'tab' => 'How it works' ),
			array( 'name' => 'how_steps', 'label' => 'Steps', 'type' => 'structured', 'gql' => 'howSteps', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'How it works' ),

			// ---- Certifications -----------------------------------------
			array( 'name' => 'cert_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'certificationsTitle', 'tab' => 'Certifications' ),
			array( 'name' => 'cert_intro', 'label' => 'Intro', 'type' => 'textarea', 'gql' => 'certificationsIntro', 'tab' => 'Certifications' ),
			array( 'name' => 'cert_items', 'label' => 'Certifications', 'type' => 'relationship', 'post_type' => GK_CPT::CERTIFICATION, 'gql' => 'certifications', 'tab' => 'Certifications' ),

			// ---- Manufacturer -------------------------------------------
			array( 'name' => 'maker_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'manufacturerTitle', 'tab' => 'Manufacturer' ),
			array( 'name' => 'maker_text', 'label' => 'Body', 'type' => 'wysiwyg', 'gql' => 'manufacturerText', 'tab' => 'Manufacturer' ),
			array( 'name' => 'maker_image', 'label' => 'Image', 'type' => 'image', 'gql' => 'manufacturerImage', 'tab' => 'Manufacturer' ),

			// ---- Testimonials -------------------------------------------
			array( 'name' => 'tst_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'testimonialsTitle', 'tab' => 'Testimonials' ),
			array( 'name' => 'tst_intro', 'label' => 'Intro', 'type' => 'textarea', 'gql' => 'testimonialsIntro', 'tab' => 'Testimonials' ),
			array( 'name' => 'tst_items', 'label' => 'Testimonials', 'type' => 'relationship', 'post_type' => GK_CPT::TESTIMONIAL, 'gql' => 'testimonials', 'tab' => 'Testimonials' ),

			// ---- FAQ -----------------------------------------------------
			array( 'name' => 'faq_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'faqTitle', 'tab' => 'FAQ' ),
			array( 'name' => 'faq_items', 'label' => 'Questions', 'type' => 'relationship', 'post_type' => GK_CPT::FAQ, 'gql' => 'faqs', 'tab' => 'FAQ' ),

			// ---- Bottom CTA ----------------------------------------------
			array( 'name' => 'cta_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'ctaTitle', 'tab' => 'Bottom CTA' ),
			array( 'name' => 'cta_text', 'label' => 'Text', 'type' => 'textarea', 'gql' => 'ctaText', 'tab' => 'Bottom CTA' ),
			array( 'name' => 'cta_label', 'label' => 'Button label', 'type' => 'text', 'gql' => 'ctaLabel', 'tab' => 'Bottom CTA' ),
			array( 'name' => 'cta_url', 'label' => 'Button URL', 'type' => 'url', 'gql' => 'ctaUrl', 'tab' => 'Bottom CTA' ),
		);
	}

	/**
	 * About page.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function about(): array {
		return array(
			array( 'name' => 'about_intro', 'label' => 'Intro', 'type' => 'textarea', 'gql' => 'intro', 'tab' => 'Intro' ),
			array( 'name' => 'about_story', 'label' => 'Story', 'type' => 'wysiwyg', 'gql' => 'story', 'tab' => 'Story' ),
			array( 'name' => 'about_mission', 'label' => 'Mission', 'type' => 'textarea', 'gql' => 'mission', 'tab' => 'Mission & vision' ),
			array( 'name' => 'about_vision', 'label' => 'Vision', 'type' => 'textarea', 'gql' => 'vision', 'tab' => 'Mission & vision' ),
			array( 'name' => 'about_manufacturer', 'label' => 'Manufacturer information', 'type' => 'wysiwyg', 'gql' => 'manufacturer', 'tab' => 'Manufacturer' ),
			array( 'name' => 'about_timeline', 'label' => 'Timeline', 'type' => 'structured', 'gql' => 'timeline', 'gqltype' => 'GrahaKavachTimelineRow', 'shape' => array( 'year', 'title', 'text' ), 'tab' => 'Timeline' ),
			array( 'name' => 'about_experience', 'label' => 'Experience', 'type' => 'textarea', 'gql' => 'experience', 'tab' => 'Experience' ),
			array( 'name' => 'about_quality', 'label' => 'Quality & testing', 'type' => 'wysiwyg', 'gql' => 'quality', 'tab' => 'Quality' ),
			array( 'name' => 'about_certifications', 'label' => 'Certifications', 'type' => 'relationship', 'post_type' => GK_CPT::CERTIFICATION, 'gql' => 'certifications', 'tab' => 'Quality' ),
			array( 'name' => 'about_facility_images', 'label' => 'Facility imagery', 'type' => 'gallery_rel', 'gql' => 'facilityImages', 'tab' => 'Facility', 'hint' => 'Select multiple images from the Media Library. Order here is the order shown.' ),
			array( 'name' => 'about_cta_title', 'label' => 'Title', 'type' => 'text', 'gql' => 'ctaTitle', 'tab' => 'Closing CTA' ),
			array( 'name' => 'about_cta_text', 'label' => 'Text', 'type' => 'textarea', 'gql' => 'ctaText', 'tab' => 'Closing CTA' ),
			array( 'name' => 'about_cta_label', 'label' => 'Button label', 'type' => 'text', 'gql' => 'ctaLabel', 'tab' => 'Closing CTA' ),
			array( 'name' => 'about_cta_url', 'label' => 'Button URL', 'type' => 'url', 'gql' => 'ctaUrl', 'tab' => 'Closing CTA' ),
		);
	}

	/**
	 * Supplemental content attached to WooCommerce products.
	 *
	 * Deliberately contains no price, stock, SKU or weight — WooCommerce owns
	 * those and duplicating them would create two sources of truth.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function product(): array {
		return array(
			array( 'name' => 'p_tagline', 'label' => 'Marketing tagline', 'type' => 'text', 'gql' => 'tagline', 'tab' => 'Hero' ),
			array( 'name' => 'p_headline', 'label' => 'Short headline', 'type' => 'text', 'gql' => 'headline', 'tab' => 'Hero' ),
			array( 'name' => 'p_hero_support', 'label' => 'Hero supporting text', 'type' => 'textarea', 'gql' => 'heroSupportingText', 'tab' => 'Hero' ),
			array( 'name' => 'p_hero_media', 'label' => 'Hero media', 'type' => 'image', 'gql' => 'heroMedia', 'tab' => 'Hero' ),
			array( 'name' => 'p_gallery', 'label' => 'Additional gallery images', 'type' => 'gallery_rel', 'gql' => 'galleryAdditions', 'tab' => 'Media', 'hint' => 'Supplements the WooCommerce product gallery; it does not replace it.' ),
			array( 'name' => 'p_video', 'label' => 'Video URL', 'type' => 'url', 'gql' => 'videoUrl', 'tab' => 'Media' ),
			array( 'name' => 'p_kit_items', 'label' => 'Kit contents', 'type' => 'relationship', 'post_type' => GK_CPT::KIT_ITEM, 'gql' => 'kitContents', 'tab' => 'Kit' ),
			array( 'name' => 'p_benefits', 'label' => 'Key benefits', 'type' => 'structured', 'gql' => 'keyBenefits', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'Benefits' ),
			array( 'name' => 'p_risk_locations', 'label' => 'Fire-risk locations', 'type' => 'structured', 'gql' => 'riskLocations', 'gqltype' => 'GrahaKavachTitleTextRow', 'shape' => array( 'title', 'text' ), 'tab' => 'Benefits' ),
			array( 'name' => 'p_role_cards', 'label' => 'Comparison / role cards', 'type' => 'structured', 'gql' => 'roleCards', 'gqltype' => 'GrahaKavachRoleRow', 'shape' => array( 'title', 'role', 'text' ), 'tab' => 'Benefits' ),
			array( 'name' => 'p_specs', 'label' => 'Specifications', 'type' => 'structured', 'gql' => 'specifications', 'gqltype' => 'GrahaKavachSpecRow', 'shape' => array( 'group', 'label', 'value' ), 'tab' => 'Specs', 'hint' => 'Repeat the same GROUP name to build a specification table section.' ),
			array( 'name' => 'p_installation', 'label' => 'Installation instructions', 'type' => 'wysiwyg', 'gql' => 'installation', 'tab' => 'Instructions' ),
			array( 'name' => 'p_usage', 'label' => 'Usage instructions', 'type' => 'wysiwyg', 'gql' => 'usage', 'tab' => 'Instructions' ),
			array( 'name' => 'p_warnings', 'label' => 'Warning blocks', 'type' => 'structured', 'gql' => 'warnings', 'gqltype' => 'GrahaKavachWarningRow', 'shape' => array( 'level', 'title', 'text' ), 'tab' => 'Instructions', 'hint' => 'LEVEL is a free label such as Warning, Caution or Danger.' ),
			array( 'name' => 'p_faq', 'label' => 'FAQ', 'type' => 'relationship', 'post_type' => GK_CPT::FAQ, 'gql' => 'faqs', 'tab' => 'Support' ),
			array( 'name' => 'p_certifications', 'label' => 'Certifications', 'type' => 'relationship', 'post_type' => GK_CPT::CERTIFICATION, 'gql' => 'certifications', 'tab' => 'Support' ),
			array( 'name' => 'p_brochure', 'label' => 'Brochure / manual PDF', 'type' => 'file', 'gql' => 'brochure', 'tab' => 'Support' ),
			array( 'name' => 'p_maker_notes', 'label' => 'Manufacturer notes', 'type' => 'textarea', 'gql' => 'manufacturerNotes', 'tab' => 'Support' ),
			array( 'name' => 'p_support_cta_label', 'label' => 'Support CTA label', 'type' => 'text', 'gql' => 'supportCtaLabel', 'tab' => 'Support' ),
			array( 'name' => 'p_support_cta_url', 'label' => 'Support CTA URL', 'type' => 'url', 'gql' => 'supportCtaUrl', 'tab' => 'Support' ),
		);
	}

	// -----------------------------------------------------------------
	// Reusable custom post types
	// -----------------------------------------------------------------

	/**
	 * FAQ. The question is the post title.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function faq(): array {
		return array(
			array( 'name' => 'faq_answer', 'label' => 'Answer', 'type' => 'wysiwyg', 'gql' => 'answer' ),
			array( 'name' => 'faq_group', 'label' => 'Group', 'type' => 'text', 'gql' => 'group', 'hint' => 'Optional grouping label, e.g. Shipping or Product.' ),
		);
	}

	/**
	 * Certification. The name is the post title.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function certification(): array {
		return array(
			array( 'name' => 'cert_issuer', 'label' => 'Issuing body', 'type' => 'text', 'gql' => 'issuer' ),
			array( 'name' => 'cert_number', 'label' => 'Certificate number', 'type' => 'text', 'gql' => 'number' ),
			array( 'name' => 'cert_summary', 'label' => 'Summary', 'type' => 'textarea', 'gql' => 'summary' ),
			array( 'name' => 'cert_image', 'label' => 'Badge / logo', 'type' => 'image', 'gql' => 'image' ),
			array( 'name' => 'cert_document', 'label' => 'Certificate document', 'type' => 'file', 'gql' => 'document' ),
		);
	}

	/**
	 * Testimonial. The headline is the post title.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function testimonial(): array {
		return array(
			array( 'name' => 'tst_quote', 'label' => 'Quote', 'type' => 'textarea', 'gql' => 'quote' ),
			array( 'name' => 'tst_author', 'label' => 'Author', 'type' => 'text', 'gql' => 'author' ),
			array( 'name' => 'tst_location', 'label' => 'Location', 'type' => 'text', 'gql' => 'location' ),
			array( 'name' => 'tst_rating', 'label' => 'Rating (1-5)', 'type' => 'number', 'gql' => 'rating', 'hint' => 'Only record a rating that a real customer actually gave.' ),
			array( 'name' => 'tst_image', 'label' => 'Photo', 'type' => 'image', 'gql' => 'image' ),
		);
	}

	/**
	 * Safety guide. The title is the post title.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function safety_guide(): array {
		return array(
			array( 'name' => 'sg_summary', 'label' => 'Summary', 'type' => 'textarea', 'gql' => 'summary' ),
			array( 'name' => 'sg_body', 'label' => 'Body', 'type' => 'wysiwyg', 'gql' => 'body' ),
			array( 'name' => 'sg_image', 'label' => 'Image', 'type' => 'image', 'gql' => 'image' ),
			array( 'name' => 'sg_order', 'label' => 'Display order', 'type' => 'number', 'gql' => 'order' ),
		);
	}

	/**
	 * Kit / protection item. The name is the post title.
	 *
	 * Used by both the homepage protection section and the product kit
	 * contents, which is exactly why it is a reusable post type rather than a
	 * repeated set of fields in two places.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function kit_item(): array {
		return array(
			array( 'name' => 'ki_summary', 'label' => 'Summary', 'type' => 'textarea', 'gql' => 'summary' ),
			array( 'name' => 'ki_role', 'label' => 'Role', 'type' => 'text', 'gql' => 'role', 'hint' => 'What this item is for, e.g. "First response".' ),
			array( 'name' => 'ki_quantity', 'label' => 'Quantity in kit', 'type' => 'text', 'gql' => 'quantity' ),
			array( 'name' => 'ki_image', 'label' => 'Image', 'type' => 'image', 'gql' => 'image' ),
			array( 'name' => 'ki_specs', 'label' => 'Specifications', 'type' => 'structured', 'gql' => 'specs', 'gqltype' => 'GrahaKavachLabelValueRow', 'shape' => array( 'label', 'value' ) ),
		);
	}
}
