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

namespace DynamicTables;

if (!defined('ABSPATH')) {
    // Exit if accessed directly
    exit;
}

if (!class_exists(DynamicTables::class)) {

// Current plugin DB version
    // global $dt_version;
    // $dt_version = '1.0';

    final class DynamicTables
    {

        /**
         * The plugin version number.
         *
         * @date    9/30/2024
         * @since   1.0.0
         *
         * @var string
         */
        protected $version = '1.0.0';

        /**
         * The plugin settings array.
         *
         * @date    9/30/2024
         * @since   1.0.0
         *
         * @var array
         */
        protected $settings = array();

        /**
         * The plugin object instance.
         *
         * @date    9/30/2024
         * @since   1.0.0
         *
         * @var DynamicTables
         */
        private static $instance;

        /**
         * We don't instantiate through a constructor
         */
        private function __construct()
        {}

        /**
         * Initialize the plugin object\
         *
         * @date    9/30/2024
         * @since   1.0.0
         *
         * @return DynamicTables
         */

        public static function get_instance()
        {
            if (!isset(self::$instance)) {
                self::$instance = new DynamicTables();
                self::$instance->initialize();
            }

            return self::$instance;
        }

        /**
         * Startup object
         *
         * @date    9/30/2024
         * @since   1.0.0
         *
         * @return void
         */
        public function initialize()
        {
            error_log('DT Initialize');

            /**
             * Step 1 - Define constants
             */
            $this->define_constant('DT', true);
            // $this->define_constant('ACF_PATH', plugin_dir_path(__FILE__));
            // $this->define_constant('ACF_BASENAME', plugin_basename(__FILE__));
            $this->define_constant('DT_VERSION', $this->version);
            // $this->define_constant('DT_MAJOR_VERSION', 6);
            // $this->define_constant('DT_FIELD_API_VERSION', 5);
            $this->define_constant('DT_UPGRADE_VERSION', '0.0.9'); // Highest version with an upgrade routine. See upgrades.php.
            $this->define_constant('TEST_MODE', false);

            /**
             * Define settings
             */
            $this->settings = array(
                'name' => __('Dynamic Tables', 'dt'),
                // 'slug' => dirname(ACF_BASENAME),
                'version' => DT_VERSION,
                // 'basename' => ACF_BASENAME,
                // 'path' => ACF_PATH,
                'file' => __FILE__,
                // 'url' => plugin_dir_url(__FILE__),
                // 'show_admin' => true,
                // 'show_updates' => true,
                // 'enable_post_types' => true,
                // 'enable_options_pages_ui' => true,
                // 'stripslashes' => false,
                // 'local' => true,
                // 'json' => true,
                // 'save_json' => '',
                // 'load_json' => array(),
                // 'default_language' => '',
                // 'current_language' => '',
                // 'capability' => 'manage_options',
                // 'uploader' => 'wp',
                // 'autoload' => false,
                // 'l10n' => true,
                // 'l10n_textdomain' => '',
                // 'google_api_key' => '',
                // 'google_api_client' => '',
                // 'enqueue_google_maps' => true,
                // 'enqueue_select2' => true,
                // 'enqueue_datepicker' => true,
                // 'enqueue_datetimepicker' => true,
                // 'select2_version' => 4,
                // 'row_index_offset' => 1,
                // 'remove_wp_meta_box' => true,
                // 'rest_api_enabled' => true,
                // 'rest_api_format' => 'light',
                // 'rest_api_embed_links' => true,
                // 'preload_blocks' => true,
                // 'enable_shortcode' => true,
                // 'enable_bidirection' => true,
            );

            // Register included files
            require_once plugin_dir_path(__FILE__) . 'includes/dynamicTablesRestAPI.php';
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            require_once plugin_dir_path(__FILE__) . 'includes/upgrades.php';

            // Handle Plugin Add, Upgrade, Delete
            if (!isset($version_management)) {
                $version_management = new DynamicTablesVersionManagement;
            }
            
            error_log('Switch UNINSTALL method to the uninstall hook before publishing');
            register_activation_hook(__FILE__, array($version_management, 'activate_dynamic_tables'));
            // register_deactivation_hook(__FILE__, array($version_management, 'deactivate_dynamic_tables'));
            register_deactivation_hook(__FILE__, array($version_management, 'uninstall_dynamic_tables'));
            // register_uninstall_hook(__FILE__, array($version_management, 'uninstall_dynamic_tables'));
            $version_management->dynamic_tables_has_upgrade(DT_UPGRADE_VERSION);

            // Initialize Web Services
            add_action('rest_api_init', array($this, 'establish_services'));

            // Init block
            add_action('init', array($this, 'dynamic_tables_block_init'));

        }

        /**
         * Returns true if a setting exists for this name.
         *
         * @date    2/2/18
         * @since   5.6.5
         *
         * @param   string $name The setting name.
         * @return  boolean
         */
        public function has_setting($name)
        {
            return isset($this->settings[ $name ]);
        }

        /**
         * Returns a setting or null if doesn't exist.
         *
         * @date    28/09/13
         * @since   5.0.0
         *
         * @param   string $name The setting name.
         * @return  mixed
         */
        public function get_setting($name)
        {
            return isset($this->settings[ $name ]) ? $this->settings[ $name ] : null;
        }

        /**
         * Updates a setting for the given name and value.
         *
         * @date    28/09/13
         * @since   5.0.0
         *
         * @param   string $name The setting name.
         * @param   mixed  $value The setting value.
         * @return  true
         */
        public function update_setting($name, $value)
        {
            $this->settings[ $name ] = $value;
            return true;
        }

        /**
         * Define constant
         *
         * @param  string  $name  The name of the constant
         * @param  mixed  $value  The value of the constant
         */
        public function define_constant($name, $value)
        {
            if (!defined($name)) {
                define($name, $value);
            }
        }

        public function establish_services()
        {
            $controller = new Dynamic_Tables_REST_Controller();
            $controller->register_routes();
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

            } catch (\Exception $e) {
                error_log('Error adding inline script: ' . $e);
            }
        }
    }

    /**
     * The main function responsible for returning the one true dynamic tables Instance to functions everywhere.
     * Use this function like you would a global variable, except without needing to declare the global.
     *
     * Example: <?php $dynamicTablesPlugin = dynamicTables(); ?>
     *
     * @date    4/09/13
     * @since   4.3.0
     *
     * @return  ACF
     */
    function dynamicTables_get_instance()
    {
        // global $dynamicTablesPlugin;

        // // Instantiate only once.
        // if (!isset($dynamicTablesPlugin)) {
        //     $$dynamicTablesPlugin = new DynamicTables();
        //     $$dynamicTablesPlugin->initialize();
        // }
        // return $$dynamicTablesPlugin;
        return DynamicTables::get_instance();
    }

    // Instantiate.
    dynamicTables_get_instance();

} // class_exists check
else {
    error_log('NO Initialize - DT class already exists');
}
