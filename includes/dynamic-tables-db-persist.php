<?php

/**
* Database interface for dynamic tables
*
* @since 1.00.00
*/
class PersistTableData {

	/**
	 * Array of structured arguments from which to build and format SQL
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
	 * @since x.xx.xx
	 * @var array
	 */
	private array $request_args = array();

	/**
	 *
	 * @since 1.00.00
	 *
	 * @var array
	 */
	public array $result = array();

	/**
	 * Query result from a specific database SELECT query
	 *
	 * @since 1.00.00
	 *
	 * @var array
	 */
	private array $query_result = array();

	/**
	 * Query result from a specific database SELECT query
	 *
	 * @since 1.00.00
	 *
	 * @var string
	 */
	private string $delete_result = '';

	/**
	 * Query result from a specific database SELECT query
	 *
	 * @since 1.00.00
	 *
	 * @var string
	 */
	private string $replacement_result = '';

	/**
	 * Empty consstructor
	 *
	 * @since 1.00.00
	 *
	 * @return void
	 */
	public function __construct() {
		// Silence is golden
	}

	/**
	 *  Performs a SQL SELECT via the WordPress wpdb class and connection
	 *
	 * @since 1.00.00
	 *
	 * @param bool  $return_collection   Return multiple result rows (True) vs. a single row (false)
	 * @return array Squery_result.      wpdb return array indexed from 0, or null on failure
	 */
	protected function get_table_data( $return_collection = false ) {
		global $wpdb;

		$args = $this->process_args( $this->request_args );
		if ( ! $args ) {
			return false;
		}

		$query        = 'SELECT * ';
		$query_string = $this->process_query_string( $this->request_args );
		if ( ! $query_string ) {
			return false;
		}
		$query  .= $query_string;
		$prepare = $wpdb->prepare( $query, $args );

		if ( $return_collection ) {
			try {
				$db_return = $wpdb->get_results( $prepare, ARRAY_A );
				if ( $db_return ) {
					$this->query_result = $db_return;
				} else {
					$this->query_result = array();
				}
			} catch ( Exception $e ) {
				$this->query_result = array();
			}
		} else {
			try {
				$db_return = $wpdb->get_row( $prepare, ARRAY_A );
				if ( $db_return ) {
					$this->query_result = $db_return;
				} else {
					$this->query_result = array();
				}
			} catch ( Exception $e ) {
				$this->query_result = array();
			}
		}

		return $this->query_result;
	}

	/**
	 *  Performs a SQL DELETE via the WordPress wpdb class and connection
	 *
	 * @since 1.00.00
	 *
	 * @param string $db_table_name       Non-prefixed name of the table from which to delete rows
	 * @return int:false Sdelete_result  wpdb rows deleted or FALSE on error
	 */
	protected function delete_table( $db_table_name ) {
		global $wpdb;

		$db_table = $wpdb->prefix . $db_table_name;
		$where   = $this->process_args( $this->request_args );
		if ( ! $where ) {
			return false;
		}
		$query_string = $this->process_query_string( $this->request_args );
		if ( ! $query_string ) {
			return false;
		}
		$format = explode( ',', $query_string );

		$this->delete_result = $wpdb->delete( $db_table, $where, $format );
		return $this->delete_result;
	}

	/**
	 * Update table for changes and insert new rows as needed
	 *
	 * Performs a SQL Insert/Update (update if the inserted row matches an existing primary key) via
	 * the WordPress wpdb class and connection
	 *
	 * @since 1.00.00
	 *
	 * @param string $table_name         Non-prefixed name of the table from which to update rows
	 * @return int|false Sreplacement_result.    wpdb number of records inserted/updated or FALSE on error
	 */
	protected function replace_table( $table_name ) {
		global $wpdb;

		$db_table = $wpdb->prefix . $table_name;
		$data     = $this->process_args( $this->request_args );
		if ( ! $data ) {
			return false;
		}

		$query_string = $this->process_query_string( $this->request_args );
		if ( ! $query_string ) {
			return false;
		}
		$format = explode( ',', $query_string );

		// Perform Replace/Insert
		$this->replacement_result = $wpdb->replace( $db_table, $data, $format );

		return $this->replacement_result;
	}

	/**
	 *  Performs a SQL Insert via the WordPress wpdb class and connection
	 *
	 * @since 1.00.00
	 *
	 * @param string $block_table_ref     block_table_ref value that links the table to a specific post block
	 * @param string $status            Status value of the table being created
	 * @param int    $post_id               Post id value to post to which the table is attached
	 * @param string $table_name         Descriptive name of the table being created
	 * @param string $attributes        Serialized array of table attributes
	 * @param string $classes           HTML classes associated with the table
	 * @return array Sresult            Success status and new table id
	 */
	public function create_table_data( $block_table_ref, $status, $post_id, $table_name, $attributes, $classes ) {
		$success = false;
		global $wpdb;

		$wpdb->query( 'START TRANSACTION' );

		$db_table = $wpdb->prefix . 'dt_tables';

		$data = array(
			'block_table_ref' => $block_table_ref,
			'post_id'         => $post_id,
			'status'          => $status,
			'table_name'      => $table_name,
			'attributes'      => $attributes,
			'classes'         => $classes,
		);

		$format = array( '%s', '%d', '%s', '%s' );

		$inserted = $wpdb->insert( $db_table, $data, $format );
		$table_id  = $wpdb->insert_id;

		if ( $inserted ) {
			$wpdb->query( 'COMMIT' ); // commit all queries
			$success = true;
		} else {
			$wpdb->query( 'ROLLBACK' ); // rollback everything.
		}

		$this->result = array(
			'success'  => $success,
			'table_id' => $table_id,
		);

		return $this->result;
	}

	/**
	 *  Update the dynamic table database header table dt_tables based on criteria received
	 *
	 * @since 1.00.00
	 *
	 * @param int    $table_id              ID value of the table being updated.
	 * @param string $block_table_ref     block_table_ref value that links the table to a specific post block.
	 * @param string $status            Status value of the table being created.
	 * @param int    $post_id               Post id value to post to which the table is attached.
	 * @param string $table_name         Descriptive name of the table being updated.
	 * @param string $attributes        Serialized array table attributes
	 * @param string $classes           HTML classes associated with the table
	 * @return array Sresult            Success status and updated header values
	 */
	public function update_table( $table_id, $block_table_ref, $status, $post_id, $table_name, $attributes, $classes ) {
		$success     = false;
		$updated_rows = 0;
		global $wpdb;

		$wpdb->query( 'START TRANSACTION' );

		$this->request_args = array();

		/**
		 * Query the dt_tables table to get the current table values
		 */
		array_push(
			$this->request_args,
			array(
				'type'  => 'from',
				'field' => 'dt_tables',
				'value' => null,
			)
		);

		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'id',
				'value' => $table_id,
			)
		);

		$query_results = $this->get_table_data( );
		if ( ! $query_results ) {
			$wpdb->query( 'ROLLBACK' ); // rollback everything
			$this->result = array(
				'success'      => $success,
				'updated_rows' => '0',
			);

			return $this->result;
		}

		/**
		 * Replace any null values from the function call with current
		 * table values
		 */
		if ( $block_table_ref === null ) {
			$block_table_ref = $query_results[0]->block_table_ref;
		}

		if ( $status === null ) {
			$status = $query_results[0]->status;
		}

		if ( $post_id === null ) {
			$post_id = $query_results[0]->post_id;
		}

		if ( $table_name === null ) {
			$table_name = sanitize_text_field( $query_results[0]->table_name );
		}

		if ( $attributes === null ) {
			$attributes = $query_results[0]->table_name;
		}

		if ( $classes === null ) {
			$classes = $query_results[0]->classes;
		}

		/**
		 * Create arrays with required args for the update and
		 * format sql set clause
		 */
		$this->request_args = array();

		array_push(
			$this->request_args,
			array(
				'type'  => 'set',
				'field' => 'block_table_ref',
				'value' => $block_table_ref,
			)
		);

		array_push(
			$this->request_args,
			array(
				'type'  => 'set',
				'field' => 'status',
				'value' => $status,
			)
		);

		array_push(
			$this->request_args,
			array(
				'type'  => 'set',
				'field' => 'post_id',
				'value' => $post_id,
			)
		);

		array_push(
			$this->request_args,
			array(
				'type'  => 'set',
				'field' => 'table_name',
				'value' => $table_name,
			)
		);

		array_push(
			$this->request_args,
			array(
				'type'  => 'set',
				'field' => 'attributes',
				'value' => $attributes,
			)
		);

		array_push(
			$this->request_args,
			array(
				'type'  => 'set',
				'field' => 'classes',
				'value' => $classes,
			)
		);

		$set = $this->process_args( );

		$query_string = $this->process_query_string( );
		if ( ! $query_string ) {
			$this->result = array(
				'success'      => $success,
				'updated_rows' => '0',
			);
		}
		$set_format    = array_map( 'trim', explode( ',', $query_string ) );

		/**
		 * Create arrays with required args for the update and
		 * format sql where clause
		 */
		$this->request_args = array();

		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'id',
				'value' => $table_id,
			)
		);
		$where = $this->process_args( );

		$query_string = $this->process_query_string( );
		if ( ! $query_string ) {
			$this->result = array(
				'success'      => $success,
				'updated_rows' => '0',
			);
		}
		$where_format = array_map( 'trim', explode( ',', $query_string ) );

		/**
		 * Run update query for dt_tables
		 */
		$db_table = $wpdb->prefix . 'dt_tables';

		if ( ! ( $set && $where ) ) {
			$this->result = array(
				'success'      => $success,
				'updated_rows' => '0',
			);
		}

		$update_result = $wpdb->update(
			$db_table,
			$set,
			$where,
			$set_format,
			$where_format
		);

		if ( $update_result === false ) {
			$wpdb->query( 'ROLLBACK' ); // rollback everything
			$this->result = array(
				'success'      => $success,
				'updated_rows' => '0',
			);
			return $this->result;
		}

		$updated_rows = $updated_rows + $update_result;

		$wpdb->query( 'COMMIT' ); // commit all queries
		$success = true;

		$this->result = array(
			'success'      => $success,
			'updated_rows' => $updated_rows,
		);

		return $this->result;
	}

	/**
	 *  Update the dynamic table database row table dt_table_rows based on criteria received
	 *
	 * @since 1.00.00
	 *
	 * @param int   $table_id              ID value of the table being updated
	 * @param array $rows               Revised dynamic table row data for update
	 * @return array Sresult            Success status and updated row values
	 */
	public function update_table_rows( $table_id, $rows ) {

		$success = false;
		global $wpdb;

		$wpdb->query( 'START TRANSACTION' );

		$this->request_args    = array();
		$inserted_rows = 0;

		$db_table = 'dt_table_rows';

		// Delete table records that are targeted for replacement
		$args_delete_build = array();
		array_push(
			$args_delete_build,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);
		$query_returned_result = $this->delete_table( $db_table, $args_delete_build );

		// Insert new table rows
		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);

		foreach ( $rows as $index => $row ) {
			foreach ( $row as $row_attribute => $arg ) {
				switch ( $row_attribute ) {
					case '0':
						$arg_table_id = $arg;
					case '1':
						$arg_row_id = $arg;
					case '2':
						$arg_attributes = $arg;
					case '3':
						$arg_classes = $arg;
				}
			}

			$this->request_args = array();

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'table_id',
					'value' => $arg_table_id,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'row_id',
					'value' => $arg_row_id,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'attributes',
					'value' => $arg_attributes,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'classes',
					'value' => $arg_classes,
				)
			);

			$query_returned_result = $this->replace_table( 'dt_table_rows', $table_id );

			if ( ! $query_returned_result ) {
				$wpdb->query( 'ROLLBACK' ); // rollback everything
				$this->result = array(
					'success'      => $success,
					'updated_rows' => '0',
				);
				return $this->result;

			}
			++$inserted_rows;
		}

		$wpdb->query( 'COMMIT' ); // commit all queries
		$success = 'True';

		$this->result = array(
			'success'      => $success,
			'updated_rows' => $inserted_rows,
		);

		return $this->result;
	}

	/**
	 *  Update the dynamic table database column table dt_table_columnss based on criteria received
	 *
	 * @since 1.00.00
	 *
	 * @param int   $table_id              ID value of the table being updated
	 * @param array $columns               Revised dynamic table column data for update
	 * @return array Sresult            Success status and updated column values
	 */
	public function update_table_columns( $table_id, $columns ) {
		$success = false;
		global $wpdb;

		$wpdb->query( 'START TRANSACTION' );

		$this->request_args    = array();
		$inserted_rows = 0;

		$db_table = 'dt_table_columns';

		// Delete table records that are targeted for replacement
		$args_delete_build = array();
		array_push(
			$args_delete_build,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);
		$query_returned_result = $this->delete_table( $db_table, $args_delete_build );

		// Insert new table rows
		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);

		foreach ( $columns as $index => $column ) {
			foreach ( $column as $column_attribute => $arg ) {
				switch ( $column_attribute ) {
					case '0':
						$arg_table_id = $arg;
						break;
					case '1':
						$arg_column_id = $arg;
						break;
					case '2':
						$arg_column_name = $arg;
						break;
					case '3':
						$arg_attributes = $arg;
						break;
					case '4':
						$arg_classes = $arg;
				}
			}

			$this->request_args = array();

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'table_id',
					'value' => $arg_table_id,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'column_id',
					'value' => $arg_column_id,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'column_name',
					'value' => $arg_column_name,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'attributes',
					'value' => $arg_attributes,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'classes',
					'value' => $arg_classes,
				)
			);

			$query_returned_result = $this->replace_table( 'dt_table_columns', $table_id );

			if ( ! $query_returned_result ) {
				$wpdb->query( 'ROLLBACK' ); // rollback everything
				$this->result = array(
					'success'      => $success,
					'updated_rows' => '0',
				);
				return $this->result;

			}
			++$inserted_rows;
		}

		$wpdb->query( 'COMMIT' ); // commit all queries
		$success = true;

		$this->result = array(
			'success'      => $success,
			'updated_rows' => $inserted_rows,
		);

		return $this->result;
	}

	/**
	 *  Update the dynamic table database cell table dt_table_cells based on criteria received
	 *
	 * @since 1.00.00
	 *
	 * @param int   $table_id              ID value of the table being updated
	 * @param array $cells               Revised dynamic table cell data for update
	 * @return array Sresult            Success status and updated cell values
	 */
	public function update_table_cells( $table_id, $cells ) {
		$success = false;
		global $wpdb;

		$wpdb->query( 'START TRANSACTION' );

		$this->request_args    = array();
		$inserted_rows = 0;

		$db_table = 'dt_table_cells';


		// Delete table records that are targeted for replacement
		$args_delete_build = array();
		array_push(
			$args_delete_build,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);
		$query_returned_result = $this->delete_table( $db_table, $args_delete_build );

		// Insert new table rows
		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);

		foreach ( $cells as $index => $cell ) {

			foreach ( $cell as $cell_attribute => $arg ) {

				switch ( $cell_attribute ) {
					case '0':
						$arg_table_id = $table_id;
						break;
					case '1':
						$arg_column_id = $arg;
						break;
					case '2':
						$arg_row_id = $arg;
						break;
					case '3':
						$arg_attributes = $arg;
						break;
					case '4':
						$arg_classes = $arg;
						break;
					case '5':
						$arg_content = $arg;
				}
			}

			$this->request_args = array();

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'table_id',
					'value' => $arg_table_id,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'column_id',
					'value' => $arg_column_id,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'row_id',
					'value' => $arg_row_id,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'attributes',
					'value' => $arg_attributes,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'classes',
					'value' => $arg_classes,
				)
			);

			array_push(
				$this->request_args,
				array(
					'type'  => 'value',
					'field' => 'content',
					'value' => $arg_content,
				)
			);

			$query_returned_result = $this->replace_table( 'dt_table_cells', $table_id );

			if ( ! $query_returned_result ) {
				$wpdb->query( 'ROLLBACK' ); // rollback everything
				$this->result = array(
					'success'      => $success,
					'updated_rows' => '0',
				);
				return $this->result;
			}
			++$inserted_rows;
		}

		$wpdb->query( 'COMMIT' ); // commit all queries
		$success = true;

		$this->result = array(
			'success'      => $success,
			'updated_rows' => $inserted_rows,
		);

		return $this->result;
	}

	/**
	 *  Retrieve the dynamic table data for a specific one dynamic table from one database table
	 *
	 * @since 1.00.00
	 *
	 * @param int    $table_id              ID value of the table being updated
	 * @param string $db_table_name       database table name
	 * @return array Sresult            Success status and data retrieved
	 */
	public function get_table( $table_id, $db_table_name ) {
		global $wpdb;

		$success = false;
		global $wpdb;

		switch ( $db_table_name ) {
			case 'dt_tables':
				$dt_where_field     = 'id';
				$return_collection = false;
				break;
			case 'dt_table_rows':
				$dt_where_field     = 'table_id';
				$return_collection = true;
				break;
			case 'dt_table_columns':
				$dt_where_field     = 'table_id';
				$return_collection = true;
				break;
			case 'dt_table_cells':
				$dt_where_field     = 'table_id';
				$return_collection = true;
				break;
			default:
				$this->result = array(
					'success' => $success,
					'result'  => 'ERROR - ' . $db_table_name . ' is not a valid database table.',
				);
				return $this->result;
		}

		$this->request_args = array();

		array_push(
			$this->request_args,
			array(
				'type'  => 'from',
				'field' => $db_table_name,
				'value' => null,
			)
		);

		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => $dt_where_field,
				'value' => $table_id,
			)
		);

		if ( $db_table_name === 'dt_table_cells' ) {
			array_push(
				$this->request_args,
				array(
					'type'  => 'order_by',
					'field' => 'row_id',
					'value' => null,
				)
			);
		}

		if ( $db_table_name === 'dt_table_columns' || $db_table_name === 'dt_table_cells' ) {
			array_push(
				$this->request_args,
				array(
					'type'  => 'order_by',
					'field' => 'column_id',
					'value' => null,
				)
			);

		}

		$query_results = $this->get_table_data( $return_collection );

		if ( ! $query_results ) {
			$this->result = array(
				'success' => $success,
				'result'  => 'DB Query Error',
			);
			return $this->result;
		}

		switch ( $db_table_name ) {
			case 'dt_tables':
				$serialized_table_attributes    = $query_results['attributes'];
				$table_attributes               = maybe_unserialize( $serialized_table_attributes );
				$query_results['attributes']    = $table_attributes;
				$table_return                   = $query_results;
				break;
			case 'dt_table_rows':
				$table_row_return = array();

				foreach ( $query_results as $key => $row ) {
					$serialized_row_attributes = $row['attributes'];
					$row_attributes           = maybe_unserialize( $serialized_row_attributes );
					$row['attributes']       = $row_attributes;
					array_push( $table_row_return, $row );
				}

				$table_return = $table_row_return;
				break;
			case 'dt_table_columns':
				$table_column_return = array();

				foreach ( $query_results as $key => $column ) {
					$serialized_column_attributes = $column['attributes'];
					$column_attributes            = maybe_unserialize( $serialized_column_attributes );
					$column['attributes']         = $column_attributes;
					array_push( $table_column_return, $column );
				}

				$table_return = $table_column_return;
				break;
			case 'dt_table_cells':
				$table_cell_return = array();

				foreach ( $query_results as $key => $row ) {
					$serialized_cell_attributes = $row['attributes'];
					$cell_attributes           = maybe_unserialize( $serialized_cell_attributes );
					$row['attributes']        = $cell_attributes;
					array_push( $table_cell_return, $row );
				}

				$table_return = $table_cell_return;
				break;
			default:
				$this->result = array(
					'success' => $success,
					'result'  => 'ERROR - ' . $db_table_name . ' is not a valid database table.',
				);
				return $this->result;
		}

		$success = true;

		$this->result = array(
			'success' => $success,
			'result'  => $table_return,
		);

		return $this->result;
	}

	/**
	 *  Delete the dynamic table data for a specific one dynamic table from all database table
	 *
	 * @since 1.00.00
	 *
	 * @param int    $table_id              ID value of the table being updated
	 * @param string $db_table_name       database table name
	 * @return array Sresult            Success status and data retrieved
	 */
	public function delete_table_data( $table_id ) {
		$success = 'Processing';
		global $wpdb;

		$wpdb->query( 'START TRANSACTION' );

		/**
		 * Delete table from dt_tables
		 */

		$this->request_args = array();

		$db_table = 'dt_tables';

		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'id',
				'value' => $table_id,
			)
		);

		$query_returned_result = $this->delete_table( $db_table );
		if ( ! $query_returned_result ) {
			$wpdb->query( 'ROLLBACK' ); // rollback everything
			$success = 'False';

			$this->result = array(
				'deleted_rows' => '0',
			);

			return $this->result;
		}
		$deleted_table_rows = $query_returned_result;

		/**
		 * Delete table from dt_table_columns
		 */

		$this->request_args = array();
		$db_table   = 'dt_table_rows';

		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);

		$query_returned_result = $this->delete_table( $db_table );
		if ( ! $query_returned_result ) {
			$wpdb->query( 'ROLLBACK' ); // rollback everything
			$success = 'False';

			$this->result = array(
				'deleted_rows' => '0',
			);

			return $this->result;
		}

		$deleted_row_rows = $query_returned_result;

		/**
		 * Delete table from dt_table_columns
		 */

		$this->request_args = array();
		$db_table   = 'dt_table_columns';

		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);

		$query_returned_result = $this->delete_table( $db_table );
		if ( ! $query_returned_result ) {
			$wpdb->query( 'ROLLBACK' ); // rollback everything
			$success = 'False';

			$this->result = array(
				'deleted_rows' => '0',
			);

			return $this->result;
		}

		$deleted_column_rows = $query_returned_result;

		/**
		 * Delete table from dt_table_cells
		 */

		$this->request_args = array();
		$db_table   = 'dt_table_cells';

		array_push(
			$this->request_args,
			array(
				'type'  => 'where',
				'field' => 'table_id',
				'value' => $table_id,
			)
		);

		$query_returned_result = $this->delete_table( $db_table );
		if ( ! $query_returned_result ) {
			$wpdb->query( 'ROLLBACK' ); // rollback everything
			$success = 'False';

			$this->result = array(
				'deleted_rows' => '0',
			);

			return $this->result;
		}

		$deleted_cell_rows = $query_returned_result;

		$wpdb->query( 'COMMIT' ); // commit all queries
		$success = 'True';

		$this->result = array(
			'success'      => $success,
			'deleted_rows' => $deleted_table_rows + $deleted_row_rows + $deleted_column_rows + $deleted_cell_rows,
		);

		return $this->result;
	}

	/**
	 * Transform SQL arguments to support the $wpdb->prepare format.
	 *
	 * @since 1.00.00
	 *
	 * @return array    Transformed arguments.
	 */
	protected function process_args( ) {
		$sql_args      = array();
		$prior_arg_type = 'none';

		foreach ( $this->request_args as $index => $items ) {
			foreach ( $items as $item => $arg ) {
				switch ( $item ) {
					case 'type':
						$arg_type = $arg;
					case 'field':
						$arg_field = $arg;
					case 'value':
						$arg_value = $arg;
				}
			}

			if ( $arg_type === 'from' and $prior_arg_type === 'where' ) {
				return false;
			}
			$sql_args     += $this->transform_arg( $arg_type, $arg_field, $arg_value );
			$prior_arg_type = $arg_type;

		}
		return $sql_args;
	}

	/**
	 * Transform SQL one argument to support the $wpdb->prepare format.
	 *
	 * @since 1.00.00
	 *
	 * @param array $arg_type   SQL Statement argument
	 * @param array $arg_field  Table field name associated with the argument.
	 * @param array $arg_value  Value associated with the table field for WHERE and SET arguments
	 * @return array    Transformed argument.
	 */
	protected function transform_arg( $arg_type, $arg_field, $arg_value ) {
		global $wpdb;

		if ( $arg_type === 'from' or $arg_type === 'update' or $arg_type === 'delete' or $arg_type === 'insert' ) {
			// Update for multi-site
			$transformed_table_name = $wpdb->prefix . $arg_field;
			return array( 'tablename' => $transformed_table_name );
		}

		if ( $arg_type === 'where' or $arg_type === 'set' or $arg_type === 'value' ) {
			return array( $arg_field => $arg_value );
		}

		if ( $arg_type === 'order_by' ) {
			return array( 'order_by_' . $arg_field => $arg_field );
		}
	}

	/**
	 * Build SQL query string.
	 *
	 * @since 1.00.00
	 *
	 * @return string    Valid SQL query string.
	 */
	protected function process_query_string( ) {
		global $wpdb;

		$transaction_type        = '';
		$from_clause             = 'FROM ';
		$value_clause            = '';
		$delete_clause           = '';
		$update_clause           = '';
		$insert_clause           = '';
		$set_clause              = 'SET ';
		$where_clause            = 'WHERE ';
		$current_set_position     = 0;
		$current_order_by_position = 0;
		$current_value_position   = 0;
		$current_where_position   = 0;

		$set_type_count     = $this->count_request_args_by_type( $this->request_args, 'set' );
		$order_by_type_count = $this->count_request_args_by_type( $this->request_args, 'order_by' );
		$value_type_count   = $this->count_request_args_by_type( $this->request_args, 'value' );
		$where_type_count   = $this->count_request_args_by_type( $this->request_args, 'where' );

		if ( $order_by_type_count === 0 ) {
			$order_by_clause = '';
		} else {
			$order_by_clause = 'ORDER BY ';
		}

		foreach ( $this->request_args as $index => $items ) {
			foreach ( $items as $item => $arg ) {
				switch ( $item ) {
					case 'type':
						$arg_type = $arg;
					case 'field':
						$arg_field = $arg;
					case 'value':
						$arg_value = $arg;
				}
			}

			if ( $arg_type === 'from' ) {
				$transaction_type = 'from';
				$from_clause     .= '%i';
			}

			if ( $arg_type === 'update' ) {
				$transaction_type = 'update';
				$update_clause   .= '%i';
			}

			if ( $arg_type === 'delete' ) {
				$transaction_type = 'delete';
				$delete_clause   .= '%i';
			}

			if ( $arg_type === 'insert' ) {
				$transaction_type = 'insert';
				$insert_clause   .= '%i';
			}

			if ( $arg_type === 'order_by' ) {
				$order_by_clause .= '%i';

				if ( $current_order_by_position !== $order_by_type_count - 1 ) {
					$order_by_clause .= ', ';
				}
				++$current_order_by_position;
			}

			if ( $arg_type === 'set' ) {
				if ( $transaction_type === '' ) {
					$transaction_type = 'set';
					$set_clause       = '';
				}

				$set_clause .= $this->specific_query( $transaction_type, $arg_field );

				if ( ( $current_set_position !== $set_type_count - 1 ) and
					( $this->specific_query( $transaction_type, $arg_field ) !== null ) ) {
					$set_clause .= ', ';
				}
				++$current_set_position;
			}

			if ( $arg_type === 'value' ) {
				$transaction_type = 'insert';
				$value_clause    .= $this->specific_query( $transaction_type, $arg_field );

				if ( ( $current_value_position !== $value_type_count - 1 ) and
					( $this->specific_query( $transaction_type, $arg_field ) !== null ) ) {
					$value_clause .= ', ';
				}
				++$current_value_position;
			}

			if ( $arg_type === 'where' ) {
				if ( $transaction_type === '' ) {
					$transaction_type = 'where';
					$where_clause     = '';
				}

				if ( $transaction_type === 'from' ) {
					$where_clause .= $arg_field . ' = ' . $this->specific_query( $transaction_type, $arg_field );

					if ( ( $current_where_position !== $where_type_count - 1 ) and
						( $this->specific_query( $transaction_type, $arg_field ) !== null ) ) {
						$where_clause .= ' AND ';
					}
				} else {
					$where_clause .= $this->specific_query( $transaction_type, $arg_field );

					if ( ( $current_where_position !== $where_type_count - 1 ) and
						( $this->specific_query( $transaction_type, $arg_field ) !== null ) ) {
						$where_clause .= ' AND ';
					}
				}
				++$current_where_position;
			}
		}

		switch ( $transaction_type ) {
			case 'from':
				return $from_clause . ' ' . $where_clause . ' ' . $order_by_clause;
			case 'update':
				return $update_clause . ' ' . $set_clause . ' ' . $where_clause;
			case 'delete':
				return $delete_clause . ' ' . $where_clause;
			case 'insert':
				return $value_clause;
			case 'set':
				return $set_clause;
			case 'where':
				return $where_clause;
			default:
				return false;
		}
	}

	/**
	 * Lookup Parameter data type for a specific query field.
	 *
	 * @since 1.00.00
	 *
	 * @param array $transType      SQL transaction type and position of the statement in query
	 *                              or specific field names of INSERT transactions
	 * @param array $arg_field       Field name of the parameter for lookup
	 * @return string    Valid SQL query string.
	 */
	protected function specific_query( $trans_type, $arg_field ) {
		if ( $trans_type = 'value' ) {
			switch ( $arg_field ) {
				case 'id':
					return '%d';
				case 'table_id':
					return '%d';
				case 'post_id':
					return '%d';
				case 'column_id':
					return '%d';
				case 'row_id':
					return '%d';
				default:
					return '%s';
			}
		}

		switch ( $arg_field ) {
			case 'tablename':
				return null;
			case 'fieldname':
				return null;
			case 'id':
				return 'id = %d';
			case 'table_id':
				return 'table_id = %d';
			case 'post_id':
				return 'table_id = %d';
			case 'column_id':
				return 'column_id = %d';
			case 'row_id':
				return 'row_id = %d';
			default:
				return $arg_field . ' = %s';
		}
	}

	/**
	 * Count the number of arguments for a specific portion of the query statements to support
	 * ability to properly terminate the statement.
	 *
	 * @since 1.00.00
	 *
	 * @param array $args         Array of arguments
	 * @param array $arg_type      Argument type being counted
	 * @return int  NUmber of arguments associated with the statement secment.
	 */
	protected function count_request_args_by_type( $args, $arg_type ) {
		$counter = 0;
		array_walk_recursive(
			$args,
			function ( $value, $key ) use ( &$counter, $arg_type ) {

				if ( $value === $arg_type && 'type' === $key ) {
					$counter++;
				}
			},
			$counter
		);
		return $counter;
	}
}
