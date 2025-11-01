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


	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
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

		add_action( "load-{$main_page_hook}", array( $this, 'enqueue_admin_assets' ) );
	}

	public function enqueue_admin_assets() {
		wp_enqueue_style( 'adminCss', dtbk_get_setting( 'url' ) . 'assets/css/admin.css' );
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
}

// Instantiate.
dtbk_new_instance( 'DTBK_Admin' );
