<?php

require_once plugin_dir_path(__FILE__) . 'dynamicTablesAPI.php';

function dynamic_tables_rest()
{

    register_rest_route('dynamic-tables/v1', 'tables',
        array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => 'create_table_data',
            'permission_callback' => 'test_permissions',
        )
    );

    register_rest_route('dynamic-tables/v1', 'tables/(?P<id>[\d]+)',
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

function test_permissions($request)
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
    error_log('Table ID = ' . $request[ 'id' ]);
    error_log($request[ 'context' ]);

    $table = get_table_validation($request[ 'id' ]);

    if (is_wp_error($table)) {
        return $table;
    }

    if (isset($table[ 'header' ][ 'post_id' ])) {
        $postId = $table[ 'header' ][ 'post_id' ];
        $post = get_post_validation($postId);

        if ('edit' === $request[ 'context' ] && $post && !check_update_permission($post)) {
            return new WP_Error(
                'rest_forbidden_context',
                __('Sorry, you are not allowed to edit this post.'),
                array('status' => rest_authorization_required_code())
            );
        }
    }
    return true;
}

function get_table_validation($id)
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

function get_post_validation($id)
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

function check_update_permission($post)
{
    $post_type = get_post_type_object($post->post_type);

    if (!check_is_post_type_allowed($post_type)) {
        return false;
    }

    return current_user_can('edit_post', $post->ID);

}

function check_is_post_type_allowed($post_type)
{
    if (!is_object($post_type)) {
        $post_type = get_post_type_object($post_type);
    }

    if (!empty($post_type) && !empty($post_type->show_in_rest)) {
        return true;
    }

    return false;
}
