<?php

require_once plugin_dir_path(__FILE__) . 'dynamicTablesDbPersist.php';

function dynamic_tables_rest()
{

    register_rest_route('dynamic-tables/v1', 'table',
        array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => 'create_table_data',
            'permission_callback' => 'test_permissions',
        )
    );

    register_rest_route('dynamic-tables/v1', 'table/(?P<id>[\d]+)',
        array(
            'args' => array(
                'id' => array(
                    'description' => __('Unique identifier for this table'),
                    'type' => 'integer',
                ),
            ),
            array(
                'methods' => WP_REST_SERVER::READABLE,
                'callback' => 'get_table_request',
                'permission_callback' => 'test_permissions',
            ),
            array(
                'methods' => WP_REST_SERVER::EDITABLE,
                'callback' => 'update_table_data',
                'permission_callback' => 'test_permissions',

            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => 'delete_table',
                'permission_callback' => 'test_permissions',
                'args' => array(
                    'force' => array(
                        'type' => 'boolean',
                        'default' => false,
                        'description' => __('Whether to bypass Trash and force deletion.'),
                    ),

                ),
            ),
        )
    );

    // register_rest_route('dynamic-tables/v1', 'tableData', array(
    //     'methods' => WP_REST_SERVER::EDITABLE,
    //     'callback' => 'update_table_data',
    //     'permission_callback' => 'test_permissions',
    // ));
}

function test_permissions()
{
    // Restrict endpoint to only users who have the edit_posts capability.
    //if ( !is_user_logged_in() ) {
    //    die("Only logged in users can create a like.");
    // }

    // This is a black-listing approach. You could alternatively do this via white-listing, by returning false here and changing the permissions check.
    return true;
}

/**
 * GET table callback to return table object
 */
function get_table_request($request)
{

    error_log(' ');
    error_log('GET Table request headers - ' . json_encode($request->get_headers()));
    error_log(' ');
    error_log('GET Table request params - ' . json_encode($request->get_query_params()));
    error_log(' ');
    error_log('GET Table request body - ' . json_encode($request->get_body()));
    error_log(' ');

    $results = [  ];

    if (!is_string($request)) {
        error_log('Get Table Data Request String - ' . json_encode($request));
        if (isset($request[ 'id' ])) {
            $tableId = sanitize_text_field($request[ 'id' ]);
        } else {
            //  Return ERROR
        }
    } else {
        $tableId = $request;
    }

    if (TEST_MODE) {
        $tableId = '7';
        $classes = 'My class';
    }

    error_log('    Web Service Input' . json_encode($tableId));

    $results = get_table($tableId);
    error_log('    Result, Formatted - ' . json_encode($results, true));

    return rest_ensure_response($results);
}

function create_table_data($request)
{

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
