<?php
namespace DynamicTableBlocks;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Globals.
global $dtbk_instances;

// Initialize plaeholders.
$dtbk_stores    = array();
$dtbk_instances = array();

/**
 * dtbk_new_instance
 *
 * Creates a new instance of the given class and stores it in the instances data store.
 *
 * @since   1.0.0
 *
 * @param   string $class The class name.
 * @return  object The instance.
 */
function dtbk_new_instance( $class = '', $namespace = '' ) {
	if ( ! $namespace ) {
		$namespace = 'DynamicTableBlocks';
	}
	$class = $namespace . '\\' . $class;

	global $dtbk_instances;
	return $dtbk_instances[ $class ] = new $class();
}

/**
 * Resolve a link entered by an author to a reachable HTTP or HTTPS URL.
 *
 * Explicit HTTP(S) URLs are checked as entered. Bare domains are checked with
 * HTTPS first, then HTTP. Relative, query, and fragment links are local links
 * and are returned unchanged.
 *
 * @since 1.4.6
 *
 * @param string $url Link entered by the author.
 * @return string|\WP_Error Resolved link URL or an error.
 */
function dtbk_resolve_external_link_url( $url ) {
	$entered_url = trim( (string) $url );

	if ( '' === $entered_url ) {
		return new \WP_Error(
			'dtbk_empty_link',
			__( 'Enter a web address.', 'dynamic-table-blocks' )
		);
	}

	// Links within the current site need no external availability check.
	if ( preg_match( '/^[\/?#]/', $entered_url ) ) {
		return $entered_url;
	}

	$scheme = wp_parse_url( $entered_url, PHP_URL_SCHEME );

	if ( null !== $scheme && ! in_array( strtolower( $scheme ), array( 'http', 'https' ), true ) ) {
		return new \WP_Error(
			'dtbk_invalid_link_scheme',
			__( 'Enter a valid web address.', 'dynamic-table-blocks' )
		);
	}

	$candidates = null !== $scheme
		? array( $entered_url )
		: array(
			'https://' . ltrim( $entered_url, '/' ),
			'http://' . ltrim( $entered_url, '/' ),
		);

	$has_valid_candidate = false;
	$received_response   = false;

	foreach ( $candidates as $candidate ) {
		$resolved_url = dtbk_verify_external_link_url( $candidate );

		if ( ! is_wp_error( $resolved_url ) ) {
			return $resolved_url;
		}

		if ( 'dtbk_invalid_link_url' !== $resolved_url->get_error_code() ) {
			$has_valid_candidate = true;
		}

		if ( 'dtbk_link_http_status' === $resolved_url->get_error_code() ) {
			$received_response = true;
		}
	}

	if ( ! $has_valid_candidate ) {
		return new \WP_Error(
			'dtbk_invalid_link_url',
			__( 'Enter a valid web address.', 'dynamic-table-blocks' )
		);
	}

	if ( ! $received_response ) {
		return new \WP_Error(
			'dtbk_link_verification_unavailable',
			__(
				'We could not verify this web address right now. The link was not saved.',
				'dynamic-table-blocks'
			)
		);
	}

	return new \WP_Error(
		'dtbk_unreachable_link',
		__( 'We could not find a working page at this web address.', 'dynamic-table-blocks' )
	);
}

/**
 * Verify that a candidate external URL responds successfully.
 *
 * WordPress's safe HTTP wrapper rejects private and unsafe network targets.
 *
 * @since 1.4.6
 *
 * @param string $candidate URL to verify.
 * @return string|\WP_Error Final URL when reachable, otherwise an error.
 */
function dtbk_verify_external_link_url( $candidate ) {
	if ( ! wp_http_validate_url( $candidate ) ) {
		return new \WP_Error(
			'dtbk_invalid_link_url',
			__( 'Enter a valid web address.', 'dynamic-table-blocks' )
		);
	}

	$response = wp_safe_remote_get(
		$candidate,
		array(
			'timeout'             => 5,
			'redirection'         => 5,
			'limit_response_size' => 1,
			'reject_unsafe_urls'  => true,
		)
	);

	if ( is_wp_error( $response ) ) {
		return $response;
	}

	$status_code = (int) wp_remote_retrieve_response_code( $response );

	if ( $status_code < 200 || $status_code >= 599 ) {
		return new \WP_Error(
			'dtbk_link_invalid_response',
			__( 'The web address did not return a valid response.', 'dynamic-table-blocks' ),
			array( 'status_code' => $status_code )
		);
	}

	$final_url     = $candidate;
	$http_response = $response['http_response'] ?? null;

	if ( is_object( $http_response ) && method_exists( $http_response, 'get_response_object' ) ) {
		$response_object = $http_response->get_response_object();

		if ( is_object( $response_object ) && ! empty( $response_object->url ) ) {
			$final_url = $response_object->url;
		}
	}

	$final_scheme = wp_parse_url( $final_url, PHP_URL_SCHEME );

	if (
		! wp_http_validate_url( $final_url ) ||
		! in_array( strtolower( (string) $final_scheme ), array( 'http', 'https' ), true )
	) {
		return new \WP_Error(
			'dtbk_invalid_link_url',
			__( 'Enter a valid web address.', 'dynamic-table-blocks' )
		);
	}

	return esc_url_raw( $final_url, array( 'http', 'https' ) );
}
