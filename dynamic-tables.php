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
        // Establish custom tables for tables
        global $wpdb;
        //$this->charset = $wpdb->get_charset_collate();
        //$this->tablename = $wpdb->prefix . "dt_tables";

        add_action('rest_api_init', array($this, 'establish_services'));

        // Init block
        add_action('init', array($this, 'dynamic_tables_block_init'));
    }

    public function establish_services()
    {
        require_once plugin_dir_path(__FILE__) . 'inc/dynamicTablesRoutes.php';
        dynamic_tables_rest();
    }

    public function dynamic_tables_block_init()
    {
        register_block_type(__DIR__ . '/build');
    }
}

$dynamicTablesPlubin = new DynamicTables();
