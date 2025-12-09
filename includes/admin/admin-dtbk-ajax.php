<?php
/**
 * Provides the main Dynamic Tables admin page.
 */
namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class DTBK_Admin_Ajax {

	// private array $notices = new DT_Admin_Notices();

	/**
	 * Constructor.
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		add_action( 'wp_ajax_dtbk_view_table', array( $this, 'view_table' ) );
	}

	public function view_table() {
		// Check nonce
		check_ajax_referer( 'dtbk-table-list' );

		$table_id = isset( $_POST['id'] ) ? esc_attr( wp_unslash( $_POST['id'] ) ) : '';
		if ( empty( $table_id ) ) {
			wp_send_json_error( array( 'message' => __( 'No items selected.', 'dynamic-table-blocks' ) ), 400 );
		}

		// Create rest request to create table
		wp_set_current_user( get_current_user_id() );
		$path    = '/dynamic-table-blocks/v1/tables/' . $table_id;
		$method  = 'GET';
		$request = new \WP_REST_Request( $method, $path );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_query_params( array( 'context' => 'edit' ) );

		// Execute the request
		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response;
		}

		$view_current_row     = (int) 1;
		$view_table_rows      = array();
		$view_table_row_cells = array();

		foreach ( $response->data['cells'] as $cell ) {
			if ( $cell['row_id'] > $view_current_row ) {
				array_push(
					$view_table_rows,
					array(
						'row_id' => $view_current_row,
						'cells'  => $view_table_row_cells,
					)
				);

				$view_table_row_cells = array();
				++$view_current_row;
			}

			array_push(
				$view_table_row_cells,
				array(
					$cell['content'],
				)
			);
		}

		// Push the last row
		array_push(
			$view_table_rows,
			array(
				'row_id' => $view_current_row,
				'cells'  => $view_table_row_cells,
			)
		);

		wp_send_json_success(
			array(
				'cells' => wp_json_encode( $view_table_rows ),
			),
			200
		);

		wp_die();
	}
}

// Instantiate.
	dtbk_new_instance( 'DTBK_Admin_Ajax' );
