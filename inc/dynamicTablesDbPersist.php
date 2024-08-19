<?php

/**
 * Database interface for dynamic tables
 */

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

    /**
     * Query results and status of the public method
     *
     * @since 1.0.0
     *
     * @var array
     */
    public array $result = array();

    /**
     * Query result from a specific database SELECT query
     *
     * @since 1.0.0
     *
     * @var array
     */
    protected array $queryResult = array();

    /**
     * Query result from a specific database SELECT query
     *
     * @since 1.0.0
     *
     * @var string
     */
    public string $deleteResult = '';

    /**
     * Query result from a specific database SELECT query
     *
     * @since 1.0.0
     *
     * @var string
     */
    protected string $replacementResult = '';

    public function __construct()
    {
        // Silence is golden
    }

    /**
     *  Performs a SQL SELECT via the Wordpress wpdb class and connection
     *
     * @since 1.0.0
     *
     * @param array $requestArgs        Array of SQL arguments for inclusion in SQL Statement
     * @param bool  $returnCollection   Return multiple result rows (True) vs. a single row (false)
     * @return array SqueryResult.      wpdb return array indexed from 0, or null on failure
     */
    protected function get_table_data($requestArgs, $returnCollection = false)
    {
        global $wpdb;

        $args = $this->process_args($requestArgs);
        if (!$args) {
            return false;
        }

        $query = "SELECT * ";
        $query_string = $this->process_query_string($requestArgs);
        if (!$query_string) {
            return false;
        }
        $query .= $query_string;
        $prepare = $wpdb->prepare($query, $args);

        if ($returnCollection) {
            try {
                $dbReturn = $wpdb->get_results($prepare, ARRAY_A);
                if ($dbReturn) {
                    $this->queryResult = $dbReturn;
                } else {
                    error_log('Table data not found');
                    $this->queryResult = [  ];
                }
            } catch (Exception $e) {
                error_log('Error fetching table data: ' . $e);
                $this->queryResult = [  ];
            }
        } else {
            try {
                $dbReturn = $wpdb->get_row($prepare, ARRAY_A);
                if ($dbReturn) {
                    $this->queryResult = $dbReturn;
                } else {
                    error_log('Table data not found');
                    $this->queryResult = [  ];
                }
            } catch (Exception $e) {
                error_log('Error fetching table data: ' . $e);
                $this->queryResult = [  ];
            }
        }

        return $this->queryResult;
    }

    /**
     *  Performs a SQL DELETE via the Wordpress wpdb class and connection
     *
     * @since 1.0.0
     *
     * @param string $dbTableName       Non-prefixed name of the table from which to delete rows
     * @param array $requestArgs        Array of SQL arguments for inclusion in SQL Statement
     * @return int:false SdeleteResult  wpdb rows deleted or FALSE on error
     */
    protected function delete_table($dbTableName, $requestArgs)
    {
        global $wpdb;

        $dbTable = $wpdb->prefix . $dbTableName;
        $where = $this->process_args($requestArgs);
        if (!$where) {
            return false;
        }
        $query_string = $this->process_query_string($requestArgs);
        if (!$query_string) {
            return false;
        }
        $format = explode(',', $query_string);

        $this->deleteResult = $wpdb->delete($dbTable, $where, $format);
        return $this->deleteResult;
    }

    /**
     *  Performs a SQL Insert/Update (update if the inserted row matches an existing primary key) via
     *  the Wordpress wpdb class and connection
     *
     * @since 1.0.0
     *
     * @param string $tableName         Non-prefixed name of the table from which to update rows
     * @param array $requestArgs        Array of SQL arguments for inclusion in SQL Statement
     * @return int|false SreplacementResult.    wpdb number of records inserted/updated or FALSE on error
     */
    protected function replaceTable($tableName, $requestArgs)
    {
        global $wpdb;

        $db_table = $wpdb->prefix . $tableName;
        $data = $this->process_args($requestArgs);
        if (!$data) {
            return false;
        }

        $query_string = $this->process_query_string($requestArgs);
        if (!$query_string) {
            return false;
        }
        $format = explode(',', $query_string);

        $this->replacementResult = $wpdb->replace($db_table, $data, $format);

        return $this->replacementResult;
    }

    /**
     *  Performs a SQL Insert via the Wordpress wpdb class and connection
     *
     * @since 1.0.0
     *
     * @param string $blockTableRef     block_table_ref value that links the table to a specific post block
     * @param string $status            Status value of the table being created
     * @param int $postId               Post id value to post to which the table is attached
     * @param string $tableName         Descriptive name of the table being created
     * @param string $attributes        Serialized array of table attributes
     * @param string $classes           HTML classes associated with the table
     * @return array Sresult            Success status and new table id
     */
    public function create_table_data($blockTableRef, $status, $postId, $tableName, $attributes, $classes)
    {
        $success = false;
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

        if ($inserted) {
            $wpdb->query('COMMIT'); // commit all queries
            $success = true;
        } else {
            $wpdb->query('ROLLBACK'); // rollback everything
        }

        $this->result = array(
            'success' => $success,
            'table_id' => $tableId);

        return $this->result;
    }

    /**
     *  Update the dynamic table database header table dt_tables based on criteria received
     *
     * @since 1.0.0
     *
     * @param int $tableId              ID value of the table being updated
     * @param string $blockTableRef     block_table_ref value that links the table to a specific post block
     * @param string $status            Status value of the table being created
     * @param int $postId               Post id value to post to which the table is attached
     * @param string $tableName         Descriptive name of the table being updated
     * @param string $attributes        Serialized array table attributes
     * @param string $classes           HTML classes associated with the table
     * @return array Sresult            Success status and updated header values
     */
    public function update_table($tableId, $blockTableRef, $status, $postId, $tableName, $attributes, $classes)
    {
        $success = false;
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

        $queryResults = $this->get_table_data($argsBuild);
        if (!$queryResults) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $this->result = array(
                'success' => $success,
                'updated_rows' => '0');

            return $this->result;
        }

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
        if (!($set && $where)) {
            $this->result = array(
                'success' => $success,
                'updated_rows' => '0');
        }

        $query_string = $this->process_query_string($argsSet);
        if (!$query_string) {
            $this->result = array(
                'success' => $success,
                'updated_rows' => '0');
        }
        $setFormat = array_map('trim', explode(',', $query_string));
        $query_string = $this->process_query_string($argsWhere);
        if (!$query_string) {
            $this->result = array(
                'success' => $success,
                'updated_rows' => '0');
        }
        $whereFormat = array_map('trim', explode(',', $query_string));

        $updateResult = $wpdb->update($dbTable,
            $set,
            $where,
            $setFormat,
            $whereFormat);

        if ($updateResult === false) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $this->result = array(
                'success' => $success,
                'updated_rows' => '0');
            return $this->result;
        }

        $updatedRows = $updatedRows + $updateResult;

        $wpdb->query('COMMIT'); // commit all queries
        $success = true;

        $this->result = array(
            'success' => $success,
            'updated_rows' => $updatedRows);

        return $this->result;
    }

    /**
     *  Update the dynamic table database row table dt_table_rows based on criteria received
     *
     * @since 1.0.0
     *
     * @param int $tableId              ID value of the table being updated
     * @param array $rows               Revised dynamic table row data for update
     * @return array Sresult            Success status and updated row values
     */
    public function update_table_rows($tableId, $rows)
    {
        $success = false;
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $argsBuild = [  ];
        $insertedRows = 0;

        $dbTable = 'dt_table_rows';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

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

            if (!$queryReturnedResult) {
                $wpdb->query('ROLLBACK'); // rollback everything
                $this->result = array(
                    'success' => $success,
                    'updated_rows' => '0');
                return $this->result;

            }
            $insertedRows++;
        }

        error_log('End Row Insert with ' . $insertedRows . 'rows created');

        $wpdb->query('COMMIT'); // commit all queries
        $success = 'True';

        $this->result = array(
            'success' => $success,
            'updated_rows' => $insertedRows);

        return $this->result;
    }

    /**
     *  Update the dynamic table database column table dt_table_columnss based on criteria received
     *
     * @since 1.0.0
     *
     * @param int $tableId              ID value of the table being updated
     * @param array $columns               Revised dynamic table column data for update
     * @return array Sresult            Success status and updated column values
     */
    public function update_table_columns($tableId, $columns)
    {
        $success = false;
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $argsBuild = [  ];
        $insertedRows = 0;

        $dbTable = 'dt_table_columns';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

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

            if (!$queryReturnedResult) {
                $wpdb->query('ROLLBACK'); // rollback everything
                $this->result = array(
                    'success' => $success,
                    'updated_rows' => '0');
                return $this->result;

            }
            $insertedRows++;
        }

        $wpdb->query('COMMIT'); // commit all queries
        $success = true;

        $this->result = array(
            'success' => $success,
            'updated_rows' => $insertedRows);

        return $this->result;
    }

    /**
     *  Update the dynamic table database cell table dt_table_cells based on criteria received
     *
     * @since 1.0.0
     *
     * @param int $tableId              ID value of the table being updated
     * @param array $cells               Revised dynamic table cell data for update
     * @return array Sresult            Success status and updated cell values
     */
    public function update_table_cells($tableId, $cells)
    {
        $success = false;
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $argsBuild = [  ];
        $insertedRows = 0;

        $dbTable = 'dt_table_cells';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

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

            if (!$queryReturnedResult) {
                $wpdb->query('ROLLBACK'); // rollback everything
                $this->result = array(
                    'success' => $success,
                    'updated_rows' => '0');
                return $this->result;
            }
            $insertedRows++;
        }

        $wpdb->query('COMMIT'); // commit all queries
        $success = true;

        $this->result = array(
            'success' => $success,
            'updated_rows' => $insertedRows);

        return $this->result;
    }

    /**
     *  Retrieve the dynamic table data for a specific one dynamic table from one database table
     *
     * @since 1.0.0
     *
     * @param int $tableId              ID value of the table being updated
     * @param string $dbTableName       database table name
     * @return array Sresult            Success status and data retrieved
     */
    public function get_table($tableId, $dbTableName)
    {
        global $wpdb;

        $success = false;
        global $wpdb;

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
                $this->result = array(
                    'success' => $success,
                    'result' => 'ERROR - ' . $dbTableName . ' is not a valid database table.');
                return $this->result;
        }

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
            array_push($argsBuild, array(
                'type' => 'order_by',
                'field' => 'row_id',
                'value' => null));
        }

        if ($dbTableName == 'dt_table_columns' || $dbTableName == 'dt_table_cells') {
            array_push($argsBuild, array(
                'type' => 'order_by',
                'field' => 'column_id',
                'value' => null));

        }

        $queryResults = $this->get_table_data($argsBuild, $returnCollection);

        if (!$queryResults) {
            $this->result = array(
                'success' => $success,
                'result' => 'DB Query Error');
            return $this->result;
        }

        switch ($dbTableName) {
            case 'dt_tables':
                $serializedTableAttributes = $queryResults[ 'attributes' ];
                $tableAttributes = maybe_unserialize($serializedTableAttributes);
                $queryResults[ 'attributes' ] = $tableAttributes;
                $tableReturn = $queryResults;
                break;
            case 'dt_table_rows':
                $tableRowReturn = [  ];

                foreach ($queryResults as $key => $row) {
                    $serializedRowAttributes = $row[ 'attributes' ];
                    $rowAttributes = maybe_unserialize($serializedRowAttributes);
                    $row[ 'attributes' ] = $rowAttributes;
                    array_push($tableRowReturn, $row);
                }

                $tableReturn = $tableRowReturn;
                break;
            case 'dt_table_columns':
                $tableColumnReturn = [  ];

                foreach ($queryResults as $key => $column) {
                    $serializedColumnAttributes = $column[ 'attributes' ];
                    $columnAttributes = maybe_unserialize($serializedColumnAttributes);
                    $column[ 'attributes' ] = $columnAttributes;
                    array_push($tableColumnReturn, $column);
                }

                $tableReturn = $tableColumnReturn;
                break;
            case 'dt_table_cells':
                $tableCellReturn = [  ];

                foreach ($queryResults as $key => $row) {
                    $serializedCellAttributes = $row[ 'attributes' ];
                    $cellAttributes = maybe_unserialize($serializedCellAttributes);
                    $row[ 'attributes' ] = $cellAttributes;
                    array_push($tableCellReturn, $row);
                }

                $tableReturn = $tableCellReturn;
                break;
            default:
                $this->result = array(
                    'success' => $success,
                    'result' => 'ERROR - ' . $dbTableName . ' is not a valid database table.');
                return $this->result;
        }

        $success = true;

        $this->result = array(
            'success' => $success,
            'result' => $tableReturn);

        return $this->result;

    }

    /**
     *  Delete the dynamic table data for a specific one dynamic table from all database table
     *
     * @since 1.0.0
     *
     * @param int $tableId              ID value of the table being updated
     * @param string $dbTableName       database table name
     * @return array Sresult            Success status and data retrieved
     */
    public function delete_table_data($tableId)
    {
        $success = 'Processing';
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        /**
         * Delete table from dt_tables
         */

        $argsBuild = [  ];

        $dbTable = 'dt_tables';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);
        if (!$queryReturnedResult) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'deleted_rows' => '0');

            return $this->result;
        }
        $deletedTableRows = $queryReturnedResult;

        /**
         * Delete table from dt_table_columns
         */

        $argsBuild = [  ];
        $dbTable = 'dt_table_rows';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);
        if (!$queryReturnedResult) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'deleted_rows' => '0');

            return $this->result;
        }

        $deletedRowRows = $queryReturnedResult;

        /**
         * Delete table from dt_table_columns
         */

        $argsBuild = [  ];
        $dbTable = 'dt_table_columns';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);
        if (!$queryReturnedResult) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'deleted_rows' => '0');

            return $this->result;
        }

        $deletedColumnRows = $queryReturnedResult;

        /**
         * Delete table from dt_table_cells
         */

        $argsBuild = [  ];
        $dbTable = 'dt_table_cells';

        array_push($argsBuild, array(
            'type' => 'where',
            'field' => 'table_id',
            'value' => $tableId));

        $queryReturnedResult = $this->delete_table($dbTable, $argsBuild);
        if (!$queryReturnedResult) {
            $wpdb->query('ROLLBACK'); // rollback everything
            $success = 'False';

            $this->result = array(
                'deleted_rows' => '0');

            return $this->result;
        }

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
     * @since 1.0.0
     *
     * @param array     $requestArgs  Inbound arguments from the calling system to match request format.
     * @return array    Transformed arguments.
     */
    protected function process_args($requestArgs)
    {
        $sqlArgs = [  ];
        $priorArgType = 'none';

        foreach ($requestArgs as $index => $items) {
            foreach ($items as $item => $arg) {
                switch ($item) {
                    case 'type':$argType = $arg;
                    case 'field':$argField = $arg;
                    case 'value':$argValue = $arg;
                }
            }

            if ($argType == 'from' and $priorArgType == 'where') {
                error_log('Error: Processing request - All FROM arguments must come before be listed before WHERE arguments');
                return false;
            }
            $sqlArgs += $this->transformArg($argType, $argField, $argValue);
            $priorArgType = $argType;

        }
        return $sqlArgs;
    }

    /**
     * Transform SQL one argument to support the $wpdb->prepare format.
     *
     * @since 1.0.0
     *
     * @param array     $argType   SQL Statement argument
     * @param array     $argField  Table field name associated with the argument.
     * @param array     $argValue  Value associated with the table field for WHERE and SET arguments
     * @return array    Transformed argument.
     */
    protected function transformArg($argType, $argField, $argValue)
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

    /**
     * Build SQL query string.
     *
     * @since 1.0.0
     *
     * @param array     $requestArgs      Inbound arguments from the calling system to match request format.
     * @return string    Valid SQL query string.
     */
    protected function process_query_string($requestArgs)
    {
        global $wpdb;

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

        if ($orderByTypeCount == 0) {
            $orderByClause = "";
        } else {
            $orderByClause = "ORDER BY ";
        }

        foreach ($requestArgs as $index => $items) {
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
                $valueClause .= $this->specificQuery($transactionType, $argField);

                if (($currentValuePosition != $valueTypeCount - 1) and
                    ($this->specificQuery($transactionType, $argField) != null)) {
                    $valueClause .= ", ";
                }
                $currentValuePosition++;
            }

            if ($argType == 'where') {
                if ($transactionType == "") {
                    $transactionType = 'where';
                    $whereClause = "";
                }

                if ($transactionType == 'from') {
                    $whereClause .= $argField . ' = ' . $this->specificQuery($transactionType, $argField);

                    if (($currentWherePosition != $whereTypeCount - 1) and
                        ($this->specificQuery($transactionType, $argField) != null)) {
                        $whereClause .= " AND ";
                    }
                } else {
                    $whereClause .= $this->specificQuery($transactionType, $argField);

                    if (($currentWherePosition != $whereTypeCount - 1) and
                        ($this->specificQuery($transactionType, $argField) != null)) {
                        $whereClause .= " AND ";
                    }
                }
                $currentWherePosition++;
            }
        }

        switch ($transactionType) {
            case 'from':
                return $fromClause . ' ' . $whereClause . ' ' . $orderByClause;
            case 'update':
                return $updateClause . ' ' . $setClause . ' ' . $whereClause;
            case 'delete':
                return $deleteClause . ' ' . $whereClause;
            case 'insert':
                return $valueClause;
            case 'set':
                return $setClause;
            case 'where':
                return $whereClause;
            default:
                return false;
        }
    }

    /**
     * Lookup Parameter data type for a specific query field.
     *
     * @since 1.0.0
     *
     * @param array     $transType      SQL transaction type and position of the statement in query
     *                                  or specific field names of INSERT transactions
     * @param array     $argField       Field name of the parameter for lookup
     * @return string    Valid SQL query string.
     */
    protected function specificQuery($transType, $argField)
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

    /**
     * Count the number of arguments for a specific portion of the query statements to support
     * ability to properly terminate the statement.
     *
     * @since 1.0.0
     *
     * @param array     $args         Array of arguments
     * @param array     $argType      Argument type being counted
     * @return int      NUmber of arguments associated with the statement secment.
     */
    protected function count_request_args_by_type($args, $argType)
    {
        $counter = 0;
        array_walk_recursive($args, function ($value, $key) use (&$counter, $argType) {

            if ($value === $argType && $key === 'type') {
                $counter++;
            }
        }, $counter);
        return $counter;
    }
}
