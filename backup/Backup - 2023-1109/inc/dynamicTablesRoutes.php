<?php

require_once plugin_dir_path(__FILE__) . 'dynamicTablesDbPersist.php';
//$getTableData = new GetTableData();
//$updateTableData = new UpdateTableData();

function dynamic_tables_rest()
{

    register_rest_route('dynamic-tables/v1', 'table', array(
        'methods' => 'POST',
        'callback' => 'create_table_data',
        'permission_callback' => 'test_permissions',
    ));

    register_rest_route('dynamic-tables/v1', 'table', array(
        'methods' => 'DELETE',
        'callback' => 'delete_table',
        'permission_callback' => 'test_permissions',
    ));

    register_rest_route('dynamic-tables/v1', 'table', array(
        'methods' => WP_REST_SERVER::READABLE,
        'callback' => 'get_table',
        'permission_callback' => 'test_permissions',
    ));

    register_rest_route('dynamic-tables/v1', 'tableData', array(
        'methods' => WP_REST_SERVER::EDITABLE,
        'callback' => 'update_table_data',
        'permission_callback' => 'test_permissions',
    ));

    register_rest_route('dynamic-tables/v1', 'tableColumns', array(
        'methods' => WP_REST_SERVER::READABLE,
        'callback' => 'get_table_columns',
        'permission_callback' => 'test_permissions',
    ));

    register_rest_route('dynamic-tables/v1', 'tableColumns', array(
        'methods' => 'PUT',
        'callback' => 'update_table_columns',
        'permission_callback' => 'test_permissions',
    ));

    register_rest_route('dynamic-tables/v1', 'tableCells', array(
        'methods' => WP_REST_SERVER::READABLE,
        'callback' => 'get_table_cells',
        'permission_callback' => 'test_permissions',
    ));

    register_rest_route('dynamic-tables/v1', 'tableCells', array(
        'methods' => 'PUT',
        'callback' => 'update_table_cells',
        'permission_callback' => 'test_permissions',
    ));
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

function create_table_data($request)
{
    $results = null;

    if (isset($request[ 'postId' ])) {
        $postId = sanitize_text_field($request[ 'postId' ]);
    }

    if (isset($request[ 'tableName' ])) {
        $tableName = sanitize_text_field($request[ 'tableName' ]);
    }

    if (isset($request[ 'classes' ])) {
        $classes = sanitize_text_field($request[ 'classes' ]);
    }

    if (TEST_MODE) {
        $postId = "45";
        $tableName = "Greg's Awesome Table";
        $classes = '';
    }

    $newTable = new PersistTableData();
    $results = $newTable->create_table_data($postId, $tableName, $classes);

    return $results;
}

function update_table_data($request)
{

    error_log('PUT Table request - ' . json_encode($request));

    $requestTable = $request[ 'table' ];
    error_log('Request Table - ' . json_encode($requestTable));
    // error_log('Request Header - ' . json_encode($request[ 'table' ][ 0 ][ 'header' ]));

    $results = null;

    if (isset($requestTable[ 0 ][ 'header' ])) {
        $requestHeader = $requestTable[ 0 ][ 'header' ];
    }

    error_log('...Request Header - ' . json_encode($requestHeader));

    if (isset($requestHeader[ 0 ][ 'id' ])) {
        $tableId = sanitize_text_field($requestHeader[ 0 ][ 'id' ]);
    } else {
        $tableId = null;
    }

    error_log('...Request TableId - ' . json_encode($requestHeader[ 0 ][ 'id' ]));

    if (isset($requestHeader[ 0 ][ 'post_id' ])) {
        $postId = sanitize_text_field($requestHeader[ 0 ][ 'post_id' ]);
    } else {
        $postId = null;
    }

    if (isset($requestHeader[ 0 ][ 'table_name' ])) {
        $tableName = sanitize_text_field($requestHeader[ 0 ][ 'table_name' ]);
    } else {
        $tableName = null;
    }

    if (isset($requestHeader[ 0 ][ 'classes' ])) {
        $classes = sanitize_text_field($requestHeader[ 0 ][ 'classes' ]);
    } else {
        $classes = null;
    }

    if (TEST_MODE) {
        $tableId = '7';
        $postId = '26';
        $tableName = "Another Awesome Table";
        $classes = 'My class';
    }

    error_log('    Web Service Input - ' . json_encode($tableId));

    $updateTable = new PersistTableData();
    $results = $updateTable->update_table($tableId, $postId, $tableName, $classes);

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
//        return new WP_Error('no_author', 'Invalid author', array('status' => 500));
    }

    error_log('    Header result - ' . json_encode($results));

    if (isset($requestTable[ 0 ][ 'columns' ])) {
        $requestColumns = $requestTable[ 0 ][ 'columns' ];
    }
    // error_log('...Request Columns - ' . json_encode($requestColumns));

    $putColumns = update_table_columns($tableId, $requestColumns);
    //error_log('    Header result - ' . $putColumns);

    if (isset($requestTable[ 0 ][ 'cells' ])) {
        $requestCells = $requestTable[ 0 ][ 'cells' ];
    }
    // error_log('...Request Cells - ' . json_encode($requestCells));

    $putCells = update_table_cells($tableId, $requestCells);
    //error_log('    Header result - ' . json_encode($putCells));

    $responseResults = null;
    $responseResults = get_table($tableId);

    error_log('Put Return = ' . $responseResults);

    return new WP_REST_Response($responseResults, 200);
}

// function update_table_columns($tableId, $requestColumns)
function update_table_columns($tableId, $requestColumns)
{
    error_log('    Web Service Input - ' . json_encode($requestColumns));

    $results = null;
    $columns = [  ];

    foreach ($requestColumns as $index => $column) {
//        $columnTableId = $tableId;
        $columnId = $column[ 'column_id' ];
        $columnName = $column[ 'column_name' ];
        $classes = $column[ 'classes' ];

        $columns[  ] = array($tableId, $columnId, $columnName, $classes);
    }

    if (TEST_MODE) {
        $tableId = '1';
        $columns = [  ];

        $columns[  ] = array('3', '1', 'Brand', '');
        $columns[  ] = array('3', '2', 'Style', '');
        $columns[  ] = array('3', '3', 'Rating', '');
        $columns[  ] = array('3', '4', 'Comments', '');
    }

    error_log('    Web Service Updated Request' . json_encode($columns));

    $updateTableColumns = new PersistTableData();
    $results = $updateTableColumns->update_table_columns($tableId, $columns);

    // error_log('    column result - ' . json_encode($result[ 'success' ]));

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
    }

    return $results;
}

function update_table_cells($tableId, $requestCells)
{

    error_log('    Web Service Input - ' . json_encode($requestCells));

    $results = null;
    $cells = [  ];

    foreach ($requestCells as $index => $cell) {
        $columnId = $cell[ 'column_id' ];
        $rowId = $cell[ 'row_id' ];
        $classes = $cell[ 'classes' ];
        $content = $cell[ 'content' ];

        $cells[  ] = array($tableId, $columnId, $rowId, $classes, $content);
    }

    if (TEST_MODE) {
        $tableId = '1';
        $cells = [  ];

        $cells[  ] = array('1', '1', 'header', 'Brand');
        $cells[  ] = array('2', '1', 'header', 'Style');
        $cells[  ] = array('3', '1', 'header', 'Rating');
        $cells[  ] = array('4', '1', 'header', 'Comments');

        $cells[  ] = array('1', '2', 'body', 'Heinekin');
        $cells[  ] = array('2', '2', 'body', 'Pilsner');
        $cells[  ] = array('3', '2', 'body', '5');
        $cells[  ] = array('4', '2', 'body', 'Best it gets');

        $cells[  ] = array('1', '2', 'body', 'Sam Adams');
        $cells[  ] = array('2', '2', 'body', 'Special Effects Hoppy Amber IPA');
        $cells[  ] = array('3', '2', 'body', '3');
        $cells[  ] = array('4', '2', 'body', 'Watered down IPA');
    }

    error_log('    Updated Web Service Input' . json_encode($cells));

    $updateTableCells = new PersistTableData();
    $results = $updateTableCells->update_table_cells($tableId, $cells);

    // error_log('    cell result - ' . json_encode($results[ 'success' ]));

    if ($results[ 'success' ] === 'False') {
        return new WP_REST_Response(null, 500);
    }

    return $results;
}

function delete_table($request)
{

    $results = null;

    if (isset($request[ 'tableId' ])) {
        $tableId = sanitize_text_field($request[ 'tableId' ]);
    }

    if (TEST_MODE) {
        $tableId = '1';
    }

    error_log('    Web Service Input - Table ID' . json_encode($tableId));

    $deleteTable = new PersistTableData();
    $results = $deleteTable->delete_table_data($tableId);

    return $results;
}

function get_table($request)
{
    $requestType = '';
    $results = [  ];
    $wpdbResults = [  ];

/**
 *  get_table is called from web service callback
 */
    if (!is_string($request)) {
        error_log('Get Table Data Request String - ' . json_encode($request));
        $requestType = 'GET';
        if (isset($request[ 'tableId' ])) {
            $tableId = sanitize_text_field($request[ 'tableId' ]);
        } else {
            //  Return ERROR
        }
    } else {
        $requestType = 'PUT';
        $tableId = $request;
    }

    if (TEST_MODE) {
        $tableId = '7';
        $classes = 'My class';
    }

    error_log('    Web Service Input' . json_encode($tableId));

    $table = 'dt_tables';
    $getTable = new PersistTableData();
    $wpdbResults += [ "header" => $getTable->get_table($tableId, $table) ];

    $table = 'dt_table_columns';
    $getTable = new PersistTableData();
    $resultsColumns = $getTable->get_table($tableId, $table);
    $wpdbResults += [ "columns" => $resultsColumns ];

    $table = 'dt_table_cells';
    $getTable = new PersistTableData();
    $resultsCells = $getTable->get_table($tableId, $table);
    $wpdbResults += [ "cells" => $resultsCells ];

    $results += [ "table" => [ $wpdbResults ] ];
//  array_push($results, [ $wpdbResults ]);
    error_log('    Result, Formatted - ' . json_encode($results, true));

    if ($requestType === 'PUT') {
        return $results;
    }
    return rest_ensure_response($results);
}

function get_table_columns($request)
{

    $results = null;

    if (isset($request[ 'tableId' ])) {
        $tableId = sanitize_text_field($request[ 'tableId' ]);
    }

    if (TEST_MODE) {
        $tableId = '3';
        $columns = [  ];
    }

    $table = 'dt_table_columns';
    //error_log('    Web Service Input' . json_encode($cells));

    $getTable = new PersistTableData();
    $results = $getTable->get_table($tableId, $table);

    return $results;
}

function get_table_cells($request)
{

    $results = null;

    if (isset($request[ 'tableId' ])) {
        $tableId = sanitize_text_field($request[ 'tableId' ]);
    }

    if (TEST_MODE) {
        $tableId = '1';
        $cells = [  ];

    }

    $table = 'dt_table_cells';
    error_log('    Web Service Input - Table ID: ' . $tableId . ', DB Table Name: ' . $table);

    $getTable = new PersistTableData();
    $results = $getTable->get_table($tableId, $table);

    return $results;
}
