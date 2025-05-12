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

if ( ! defined( 'ABSPATH' ) ) {
	// Exit if accessed directly
	exit;
}

if ( ! class_exists( DynamicTables::class ) ) {

	// Current plugin DB version
	// global $dt_version;
	// $dt_version = '1.0';

	/**
	 * Controlling class and entry point for Dynamic Tables.
	 *
	 * @since 1.0.0
	 */
	final class DynamicTables {


		/**
		 * The plugin version number.
		 *
		 * @since   1.0.0
		 *
		 * @var string
		 */

		public $version = '1.0.0';

		/**
		 * The plugin settings array.
		 *
		 * @since   1.0.0
		 *
		 * @var array
		 */

		public $settings = array();

		/**
		 * The plugin object instance.
		 *
		 * @since   1.0.0
		 *
		 * @var DynamicTables
		 */
		public $instance = array();

		/**
		 * We don't instantiate through a constructor
		 */
		public function __construct() {
			// silence is golden
		}

		/**
		 * Initialize the plugin object
		 *
		 * @since   1.0.0
		 *
		 * @return DynamicTables
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new DynamicTables();
				self::$instance->initialize();
			}

			return self::$instance;
		}

		/**
		 * Startup object
		 *
		 * @since   1.0.0
		 *
		 * @return void
		 */
		public function initialize() {
			/**
			 * Define constants
			 */
			define( 'DT', true );
			define( 'DT_PATH', plugin_dir_path( __FILE__ ) );
			define( 'DT_BASENAME', plugin_basename( __FILE__ ) );
			define( 'DT_VERSION', $this->version );
			define( 'DT_MAJOR_VERSION', 1 );
			define( 'DT_UPGRADE_VERSION', '0.0.9' ); // Highest version with an upgrade routine. See upgrades.php.
			define( 'DT_IS_MULTISITE', is_multisite() ? true : false );
			if ( DT_IS_MULTISITE ) {
				define( 'DT_ALLOW_MULTISITE_ACTIVATION', false );
			}
			define( 'TEST_MODE', false );

			/**
			 * Define settings
			 */
			$this->settings = array(
				'name'       => __( 'Dynamic Tables', 'dt' ),
				'slug'       => dirname( DT_BASENAME ),
				'version'    => DT_VERSION,
				'basename'   => DT_BASENAME,
				'path'       => DT_PATH,
				'file'       => __FILE__,
				'url'        => plugin_dir_url( __FILE__ ),
				'show_admin' => true,
				'capability' => 'manage_options',
			);

			// Register included files
			require_once plugin_dir_path( __FILE__ ) . 'includes/dynamic-tables-rest-api.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/dynamic-tables-db-persist.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/admin/upgrades.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/render-helper.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/utility-functions.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/api/dynamic-tables-api.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/api/api-helpers.php';

			// Register Include admin.
			$admin_screen = 'false';
			if ( is_admin() ) {
				$admin_screen = 'true';
				require_once plugin_dir_path( __FILE__ ) . 'includes/admin/admin.php';
				require_once plugin_dir_path( __FILE__ ) . 'includes/admin/admin-notices.php';
			}

			// Handle Plugin Add, Upgrade, Delete
			if ( ! isset( $version_management ) ) {
				$version_management = new DynamicTablesVersionManagement();
			}

			register_activation_hook( __FILE__, array( $version_management, 'activate_dynamic_tables' ) );
			// add_action('wp_initialize_site', array( $version_management, 'new_site_setup' ));
			// register_deactivation_hook( __FILE__, array( $version_management, 'deactivate_dynamic_tables' ) );
			register_deactivation_hook( __FILE__, array( $version_management, 'uninstall_dynamic_tables' ) );
			// register_uninstall_hook(__FILE__, [$version_management, 'uninstall_dynamic_tables']);
			$version_management->dynamic_tables_has_upgrade( DT_UPGRADE_VERSION );

			// Initialize Web Services
			add_action( 'rest_api_init', array( $this, 'establish_services' ) );

			// Init block
			add_action( 'init', array( $this, 'dynamic_tables_block_init' ) );
		}

		/**
		 * Returns true if a setting exists for this name.
		 *
		 * @since   1.0.0
		 *
		 * @param   string $name The setting name.
		 * @return  boolean
		 */
		public function has_setting( $name ) {
			return isset( $this->settings[ $name ] );
		}

		/**
		 * Returns a setting or null if doesn't exist.
		 *
		 * @since   1.0.0
		 *
		 * @param   string $name The setting name.
		 * @return  mixed
		 */
		public function get_setting( $name ) {
			return isset( $this->settings[ $name ] ) ? $this->settings[ $name ] : null;
		}

		/**
		 * Updates a setting for the given name and value.
		 *
		 * @since   1.0.0
		 *
		 * @param   string $name The setting name.
		 * @param   mixed  $value The setting value.
		 * @return  true
		 */
		public function update_setting( $name, $value ) {
			$this->settings[ $name ] = $value;
			return true;
		}

		/**
		 * Initialize REST API
		 *
		 * Description - The REST API faciliates all database actions associated with dynamic
		 * tables.  This includes creating, updating and deleting tables as well as retrieving
		 * structured tables in JSON format
		 *
		 * @since 1.0.0
		 *
		 * @return void
		 */
		public function establish_services() {
			$controller = new Dynamic_Tables_REST_Controller();
			$controller->register_routes();
		}

		/**
		 * Register a dynamic table block
		 *
		 * Description - This method supports access to front and back end
		 * dynamic table block through WordPress' standard block framework
		 *
		 * @return void
		 */
		public function dynamic_tables_block_init() {
			register_block_type_from_metadata( __DIR__ . '/build' );
		}
	}

	/**
	* Instanciate a Dynamic Tables instance
	*
	* Description - The main function responsible for returning  one true dynamic tables instance.
	*
	* @since   1.0.0
	*
	* @return  DynamicTables
	*/
	function dynamic_tables() {
		global $dynamic_tables;

		// Instantiate only once.
		if ( ! isset( $dynamic_tables ) ) {
					$dynamic_tables = new DynamicTables();
					$dynamic_tables->initialize();
		}
				return $dynamic_tables;
	}

	// Instantiate.
	dynamic_tables();

} else {
	error_log( 'NO Initialize - DT class already exists' );
}
