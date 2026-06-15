<?php
/**
 * REST API: Dynamic_Tables_REST_Controller class
 * Class to access dynamic tables via the WordPress REST API.
 *
 * @since 1.0.0
 * @see WP_REST_Controller
 */

namespace DynamicTableBlocks;

use Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Dynamic_Tables_REST_Controller extends \WP_REST_Controller {

	private bool $maintenance_request = false;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->namespace = 'dynamic-table-blocks/v1';
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
	 *
	 * @return void
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
					'args'                => $this->get_collection_params(),
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
						'description' => __( 'Unique identifier for this table', 'dynamic-table-blocks' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $get_item_args,
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( \WP_REST_Server::EDITABLE ),
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
	 * Checks if a given request has access to read tables.
	 *
	 * @since 1.0.0
	 * @since 1.4.0  Enabled get_items endpoint
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return void | \WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( $this->verify_internal_signature( $request ) ) {
			$this->maintenance_request = true;
			return true;
		}

		if ( ! current_user_can( 'edit_posts' ) && ! current_user_can( 'edit_pages' ) ) {
			return new \WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to list tables.', 'dynamic-table-blocks' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves a collection of TABLES.
	 *
	 * @since 1.0.0
	 * @since 1.4.0  Enabled get_items endpoint
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {

		$error_retrieval = new \WP_Error(
			'rest_tables_retrieval',
			__( 'Error retrieving tables from database.', 'dynamic-table-blocks' ),
			array( 'status' => 500 )
		);

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();
		$args       = array();

		/*
		 * This array defines mappings between public API query parameters whose
		 * values are accepted as-passed, and their internal SQL parameter
		 * name equivalents (some are the same).
		 */
		$parameter_mappings = array(
			'include'        => 'table__in',
			'exclude'        => 'table__not_in',
			'post'           => 'post__in',
			'post_exclude'   => 'post__not_in',
			'search'         => 's',
			'search_columns' => 'search_columns',
			'table'          => 'table_name__in',
			'status'         => 'status',
			'order'          => 'order',
			'orderby'        => 'orderby',
			'page'           => 'page',
		);

		/*
		 * For each known parameter which is both registered and present in the request,
		 * set the parameter's value on the query $args.
		 */
		foreach ( $parameter_mappings as $api_param => $dtbk_param ) {
			if ( isset( $registered[ $api_param ], $request[ $api_param ] ) ) {
				$args[ $dtbk_param ] = $request[ $api_param ];
			}
		}

		// Ensure our per_page parameter overrides any provided tables_per_page filter.
		if ( isset( $registered['per_page'] ) ) {
			$args['tabless_per_page'] = $request['per_page'];
		}

		$query_args = $this->prepare_items_query( $args, $request );
		$query_result = get_tables( true, $query_args );

		if ( is_wp_error( $query_result ) && $query_result->get_error_code() === 500 ) {
			return $error_retrieval;
		}

		if ( is_wp_error( $query_result ) ) {
			return $error_retrieval;
		}

		if ( empty( $query_result ) ) {
			return $error_retrieval;
		}

		$is_head_request = $request->is_method( 'HEAD' );
		if ( $is_head_request ) {
			// Force the 'fields' argument. For HEAD requests, only post IDs are required to calculate pagination.
			$args['fields'] = 'ids';
			// Disable priming post meta for HEAD requests to improve performance.
			$args['update_table_cache']      = false;
			$args['update_table_meta_cache'] = false;
		}

		$tables = array();
		if ( ! $is_head_request ) {
			// update_table_caches( $query_result );

			foreach ( $query_result as $table ) {
				if ( ! $this->check_read_permission( $table ) ) {
					continue;
				}

				$data     = $this->prepare_item_for_response( $table, $request );
				$tables[] = $this->prepare_response_for_collection( $data );
			}
		}

		$response = $is_head_request ? new \WP_REST_Response( array() ) : rest_ensure_response( $tables );
		return $response;
	}

	/**
	 * Checks if a given request has access to read a table based on post permissions.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return bool|\WP_Error True if the request has read access for the item, WP_Error object or false otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		// Permissions for editing a table are based upon the underlying post to which
		// it is attached.

		// Determine if this is from internal maintenance, verify signature, and authorize if verified
		if ( $this->verify_internal_signature( $request ) ) {
			$this->maintenance_request = true;
			return true;
		}

		$table = $this->get_table( $request['id'] );

		if ( is_wp_error( $table ) ) {
			return $table;
		}

		// Permissions for reading a table are based upon the underlying post to which
		// it is attached.
		// if ( isset( $table['header']['post_id'] ) ) {
		//  $post_id = (int) $table['header']['post_id'];
		//  if ( $post_id !== 0 ) {

		//      $post = $this->get_post( $post_id );
		//      if ( is_wp_error( $post ) ) {
		//          return $post;
		//      }

		//      if ( 'edit' === $request['context'] && $post && ! $this->check_update_permission( $post ) ) {
		//          return new \WP_Error(
		//              'rest_forbidden_context',
		//              __( 'Sorry, you are not allowed to edit this post.', 'dynamic-table-blocks' ),
		//              array( 'status' => rest_authorization_required_code() )
		//          );
		//      }
		//  }

		//  if ( (int) $post_id === 0 ) {
		//      if ( 'edit' === $request['context'] && ! current_user_can( 'edit_posts' ) ) {
		//          return new \WP_Error(
		//              'rest_forbidden_context',
		//              __( 'Sorry, you are not allowed to edit this post.', 'dynamic-table-blocks' ),
		//              array( 'status' => rest_authorization_required_code() )
		//          );
		//      }
		//  }
		// } else {
		if ( ! isset( $table['header']['post_id'] ) ) {
			return new \WP_Error(
				'missing_post_id',
				__( 'Post ID is missing from request.', 'dynamic-table-blocks' ),
				array( 'status' => 500 )
			);
		}

		if ( ! $this->check_read_permission( $table ) ) {
			return new \WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to read this table.', 'dynamic-table-blocks' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * Retrieves a single table.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$table = $this->get_table( $request['id'] );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$data     = $this->prepare_item_for_response( $table, $request );
		$response = rest_ensure_response( $data );

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
	protected function get_table( $id, $validate_header_only = false ) {
		$error_header = new \WP_Error(
			'rest_table_invalid_id',
			__( 'Invalid table ID.', 'dynamic-table-blocks' ),
			array( 'status' => 404 )
		);

		$error_body = new \WP_Error(
			'rest_table_corrupted',
			__( 'Table parts are missing.', 'dynamic-table-blocks' ),
			array( 'status' => 500 )
		);

		if ( (int) $id <= 0 ) {
			return $error_header;
		}

		$table = $validate_header_only
			? get_table_header( (int) $id )
			: get_table( (int) $id, false );

		if ( is_wp_error( $table ) ) {
			$error_data = $table->get_error_data();
			$status     = is_array( $error_data ) && isset( $error_data['status'] )
				? (int) $error_data['status']
				: 500;

			return 404 === $status ? $error_header : $error_body;
		}

		if ( empty( $table ) ) {
			return $error_body;
		}

		if ( $validate_header_only ) {
			return $table;
		}

		$table_title = $table['header']['table_name'];
		$table       = $table += array( 'title' => $table_title );

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
			__( 'Invalid post ID.', 'dynamic-table-blocks' ),
			array( 'status' => 500 )
		);

		if ( (int) $id < 0 ) {
			return $error;
		}

		$error = new \WP_Error(
			'rest_post_invalid',
			__( 'Invalid post', 'dynamic-table-blocks' ),
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
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		if ( (int) 0 !== (int) $request['id'] ) {
			return new \WP_Error(
				'rest_table_exists',
				__( 'Cannot create existing table.', 'dynamic-table-blocks' ),
				array( 'status' => 400 )
			);
		}

		// Determine if this is from internal maintenance, verify signature, and authorize if verified
		if ( $this->verify_internal_signature( $request ) ) {
			$this->maintenance_request = true;
			return true;
		}

		// Permissions for creating a table are based upon the underlying post to which
		// it is attached.
		if ( isset( $request['header']['post_id'] ) ) {
			$post_id = (int) $request['header']['post_id'];

			if ( $post_id !== 0 ) {
				$post = $this->get_post( $post_id );
				if ( is_wp_error( $post ) ) {
					return $post;
				}

				$post_type = get_post_type_object( $post->post_type );

				if ( $post && ! $this->check_update_permission( $post ) ) {
					return new \WP_Error(
						'rest_cannot_edit',
						__( 'Sorry, you are not allowed to create tables for this post as this user.', 'dynamic-table-blocks' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}

				if ( ! empty( $request['author'] ) && get_current_user_id() !== $request['author'] && ! current_user_can( $post_type->cap->edit_others_posts ) ) {
					return new \WP_Error(
						'rest_cannot_edit_others',
						__( 'Sorry, you are not allowed to create tables for this post as this user.', 'dynamic-table-blocks' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}

			if ( $post_id === 0 && ( ! ( current_user_can( 'publish_posts' ) || current_user_can( 'publish_pages' ) ) ) ) {
				return new \WP_Error(
					'rest_cannot_edit',
					__( 'Sorry, you are not allowed to create tables for this post as this user.', 'dynamic-table-blocks' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		} else {
			return new \WP_Error(
				'missing_post_id',
				__( 'Post ID is missing from request.', 'dynamic-table-blocks' ),
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
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( (int) 0 !== (int) $request['id'] ) {
			return new \WP_Error(
				'rest_table_exists',
				__( 'Cannot create existing post.', 'dynamic-table-blocks' ),
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

		$table = get_table( $table_id );
		if ( is_wp_error( $table ) ) {
			if ( ! $table->get_error_data() ) {
				$table->add_data( array( 'status' => 500 ) );
			}
			return $table;
		}

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
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error True if the request has access to update the item, WP_Error
	 *  object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		// Permissions for editing a table are based upon the underlying post to which
		// it is attached.

		// Determine if this is from internal maintenance, verify signature, and authorize if verified
		if ( $this->verify_internal_signature( $request ) ) {
			$this->maintenance_request = true;
			return true;
		}

		$existing_table  = $this->get_table( $request['id'], true );
		$request_post_id = isset( $request['header']['post_id'] )
			? (int) $request['header']['post_id']
			: null;

		if ( is_wp_error( $existing_table ) ) {
			return $existing_table;
		}

		$existing_post_id = isset( $existing_table['header']['post_id'] )
			? (int) $existing_table['header']['post_id']
			: null;

		$post_id = null !== $request_post_id ? $request_post_id : $existing_post_id;

		if ( null !== $post_id ) {
			if ( $post_id !== 0 ) {
				$post = $this->get_post( $post_id );
				if ( is_wp_error( $post ) ) {
					return $post;
				}
				$post_type = get_post_type_object( $post->post_type );

				if ( $post && ! $this->check_update_permission( $post ) ) {
					return new \WP_Error(
						'rest_cannot_edit',
						__( 'Sorry, you are not allowed to update tables for this post as this user.', 'dynamic-table-blocks' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}

				if ( ! empty( $request['author'] ) && get_current_user_id() !== $request['author'] && ! current_user_can( $post_type->cap->edit_others_posts ) ) {
					return new \WP_Error(
						'rest_cannot_edit_others',
						__( 'Sorry, you are not allowed to update tables for this post as this user.', 'dynamic-table-blocks' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}

			if ( $post_id === 0 && ( ! ( current_user_can( 'publish_posts' ) || current_user_can( 'publish_pages' ) ) ) ) {
				return new \WP_Error(
					'rest_cannot_edit',
					__( 'Sorry, you are not allowed to update tables for this post as this user.', 'dynamic-table-blocks' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		} else {
			return new \WP_Error(
				'missing_post_id',
				__( 'Post ID is missing from request.', 'dynamic-table-blocks' ),
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
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$valid_check = $this->get_table( $request['id'] );
		if ( is_wp_error( $valid_check ) ) {
			return $valid_check;
		}

		$table = $this->prepare_item_for_database( $request );

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

		$request->set_param( 'context', 'edit' );
		$response = $this->prepare_item_for_response( $table, $request );

		return rest_ensure_response( $response );
	}

	/**
	 * Checks if a given request has access to delete a table.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error True if the request has access to delete the item, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		// Determine if this is from internal maintenance, verify signature, and authorize if verified
		if ( $this->verify_internal_signature( $request ) ) {
			$this->maintenance_request = true;
			return true;
		}

		$table = $this->get_table( $request['id'] );

		if ( is_wp_error( $table ) ) {
			return new \WP_Error(
				'rest_table_invalid_id',
				__( 'Invalid table ID.', 'dynamic-table-blocks' ),
				array( 'status' => 404 )
			);
		}

		// Permissions for deleting a table are based upon the underlying post to which
		// it is attached.
		if ( isset( $table['header']['post_id'] ) ) {
			$post_id = (int) $table['header']['post_id'];

			if ( ! $post_id === 0 ) {
				$post = $this->get_post( $post_id );
				if ( is_wp_error( $post ) ) {
					return new \WP_Error(
						'rest_table_invalid_id',
						__( 'Invalid Post ID.', 'dynamic-table-blocks' ),
						array( 'status' => 404 )
					);
				}

				$post_type = get_post_type_object( $post->post_type );

				if ( $post && ! $this->check_update_permission( $post ) ) {
					return new \WP_Error(
						'rest_cannot_edit',
						__( 'Sorry, you are not allowed to delete tables for this post as this user.', 'dynamic-table-blocks' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}

				if ( ! empty( $request['author'] ) && get_current_user_id() !== $request['author'] && ! current_user_can( $post_type->cap->edit_others_posts ) ) {
					return new \WP_Error(
						'rest_cannot_edit_others',
						__( 'Sorry, you are not allowed to delete tables for this post as this user.', 'dynamic-table-blocks' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}

			if ( $post_id === 0 && ( ! ( current_user_can( 'publish_posts' ) || current_user_can( 'publish_pages' ) ) ) ) {
				return new \WP_Error(
					'rest_cannot_edit',
					__( 'Sorry, you are not allowed to delete tables for this post as this user.', 'dynamic-table-blocks' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		} elseif ( 'edit' === $request['context'] && ! current_user_can( 'edit_posts' ) ) {
			return new \WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to delete this post.', 'dynamic-table-blocks' ),
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
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {

		if ( $this->maintenance_request ) {
			$table = $this->get_table( $request['id'], true );
		} else {
			$table = $this->get_table( $request['id'] );
		}

		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$id = $request['id'];
		$request->set_param( 'context', 'edit' );

		if ( $this->maintenance_request ) {
			$response_result = array(
				'deleted' => true,
			);
		} else {
			$previous        = $this->prepare_item_for_response( $table, $request );
			$response_result = array(
				'deleted'  => true,
				'previous' => $previous->get_data(),
			);
		}
		$result   = delete_table( $id, $this->maintenance_request );
		$response = new \WP_REST_Response();
		$response->set_data( $response_result );

		if ( ! $result ) {
			return new \WP_Error(
				'rest_cannot_delete',
				__( 'The table cannot be deleted.', 'dynamic-table-blocks' ),
				array( 'status' => 500 )
			);
		}
		return rest_ensure_response( $response );
	}

	/**
	 * Checks if a table can be read.
	 *
	 * @since 1.4.0
	 *
	 * @param object $table Post object.
	 * @return bool Whether the post can be edited.
	 */
	protected function check_read_permission( $table ) {
		$post_id = (int) $table['header']['post_id'];

		if ( 0 === $post_id ) {
			return current_user_can( 'publish_posts' ) || current_user_can( 'publish_pages' );
		}

		$post = $this->get_post( $post_id );
		if ( is_wp_error( $post ) ) {
			return false;
		}

		return $this->check_update_permission( $post );
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
	 * Determines the allowed query_vars for a get_items() response and prepares
	 * them for WP_Query.
	 *
	 * @since 1.4.0
	 *
	 * @param array            $prepared_args Optional. Prepared WP_Query arguments. Default empty array.
	 * @param \WP_REST_Request $request       Optional. Full details about the request.
	 * @return array Items query arguments.
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		if ( ! is_array( $prepared_args ) ) {
			$prepared_args = array();
		}

		$query_args = $prepared_args;

		// Map to proper WP_Query orderby param.
		if ( isset( $query_args['orderby'] ) && isset( $request['orderby'] ) ) {
			$orderby_mappings = array(
				'id'           => 'ID',
				'include'      => 'table__in',
				'name'         => 'table_name',
				'include_name' => 'table_name__in',
			);

			if ( isset( $orderby_mappings[ $request['orderby'] ] ) ) {
				$query_args['orderby'] = $orderby_mappings[ $request['orderby'] ];
			}
		}

		return $query_args;
	}

	/**
	 * Prepares a single table for create or update.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \stdClass|\WP_Error Post object or WP_Error.
	 */
	protected function prepare_item_for_database( $request ) {
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
							__( 'Header ID does not match Request ID.', 'dynamic-table-blocks' ),
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
			( ! $current_status || $current_status !== $request['header']['status'] ) ) {
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
								__( 'Row table ID does not match Request ID.', 'dynamic-table-blocks' ),
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
								__( 'Row table ID does not match Request ID.', 'dynamic-table-blocks' ),
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
								__( 'Row table ID does not match Request ID.', 'dynamic-table-blocks' ),
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

		return $prepared_table;
	}

	/**
	 * Prepares a single table output for response.
	 *
	 * @since 1.0.0
	 *
	 * @param Table            $item      Table object.
	 * @param \WP_REST_Request $request   Request object.
	 * @return \WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// Restores the more descriptive, specific name for use within this method.
		$table  = $item;
		$fields = $this->get_fields_for_response( $request );

		// Base fields for every table.
		$data = array();

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = (int) $table['id'];
		}

		/**
		 * Header Block
		 */
		if ( rest_is_field_included( 'header.id', $fields ) ) {
			$data['header']['id'] = (int) $table['header']['id'];
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

		if ( rest_is_field_included( 'header.table_name', $fields ) &&
			isset( $table['header']['table_name'] ) ) {
			$data['header']['table_name'] = $table['header']['table_name'];
		}

		if ( rest_is_field_included( 'header.attributes', $fields ) &&
			isset( $table['header']['attributes'] ) ) {
			$data['header']['attributes'] = $table['header']['attributes'];
		}

		if ( rest_is_field_included( 'header.classes', $fields ) &&
			isset( $table['header']['classes'] ) ) {
			$data['header']['classes'] = $table['header']['classes'];
		}

		if ( rest_is_field_included( 'header.total_rows', $fields ) &&
			isset( $table['header']['total_rows'] ) ) {
			$data['header']['total_rows'] = $table['header']['total_rows'];
		}

		if ( rest_is_field_included( 'header.total_columns', $fields ) &&
			isset( $table['header']['total_columns'] ) ) {
			$data['header']['total_columns'] = $table['header']['total_columns'];
		}

		/**
		 * Row Block
		 */
		if ( isset( $table['rows'] ) ) {
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
		}

		/**
		 * Columns Block
		 */
		if ( isset( $table['columns'] ) ) {
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
		}

		/**
		 * Cells Block
		 */
		if ( isset( $table['cells'] ) ) {
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
		}

		/**
		 * Column Data Structures
		 */
		if ( isset( $table['column_structures'] ) ) {
			foreach ( $table['column_structures'] as $key => $column ) {
				if ( rest_is_field_included( 'column_structures.column.column_id', $fields ) ) {
					$data['column_structures'][ $key ]['column_id'] = $column['column_id'];
				}

				if ( rest_is_field_included( 'column_structures.column.column_name', $fields ) ) {
					$data['column_structures'][ $key ]['column_name'] = $column['column_name'];
				}

				if ( rest_is_field_included( 'column_structures.column.column_data_type', $fields ) &&
					isset( $column['column_data_type'] ) ) {
					$data['column_structures'][ $key ]['column_data_type'] = $column['column_data_type'];
				}

				if ( rest_is_field_included( 'column_structures.column.column_data_format', $fields ) &&
					isset( $column['column_data_format'] ) ) {
					$data['column_structures'][ $key ]['column_data_format'] = $column['column_data_format'];
				}
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		return $response;
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
			'title'      => 'dynamic-table-blocks',
			'type'       => 'object',
			'properties' => array(
				'id'                => array(
					'description' => __( 'Unique identifier for the table.', 'dynamic-table-blocks' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'title'             => array(
					'description' => __( 'Table name which can include html style elements.', 'dynamic-table-blocks' ),
					'type'        => 'string',
				),
				'header'            => array(
					'description' => __( 'Tablewide properties.', 'dynamic-table-blocks' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'id'              => array(
							'description' => __( 'Table ID.', 'dynamic-table-blocks' ),
							'type'        => 'integer',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
						),
						'block_table_ref' => array(
							'description' => __( 'Link to specific table block on post.', 'dynamic-table-blocks' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
						),
						'status'          => array(
							'description' => __( 'Status of table within context of its assigned post.', 'dynamic-table-blocks' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
						),
						'post_id'         => array(
							'description' => __( 'Unique identifier for the post.', 'dynamic-table-blocks' ),
							'type'        => 'integer',
							'context'     => array( 'view', 'edit' ),
						),
						'table_name'      => array(
							'description' => __( 'Table name which can include html style elements.', 'dynamic-table-blocks' ),
							'type'        => 'string',
						),
						'attributes'      => array(
							'description' => __( 'Tablewide attributes.', 'dynamic-table-blocks' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit' ),
						),
						'classes'         => array(
							'description' => __( 'Tablewide css classes.', 'dynamic-table-blocks' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
						),
						'total_rows'      => array(
							'description' => __( 'Number of rows in the table.', 'dynamic-table-blocks' ),
							'type'        => 'integer',
							'readonly'    => true,
							'context'     => array( 'view' ),
						),
						'total_columns'   => array(
							'description' => __( 'Number of columns in the table.', 'dynamic-table-blocks' ),
							'type'        => 'integer',
							'readonly'    => true,
							'context'     => array( 'view' ),
						),
					),
				),
				'rows'              => array(
					'description' => __( 'Table rows collection', 'dynamic-table-blocks' ),
					'type'        => 'array',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'row' => array(
							'description' => __( 'Table row', 'dynamic-table-blocks' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit' ),
							'properties'  => array(
								'table_id'   => array(
									'description' => __( 'Table ID.', 'dynamic-table-blocks' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
								),
								'row_id'     => array(
									'description' => __( 'Table Row Number.', 'dynamic-table-blocks' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
								),
								'attributes' => array(
									'description' => __( 'Attributes for the row and inhereted by cells.', 'dynamic-table-blocks' ),
									'type'        => 'object',
									'context'     => array( 'view', 'edit' ),
								),
								'classes'    => array(
									'description' => __( 'Css classes for the row and inhereted by cells.', 'dynamic-table-blocks' ),
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
								),
							),
						),
					),
				),
				'column_structures' => array(
					'description' => __( 'Table columns data structure collection', 'dynamic-table-blocks' ),
					'type'        => 'array',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'column' => array(
							'description' => __( 'Table column', 'dynamic-table-blocks' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit', 'dynamic-table-blocks' ),
							'properties'  => array(
								'column_id'          => array(
									'description' => __( 'Table Column Number.', 'dynamic-table-blocks' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
								),
								'column_name'        => array(
									'description' => __( 'Table Column Name.', 'dynamic-table-blocks' ),
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
								),
								'column_data_type'   => array(
									'description' => __( 'Data type', 'dynamic-table-blocks' ),
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
								),
								'column_data_format' => array(
									'description' => __( 'Data type format', 'dynamic-table-blocks' ),
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
								),
							),
						),
					),
				),
				'columns'           => array(
					'description' => __( 'Table columns collection', 'dynamic-table-blocks' ),
					'type'        => 'array',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'column' => array(
							'description' => __( 'Table column', 'dynamic-table-blocks' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit', 'dynamic-table-blocks' ),
							'properties'  => array(
								'table_id'    => array(
									'description' => __( 'Table ID.', 'dynamic-table-blocks' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
								),
								'column_id'   => array(
									'description' => __( 'Table Column Number.', 'dynamic-table-blocks' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
								),
								'column_name' => array(
									'description' => __( 'Table Column Name.', 'dynamic-table-blocks' ),
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
								),
								'attributes'  => array(
									'description' => __( 'Column attributes inhereted by cells.', 'dynamic-table-blocks' ),
									'type'        => 'object',
									'context'     => array( 'view', 'edit' ),
								),
								'classes'     => array(
									'description' => __( 'CSS column classes inhereted by cells.', 'dynamic-table-blocks' ),
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
								),
							),
						),
					),
				),
				'cells'             => array(
					'description' => __( 'Table cells collection.', 'dynamic-table-blocks' ),
					'type'        => 'array',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'cell' => array(
							'description' => __( 'Table cell', 'dynamic-table-blocks' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit' ),
							'properties'  => array(
								'table_id'   => array(
									'description' => __( 'Table ID.', 'dynamic-table-blocks' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
								),
								'column_id'  => array(
									'description' => __( 'Table Column Number.', 'dynamic-table-blocks' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
								),
								'row_id'     => array(
									'description' => __( 'Table Row Number.', 'dynamic-table-blocks' ),
									'type'        => 'integer',
									'context'     => array( 'view', 'edit' ),
								),
								'attributes' => array(
									'description' => __( 'Cell attributes.', 'dynamic-table-blocks' ),
									'type'        => 'object',
									'context'     => array( 'view', 'edit' ),
								),
								'classes'    => array(
									'description' => __( 'CSS cell classes.', 'dynamic-table-blocks' ),
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
								),
								'content'    => array(
									'description' => __( 'Cell visible content which can include html style elements.', 'dynamic-table-blocks' ),
									'type'        => 'string',
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

			$this->schema = $schema;
			return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Validate permission header passed for internal API requests.
	 *
	 * @since 1.4.0
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return bool Is valid?
	 */
	function verify_internal_signature( $request ) {
		$key = dtbk_signing_key();

		$body = $request->get_body() ?? '';
		$msg  = strtoupper( $request->get_method() ) . "\n" . $request->get_route() . "\n" . $body;

		$expected = hash_hmac( 'sha256', $msg, $key );
		$header   = $request->get_header( 'x-dtbk-signature' );

		return $header && hash_equals( $expected, $header );
	}

	/**
	 * List of valid query parameters for the get_items endpoint.
	 *
	 * @since 1.4.0
	 *
	 * @return array Item schema data.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['context']['default'] = 'view';

		$query_params['exclude'] = array(
			'description' => __( 'Ensure result set excludes specific IDs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		$query_params['include'] = array(
			'description' => __( 'Limit result set to specific IDs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		$query_params['post'] = array(
			'description' => __( 'Limit result set to specific post IDs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		$query_params['post_exclude'] = array(
			'description' => __( 'Ensure result set excludes specific post IDs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		$query_params['name'] = array(
			'description' => __( 'Limit result set to tables with one or more specific table name.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		);

		$query_params['status'] = array(
			'default'     => array( 'saved' ),
			'description' => __( 'Limit result set to items with a table status.', 'dynamic-table-blocks' ),
			'type'        => 'array',
			'items'       => array(
				'enum' => array_merge( array_keys( get_table_statuses() ), array( 'any' ) ),
				'type' => 'string',
			),
		);

		$query_params['search_semantics'] = array(
			'description' => __( 'How to interpret the search input.' ),
			'type'        => 'string',
			'enum'        => array( 'exact' ),
		);

		$query_params['order'] = array(
			'description' => __( 'Order sort attribute ascending or descending.' ),
			'type'        => 'string',
			'default'     => 'desc',
			'enum'        => array( 'asc', 'desc' ),
		);

		$query_params['orderby'] = array(
			'description' => __( 'Sort collection by post attribute.' ),
			'type'        => 'string',
			'default'     => 'id',
			'enum'        => array(
				'id',
				'status',
				'post',
				'include',
				'name',
			),
		);

		$query_params['search_columns'] = array(
			'default'     => array(),
			'description' => __( 'Array of column names to be searched.' ),
			'type'        => 'array',
			'items'       => array(
				'enum' => array( 'post_title', 'post_content', 'post_excerpt' ),
				'type' => 'string',
			),
		);

		return $query_params;
	}
}
