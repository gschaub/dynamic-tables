<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'dynamicTablesAPI.php';

class Dynamic_Tables_REST_Controller
{

    /**
     * Temporary properties until full class is built
     */
    public string $namespace = '';
    public string $rest_base = '';

    public function __construct()
    {
        $this->namespace = 'dynamic-tables/v1';
        $this->rest_base = 'tables';
        $this->register_rest_routes();
        error_log('Tables REST initiated');
    }

    public function register_rest_routes()
    {

        register_rest_route($this->namespace,
            '/' . $this->rest_base,
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => 'create_table_data',
                'permission_callback' => array($this, 'test_permissions'),
            )
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
                    'callback' => 'get_table_request',
                    'permission_callback' => array($this, 'test_permissions'),
                ),
                array(
                    'methods' => WP_REST_SERVER::EDITABLE,
                    'callback' => 'update_table_data',
                    'permission_callback' => array($this, 'test_permissions'),

                ),
                array(
                    'methods' => WP_REST_Server::DELETABLE,
                    'callback' => 'delete_table',
                    'permission_callback' => array($this, 'test_permissions'),
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
    }

    public function test_permissions($request)
    {
        // Restrict endpoint to only users who have the edit_posts capability.
        //if ( !is_user_logged_in() ) {
        //    die("Only logged in users can create a like.");
        // }

        // This is a black-listing approach. You could alternatively do this via white-listing, by returning false here and changing the permissions check.

        //"x_wp_nonce":["47c9a3aec4"]
        // wp_verify_nonce( $request->get_header('X-WP-Nonce'), 'wp_rest' )

        // include in php to send nonce to pluggin
        // wp_nonce_field('wp_rest', '_wpnonce', true, true);

        error_log(' ');
        error_log('TABLE RESULTS');
        error_log('Request = ' . json_encode($request));
        error_log('Table ID = ' . $request[ 'id' ]);
        error_log($request[ 'context' ]);

        $table = $this->get_table($request[ 'id' ]);

        if (is_wp_error($table)) {
            return $table;
        }

        if (isset($table[ 'header' ][ 'post_id' ])) {
            $postId = $table[ 'header' ][ 'post_id' ];
            $post = $this->get_post($postId);

            if ('edit' === $request[ 'context' ] && $post && !$this->check_update_permission($post)) {
                return new WP_Error(
                    'rest_forbidden_context',
                    __('Sorry, you are not allowed to edit this post.'),
                    array('status' => rest_authorization_required_code())
                );
            }
        }
        return true;
    }

    public function get_table($id)
    {
        $error = new WP_Error(
            'rest_table_invalid_id',
            __('Invalid table ID.'),
            array('status' => 404)
        );

        if ((int) $id <= 0) {
            return $error;
        }

        $table = get_table((int) $id);
        if (empty($table)) {
            return $error;
        }

        return $table;
    }

    public function get_post($id)
    {
        $error = new WP_Error(
            'rest_table_invalid_id',
            __('Invalid post ID.'),
            array('status' => 404)
        );

        if ((int) $id <= 0) {
            return $error;
        }

        $post = get_post((int) $id);
        if (empty($post) || empty($post->ID)) {
            return $error;
        }

        return $post;
    }

    public function check_update_permission($post)
    {
        $post_type = get_post_type_object($post->post_type);

        if (!$this->check_is_post_type_allowed($post_type)) {
            return false;
        }

        return current_user_can('edit_post', $post->ID);

    }

    public function check_is_post_type_allowed($post_type)
    {
        if (!is_object($post_type)) {
            $post_type = get_post_type_object($post_type);
        }

        if (!empty($post_type) && !empty($post_type->show_in_rest)) {
            return true;
        }

        return false;
    }
}
