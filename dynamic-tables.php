<?php

/**
 * Plugin Name:       Dynamic Tables
 * Description:       Create custom table blocks with highly customizable and responsive formats
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            Gregory Schaub
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       dynamic-tables
 *
 * @package           dynamic-tables
 */

if (!defined('ABSPATH')) {
    exit;
}
// Exit if accessed directly
define('TEST_MODE', false);

class DynamicTables
{

    public function __construct()
    {
        error_log('BLOCK CONSTRUCT');
        // Establish custom tables for tables
        global $wpdb;

        // Initialize Web Services
        require_once plugin_dir_path(__FILE__) . 'inc/dynamicTablesRestAPI.php';
        add_action('rest_api_init', array($this, 'establish_services'));

        // Init block
        add_action('init', array($this, 'dynamic_tables_block_init'));

    }

    public function establish_services()
    {
        error_log('INIT BLOCK WEB SERVICES');

        $controller = new Dynamic_Tables_REST_Controller();
        $controller->register_routes();
        error_log('Rest Registration = ' . json_encode($controller));
        error_log('get_public_item_schema = ' . json_encode($controller->get_item_schema()));
        error_log('get_public_item_schema = ' . json_encode($controller->get_public_item_schema()));
    }

    public function dynamic_tables_block_init()
    {
        add_action('admin_enqueue_scripts', array($this, 'dynamic_tables_scripts'));
        register_block_type_from_metadata(__DIR__ . '/build');
    }

    public function dynamic_tables_scripts()
    {
        try {
            wp_add_inline_script('dynamic-tables-dynamic-tables-editor-script', 'gls_test_data = ' . json_encode(
                array(
                    'root_url' => get_site_url() . '/wp-json/dynamic-tables/v1/table',
                    'dt_nonce' => wp_create_nonce('dt_nonce'),
                )
            ),
                'after'
            );

        } catch (Exception $e) {
            error_log('Error adding inline script: ' . $e);
        }
    }
}

$dynamicTablesPlugin = new DynamicTables();
