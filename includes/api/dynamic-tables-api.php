<?php
/**
 * Define filters for the dynamic tables object
 */
// Places to balance tags on input.

// wp_pre_kses_less_than
// wp_pre_kses_block_attributes

foreach ( array( 'dt_content_save_pre' ) as $filter ) {
	add_filter( $filter, 'convert_invalid_entities' );
	add_filter( $filter, 'balanceTags', 50 );
	add_filter( $filter, 'wp_filter_global_styles_post', 9 ); // Removes unsafe rules for global styles
	add_filter( $filter, 'title_save_pre' );
	add_filter( $filter, 'wp_filter_post_kses' ); // Changes slash formatting
}

foreach ( array( 'dt_table_name_save_pre' ) as $filter ) {
	add_filter( $filter, 'title_save_pre' );
}

foreach ( array( 'dt_table_name_save_pre' ) as $filter ) {
	add_filter( $filter, 'title_save_pre' );
}

add_filter( 'dt_content_filtered_save_pre', 'wp_filter_global_styles_post', 9 );

/**
 * Create or update table
 *
 * @since 1.0.0
 *
 * @param $tablearr - Table data for update.
 * @param $wp_error - Do we return WP_Error objects for REST API processing.
 * @return int|WP_Error Table id for new or updated table, WP_Error object on failure.
 */
function create_table_data( $tablearr, $wp_error = false ) {
	// error_log(print_r($tablearr, true));

	$tablearrdefault = $tablearr;

	if ( is_object( $tablearr ) ) {
		$tablearrdefault = get_object_vars( $tablearr );
	}

	$defaults = array(
		'id'     => '0',
		'header' => array(
			'id'              => '0',
			'block_table_ref' => '',
			'status'          => 'unknown',
			'post_id'         => '',
			'table_name'      => '',
			'attributes'      => array(),
			'classes'         => '',
		),
	);

	$defaultRows    = array();
	$defaultColumns = array();
	$defaultCells   = array();

	foreach ( $tablearrdefault['rows'] as $index => $row ) {
		$defaultRow = array(
			'table_id'   => '0',
			'row_id'     => $row['row_id'],
			'attributes' => array(),
			'classes'    => '',
		);
		array_push( $defaultRows, $defaultRow );
	}

	foreach ( $tablearrdefault['columns'] as $index => $column ) {
		$defaultColumn = array(
			'table_id'    => '0',
			'column_id'   => $column['column_id'],
			'column_name' => '',
			'attributes'  => array(),
			'classes'     => '',
		);
		array_push( $defaultColumns, $defaultColumn );
	}

	foreach ( $tablearrdefault['cells'] as $index => $cell ) {
		$defaultCell = array(
			'table_id'   => '0',
			'column_id'  => $cell['column_id'],
			'row_id'     => $cell['row_id'],
			'attributes' => array(),
			'classes'    => '',
			'content'    => '',
		);
		array_push( $defaultCells, $defaultCell );
	}

	$defaults['rows']    = $defaultRows;
	$defaults['columns'] = $defaultColumns;
	$defaults['cells']   = $defaultCells;

	$tablearr = wp_parse_args( $tablearr, $defaults );
	unset( $tablearr['filter'] );
	$tablearr = sanitize_dynamic_table( $tablearr, 'db' );
	// error_log(print_r($tablearr, true));

	// Are we updating or creating?
	$table_id = 0;
	$update   = false;

	if ( ! ( empty( $tablearr['id'] ) &&
		(int) $tablearr['id'] !== '0' ) ) {
		$update = true;

		// Get the table ID.
		$table_id     = $tablearr['id'];
		$table_before = get_table( $table_id );

		if ( is_null( $table_before ) ) {
			if ( $wp_error ) {
				return new WP_Error( 'invalid_table', __( 'Invalid table ID.' ) );
			}
			return 0;
		}
	} else {
		$post_before = null;
	}

	$results = null;
	// error_log(print_r($tablearr, true));

	$blockTableRef        = $tablearr['header']['block_table_ref'];
	$status               = $tablearr['header']['status'];
	$postId               = $tablearr['header']['post_id'];
	$tableName            = $tablearr['header']['table_name'];
	$serializedAttributes = maybe_serialize( $tablearr['header']['attributes'] );
	$classes              = $tablearr['header']['classes'];

	if ( $update ) {
		$updateTable = new PersistTableData();
		$results     = $updateTable->update_table( $table_id, $blockTableRef, $status, $postId, $tableName, $serializedAttributes, $classes );

		if ( ! $results['success'] ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
			}
		}
	} else {
		$newTable = new PersistTableData();
		$results  = $newTable->create_table_data( $blockTableRef, $status, $postId, $tableName, $serializedAttributes, $classes );

		if ( ! $results['success'] ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_insert_error', __( 'Database error creating table.' ) );
			}
		}
		$table_id = $results['table_id'];
	}

	// Create table rows
	$tableId = $table_id;
	if ( isset( $tablearr['rows'] ) ) {
		$requestRows = $tablearr['rows'];
		$putRows     = update_table_rows( $tableId, $requestRows );
		if ( $putRows === false ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_update_error', __( 'Database error creating table rows.' ) );
			}
		}
	}

	// Create table columns
	if ( isset( $tablearr['columns'] ) ) {
		$requestColumns = $tablearr['columns'];
		$putColumns     = update_table_columns( $tableId, $requestColumns );
		if ( $putColumns === false ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_update_error', __( 'Database error creating table columns.' ) );
			}
		}
	}

	// Create table cells
	if ( isset( $tablearr['cells'] ) ) {
		$requestCells = $tablearr['cells'];
		$putCells     = update_table_cells( $tableId, $requestCells );
		if ( $putCells === false ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_update_error', __( 'Database error creating table cells.' ) );
			}
		}
	}

	return $tableId;
}

/**
 * PUT table callback to update the database for table changes
 *
 * @since 1.0.0
 *
 * @param array $tablearr - Table data for update.
 * @param bool  $wp_error - Do we return WP_Error objects for REST API processing.
 * @return int|WP_Error Table id for new or updated table, WP_Error object on failure.
 */
function update_table_data( $tablearr, $wp_error = false ) {
	// error_log(print_r($tablearr, true));

	if ( is_object( $tablearr ) ) {
		// Non-escaped post was passed.
		$tablearr = get_object_vars( $tablearr );
	}

	// First, get all of the original fields.
	$table = get_table( $tablearr['id'], ARRAY_A );

	if ( is_null( $table ) ) {
		if ( $wp_error ) {
			return new WP_Error( 'invalid_table', __( 'Invalid table ID.' ) );
		}
		return 0;
	}

	// Merge old and new fields with new fields overwriting old ones.
	$tablearr = array_merge( $table, $tablearr );
	// error_log(print_r($tablearr, true));
	return create_table_data( $tablearr, $wp_error );
}

/**
 *  Updates the database for row changes to the table object
 *
 * @since 1.0.0
 *
 * @param int   $tableId - Table id.
 * @param array $requestRows - Rows to load in database.
 * @return array|WP_Error Updated row values for new or updated table, WP_Error object on failure.
 */
function update_table_rows( $tableId, $requestRows ) {
	$results = null;
	$rows    = array();

	foreach ( $requestRows as $index => $row ) {
		$rowId                = $row['row_id'];
		$serializedAttributes = maybe_serialize( $row['attributes'] );
		$classes              = $row['classes'];

		$rows[] = array( $tableId, $rowId, $serializedAttributes, $classes );
	}

	$updateTableRows = new PersistTableData();
	$results         = $updateTableRows->update_table_rows( $tableId, $rows );

	if ( ! $results['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}

	return $results;
}

/**
 *  Updates the database for column changes to the table object
 *
 * @since 1.0.0
 *
 * @param int   $tableId - Table id.
 * @param array $requestColumns - Columns to load in database.
 * @return array|WP_Error Updated columns values for new or updated table, WP_Error object on failure.
 */
function update_table_columns( $tableId, $requestColumns ) {
	$results = null;
	$columns = array();

	foreach ( $requestColumns as $index => $column ) {
		$columnId             = $column['column_id'];
		$columnName           = $column['column_name'];
		$serializedAttributes = maybe_serialize( $column['attributes'] );
		$classes              = $column['classes'];

		$columns[] = array( $tableId, $columnId, $columnName, $serializedAttributes, $classes );
	}

	$updateTableColumns = new PersistTableData();
	$results            = $updateTableColumns->update_table_columns( $tableId, $columns );

	if ( ! $results['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}

	return $results;
}

/**
 *  Updates the database for cell changes to the table object
 *
 * @since 1.0.0
 *
 * @param int   $tableId - Table id.
 * @param array $requestCells - Cells to load in database.
 * @return array|WP_Error Updated cells values for new or updated table, WP_Error object on failure.
 */
function update_table_cells( $tableId, $requestCells ) {
	$results = null;
	$cells   = array();

	foreach ( $requestCells as $index => $cell ) {
		$columnId             = $cell['column_id'];
		$rowId                = $cell['row_id'];
		$serializedAttributes = maybe_serialize( $cell['attributes'] );
		$classes              = $cell['classes'];
		$content              = wp_kses_post( $cell['content'] );
		$cells[]              = array( $tableId, $columnId, $rowId, $serializedAttributes, $classes, $content );
	}

	$updateTableCells = new PersistTableData();
	$results          = $updateTableCells->update_table_cells( $tableId, $cells );

	if ( ! $results['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}

	return $results;
}

/**
 *  Delete table from the database
 *
 * @since 1.0.0
 *
 * @param int $tableId - Table id.
 * @return array|WP_Error Deleted table.
 */
function delete_table( $tableId = 0 ) {
	$existingTable = get_table( $tableId );
	$deleteTable   = new PersistTableData();
	$results       = $deleteTable->delete_table_data( $tableId );

	if ( ! $results['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}
	return $existingTable;
}

/**
 *  Extract and returns the table object from the database
 *
 * @since 1.0.0
 *
 * @param int $tableId - Table id.
 * @return array|WP_Error Table data retrieved.
 */
function get_table( $table_id ) {
	$results = array();

	$test_object = array(
		'columnWidthType'        => 'Proportional',
		'minWidth'               => 0,
		'minWidthUnits'          => 'em',
		'maxWidth'               => 0,
		'maxWidthUnits'          => 'em',
		'fixedWidth'             => 1,
		'fixedWidthUnits'        => 'fr',
		'disableForTablet'       => false,
		'disableForPhone'        => false,
		'isFixedLeftColumnGroup' => false,
		'horizontalAlignment'    => 'none',
	);

	$results      += array( 'id' => $table_id );
	$table         = 'dt_tables';
	$get_table      = new PersistTableData();
	$results_header = $get_table->get_table( $table_id, $table );
	if ( ! $results_header['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}
	$results += array( 'header' => $results_header['result'] );

	// error_log(print_r($results, true));

	$table       = 'dt_table_rows';
	$get_table    = new PersistTableData();
	$results_rows = $get_table->get_table( $table_id, $table );
	if ( ! $results_rows['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}
	$results += array( 'rows' => $results_rows['result'] );

	$table          = 'dt_table_columns';
	$get_table       = new PersistTableData();
	$results_columns = $get_table->get_table( $table_id, $table );

	if ( ! $results_columns['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}
	$results += array( 'columns' => $results_columns['result'] );

	$table        = 'dt_table_cells';
	$get_table      = new PersistTableData();
	$results_cells = $get_table->get_table( $table_id, $table );
	if ( ! $results_cells['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}
	$results += array( 'cells' => $results_cells['result'] );

	return $results;
}

/**
 * Sanitizes every table field.
 *
 * @since 1.0.0
 *
 * @param object|WP_Post|array $table    The dynamic table  object or array
 * @param string               $context Optional. How to sanitize table fields.
 *                                      Accepts 'edit', 'db', 'display',
 *                                      'attribute', or 'js'. Default 'display'.
 * @return object|array The now sanitized dynamic table object or array (will be the
 *                              same type as `$table`).
 */
function sanitize_dynamic_table( $table, $context = 'display' ) {
	if ( is_object( $table ) ) {
		// Check if post already filtered for this context.
		if ( isset( $table->filter ) && $context == $table->filter ) {
			return $table;
		}
		if ( ! isset( $table->id ) ) {
			$table->id = 0;
		}
		$table->filter = $context;
	} elseif ( is_array( $table ) ) {
		// Check if post already filtered for this context.
		if ( isset( $table['filter'] ) && $context == $table['filter'] ) {
			return $table;
		}
		if ( ! isset( $table['id'] ) ) {
			$table['id'] = 0;
		}

		// Loop all fields in Table object for sanitization
		foreach ( array_keys( $table ) as $field ) {
			switch ( $field ) {
				case 'id':
					$table[ $field ] = sanitize_dynamic_table_field( $field, $table[ $field ], $table['id'], $context );
					break;
				case 'header':
					foreach ( array_keys( $table['header'] ) as $header_field ) {
						$table['header'][ $header_field ] = sanitize_dynamic_table_field( $header_field, $table['header'][ $header_field ], $table['id'], $context );
					}
					break;
				case 'rows':
					foreach ( array_keys( $table['rows'] ) as $row_container_field ) {
						foreach ( array_keys( $table['rows'][ $row_container_field ] ) as $row_field ) {
							$table['rows'][ $row_container_field ][ $row_field ] = sanitize_dynamic_table_field( $row_field, $table['rows'][ $row_container_field ][ $row_field ], $table['id'], $context );
						}
					}
					break;
				case 'columns':
					foreach ( array_keys( $table['columns'] ) as $column_container_field ) {
						foreach ( array_keys( $table['columns'][ $column_container_field ] ) as $column_field ) {
							$table['columns'][ $column_container_field ][ $column_field ] = sanitize_dynamic_table_field( $column_field, $table['columns'][ $column_container_field ][ $column_field ], $table['id'], $context );
						}
					}
					break;
				case 'cells':
					foreach ( array_keys( $table['cells'] ) as $cell_container_field ) {
						foreach ( array_keys( $table['cells'][ $cell_container_field ] ) as $cell_field ) {
							$table['cells'][ $cell_container_field ][ $cell_field ] = sanitize_dynamic_table_field( $cell_field, $table['cells'][ $cell_container_field ][ $cell_field ], $table['id'], $context );
						}
					}
					break;
			}
		}
		$table['filter'] = $context;
	}
	return $table;
}

/**
 * Sanitizes a table based on context.
 *
 * @since 1.0.0
 *
 * Possible context values are:  'edit', 'db', 'display', 'attribute' and
 * 'js'. The 'display' context is used by default. 'attribute' and 'js' contexts
 * are treated like 'display' when calling filters.
 *
 * @param string $field   The dynamic table Object field name.
 * @param mixed  $value   The dynamic table Object value.
 * @param int    $table_id Table ID.
 * @param string $context Optional. How to sanitize the field. Possible values are 'edit',
 *                        'db', 'display', 'attribute' and 'js'. Default 'display'.
 * @return mixed Sanitized value.
 */
function sanitize_dynamic_table_field( $field, $value, $table_id, $context = 'display' ) {
	if ( 'edit' === $context ) {

		$format_to_edit = array( 'content', 'table_name' );
		$value          = apply_filters( "edit_table_{$field}", $value, $table_id );

		if ( in_array( $field, $format_to_edit, true ) ) {
			if ( 'content' === $field ) {
				$value = format_to_edit( $value, user_can_richedit() );
			}

			if ( 'table_name' === $field ) {
				$value = format_to_edit( $value );
			}
		} else {
			$value = esc_attr( $value );
		}
	} elseif ( 'db' === $context ) {
		$value = apply_filters( "pre_table_{$field}", $value );

		/**
		 * Filters the value of a specific table field before saving.
		 *
		 * The dynamic portion of the hook name, `$field`, refers to the post
		 * field name.
		 *
		 * @param mixed $value Value of the table field.
		 */
		$value = apply_filters( "{$field}_pre", $value );
	} else {

		// Use display filters by default.
		$value = apply_filters( "table_{$field}", $value, $post_id, $context );

		if ( 'attribute' === $context ) {
			$value = esc_attr( $value );
		} elseif ( 'js' === $context ) {
			$value = esc_js( $value );
		}
	}
	return $value;
}
