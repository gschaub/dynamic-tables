<?php
/**
 * Provides AJAX services.
 */
namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class DTBK_Admin_Ajax {

	/**
	 * Constructor.
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		add_action( 'wp_ajax_dtbk_view_table', array( $this, 'view_table' ) );
		add_action( 'wp_ajax_dtbk_get_table_status', array( $this, 'get_table_header' ) );
		add_action( 'wp_ajax_dtbk_put_update_status', array( $this, 'update_table_status' ) );
		add_action( 'wp_ajax_dtbk_delete_table', array( $this, 'delete_table' ) );
		add_action( 'wp_ajax_dtbk_import_analyze', array( $this, 'import_analyze' ) );
		add_action( 'wp_ajax_dtbk_import_commit', array( $this, 'import_commit' ) );
	}

	/**
	 * Supply data for modal view data view in table list.
	 *
	 * Description - Extract and format table cell contents in support of UX view of table data
	 *
	 * @since 1.1.0
	 *
	 * @return void | /WP_Error
	 */
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
		$request->set_query_params( array( 'context' => 'view' ) );

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

	/**
	 * Retrieve table meta data.
	 *
	 * @since 1.4.1
	 *
	 * @return void | /WP_Error
	 */
	public function get_table_header() {
		// Check nonce
		check_ajax_referer( 'dtbk-table-list' );

		$cap = dtbk_get_setting( 'capability' );
		if ( ! current_user_can( $cap ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'You are not allowed to manage tables.', 'dynamic-table-blocks' ),
				),
				403
			);
		}

		$table_id = isset( $_POST['id'] ) ? absint( wp_unslash( $_POST['id'] ) ) : 0;
		if ( empty( $table_id ) ) {
			wp_send_json_error( array( 'message' => __( 'No items selected.', 'dynamic-table-blocks' ) ), 400 );
		}

		$table = $this->fetch_dynamic_table( $table_id );
		if ( is_wp_error( $table ) ) {
			$this->send_status_error( $table );
		}

		$header          = is_array( $table['header'] ?? null ) ? $table['header'] : array();
		$post_id         = isset( $header['post_id'] ) ? (int) $header['post_id'] : 0;
		$block_table_ref = isset( $header['block_table_ref'] ) ? (string) $header['block_table_ref'] : '';
		$post            = null;
		$matched_blocks  = array();

		if ( $post_id > 0 ) {
			$post = get_post( $post_id );
		}

		if ( $post instanceof \WP_Post ) {
			$matched_blocks = $this->get_matching_table_blocks_for_post( $post, $table_id, $block_table_ref );
		}

		$matched_block = array();
		$link_status = '';

		/**
		 * Valid statuses: Linked | Unlinked | Broken | Corrupt
		 */
		if ( $post_id <= 0 ) {
			$link_status = 'Unlinked';
		} elseif ( ! ( $post instanceof \WP_Post ) ) {
			$link_status = 'Broken';
		} elseif ( 0 === count( $matched_blocks ) ) {
			$link_status = 'Broken';
		} elseif ( count( $matched_blocks ) > 1 ) {
			$link_status = 'Corrupt';
		} else {
			$matched_block = $matched_blocks[0];

			if ( empty( $matched_block['table_id'] ) ) {
				$link_status = 'Corrupt';
			} elseif (
				'' !== $block_table_ref &&
				! empty( $matched_block['block_table_ref'] ) &&
				$matched_block['block_table_ref'] !== $block_table_ref
			) {
				$link_status = 'Corrupt';
			} else {
				$link_status = 'Linked';
			}
		}

		wp_send_json_success(
			array(
				'table_meta' => wp_json_encode(
					array_merge(
						$this->build_status_table_meta( $table ),
						array(
							'link_status'  => $link_status,
							'link_details' => array(
								'post_id'                 => $post_id,
								'post_exists'             => $post instanceof \WP_Post,
								'matching_block_count'    => count( $matched_blocks ),
								'matched_table_id'        => isset( $matched_block['table_id'] ) ? (int) $matched_block['table_id'] : 0,
								'matched_block_table_ref' => isset( $matched_block['block_table_ref'] ) ? (string) $matched_block['block_table_ref'] : '',
							),
						)
					)
				),
			),
			200
		);

		wp_die();
	}

	/**
	 * Update status for a single table.
	 *
	 * @since 1.4.1
	 *
	 * @return void
	 */
	public function update_table_status() {
		// Check nonce
		check_ajax_referer( 'dtbk-table-list' );

		$cap = dtbk_get_setting( 'capability' );
		if ( ! current_user_can( $cap ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'You are not allowed to manage tables.', 'dynamic-table-blocks' ),
				),
				403
			);
		}

		$table_id = isset( $_POST['id'] ) ? absint( wp_unslash( $_POST['id'] ) ) : 0;
		if ( empty( $table_id ) ) {
			wp_send_json_error( array( 'message' => __( 'No items selected.', 'dynamic-table-blocks' ) ), 400 );
		}

		$new_status = isset( $_POST['newStatus'] ) ? sanitize_key( wp_unslash( $_POST['newStatus'] ) ) : '';
		$table      = $this->fetch_dynamic_table( $table_id );

		if ( is_wp_error( $table ) ) {
			$this->send_status_error( $table );
		}

		$current_status = isset( $table['header']['status'] ) ? sanitize_key( (string) $table['header']['status'] ) : '';

		if ( empty( $new_status ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'A new table status is required.', 'dynamic-table-blocks' ),
				),
				400
			);
		}

		if ( $new_status === $current_status ) {
			wp_send_json_success(
				array(
					'message'    => __( 'Table status updated successfully.', 'dynamic-table-blocks' ),
					'table_meta' => wp_json_encode( $this->build_status_table_meta( $table ) ),
				),
				200
			);
		}

		if ( ! in_array( $new_status, array( 'loaded', 'saved' ), true ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Invalid table status.', 'dynamic-table-blocks' ),
				),
				400
			);
		}

		$current_post_id         = isset( $table['header']['post_id'] ) ? (int) $table['header']['post_id'] : 0;
		$current_block_table_ref = isset( $table['header']['block_table_ref'] ) ? (string) $table['header']['block_table_ref'] : '';

		$table_update = array(
			'id'     => $table_id,
			'header' => array(
				'id'              => (int) $table_id,
				'status'          => $new_status,
				'post_id'         => $current_post_id,
				'block_table_ref' => $current_block_table_ref,
			),
		);

		$updated_table = $this->update_dynamic_table( $table_update );
		if ( is_wp_error( $updated_table ) ) {
			$this->send_status_error( $updated_table );
		}

		wp_send_json_success(
			array(
				'message'    => __( 'Table status updated successfully.', 'dynamic-table-blocks' ),
				'table_meta' => wp_json_encode( $this->build_status_table_meta( $updated_table ) ),
			),
			200
		);
	}

	/**
	 * Build lightweight table metadata for the status dialog.
	 *
	 * @since 1.4.1
	 *
	 * @param array $table Full table response.
	 * @return array
	 */
	private function build_status_table_meta( array $table ) {
		$header = is_array( $table['header'] ?? null ) ? $table['header'] : array();

		return array(
			'name'    => isset( $header['table_name'] ) ? (string) $header['table_name'] : '',
			'status'  => isset( $header['status'] ) ? (string) $header['status'] : '',
			'post_id' => isset( $header['post_id'] ) ? (int) $header['post_id'] : 0,
		);
	}

	/**
	 * Return a WP_Error as a JSON error response for status actions.
	 *
	 * @since 1.4.1
	 *
	 * @param \WP_Error $error Error to return.
	 * @return void
	 */
	private function send_status_error( \WP_Error $error ) {
		$status = 400;
		$data   = $error->get_error_data();

		if ( is_int( $data ) ) {
			$status = $data;
		} elseif ( is_array( $data ) && isset( $data['status'] ) ) {
			$status = (int) $data['status'];
		}

		wp_send_json_error(
			array(
				'message' => $error->get_error_message(),
				'code'    => $error->get_error_code(),
			),
			$status
		);
	}

	/**
	 * Retrieve table meta data.
	 *
	 * @since 1.4.1
	 *
	 * @return void | /WP_Error
	 */
	public function delete_table() {
		// Check nonce
		check_ajax_referer( 'dtbk-table-list' );

		$cap = dtbk_get_setting( 'capability' );
		if ( ! current_user_can( $cap ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'You are not allowed to manage tables.', 'dynamic-table-blocks' ),
				),
				403
			);
		}

		$table_id = isset( $_POST['id'] ) ? absint( wp_unslash( $_POST['id'] ) ) : 0;
		$delete_related_block = isset( $_POST['delete_related_block'] ) ? absint( wp_unslash( $_POST['delete_related_block'] ) ) : false;

		if ( empty( $table_id ) ) {
			wp_send_json_error( array( 'message' => __( 'No items selected.', 'dynamic-table-blocks' ) ), 400 );
		}

		if ( $delete_related_block ) {
			$deleted_table_blocks = $this->delete_table_blocks( $table_id );
			if ( is_wp_error( $deleted_table_blocks ) ) {
				$this->send_status_error( $deleted_table_blocks );
			}
		}

		$deleted_table = $this->delete_dynamic_table( $table_id );
		if ( is_wp_error( $deleted_table ) ) {
			$this->send_status_error( $deleted_table );
		}

		wp_send_json_success(
			array(
				'message' => __( 'Table successfully deleted.', 'dynamic-table-blocks' ),
				'deleted' => ! empty( $deleted_table['deleted'] ),
				'tableId' => $table_id,
			),
			200
		);

		wp_die();
	}

	/**
	 * Load imported table data to an html table for user review prior to creating the new table
	 *
	 * @since 1.4.0
	 */
	public function import_analyze() {
		check_ajax_referer( 'dtbk-table-list' );

		$cap = dtbk_get_setting( 'capability' );
		if ( ! current_user_can( $cap ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'You are not allowed to import tables.', 'dynamic-table-blocks' ),
				),
				403
			);
		}

		$format        = $this->get_import_format();
		$uploaded_file = $this->get_import_file();
		$options       = $this->get_import_options();

		if ( is_wp_error( $format ) ) {
			$this->send_import_error( $format );
		}

		if ( is_wp_error( $uploaded_file ) ) {
			$this->send_import_error( $uploaded_file );
		}

		$prepared = $this->build_import_table( $format, $uploaded_file, $options, false );
		if ( is_wp_error( $prepared ) ) {
			$this->send_import_error( $prepared );
		}

		wp_send_json_success(
			$this->build_import_analysis_payload( $format, $prepared['table'], $prepared['meta'] ),
			200
		);
	}

	/**
	 * Create a dynamic table from imported table data
	 *
	 * @since 1.4.0
	 */
	public function import_commit() {
		check_ajax_referer( 'dtbk-table-list' );

		$cap = dtbk_get_setting( 'capability' );
		if ( ! current_user_can( $cap ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'You are not allowed to import tables.', 'dynamic-table-blocks' ),
				),
				403
			);
		}

		$format        = $this->get_import_format();
		$uploaded_file = $this->get_import_file();
		$options       = $this->get_import_options();

		if ( is_wp_error( $format ) ) {
			$this->send_import_error( $format );
		}

		if ( is_wp_error( $uploaded_file ) ) {
			$this->send_import_error( $uploaded_file );
		}

		$prepared = $this->build_import_table( $format, $uploaded_file, $options, true );

		if ( is_wp_error( $prepared ) ) {
			$this->send_import_error( $prepared );
		}

		$result = (int) $prepared['table']['id'] > 0
			? $this->persist_import_table( $prepared['table'] )
			: $this->create_import_table( $prepared['table'] );

		if ( is_wp_error( $result ) ) {
			$this->send_import_error( $result );
		}

		$result_table_id   = isset( $result['id'] ) ? (int) $result['id'] : (int) $prepared['table']['id'];
		$result_table_name = isset( $result['header']['table_name'] ) ? $result['header']['table_name'] : $prepared['table']['header']['table_name'];

		wp_send_json_success(
			array(
				'message'   => __( 'Table imported successfully.', 'dynamic-table-blocks' ),
				'tableId'   => $result_table_id,
				'tableName' => $result_table_name,
			),
			200
		);
	}

	/**
	 * Retrieve and return the imported file format from the import request.
	 *
	 * @since 1.4.0
	 *
	 * @return string File format of the file to load.
	 */
	private function get_import_format() {
		$format = isset( $_POST['format'] ) ? sanitize_key( wp_unslash( $_POST['format'] ) ) : '';

		if ( ! in_array( $format, array( 'json', 'csv' ), true ) ) {
			return new \WP_Error(
				'dtbk_import_invalid_format',
				__( 'Invalid import format.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		return $format;
	}

	/**
	 * Gather and return the import options selected by the user in the import wizard
	 *
	 * @since 1.4.0
	 *
	 * @return array Import options selected by the user.
	 */
	private function get_import_options() {
		$raw          = isset( $_POST['options'] ) ? wp_unslash( $_POST['options'] ) : '{}';
		$decoded      = json_decode( $raw, true );
		$options      = is_array( $decoded ) ? $decoded : array();
		$restore_mode = isset( $options['restoreMode'] ) ? sanitize_key( (string) $options['restoreMode'] ) : 'create';
		$restore_mode = in_array( $restore_mode, array( 'replace', 'create' ), true ) ? $restore_mode : 'create';

		return array(
			'firstRowHeader' => ! empty( $options['firstRowHeader'] ),
			'itemIndex'      => max( 0, absint( $options['itemIndex'] ?? 0 ) ),
			'headerNames'    => isset( $options['headerNames'] ) && is_array( $options['headerNames'] )
				? array_values(
					array_map(
						static function ( $value ) {
							return sanitize_text_field( (string) $value );
						},
						$options['headerNames']
					)
				)
				: array(),
			'restoreMode'    => $restore_mode,
		);
	}

	/**
	 * Retrieve and validate the uploaded file from the import request.
	 *
	 * @since 1.4.0
	 *
	 * @return array|\WP_Error Metadata from the uploaded file
	 */
	private function get_import_file() {
		if ( empty( $_FILES['file'] ) || ! is_array( $_FILES['file'] ) ) {
			return new \WP_Error(
				'dtbk_import_missing_file',
				__( 'No import file was uploaded.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		$file = $_FILES['file'];

		if ( ! empty( $file['error'] ) ) {
			return new \WP_Error(
				'dtbk_import_upload_error',
				__( 'The import upload could not be processed.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		if ( empty( $file['tmp_name'] ) || ! is_uploaded_file( $file['tmp_name'] ) ) {
			return new \WP_Error(
				'dtbk_import_invalid_upload',
				__( 'The uploaded file is not valid.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		return array(
			'name'     => sanitize_file_name( wp_unslash( $file['name'] ) ),
			'tmp_name' => $file['tmp_name'],
			'type'     => isset( $file['type'] ) ? sanitize_text_field( wp_unslash( $file['type'] ) ) : '',
		);
	}

	/**
	 * File Creation controller to build table array based on file type
	 *
	 * @since 1.4.0
	 *
	 * @param string $format       File format
	 * @param array $uploaded_file File metadata
	 * @param array $options       User selected import options
	 * @param boolean $is_commit   We are creating/saving the table
	 * @return array|\WP_Error     Import file transformed into REST API table shape
	 */
	private function build_import_table( $format, $uploaded_file, $options, $is_commit = false ) {
		switch ( $format ) {
			case 'json':
				// JSON restores the backed-up payload but keeps the selected table identity.
				return $this->normalize_json_import( $uploaded_file, $options, $is_commit );

			case 'csv':
				// CSV always creates a new independent table.
				return $this->normalize_csv_import( $uploaded_file, $options, $is_commit );

			default:
				return new \WP_Error(
					'dtbk_import_invalid_format',
					__( 'Invalid import format.', 'dynamic-table-blocks' ),
					array( 'status' => 400 )
				);
		}
	}

	/**
	 * Transform JSON input to standard dynamic tables array
	 *
	 * @since 1.4.0
	 *
	 * @param array $uploaded_file File metadata
	 * @param array $options       User selected import options
	 * @param boolean $is_commit   We are creating/saving the table
	 * @return array|\WP_Error Import file transformed into REST API table shape
	 */
	private function normalize_json_import( $uploaded_file, $options, $is_commit = false ) {

		$parsed = $this->parse_json_import_file( $uploaded_file );
		if ( is_wp_error( $parsed ) ) {
			return $parsed;
		}

		$items      = $parsed['items'];
		$item_count = count( $items );
		$item_index = min( $options['itemIndex'], max( 0, $item_count - 1 ) );
		$warnings   = array();

		if ( $item_count > 1 ) {
			$warnings[] = __( 'This backup contains multiple tables. Review the selected backup item before importing.', 'dynamic-table-blocks' );
		}

		if ( isset( $parsed['schema_version'] ) && (int) $parsed['schema_version'] > 1 ) {
			$warnings[] = __( 'This backup was created by a newer schema version. Review the preview carefully.', 'dynamic-table-blocks' );
		}

		$item = $items[ $item_index ] ?? null;
		if ( ! is_array( $item ) || empty( $item['table'] ) || ! is_array( $item['table'] ) ) {
			return new \WP_Error(
				'dtbk_import_invalid_json_item',
				__( 'The selected backup item is not a valid table export.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		$imported_table_id = $this->extract_imported_table_id( $item['table'] );
		$existing_target   = $this->find_existing_table_by_id( $imported_table_id );
		if ( is_wp_error( $existing_target ) ) {
			return $existing_target;
		}

		$has_existing_target = is_array( $existing_target ) && ! empty( $existing_target['id'] );
		$restore_mode        = ( $has_existing_target && 'replace' === $options['restoreMode'] ) ? 'replace' : 'create';

		if ( $has_existing_target ) {
			$warnings[] = __( 'A local table with this imported table ID already exists. Choose whether to replace it or create a new independent table.', 'dynamic-table-blocks' );
		}

		if ( $is_commit && 'replace' === $options['restoreMode'] && ! $has_existing_target ) {
			return new \WP_Error(
				'dtbk_import_restore_target_missing',
				__( 'The existing table selected for restore could not be found.', 'dynamic-table-blocks' ),
				array( 'status' => 409 )
			);
		}

		$table = ( $has_existing_target && 'replace' === $restore_mode )
			? $this->build_normalized_json_table( $item['table'], $existing_target )
			: $this->build_normalized_json_table( $item['table'] );

		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$source_name = '';
		if ( ! empty( $item['table']['header']['table_name'] ) ) {
			$source_name = (string) $item['table']['header']['table_name'];
		} elseif ( ! empty( $item['table']['title'] ) ) {
			$source_name = (string) $item['table']['title'];
		}

		return array(
			'table' => $table,
			'meta'  => array(
				'source'   => array(
					'importedTableId'   => $imported_table_id,
					'fileName'          => $uploaded_file['name'],
					'tableName'         => $source_name,
					'itemCount'         => $item_count,
					'selectedItemIndex' => $item_index,
					'availableItems'    => $this->build_json_item_options( $items ),
				),
				'restore'  => array(
					'importedTableId'   => $imported_table_id,
					'hasExistingTable'  => $has_existing_target,
					'existingTableId'   => $has_existing_target ? (int) $existing_target['id'] : 0,
					'existingTableName' => $has_existing_target ? (string) ( $existing_target['header']['table_name'] ?? '' ) : '',
				),
				'warnings' => $warnings,
				'options'  => array(
					'firstRowHeader' => ! empty( $table['header']['attributes']['enableHeaderRow'] ),
					'itemIndex'      => $item_index,
					'restoreMode'    => $restore_mode,
				),
			),
		);
	}

	/**
	 * Retrieve and format file contents as an array.
	 *
	 * @since 1.4.0
	 *
	 * @param array $uploaded_file  One or more table
	 * @return array|\WP_Error JSON file transformed into an array of rows
	 */
	private function parse_json_import_file( array $uploaded_file ) {
		$contents = file_get_contents( $uploaded_file['tmp_name'] );
		if ( false === $contents || '' === trim( $contents ) ) {
			return new \WP_Error(
				'dtbk_import_empty_json',
				__( 'The JSON import file is empty.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		$decoded = json_decode( $contents, true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			return new \WP_Error(
				'dtbk_import_invalid_json',
				__( 'The JSON import file could not be parsed.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		if ( isset( $decoded['schema'] ) && 'dtbk-backup' === $decoded['schema'] && isset( $decoded['items'] ) && is_array( $decoded['items'] ) ) {
			return array(
				'items'          => $decoded['items'],
				'schema_version' => $decoded['schema_version'] ?? 1,
			);
		}

		if ( isset( $decoded['table'] ) && is_array( $decoded['table'] ) ) {
			return array(
				'items'          => array( $decoded ),
				'schema_version' => 1,
			);
		}

		if ( isset( $decoded['header'], $decoded['rows'], $decoded['columns'], $decoded['cells'] ) ) {
			return array(
				'items'          => array(
					array(
						'table' => $decoded,
					),
				),
				'schema_version' => 1,
			);
		}

		return new \WP_Error(
			'dtbk_import_invalid_json_shape',
			__( 'The JSON import file does not match the expected backup structure.', 'dynamic-table-blocks' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Transform JSON table array into
	 *
	 * @since 1.4.0
	 *
	 * @param array $source_table Imported JSON table
	 * @param array $target_table Existing table with the imported table's table_id
	 * @return array|\WP_Error Import file transformed into REST API table shape
	 */
	private function build_normalized_json_table( $source_table, $target_table = array() ) {
		$is_create          = empty( $target_table ) || empty( $target_table['id'] );
		$target_id          = $is_create ? 0 : (int) $target_table['id'];
		$target_header      = isset( $target_table['header'] ) && is_array( $target_table['header'] ) ? $target_table['header'] : array();
		$source_header      = isset( $source_table['header'] ) && is_array( $source_table['header'] ) ? $source_table['header'] : array();
		$source_rows        = isset( $source_table['rows'] ) && is_array( $source_table['rows'] ) ? $source_table['rows'] : array();
		$source_columns     = isset( $source_table['columns'] ) && is_array( $source_table['columns'] ) ? $source_table['columns'] : array();
		$source_cells       = isset( $source_table['cells'] ) && is_array( $source_table['cells'] ) ? $source_table['cells'] : array();
		$normalized_rows    = array();
		$normalized_columns = array();
		$normalized_cells   = array();
		$row_ids            = array();
		$column_ids         = array();
		$cell_coords        = array();

		$source_rows    = array_values(
			array_filter(
				$source_rows,
				static function ( $row ) {
					return is_array( $row ) && isset( $row['row_id'] ) && (int) $row['row_id'] > 0;
				}
			)
		);
		$source_columns = array_values(
			array_filter(
				$source_columns,
				static function ( $column ) {
					return is_array( $column ) && isset( $column['column_id'] ) && (int) $column['column_id'] > 0;
				}
			)
		);
		$source_cells   = array_values(
			array_filter(
				$source_cells,
				static function ( $cell ) {
					return is_array( $cell )
						&& isset( $cell['row_id'], $cell['column_id'] )
						&& (int) $cell['row_id'] > 0
						&& (int) $cell['column_id'] > 0;
				}
			)
		);

		usort(
			$source_rows,
			static function ( $a, $b ) {
				return (int) $a['row_id'] <=> (int) $b['row_id'];
			}
		);
		usort(
			$source_columns,
			static function ( $a, $b ) {
				return (int) $a['column_id'] <=> (int) $b['column_id'];
			}
		);
		usort(
			$source_cells,
			static function ( $a, $b ) {
				$left  = array( (int) $a['row_id'], (int) $a['column_id'] );
				$right = array( (int) $b['row_id'], (int) $b['column_id'] );
				return $left <=> $right;
			}
		);

		if ( empty( $source_rows ) || empty( $source_columns ) || empty( $source_cells ) ) {
			return new \WP_Error(
				'dtbk_import_incomplete_json',
				__( 'The JSON backup must contain rows, columns, and cells.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		foreach ( $source_rows as $row ) {
			$row_id = (int) $row['row_id'];
			if ( isset( $row_ids[ $row_id ] ) ) {
				return new \WP_Error(
					'dtbk_import_duplicate_row',
					__( 'The JSON backup contains duplicate row identifiers.', 'dynamic-table-blocks' ),
					array( 'status' => 400 )
				);
			}

			$row_ids[ $row_id ] = true;
			$normalized_rows[]  = array(
				'table_id'   => $target_id,
				'row_id'     => $row_id,
				'attributes' => array_merge(
					get_default_row_attributes(),
					is_array( $row['attributes'] ?? null ) ? $row['attributes'] : array()
				),
				'classes'    => isset( $row['classes'] ) ? (string) $row['classes'] : '',
			);
		}

		foreach ( $source_columns as $column ) {
			$column_id = (int) $column['column_id'];
			if ( isset( $column_ids[ $column_id ] ) ) {
				return new \WP_Error(
					'dtbk_import_duplicate_column',
					__( 'The JSON backup contains duplicate column identifiers.', 'dynamic-table-blocks' ),
					array( 'status' => 400 )
				);
			}

			$column_ids[ $column_id ] = true;
			$normalized_columns[]     = array(
				'table_id'    => $target_id,
				'column_id'   => $column_id,
				'column_name' => isset( $column['column_name'] ) ? (string) $column['column_name'] : '',
				'attributes'  => array_merge(
					get_default_column_attributes(),
					is_array( $column['attributes'] ?? null ) ? $column['attributes'] : array()
				),
				'classes'     => isset( $column['classes'] ) ? (string) $column['classes'] : '',
			);
		}

		foreach ( $source_cells as $cell ) {
			$row_id    = (int) $cell['row_id'];
			$column_id = (int) $cell['column_id'];
			$coord     = $row_id . ':' . $column_id;

			if ( ! isset( $row_ids[ $row_id ] ) || ! isset( $column_ids[ $column_id ] ) ) {
				return new \WP_Error(
					'dtbk_import_invalid_cell_coord',
					__( 'The JSON backup contains cells that reference missing rows or columns.', 'dynamic-table-blocks' ),
					array( 'status' => 400 )
				);
			}

			if ( isset( $cell_coords[ $coord ] ) ) {
				return new \WP_Error(
					'dtbk_import_duplicate_cell',
					__( 'The JSON backup contains duplicate cell coordinates.', 'dynamic-table-blocks' ),
					array( 'status' => 400 )
				);
			}

			$cell_coords[ $coord ] = true;
			$content               = isset( $cell['content'] ) ? (string) $cell['content'] : '';

			$normalized_cells[] = array(
				'table_id'   => $target_id,
				'column_id'  => $column_id,
				'row_id'     => $row_id,
				'attributes' => $this->ensure_cell_attributes(
					is_array( $cell['attributes'] ?? null ) ? $cell['attributes'] : array(),
					$content
				),
				'classes'    => isset( $cell['classes'] ) ? (string) $cell['classes'] : '',
				'content'    => $content,
			);
		}

		if ( count( $normalized_cells ) !== count( $normalized_rows ) * count( $normalized_columns ) ) {
			return new \WP_Error(
				'dtbk_import_incomplete_grid',
				__( 'The JSON backup does not contain a complete table grid.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		$table_name = '';
		if ( ! empty( $source_header['table_name'] ) ) {
			$table_name = (string) $source_header['table_name'];
		} elseif ( ! empty( $source_table['title'] ) ) {
			$table_name = (string) $source_table['title'];
		} else {
			$table_name = (string) ( $target_header['table_name'] ?? '' );
		}

		$source_header_attributes = is_array( $source_header['attributes'] ?? null ) ? $source_header['attributes'] : array();
		$target_header_attributes = is_array( $target_header['attributes'] ?? null ) ? $target_header['attributes'] : array();
		$header_attributes        = $is_create
			? $source_header_attributes
			: array_merge( $target_header_attributes, $source_header_attributes );

		return array(
			'id'      => $target_id,
			'title'   => $table_name,
			'header'  => array(
				'id'              => $target_id,
				'block_table_ref' => $is_create ? '' : (string) ( $target_header['block_table_ref'] ?? '' ),
				'status'          => $is_create ? 'loaded' : (string) ( $target_header['status'] ?? 'loaded' ),
				'post_id'         => $is_create ? 0 : (int) ( $target_header['post_id'] ?? 0 ),
				'table_name'      => $table_name,
				'attributes'      => $header_attributes,
				'classes'         => $is_create
					? ( isset( $source_header['classes'] ) ? (string) $source_header['classes'] : '' )
					: ( isset( $source_header['classes'] )
						? (string) $source_header['classes']
						: (string) ( $target_header['classes'] ?? '' ) ),
			),
			'rows'    => $normalized_rows,
			'columns' => $normalized_columns,
			'cells'   => $normalized_cells,
		);
	}

	/**
	 * Transform CSV input to standard dynamic tables array
	 *
	 * @since 1.4.0
	 *
	 * @param array $uploaded_file File metadata
	 * @param array $options       User selected import options
	 * @param boolean $is_commit   We are creating/saving the table
	 * @return array|\WP_Error Import file transformed into REST API table shape
	 */
	private function normalize_csv_import( $uploaded_file, $options, $is_commit = false ) {
		$rows = $this->parse_csv_rows( $uploaded_file['tmp_name'] );
		if ( is_wp_error( $rows ) ) {
			return $rows;
		}

		$first_row_header = ! empty( $options['firstRowHeader'] );
		$provided_headers = isset( $options['headerNames'] ) && is_array( $options['headerNames'] ) ? $options['headerNames'] : array();
		$max_columns      = 0;
		$warnings         = array();

		foreach ( $rows as $row_index => $row ) {
			$rows[ $row_index ] = array_map(
				array( $this, 'normalize_import_text' ),
				is_array( $row ) ? $row : array()
			);
		}

		/* Get maximum column count */
		foreach ( $rows as $row ) {
			$max_columns = max( $max_columns, count( $row ) );
		}

		if ( empty( $rows ) || 0 === $max_columns ) {
			return new \WP_Error(
				'dtbk_import_empty_csv',
				__( 'The CSV import file does not contain any table data.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		foreach ( $rows as $row_index => $row ) {
			if ( count( $row ) !== $max_columns ) {
				$warnings[] = sprintf(
					/* translators: 1: row number, 2: original column count, 3: normalized column count */
					__( 'Row %1$d contained %2$d column(s) and was padded to %3$d.', 'dynamic-table-blocks' ),
					(int) $row_index + 1,
					count( $row ),
					$max_columns
				);
				$rows[ $row_index ] = array_pad( $row, $max_columns, '' );
			}
		}

		$header_inputs = $this->build_csv_header_inputs( $max_columns, $provided_headers );

		if ( ! $first_row_header && $is_commit ) {
			foreach ( $header_inputs as $header_input ) {
				if ( '' === trim( (string) $header_input['value'] ) ) {
					return new \WP_Error(
						'dtbk_import_missing_header_name',
						__( 'Enter a name for every CSV column.', 'dynamic-table-blocks' ),
						array( 'status' => 400 )
					);
				}
			}
		}

		$table_name                          = (string) pathinfo( $uploaded_file['name'], PATHINFO_FILENAME );
		$target_id                           = 0;
		$table_attributes                    = get_default_table_attributes();
		$table_attributes['enableHeaderRow'] = $first_row_header;

		/* Create table structure and populate header data */
		$table = array(
			'id'      => $target_id,
			'title'   => $table_name,
			'header'  => array(
				'id'              => $target_id,
				'block_table_ref' => '',
				'status'          => 'loaded',
				'post_id'         => 0,
				'table_name'      => $table_name,
				'attributes'      => $table_attributes,
				'classes'         => '',
			),
			'rows'    => array(),
			'columns' => array(),
			'cells'   => array(),
		);

		/* Build table columns */
		for ( $column_id = 1; $column_id <= $max_columns; $column_id++ ) {
			if ( $first_row_header ) {
				$column_name = trim( $this->normalize_import_text( $rows[0][ $column_id - 1 ] ?? '' ) );
				if ( '' === $column_name ) {
					$column_name = $this->get_csv_fallback_header_name( $column_id );
				}
			} else {
				$column_name = trim( $this->normalize_import_text( $header_inputs[ $column_id - 1 ]['value'] ) );
			}

			$table['columns'][] = array(
				'table_id'    => $target_id,
				'column_id'   => $column_id,
				'column_name' => $column_name,
				'attributes'  => $this->build_csv_column_attributes(),
				'classes'     => '',
			);
		}

		/* Build table rows */
		foreach ( $rows as $row_index => $row_values ) {
			$row_id    = $row_index + 1;
			$is_header = $first_row_header && 1 === $row_id;

			$table['rows'][] = array(
				'table_id'   => $target_id,
				'row_id'     => $row_id,
				'attributes' => array_merge(
					get_default_row_attributes(),
					array( 'isHeader' => (bool) $is_header )
				),
				'classes'    => '',
			);

			/* Build table cells */
			for ( $column_id = 1; $column_id <= $max_columns; $column_id++ ) {
				$raw_value    = $this->normalize_import_text( $row_values[ $column_id - 1 ] ?? '' );
				$cell_content = $this->sanitize_import_content( $raw_value );

				$table['cells'][] = array(
					'table_id'   => $target_id,
					'column_id'  => $column_id,
					'row_id'     => $row_id,
					'attributes' => $this->build_csv_cell_attributes( $raw_value ),
					'classes'    => '',
					'content'    => $cell_content,
				);
			}
		}

		return array(
			'table' => $table,
			'meta'  => array(
				'source'          => array(
					'fileName'          => $uploaded_file['name'],
					'tableName'         => (string) pathinfo( $uploaded_file['name'], PATHINFO_FILENAME ),
					'itemCount'         => 1,
					'selectedItemIndex' => 0,
					'availableItems'    => array(),
				),
				'warnings'        => $warnings,
				'options'         => array(
					'firstRowHeader' => $first_row_header,
					'itemIndex'      => 0,
					'restoreMode'    => 'create',
				),
				'csvHeaderInputs' => $header_inputs,
			),
		);
	}

	/**
	 * Parse the uploaded CSV file and return its rows as arrays of cell values.
	 *
	 * @since 1.4.0
	 *
	 * @param string $tmp_name File metadata
	 * @return array|\WP_Error CSV file transformed into an array of rows
	 */
	private function parse_csv_rows( $tmp_name ) {
		$handle = fopen( $tmp_name, 'rb' );
		if ( false === $handle ) {
			return new \WP_Error(
				'dtbk_import_csv_open_failed',
				__( 'The CSV import file could not be opened.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		$rows = array();
		while ( false !== ( $row = fgetcsv( $handle, 0, ',', '"', '\\' ) ) ) {
			$row = is_array( $row ) ? $row : array();

			if ( 1 === count( $row ) && null === $row[0] ) {
				continue;
			}

			$rows[] = $row;
		}

		fclose( $handle );

		return $rows;
	}

	/**
	 * Parse the uploaded CSV file and return its rows as arrays of cell values.
	 *
	 * @since 1.4.0
	 *
	 * @param string $format   File format
	 * @param array $table     table data
	 * @param array $meta      Supporting data for file processing, feedback and user prompts
	 * @return array           Summary table data and other meta to support subsequent import commit
	 */
	private function build_import_analysis_payload( $format, $table, $meta ) {
		$restore      = isset( $meta['restore'] ) && is_array( $meta['restore'] ) ? $meta['restore'] : array();
		$restore_mode = isset( $meta['options']['restoreMode'] ) ? (string) $meta['options']['restoreMode'] : 'create';
		$target       = array(
			'id'        => 0,
			'tableName' => __( 'New table', 'dynamic-table-blocks' ),
		);

		if ( 'replace' === $restore_mode && ! empty( $restore['hasExistingTable'] ) ) {
			$target = array(
				'id'        => (int) ( $restore['existingTableId'] ?? 0 ),
				'tableName' => (string) ( $restore['existingTableName'] ?? '' ),
			);
		}
		return array(
			'format'          => $format,
			'source'          => $meta['source'],
			'restore'         => $restore,
			'target'          => $target,
			'summary'         => array(
				'rows'    => count( $table['rows'] ),
				'columns' => count( $table['columns'] ),
				'cells'   => count( $table['cells'] ),
			),
			'warnings'        => $meta['warnings'],
			'csvHeaderInputs' => $meta['csvHeaderInputs'] ?? array(),
			'preview'         => $this->build_import_preview( $table ),
			'options'         => $meta['options'],
		);
	}

	/**
	 * Transform CSV input to standard dynamic tables array
	 *
	 * @since 1.4.0
	 *
	 * @param integer $column_count    Number of columns in the imported CSV File
	 * @param array $provided_headers  User selected import options
	 * @return array|\WP_Error Column header names
	 */
	private function build_csv_header_inputs( $column_count, $provided_headers = array() ) {
		$inputs = array();

		for ( $column_id = 1; $column_id <= $column_count; $column_id++ ) {
			$fallback = $this->get_csv_fallback_header_name( $column_id );
			$inputs[] = array(
				'label' => $fallback,
				'value' => isset( $provided_headers[ $column_id - 1 ] ) && '' !== trim( (string) $provided_headers[ $column_id - 1 ] )
					? trim( (string) $provided_headers[ $column_id - 1 ] )
					: $fallback,
			);
		}

		return $inputs;
	}

	/**
	 * Create default column header name
	 *
	 * @since 1.4.0
	 *
	 * @param integer $column_id    Number of columns in the imported CSV File
	 * @return string Default column header name
	 */
	private function get_csv_fallback_header_name( $column_id ) {
		return 'Column ' . number_to_letter( $column_id );
	}

	/**
	 * Prepare table data for analysis results
	 *
	 * Description: Return no more than 5 rows of simplified table data for user review prior to saving
	 *              the data as a table.
	 *
	 * @since 1.4.0
	 *
	 * @param array $table    Full table data
	 * @return array Default column header name
	 */
	private function build_import_preview( array $table ) {
		$preview_columns = array_slice( $table['columns'], 0, 5 );
		$preview_rows    = array_slice( $table['rows'], 0, 5 );
		$cell_map        = array();

		foreach ( $table['cells'] as $cell ) {
			$row_id    = (int) $cell['row_id'];
			$column_id = (int) $cell['column_id'];

			if ( $row_id > 5 || $column_id > 5 ) {
				continue;
			}

			$cell_map[ $row_id ][ $column_id ] = $this->build_index_text( $cell['content'] ?? '' );
		}

		$preview = array(
			'columns'   => array_map(
				static function ( $column ) {
					return (string) ( $column['column_name'] ?? '' );
				},
				$preview_columns
			),
			'rows'      => array(),
			'truncated' => count( $table['rows'] ) > 5 || count( $table['columns'] ) > 5,
		);

		foreach ( $preview_rows as $row ) {
			$row_id = (int) $row['row_id'];
			$cells  = array();

			foreach ( $preview_columns as $column ) {
				$column_id = (int) $column['column_id'];
				$cells[]   = $cell_map[ $row_id ][ $column_id ] ?? '';
			}

			$preview['rows'][] = array(
				'rowId'    => $row_id,
				'isHeader' => ! empty( $row['attributes']['isHeader'] ),
				'cells'    => $cells,
			);
		}

		return $preview;
	}

	/**
	 * Replace existing table with the imported file data.
	 *
	 * @since 1.4.0
	 *
	 * @param array $table Table payload.
	 * @return array|\WP_Error
	 */
	private function persist_import_table( $table ) {
		return $this->update_dynamic_table( $table );
	}

	/**
	 * Extract matching Dynamic Table blocks from a post.
	 *
	 * @since 1.4.1
	 *
	 * @param \WP_Post $post Post containing block content.
	 * @param int      $table_id Table ID to match.
	 * @param string   $block_table_ref Block table reference to match.
	 * @return array
	 */
	private function get_matching_table_blocks_for_post( \WP_Post $post, $table_id, $block_table_ref ) {
		$content = isset( $post->post_content ) ? (string) $post->post_content : '';

		if ( '' === $content ) {
			return array();
		}

		$blocks = parse_blocks( $content );

		if ( empty( $blocks ) ) {
			return array();
		}

		return $this->get_matching_table_blocks( $blocks, $table_id, $block_table_ref );
	}

	/**
	 * Extract matching Dynamic Table blocks from parsed post blocks.
	 *
	 * @since 1.4.1
	 *
	 * @param array  $blocks Parsed post blocks.
	 * @param int    $table_id Table ID to match.
	 * @param string $block_table_ref Block table reference to match.
	 * @return array
	 */
	private function get_matching_table_blocks( array $blocks, $table_id, $block_table_ref ) {
		$matched_blocks = array();

		foreach ( $blocks as $block ) {
			$matched_block = $this->get_matching_table_block_data( $block, $table_id, $block_table_ref );

			if ( false === $matched_block ) {
				continue;
			}

			$matched_blocks[] = $matched_block;
		}

		return $matched_blocks;
	}

	/**
	 * Match a single parsed block to a Dynamic Table.
	 *
	 * @since 1.4.1
	 *
	 * @param array  $block Parsed block.
	 * @param int    $table_id Table ID to match.
	 * @param string $block_table_ref Block table reference to match.
	 * @return array|false
	 */
	private function get_matching_table_block_data( array $block, $table_id, $block_table_ref ) {
		if (
			! isset( $block['blockName'] ) ||
			'dynamic-table-blocks/dynamic-table-blocks' !== $block['blockName'] ||
			empty( $block['attrs'] ) ||
			! is_array( $block['attrs'] )
		) {
			return false;
		}

		$attrs            = $block['attrs'];
		$matches_table_id = isset( $attrs['table_id'] ) && (int) $attrs['table_id'] === $table_id;
		$matches_ref      = ! $matches_table_id && '' !== $block_table_ref && isset( $attrs['block_table_ref'] ) && (string) $attrs['block_table_ref'] === $block_table_ref;

		if ( ! $matches_table_id && ! $matches_ref ) {
			return false;
		}

		return array(
			'table_id'        => isset( $attrs['table_id'] ) ? (int) $attrs['table_id'] : 0,
			'block_table_ref' => isset( $attrs['block_table_ref'] ) ? (string) $attrs['block_table_ref'] : '',
		);
	}

	/**
	 * Persist a table update via signed internal REST.
	 *
	 * @since 1.4.1
	 *
	 * @param array $table Table payload.
	 * @return array|\WP_Error
	 */
	private function update_dynamic_table( $table ) {
		wp_set_current_user( get_current_user_id() );

		$path         = '/dynamic-table-blocks/v1/tables/' . (int) $table['id'];
		$request_body = wp_json_encode( $table );
		$signature    = $this->build_internal_signature( 'PUT', $path, $request_body );
		$request      = new \WP_REST_Request( 'PUT', $path );

		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_query_params( array( 'context' => 'edit' ) );
		$request->set_body_params( $table );
		$request->set_body( $request_body );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}

	/**
	 * Delete a table via signed internal REST.
	 *
	 * @since 1.4.1
	 *
	 * @param number $table_id Table ID to delete.
	 * @return array|\WP_Error
	 */
	private function delete_dynamic_table( $table_id ) {

		wp_set_current_user( get_current_user_id() );

		$path         = '/dynamic-table-blocks/v1/tables/' . (int) $table_id;
		$signature    = $this->build_internal_signature( 'DELETE', $path, '' );
		$request      = new \WP_REST_Request( 'DELETE', $path );

		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_query_params( array( 'context' => 'edit' ) );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}

	/**
	 * Delete a table's block(s).
	 *
	 * @since 1.4.1
	 *
	 * @param number $table_id Table ID to delete.
	 * @return array|\WP_Error
	 */
	private function delete_table_blocks( $table_id ) {
		$table = $this->fetch_dynamic_table( $table_id );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$header          = is_array( $table['header'] ?? null ) ? $table['header'] : array();
		$post_id         = isset( $header['post_id'] ) ? (int) $header['post_id'] : 0;
		$block_table_ref = isset( $header['block_table_ref'] ) ? (string) $header['block_table_ref'] : '';
		$post            = $post_id > 0 ? get_post( $post_id ) : null;

		if ( ! ( $post instanceof \WP_Post ) ) {
			return array(
				'deleted'             => false,
				'deleted_block_count' => 0,
				'post_id'             => $post_id,
			);
		}

		$content = isset( $post->post_content ) ? (string) $post->post_content : '';
		if ( '' === $content ) {
			return array(
				'deleted'             => false,
				'deleted_block_count' => 0,
				'post_id'             => $post_id,
			);
		}

		$blocks         = parse_blocks( $content );
		$matched_blocks = $this->get_matching_table_blocks( $blocks, $table_id, $block_table_ref );

		if ( empty( $matched_blocks ) ) {
			return array(
				'deleted'             => false,
				'deleted_block_count' => 0,
				'post_id'             => $post_id,
			);
		}

		$remaining_blocks = array();

		foreach ( $blocks as $block ) {
			if ( false !== $this->get_matching_table_block_data( $block, $table_id, $block_table_ref ) ) {
				continue;
			}
			$remaining_blocks[] = $block;
		}

		$new_content = serialize_blocks( $remaining_blocks );

		if ( $new_content !== (string) $post->post_content ) {
			$updated_post = wp_update_post(
				array(
					'ID'           => $post->ID,
					'post_content' => $new_content,
				),
				true
			);

			if ( is_wp_error( $updated_post ) ) {
				return $updated_post;
			}
		}

		return array(
			'deleted'             => true,
			'deleted_block_count' => count( $matched_blocks ),
			'post_id'             => $post_id,
		);
	}

	/**
	 * Create a new table based on the imported file data.
	 *
	 * @since 1.4.0
	 *
	 * @param array $table Table payload.
	 * @return array|\WP_Error
	 */
	private function create_import_table( $table ) {
		wp_set_current_user( get_current_user_id() );

		$path         = '/dynamic-table-blocks/v1/tables';
		$request_body = wp_json_encode( $this->prepare_import_create_request( $table ) );
		$signature    = $this->build_internal_signature( 'POST', $path, $request_body );
		$request      = new \WP_REST_Request( 'POST', $path );

		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_query_params( array( 'context' => 'edit' ) );
		$request->set_body( $request_body );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}

	/**
	 * Build a create-safe payload for imported tables.
	 *
	 * Create requests must not send readonly ids inside the header object.
	 *
	 * @since 1.4.0
	 *
	 * @param array $table Table payload.
	 * @return array
	 */
	private function prepare_import_create_request( array $table ) {
		$header = is_array( $table['header'] ?? null ) ? $table['header'] : array();

		return array(
			'title'   => isset( $table['title'] ) ? (string) $table['title'] : '',
			'header'  => array(
				'block_table_ref' => isset( $header['block_table_ref'] ) ? (string) $header['block_table_ref'] : '',
				'status'          => isset( $header['status'] ) ? (string) $header['status'] : 'loaded',
				'post_id'         => isset( $header['post_id'] ) ? (int) $header['post_id'] : 0,
				'table_name'      => isset( $header['table_name'] ) ? (string) $header['table_name'] : '',
				'attributes'      => is_array( $header['attributes'] ?? null ) ? $header['attributes'] : array(),
				'classes'         => isset( $header['classes'] ) ? (string) $header['classes'] : '',
			),
			'rows'    => array_values( is_array( $table['rows'] ?? null ) ? $table['rows'] : array() ),
			'columns' => array_values( is_array( $table['columns'] ?? null ) ? $table['columns'] : array() ),
			'cells'   => array_values( is_array( $table['cells'] ?? null ) ? $table['cells'] : array() ),
		);
	}

	/**
	 * Build an internal REST signature for server-side import requests.
	 *
	 * @since 1.4.0
	 *
	 * @param string $method HTTP method.
	 * @param string $path REST route path.
	 * @param string $body Request body.
	 * @return string
	 */
	private function build_internal_signature( $method, $path, $body ) {
		$key = dtbk_signing_key();
		$msg = strtoupper( $method ) . "\n" . $path . "\n" . $body;

		return hash_hmac( 'sha256', $msg, $key );
	}

	/**
	 * Retrieve an existing table by imported table id.
	 *
	 * @since 1.4.0
	 *
	 * @param int $table_id Imported table id.
	 * @return array|\WP_Error|null Existing table
	 */
	private function find_existing_table_by_id( $table_id ) {
		$table_id = absint( $table_id );
		if ( ! $table_id ) {
			return null;
		}

		$table = $this->fetch_dynamic_table( $table_id );
		if ( is_wp_error( $table ) ) {
			$data   = $table->get_error_data();
			$status = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : ( is_int( $data ) ? $data : 0 );

			return 404 === $status ? null : $table;
		}

		return $table;
	}



	/**
	 * Retrieve existing table data via REST call.
	 *
	 * @since 1.4.0
	 *
	 * @param int $table_id Imported table id.
	 * @return array|\WP_Error Existing table data
	 */
	private function fetch_dynamic_table( $table_id ) {
		wp_set_current_user( get_current_user_id() );

		$path      = '/dynamic-table-blocks/v1/tables/' . (int) $table_id;
		$method    = 'GET';
		$body      = '';
		$signature = $this->build_internal_signature( $method, $path, $body );
		$request   = new \WP_REST_Request( $method, $path );

		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_query_params( array( 'context' => 'edit' ) );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}

	/**
	 * Extract the imported table id from a JSON backup item.
	 *
	 * @since 1.4.0
	 *
	 * @param array $table Imported table payload.
	 * @return int
	 */
	private function extract_imported_table_id( array $table ) {
		if ( ! empty( $table['id'] ) ) {
			return absint( $table['id'] );
		}

		return ! empty( $table['header']['id'] ) ? absint( $table['header']['id'] ) : 0;
	}

	/**
	 * Create a list of JSON tables that can be imported
	 *
	 * @since 1.4.0
	 *
	 * @param array $items Imported table(s) from uploaded JSON import file.
	 * @return array       Picklist of available tables for import.
	 */
	private function build_json_item_options( array $items ) {
		$options = array();

		foreach ( $items as $index => $item ) {
			$table = isset( $item['table'] ) && is_array( $item['table'] ) ? $item['table'] : array();
			$label = '';

			if ( ! empty( $table['header']['table_name'] ) ) {
				$label = (string) $table['header']['table_name'];
			} elseif ( ! empty( $table['title'] ) ) {
				$label = (string) $table['title'];
			} else {
				$label = sprintf( 'Item %d', (int) $index + 1 );
			}

			$options[] = array(
				'value' => $index,
				'label' => $label,
			);
		}

		return $options;
	}

	/**
	 * Create column attributes for CSV file import
	 *
	 * @since 1.4.0
	 *
	 * @return array  Column attributes
	 */
	private function build_csv_column_attributes() {
		$attributes                   = get_default_column_attributes();
		$attributes['columnDataType'] = array( 'type' => 'general' );

		return $attributes;
	}

	/**
	 * Create cell attributes from CSV cell content
	 *
	 * @since 1.4.0
	 *
	 * @param string $raw_value  Imported cell content
	 * @return array  Cell attributes
	 */
	private function build_csv_cell_attributes( $raw_value ) {
		return array(
			'border' => false,
			'value'  => array(
				'indexText' => $this->build_index_text( $raw_value ),
			),
		);
	}

	/**
	 * Fill in missing cell attributes from imported file
	 *
	 * @since 1.4.0
	 *
	 * @param array $attributes Imported cell attributes
	 * @param string $content    Imported cell content
	 * @return array  Updated cell attributes
	 */
	private function ensure_cell_attributes( array $attributes, $content ) {
		$attributes = array_merge(
			get_default_cell_attributes(),
			$attributes
		);

		if ( ! isset( $attributes['value'] ) || ! is_array( $attributes['value'] ) ) {
			$attributes['value'] = array();
		}

		if ( ! array_key_exists( 'indexText', $attributes['value'] ) || '' === (string) $attributes['value']['indexText'] ) {
			$attributes['value']['indexText'] = $this->build_index_text( $content );
		}

		return $attributes;
	}

	/**
	 * Sanitize cell contents prior to creating table
	 *
	 * @since 1.4.0
	 *
	 * @param string $raw_value  Imported cell content
	 * @return string Sanitized cell content
	 */
	private function sanitize_import_content( $raw_value ) {
		$raw_value = $this->normalize_import_text( $raw_value );
		return wp_kses_post( $raw_value );
	}

	/**
	 * Normalize imported text values by removing a UTF-8 BOM and standardizing newlines.
	 *
	 * @since 1.4.0
	 *
	 * @param mixed $value Raw imported value.
	 * @return string
	 */
	private function normalize_import_text( $value ) {
		$value = str_replace( array( "\r\n", "\r" ), "\n", (string) $value );
		return (string) preg_replace( '/^\x{FEFF}/u', '', $value );
	}

	/**
	 * Strip non-printable characters to support indexing
	 *
	 * @since 1.4.0
	 *
	 * @param string $value  Text to format
	 * @return string Formatted text
	 */
	private function build_index_text( $value ) {
		$text = preg_replace( '/\s+/u', ' ', wp_strip_all_tags( $this->normalize_import_text( $value ) ) );
		return trim( (string) $text );
	}

	/**
	 * Return import errors
	 *
	 * @since 1.4.0
	 *
	 * @param \WP_Error Error message to return
	 */
	private function send_import_error( \WP_Error $error ) {
		$status = 400;
		$data   = $error->get_error_data();

		if ( is_int( $data ) ) {
			$status = $data;
		} elseif ( is_array( $data ) && isset( $data['status'] ) ) {
			$status = (int) $data['status'];
		}

		wp_send_json_error(
			array(
				'message' => $error->get_error_message(),
				'code'    => $error->get_error_code(),
			),
			$status
		);
	}
}

// Instantiate.
	dtbk_new_instance( 'DTBK_Admin_Ajax' );
