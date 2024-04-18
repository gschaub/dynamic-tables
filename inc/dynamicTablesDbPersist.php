<?php

class PersistTableData
{
    /**
     * SQL specific arguments from calling calling method get_table_data()
     *
     *  Each array arguments contains 3 fields:
     *      - type
     *      - field
     *      - value
     *
     *  Valid argument types are:
     *      - insert: field = Database table name, value = null
     *      - delete: field = Database table name, value = null
     *      - update: field = Database table name, value = null
     *      - from: field = Database table name, value = null
     *      - value: field = Database field name, value = new field value
     *      - set: field = Database field name, value = new field value
     *      - select: Reserved for future
     *      - aggregate: Reserved for future
     *      - where: field = Database field name, value = field comparison value
     *      - having: Reserved for future
     *      - order_by: Reserved for future
     *
     *  Notes:
     *      - Argument order is important in building query string and must be in the order
     *        indentified in the description of valid argument types
     *      - delete, update and from argument types are mutulally exclusive.  Only one of these
     *        types may be present in any single argument array
     *      - At present, there must be one and only one delete, update or from argument
     *
     *
     * @since 1.0.0
     *
     * @var array
     */
    public array $result = array();
    public array $requestArgs = array();
    public array $queryResult = array();
    public string $updateResult = '';
    public string $deleteResult = '';
    public array $tableId = array();
    public string $replacementResult = '';
//    protected array $sqlArgs = array();
//    public array $args = array();
//    public string $prepare = '';
//    public string $inserted = '';
//    public array $temp = array();
//    public array $tempBuild = array();

    public function __construct()
    {
        // Silence is golden
    }

    public function get_table_data($requestArgs, $returnCollection = false)
    {
        error_log('Select Request Args - ' . json_encode($requestArgs));
        global $wpdb;

        $args = $this->process_args($requestArgs);

        $query = "SELECT * ";
        $query .= $this->process_query_string($requestArgs);

        $prepare = $wpdb->prepare($query, $args);

        error_log('   Query Args - ' . json_encode($args));
        error_log('   Query String - ' . $query);
        error_log('   Prepare - ' . $prepare);

        if ($returnCollection) {
            $this->queryResult = $wpdb->get_results($prepare, ARRAY_A);
        } else {
            $this->queryResult = $wpdb->get_row($prepare, ARRAY_A);
        }

        error_log('   Executed SQL - ' . json_encode($wpdb->last_query));
        error_log(' ');

        return $this->queryResult;
    }

/**
 * This generic database delete function does not work properly.  Fix before
 * restoring it.  It was replace by the code in update_table because
 * that is the only update currently needed.  That function only updates
 * dt_tables, so no generic version is needed
 * *
 *     public function update_table($requestArgs) {
 *
 *     error_log('Update Request Args - ' . json_encode($requestArgs));
 *     global $wpdb;
 *
 *     $args = $this->process_args($requestArgs);
 *
 *     $query = "UPDATE ";
 *     $query .= $this->process_query_string($requestArgs);
 *
 *     $prepare = $wpdb->prepare($query, $args);
 *
 *     error_log('   Query Args - ' . json_encode($args));
 *     error_log('   Query String - ' . $query);
 *     error_log('   Prepare - ' . json_encode($prepare));
 *     error_log(' ');
 *
 *     $this->updateResult = $wpdb->query($prepare);
 *
 *     return $this->updateResult;
 *     }
 *
 */

    public function delete_table($dbTableName, $requestArgs)
    {
        global $wpdb;

        $dbTable = $wpdb->prefix . $dbTableName;
        $where = $this->process_args($requestArgs);
        $format = explode(',', $this->process_query_string($requestArgs));

        $this->deleteResult = $wpdb->delete($dbTable, $where, $format);

        error_log('  Where Format: ' . json_encode($format));
        error_log('  Update SQL Query: ' . $wpdb->last_query);

        return $this->deleteResult;
    }

    public function replaceTable($tableName, $requestArgs)
    {
        global $wpdb;

        $db_table = $wpdb->prefix . $tableName;
        $data = $this->process_args($requestArgs);
        $format = explode(',', $this->process_query_string($requestArgs));

        $this->replacementResult = $wpdb->replace($db_table, $data, $format);

        error_log('    Replace Table Function Results ' . $this->replacementResult);
        // error_log('    Replace Query ' . json_encode($prepare));
        return $this->replacementResult;
    }

    public function create_table_data($blockTableRef, $status, $postId, $tableName, $attributes, $classes)
    {

        $success = 'Processing';
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $db_table = $wpdb->prefix . 'dt_tables';

        $data = array(
            'block_table_ref' => $blockTableRef,
            'post_id' => $postId,
            'status' => $status,
            'table_name' => $tableName,
            'attributes' => $attributes,
            'classes' => $classes);

        $format = array('%s', '%d', '%s', '%s');

        $inserted = $wpdb->insert($db_table, $data, $format);
        $tableId = $wpdb->insert_id;
        //error_log('   New table id = ' . $tableIdTemp);
        //$wpdb->query('COMMIT'); // commit all queries

        if ($inserted) {
            $wpdb->query('COMMIT'); // commit all queries
            $success = 'True';
        } else {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';
        }

        $this->result = array(
            'success' => $success,
            'table_id' => $tableId);

        return $this->result;
    }

    public function update_table($tableId, $blockTableRef, $status, $postId, $tableName, $attributes, $classes)
    {

        error_log('Updating table, attributes = ' . json_encode($attributes));
        $success = 'Processing';
        $updatedRows = 0;
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $argsBuild = [  ];

        /**
         * Query the dt_tables table to get the current table values
         */
        array_push($argsBuild, array(
            'type' => 'from',
            'field' => 'dt_tables',
            'value' => null));

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'id',
            'value' => $tableId));

        error_log('Update Table Params: table id - ' . $tableId . ', block ref - ' . $blockTableRef . ', status - ' . $status . ', post id - ' . $postId . ', table name - ' . $tableName . ', attributes - ' . $attributes . ', classes - ' . $classes);

        $queryResults = $this->get_table_data($argsBuild);
        error_log('   Selected Data - ' . json_encode($queryResults));

        /**
         * Replace any null values from the function call with current
         * table values
         */
        if ($blockTableRef === null) {
            $blockTableRef = $queryResults[ 0 ]->block_table_ref;
        }

        if ($status === null) {
            $status = $queryResults[ 0 ]->status;
        }

        if ($postId === null) {
            $postId = $queryResults[ 0 ]->post_id;
        }

        if ($tableName === null) {
            $tableName = sanitize_text_field($queryResults[ 0 ]->table_name);
        }

        if ($attributes === null) {
            $attributes = $queryResults[ 0 ]->table_name;
        }

        if ($classes === null) {
            $classes = $queryResults[ 0 ]->classes;
        }

        /**
         * Create arrays with required args for the update process
         */
        $argsBuild = [  ];

        array_push($argsBuild, array(
            'type' => 'set',
            'field' => 'block_table_ref',
            'value' => $blockTableRef));

        array_push($argsBuild, array(
            'type' => 'set',
            'field' => 'status',
            'value' => $status));

        array_push($argsBuild, array(
            'type' => 'set',
            'field' => 'post_id',
            'value' => $postId));

        array_push($argsBuild, array(
            'type' => 'set',
            'field' => 'table_name',
            'value' => $tableName));

        array_push($argsBuild, array(
            'type' => 'set',
            'field' => 'attributes',
            'value' => $attributes));

        array_push($argsBuild, array(
            'type' => 'set',
            'field' => 'classes',
            'value' => $classes));

        $argsSet = $argsBuild;
        $argsBuild = [  ];

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'id',
            'value' => $tableId));

        $argsWhere = $argsBuild;

        /**
         * Run update query for dt_tables
         */
        $dbTable = $wpdb->prefix . 'dt_tables';
        $set = $this->process_args($argsSet);
        $where = $this->process_args($argsWhere);
        $setFormat = array_map('trim', explode(',', $this->process_query_string($argsSet)));
        $whereFormat = array_map('trim', explode(',', $this->process_query_string($argsWhere)));

        $updateResult = $wpdb->update($dbTable,
            $set,
            $where,
            $setFormat,
            $whereFormat);

        error_log('  Set Format: ' . json_encode($setFormat));
        error_log('  Where Format: ' . json_encode($whereFormat));
        error_log('  Update SQL Query: ' . $wpdb->last_query);

        if ($updateResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'success' => $success,
                'updated_rows' => '0');

            return $this->result;

        }
        $updatedRows = $updatedRows + $updateResult;

        $wpdb->query('COMMIT'); // commit all queries
        $success = 'True';

        $this->result = array(
            'success' => $success,
            'updated_rows' => $updatedRows);

        return $this->result;
    }

    public function update_table_rows($tableId, $rows)
    {
        $success = 'Processing';
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $argsBuild = [  ];
        $insertedRows = 0;

        $dbTable = 'dt_table_rows';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);
        error_log('    Request Args' . json_encode($rows));
        error_log('Begin Row Insert');

        if ($queryReturnedResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'success' => $success,
                'deleted_rows' => '0');

            return $this->result;
        }

        foreach ($rows as $index => $row) {
            foreach ($row as $rowAttribute => $arg) {
                switch ($rowAttribute) {
                    case '0':$argTableId = $arg;
                    case '1':$argRowId = $arg;
                    case '2':$argAttributes = $arg;
                    case '3':$argClasses = $arg;
                }
            }

            $argsBuild = [  ];

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'table_id',
                'value' => $argTableId));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'row_id',
                'value' => $argRowId));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'attributes',
                'value' => $argAttributes));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'classes',
                'value' => $argClasses));

            $queryReturnedResult = $this->replaceTable('dt_table_rows', $argsBuild);

            error_log('    Insert Results: ' . $queryReturnedResult);

            if (!$queryReturnedResult) {
                $wpdb->query('ROLLBACK'); // rollback everything
                $success = 'False';

                $this->result = array(
                    'success' => $success,
                    'updated_rows' => '0');

                return $this->result;

            }
            $insertedRows++;
        }

        $wpdb->query('COMMIT'); // commit all queries
        $success = 'True';

        $this->result = array(
            'success' => $success,
            'updated_rows' => $insertedRows);

        return $this->result;
    }

    public function update_table_columns($tableId, $columns)
    {
        $success = 'Processing';
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $argsBuild = [  ];
        $insertedRows = 0;

        $dbTable = 'dt_table_columns';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);
        error_log('    Request Args' . json_encode($columns));
        error_log('Begin Column Insert');

        if ($queryReturnedResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'success' => $success,
                'deleted_rows' => '0');

            return $this->result;
        }

        foreach ($columns as $index => $column) {
            foreach ($column as $columnAttribute => $arg) {
                switch ($columnAttribute) {
                    case '0':$argTableId = $arg;
                    case '1':$argColumnId = $arg;
                    case '2':$argColumnName = $arg;
                    case '3':$argAttributes = $arg;
                    case '4':$argClasses = $arg;
                }
            }

            $argsBuild = [  ];

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'table_id',
                'value' => $argTableId));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'column_id',
                'value' => $argColumnId));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'column_name',
                'value' => $argColumnName));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'attributes',
                'value' => $argAttributes));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'classes',
                'value' => $argClasses));

            $queryReturnedResult = $this->replaceTable('dt_table_columns', $argsBuild);

            error_log('    Insert Results: ' . $queryReturnedResult);

            if (!$queryReturnedResult) {
                $wpdb->query('ROLLBACK'); // rollback everything
                $success = 'False';

                $this->result = array(
                    'success' => $success,
                    'updated_rows' => '0');

                return $this->result;

            }
            $insertedRows++;
        }

        $wpdb->query('COMMIT'); // commit all queries
        $success = 'True';

        $this->result = array(
            'success' => $success,
            'updated_rows' => $insertedRows);

        return $this->result;
    }

    public function update_table_cells($tableId, $cells)
    {
        $success = 'Processing';
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $argsBuild = [  ];
        $insertedRows = 0;

        $dbTable = 'dt_table_cells';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);
        error_log('    Request Cells ' . json_encode($cells));
        //error_log('Begin Cell Insert');

        if ($queryReturnedResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'success' => $success,
                'inserted_rows' => '0');

            return $this->result;
        }

        foreach ($cells as $index => $cell) {

            foreach ($cell as $cellAttribute => $arg) {

                switch ($cellAttribute) {
                    case '0':$argTableId = $tableId;
                    case '1':$argColumnId = $arg;
                    case '2':$argRowId = $arg;
                    case '3':$argAttributes = $arg;
                    case '4':$argClasses = $arg;
                    case '5':$argContent = $arg;
                }
            }

            $argsBuild = [  ];

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'table_id',
                'value' => $argTableId));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'column_id',
                'value' => $argColumnId));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'row_id',
                'value' => $argRowId));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'attributes',
                'value' => $argAttributes));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'classes',
                'value' => $argClasses));

            array_push($argsBuild, array(
                'type' => 'value',
                'field' => 'content',
                'value' => $argContent));

            $queryReturnedResult = $this->replaceTable('dt_table_cells', $argsBuild);

            error_log('    Insert Results: ' . $queryReturnedResult);

            if (!$queryReturnedResult) {
                $wpdb->query('ROLLBACK'); // rollback everything
                $success = 'False';

                $this->result = array(
                    'success' => $success,
                    'updated_rows' => '0');

                return $this->result;

            }
            $insertedRows++;
        }

        $wpdb->query('COMMIT'); // commit all queries
        $success = 'True';

        $this->result = array(
            'success' => $success,
            'updated_rows' => $insertedRows);

        return $this->result;
    }

    public function get_table($tableId, $dbTableName)
    {

        error_log('    In get_tables...');
//        error_log('');
        global $wpdb;

        $success = 'Processing';
        global $wpdb;

        error_log('DB Table Name for Where - ' . $dbTableName);

        switch ($dbTableName) {
            case 'dt_tables':
                $dtWhereField = "id";
                $returnCollection = false;
                break;
            case 'dt_table_rows':
                $dtWhereField = 'table_id';
                $returnCollection = true;
                break;
            case 'dt_table_columns':
                $dtWhereField = 'table_id';
                $returnCollection = true;
                break;
            case 'dt_table_cells':
                $dtWhereField = 'table_id';
                $returnCollection = true;
                break;
            default:
                $dtWhereField = 'ERROR - ' . $dbTableName . ' is not a valid database table.';
        }

        error_log('DB Table Field for Where - ' . $dtWhereField);
        $argsBuild = [  ];

        array_push($argsBuild, array(
            'type' => 'from',
            'field' => $dbTableName,
            'value' => null));

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => $dtWhereField,
            'value' => $tableId));

        if ($dbTableName == 'dt_table_cells') {
            error_log('...in Order By - row_id');

            array_push($argsBuild, array(
                'type' => 'order_by',
                'field' => 'row_id',
                'value' => null));
        }

        if ($dbTableName == 'dt_table_columns' || $dbTableName == 'dt_table_cells') {
            error_log('...in Order By - column_id');

            array_push($argsBuild, array(
                'type' => 'order_by',
                'field' => 'column_id',
                'value' => null));

        }

        $queryResults = $this->get_table_data($argsBuild, $returnCollection);
        error_log('   Selected Data - ' . json_encode($queryResults));

        switch ($dbTableName) {
            case 'dt_tables':
                $serializedTableAttributes = $queryResults[ 'attributes' ];
                $tableAttributes = maybe_unserialize($serializedTableAttributes);
                $queryResults[ 'attributes' ] = $tableAttributes;

                $tableReturn = $queryResults;
                $this->result = $tableReturn;
                break;
            case 'dt_table_rows':
                $tableRowReturn = [  ];

                foreach ($queryResults as $key => $row) {
                    error_log('    ... Row - ' . json_encode($row));
                    $serializedRowAttributes = $row[ 'attributes' ];
                    $rowAttributes = maybe_unserialize($serializedRowAttributes);

                    error_log('    ...  attributes - ' . json_encode($rowAttributes));
                    $row[ 'attributes' ] = $rowAttributes;

                    array_push($tableRowReturn, $row);
                }

                $this->result = $tableRowReturn;
                break;
            case 'dt_table_columns':
                $tableColumnReturn = [  ];

                foreach ($queryResults as $key => $row) {
                    error_log('    ... Column Row - ' . json_encode($row));

                    $serializedColumnAttributes = $row[ 'attributes' ];
                    $columnAttributes = maybe_unserialize($serializedColumnAttributes);

                    error_log('    ...  attributes - ' . json_encode($columnAttributes));
                    $row[ 'attributes' ] = $columnAttributes;

                    array_push($tableColumnReturn, $row);
                }

                $this->result = $tableColumnReturn;
                break;
            case 'dt_table_cells':
                $tableCellReturn = [  ];

                foreach ($queryResults as $key => $row) {
                    error_log('    ...  Cell Row - ' . json_encode($row));
                    $serializedCellAttributes = $row[ 'attributes' ];
                    $cellAttributes = maybe_unserialize($serializedCellAttributes);

                    error_log('    ...  attributes - ' . json_encode($cellAttributes));
                    $row[ 'attributes' ] = $cellAttributes;

                    array_push($tableCellReturn, $row);
                }

                $this->result = $tableCellReturn;
                break;
            default:
                $dtWhereField = 'ERROR - ' . $dbTableName . ' is not a valid database table.';
        }

        return $this->result;

    }

    public function delete_table_data($tableId)
    {
        $success = 'Processing';
        global $wpdb;

        error_log('    Deleting Table - ' . $tableId);

        $wpdb->query('START TRANSACTION');

        /**
         * Delete table from dt_tables
         *
         */

        $argsBuild = [  ];

        $dbTable = 'dt_tables';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);

        if ($queryReturnedResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'deleted_rows' => '0');

            return $this->result;
        }

        error_log('    Table rows deleted - ' . $queryReturnedResult);
        $deletedTableRows = $queryReturnedResult;

        /**
         * Delete table from dt_table_columns
         *
         */

        $argsBuild = [  ];
        $dbTable = 'dt_table_rows';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);

        if ($queryReturnedResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'deleted_rows' => '0');

            return $this->result;
        }

        error_log('    Table Row rows deleted - ' . $queryReturnedResult);
        $deletedRowRows = $queryReturnedResult;

        /**
         * Delete table from dt_table_columns
         *
         */

        $argsBuild = [  ];
        $dbTable = 'dt_table_columns';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);

        if ($queryReturnedResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'deleted_rows' => '0');

            return $this->result;
        }

        error_log('    Table Column rows deleted - ' . $queryReturnedResult);
        $deletedColumnRows = $queryReturnedResult;

        /**
         * Delete table from dt_table_cells
         *
         */

        $argsBuild = [  ];
        $dbTable = 'dt_table_cells';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);

        if ($queryReturnedResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'deleted_rows' => '0');

            return $this->result;
        }

        error_log('    Table Cell rows deleted - ' . $queryReturnedResult);
        $deletedCellRows = $queryReturnedResult;

        $wpdb->query('COMMIT'); // commit all queries
        $success = 'True';

        $this->result = array(
            'success' => $success,
            'deleted_rows' => $deletedTableRows + $deletedRowRows + $deletedColumnRows + $deletedCellRows);

        return $this->result;
    }

    /**
     * Transform SQL arguments to support the $wpdb->prepare format.
     *
     * Examples:
     *
     * @since 1.0.0
     *
     * @param array     $requestArgs  Inbound arguments from the calling system to match request format.
     * @return array    Transformed arguments.
     */
    public function process_args($requestArgs)
    {
        $sqlArgs = [  ];
        $priorArgType = 'none';

        foreach ($requestArgs as $index => $items) {
            //error_log('...evaluating arg ' . $index);
            foreach ($items as $item => $arg) {
                switch ($item) {
                    case 'type':$argType = $arg;
                    case 'field':$argField = $arg;
                    case 'value':$argValue = $arg;
                }
            }
            error_log('   Item: Type = ' . $argType . ', Field = ' . $argField . ', Value = ' . $argValue . ', Prior Type = ' . $priorArgType);

            if ($argType == 'from' and $priorArgType == 'where') {
                error_log('Error: Processing request - All FROM arguments must come before be listed before WHERE arguments');
                die;
            }

            $sqlArgs += $this->transformArg($argType, $argField, $argValue);
            $priorArgType = $argType;

        }

        error_log('    SQL Args Complete' . json_encode($sqlArgs));
        return $sqlArgs;
    }

    public function transformArg($argType, $argField, $argValue)
    {
        global $wpdb;

        if ($argType == 'from' or $argType == 'update' or $argType == 'delete' or $argType == 'insert') {
            // Update for multi-site
            $transformedTableName = $wpdb->prefix . $argField;
            return array('tablename' => $transformedTableName);
        }

        if ($argType == 'where' or $argType == 'set' or $argType == 'value') {
            return array($argField => $argValue);
        }

        if ($argType == 'order_by') {
            return array('order_by_' . $argField => $argField);
        }
    }

    public function process_query_string($requestArgs)
    {
        global $wpdb;
        //error_log('...Query Request Args ' . json_encode($requestArgs));

        $transactionType = "";
        $fromClause = "FROM ";
        $valueClause = "";
        $deleteClause = "";
        $updateClause = "";
        $insertClause = "";
        $setClause = "SET ";
        $whereClause = "WHERE ";
        $currentSetPosition = 0;
        $currentOrderByPosition = 0;
        $currentValuePosition = 0;
        $currentWherePosition = 0;

        $setTypeCount = $this->count_request_args_by_type($requestArgs, 'set');
        $orderByTypeCount = $this->count_request_args_by_type($requestArgs, 'order_by');
        $valueTypeCount = $this->count_request_args_by_type($requestArgs, 'value');
        $whereTypeCount = $this->count_request_args_by_type($requestArgs, 'where');

        error_log('Order By Count = ' . $orderByTypeCount);
        if ($orderByTypeCount == 0) {
            $orderByClause = "";
        } else {
            $orderByClause = "ORDER BY ";
        }

        foreach ($requestArgs as $index => $items) {
            //error_log('...evaluating arg ' . $index);

            foreach ($items as $item => $arg) {
                switch ($item) {
                    case 'type':$argType = $arg;
                    case 'field':$argField = $arg;
                    case 'value':$argValue = $arg;
                }
            }

            if ($argType == 'from') {
                $transactionType = 'from';
                $fromClause .= "%i";
            }

            if ($argType == 'update') {
                $transactionType = 'update';
                $updateClause .= "%i";
            }

            if ($argType == 'delete') {
                $transactionType = 'delete';
                $deleteClause .= "%i";
            }

            if ($argType == 'insert') {
                $transactionType = 'insert';
                $insertClause .= "%i";
            }

            if ($argType == 'order_by') {
                $orderByClause .= "%i";

                if ($currentOrderByPosition != $orderByTypeCount - 1) {
                    $orderByClause .= ", ";
                }
                $currentOrderByPosition++;

            }

            if ($argType == 'set') {
                if ($transactionType == "") {
                    $transactionType = 'set';
                    $setClause = "";
                }

                $setClause .= $this->specificQuery($transactionType, $argField);

                if (($currentSetPosition != $setTypeCount - 1) and
                    ($this->specificQuery($transactionType, $argField) != null)) {
                    $setClause .= ", ";
                }
                $currentSetPosition++;
            }

            if ($argType == 'value') {
                $transactionType = 'insert';
                //$cells[  ] = array('1', '1', '1', 'header', 'Brand');
                $valueClause .= $this->specificQuery($transactionType, $argField);

                if (($currentValuePosition != $valueTypeCount - 1) and
                    ($this->specificQuery($transactionType, $argField) != null)) {
                    $valueClause .= ", ";
                }
                $currentValuePosition++;
            }

            if ($argType == 'where') {
                error_log('        Process Where Trasaction Type - ' . $transactionType);
                if ($transactionType == "") {
                    $transactionType = 'where';
                    $whereClause = "";
                }

                if ($transactionType == 'from') {
                    $whereClause .= $argField . ' = ' . $this->specificQuery($transactionType, $argField);
                    error_log('...    In Where ' . $whereClause);

                    if (($currentWherePosition != $whereTypeCount - 1) and
                        ($this->specificQuery($transactionType, $argField) != null)) {
                        $whereClause .= " AND ";
                    }
                } else {
                    $whereClause .= $this->specificQuery($transactionType, $argField);
                    error_log('...    In Where ' . $whereClause);

                    if (($currentWherePosition != $whereTypeCount - 1) and
                        ($this->specificQuery($transactionType, $argField) != null)) {
                        $whereClause .= " AND ";
                    }

                }
                $currentWherePosition++;
            }
        }
        //error_log('...Select query string ' . $fromClause . ' ' . $whereClause);
        //error_log('...Update query string ' . $updateClause . ' ' . $whereClause);

        switch ($transactionType) {
            case 'from':
                //error_log('...Select query string ' . $fromClause . ' ' . $whereClause);
                return $fromClause . ' ' . $whereClause . ' ' . $orderByClause;
            case 'update':
                //error_log('...Update query string ' . $updateClause . ' ' . $whereClause);
                return $updateClause . ' ' . $setClause . ' ' . $whereClause;
            case 'delete':
                //error_log('...Detete query string ' . $deleteClause . ' ' . $whereClause);
                return $deleteClause . ' ' . $whereClause;
            case 'insert':
                //error_log('...Pre Array Format String ' . $valueClause);
                return $valueClause;
            case 'set':
                //error_log('...Set Format String ' . $setClause;
                return $setClause;
            case 'where':
                //error_log('...Where Format String ' . $whereClause);
                return $whereClause;
            default:
                return 'Error';
        }
    }

    public function specificQuery($transType, $argField)
    {
        if ($transType = 'value') {
            switch ($argField) {
                case "id":
                    return '%d';
                case "table_id":
                    return '%d';
                case "post_id":
                    return '%d';
                case "column_id":
                    return '%d';
                case "row_id":
                    return '%d';
                default:
                    return '%s';
            }
        }

        switch ($argField) {
            case "tablename":
                return null;
            case "fieldname":
                return null;
            case "id":
                return "id = %d";
            case "table_id":
                return "table_id = %d";
            case "post_id":
                return "table_id = %d";
            case "column_id":
                return "column_id = %d";
            case "row_id":
                return "row_id = %d";
            default:
                return $argField . " = %s";
        }
    }

    public function count_request_args_by_type($args, $argType)
    {
        $counter = 0;
        array_walk_recursive($args, function ($value, $key) use (&$counter, $argType) {
            //error_log('   At arg: Type = ' . $key . ', Value = ' . $value);

            if ($value === $argType && $key === 'type') {
                $counter++;
            }
        }, $counter);

        return $counter;
    }

}
