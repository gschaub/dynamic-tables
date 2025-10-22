<?php
/**
 * Provides the main Dynamic Tables admin page.
 */
namespace DynamicTables;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

if ( ! class_exists( DT_Admin::class ) ) {

	class DT_Admin {
		/**
		 * Constructor.
		 *
		 * @since 1.1.0
		 */
		public function __construct() {
			add_action( 'admin_menu', array( $this, 'admin_menu' ) );
			add_filter( 'set-screen-option', array( $this, 'set_per_page' ), 10, 3);
		}

		/**
		 * Adds the Dynamic Tables menu item.
		 *
		 * @since   1.0.0
		 *
		 * @return void
		 */
		public function admin_menu() {
			// Bail early if DT is hidden.
			if ( ! dt_get_setting( 'show_admin' ) ) {
				return;
			}

			// Vars.
			global $table_maintenance_page_hook;

			$cap       = dt_get_setting( 'capability' );
			$menu_slug = 'main_menu';

			// Add menu items.
			$main_page_hook = add_menu_page(
				__( 'Dynamic Tables', 'dynamic-tables' ),
				__( 'Dynamic Tables', 'dynamic-tables' ),
				$cap,
				$menu_slug,
				array( $this, 'plugin_main_admin' ),
				'dashicons-editor-table',
				40
			);

			// make the location 21 for network page
			$parent_slug = $menu_slug;

			add_submenu_page(
				$parent_slug,
				__( 'Main Admin', 'dynamic-tables' ),
				__( 'Main', 'dynamic-tables' ),
				$cap,
				$menu_slug,
				array( $this, 'plugin_main_admin' )
			);

			$menu_slug   = 'list_dynamic_tables';

			$table_maintenance_page_hook = add_submenu_page(
				$parent_slug,
				__( 'Main Admin', 'dynamic-tables' ),
				__( 'Table Maintenance', 'dynamic-tables' ),
				$cap,
				$menu_slug,
				array( $this, 'plugin_table_maintenance' )
			);

			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
			add_action( "load-{$table_maintenance_page_hook}", array( $this, 'dynamic_table_screen_options' ) );
		}


		/**
		 * Enqueue styles and javascript
		 *
		 * @since 1.1.0
		 *
		 * @return void
		 */
		public function enqueue_admin_assets($hook) {
			wp_enqueue_style( 'adminCss', dt_get_setting( 'url' ) . 'assets/css/admin.css' );

			// Fix to make conditional
			// if ( 'list_dynamic_tables' === $hook ) {
				wp_enqueue_script( 'jquery-ui-dialog' );
				wp_enqueue_style( 'wp-jquery-ui-dialog' );
				wp_enqueue_script(
					'dt-table-list',
					// plugins_url('dt-table-list.js', __FILE__),
					dt_get_setting( 'url' ) . 'assets/js/dt-table-list.js',
					[ 'jquery', 'jquery-ui-dialog' ],
					'1.1.0',
					true
				);

				wp_localize_script( 'dt-table-list', 'DT_TABLE_LIST', [
					'ajaxUrl' => admin_url( 'admin-ajax.php' ),
					'nonce'   => wp_create_nonce( 'dt-table-list' ),
					'i18n'    => [
						'view'         => __( 'View table data.', 'dynamic-tables' ),
						'deleted'      => __( 'Deleted successfully.', 'dynamic-tables' ),
						'error'        => __( 'Something went wrong.', 'dynamic-tables' ),
						'confirmTitle' => __( 'Confirm Delete', 'dynamic-tables' ),
						'confirmBody'  => __( 'Are you sure you want to delete the selected item(s)? This cannot be undone.', 'dynamic-tables' ),
						'cancel'       => __( 'Cancel', 'dynamic-tables' ),
					],
				] );
			// }
		}

		/**
		 * Perform updates upon form submit
		 *
		 * @since   1.0.0
		 *
		 * @return void
		 */
		public function handle_form() {
			$notices = new DT_Admin_Notices();

			$keep_tables_value = isset( $_POST['dt_keep_tables_on_uninstall'] ) ? '1' : '0'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing -- Checked elsewhere.
			update_option( 'dt_keep_tables_on_uninstall', $keep_tables_value );
			echo $notices->admin_notice_library( 'save-success' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML

			if ( $keep_tables_value === '0' ) {
				echo $notices->admin_notice_library( 'uninstall-table-warning' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
			}
		}

		/**
		 * Register all output admin main page
		 *
		 * @since   1.0.0
		 */
		public function plugin_main_admin() {
			$notices = new DT_Admin_Notices();

			if ( $_POST ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing -- This is a nonce verification.
				if ( ! dt_verify_nonce( 'dtAdminNonce', 'saveSettings', 'edit_plugins' ) ) {
					echo $notices->admin_notice_library( 'save-fail-permissions' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
					return;
				}

				$this->handle_form();
			}

			?>
			<div class="wrap dt-setting-default">

				<h1>Dynamic Tables</h1>

				<p>
					Welcome to the initial release of the <strong>Dynamic Tables</strong> block plugin.  We take a different
					approach to displaying and formatting table data that other plugins we've seen to address challenges
					we've experienced with other plugins.  Dynamic tables directly helps with:
					<ul>
						<li>Responsive table formatting - Table columns can shrink and grow as the browers window size changes and the table will not become malformed</li>
						<li class="li">Tables can be limited to a specific size with optionally available to support readability</li>
						<li class="li">The first table row can optionionally be configured as a heading</li>
						<li class="li">Highly granular support for formats including row banding, alignment and font support, and other tools support your presentational goals</li>
					</ul>
					This plugin is <strong>free</strong> to use.  A premium version is planned.
				</p>

				<h2>Settings</h2>

				<form method="POST">
					<?php wp_nonce_field('saveSettings', 'dtAdminNonce'); ?>

					<div class="admin-checkbox">
						<span>
							<label for="dt_keep_tables_on_uninstall">Do you want to keep table data when plugin is removed?</label>
							<input name="dt_keep_tables_on_uninstall" id="dt_keep_tables_on_uninstall" type="checkbox" value="1"
								<?php checked( '1', get_option( 'dt_keep_tables_on_uninstall' ) ); ?>></input>
						</span>
					</div>

					<div>
						<input type="submit" name="submit" id="submit" class="button button-primary" value="Save Changes">
					</div>
				</form>
			</div>
			<?php
		}

		/**
		 * Create list options page
		 *
		 * Description - A supplement to the summary, above.  Full sentences.
		 *
		 * @since 1.1.0
		 *
		 * @global Object  $table_maintenance_page_hook    Submenu
		 * @global Object  $table                          DT_List_Dynamic_Tables
		 *
		 * @return void
		 */
		public function dynamic_table_screen_options() {
			global $table_maintenance_page_hook;
			global $table;

			$screen = get_current_screen();

			if ( ! is_object($screen) || $screen->id !== $table_maintenance_page_hook ) {
				return;
			}

			$args = array(
				'label'   => __( 'Number of tables per page', 'dynamic-table' ),
				'default' => 20,
				'option'  => 'dynamic_tables_per_page',
			);
			add_screen_option( 'per_page', $args );

			$table = new DT_List_Dynamic_Tables();
		}

		/**
		 * Update options for the new number of tables to display on a page
		 *
		 * @since 1.1.0
		 *
		 * @param  bool $status - Value has changed (true) or not (false)
		 * @param  string $option - Identifier of specific screen option
		 * @param  int $value - Number of pages for the option

		 * @return int - Updated number of tables to display per page
		 */
		public function set_per_page ($status, $option, $value) {
			if ( 'dynamic_tables_per_page' === $option ) {
				$value = (int) $value;
				if ($value < 1) $value = 1;
				if ($value > 200) $value = 200;
				return $value;
			}
			return $status;
		}

		/**
		* Create list of Dynamic Tables
		*
		* @since 1.1.0
		*
		* @return void
		*/
		public function plugin_table_maintenance() {
			$admin_table_listing = new DT_List_Dynamic_Tables();

			echo '<div class="wrap"><h2>Dynamic Table List</h2>';
			echo '<form method="post">';

			$admin_table_listing->prepare_items();
			$admin_table_listing->search_box('Search Tables', 'search_id');

			echo '<input type="hidden" name="page" value="list_dynamic_tables" />';
			$admin_table_listing->display();

			echo '</form>';
			echo '</div>';

			// A hidden dialog div the script will turn into a modal
			echo '<div id="dt-dialog" title="' . esc_attr__( 'Confirm View', 'dynamic-table' ) . '" style="display:none;">
			        <p>' . esc_html__( 'Are you sure you want to view the selected item?', 'dynamic-table' ) . '</p>
      			</div>';

			// (WP notice styles)
			echo '<div id="dt-js-notices" aria-live="polite"></div>';
		}
	}

	// Instantiate.
	dt_new_instance( 'DT_Admin' );
}
