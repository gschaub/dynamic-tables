<?php
/**
 * Provides the main Dynamic Tables admin page.
 */
namespace DynamicTables;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

add_action('wp_ajax_dt_view_table', 'view_table');

function view_table() {

	error_log('In Ajax View');
	check_ajax_referer( 'dt-table-list' );

	$ids = array_map( 'intval', (array) ( $_POST['ids'] ?? [] ) );

	if ( empty( $ids ) ) {
		wp_send_json_error( [ 'message' => __( 'No items selected.', 'dynamic-table' ) ], 400 );
	}

	// TODO: your client side action here

	wp_send_json_success( [
		'removed' => $ids,
		'notice'  => sprintf( _n( 'Deleted %d item.', 'Deleted %d items.', count( $ids ), 'dt-demo' ), count( $ids ) ),
	] );
}
