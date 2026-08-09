<?php
/**
 * Editor-only REST adapter for the external link resolver utility.
 *
 * @since 1.4.6
 *
 * @package DynamicTableBlocks
 */

namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the editor endpoint used to resolve entered link URLs.
 *
 * @since 1.4.6
 *
 * @return void
 */
function dtbk_register_link_resolver_route() {
	register_rest_route(
		'dynamic-table-blocks/v1',
		'/resolve-link',
		array(
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => 'DynamicTableBlocks\\dtbk_rest_resolve_link',
				'permission_callback' => 'DynamicTableBlocks\\dtbk_rest_resolve_link_permissions_check',
				'args'                => array(
					'url' => array(
						'description' => __( 'Link URL to resolve.', 'dynamic-table-blocks' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			),
		)
	);
}

/**
 * Restrict link resolution to users who can author post or page content.
 *
 * @since 1.4.6
 *
 * @return true|\WP_Error True when permitted, otherwise a WP_Error.
 */
function dtbk_rest_resolve_link_permissions_check() {
	if ( current_user_can( 'edit_posts' ) || current_user_can( 'edit_pages' ) ) {
		return true;
	}

	return new \WP_Error(
		'dtbk_rest_cannot_resolve_link',
		__( 'Sorry, you are not allowed to resolve links.', 'dynamic-table-blocks' ),
		array( 'status' => rest_authorization_required_code() )
	);
}

/**
 * Return the resolved URL from the server-side utility.
 *
 * @since 1.4.6
 *
 * @param \WP_REST_Request $request REST request.
 * @return \WP_REST_Response|\WP_Error Resolved URL or error.
 */
function dtbk_rest_resolve_link( $request ) {
	$url = dtbk_resolve_external_link_url( $request->get_param( 'url' ) );

	if ( is_wp_error( $url ) ) {
		$error_data = $url->get_error_data();
		$status = 'dtbk_link_verification_unavailable' === $url->get_error_code()
			? 503
			: 422;

		$url->add_data(
			array_merge(
				is_array( $error_data ) ? $error_data : array(),
				array( 'status' => $status )
			)
		);
		return $url;
	}

	return rest_ensure_response( array( 'resolvedUrl' => (string) $url ) );
}
