<?php
/**
 * REST API: Dynamic_Tables_REST_Controller class
 * Class to access dynamic tables via the WordPress REST API.
 *
 * @see WP_REST_Controller
 */

namespace DynamicTables;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Dynamic_Tables_REST_Controller extends \WP_REST_Controller {


	/**
	 * Constructor
	 */
	public function __construct() {
		$this->namespace = 'dynamic-tables/v1';
		$this->rest_base = 'tables';
	}

	/**
	 *  Create web service end points for Dynamic Tables rest based services.  Services are:
	 *      - GET: Get tables (pural, not currently implemented)
	 *      - CREATE: Create table (singular)
	 *      - GET: Get table (singular)
	 *      - PUT: Update table (singular)
	 *      - DELETE: Delete table (singular)
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					// 'args' => $this->get_collection_params(),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( \WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		$get_item_args = array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args'   => array(
					'id' => array(
						'description' => __( 'Unique identifier for this table' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => \WP_REST_SERVER::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $get_item_args,
				),
				array(
					'methods'             => \WP_REST_SERVER::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( \WP_REST_SERVER::EDITABLE ),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * RESERVED FOR FUTURE USE
	 *
	 * Checks if a given request has access to read tables.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Full details about the request.
	 * @return void | WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		_doing_it_wrong(
			'get_tables',
			sprintf(
				/* translators: 1: The taxonomy name, 2: The property name, either 'rest_base' or 'name', 3: The conflicting value. */
				__( 'Functionality to filter and retrieve multiple tables is not implemented.  The endpoint is reserved for future use' ),
			),
			'1.0'
		);
	}

	/**
	 * RESERVED FOR FUTURE USE
	 *
	 * Retrieves a collection of TABLES.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return void WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		_doing_it_wrong(
			'get_tables',
			sprintf(
				/* translators: 1: The taxonomy name, 2: The property name, either 'rest_base' or 'name', 3: The conflicting value. */
				__( 'Functionality to filter and retrieve multiple tables is not implemented.  The endpoint is reserved for future use' ),
			),
			'1.0'
		);
	}

	/**
	 * Checks if a given request has access to read a table based on post permissions.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has read access for the item, WP_Error object or false otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$table = $this->get_table( $request['id'] );

		if ( is_wp_error( $table ) ) {
			return $table;
		}

		// Permissions for reading  a table are based upon the underlying post to which
		// it is attached.
		if ( isset( $table['header']['post_id'] ) ) {
			$post_id = (int) $table['header']['post_id'];
			if ( $post_id === 0 ) {

				$post = $this->get_post( $post_id);
				if ( is_wp_error( $post ) ) {
					return $post;
				}

				if ( 'edit' === $request['context'] && $post && ! $this->check_update_permission( $post ) ) {
					return new \WP_Error(
						'rest_forbidden_context',
						__( 'Sorry, you are not allowed to edit this post.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}

			if ( (int) $post_id === 0 ) {
				if ( 'edit' === $request['context'] && ! current_user_can( 'edit_posts' ) ) {
					return new \WP_Error(
						'rest_forbidden_context',
						__( 'Sorry, you are not allowed to edit this post.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}
		} else {
			return new \WP_Error(
				'missing_post_id',
				__( 'Post ID is missing from request.' ),
				array( 'status' => 500 )
			);
		}
		return true;
	}

	/**
	 * Retrieves a single table.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		// error_log(print_r($request, true));

		$table = $this->get_table( $request['id'] );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$data     = $this->prepare_item_for_response( $table, $request );
		$response = rest_ensure_response( $data );

		error_log( 'GET RESPONSE' );
		error_log( json_encode( $response ) );

		return $response;
	}

	/**
	 * Gets the table, if the ID is valid.
	 *
	 * @since 1.0.0
	 *
	 * @param int $id Supplied ID.
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_table( $id ) {
		$error = new \WP_Error(
			'rest_table_invalid_id',
			__( 'Invalid table ID.' ),
			array( 'status' => 404 )
		);

		if ( (int) $id <= 0 ) {
			return $error;
		}

		$table = get_table( (int) $id );
		if ( is_wp_error( $table ) ) {
			return $error;
		}

		if ( empty( $table ) ) {
			return $error;
		}

		$table_title     = $table['header']['table_name'];
		$table = $table += array( 'title' => $table_title );

		error_log( 'Table name = ' . $table['header']['table_name'] );
		// error_log( 'Revised table = ' . json_encode( $table ) );

		return $table;
	}

	/**
	 * Gets the post, if the ID is valid.
	 *
	 * @since 1.0.0
	 *
	 * @param int $id Supplied ID.
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_post( $id ) {
		$error = new \WP_Error(
			'rest_post_invalid_id',
			__( 'Invalid post ID.' ),
			array( 'status' => 500 )
		);

		if ( (int) $id < 0 ) {
			return $error;
		}

		$error = new \WP_Error(
			'rest_post_invalid',
			__( 'Invalid post' ),
			array( 'status' => 404 )
		);

		$post = get_post( (int) $id );
		if ( empty( $post ) || empty( $post->ID ) ) {
			return $error;
		}
		return $post;
	}

	/**
	 * Checks if a given request has access to create a table.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		error_log('From Create Item Permission Check');
		// error_log(print_r($request, true));
		if ( (int) 0 !== (int) $request['id'] ) {
			return new \WP_Error(
				'rest_table_exists',
				__( 'Cannot create existing table.' ),
				array( 'status' => 400 )
			);
		}

		// Permissions for creating a table are based upon the underlying post to which
		// it is attached.
		if ( isset( $request['header']['post_id'] ) ) {
			$post_id = (int) $request['header']['post_id'];

			if ( $post_id !== 0 ) {
				$post = $this->get_post( $post_id);
				if ( is_wp_error( $post ) ) {
					// error_log(print_r($request, true));
					error_log('Error getting post (id = 0)');
					return $post;
				}

				$post_type = get_post_type_object( $post->post_type );

				if ( $post && ! $this->check_update_permission( $post ) ) {
					// error_log(print_r($request, true));
					error_log('No post permissions 1');
					return new \WP_Error(
						'rest_cannot_edit',
						__( 'Sorry, you are not allowed to create tables for this post as this user.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}

				if ( ! empty( $request['author'] ) && get_current_user_id() !== $request['author'] && ! current_user_can( $post_type->cap->edit_others_posts ) ) {
					// error_log(print_r($request, true));
					error_log('No post permissions 2');
					return new \WP_Error(
						'rest_cannot_edit_others',
						__( 'Sorry, you are not allowed to create tables for this post as this user.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}

			if ( $post_id === 0 && ( ! ( current_user_can( 'publish_posts' ) || current_user_can( 'publish_pages' ) ) ) ) {
				// error_log(print_r($request, true));
				error_log('No post permissions 3');
				return new \WP_Error(
					'rest_cannot_edit',
					__( 'Sorry, you are not allowed to create tables for this post as this user.' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		} else {
			// error_log(print_r($request, true));
			error_log('Post ID missing');
			return new \WP_Error(
				'missing_post_id',
				__( 'Post ID is missing from request.' ),
				array( 'status' => 500 )
			);
		}
		return true;
	}

	/**
	 * Creates a single table.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		error_log('From Create Item');

		if ( (int) 0 !== (int) $request['id'] ) {
			return new \WP_Error(
				'rest_table_exists',
				__( 'Cannot create existing post.' ),
				array( 'status' => 400 )
			);
		}

		$prepared_table = $this->prepare_item_for_database( $request );

		if ( is_wp_error( $prepared_table ) ) {
			return $prepared_table;
		}
		$table_id = create_table_data( $prepared_table, true );

		if ( is_wp_error( $table_id ) ) {
			if ( 'db_insert_error' === $table_id->get_error_code() ||
				'db_update_error' === $table_id->get_error_code() ||
				'db_read_error' === $table_id->get_error_code() ) {
				$table_id->add_data( array( 'status' => 500 ) );
			} else {
				$table_id->add_data( array( 'status' => 400 ) );
			}

			return $table_id;
		}

		$table       = get_table( $table_id );
		$table_title = $table['header']['table_name'];
		$table_test  = $table += array( 'title' => $table_title );

		error_log( 'Table name = ' . $table['header']['table_name'] );
		error_log( 'Revised table = ' . json_encode( $table_test ) );
		/**
		 * Reserve for future use
		 */

		// $fields_update = $this->update_additional_fields_for_object($table, $request);

		// if (is_wp_error($fields_update)) {
		// return $fields_update;
		// }

		$request->set_param( 'context', 'edit' );
		$response = $this->prepare_item_for_response( $table, $request );
		$response = rest_ensure_response( $response );

		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Checks if a given request has access to update a table.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		// Permissions for editing a table are based upon the underlying post to which
		// it is attached.
		// error_log('From Update Item');
		// error_log(print_r($request, true));

		return true;
		if ( isset( $request['header']['post_id'] ) ) {
			$post_id = (int) $request['header']['post_id'];

			if ( $post_id !== 0 ) {
				$post = $this->get_post( $post_id);
				if ( is_wp_error( $post ) ) {
					// error_log(print_r($request, true));
					return $post;
				}
				$post_type = get_post_type_object( $post->post_type );

				if ( $post && ! $this->check_update_permission( $post ) ) {
					// error_log(print_r($request, true));
					return new \WP_Error(
						'rest_cannot_edit',
						__( 'Sorry, you are not allowed to update tables for this post as this user.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}

				if ( ! empty( $request['author'] ) && get_current_user_id() !== $request['author'] && ! current_user_can( $post_type->cap->edit_others_posts ) ) {
					// error_log(print_r($request, true));
					return new \WP_Error(
						'rest_cannot_edit_others',
						__( 'Sorry, you are not allowed to update tables for this post as this user.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}

			if ( $post_id === 0 && ( ! ( current_user_can( 'publish_posts' ) || current_user_can( 'publish_pages' ) ) ) ) {
				// error_log(print_r($request, true));
				return new \WP_Error(
					'rest_cannot_edit',
					__( 'Sorry, you are not allowed to update tables for this post as this user.' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		} else {
			// error_log(print_r($request, true));
			return new \WP_Error(
				'missing_post_id',
				__( 'Post ID is missing from request.' ),
				array( 'status' => 500 )
			);
		}
		return true;
	}

	/**
	 * Updates a single table.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {

		// error_log('Reqest as delivered from Service');
		// error_log(print_r($request, true));
		$valid_check = $this->get_table( $request['id'] );
		if ( is_wp_error( $valid_check ) ) {
			return $valid_check;
		}

		$table = $this->prepare_item_for_database( $request );
		// error_log('Reqest adter DB prep');
		// error_log(print_r($table, true));

		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$table_id = update_table_data( $table, true );

		if ( is_wp_error( $table_id ) ) {
			if ( 'db_insert_error' === $table_id->get_error_code() ||
				'db_update_error' === $table_id->get_error_code() ||
				'db_read_error' === $table_id->get_error_code() ) {
				$table_id->add_data( array( 'status' => 500 ) );
			} else {
				$table_id->add_data( array( 'status' => 400 ) );
			}
			return $table_id;
		}

		$table = get_table( $table_id );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		/**
		 * Reserve for future use
		 */

		// $fields_update = $this->update_additional_fields_for_object($table, $request);

		// if (is_wp_error($fields_update)) {
		// return $fields_update;
		// }

		$request->set_param( 'context', 'edit' );
		$response = $this->prepare_item_for_response( $table, $request );

		return rest_ensure_response( $response );
	}

	/**
	 * Checks if a given request has access to delete a table.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to delete the item, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		$table = $this->get_table( $request['id'] );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		// Permissions for deleting a table are based upon the underlying post to which
		// it is attached.
		if ( isset( $table['header']['post_id'] ) ) {
			$post_id = (int) $table['header']['post_id'];

			if ( 0 === $post_id ) {
				$post = $this->get_post( $post_id);
				if ( is_wp_error( $post ) ) {
					return $post;
				}
				$post_type = get_post_type_object( $post->post_type );

				if ( $post && ! $this->check_update_permission( $post ) ) {
					return new \WP_Error(
						'rest_cannot_edit',
						__( 'Sorry, you are not allowed to delete tables for this post as this user.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}

				if ( ! empty( $request['author'] ) && get_current_user_id() !== $request['author'] && ! current_user_can( $post_type->cap->edit_others_posts ) ) {
					return new \WP_Error(
						'rest_cannot_edit_others',
						__( 'Sorry, you are not allowed to delete tables for this post as this user.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}

			if ( 0 === $post_id && ( ! ( current_user_can( 'publish_posts' ) || current_user_can( 'publish_pages' ) ) ) ) {
				return new \WP_Error(
					'rest_cannot_edit',
					__( 'Sorry, you are not allowed to delete tables for this post as this user.' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		} elseif ( 'edit' === $request['context'] && ! current_user_can( 'edit_posts' ) ) {
				return new \WP_Error(
					'rest_forbidden_context',
					__( 'Sorry, you are not allowed to delete this post.' ),
					array( 'status' => rest_authorization_required_code() )
				);
		}
		return true;
	}

	/**
	 * Deletes a single table.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$table = $this->get_table( $request['id'] );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$id = $table['id'];
		$request->set_param( 'context', 'edit' );

		$previous = $this->prepare_item_for_response( $table, $request );
		$result   = delete_table( $id );
		$response = new \WP_REST_Response();
		$response->set_data(
			array(
				'deleted'  => true,
				'previous' => $previous->get_data(),
			)
		);

		if ( ! $result ) {
			return new \WP_Error(
				'rest_cannot_delete',
				__( 'The table cannot be deleted.' ),
				array( 'status' => 500 )
			);
		}
		return rest_ensure_response( $response );
	}

	/**
	 * Checks if a post can be edited.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_Post $post Post object.
	 * @return bool Whether the post can be edited.
	 */
	protected function check_update_permission( $post ) {
		$post_type = get_post_type_object( $post->post_type );

		if ( ! $this->check_is_post_type_allowed( $post_type ) ) {
			return false;
		}
		return current_user_can( 'edit_post', $post->ID );
	}

	/**
	 * Checks if a given post type can be viewed or managed.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_Post_Type|string $post_type Post type name or object.
	 * @return bool Whether the post type is allowed in REST.
	 */
	protected function check_is_post_type_allowed( $post_type ) {
		if ( ! is_object( $post_type ) ) {
			$post_type = get_post_type_object( $post_type );
		}

		if ( ! empty( $post_type ) && ! empty( $post_type->show_in_rest ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Prepares a single table for create or update.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass|WP_Error Post object or WP_Error.
	 */
	protected function prepare_item_for_database( $request ) {
		// error_log(print_r($request, true));
		$prepared_table = new \stdClass();
		$current_status = '';

		if ( isset( $request['id'] ) && (int) $request['id'] !== 0 ) {
			$existing_table = $this->get_table( $request['id'] );
			if ( is_wp_error( $existing_table ) ) {
				return $existing_table;
			}

			$prepared_table->id = $existing_table['id'];
			$current_status     = $existing_table['header']['status'];
		}

		$schema = $this->get_item_schema();

		/**
		 * Process Table Header Block
		 */
		if ( ! empty( $schema['properties']['header'] ) ) {
			$schema_header = $schema['properties']['header'];

			// Table Header ID.
			if ( ! empty( $schema_header['properties']['id'] ) ) {
				if ( isset( $request['header']['id'] ) ) {
					if ( (int) $request['header']['id'] !== (int) $request['id'] ) {
						return new \WP_Error(
							'rest_header_id_integrity',
							__( 'Header ID does not match Request ID.' ),
							array( 'status' => 400 )
						);
					}
					$prepared_table->header['id'] = (int) $request['header']['id'];
				}
			}

			// Table post block cross reference.
			if ( ! empty( $schema_header['properties']['block_table_ref'] ) &&
				isset( $request['header']['block_table_ref'] ) ) {
				$prepared_table->header['block_table_ref'] = $request['header']['block_table_ref'];
			}

			// Table status.
			if ( ! empty( $schema_header['properties']['status'] ) &&
				isset( $request['header']['status'] ) &&
				( ! $current_status || $current_status !== $request['status'] ) ) {
				$prepared_table->header['status'] = $request['header']['status'];
			}

			// Table Post ID cross reference.
			if ( ! empty( $schema_header['properties']['post_id'] ) &&
				isset( $request['header']['post_id'] ) ) {
				$prepared_table->header['post_id'] = (int) $request['header']['post_id'];
			}

			// Table name.
			if ( ! empty( $schema_header['properties']['table_name'] ) &&
				isset( $request['header']['table_name'] ) ) {
				$prepared_table->header['table_name'] = $request['header']['table_name'];
			}

			// Table attributes.
			if ( ! empty( $schema_header['properties']['attributes'] ) &&
				isset( $request['header']['attributes'] ) ) {
				$prepared_table->header['attributes'] = $request['header']['attributes'];
			}

			// Table css classes.
			if ( ! empty( $schema_header['properties']['classes'] ) &&
				isset( $request['header']['classes'] ) ) {
				$prepared_table->header['classes'] = $request['header']['classes'];
			}
		}

		/**
		 * Process Table Row Block for each row in the table
		 */
		if ( ! empty( $schema['properties']['rows'] )
			&& isset( $request['rows'] ) ) {
			$schema_rows = $schema['properties']['rows'];

			foreach ( $request['rows'] as $key => $row ) {
				$schema_row = $schema_rows['properties']['row'];

				// Row Table ID
				if ( ! empty( $schema_row['properties']['table_id'] ) ) {
					if ( isset( $request['rows'][ $key ]['table_id'] ) ) {
						if ( (int) $request['rows'][ $key ]['table_id'] !== (int) $request['id'] ) {
							return new \WP_Error(
								'rest_header_id_integrity',
								__( 'Row table ID does not match Request ID.' ),
								array( 'status' => 400 )
							);
						}
						$prepared_table->rows[ $key ]['table_id'] = (int) $request['rows'][ $key ]['table_id'];
					}
				}

				// Row's Row ID
				if ( ! empty( $schema_row['properties']['row_id'] ) &&
					isset( $request['rows'][ $key ]['row_id'] ) ) {
					$prepared_table->rows[ $key ]['row_id'] = (int) $request['rows'][ $key ]['row_id'];
				}

				// Row attributes
				if ( ! empty( $schema_row['properties']['attributes'] ) &&
					isset( $request['rows'][ $key ]['attributes'] ) ) {
					$prepared_table->rows[ $key ]['attributes'] = $request['rows'][ $key ]['attributes'];
				}

				// Row css classes
				if ( ! empty( $schema_row['properties']['classes'] ) &&
					isset( $request['rows'][ $key ]['classes'] ) ) {
					$prepared_table->rows[ $key ]['classes'] = $request['rows'][ $key ]['classes'];
				}
			}
		}

		/**
		 * Process Table Column Block for each column in the table
		 */
		if ( ! empty( $schema['properties']['columns'] )
			&& isset( $request['columns'] ) ) {
			$schema_columns = $schema['properties']['columns'];

			foreach ( $request['columns'] as $key => $column ) {
				$schema_column = $schema_columns['properties']['column'];

				// Column Table ID
				if ( ! empty( $schema_column['properties']['table_id'] ) ) {
					if ( isset( $request['columns'][ $key ]['table_id'] ) ) {
						if ( (int) $request['columns'][ $key ]['table_id'] !== (int) $request['id'] ) {
							return new \WP_Error(
								'rest_header_id_integrity',
								__( 'Row table ID does not match Request ID.' ),
								array( 'status' => 400 )
							);
						}
						$prepared_table->columns[ $key ]['table_id'] = (int) $request['columns'][ $key ]['table_id'];
					}
				}

				// Colunmn's Column ID
				if ( ! empty( $schema_column['properties']['column_id'] ) &&
					isset( $request['columns'][ $key ]['column_id'] ) ) {
					$prepared_table->columns[ $key ]['column_id'] = (int) $request['columns'][ $key ]['column_id'];
				}

				// Colunmn's Column Name
				if ( ! empty( $schema_column['properties']['column_name'] ) &&
					isset( $request['columns'][ $key ]['column_name'] ) ) {
					$prepared_table->columns[ $key ]['column_name'] = $request['columns'][ $key ]['column_name'];
				}
				// Column attributes
				if ( ! empty( $schema_column['properties']['attributes'] ) &&
					isset( $request['columns'][ $key ]['attributes'] ) ) {
					$prepared_table->columns[ $key ]['attributes'] = $request['columns'][ $key ]['attributes'];
				}

				// Column css classes
				if ( ! empty( $schema_column['properties']['classes'] ) &&
					isset( $request['columns'][ $key ]['classes'] ) ) {
					$prepared_table->columns[ $key ]['classes'] = $request['columns'][ $key ]['classes'];
				}
			}
		}

		/**
		 * Process Table Cell Block for each cell in the table
		 */
		if ( ! empty( $schema['properties']['cells'] )
			&& isset( $request['cells'] ) ) {
			$schema_cells = $schema['properties']['cells'];

			foreach ( $request['cells'] as $key => $cell ) {
				$schema_cell = $schema_cells['properties']['cell'];

				// Table ID
				if ( ! empty( $schema_cell['properties']['table_id'] ) ) {
					if ( isset( $request['cells'][ $key ]['table_id'] ) ) {
						if ( (int) $request['cells'][ $key ]['table_id'] !== (int) $request['id'] ) {
							return new \WP_Error(
								'rest_header_id_integrity',
								__( 'Row table ID does not match Request ID.' ),
								array( 'status' => 400 )
							);
						}
						$prepared_table->cells[ $key ]['table_id'] = (int) $request['cells'][ $key ]['table_id'];
					}
				}

				// Column ID
				if ( ! empty( $schema_cell['properties']['column_id'] ) &&
					isset( $request['cells'][ $key ]['column_id'] ) ) {
					$prepared_table->cells[ $key ]['column_id'] = (int) $request['cells'][ $key ]['column_id'];
				}

				// Row ID
				if ( ! empty( $schema_cell['properties']['row_id'] ) &&
					isset( $request['cells'][ $key ]['row_id'] ) ) {
					$prepared_table->cells[ $key ]['row_id'] = (int) $request['cells'][ $key ]['row_id'];
				}
				// Cell attributes
				if ( ! empty( $schema_cell['properties']['attributes'] ) &&
					isset( $request['cells'][ $key ]['attributes'] ) ) {
					$prepared_table->cells[ $key ]['attributes'] = $request['cells'][ $key ]['attributes'];
				}

				// Cell css classes
				if ( ! empty( $schema_cell['properties']['classes'] ) &&
					isset( $request['cells'][ $key ]['classes'] ) ) {
					$prepared_table->cells[ $key ]['classes'] = $request['cells'][ $key ]['classes'];
				}

				// Cell css content
				if ( ! empty( $schema_cell['properties']['content'] ) &&
					isset( $request['cells'][ $key ]['content'] ) ) {
					$prepared_table->cells[ $key ]['content'] = $request['cells'][ $key ]['content'];
				}
			}
		}

		/**
		 * Filters a table before it is inserted via the REST API.
		 *
		 * Possible hook names include:
		 *
		 * @param stdClass        $prepared_post An object representing a single post prepared
		 *                                       for inserting or updating the database.
		 * @param WP_REST_Request $request       Request object.
		 */
		return apply_filters( 'rest_pre_insert_dynamic-table', $prepared_table, $request );
	}

	/**
	 * Prepares a single table output for response.
	 *
	 * @since 1.0.0
	 *
	 * @param Table           $item      Table object.
	 * @param WP_REST_Request $request   Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// Restores the more descriptive, specific name for use within this method.
		$table  = $item;
		$fields = $this->get_fields_for_response( $request );

		// Base fields for every table.
		$data = array();

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $table['id'];
		}

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['title'] = $table['title'];
		}

		/**
		 * Header Block
		 */
		if ( rest_is_field_included( 'header.id', $fields ) ) {
			$data['header']['id'] = $table['header']['id'];
		}
		if ( rest_is_field_included( 'header.block_table_ref', $fields ) ) {
			$data['header']['block_table_ref'] = $table['header']['block_table_ref'];
		}
		if ( rest_is_field_included( 'header.status', $fields ) ) {
			$data['header']['status'] = $table['header']['status'];
		}
		if ( rest_is_field_included( 'header.post_id', $fields ) ) {
			$data['header']['post_id'] = $table['header']['post_id'];
		}

		if ( rest_is_field_included( 'header.table_name', $fields ) ) {
			$data['header']['table_name'] = $table['header']['table_name'];
		}

		if ( rest_is_field_included( 'header.attributes', $fields ) ) {
			$data['header']['attributes'] = $table['header']['attributes'];
		}

		if ( rest_is_field_included( 'header.classes', $fields ) ) {
			$data['header']['classes'] = $table['header']['classes'];
		}

		/**
		 * Row Block
		 */
		foreach ( $table['rows'] as $key => $row ) {
			if ( rest_is_field_included( 'rows.row.table_id', $fields ) ) {
				$data['rows'][ $key ]['table_id'] = $row['table_id'];
			}

			if ( rest_is_field_included( 'rows.row.row_id', $fields ) ) {
				$data['rows'][ $key ]['row_id'] = $row['row_id'];
			}

			if ( rest_is_field_included( 'rows.row.attributes', $fields ) ) {
				$data['rows'][ $key ]['attributes'] = $row['attributes'];
			}

			if ( rest_is_field_included( 'rows.row.classes', $fields ) ) {
				$data['rows'][ $key ]['classes'] = $row['classes'];
			}
		}

		/**
		 * Columns Block
		 */
		foreach ( $table['columns'] as $key => $column ) {
			if ( rest_is_field_included( 'columns.column.table_id', $fields ) ) {
				$data['columns'][ $key ]['table_id'] = $column['table_id'];
			}

			if ( rest_is_field_included( 'columns.column.column_id', $fields ) ) {
				$data['columns'][ $key ]['column_id'] = $column['column_id'];
			}

			if ( rest_is_field_included( 'columns.column.column_name', $fields ) ) {
				$data['columns'][ $key ]['column_name'] = $column['column_name'];
			}

			if ( rest_is_field_included( 'columns.column.attributes', $fields ) ) {
				$data['columns'][ $key ]['attributes'] = $column['attributes'];
			}

			if ( rest_is_field_included( 'columns.column.classes', $fields ) ) {
				$data['columns'][ $key ]['classes'] = $column['classes'];
			}
		}

		/**
		 * Cells Block
		 */
		foreach ( $table['cells'] as $key => $cell ) {
			if ( rest_is_field_included( 'cells.cell.table_id', $fields ) ) {
				$data['cells'][ $key ]['table_id'] = $cell['table_id'];
			}

			if ( rest_is_field_included( 'cells.cell.column_id', $fields ) ) {
				$data['cells'][ $key ]['column_id'] = $cell['column_id'];
			}

			if ( rest_is_field_included( 'cells.cell.row_id', $fields ) ) {
				$data['cells'][ $key ]['row_id'] = $cell['row_id'];
			}
			if ( rest_is_field_included( 'cells.cell.attributes', $fields ) ) {
				$data['cells'][ $key ]['attributes'] = $cell['attributes'];
			}

			if ( rest_is_field_included( 'cells.cell.classes', $fields ) ) {
				$data['cells'][ $key ]['classes'] = $cell['classes'];
			}

			if ( rest_is_field_included( 'cells.cell.content', $fields ) ) {
				$data['cells'][ $key ]['content'] = $cell['content'];
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		/**
		 * Filters the table data for a REST API response.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param WP_Post          $post     Post object.
		 * @param WP_REST_Request  $request  Request object.
		 */
		return apply_filters( 'rest_prepare_dynamic-table', $response, $table, $request );
	}

	/**
	 * Retrieves the table's schema, conforming to JSON Schema.
	 *
	 * @since 1.0.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'dynamic-table',
			'type'       => 'object',
			'properties' => array(
				'id'      => array(
					'description' => __( 'Unique identifier for the table.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'title'   => array(
					'description' => __( 'Table name which can include html style elements.' ),
					'type'        => 'string',
				),
				'header'  => array(
					'description' => __( 'Tablewide properties.' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'id'              => array(
							'description' => __( 'Table ID.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
						),
						'block_table_ref' => array(
							'description' => __( 'Link to specific table block on post.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
						),
						'status'          => array(
							'description' => __( 'Status of table within context of its assigned post.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
						),
						'post_id'         => array(
							'description' => __( 'Unique identifier for the post.' ),
							'type'        => 'integer',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
						'table_name'      => array(
							'description' => __( 'Table name which can include html style elements.' ),
							'type'        => 'string',
						),
						'attributes'      => array(
							'description' => __( 'Tablewide attributes.' ),
							'type'        => 'array',
							'context'     => array( 'view', 'edit' ),
						),
						'classes'         => array(
							'description' => __( 'Tablewide css classes.' ),
							'type'        => 'array',
							'context'     => array( 'view', 'edit' ),
						),
					),
				),
				'rows'    => array(
					'description' => __( 'Table rows collection' ),
					'type'        => 'array',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'row' => array(
							'description' => __( 'Table row' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
							'properties'  => array(
								'table_id'   => array(
									'description' => __( 'Table ID.' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
									'readonly'    => true,
								),
								'row_id'     => array(
									'description' => __( 'Table Row Number.' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
									'readonly'    => true,
								),
								'attributes' => array(
									'description' => __( 'Attributes for the row and inhereted by cells.' ),
									'type'        => 'array',
									'context'     => array( 'view', 'edit' ),
								),
								'classes'    => array(
									'description' => __( 'Css classes for the row and inhereted by cells.' ),
									'type'        => 'array',
									'context'     => array( 'view', 'edit' ),
								),
							),
						),
					),
				),
				'columns' => array(
					'description' => __( 'Table columns collection' ),
					'type'        => 'array',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'column' => array(
							'description' => __( 'Table column' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
							'properties'  => array(
								'table_id'    => array(
									'description' => __( 'Table ID.' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
									'readonly'    => true,
								),
								'column_id'   => array(
									'description' => __( 'Table Column Number.' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
									'readonly'    => true,
								),
								'column_name' => array(
									'description' => __( 'Table Column Name.' ),
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
									'readonly'    => true,
								),
								'attributes'  => array(
									'description' => __( 'Column attributes inhereted by cells.' ),
									'type'        => 'array',
									'context'     => array( 'view', 'edit' ),
								),
								'classes'     => array(
									'description' => __( 'CSS column classes inhereted by cells.' ),
									'type'        => 'array',
									'context'     => array( 'view', 'edit' ),
								),
							),
						),
					),
				),
				'cells'   => array(
					'description' => __( 'Table cells collection.' ),
					'type'        => 'array',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'cell' => array(
							'description' => __( 'Table cell' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
							'properties'  => array(
								'table_id'   => array(
									'description' => __( 'Table ID.' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
									'readonly'    => true,
								),
								'column_id'  => array(
									'description' => __( 'Table Column Number.' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
									'readonly'    => true,
								),
								'row_id'     => array(
									'description' => __( 'Table Row Number.' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
									'readonly'    => true,
								),
								'attributes' => array(
									'description' => __( 'Cell attributes.' ),
									'type'        => 'array',
									'context'     => array( 'view', 'edit' ),
								),
								'classes'    => array(
									'description' => __( 'CSS cell classes.' ),
									'type'        => 'array',
									'context'     => array( 'view', 'edit' ),
								),
								'content'    => array(
									'description' => __( 'Cell visible content which can include html style elements.' ),
									'type'        => 'array',
									'context'     => array( 'view', 'edit' ),
									'arg_options' => array(
										'sanitize_callback' => null, // Note: sanitization implemented in self::prepare_item_for_database().
										'validate_callback' => null, // Note: validation implemented in self::prepare_item_for_database().
									),
								),
							),
						),
					),
				),
			),

		);

		// Take a snapshot of which fields are in the schema pre-filtering.
		$schema_fields = array_keys( $schema['properties'] );

		// Emit a _doing_it_wrong warning if user tries to add new properties using this filter.
		$new_fields = array_diff( array_keys( $schema['properties'] ), $schema_fields );
		if ( count( $new_fields ) > 0 ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: register_rest_field */
					__( 'Please use %s to add new schema properties.' ),
					'register_rest_field'
				),
				'5.4.0'
			);
		}
		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * RESERVED FOR FUTURE USE
	 *
	 * Retrieves the query params for the tables collection.
	 *
	 * @since 1.0.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		_doing_it_wrong(
			'get_table collection',
			sprintf(
				__( 'Functionality to filter and retrieve multiple tables is not implemented.  The endpoint is reserved for future use' ),
			),
			'1.0'
		);
	}
}
