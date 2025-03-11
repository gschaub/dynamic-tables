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

	final class DynamicTables {


		/**
		 * The plugin version number.
		 *
		 * @date    9/30/2024
		 * @since   1.0.0
		 *
		 * @var string
		 */
		public $version = '1.0.0';

		/**
		 * The plugin settings array.
		 *
		 * @date    9/30/2024
		 * @since   1.0.0
		 *
		 * @var array
		 */
		public $settings = array();

		/**
		 * The plugin object instance.
		 *
		 * @date    9/30/2024
		 * @since   1.0.0
		 *
		 * @var DynamicTables
		 */
		public $instance = array();

		/**
		 * We don't instantiate through a constructor
		 */
		public function __construct() {
		}

		/**
		 * Initialize the plugin object\
		 *
		 * @date    9/30/2024
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
		 * @date    9/30/2024
		 * @since   1.0.0
		 *
		 * @return void
		 */
		public function initialize() {
			error_log( 'DT Initialize' );

			/**
			 * Step 1 - Define constants
			 */
			$this->define_constant( 'DT', true );
			define( 'DT_PATH', plugin_dir_path( __FILE__ ) );
			$this->define_constant( 'DT_PATH', plugin_dir_path( __FILE__ ) );
			$this->define_constant( 'DT_BASENAME', plugin_basename( __FILE__ ) );
			$this->define_constant( 'DT_VERSION', $this->version );
			$this->define_constant( 'DT_MAJOR_VERSION', 1 );
			$this->define_constant( 'DT_UPGRADE_VERSION', '0.0.9' ); // Highest version with an upgrade routine. See upgrades.php.
			$this->define_constant( 'TEST_MODE', false );

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
				'capability' => 'manage_options',
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
			require_once plugin_dir_path( __FILE__ ) . 'includes/dynamic-tables-rest-api.php';
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';

			// Include utility functions.
			require_once plugin_dir_path( __FILE__ ) . 'includes/utility-functions.php';

			// Include previous API functions.
			require_once  plugin_dir_path( __FILE__ ) . 'includes/api/api-helpers.php';

			// Include functions.
			// acf_include('includes/acf-helper-functions.php');
			// acf_include('includes/acf-hook-functions.php');
			// acf_include('includes/acf-field-functions.php');
			// acf_include('includes/acf-bidirectional-functions.php');
			// acf_include('includes/acf-internal-post-type-functions.php');
			// acf_include('includes/acf-post-type-functions.php');
			// acf_include('includes/acf-taxonomy-functions.php');
			// acf_include('includes/acf-field-group-functions.php');
			// acf_include('includes/acf-form-functions.php');
			// acf_include('includes/acf-meta-functions.php');
			// acf_include('includes/acf-post-functions.php');
			// acf_include('includes/acf-user-functions.php');
			// acf_include('includes/acf-value-functions.php');
			// acf_include('includes/acf-input-functions.php');
			// acf_include('includes/acf-wp-functions.php');

			// Override the shortcode default value based on the version when installed.
			// $first_activated_version = acf_get_version_when_first_activated();

			// Include core.
			// acf_include('includes/fields.php');
			// acf_include('includes/locations.php');
			// acf_include('includes/assets.php');
			// acf_include('includes/compatibility.php');
			// acf_include('includes/deprecated.php');
			// acf_include('includes/l10n.php');
			// acf_include('includes/local-fields.php');
			// acf_include('includes/local-meta.php');
			// acf_include('includes/local-json.php');
			// acf_include('includes/loop.php');
			// acf_include('includes/media.php');
			// acf_include('includes/revisions.php');
			// acf_include('includes/upgrades.php');
			// acf_include('includes/validation.php');
			// acf_include('includes/rest-api.php');

			// Include ajax.
			// acf_include('includes/ajax/class-acf-ajax.php');
			// acf_include('includes/ajax/class-acf-ajax-check-screen.php');
			// acf_include('includes/ajax/class-acf-ajax-user-setting.php');
			// acf_include('includes/ajax/class-acf-ajax-upgrade.php');
			// acf_include('includes/ajax/class-acf-ajax-query.php');
			// acf_include('includes/ajax/class-acf-ajax-query-users.php');
			// acf_include('includes/ajax/class-acf-ajax-local-json-diff.php');

			// Include forms.
			// acf_include('includes/forms/form-attachment.php');
			// acf_include('includes/forms/form-comment.php');
			// acf_include('includes/forms/form-customizer.php');
			// acf_include('includes/forms/form-front.php');
			// acf_include('includes/forms/form-nav-menu.php');
			// acf_include('includes/forms/form-post.php');
			// acf_include('includes/forms/form-gutenberg.php');
			// acf_include('includes/forms/form-taxonomy.php');
			// acf_include('includes/forms/form-user.php');
			// acf_include('includes/forms/form-widget.php');

			// Include admin.

			$admin_screen = 'false';
			if ( is_admin() ) {
				$admin_screen = 'true';
				require_once plugin_dir_path( __FILE__ ) . 'includes/admin/admin.php';
				require_once plugin_dir_path( __FILE__ ) . 'includes/admin/admin-notices.php';
				require_once plugin_dir_path( __FILE__ ) . 'includes/admin/upgrades.php';
				// acf_include('includes/admin/admin-internal-post-type-list.php');
				// acf_include('includes/admin/admin-internal-post-type.php');
				// acf_include('includes/admin/admin-tools.php');
			}
			error_log( 'DT Admin Streen: ' . $admin_screen );

			// Handle Plugin Add, Upgrade, Delete
			if ( ! isset( $version_management ) ) {
				$version_management = new DynamicTablesVersionManagement();
			}

			error_log( 'Switch UNINSTALL method to the uninstall hook before publishing' );
			register_activation_hook( __FILE__, array( $version_management, 'activate_dynamic_tables' ) );
			register_deactivation_hook( __FILE__, array( $version_management, 'deactivate_dynamic_tables' ) );
			register_deactivation_hook( __FILE__, array( $version_management, 'uninstall_dynamic_tables' ) );
			// register_uninstall_hook(__FILE__, [$version_management, 'uninstall_dynamic_tables']);
			$version_management->dynamic_tables_has_upgrade( DT_UPGRADE_VERSION );

			// Initialize Web Services
			add_action( 'rest_api_init', array( $this, 'establish_services' ) );

			// Init block
			add_action( 'init', array( $this, 'dynamic_tables_block_init' ) );

			// Hook into the admin menu to add custom plugin actions
			// add_action('admin_menu', [ $this, 'dt_plugin_delete_confirmation_page' ]);
			// Hook into plugin deletion to display confirmation page
			// register_deactivation_hook(__FILE__, [ $this, 'dt_plugin_delete_data_on_uninstall' ]);
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
		public function has_setting( $name ) {
			return isset( $this->settings[ $name ] );
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
		public function get_setting( $name ) {
			return isset( $this->settings[ $name ] ) ? $this->settings[ $name ] : null;
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
		public function update_setting( $name, $value ) {
			$this->settings[ $name ] = $value;
			return true;
		}

		/**
		 * Define constant
		 *
		 * @param  string $name  The name of the constant
		 * @param  mixed  $value  The value of the constant
		 */
		public function define_constant( $name, $value ) {
			if ( ! defined( $name ) ) {
				define( $name, $value );
			}
		}

		public function establish_services() {
			$controller = new Dynamic_Tables_REST_Controller();
			$controller->register_routes();
		}

		public function dynamic_tables_block_init() {
			add_action( 'admin_enqueue_scripts', array( $this, 'dynamic_tables_scripts' ) );
			register_block_type_from_metadata( __DIR__ . '/build' );
		}

		public function dynamic_tables_scripts() {
			try {
				// wp_enqueue_script('dt-deactivate-plugin', plugin_dir_url(__FILE__) . 'deactivate-plugin.js', null, '1.0', true);
				wp_add_inline_script(
					'dynamic-tables-dynamic-tables-editor-script',
					'gls_test_data = ' . json_encode(
						array(
							'root_url' => get_site_url() . '/wp-json/dynamic-tables/v1/table',
							'dt_nonce' => wp_create_nonce( 'dt_nonce' ),
						)
					),
					'after'
				);

			} catch ( \Exception $e ) {
				error_log( 'Error adding inline script: ' . $e );
			}
		}

		/**
		 * This section is temporary for custom deactivation processing
		 */

		// Add a page for asking the user if they want to retain or remove the data

		public function dt_plugin_delete_confirmation_page() {
			error_log( 'Adding Deactivation Page to submenu' );
			add_submenu_page(
				'plugins.php',                            // Parent menu (Plugins)
				'Confirm Dynamic Tables Data Deletion',   // Page title
				'Confirm Data Deletion',                  // Menu title
				'manage_options',                         // Capability
				'dt-plugin-delete',                       // Menu slug
				array( $this, 'dt_plugin_delete_confirmation' )// Callback function
			);
		}

		// Display the confirmation message
		public function dt_plugin_delete_confirmation() {
			error_log( '... Processing Delete Page Logic' );
			if ( isset( $_POST['dt_retaining_data'] ) ) {
				update_option( 'dt_data_retained', true ); // Retain data
				$this->dt_redirect_to_plugins_page();
			} elseif ( isset( $_POST['dt_removing_data'] ) ) {
				update_option( 'dt_data_retained', false ); // Remove data
				$this->dt_remove_plugin_data();           // Call the function to remove data
				$this->dt_redirect_to_plugins_page();
			}

			// Output the confirmation message form
			?>
	<div class="wrap">
		<h1><?php echo 'Do you want to retain or remove the Dynamic Tables data?'; ?></h1>
		<form method="post">
			<input type="submit" name="dt_retaining_data" value="Retain Data" class="button button-primary">
			<input type="submit" name="dt_removing_data" value="Remove Data" class="button button-secondary">
		</form>
	</div>

			<?php
			error_log( '... Delete Page Created' );
		}

			// Redirect back to the Plugins page after action
		public function dt_redirect_to_plugins_page() {
			error_log( '... Delete page processed, redirect to plugins page' );
			wp_redirect( admin_url( 'plugins.php' ) );
			exit;
		}

			// Function to handle the actual removal of data
		public function dt_remove_plugin_data() {
			error_log( 'In function to remove data' );
		}

			// Handle plugin data removal on uninstall
		public function dt_plugin_delete_data_on_uninstall() {
			error_log( '... In the Delete hook' );

			?>
				<div>
			<p>
				Do you want to remove underlying data tables?
			</p>
		</div>

			<?php
			$this->dt_remove_plugin_data();
				// If the option is set to remove the data, delete it
				// if (get_option('dt_data_retained') === false) {
				// dt_remove_plugin_data();
				// }
		}
	}

			/**
			 * The main function responsible for returning the one true dynamic tables Instance to functions everywhere.
			 * Use this function like you would a global variable, except without needing to declare the global.
			 *
			 * Example: <?php $dynamic_tables = dynamicTables(); ?>
			 *
			 * @date    4/09/13
			 * @since   4.3.0
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
				// return DynamicTables::get_instance();
	}

	// Instantiate.
	dynamic_tables();

} else {
	error_log( 'NO Initialize - DT class already exists' );
}
