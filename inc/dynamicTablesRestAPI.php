<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'dynamicTablesAPI.php';

class Dynamic_Tables_REST_Controller extends WP_REST_Controller
{

    /**
     * Temporary properties until full class is built
     */
    // public string $namespace = '';
    // public string $rest_base = '';

    public function __construct()
    {
        $this->namespace = 'dynamic-tables/v1';
        $this->rest_base = 'tables';
        // $this->register_routes();
        error_log('Tables REST initiated');
    }

    public function register_routes()
    {

        register_rest_route($this->namespace,
            '/' . $this->rest_base,
            array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array($this, 'get_items'),
                    'permission_callback' => array($this, 'test_permissions'),
                    // 'args' => $this->get_collection_params(),
                ),
                array(
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'create_item'),
                    'permission_callback' => array($this, 'create_item_permissions_check'),
                    'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
                ),
                'schema' => array($this, 'get_public_item_schema'),
            )
        );

        $get_item_args = array(
            'context' => $this->get_context_param(array('default' => 'view')),
        );

        register_rest_route($this->namespace,
            '/' . $this->rest_base . '/(?P<id>[\d]+)',
            array(
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for this table'),
                        'type' => 'integer',
                    ),
                ),
                array(
                    'methods' => WP_REST_SERVER::READABLE,
                    'callback' => array($this, 'get_item'),
                    'permission_callback' => array($this, 'get_item_permissions_check'),
                    'args' => $get_item_args,
                ),
                array(
                    'methods' => WP_REST_SERVER::EDITABLE,
                    'callback' => array($this, 'update_item'),
                    'permission_callback' => array($this, 'update_item_permissions_check'),
                    'args' => $this->get_endpoint_args_for_item_schema(WP_REST_SERVER::EDITABLE),
                ),
                array(
                    'methods' => WP_REST_Server::DELETABLE,
                    'callback' => array($this, 'delete_item'),
                    'permission_callback' => array($this, 'delete_item_permissions_check'),
                ),
                'schema' => array($this, 'get_public_item_schema'),
            )
        );
    }

    public function get_items($request)
    {

    }

    public function get_item_permissions_check($request)
    {
        // error_log('Started get_item_permissions_check');
        // error_log('Request Route = ' . $request->get_route());
        // error_log('Request Method = ' . $request->get_method());
        // error_log('Request Headers = ' . json_encode($request->get_headers()));

        $table = $this->get_table($request[ 'id' ]);
        error_log('Table = ' . json_encode($table));

        if (is_wp_error($table)) {
            error_log('Error Getting Table in Item Permissions');
            error_log('$error variable = ' . json_encode($table));
            return $table;
        }

        if (isset($table[ 'header' ][ 'post_id' ])) {
            $postId = (int) $table[ 'header' ][ 'post_id' ];
            if ($postId !== 0) {

                $post = $this->get_post($postId);
                if (is_wp_error($post)) {
                    error_log('Error - Getting Post');
                    return $post;
                }

                if ('edit' === $request[ 'context' ] && $post && !$this->check_update_permission($post)) {
                    error_log('Error - No Permissions to Post');
                    return new WP_Error(
                        'rest_forbidden_context',
                        __('Sorry, you are not allowed to edit this post.'),
                        array('status' => rest_authorization_required_code())
                    );
                }
            }

            if ((int) $postId === 0) {
                if ('edit' === $request[ 'context' ] && !current_user_can('edit_posts')) {
                    error_log('Error - No General Permissions to Post');
                    return new WP_Error(
                        'rest_forbidden_context',
                        __('Sorry, you are not allowed to edit this post.'),
                        array('status' => rest_authorization_required_code())
                    );
                }
            }
        } else {
            error_log('Error - No Post ID');
            return new WP_Error(
                'missing_post_id',
                __('Post ID is missing from request.'),
                array('status' => 500)
            );
        }

        error_log('Finished get_item_permissions_check');

        return true;
    }

    /**
     * Retrieves a single table.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function get_item($request)
    {
        error_log('Request = ' . json_encode($request));
        error_log('Request Arguments = ' . json_encode($request->get_attributes()));
        $table = $this->get_table($request[ 'id' ]);
        if (is_wp_error($table)) {
            return $table;
        }

        $data = $this->prepare_item_for_response($table, $request);
        $response = rest_ensure_response($data);

        return $response;
    }

    /**
     * Gets the table, if the ID is valid.
     *
     * @param int $id Supplied ID.
     * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
     */
    protected function get_table($id)
    {
        error_log('In rest get table');
        $error = new WP_Error(
            'rest_table_invalid_id',
            __('Invalid table ID.'),
            array('status' => 404)
        );

        if ((int) $id <= 0) {
            return $error;
        }

        error_log('$error variable = ' . json_encode($error));

        $table = get_table((int) $id);
        if (is_wp_error($table)) {
            error_log('Error Getting Table');
            error_log('$error variable = ' . json_encode($error));
            return $error;
        }

        // var_dump($table);
        if (empty($table)) {
            return $error;
        }

        error_log('Finished  rest get table');
        return $table;
    }

    /**
     * Gets the post, if the ID is valid.
     *
     * @param int $id Supplied ID.
     * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
     */
    protected function get_post($id)
    {
        $error = new WP_Error(
            'rest_post_invalid_id',
            __('Invalid post ID.'),
            array('status' => 500)
        );

        error_log('Post id = ' . (int) $id);
        if ((int) $id < 0) {
            return $error;
        }

        $error = new WP_Error(
            'rest_post_invalid',
            __('Invalid post'),
            array('status' => 404)
        );

        $post = get_post((int) $id);
        if (empty($post) || empty($post->ID)) {
            return $error;
        }

        return $post;
    }

    /**
     * Checks if a given request has access to create items.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
     */
    public function create_item_permissions_check($request)
    {
        // error_log('Started create_item_permissions_check');
        // error_log($request[ 'id' ]);

        if ((int) $request[ 'id' ] !== (int) 0) {
            return new WP_Error(
                'rest_table_exists',
                __('Cannot create existing table.'),
                array('status' => 400)
            );
        }

        // Permissions for creating a table are based upon the underlying post to which
        // it is attached.
        if (isset($request[ 'header' ][ 'post_id' ])) {
            $postId = (int) $request[ 'header' ][ 'post_id' ];

            // REMOVE Bypass permission check for testing
            return true;

            if ($postId !== 0) {
                $post = $this->get_post($postId);
                if (is_wp_error($post)) {
                    return $post;
                }

                $post_type = get_post_type_object($post->post_type);

                if ($post && !$this->check_update_permission($post)) {
                    return new WP_Error(
                        'rest_cannot_edit',
                        __('Sorry, you are not allowed to create tables for this post as this user.'),
                        array('status' => rest_authorization_required_code())
                    );
                }

                if (!empty($request[ 'author' ]) && get_current_user_id() !== $request[ 'author' ] && !current_user_can($post_type->cap->edit_others_posts)) {
                    return new WP_Error(
                        'rest_cannot_edit_others',
                        __('Sorry, you are not allowed to create tables for this post as this user.'),
                        array('status' => rest_authorization_required_code())
                    );
                }
            }

            if ($postId === 0 && (!(current_user_can('publish_posts') || current_user_can('publish_pages')))) {
                return new WP_Error(
                    'rest_cannot_edit',
                    __('Sorry, you are not allowed to create tables for this post as this user.'),
                    array('status' => rest_authorization_required_code())
                );
            }
        } else {
            return new WP_Error(
                'missing_post_id',
                __('Post ID is missing from request.'),
                array('status' => 500)
            );
        }

        error_log('Finished create_item_permissions_check');
        return true;
    }

    /**
     * Creates a single table.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function create_item($request)
    {
        error_log('Table POST - ' . $request[ 'id' ]);

        if ((int) $request[ 'id' ] !== (int) 0) {
            return new WP_Error(
                'rest_table_exists',
                __('Cannot create existing post.'),
                array('status' => 400)
            );
        }

        $prepared_table = $this->prepare_item_for_database($request);

        if (is_wp_error($prepared_table)) {
            return $prepared_table;
        }
        $table_id = create_table_data($prepared_table, true);
        error_log('Prepared Table ID = ' . $table_id);

        if (is_wp_error($table_id)) {
            if ('db_insert_error' === $table_id->get_error_code() ||
                'db_update_error' === $table_id->get_error_code() ||
                'db_read_error' === $table_id->get_error_code()) {
                $table_id->add_data(array('status' => 500));
            } else {
                $table_id->add_data(array('status' => 400));
            }

            return $table_id;
        }

        $table = get_table($table_id);
        error_log('Prepared Table retrieved- ' . json_encode($table));

        /**
         * Reserve for future use
         */

        //  $fields_update = $this->update_additional_fields_for_object($table, $request);

        // if (is_wp_error($fields_update)) {
        //     return $fields_update;
        // }

        $request->set_param('context', 'edit');
        $response = $this->prepare_item_for_response($table, $request);
        $response = rest_ensure_response($response);

        $response->set_status(201);

        return $response;
    }

    public function update_item_permissions_check($request)
    {
        // Permissions for editing a table are based upon the underlying post to which
        // it is attached.
        if (isset($request[ 'header' ][ 'post_id' ])) {
            $postId = (int) $request[ 'header' ][ 'post_id' ];

            // REMOVE - Support testing
            // return true;

            if ($postId !== 0) {
                $post = $this->get_post($postId);
                if (is_wp_error($post)) {
                    return $post;
                }
                $post_type = get_post_type_object($post->post_type);

                if ($post && !$this->check_update_permission($post)) {
                    return new WP_Error(
                        'rest_cannot_edit',
                        __('Sorry, you are not allowed to update tables for this post as this user.'),
                        array('status' => rest_authorization_required_code())
                    );
                }

                if (!empty($request[ 'author' ]) && get_current_user_id() !== $request[ 'author' ] && !current_user_can($post_type->cap->edit_others_posts)) {
                    return new WP_Error(
                        'rest_cannot_edit_others',
                        __('Sorry, you are not allowed to update tables for this post as this user.'),
                        array('status' => rest_authorization_required_code())
                    );
                }
            }

            if ($postId === 0 && (!(current_user_can('publish_posts') || current_user_can('publish_pages')))) {
                return new WP_Error(
                    'rest_cannot_edit',
                    __('Sorry, you are not allowed to update tables for this post as this user.'),
                    array('status' => rest_authorization_required_code())
                );
            }
        } else {
            return new WP_Error(
                'missing_post_id',
                __('Post ID is missing from request.'),
                array('status' => 500)
            );
        }

        return true;
    }

    /**
     * Updates a single table.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function update_item($request)
    {
        error_log('Entered update_item');

        $valid_check = $this->get_table($request[ 'id' ]);
        if (is_wp_error($valid_check)) {
            return $valid_check;
        }

        $table = $this->prepare_item_for_database($request);

        if (is_wp_error($table)) {
            return $table;
        }

        // Convert the post object to an array, otherwise wp_update_post() will expect non-escaped input.
        // $table_id = wp_update_post($table, true, false);

        $table_id = update_table_data($table, true);

        if (is_wp_error($table_id)) {
            if ('db_insert_error' === $table_id->get_error_code() ||
                'db_update_error' === $table_id->get_error_code() ||
                'db_read_error' === $table_id->get_error_code()) {
                $table_id->add_data(array('status' => 500));
            } else {
                $table_id->add_data(array('status' => 400));
            }
            return $table_id;
        }

        error_log('Table ID for Response = ' . $table_id);
        $table = get_table($table_id);
        if (is_wp_error($table)) {
            return $table;
        }

        /**
         * Reserve for future use
         */

        // $fields_update = $this->update_additional_fields_for_object($post, $request);

        // if (is_wp_error($fields_update)) {
        //     return $fields_update;
        // }

        $request->set_param('context', 'edit');

        /** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
        // do_action("rest_after_insert_{$this->post_type}", $post, $request, false);

        // wp_after_insert_post($post, true, $post_before);

        $response = $this->prepare_item_for_response($table, $request);

        return rest_ensure_response($response);
    }

    /**
     * Checks if a given request has access to delete a post.
     *
     * @since 4.7.0
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return true|WP_Error True if the request has access to delete the item, WP_Error object otherwise.
     */
    public function delete_item_permissions_check($request)
    {
        $table = $this->get_table($request[ 'id' ]);
        if (is_wp_error($table)) {
            // error_log('Error Getting Table in Item Permissions');
            // error_log('$error variable = ' . json_encode($table));
            return $table;
        }

        if (isset($table[ 'header' ][ 'post_id' ])) {
            $postId = (int) $table[ 'header' ][ 'post_id' ];

            if ($postId !== 0) {
                error_log('delete table - get post in');
                $post = $this->get_post($postId);
                error_log('delete table - get post out');
                if (is_wp_error($post)) {
                    return $post;
                }
                $post_type = get_post_type_object($post->post_type);

                if ($post && !$this->check_update_permission($post)) {
                    return new WP_Error(
                        'rest_cannot_edit',
                        __('Sorry, you are not allowed to delete tables for this post as this user.'),
                        array('status' => rest_authorization_required_code())
                    );
                }

                if (!empty($request[ 'author' ]) && get_current_user_id() !== $request[ 'author' ] && !current_user_can($post_type->cap->edit_others_posts)) {
                    return new WP_Error(
                        'rest_cannot_edit_others',
                        __('Sorry, you are not allowed to delete tables for this post as this user.'),
                        array('status' => rest_authorization_required_code())
                    );
                }
            }

            if ($postId === 0 && (!(current_user_can('publish_posts') || current_user_can('publish_pages')))) {
                return new WP_Error(
                    'rest_cannot_edit',
                    __('Sorry, you are not allowed to delete tables for this post as this user.'),
                    array('status' => rest_authorization_required_code())
                );
            }

        } else {
            if ('edit' === $request[ 'context' ] && !current_user_can('edit_posts')) {
                return new WP_Error(
                    'rest_forbidden_context',
                    __('Sorry, you are not allowed to delete this post.'),
                    array('status' => rest_authorization_required_code())
                );
            }
        }

        return true;

    }

    /**
     * Deletes a single post.
     *
     * @since 4.7.0
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function delete_item($request)
    {
        error_log("Deleting Table - " . $request[ 'id' ]);
        $table = $this->get_table($request[ 'id' ]);
        if (is_wp_error($table)) {
            return $table;
        }

        $id = $table[ 'id' ];
        $request->set_param('context', 'edit');

        $previous = $this->prepare_item_for_response($table, $request);
        $result = delete_table($id);
        $response = new WP_REST_Response();
        $response->set_data(
            array(
                'deleted' => true,
                'previous' => $previous->get_data(),
            )
        );

        if (!$result) {
            return new WP_Error(
                'rest_cannot_delete',
                __('The table cannot be deleted.'),
                array('status' => 500)
            );
        }

        return rest_ensure_response($response);
    }

    /**
     * Checks if a post can be edited.
     *
     * @param WP_Post $post Post object.
     * @return bool Whether the post can be edited.
     */
    protected function check_update_permission($post)
    {
        $post_type = get_post_type_object($post->post_type);

        if (!$this->check_is_post_type_allowed($post_type)) {
            return false;
        }

        return current_user_can('edit_post', $post->ID);

    }

    protected function check_delete_permission($post)
    {
        $post_type = get_post_type_object($post->post_type);

        if (!$this->check_is_post_type_allowed($post_type)) {
            return false;
        }

        return current_user_can('delete_post', $post->ID);
    }

    /**
     * Checks if a given post type can be viewed or managed.
     *
     * @param WP_Post_Type|string $post_type Post type name or object.
     * @return bool Whether the post type is allowed in REST.
     */
    protected function check_is_post_type_allowed($post_type)
    {
        if (!is_object($post_type)) {
            $post_type = get_post_type_object($post_type);
        }

        if (!empty($post_type) && !empty($post_type->show_in_rest)) {
            return true;
        }

        return false;
    }

    /**
     * Prepares a single table for create or update.
     *
     * @param WP_REST_Request $request Request object.
     * @return stdClass|WP_Error Post object or WP_Error.
     */
    protected function prepare_item_for_database($request)
    {
        $prepared_table = new stdClass();
        $current_status = '';

        // Table ID.
        if (isset($request[ 'id' ]) && (int) $request[ 'id' ] !== 0) {
            $existing_table = $this->get_table($request[ 'id' ]);
            if (is_wp_error($existing_table)) {
                return $existing_table;
            }

            // var_dump($existing_table[ 'id' ]);
            $prepared_table->id = $existing_table[ 'id' ];
            $current_status = $existing_table[ 'header' ][ 'status' ];
        }

        $schema = $this->get_item_schema();
        error_log('Test Schema Function: ' . json_encode($schema));

        /**
         * Process Table Header Block
         */

        if (!empty($schema[ 'properties' ][ 'header' ])) {
            $schema_header = $schema[ 'properties' ][ 'header' ];

            // Table Header ID.
            if (!empty($schema_header[ 'properties' ][ 'id' ])) {
                if (isset($request[ 'header' ][ 'id' ])) {
                    if ((int) $request[ 'header' ][ 'id' ] !== (int) $request[ 'id' ]) {
                        return new WP_Error(
                            'rest_header_id_integrity',
                            __('Header ID does not match Request ID.'),
                            array('status' => 400)
                        );
                    }
                    $prepared_table->header[ 'id' ] = (int) $request[ 'header' ][ 'id' ];
                }
            }

            // Table post block cross reference.
            if (!empty($schema_header[ 'properties' ][ 'block_table_ref' ]) &&
                isset($request[ 'header' ][ 'block_table_ref' ])) {
                $prepared_table->header[ 'block_table_ref' ] = $request[ 'header' ][ 'block_table_ref' ];
            }

            // Table status.
            if (!empty($schema_header[ 'properties' ][ 'status' ]) &&
                isset($request[ 'header' ][ 'status' ]) &&
                (!$current_status || $current_status !== $request[ 'status' ])) {
                $prepared_table->header[ 'status' ] = $request[ 'header' ][ 'status' ];
            }

            // Table Post ID cross reference.
            if (!empty($schema_header[ 'properties' ][ 'post_id' ]) &&
                isset($request[ 'header' ][ 'post_id' ])) {
                $prepared_table->header[ 'post_id' ] = (int) $request[ 'header' ][ 'post_id' ];
            }

            // Table name.
            if (!empty($schema_header[ 'properties' ][ 'table_name' ]) &&
                isset($request[ 'header' ][ 'table_name' ])) {
                $prepared_table->header[ 'table_name' ] = $request[ 'header' ][ 'table_name' ];
            }

            // Table attributes.
            if (!empty($schema_header[ 'properties' ][ 'attributes' ]) &&
                isset($request[ 'header' ][ 'table_name' ])) {
                $prepared_table->header[ 'attributes' ] = $request[ 'header' ][ 'attributes' ];
            }

            // Table css classes.
            if (!empty($schema_header[ 'properties' ][ 'classes' ]) &&
                isset($request[ 'header' ][ 'table_name' ])) {
                $prepared_table->header[ 'classes' ] = $request[ 'header' ][ 'classes' ];
            }
        }

        /**
         * Process Table Row Block for each row in the table
         */
        if (!empty($schema[ 'properties' ][ 'rows' ])) {
            $schema_rows = $schema[ 'properties' ][ 'rows' ];

            foreach ($request[ 'rows' ] as $key => $row) {
                $schema_row = $schema_rows[ 'properties' ][ 'row' ];

                // Row Table ID
                if (!empty($schema_row[ 'properties' ][ 'table_id' ])) {
                    if (isset($request[ 'rows' ][ $key ][ 'table_id' ])) {
                        if ((int) $request[ 'rows' ][ $key ][ 'table_id' ] !== (int) $request[ 'id' ]) {
                            return new WP_Error(
                                'rest_header_id_integrity',
                                __('Row table ID does not match Request ID.'),
                                array('status' => 400)
                            );
                        }
                        $prepared_table->rows[ $key ][ 'table_id' ] = (int) $request[ 'rows' ][ $key ][ 'table_id' ];
                    }
                }

                // Row's Row ID
                if (!empty($schema_row[ 'properties' ][ 'row_id' ]) &&
                    isset($request[ 'rows' ][ $key ][ 'row_id' ])) {
                    $prepared_table->rows[ $key ][ 'row_id' ] = (int) $request[ 'rows' ][ $key ][ 'row_id' ];
                }

                // Row attributes
                if (!empty($schema_row[ 'properties' ][ 'attributes' ]) &&
                    isset($request[ 'rows' ][ $key ][ 'attributes' ])) {
                    $prepared_table->rows[ $key ][ 'attributes' ] = $request[ 'rows' ][ $key ][ 'attributes' ];
                }

                // Row css classes
                if (!empty($schema_row[ 'properties' ][ 'classes' ]) &&
                    isset($request[ 'rows' ][ $key ][ 'classes' ])) {
                    $prepared_table->rows[ $key ][ 'classes' ] = $request[ 'rows' ][ $key ][ 'classes' ];
                }
            }
        }
        /**
         * Process Table Column Block for each column in the table
         */
        if (!empty($schema[ 'properties' ][ 'columns' ])) {
            $schema_columns = $schema[ 'properties' ][ 'columns' ];

            foreach ($request[ 'columns' ] as $key => $column) {
                $schema_column = $schema_columns[ 'properties' ][ 'column' ];

                // Column Table ID
                if (!empty($schema_column[ 'properties' ][ 'table_id' ])) {
                    if (isset($request[ 'columns' ][ $key ][ 'table_id' ])) {
                        if ((int) $request[ 'columns' ][ $key ][ 'table_id' ] !== (int) $request[ 'id' ]) {
                            return new WP_Error(
                                'rest_header_id_integrity',
                                __('Row table ID does not match Request ID.'),
                                array('status' => 400)
                            );
                        }
                        $prepared_table->columns[ $key ][ 'table_id' ] = (int) $request[ 'columns' ][ $key ][ 'table_id' ];
                    }
                }

                // Colunmn's Column ID
                if (!empty($schema_column[ 'properties' ][ 'column_id' ]) &&
                    isset($request[ 'columns' ][ $key ][ 'column_id' ])) {
                    $prepared_table->columns[ $key ][ 'column_id' ] = (int) $request[ 'columns' ][ $key ][ 'column_id' ];
                }

                // Colunmn's Column Name
                if (!empty($schema_column[ 'properties' ][ 'column_name' ]) &&
                    isset($request[ 'columns' ][ $key ][ 'column_name' ])) {
                    $prepared_table->columns[ $key ][ 'column_name' ] = $request[ 'columns' ][ $key ][ 'column_name' ];
                }
                // Column attributes
                if (!empty($schema_column[ 'properties' ][ 'attributes' ]) &&
                    isset($request[ 'columns' ][ $key ][ 'attributes' ])) {
                    $prepared_table->columns[ $key ][ 'attributes' ] = $request[ 'columns' ][ $key ][ 'attributes' ];
                }

                // Column css classes
                if (!empty($schema_column[ 'properties' ][ 'classes' ]) &&
                    isset($request[ 'columns' ][ $key ][ 'classes' ])) {
                    $prepared_table->columns[ $key ][ 'classes' ] = $request[ 'columns' ][ $key ][ 'classes' ];
                }
            }
        }

        /**
         * Process Table Cell Block for each cell in the table
         */
        if (!empty($schema[ 'properties' ][ 'cells' ])) {
            $schema_cells = $schema[ 'properties' ][ 'cells' ];

            foreach ($request[ 'cells' ] as $key => $cell) {
                $schema_cell = $schema_cells[ 'properties' ][ 'cell' ];

                // Table ID
                if (!empty($schema_cell[ 'properties' ][ 'table_id' ])) {
                    if (isset($request[ 'cells' ][ $key ][ 'table_id' ])) {
                        if ((int) $request[ 'cells' ][ $key ][ 'table_id' ] !== (int) $request[ 'id' ]) {
                            return new WP_Error(
                                'rest_header_id_integrity',
                                __('Row table ID does not match Request ID.'),
                                array('status' => 400)
                            );
                        }
                        $prepared_table->cells[ $key ][ 'table_id' ] = (int) $request[ 'cells' ][ $key ][ 'table_id' ];
                    }
                }

                // Column ID
                if (!empty($schema_cell[ 'properties' ][ 'column_id' ]) &&
                    isset($request[ 'cells' ][ $key ][ 'column_id' ])) {
                    $prepared_table->cells[ $key ][ 'column_id' ] = (int) $request[ 'cells' ][ $key ][ 'column_id' ];
                }

                // Row ID
                if (!empty($schema_cell[ 'properties' ][ 'row_id' ]) &&
                    isset($request[ 'cells' ][ $key ][ 'row_id' ])) {
                    $prepared_table->cells[ $key ][ 'row_id' ] = (int) $request[ 'cells' ][ $key ][ 'row_id' ];
                }
                // Cell attributes
                if (!empty($schema_cell[ 'properties' ][ 'attributes' ]) &&
                    isset($request[ 'cells' ][ $key ][ 'attributes' ])) {
                    $prepared_table->cells[ $key ][ 'attributes' ] = $request[ 'cells' ][ $key ][ 'attributes' ];
                }

                // Cell css classes
                if (!empty($schema_cell[ 'properties' ][ 'classes' ]) &&
                    isset($request[ 'cells' ][ $key ][ 'classes' ])) {
                    $prepared_table->cells[ $key ][ 'classes' ] = $request[ 'cells' ][ $key ][ 'classes' ];
                }

                // Cell css content
                if (!empty($schema_cell[ 'properties' ][ 'content' ]) &&
                    isset($request[ 'cells' ][ $key ][ 'content' ])) {
                    $prepared_table->cells[ $key ][ 'content' ] = $request[ 'cells' ][ $key ][ 'content' ];
                }
            }
            // var_dump($prepared_table);
        }
        /**
         * Filters a post before it is inserted via the REST API.
         *
         * Possible hook names include:
         *
         * @param stdClass        $prepared_post An object representing a single post prepared
         *                                       for inserting or updating the database.
         * @param WP_REST_Request $request       Request object.
         */
        error_log('pre-insert-table = ' . json_encode(apply_filters("rest_pre_insert_dynamic-table", $prepared_table, $request)));
        return apply_filters("rest_pre_insert_dynamic-table", $prepared_table, $request);
    }

    /**
     * Prepares a single table output for response.
     *
     * @param Table           $item      Table object.
     * @param WP_REST_Request $request   Request object.
     * @return WP_REST_Response Response object.
     */
    public function prepare_item_for_response($item, $request)
    {
        // Restores the more descriptive, specific name for use within this method.
        $table = $item;
        $fields = $this->get_fields_for_response($request);
        // $headerFields = $this->get_fields_for_response($request[ 'header' ]);

        // Base fields for every post.
        $data = array();

        error_log('Table Defined as: ' . json_encode($table));
        error_log('Request fields are: ' . json_encode($fields));
        // error_log($table[ 'id' ]);
        // error_log('   Header fields are: ' . json_encode($headerFields));

        if (rest_is_field_included('id', $fields)) {
            // $data[ 'id' ] = (string) $table[ 'id' ];
            $data[ 'id' ] = $table[ 'id' ];
        }

        /**
         * Header Block
         */
        if (rest_is_field_included('header.id', $fields)) {
            $data[ 'header' ][ 'id' ] = $table[ 'header' ][ 'id' ];
        }
        if (rest_is_field_included('header.block_table_ref', $fields)) {
            $data[ 'header' ][ 'block_table_ref' ] = $table[ 'header' ][ 'block_table_ref' ];
        }
        if (rest_is_field_included('header.status', $fields)) {
            $data[ 'header' ][ 'status' ] = $table[ 'header' ][ 'status' ];
        }
        if (rest_is_field_included('header.post_id', $fields)) {
            $data[ 'header' ][ 'post_id' ] = $table[ 'header' ][ 'post_id' ];
        }

        if (rest_is_field_included('header.table_name', $fields)) {
            $data[ 'header' ][ 'table_name' ] = $table[ 'header' ][ 'table_name' ];
        }

        if (rest_is_field_included('header.attributes', $fields)) {
            $data[ 'header' ][ 'attributes' ] = $table[ 'header' ][ 'attributes' ];
        }

        if (rest_is_field_included('header.classes', $fields)) {
            $data[ 'header' ][ 'classes' ] = $table[ 'header' ][ 'classes' ];
        }

        // if (rest_is_field_included('rows', $fields)) {
        //     $data[ 'rows' ] = $table[ 'rows' ];
        // }
        // error_log('table rows: ' . json_encode($table->rows));

        /**
         * Row Block
         */
        foreach ($table[ 'rows' ] as $key => $row) {
            if (rest_is_field_included('rows.row.table_id', $fields)) {
                $data[ 'rows' ][ $key ][ 'table_id' ] = $row[ 'table_id' ];
            }

            if (rest_is_field_included('rows.row.row_id', $fields)) {
                $data[ 'rows' ][ $key ][ 'row_id' ] = $row[ 'row_id' ];
            }

            if (rest_is_field_included('rows.row.attributes', $fields)) {
                $data[ 'rows' ][ $key ][ 'attributes' ] = $row[ 'attributes' ];
            }

            if (rest_is_field_included('rows.row.classes', $fields)) {
                $data[ 'rows' ][ $key ][ 'classes' ] = $row[ 'classes' ];
            }
        }

        /**
         * Columns Block
         */
        foreach ($table[ 'columns' ] as $key => $column) {
            if (rest_is_field_included('columns.column.table_id', $fields)) {
                $data[ 'columns' ][ $key ][ 'table_id' ] = $column[ 'table_id' ];
            }

            if (rest_is_field_included('columns.column.column_id', $fields)) {
                $data[ 'columns' ][ $key ][ 'column_id' ] = $column[ 'column_id' ];
            }

            if (rest_is_field_included('columns.column.column_name', $fields)) {
                $data[ 'columns' ][ $key ][ 'column_name' ] = $column[ 'column_name' ];
            }

            if (rest_is_field_included('columns.column.attributes', $fields)) {
                $data[ 'columns' ][ $key ][ 'attributes' ] = $column[ 'attributes' ];
            }

            if (rest_is_field_included('columns.column.classes', $fields)) {
                $data[ 'columns' ][ $key ][ 'classes' ] = $column[ 'classes' ];
            }
        }

        /**
         * Cells Block
         */
        foreach ($table[ 'cells' ] as $key => $cell) {
            if (rest_is_field_included('cells.cell.table_id', $fields)) {
                $data[ 'cells' ][ $key ][ 'table_id' ] = $cell[ 'table_id' ];
            }

            if (rest_is_field_included('cells.cell.column_id', $fields)) {
                $data[ 'cells' ][ $key ][ 'column_id' ] = $cell[ 'column_id' ];
            }

            if (rest_is_field_included('cells.cell.row_id', $fields)) {
                $data[ 'cells' ][ $key ][ 'row_id' ] = $cell[ 'row_id' ];
            }
            if (rest_is_field_included('cells.cell.attributes', $fields)) {
                $data[ 'cells' ][ $key ][ 'attributes' ] = $cell[ 'attributes' ];
            }

            if (rest_is_field_included('cells.cell.classes', $fields)) {
                $data[ 'cells' ][ $key ][ 'classes' ] = $cell[ 'classes' ];
            }

            if (rest_is_field_included('cells.cell.content', $fields)) {
                $data[ 'cells' ][ $key ][ 'content' ] = $cell[ 'content' ];
            }
        }

        $context = !empty($request[ 'context' ]) ? $request[ 'context' ] : 'view';
        $data = $this->add_additional_fields_to_object($data, $request);
        $data = $this->filter_response_by_context($data, $context);

        // Wrap the data in a response object.
        $response = rest_ensure_response($data);

        /**
         * Filters the table data for a REST API response.
         *
         *
         * @param WP_REST_Response $response The response object.
         * @param WP_Post          $post     Post object.
         * @param WP_REST_Request  $request  Request object.
         */
        return apply_filters('rest_prepare_dynamic-table', $response, $table, $request);
    }

    /**
     * Retrieves the table's schema, conforming to JSON Schema.
     *
     * @return array Item schema data.
     */
    public function get_item_schema()
    {
        if ($this->schema) {
            return $this->add_additional_fields_schema($this->schema);
        }

        $schema = array(
            '$schema' => 'http://json-schema.org/draft-04/schema#',
            'title' => 'dynamic-table',
            'type' => 'object',
            'properties' => array(
                'id' => array(
                    'description' => __('Unique identifier for the table.'),
                    'type' => 'string',
                    'context' => array('view', 'edit'),
                    'readonly' => true,
                ),
                'header' => array(
                    'description' => __('Tablewide properties.'),
                    'type' => 'object',
                    'context' => array('view', 'edit'),
                    'readonly' => true,
                    'properties' => array(
                        'id' => array(
                            'description' => __('Table ID.'),
                            'type' => 'string',
                            // 'format' => array(),
                            'context' => array('view', 'edit'),
                            'readonly' => true,
                        ),
                        'block_table_ref' => array(
                            'description' => __('Link to specific table block on post.'),
                            'type' => 'string',
                            // 'format' => array(),
                            'context' => array('view', 'edit'),
                        ), //: "18e70bc8b70",
                        'status' => array(
                            'description' => __('Status of table within context of its assigned post.'),
                            'type' => 'string',
                            // 'enum' => array_keys(get_post_stati(array('internal' => false))),
                            'context' => array('view', 'edit'),
                            // 'arg_options' => array(
                            //     'validate_callback' => array($this, 'check_status'),
                        ),
                        'post_id' => array(
                            'description' => __('Unique identifier for the post.'),
                            'type' => 'integer',
                            'context' => array('view', 'edit', 'embed'),
                            'readonly' => true,
                        ),
                        'table_name' => array(
                            'description' => __('Table name which can include html style elements.'),
                            'type' => 'string',
                        ),
                        'attributes' => array(
                            'description' => __('Tablewide attributes.'),
                            'type' => 'array',
                            'context' => array('view', 'edit'),
                        ),
                        'classes' => array(
                            'description' => __('Tablewide css classes.'),
                            'type' => 'array',
                            'context' => array('view', 'edit'),
                        ),
                    ),
                ),
                'rows' => array(
                    'description' => __('Table rows collection'),
                    'type' => 'array',
                    'context' => array('view', 'edit'),
                    'readonly' => true,
                    'properties' => array(
                        'row' => array(
                            'description' => __('Table row'),
                            'type' => 'object',
                            'context' => array('view', 'edit'),
                            'readonly' => true,
                            'properties' => array(
                                'table_id' => array(
                                    'description' => __('Table ID.'),
                                    'type' => 'integer',
                                    'context' => array('view', 'edit'),
                                    'readonly' => true,
                                ),
                                'row_id' => array(
                                    'description' => __('Table Row Number.'),
                                    'type' => 'integer',
                                    'context' => array('view', 'edit'),
                                    'readonly' => true,
                                ),
                                'attributes' => array(
                                    'description' => __('Attributes for the row and inhereted by cells.'),
                                    'type' => 'array',
                                    'context' => array('view', 'edit'),
                                ),
                                'classes' => array(
                                    'description' => __('Css classes for the row and inhereted by cells.'),
                                    'type' => 'array',
                                    'context' => array('view', 'edit'),
                                ),
                            ),
                        ),
                    ),
                ),
                'columns' => array(
                    'description' => __('Table columns collection'),
                    'type' => 'array',
                    'context' => array('view', 'edit'),
                    'readonly' => true,
                    'properties' => array(
                        'column' => array(
                            'description' => __('Table column'),
                            'type' => 'object',
                            'context' => array('view', 'edit'),
                            'readonly' => true,
                            'properties' => array(
                                'table_id' => array(
                                    'description' => __('Table ID.'),
                                    'type' => 'integer',
                                    'context' => array('view', 'edit'),
                                    'readonly' => true,
                                ),
                                'column_id' => array(
                                    'description' => __('Table Column Number.'),
                                    'type' => 'integer',
                                    'context' => array('view', 'edit'),
                                    'readonly' => true,
                                ),
                                'column_name' => array(
                                    'description' => __('Table Column Name.'),
                                    'type' => 'string',
                                    'context' => array('view', 'edit'),
                                    'readonly' => true,
                                ),
                                'attributes' => array(
                                    'description' => __('Column attributes inhereted by cells.'),
                                    'type' => 'array',
                                    'context' => array('view', 'edit'),
                                ),
                                'classes' => array(
                                    'description' => __('CSS column classes inhereted by cells.'),
                                    'type' => 'array',
                                    'context' => array('view', 'edit'),
                                ),
                            ),
                        ),
                    ),
                ),
                'cells' => array(
                    'description' => __('Table cells collection.'),
                    'type' => 'array',
                    'context' => array('view', 'edit'),
                    'readonly' => true,
                    'properties' => array(
                        'cell' => array(
                            'description' => __('Table cell'),
                            'type' => 'object',
                            'context' => array('view', 'edit'),
                            'readonly' => true,
                            'properties' => array(
                                'table_id' => array(
                                    'description' => __('Table ID.'),
                                    'type' => 'integer',
                                    'context' => array('view', 'edit'),
                                    'readonly' => true,
                                ),
                                'column_id' => array(
                                    'description' => __('Table Column Number.'),
                                    'type' => 'integer',
                                    'context' => array('view', 'edit'),
                                    'readonly' => true,
                                ),
                                'row_id' => array(
                                    'description' => __('Table Row Number.'),
                                    'type' => 'integer',
                                    'context' => array('view', 'edit'),
                                    'readonly' => true,
                                ),
                                'attributes' => array(
                                    'description' => __('Cell attributes.'),
                                    'type' => 'array',
                                    'context' => array('view', 'edit'),
                                ),
                                'classes' => array(
                                    'description' => __('CSS cell classes.'),
                                    'type' => 'array',
                                    'context' => array('view', 'edit'),
                                ),
                                'content' => array(
                                    'description' => __('Cell visible content which can include html style elements.'),
                                    'type' => 'array',
                                    'context' => array('view', 'edit'),
                                    'arg_options' => array(
                                        'sanitize_callback' => null, // Note: sanitization implemented in self::prepare_item_for_database().
                                        'validate_callback' => null, // Note: validation implemented in self::prepare_item_for_database().
                                    ),
                                ), //: ""
                            ),
                        ),
                    ),
                ),
            ),

        );

        // $post_type_obj = get_post_type_object($this->post_type);

        // $post_type_attributes = array(
        //     'title',
        //     'editor',
        //     'author',
        //     'excerpt',
        //     'thumbnail',
        //     'comments',
        //     'revisions',
        //     'page-attributes',
        //     'post-formats',
        //     'custom-fields',
        // );
        // $fixed_schemas = array(
        //     'post' => array(
        //         'title',
        //         'editor',
        //         'author',
        //         'excerpt',
        //         'thumbnail',
        //         'comments',
        //         'revisions',
        //         'post-formats',
        //         'custom-fields',
        //     ),
        //     'page' => array(
        //         'title',
        //         'editor',
        //         'author',
        //         'excerpt',
        //         'thumbnail',
        //         'comments',
        //         'revisions',
        //         'page-attributes',
        //         'custom-fields',
        //     ),
        //     'attachment' => array(
        //         'title',
        //         'author',
        //         'comments',
        //         'revisions',
        //         'custom-fields',
        //         'thumbnail',
        //     ),
        // );

        // foreach ($post_type_attributes as $attribute) {
        //     // if (isset($fixed_schemas[ $this->post_type ]) && !in_array($attribute, $fixed_schemas[ $this->post_type ], true)) {
        //     //     continue;
        //     // } elseif (!isset($fixed_schemas[ $this->post_type ]) && !post_type_supports($this->post_type, $attribute)) {
        //     //     continue;
        //     // }

        //     switch ($attribute) {

        //         case 'editor':
        //             $schema[ 'properties' ][ 'content' ] = array(
        //                 'description' => __('The content for the post.'),
        //                 'type' => 'object',
        //                 'context' => array('view', 'edit'),
        //                 'arg_options' => array(
        //                     'sanitize_callback' => null, // Note: sanitization implemented in self::prepare_item_for_database().
        //                     'validate_callback' => null, // Note: validation implemented in self::prepare_item_for_database().
        //                 ),
        //                 'properties' => array(
        //                     'raw' => array(
        //                         'description' => __('Content for the post, as it exists in the database.'),
        //                         'type' => 'string',
        //                         'context' => array('edit'),
        //                     ),
        //                     'rendered' => array(
        //                         'description' => __('HTML content for the post, transformed for display.'),
        //                         'type' => 'string',
        //                         'context' => array('view', 'edit'),
        //                         'readonly' => true,
        //                     ),
        //                     'block_version' => array(
        //                         'description' => __('Version of the content block format used by the post.'),
        //                         'type' => 'integer',
        //                         'context' => array('edit'),
        //                         'readonly' => true,
        //                     ),
        //                     'protected' => array(
        //                         'description' => __('Whether the content is protected with a password.'),
        //                         'type' => 'boolean',
        //                         'context' => array('view', 'edit', 'embed'),
        //                         'readonly' => true,
        //                     ),
        //                 ),
        //             );
        //             break;

        //         case 'author':
        //             $schema[ 'properties' ][ 'author' ] = array(
        //                 'description' => __('The ID for the author of the post.'),
        //                 'type' => 'integer',
        //                 'context' => array('view', 'edit', 'embed'),
        //             );
        //             break;

        //         case 'excerpt':
        //             $schema[ 'properties' ][ 'excerpt' ] = array(
        //                 'description' => __('The excerpt for the post.'),
        //                 'type' => 'object',
        //                 'context' => array('view', 'edit', 'embed'),
        //                 'arg_options' => array(
        //                     'sanitize_callback' => null, // Note: sanitization implemented in self::prepare_item_for_database().
        //                     'validate_callback' => null, // Note: validation implemented in self::prepare_item_for_database().
        //                 ),
        //                 'properties' => array(
        //                     'raw' => array(
        //                         'description' => __('Excerpt for the post, as it exists in the database.'),
        //                         'type' => 'string',
        //                         'context' => array('edit'),
        //                     ),
        //                     'rendered' => array(
        //                         'description' => __('HTML excerpt for the post, transformed for display.'),
        //                         'type' => 'string',
        //                         'context' => array('view', 'edit', 'embed'),
        //                         'readonly' => true,
        //                     ),
        //                     'protected' => array(
        //                         'description' => __('Whether the excerpt is protected with a password.'),
        //                         'type' => 'boolean',
        //                         'context' => array('view', 'edit', 'embed'),
        //                         'readonly' => true,
        //                     ),
        //                 ),
        //             );
        //             break;

        //         case 'thumbnail':
        //             $schema[ 'properties' ][ 'featured_media' ] = array(
        //                 'description' => __('The ID of the featured media for the post.'),
        //                 'type' => 'integer',
        //                 'context' => array('view', 'edit', 'embed'),
        //             );
        //             break;

        //         case 'comments':
        //             $schema[ 'properties' ][ 'comment_status' ] = array(
        //                 'description' => __('Whether or not comments are open on the post.'),
        //                 'type' => 'string',
        //                 'enum' => array('open', 'closed'),
        //                 'context' => array('view', 'edit'),
        //             );
        //             $schema[ 'properties' ][ 'ping_status' ] = array(
        //                 'description' => __('Whether or not the post can be pinged.'),
        //                 'type' => 'string',
        //                 'enum' => array('open', 'closed'),
        //                 'context' => array('view', 'edit'),
        //             );
        //             break;

        //         case 'page-attributes':
        //             $schema[ 'properties' ][ 'menu_order' ] = array(
        //                 'description' => __('The order of the post in relation to other posts.'),
        //                 'type' => 'integer',
        //                 'context' => array('view', 'edit'),
        //             );
        //             break;

        //         case 'post-formats':
        //             // Get the native post formats and remove the array keys.
        //             $formats = array_values(get_post_format_slugs());

        //             $schema[ 'properties' ][ 'format' ] = array(
        //                 'description' => __('The format for the post.'),
        //                 'type' => 'string',
        //                 'enum' => $formats,
        //                 'context' => array('view', 'edit'),
        //             );
        //             break;

        //         case 'custom-fields':
        //             $schema[ 'properties' ][ 'meta' ] = $this->meta->get_field_schema();
        //             break;

        //     }
        // }

        // $schema_links = $this->get_schema_links();

        // if ($schema_links) {
        //     $schema[ 'links' ] = $schema_links;
        // }

        // Take a snapshot of which fields are in the schema pre-filtering.
        $schema_fields = array_keys($schema[ 'properties' ]);

        /**
         * Filters the post's schema.
         *
         * The dynamic portion of the filter, `$this->post_type`, refers to the
         * post type slug for the controller.
         *
         * Possible hook names include:
         *
         *  - `rest_post_item_schema`
         *  - `rest_page_item_schema`
         *  - `rest_attachment_item_schema`
         *
         * @since 5.4.0
         *
         * @param array $schema Item schema data.
         */
        // $schema = apply_filters("rest_{$this->post_type}_item_schema", $schema);

        // Emit a _doing_it_wrong warning if user tries to add new properties using this filter.
        $new_fields = array_diff(array_keys($schema[ 'properties' ]), $schema_fields);
        if (count($new_fields) > 0) {
            _doing_it_wrong(
                __METHOD__,
                sprintf(
                    /* translators: %s: register_rest_field */
                    __('Please use %s to add new schema properties.'),
                    'register_rest_field'
                ),
                '5.4.0'
            );
        }

        error_log('Schema is: ' . json_encode($schema));
        $this->schema = $schema;
        error_log('Returned schema is: ' . json_encode($this->add_additional_fields_schema($this->schema)));

        return $this->add_additional_fields_schema($this->schema);
    }

    /**
     * Retrieves Link Description Objects that should be added to the Schema for the posts collection.
     *
     * @since 4.9.8
     *
     * @return array
     */
    protected function get_schema_links()
    {

        $href = rest_url("{$this->namespace}/{$this->rest_base}/{id}");

        $links = array();

        $links[  ] = array(
            'rel' => 'https://api.w.org/action-publish',
            'title' => __('The current user can publish this post.'),
            'href' => $href,
            'targetSchema' => array(
                'type' => 'object',
                'properties' => array(
                    'status' => array(
                        'type' => 'string',
                        'enum' => array('publish', 'future'),
                    ),
                ),
            ),
        );

        $links[  ] = array(
            'rel' => 'https://api.w.org/action-unfiltered-html',
            'title' => __('The current user can post unfiltered HTML markup and JavaScript.'),
            'href' => $href,
            'targetSchema' => array(
                'type' => 'object',
                'properties' => array(
                    'content' => array(
                        'raw' => array(
                            'type' => 'string',
                        ),
                    ),
                ),
            ),
        );

        // if ('post' === $this->post_type) {
        //     $links[  ] = array(
        //         'rel' => 'https://api.w.org/action-sticky',
        //         'title' => __('The current user can sticky this post.'),
        //         'href' => $href,
        //         'targetSchema' => array(
        //             'type' => 'object',
        //             'properties' => array(
        //                 'sticky' => array(
        //                     'type' => 'boolean',
        //                 ),
        //             ),
        //         ),
        //     );
        // }

        // if (post_type_supports($this->post_type, 'author')) {
        //     $links[  ] = array(
        //         'rel' => 'https://api.w.org/action-assign-author',
        //         'title' => __('The current user can change the author on this post.'),
        //         'href' => $href,
        //         'targetSchema' => array(
        //             'type' => 'object',
        //             'properties' => array(
        //                 'author' => array(
        //                     'type' => 'integer',
        //                 ),
        //             ),
        //         ),
        //     );
        // }

        return $links;
    }

    /**
     * Retrieves the query params for the posts collection.
     *
     * @since 4.7.0
     * @since 5.4.0 The `tax_relation` query parameter was added.
     * @since 5.7.0 The `modified_after` and `modified_before` query parameters were added.
     *
     * @return array Collection parameters.
     */
    public function get_collection_params()
    {
        $query_params = parent::get_collection_params();

        // $query_params[ 'context' ][ 'default' ] = 'view';

        // $query_params[ 'after' ] = array(
        //     'description' => __('Limit response to posts published after a given ISO8601 compliant date.'),
        //     'type' => 'string',
        //     'format' => 'date-time',
        // );

        // $query_params[ 'modified_after' ] = array(
        //     'description' => __('Limit response to posts modified after a given ISO8601 compliant date.'),
        //     'type' => 'string',
        //     'format' => 'date-time',
        // );

        // if (post_type_supports($this->post_type, 'author')) {
        //     $query_params[ 'author' ] = array(
        //         'description' => __('Limit result set to posts assigned to specific authors.'),
        //         'type' => 'array',
        //         'items' => array(
        //             'type' => 'integer',
        //         ),
        //         'default' => array(),
        //     );
        //     $query_params[ 'author_exclude' ] = array(
        //         'description' => __('Ensure result set excludes posts assigned to specific authors.'),
        //         'type' => 'array',
        //         'items' => array(
        //             'type' => 'integer',
        //         ),
        //         'default' => array(),
        //     );
        // }

        // $query_params[ 'before' ] = array(
        //     'description' => __('Limit response to posts published before a given ISO8601 compliant date.'),
        //     'type' => 'string',
        //     'format' => 'date-time',
        // );

        // $query_params[ 'modified_before' ] = array(
        //     'description' => __('Limit response to posts modified before a given ISO8601 compliant date.'),
        //     'type' => 'string',
        //     'format' => 'date-time',
        // );

        // $query_params[ 'exclude' ] = array(
        //     'description' => __('Ensure result set excludes specific IDs.'),
        //     'type' => 'array',
        //     'items' => array(
        //         'type' => 'integer',
        //     ),
        //     'default' => array(),
        // );

        // $query_params[ 'include' ] = array(
        //     'description' => __('Limit result set to specific IDs.'),
        //     'type' => 'array',
        //     'items' => array(
        //         'type' => 'integer',
        //     ),
        //     'default' => array(),
        // );

        // if ('page' === $this->post_type || post_type_supports($this->post_type, 'page-attributes')) {
        //     $query_params[ 'menu_order' ] = array(
        //         'description' => __('Limit result set to posts with a specific menu_order value.'),
        //         'type' => 'integer',
        //     );
        // }

        // $query_params[ 'offset' ] = array(
        //     'description' => __('Offset the result set by a specific number of items.'),
        //     'type' => 'integer',
        // );

        // $query_params[ 'order' ] = array(
        //     'description' => __('Order sort attribute ascending or descending.'),
        //     'type' => 'string',
        //     'default' => 'desc',
        //     'enum' => array('asc', 'desc'),
        // );

        // $query_params[ 'orderby' ] = array(
        //     'description' => __('Sort collection by post attribute.'),
        //     'type' => 'string',
        //     'default' => 'date',
        //     'enum' => array(
        //         'author',
        //         'date',
        //         'id',
        //         'include',
        //         'modified',
        //         'parent',
        //         'relevance',
        //         'slug',
        //         'include_slugs',
        //         'title',
        //     ),
        // );

        // if ('page' === $this->post_type || post_type_supports($this->post_type, 'page-attributes')) {
        //     $query_params[ 'orderby' ][ 'enum' ][  ] = 'menu_order';
        // }

        // $post_type = get_post_type_object($this->post_type);

        // if ($post_type->hierarchical || 'attachment' === $this->post_type) {
        //     $query_params[ 'parent' ] = array(
        //         'description' => __('Limit result set to items with particular parent IDs.'),
        //         'type' => 'array',
        //         'items' => array(
        //             'type' => 'integer',
        //         ),
        //         'default' => array(),
        //     );
        //     $query_params[ 'parent_exclude' ] = array(
        //         'description' => __('Limit result set to all items except those of a particular parent ID.'),
        //         'type' => 'array',
        //         'items' => array(
        //             'type' => 'integer',
        //         ),
        //         'default' => array(),
        //     );
        // }

        // $query_params[ 'search_columns' ] = array(
        //     'default' => array(),
        //     'description' => __('Array of column names to be searched.'),
        //     'type' => 'array',
        //     'items' => array(
        //         'enum' => array('post_title', 'post_content', 'post_excerpt'),
        //         'type' => 'string',
        //     ),
        // );

        // $query_params[ 'slug' ] = array(
        //     'description' => __('Limit result set to posts with one or more specific slugs.'),
        //     'type' => 'array',
        //     'items' => array(
        //         'type' => 'string',
        //     ),
        // );

        // $query_params[ 'status' ] = array(
        //     'default' => 'publish',
        //     'description' => __('Limit result set to posts assigned one or more statuses.'),
        //     'type' => 'array',
        //     'items' => array(
        //         'enum' => array_merge(array_keys(get_post_stati()), array('any')),
        //         'type' => 'string',
        //     ),
        //     'sanitize_callback' => array($this, 'sanitize_post_statuses'),
        // );

        /**
         * Filters collection parameters for the posts controller.
         *
         * The dynamic part of the filter `$this->post_type` refers to the post
         * type slug for the controller.
         *
         * This filter registers the collection parameter, but does not map the
         * collection parameter to an internal WP_Query parameter. Use the
         * `rest_{$this->post_type}_query` filter to set WP_Query parameters.
         *
         * @since 4.7.0
         *
         * @param array        $query_params JSON Schema-formatted collection parameters.
         * @param WP_Post_Type $post_type    Post type object.
         */
        // return apply_filters("rest_{$this->post_type}_collection_params", $query_params, $post_type);
    }
}
