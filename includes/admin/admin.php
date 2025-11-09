<?php
/**
 * Provides the main Dynamic Tables admin page.
 *
 * @since 1.0.0
 */

namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class DTBK_Admin {

	private string $per_page_option   = 'dynamic_table_blocks_per_page';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_filter( "set_screen_option_{$this->per_page_option}", array( $this, 'set_per_page' ), 10, 3);
		// add_filter( 'set-screen-option', array( $this, 'set_per_page' ), 10, 3);
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
		if ( ! dtbk_get_setting( 'show_admin' ) ) {
			return;
		}

		// Vars.
		$cap       = dtbk_get_setting( 'capability' );
		$menu_slug = 'dynamic-table-blocks/main-menu.php';

		// Add menu items.
		$main_page_hook = add_menu_page(
			__( 'Dynamic Tables', 'dynamic-table-blocks' ),
			__( 'Dynamic Tables', 'dynamic-table-blocks' ),
			$cap,
			$menu_slug,
			array( $this, 'plugin_main_admin' ),
			'dashicons-editor-table',
			40
		);

		// make the location 21 for network page
		$parent_slug = $menu_slug;
		$menu_slug   = 'dynamic-table-blocks/main-menu.php';

		add_submenu_page(
			$parent_slug,
			__( 'Main Admin', 'dynamic-table-blocks' ),
			__( 'Main', 'dynamic-table-blocks' ),
			$cap,
			$menu_slug,
			array( $this, 'plugin_main_admin' )
		);

		$menu_slug   = 'list_dynamic_table_blocks';

		$table_maintenance_page_hook = add_submenu_page(
			$parent_slug,
			__( 'Main Admin', 'dynamic-table-blocks' ),
			__( 'Table Maintenance', 'dynamic-table-blocks' ),
			$cap,
			$menu_slug,
			array( $this, 'plugin_table_maintenance' )
		);

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( "load-{$table_maintenance_page_hook}", array( $this, 'dynamic_table_blocks_screen_options' ) );

		// add_action( "load-{$main_page_hook}", array( $this, 'enqueue_admin_assets' ) );
	}

	public function enqueue_admin_assets() {
		wp_enqueue_style( 'adminCss', dtbk_get_setting( 'url' ) . 'assets/css/admin.css' );

		// Fix to make conditional
		// if ( 'list_dynamic_table_blocks' === $hook ) {
			wp_enqueue_script( 'jquery-ui-dialog' );
			wp_enqueue_style( 'wp-jquery-ui-dialog' );
			wp_enqueue_script(
				'dt-table-list',
				// plugins_url('dt-table-list.js', __FILE__),
				dtbk_get_setting( 'url' ) . 'assets/js/dt-table-list.js',
				[ 'jquery', 'jquery-ui-dialog' ],
				'1.1.0',
				true
			);

			wp_localize_script( 'dt-table-list', 'DT_TABLE_LIST', [
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'dt-table-list' ),
				'i18n'    => [
					'view'         => __( 'View table data.', 'dynamic-table-blocks' ),
					'deleted'      => __( 'Deleted successfully.', 'dynamic-table-blocks' ),
					'error'        => __( 'Something went wrong.', 'dynamic-table-blocks' ),
					'confirmTitle' => __( 'Confirm Delete', 'dynamic-table-blocks' ),
					'confirmBody'  => __( 'Are you sure you want to delete the selected item(s)? This cannot be undone.', 'dynamic-table-blocks' ),
					'cancel'       => __( 'Cancel', 'dynamic-table-blocks' ),
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
		$notices = new DTBK_Admin_Notices();

		$keep_tables_value = isset( $_POST['dtbk_keep_tables_on_uninstall'] ) ? '1' : '0'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing -- Checked elsewhere.
		update_option( 'dtbk_keep_tables_on_uninstall', $keep_tables_value );
		echo $notices->admin_notice_library( 'save-success' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML

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
		$notices = new DTBK_Admin_Notices();

		if ( $_POST ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing -- This is a nonce verification.
			if ( ! dtbk_verify_nonce( 'dtbkAdminNonce', 'saveSettings', 'edit_plugins' ) ) {
				echo $notices->admin_notice_library( 'save-fail-permissions' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
				return;
			}

			$this->handle_form();
		}

		?>
		<div class="wrap dtbk-setting-default">

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
				<?php wp_nonce_field('saveSettings', 'dtbkAdminNonce'); ?>

				<div class="admin-checkbox">
					<span>
						<label for="dtbk_keep_tables_on_uninstall">Do you want to keep table data when plugin is removed?</label>
						<input name="dtbk_keep_tables_on_uninstall" id="dtbk_keep_tables_on_uninstall" type="checkbox" value="1"
							<?php checked( '1', get_option( 'dtbk_keep_tables_on_uninstall' ) ); ?>></input>
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
	 * @global Object  $table                          DTBK_List_Dynamic_Table_Blocks
	 *
	 * @return void
	 */
	public function dynamic_table_blocks_screen_options() {
		global $table_maintenance_page_hook;
		global $table;

		$screen = get_current_screen();

		error_log('Screen: ' . json_encode($screen));
		error_log('Maint Table Hook: ' . json_encode($table_maintenance_page_hook));

		/**
		 * if ( ! is_object($screen) || $screen->id !== $table_maintenance_page_hook ) {
		 *  return;
		 * }
		 */

		$args = array(
			'label'   => __( 'Number of tables per page', 'dynamic - table - blocks' ),
			'default' => 20,
			'option'  => $this->per_page_option,
		);
		add_screen_option( 'per_page', $args );

		$table = new DTBK_List_Dynamic_Table_Blocks();
	}

	/**
	 * Update options for the new number of tables to display on a page
	 *
	 * @since 1.1.0
	 *
	 * @param  bool $status - Value has changed (true) or not (false)
	 * @param  string $option - Identifier of specific screen option
	 * @param  int $value - Number of pages for the option
	 *
	 * @return int - Updated number of tables to display per page
	 */
	public function set_per_page ($status, $option, $value) {
			error_log('In per page');
		if ( $this->per_page_option === $option ) {
			$value = (int) $value;
			if ($value < 1) $value = 1;
			if ($value > 200) $value = 200;
			return $value;
		}
		return $status;
	}

	/**
	* Create HTML formattedlist of Dynamic Tables
	*
	* @since 1.1.0
	*
	* @return void
	*/
	public function plugin_table_maintenance() {
		$admin_table_listing = new DTBK_List_Dynamic_Table_Blocks();

		echo '<div class = "wrap"><h2>Dynamic Table List</h2>';
		echo '<form method = "post">';

		$admin_table_listing->prepare_items();
		$admin_table_listing->search_box('Search Tables', 'search_id');

		echo ' <input type="hidden" name="page" value="list_dynamic_table_blocks"/> ';
		$admin_table_listing->display();

		echo ' </form> ';
		echo ' </div> ';

		// A hidden dialog div the script will turn into a modal
		echo ' <div id="dt-dialog" title="' . esc_attr__( 'Confirm View', 'dynamic-table-blocks' ) . '"style="display:none;">
				<p> ' . esc_html__( 'Are you sure you want to view the selected item ? ', 'dynamic-table-blocks' ) . ' </p>
			</div>';

		// (WP notice styles)
		echo '<div id="dt-js-notices" aria-live="polite"> </div>';
	}
}

// Instantiate.
dtbk_new_instance( 'DTBK_Admin' );
