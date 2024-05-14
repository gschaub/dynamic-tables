<?php

require_once plugin_dir_path(__FILE__) . 'dynamicTablesDbPersist.php';

/**
 * GET table callback to return table object
 */
// function get_table_request($request)
// {

//     error_log(' ');
//     error_log('GET Table request headers - ' . json_encode($request->get_headers()));
//     error_log(' ');
//     error_log('GET Table request params - ' . json_encode($request->get_query_params()));
//     error_log(' ');
//     error_log('GET Table request body - ' . json_encode($request->get_body()));
//     error_log(' ');

//     $results = [  ];

//     if (!is_string($request)) {
//         error_log('Get Table Data Request String - ' . json_encode($request));
//         if (isset($request[ 'id' ])) {
//             $tableId = sanitize_text_field($request[ 'id' ]);
//         } else {
//             //  Return ERROR
//         }
//     } else {
//         $tableId = $request;
//     }

//     if (TEST_MODE) {
//         $tableId = '7';
//         $classes = 'My class';
//     }

//     error_log('    Web Service Input = ' . json_encode($tableId));

//     $results = get_table($tableId);
//     error_log('    Result, Formatted - ' . json_encode($results, true));

//     return rest_ensure_response($results);
// }

function create_table_data($tablearr)
{
    // Capture original pre-sanitized array for passing into filters.
    $unsanitized_postarr = $tbltarr;

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

    // var_dump($tablearr);
    error_log('Table Formatted for Insert:');
    error_log(json_encode($tablearr));
    die;

    error_log('POST Table request - ' . json_encode($request->get_json_params()));

    $results = null;

    if (isset($request[ 'header' ][ 'block_table_ref' ])) {
        $blockTableRef = sanitize_text_field($request[ 'header' ][ 'block_table_ref' ]);
    } else {
        $blockTableRef = '';
    }

    if (isset($request[ 'header' ][ 'status' ])) {
        $status = sanitize_text_field($request[ 'header' ][ 'status' ]);
    } else {
        $status = 'unknown';
    }

    if (isset($request[ 'header' ][ 'post_id' ])) {
        $postId = sanitize_text_field($request[ 'header' ][ 'post_id' ]);
    } else {
        $postId = '0';
    }

    if (isset($request[ 'header' ][ 'table_name' ])) {
        $tableName = sanitize_text_field($request[ 'header' ][ 'table_name' ]);
    } else {
        $tableName = '';
    }

    if (isset($request[ 'header' ][ 'table_attributes' ])) {
        $prepAttributes = maybe_serialize($request[ 'header' ][ 'table_attributes' ]);
        $serializedAttributes = wp_kses_post($prepAttributes);
    } else {
        $serializedAttributes = '{}';
    }
    // $serializedAttributes = maybe_serialize($attributes);
    error_log('Serialized table attributes = ' . json_encode($serializedAttributes));

    if (isset($request[ 'header' ][ 'classes' ])) {
        $classes = sanitize_text_field($request[ 'header' ][ 'classes' ]);
    } else {
        $classes = '';
    }

    if (TEST_MODE) {
        $blockTableRef = "13947hs45";
        $status = 'new';
        $postId = "45";
        $tableName = "Greg's Awesome Table";
        $classes = '';
    }

    error_log('Create Table Params: block ref - ' . $blockTableRef . ', status - ' . $status . ', post id - ' . $postId . ', table name - ' . $tableName . ', attributes - ' . $serializedAttributes . ', classes - ' . $classes);
    $newTable = new PersistTableData();
    $results = $newTable->create_table_data($blockTableRef, $status, $postId, $tableName, $serializedAttributes, $classes);

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
//        return new WP_Error('no_author', 'Invalid author', array('status' => 500));
    }

    error_log('    Header result - ' . json_encode($results));

    $tableId = $results[ 'table_id' ];

    if (isset($request[ 'rows' ])) {
        $requestRows = $request[ 'rows' ];

        //update variable to replace all table_id's

        $putRows = update_table_rows($tableId, $requestRows);
        if ($putRows === false) {
            error_log('Error on Rows');
        }
    }

    if (isset($request[ 'columns' ])) {
        $requestColumns = $request[ 'columns' ];

//update variable to replace all table_id's

        $putColumns = update_table_columns($tableId, $requestColumns);
        if ($putColumns === false) {
            // Error handling for Put Columns error
        }
    }

    if (isset($request[ 'cells' ])) {
        $requestCells = $request[ 'cells' ];

//update variable to replace all table_id's

        $putCells = update_table_cells($tableId, $requestCells);
        if ($putCells === false) {
            // Error handling for Put Cells error
        }
    }

    $responseResults = null;
    $responseResults = get_table($tableId);

    error_log('POST Return = ' . json_encode($responseResults));

    return new WP_REST_Response($responseResults, 200);

    return $results;
}

/**
 * PUT table callback to update the database for table changes
 */
function update_table_data($request)
{

    error_log('PUT Table request - ' . json_encode($request->get_json_params()));
    error_log('... test field - ' . $request[ 'header' ][ 'block_table_ref' ]);

    $results = null;

    if (isset($request[ 'id' ])) {
        $tableId = sanitize_text_field($request[ 'id' ]);
    } else {
        $tableId = null;
    }

    $existingTable = get_table($tableId);

    if (isset($request[ 'header' ][ 'block_table_ref' ])) {
        $blockTableRef = sanitize_text_field($request[ 'header' ][ 'block_table_ref' ]);
    } else {
        $blockTableRef = $existingTable[ 'header' ][ 'block_table_ref' ];
    }

    if (isset($request[ 'header' ][ 'status' ])) {
        $status = sanitize_text_field($request[ 'header' ][ 'status' ]);
    } else {
        $status = $existingTable[ 'header' ][ 'status' ];
    }

    if (isset($request[ 'header' ][ 'post_id' ])) {
        $postId = sanitize_text_field($request[ 'header' ][ 'post_id' ]);
    } else {
        $postId = $existingTable[ 'header' ][ 'post_id' ];
    }

    if (isset($request[ 'header' ][ 'table_name' ])) {
        $tableName = wp_kses_post($request[ 'header' ][ 'table_name' ]);
    } else {
        $tableName = $existingTable[ 'header' ][ 'table_name' ];
    }

    if (isset($request[ 'header' ][ 'table_attributes' ])) {
        $attributes = $request[ 'header' ][ 'table_attributes' ];
        error_log('Attributes found in PUT');
        error_log(json_encode($attributes));
    } else {
        $attributes = $existingTable[ 'header' ][ 'table_attributes' ];
    }
    $serializedAttributes = maybe_serialize($attributes);
    error_log('Serialized table attributes = ' . json_encode($serializedAttributes));

    if (isset($request[ 'header' ][ 'classes' ])) {
        $classes = sanitize_text_field($request[ 'header' ][ 'classes' ]);
    } else {
        $classes = $existingTable[ 'header' ][ 'classes' ];
    }

    if (TEST_MODE) {
        $tableId = '7';
        $blockTableRef = "13947hs45";
        $status = 'saved';
        $postId = '26';
        $tableName = "Another Awesome Table";
        $classes = 'My class';
    }

    error_log('Update Table Params: table id - ' . $tableId . ', block ref - ' . $blockTableRef . ', status - ' . $status . ', post id - ' . $postId . ', table name - ' . $tableName . ', attributes - ' . $serializedAttributes . ', classes - ' . $classes);

    $updateTable = new PersistTableData();
    $results = $updateTable->update_table($tableId, $blockTableRef, $status, $postId, $tableName, $serializedAttributes, $classes);

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
//        return new WP_Error('no_author', 'Invalid author', array('status' => 500));
    }

    error_log('    Header result - ' . json_encode($results));

    if (isset($request[ 'rows' ])) {
        $requestRows = $request[ 'rows' ];
        $putRows = update_table_rows($tableId, $requestRows);
        if ($putRows === false) {
            // Error handling for Put Rows error
        }
    }

    if (isset($request[ 'columns' ])) {
        $requestColumns = $request[ 'columns' ];
        $putColumns = update_table_columns($tableId, $requestColumns);
        if ($putColumns === false) {
            // Error handling for Put Columns error
        }
    }

    if (isset($request[ 'cells' ])) {
        $requestCells = $request[ 'cells' ];
        $putCells = update_table_cells($tableId, $requestCells);
        if ($putCells === false) {
            // Error handling for Put Cells error
        }
    }

    $responseResults = null;
    $responseResults = get_table($tableId);

    error_log('PUT Return = ' . json_encode($responseResults));

    return new WP_REST_Response($responseResults, 200);
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
        $attributes = $row[ 'attributes' ];
        $classes = $row[ 'classes' ];

        $serializedAttributes = maybe_serialize($attributes);
        error_log('Serialized row attributes = ' . json_encode($serializedAttributes));

        $rows[  ] = array($tableId, $rowId, $serializedAttributes, $classes);
    }

    if (TEST_MODE) {
        $tableId = '1';
        $rows = [  ];

        $rows[  ] = array('1', '1', '', '');
        $rows[  ] = array('1', '2', '', '');
        $rows[  ] = array('1', '3', '', '');
        $rows[  ] = array('1', '4', '', '');
    }

    error_log('    Web Service Updated Request' . json_encode($rows));

    $updateTableRows = new PersistTableData();
    $results = $updateTableRows->update_table_rows($tableId, $rows);

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
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
        $attributes = $column[ 'attributes' ];
        $classes = $column[ 'classes' ];

        $serializedAttributes = maybe_serialize($attributes);
        error_log('Serialized column attributes = ' . json_encode($serializedAttributes));

        $columns[  ] = array($tableId, $columnId, $columnName, $serializedAttributes, $classes);
    }

    if (TEST_MODE) {
        $tableId = '1';
        $columns = [  ];

        $columns[  ] = array('3', '1', 'Brand', '', '');
        $columns[  ] = array('3', '2', 'Style', '', '');
        $columns[  ] = array('3', '3', 'Rating', '', '');
        $columns[  ] = array('3', '4', 'Comments', '', '');
    }

    error_log('    Web Service Updated Request' . json_encode($columns));

    $updateTableColumns = new PersistTableData();
    $results = $updateTableColumns->update_table_columns($tableId, $columns);

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
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
        $attributes = $cell[ 'attributes' ];
        $classes = $cell[ 'classes' ];
        $content = wp_kses_post($cell[ 'content' ]);

        $serializedAttributes = maybe_serialize($attributes);
        error_log('Serialized cell attributes = ' . json_encode($serializedAttributes));

        $cells[  ] = array($tableId, $columnId, $rowId, $serializedAttributes, $classes, $content);
    }

    if (TEST_MODE) {
        $tableId = '1';
        $cells = [  ];

        $cells[  ] = array('1', '1', '', 'header', 'Brand');
        $cells[  ] = array('2', '1', '', 'header', 'Style');
        $cells[  ] = array('3', '1', '', 'header', 'Rating');
        $cells[  ] = array('4', '1', '', 'header', 'Comments');

        $cells[  ] = array('1', '2', '', 'body', 'Heinekin');
        $cells[  ] = array('2', '2', '', 'body', 'Pilsner');
        $cells[  ] = array('3', '2', '', 'body', '5');
        $cells[  ] = array('4', '2', '', 'body', 'Best it gets');

        $cells[  ] = array('1', '2', '', 'body', 'Sam Adams');
        $cells[  ] = array('2', '2', '', 'body', 'Special Effects Hoppy Amber IPA');
        $cells[  ] = array('3', '2', '', 'body', '3');
        $cells[  ] = array('4', '2', '', 'body', 'Watered down IPA');
    }

    error_log('    Updated Web Service Input' . json_encode($cells));

    $updateTableCells = new PersistTableData();
    $results = $updateTableCells->update_table_cells($tableId, $cells);

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
    }

    return $results;
}

function delete_table($request)
{
    error_log('PUT Table request - ' . json_encode($request->get_json_params()));
    error_log('... test field - ' . $request[ 'header' ][ 'block_table_ref' ]);

    $results = null;

    if (isset($request[ 'id' ])) {
        $tableId = sanitize_text_field($request[ 'id' ]);
    } else {
        $tableId = null;
    }

    // if (isset($request[ 'force' ])) {
    //     $force = sanitize_text_field($request[ 'force' ]);
    // } else {
    //     $force = null;
    // }

    // $existingTable = get_table($tableId);

    // if (TEST_MODE) {
    //     $tableId = '1';
    // }

    error_log('    Web Service Input - Table ID' . json_encode($tableId));

    $deleteTable = new PersistTableData();
    $results = $deleteTable->delete_table_data($tableId);

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
    }

    return new WP_REST_Response(null, 204);
}

/**
 *  get_table Etracts and returns the table object from the database
 */
function get_table($tableId)
{
    $results = [  ];

    if (TEST_MODE) {
        $tableId = '7';
    }

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
    $results += [ "header" => $resultsHeader ];

    $table = 'dt_table_rows';
    $getTable = new PersistTableData();
    $resultsRows = $getTable->get_table($tableId, $table);
    $results += [ "rows" => $resultsRows ];

    $table = 'dt_table_columns';
    $getTable = new PersistTableData();
    $resultsColumns = $getTable->get_table($tableId, $table);
    $results += [ "columns" => $resultsColumns ];

    $table = 'dt_table_cells';
    $getTable = new PersistTableData();
    $resultsCells = $getTable->get_table($tableId, $table);
    $results += [ "cells" => $resultsCells ];

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
        if (!isset($table->ID)) {
            $table->ID = 0;
        }
        foreach (array_keys(get_object_vars($table)) as $field) {
            error_log('');
            error_log('New Field - Type Object');
            error_log('Field = ' . $field);
            error_log('Table Field Value = ' . $table->$field);
            error_log('Table ID = ' . $table->ID);
            error_log('Context = ' . $context);

            // $table->$field = sanitize_dynamic_table_field($field, $table->$field, $table->ID, $context);
        }
        $table->filter = $context;
    } elseif (is_array($table)) {
        // Check if post already filtered for this context.
        if (isset($table[ 'filter' ]) && $context == $table[ 'filter' ]) {
            return $table;
        }
        if (!isset($table[ 'ID' ])) {
            $table[ 'ID' ] = 0;
        }

        // Loop all fields in Table object for sanitization
        foreach (array_keys($table) as $field) {
            switch ($field) {
                case 'id':
                    $table[ $field ] = sanitize_dynamic_table_field($field, $table[ $field ], $table[ 'ID' ], $context);
                    break;
                case 'header':
                    foreach (array_keys($table[ 'header' ]) as $header_field) {
                        $table[ 'header' ][ $header_field ] = sanitize_dynamic_table_field($header_field, $table[ 'header' ][ $header_field ], $table[ 'ID' ], $context);
                    }
                    break;
                case 'rows':
                    foreach (array_keys($table[ 'rows' ]) as $row_container_field) {
                        foreach (array_keys($table[ 'rows' ][ $row_container_field ]) as $row_field) {
                            $table[ 'rows' ][ $row_container_field ][ $row_field ] = sanitize_dynamic_table_field($row_field, $table[ 'rows' ][ $row_container_field ][ $row_field ], $table[ 'ID' ], $context);
                            error_log('Value for Row ' . $row_container_field . ', ' . $row_field . ' = ' . json_encode($table[ 'rows' ][ $row_container_field ][ $row_field ]));
                        }
                    }
                    break;
                case 'columns':
                    foreach (array_keys($table[ 'columns' ]) as $column_container_field) {
                        foreach (array_keys($table[ 'columns' ][ $column_container_field ]) as $column_field) {
                            $table[ 'columns' ][ $column_container_field ][ $column_field ] = sanitize_dynamic_table_field($column_field, $table[ 'columns' ][ $column_container_field ][ $column_field ], $table[ 'ID' ], $context);
                            error_log('Value for Column ' . $column_container_field . ', ' . $column_field . ' = ' . json_encode($table[ 'columns' ][ $column_container_field ][ $column_field ]));
                        }
                    }
                    break;
                case 'cells':
                    foreach (array_keys($table[ 'cells' ]) as $cell_container_field) {
                        foreach (array_keys($table[ 'cells' ][ $cell_container_field ]) as $cell_field) {
                            $table[ 'cells' ][ $cell_container_field ][ $cell_field ] = sanitize_dynamic_table_field($cell_field, $table[ 'cells' ][ $cell_container_field ][ $cell_field ], $table[ 'ID' ], $context);
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
