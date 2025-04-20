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
 * Create or update a dynamic table.
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

	$default_rows    = array();
	$default_columns = array();
	$default_cells   = array();

	foreach ( $tablearrdefault['rows'] as $index => $row ) {
		$default_row = array(
			'table_id'   => '0',
			'row_id'     => $row['row_id'],
			'attributes' => array(),
			'classes'    => '',
		);
		array_push( $default_rows, $default_row );
	}

	foreach ( $tablearrdefault['columns'] as $index => $column ) {
		$default_column = array(
			'table_id'    => '0',
			'column_id'   => $column['column_id'],
			'column_name' => '',
			'attributes'  => array(),
			'classes'     => '',
		);
		array_push( $default_columns, $default_column );
	}

	foreach ( $tablearrdefault['cells'] as $index => $cell ) {
		$default_cell = array(
			'table_id'   => '0',
			'column_id'  => $cell['column_id'],
			'row_id'     => $cell['row_id'],
			'attributes' => array(),
			'classes'    => '',
			'content'    => '',
		);
		array_push( $default_cells, $default_cell );
	}

	$defaults['rows']    = $default_row;
	$defaults['columns'] = $default_columns;
	$defaults['cells']   = $default_cells;

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

	$block_table_ref       = $tablearr['header']['block_table_ref'];
	$status                = $tablearr['header']['status'];
	$post_id               = $tablearr['header']['post_id'];
	$table_name            = $tablearr['header']['table_name'];
	$serialized_attributes = maybe_serialize( $tablearr['header']['attributes'] );
	$classes               = $tablearr['header']['classes'];

	if ( $update ) {
		$update_table = new PersistTableData();
		$results     = $update_table->update_table( $table_id, $block_table_ref, $status, $post_id, $table_name, $serialized_attributes, $classes );

		if ( ! $results['success'] ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
			}
		}
	} else {
		$new_table = new PersistTableData();
		$results  = $new_table->create_table_data( $block_table_ref, $status, $post_id, $table_name, $serialized_attributes, $classes );

		if ( ! $results['success'] ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_insert_error', __( 'Database error creating table.' ) );
			}
		}
		$table_id = $results['table_id'];
	}

	// Create table rows
	$table_id = $table_id;
	if ( isset( $tablearr['rows'] ) ) {
		$request_rows = $tablearr['rows'];
		$put_rows     = update_table_rows( $table_id, $request_rows );
		if ( $put_rows === false ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_update_error', __( 'Database error creating table rows.' ) );
			}
		}
	}

	// Create table columns
	if ( isset( $tablearr['columns'] ) ) {
		$request_columns = $tablearr['columns'];
		$put_columns     = update_table_columns( $table_id, $request_columns );
		if ( $put_columns === false ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_update_error', __( 'Database error creating table columns.' ) );
			}
		}
	}

	// Create table cells
	if ( isset( $tablearr['cells'] ) ) {
		$request_cells = $tablearr['cells'];
		$put_cells     = update_table_cells( $table_id, $request_cells );
		if ( $put_cells === false ) {
			if ( $wp_error ) {
				return new WP_Error( 'db_update_error', __( 'Database error creating table cells.' ) );
			}
		}
	}

	return $table_id;
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
	$tablearr = array_merge( $table, $tablearr );

	return create_table_data( $tablearr, $wp_error );
}

/**
 *  Updates the database for row changes to the table object
 *
 * @since 1.0.0
 *
 * @param int   $table_id - Table id.
 * @param array $request_rows - Rows to load in database.
 * @return array|WP_Error Updated row values for new or updated table, WP_Error object on failure.
 */
function update_table_rows( $table_id, $request_rows ) {
	$results = null;
	$rows    = array();

	foreach ( $request_rows as $index => $row ) {
		$row_id                 = $row['row_id'];
		$serialized_attributes = maybe_serialize( $row['attributes'] );
		$classes               = $row['classes'];

		$rows[] = array( $table_id, $row_id, $serialized_attributes, $classes );
	}

	$update_table_rows = new PersistTableData();
	$results         = $update_table_rows->update_table_rows( $table_id, $rows );

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
 * @param int   $table_id - Table id.
 * @param array $request_columns - Columns to load in database.
 * @return array|WP_Error Updated columns values for new or updated table, WP_Error object on failure.
 */
function update_table_columns( $table_id, $request_columns ) {
	$results = null;
	$columns = array();

	foreach ( $request_columns as $index => $column ) {
		$column_id              = $column['column_id'];
		$column_name            = $column['column_name'];
		$serialized_attributes = maybe_serialize( $column['attributes'] );
		$classes               = $column['classes'];

		$columns[] = array( $table_id, $column_id, $column_name, $serialized_attributes, $classes );
	}

	$update_table_columns = new PersistTableData();
	$results            = $update_table_columns->update_table_columns( $table_id, $columns );

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
 * @param int   $table_id - Table id.
 * @param array $request_cells - Cells to load in database.
 * @return array|WP_Error Updated cells values for new or updated table, WP_Error object on failure.
 */
function update_table_cells( $table_id, $request_cells ) {
	$results = null;
	$cells   = array();

	foreach ( $request_cells as $index => $cell ) {
		$column_id              = $cell['column_id'];
		$row_id                 = $cell['row_id'];
		$serialized_attributes = maybe_serialize( $cell['attributes'] );
		$classes               = $cell['classes'];
		$content               = wp_kses_post( $cell['content'] );
		$cells[]               = array( $table_id, $column_id, $row_id, $serialized_attributes, $classes, $content );
	}

	$update_table_cells = new PersistTableData();
	$results          = $update_table_cells->update_table_cells( $table_id, $cells );

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
 * @param int $table_id - Table id.
 * @return array|WP_Error Deleted table.
 */
function delete_table( $table_id = 0 ) {
	$existing_table = get_table( $table_id );
	$delete_table   = new PersistTableData();
	$results       = $delete_table->delete_table_data( $table_id );

	if ( ! $results['success'] ) {
		return new WP_Error( 'db_read_error', __( 'Database error retrieving table.' ) );
	}
	return $existing_table;
}

/**
 *  Extract and returns the table object from the database
 *
 * @since 1.0.0
 *
 * @param int $table_id - Table id.
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
 * Loops through each field for a table object, ensures they all exist, then passes them through
 * a field specific filter.
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
		if ( isset( $table->filter ) && $context === $table->filter ) {
			return $table;
		}
		if ( ! isset( $table->id ) ) {
			$table->id = 0;
		}
		$table->filter = $context;
	} elseif ( is_array( $table ) ) {
		// Check if post already filtered for this context.
		if ( isset( $table['filter'] ) && $context === $table['filter'] ) {
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
 * Performs sanitization for a specific field value passed into the function.
 * Possible context values are:  'edit', 'db', 'display', 'attribute' and
 * 'js'. The 'display' context is used by default. 'attribute' and 'js' contexts
 * are treated like 'display' when calling filters.
 *
 * @since 1.0.0
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
