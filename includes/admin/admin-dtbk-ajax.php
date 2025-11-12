<?php
/**
 * Provides the main Dynamic Tables admin page.
 */
namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

// #[\AllowDynamicProperties]
class DTBK_Admin_Ajax {

	// private array $notices = new DT_Admin_Notices();

	/**
	 * Constructor.
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		add_action('wp_ajax_dtbk_view_table', array( $this, 'view_table' ));
	}

	public function view_table() {
		// error_log('In Ajax View');

		check_ajax_referer( 'dtbk-table-list' );

		error_log('Post Data = ' . json_encode($_POST));
		$table_id = $_POST['id'];
		if ( empty( $table_id ) ) {
			wp_send_json_error( [ 'message' => __( 'No items selected.', 'dynamic-table-blocks' ) ], 400 );
		}

		// $table_id = isset($ids) ? $ids[0] : '';

		wp_set_current_user( get_current_user_id() );
		$request = new Dynamic_Tables_REST_Controller( 'GET', '/dynamic-table-blocks/v1/tables/' . $table_id);

		$response = rest_do_request( $request );
		$view_table_id = $response->data['id'];
		$view_table_num_columns = count($response->data['columns']);
		$view_table_num_rows = count($response->data['columns']);
		$view_current_row = (int) 1;
		$view_table_rows = array();
		$view_table_row_cells = array();

		error_log('Table Data = ' . json_encode($response->data));
		error_log(' ');

		foreach ( $response->data['cells'] as $key => $cell ) {

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

		error_log('Cells Processed = ' . json_encode($view_table_rows));

		wp_send_json_success(
			array(
				'cells' => $view_table_rows,
			),
			200
		);

		// wp_send_json_success( [
		//  'removed' => $ids,
		//  'notice'  => sprintf( _n( 'Deleted %d item.', 'Deleted %d items.', count( $ids ), 'bk-demo' ), count( $ids ) ),
		// ] );
		wp_die();
	}
}

// Instantiate.
	dtbk_new_instance( 'DTBK_Admin_Ajax' );
