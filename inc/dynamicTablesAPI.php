<?php

require_once plugin_dir_path(__FILE__) . 'dynamicTablesDbPersist.php';

/**
 * Define filters for the dynamic tables object
 */
// Places to balance tags on input.

// wp_pre_kses_less_than
// wp_pre_kses_block_attributes

foreach (array('dt_content_save_pre') as $filter) {
    add_filter($filter, 'convert_invalid_entities');
    add_filter($filter, 'balanceTags', 50);
    add_filter($filter, 'wp_filter_global_styles_post', 9); // Removes unsafe rules for global styles
    add_filter($filter, 'title_save_pre');
    add_filter($filter, 'wp_filter_post_kses'); // Changes slash formatting
}

foreach (array('dt_table_name_save_pre') as $filter) {
    add_filter($filter, 'title_save_pre');
}

foreach (array('dt_table_name_save_pre') as $filter) {
    add_filter($filter, 'title_save_pre');
}

add_filter('dt_content_filtered_save_pre', 'wp_filter_global_styles_post', 9);

function create_table_data($tablearr, $wp_error = false)
{
    // Capture original pre-sanitized array for passing into filters.
    $unsanitized_tablearr = $tablearr;

    $defaults = array(
        'id' => '0',
        'header' => array(
            'id' => '0',
            'block_table_ref' => '',
            'status' => 'unknown',
            'post_id' => '',
            'table_name' => '',
            'attributes' => [  ],
            'classes' => ''
        ),
        'rows' => array(
            'row' => array(
                'table_id' => '0',
                'row_id' => '0',
                'attributes' => [  ],
                'classes' => ''
            ),
        ),
        'columns' => array(
            'column' => array(
                'table_id' => '0',
                'column_id' => '0',
                'column_name' => '',
                'attributes' => [  ],
                'classes' => ''
            ),
        ),
        'cells' => array(
            'cell' => array(
                'table_id' => '0',
                'column_id' => '0',
                'attributes' => [  ],
                'classes' => '',
                'content' => ''
            ),
        ),
    );

    $tablearr = wp_parse_args($tablearr, $defaults);

    unset($tablearr[ 'filter' ]);

    $tablearr = sanitize_dynamic_table($tablearr, 'db');

    // Are we updating or creating?
    $table_id = 0;
    $update = false;

    error_log('Table Data for create/update = ' . json_encode($tablearr));
    if (!(empty($tablearr[ 'id' ]) &&
        (int) $tablearr[ 'id' ] !== '0')) {
        $update = true;

        // Get the post ID and GUID.
        $table_id = $tablearr[ 'id' ];
        $table_before = get_table($table_id);

        if (is_null($table_before)) {
            if ($wp_error) {
                return new WP_Error('invalid_table', __('Invalid table ID.'));
            }
            return 0;
        }

    } else {
        $post_before = null;
    }

    error_log('Table Formatted for Insert:');
    error_log(json_encode($tablearr));
    // error_log('POST Table request - ' . json_encode($request->get_json_params()));

    $results = null;

    $blockTableRef = $tablearr[ 'header' ][ 'block_table_ref' ];
    $status = $tablearr[ 'header' ][ 'status' ];
    $postId = $tablearr[ 'header' ][ 'post_id' ];
    $tableName = $tablearr[ 'header' ][ 'table_name' ];
    $serializedAttributes = maybe_serialize($tablearr[ 'header' ][ 'attributes' ]);
    $classes = $tablearr[ 'header' ][ 'classes' ];

    error_log('Create Table Params: block ref - ' . $blockTableRef . ', status - ' . $status . ', post id - ' . $postId . ', table name - ' . $tableName . ', attributes - ' . $serializedAttributes . ', classes - ' . $classes);
    // die;

    if ($update) {
        error_log('Update Table Params: table id - ' . $table_id . ', block ref - ' . $blockTableRef . ', status - ' . $status . ', post id - ' . $postId . ', table name - ' . $tableName . ', attributes - ' . $serializedAttributes . ', classes - ' . $classes);
        $updateTable = new PersistTableData();
        $results = $updateTable->update_table($table_id, $blockTableRef, $status, $postId, $tableName, $serializedAttributes, $classes);

        if (!$results[ 'success' ]) {
            if ($wp_error) {
                return new WP_Error('db_read_error', __('Database error retrieving table.'));
            }
        }

    } else {
        $newTable = new PersistTableData();
        $results = $newTable->create_table_data($blockTableRef, $status, $postId, $tableName, $serializedAttributes, $classes);

        if (!$results[ 'success' ]) {
            if ($wp_error) {
                return new WP_Error('db_insert_error', __('Database error creating table.'));
            }
        }
        $table_id = $results[ 'table_id' ];
    }

    error_log('    Header result - ' . json_encode($results));

    // Create table rows
    $tableId = $table_id;
    error_log('Pre-Created Table ID = ' . $tableId);
    if (isset($tablearr[ 'rows' ])) {
        $requestRows = $tablearr[ 'rows' ];
        $putRows = update_table_rows($tableId, $requestRows);
        if ($putRows === false) {
            if ($wp_error) {
                return new WP_Error('db_update_error', __('Database error creating table rows.'));
            }
        }
    }

    // Create table columns
    if (isset($tablearr[ 'columns' ])) {
        $requestColumns = $tablearr[ 'columns' ];
        $putColumns = update_table_columns($tableId, $requestColumns);
        if ($putColumns === false) {
            if ($wp_error) {
                return new WP_Error('db_update_error', __('Database error creating table columns.'));
            }
        }
    }

    // Create table cells
    if (isset($tablearr[ 'cells' ])) {
        $requestCells = $tablearr[ 'cells' ];
        $putCells = update_table_cells($tableId, $requestCells);
        if ($putCells === false) {
            if ($wp_error) {
                return new WP_Error('db_update_error', __('Database error creating table cells.'));
            }
        }
    }
    error_log('Created Table ID = ' . $tableId);
    return $tableId;

    // $responseResults = null;
    // $responseResults = get_table($tableId);

    // error_log('POST Return = ' . json_encode($responseResults));

    // return new WP_REST_Response($responseResults, 200);

    // return $results;
}

/**
 * PUT table callback to update the database for table changes
 */
function update_table_data($tablearr, $wp_error = false)
{
    error_log('PUT Table request - ' . json_encode($tablearr));

    if (is_object($tablearr)) {
        // Non-escaped post was passed.
        $tablearr = get_object_vars($tablearr);
    }

// First, get all of the original fields.
    $table = get_table($tablearr[ 'id' ], ARRAY_A);

    if (is_null($table)) {
        if ($wp_error) {
            return new WP_Error('invalid_table', __('Invalid table ID.'));
        }
        return 0;
    }

    // Merge old and new fields with new fields overwriting old ones.
    $tablearr = array_merge($table, $tablearr);
    return create_table_data($tablearr, $wp_error);

}

/**
 *  Updates the database for row changes to the table object
 */
function update_table_rows($tableId, $requestRows)
{
    error_log('    Web Service Input - ' . json_encode($requestRows));

    $results = null;
    $rows = [  ];

    foreach ($requestRows as $index => $row) {
        $rowId = $row[ 'row_id' ];
        // $attributes = $row[ 'attributes' ];
        $serializedAttributes = maybe_serialize($row[ 'attributes' ]);
        $classes = $row[ 'classes' ];
        error_log('Serialized row attributes = ' . json_encode($serializedAttributes));

        $rows[  ] = array($tableId, $rowId, $serializedAttributes, $classes);
    }

    error_log('    Web Service Updated Request' . json_encode($rows));

    $updateTableRows = new PersistTableData();
    $results = $updateTableRows->update_table_rows($tableId, $rows);

    if (!$results[ 'success' ]) {
        return new WP_Error('db_read_error', __('Database error retrieving table.'));
    }

    return $results;
}

/**
 *  Updates the database for column changes to the table object
 */
function update_table_columns($tableId, $requestColumns)
{
    error_log('    Web Service Input - ' . json_encode($requestColumns));

    $results = null;
    $columns = [  ];

    foreach ($requestColumns as $index => $column) {
        $columnId = $column[ 'column_id' ];
        $columnName = $column[ 'column_name' ];
        // $attributes = $column[ 'attributes' ];
        $serializedAttributes = maybe_serialize($column[ 'attributes' ]);
        $classes = $column[ 'classes' ];
        error_log('Serialized column attributes = ' . json_encode($serializedAttributes));

        $columns[  ] = array($tableId, $columnId, $columnName, $serializedAttributes, $classes);
    }

    error_log('    Web Service Updated Request' . json_encode($columns));

    $updateTableColumns = new PersistTableData();
    $results = $updateTableColumns->update_table_columns($tableId, $columns);

    if (!$results[ 'success' ]) {
        return new WP_Error('db_read_error', __('Database error retrieving table.'));
    }

    return $results;
}

/**
 *  Updates the database for cell changes to the table object
 */
function update_table_cells($tableId, $requestCells)
{

    error_log('    Web Service Input - ' . json_encode($requestCells));

    $results = null;
    $cells = [  ];

    foreach ($requestCells as $index => $cell) {
        $columnId = $cell[ 'column_id' ];
        $rowId = $cell[ 'row_id' ];
        // $attributes = $cell[ 'attributes' ];
        $serializedAttributes = maybe_serialize($cell[ 'attributes' ]);
        $classes = $cell[ 'classes' ];
        $content = wp_kses_post($cell[ 'content' ]);

        error_log('Serialized cell attributes = ' . json_encode($serializedAttributes));

        $cells[  ] = array($tableId, $columnId, $rowId, $serializedAttributes, $classes, $content);
    }

    error_log('    Updated Web Service Input' . json_encode($cells));

    $updateTableCells = new PersistTableData();
    $results = $updateTableCells->update_table_cells($tableId, $cells);

    if (!$results[ 'success' ]) {
        return new WP_Error('db_read_error', __('Database error retrieving table.'));
    }

    return $results;
}

function delete_table($tableId = 0)
// function delete_table($request)
{
    error_log('DELETE Table request - ' . $tableId);
    $existingTable = get_table($tableId);

    error_log('    Web Service Input - Table ID' . json_encode($tableId));

    $deleteTable = new PersistTableData();
    $results = $deleteTable->delete_table_data($tableId);

    if (!$results[ 'success' ]) {
        return new WP_Error('db_read_error', __('Database error retrieving table.'));
    }
    return $existingTable;
}

/**
 *  get_table Etracts and returns the table object from the database
 */
function get_table($tableId)
{
    $results = [  ];

    $testObject = [
        'columnWidthType' => 'Proportional',
        'minWidth' => 0,
        'minWidthUnits' => 'em',
        'maxWidth' => 0,
        'maxWidthUnits' => 'em',
        'fixedWidth' => 1,
        'fixedWidthUnits' => 'fr',
        'disableForTablet' => false,
        'disableForPhone' => false,
        'isFixedLeftColumnGroup' => false,
        'horizontalAlignment' => 'none',
     ];

    $testObjectSerialized = maybe_serialize($testObject);
    error_log('Serialized test object = ' . json_encode($testObjectSerialized));

    $results += [ "id" => $tableId ];

    $table = 'dt_tables';
    $getTable = new PersistTableData();
    $resultsHeader = $getTable->get_table($tableId, $table);
    if (!$resultsHeader[ 'success' ]) {
        // error_log('Get Table - Header');
        return new WP_Error('db_read_error', __('Database error retrieving table.'));
    }
    $results += [ "header" => $resultsHeader[ 'result' ] ];

    $table = 'dt_table_rows';
    $getTable = new PersistTableData();
    $resultsRows = $getTable->get_table($tableId, $table);
    if (!$resultsRows[ 'success' ]) {
        // error_log('Get Table - Rows');
        return new WP_Error('db_read_error', __('Database error retrieving table.'));
    }
    $results += [ "rows" => $resultsRows[ 'result' ] ];

    $table = 'dt_table_columns';
    $getTable = new PersistTableData();
    $resultsColumns = $getTable->get_table($tableId, $table);

    if (!$resultsColumns[ 'success' ]) {
        // error_log('Get Table - Columns');
        return new WP_Error('db_read_error', __('Database error retrieving table.'));
    }
    $results += [ "columns" => $resultsColumns[ 'result' ] ];

    $table = 'dt_table_cells';
    $getTable = new PersistTableData();
    $resultsCells = $getTable->get_table($tableId, $table);
    if (!$resultsCells[ 'success' ]) {
        // error_log('Get Table - Cells');
        return new WP_Error('db_read_error', __('Database error retrieving table.'));
    }
    $results += [ "cells" => $resultsCells[ 'result' ] ];

    return $results;
}

/**
 * Sanitizes every post field.
 *
 * @param object|WP_Post|array $table    The dynamic table  object or array
 * @param string               $context Optional. How to sanitize table fields.
 *                                      Accepts 'edit', 'db', 'display',
 *                                      'attribute', or 'js'. Default 'display'.
 * @return object|WP_Post|array The now sanitized dynamic table object or array (will be the
 *                              same type as `$table`).
 */
function sanitize_dynamic_table($table, $context = 'display')
{
    if (is_object($table)) {
        // Check if post already filtered for this context.
        if (isset($table->filter) && $context == $table->filter) {
            return $table;
        }
        if (!isset($table->id)) {
            $table->id = 0;
        }
        foreach (array_keys(get_object_vars($table)) as $field) {
            error_log('');
            error_log('New Field - Type Object');
            error_log('Field = ' . $field);
            error_log('Table Field Value = ' . $table->$field);
            error_log('Table ID = ' . $table->id);
            error_log('Context = ' . $context);

            // $table->$field = sanitize_dynamic_table_field($field, $table->$field, $table->id, $context);
        }
        $table->filter = $context;
    } elseif (is_array($table)) {
        // Check if post already filtered for this context.
        if (isset($table[ 'filter' ]) && $context == $table[ 'filter' ]) {
            return $table;
        }
        if (!isset($table[ 'id' ])) {
            $table[ 'id' ] = 0;
        }

        // Loop all fields in Table object for sanitization
        foreach (array_keys($table) as $field) {
            switch ($field) {
                case 'id':
                    $table[ $field ] = sanitize_dynamic_table_field($field, $table[ $field ], $table[ 'id' ], $context);
                    break;
                case 'header':
                    foreach (array_keys($table[ 'header' ]) as $header_field) {
                        $table[ 'header' ][ $header_field ] = sanitize_dynamic_table_field($header_field, $table[ 'header' ][ $header_field ], $table[ 'id' ], $context);
                    }
                    break;
                case 'rows':
                    foreach (array_keys($table[ 'rows' ]) as $row_container_field) {
                        foreach (array_keys($table[ 'rows' ][ $row_container_field ]) as $row_field) {
                            $table[ 'rows' ][ $row_container_field ][ $row_field ] = sanitize_dynamic_table_field($row_field, $table[ 'rows' ][ $row_container_field ][ $row_field ], $table[ 'id' ], $context);
                            error_log('Value for Row ' . $row_container_field . ', ' . $row_field . ' = ' . json_encode($table[ 'rows' ][ $row_container_field ][ $row_field ]));
                        }
                    }
                    break;
                case 'columns':
                    foreach (array_keys($table[ 'columns' ]) as $column_container_field) {
                        foreach (array_keys($table[ 'columns' ][ $column_container_field ]) as $column_field) {
                            $table[ 'columns' ][ $column_container_field ][ $column_field ] = sanitize_dynamic_table_field($column_field, $table[ 'columns' ][ $column_container_field ][ $column_field ], $table[ 'id' ], $context);
                            error_log('Value for Column ' . $column_container_field . ', ' . $column_field . ' = ' . json_encode($table[ 'columns' ][ $column_container_field ][ $column_field ]));
                        }
                    }
                    break;
                case 'cells':
                    foreach (array_keys($table[ 'cells' ]) as $cell_container_field) {
                        foreach (array_keys($table[ 'cells' ][ $cell_container_field ]) as $cell_field) {
                            $table[ 'cells' ][ $cell_container_field ][ $cell_field ] = sanitize_dynamic_table_field($cell_field, $table[ 'cells' ][ $cell_container_field ][ $cell_field ], $table[ 'id' ], $context);
                            error_log('Value for Cell ' . $cell_container_field . ', ' . $cell_field . ' = ' . json_encode($table[ 'cells' ][ $cell_container_field ][ $cell_field ]));
                        }
                    }
                    break;
            }
        }
        $table[ 'filter' ] = $context;
    }
    return $table;
}

/**
 * Sanitizes a table based on context.
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
function sanitize_dynamic_table_field($field, $value, $table_id, $context = 'display')
{

    if ('edit' === $context) {

        $format_to_edit = array('content', 'table_name');
        $value = apply_filters("edit_table_{$field}", $value, $table_id);

        if (in_array($field, $format_to_edit, true)) {
            if ('content' === $field) {
                $value = format_to_edit($value, user_can_richedit());
            }

            if ('table_name' === $field) {
                $value = format_to_edit($value);
            }
        } else {
            $value = esc_attr($value);
        }

    } elseif ('db' === $context) {
        $value = apply_filters("pre_table_{$field}", $value);

        // error_log('DB pre_table for ' . $field . ' = ' . json_encode($value));
        /**
         * Filters the value of a specific table field before saving.
         *
         * The dynamic portion of the hook name, `$field`, refers to the post
         * field name.
         *
         * @param mixed $value Value of the table field.
         */
        $value = apply_filters("{$field}_pre", $value);

        // error_log('DB ' . $field . '_pre = ' . json_encode($value));

    } else {

        // Use display filters by default.
        $value = apply_filters("table_{$field}", $value, $post_id, $context);

        if ('attribute' === $context) {
            $value = esc_attr($value);
        } elseif ('js' === $context) {
            $value = esc_js($value);
        }
    }

// Restore the type for integer fields after esc_attr().
    // if (in_array($field, $int_fields, true)) {
    //     $value = (int) $value;
    // }

    return $value;

}
