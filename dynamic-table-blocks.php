<?php
/**
 * Plugin Name:       Dynamic Tables
 * Description:       Create custom table blocks with highly customizable and responsive formats
 * Requires at least: 6.1
 * Requires PHP:      8.0
 * Version:           1.2.1
 * Author:            Gregory Schaub
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       dynamic-table-blocks
 * Domain Path:       /languages
 *
 * @package           dynamic-table-blocks
 */

namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	// Exit if accessed directly
	exit;
}

// Current plugin DB version
// global $dtbk_version;
// $dtbk_version = '1.0';

/**
 * Controlling class and entry point for Dynamic Tables.
 *
 * @since 1.0.0
 */
final class DynamicTableBlocks {

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
	 * @var DynamicTableBlocks
	 */
	private static $instance = null;
	// public $instance = array();

	/**
	 * We don't instantiate through a constructor
	 */
	private function __construct() {
		// silence is golden
	}

	/**
	 * Initialize the plugin object
	 *
	 * @since   1.0.0
	 *
	 * @return DynamicTableBlocks
	 */
	public static function get_instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new DynamicTableBlocks();
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
		define( 'DTBK', true );
		define( 'DTBK_PATH', plugin_dir_path( __FILE__ ) );
		define( 'DTBK_BASENAME', plugin_basename( __FILE__ ) );
		define( 'DTBK_VERSION', $this->version );
		define( 'DTBK_MAJOR_VERSION', 1 );
		define( 'DTBK_UPGRADE_VERSION', '0.0.9' ); // Highest version with an upgrade routine. See upgrades.php.
		define( 'DTBK_IS_MULTISITE', is_multisite() ? true : false );
		if ( DTBK_IS_MULTISITE ) {
			define( 'DTBK_ALLOW_MULTISITE_ACTIVATION', false );
		}

		// Register included files
		require_once plugin_dir_path( __FILE__ ) . 'includes/dynamic-table-blocks-rest-api.php';
		require_once plugin_dir_path( __FILE__ ) . 'includes/dynamic-table-blocks-db-persist.php';
		require_once plugin_dir_path( __FILE__ ) . 'includes/admin/upgrades.php';
		require_once plugin_dir_path( __FILE__ ) . 'includes/render-helper.php';
		require_once plugin_dir_path( __FILE__ ) . 'includes/utility-functions.php';
		require_once plugin_dir_path( __FILE__ ) . 'includes/api/dynamic-table-blocks-api.php';
		require_once plugin_dir_path( __FILE__ ) . 'includes/api/api-helpers.php';
		require_once plugin_dir_path( __FILE__ ) . 'includes/cron-trait-schedulable.php';
		require_once plugin_dir_path( __FILE__ ) . 'includes/maintenance.php';

		// Register Include admin.
		$admin_screen = 'false';
		if ( is_admin() ) {
			$admin_screen = 'true';
			require_once plugin_dir_path( __FILE__ ) . 'includes/admin/admin.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/admin/admin-notices.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/admin/admin-dtbk-ajax.php';
			require_once plugin_dir_path( __FILE__ ) . 'includes/admin/admin-list-dynamic-table-blocks.php';
		}

		// Handle Plugin Add, Upgrade, Delete
		if ( ! isset( $version_management ) ) {
			$version_management = new DynamicTableBlocksVersionManagement();
		}

		register_activation_hook( __FILE__, array( $version_management, 'activate_dynamic_table_blocks' ) );
		register_deactivation_hook( __FILE__, array( $version_management, 'uninstall_dynamic_table_blocks' ) );
		$version_management->dynamic_tables_has_upgrade( DTBK_UPGRADE_VERSION );

		// Initialize Web Services
		add_action( 'rest_api_init', array( $this, 'establish_services' ) );

		// Init block
		add_action( 'init', array( $this, 'dynamic_table_block_init' ) );

		// Init Maintenance
		add_action(
			'init',
			function () {
				DTBK_Maintenance::get_instance();
			}
		);
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
		// error_log('Settings: ' . json_encode($this->settings));
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
	public function dynamic_table_block_init() {
		register_block_type_from_metadata( __DIR__ . '/build' );

		/**
		 * Define settings
		 */
		$this->settings = array(
			'name'       => __( 'Dynamic Tables', 'dynamic-table-blocks' ),
			'slug'       => dirname( DTBK_BASENAME ),
			'version'    => DTBK_VERSION,
			'basename'   => DTBK_BASENAME,
			'path'       => DTBK_PATH,
			'file'       => __FILE__,
			'url'        => plugin_dir_url( __FILE__ ),
			'show_admin' => true,
			'capability' => 'manage_options',
		);
	}
}

/**
* Instanciate a Dynamic Tables instance
*
* Description - The main function responsible for returning one true dynamic tables instance.
*
* @since   1.0.0
*
* @return  DynamicTableBlocks
*/

DynamicTableBlocks::get_instance();
