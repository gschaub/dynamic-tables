<?php
/**
 * Provides the main Dynamic Tables admin page.
 *
 * @since 1.0.0
 * @package DynamicTableBlocks
 */

namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class DTBK_Admin {

	private string $per_page_option = 'dynamic_table_blocks_per_page';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_filter( "set_screen_option_{$this->per_page_option}", array( $this, 'set_per_page' ), 10, 3 );
		add_action( 'admin_post_dtbk_export_download', array( $this, 'handle_export_download' ) );
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
		$cap         = dtbk_get_setting( 'capability' );
		$parent_slug = 'dynamic-table-blocks/main-menu.php';

		// Add menu items.
		add_menu_page(
			__( 'Dynamic Tables', 'dynamic-table-blocks' ),
			__( 'Dynamic Tables', 'dynamic-table-blocks' ),
			$cap,
			$parent_slug,
			array( $this, 'plugin_main_admin' ),
			'dashicons-editor-table',
			40
		);

		/**
		 * Ensure the URL Base uses the plugin slug rather than transforming the Dyamic Tables plugin name
		 * to dynamic-tables which is the default behavior WordPress uses.
		 */
		global $admin_page_hooks;
		if ( isset( $admin_page_hooks[ $parent_slug ] ) && 'dynamic-tables' === $admin_page_hooks[ $parent_slug ] ) {
			$admin_page_hooks[ $parent_slug ] = 'dynamic-table-blocks'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- stabilize screen base to ensure it matches plugin slug.
		}

		// make the location 21 for network page
		$menu_slug = 'dynamic-table-blocks/main-menu.php';

		add_submenu_page(
			$parent_slug,
			__( 'Main Admin', 'dynamic-table-blocks' ),
			__( 'Main', 'dynamic-table-blocks' ),
			$cap,
			$menu_slug,
			array( $this, 'plugin_main_admin' )
		);

		$menu_slug = 'list_dynamic_table_blocks';

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
	}

	/**
	 * Enqueue admin assets for Dynamic Tables admin screens.
	 *
	 * @since   1.0.0
	 *
	 * @param string $hook Current admin page hook suffix (provided by WordPress).
	 *
	 * @return void
	 */
	public function enqueue_admin_assets( $hook ) {
		$ver_css = filemtime( dtbk_get_setting( 'path' ) . 'assets/css/admin.css' );
		wp_enqueue_style( 'adminCss', dtbk_get_setting( 'url' ) . 'assets/css/admin.css', array(), $ver_css );

		if ( $hook !== 'dynamic-table-blocks_page_list_dynamic_table_blocks' ) {
			return;
		}
		wp_enqueue_script( 'jquery-ui-dialog' );
		wp_enqueue_script( 'jquery-ui-tooltip' );
		wp_enqueue_style( 'wp-jquery-ui-dialog' );

		$ver_js = filemtime( dtbk_get_setting( 'path' ) . 'assets/js/dtbk-table-list.js' );
		wp_enqueue_script(
			'dtbk-table-list',
			dtbk_get_setting( 'url' ) . 'assets/js/dtbk-table-list.js',
			array( 'jquery', 'jquery-ui-dialog' ),
			$ver_js,
			true
		);

		wp_localize_script(
			'dtbk-table-list',
			'DTBK_TABLE_LIST',
			array(
				'ajaxUrl'             => admin_url( 'admin-ajax.php' ),
				'nonce'               => wp_create_nonce( 'dtbk-table-list' ),
				'adminPostUrl'        => admin_url( 'admin-post.php' ),
				'importAnalyzeAction' => 'dtbk_import_analyze',
				'importCommitAction'  => 'dtbk_import_commit',
				'exportAction'        => 'dtbk_export_download',
				'exportNonce'         => wp_create_nonce( 'dtbk_export_download' ),

				// Icon urls.
				'icons'               => array(
					'fileTextRegular'  => dtbk_get_setting( 'url' ) . 'assets/icons/document-text-24-regular.svg',
					'fileTextFilled'   => dtbk_get_setting( 'url' ) . 'assets/icons/document-text-24-filled.svg',
					'fileTableRegular' => dtbk_get_setting( 'url' ) . 'assets/icons/document-table-24-regular.svg',
					'fileTableFilled'  => dtbk_get_setting( 'url' ) . 'assets/icons/document-table-24-filled.svg',
					'fileCSV'          => dtbk_get_setting( 'url' ) . 'assets/icons/csv-fluent-classic.svg',
					'fileJSON'         => dtbk_get_setting( 'url' ) . 'assets/icons/json-fluent-classic.svg',
					'fileXLSX'         => dtbk_get_setting( 'url' ) . 'assets/icons/xlsx-fluent-classic.svg',
				),

				'i18n'                => array(
					'view'                     => __( 'Table Data ', 'dynamic-table-blocks' ),
					'deleted'                  => __( 'Deleted successfully.', 'dynamic-table-blocks' ),
					'delete'                   => __( 'Delete', 'dynamic-table-blocks' ),
					'error'                    => __( 'Something went wrong.', 'dynamic-table-blocks' ),
					'unexpectedResponse'       => __( 'The server returned an unexpected response.', 'dynamic-table-blocks' ),
					'loading'                  => __( 'Loading...', 'dynamic-table-blocks' ),
					'confirmTitle'             => __( 'Confirm Delete', 'dynamic-table-blocks' ),
					'confirmBody'              => __( 'Are you sure you want to delete the selected item(s)? This cannot be undone.', 'dynamic-table-blocks' ),
					'cancel'                   => __( 'Cancel', 'dynamic-table-blocks' ),
					'back'                     => __( 'Back', 'dynamic-table-blocks' ),
					'submit'                   => __( 'Submit', 'dynamic-table-blocks' ),
					'statusTitle'              => __( 'Change Table Status', 'dynamic-table-blocks' ),
					'statusCurrent'            => __( 'Table Status ', 'dynamic-table-blocks' ),
					'deleteTitle'              => __( 'Delete Table', 'dynamic-table-blocks' ),
					'exportTitle'              => __( 'Export Dynamic Table(s)', 'dynamic-table-blocks' ),
					'exportPrompt'             => __( 'Select export format:', 'dynamic-table-blocks' ),
					'exportJson'               => __( 'Backup (JSON)', 'dynamic-table-blocks' ),
					'exportCsv'                => __( 'CSV', 'dynamic-table-blocks' ),
					'exportXlsx'               => __( 'Excel (XLSX)', 'dynamic-table-blocks' ),
					'importTitle'              => __( 'Import Dynamic Tables', 'dynamic-table-blocks' ),
					'importJson'               => __( 'Restore (JSON)', 'dynamic-table-blocks' ),
					'importCsv'                => __( 'CSV', 'dynamic-table-blocks' ),
					'importXlsx'               => __( 'Excel (XLSX)', 'dynamic-table-blocks' ),
					'importIndependentNotice'  => __( 'Imported tables are added to the library. JSON restores can replace an existing local table when the imported table ID already exists.', 'dynamic-table-blocks' ),
					'importRestoreModeTitle'   => __( 'Restore Options', 'dynamic-table-blocks' ),
					'importReplaceExisting'    => __( 'Replace existing table', 'dynamic-table-blocks' ),
					'importCreateNew'          => __( 'Create new independent table', 'dynamic-table-blocks' ),
					'importExistingTableFound' => __( 'A local table with the imported table ID already exists.', 'dynamic-table-blocks' ),
					'importNewTableLabel'      => __( 'New table', 'dynamic-table-blocks' ),
					'importAnalyzePrompt'      => __( 'Upload a file to validate and preview the import.', 'dynamic-table-blocks' ),
					'importReplaceNotice'      => __( 'The imported data will replace the selected table.', 'dynamic-table-blocks' ),
					'importDropPrompt'         => __( 'Drop a file here or click to browse.', 'dynamic-table-blocks' ),
					'importSelectFile'         => __( 'Choose file', 'dynamic-table-blocks' ),
					'importNoFile'             => __( 'No file selected.', 'dynamic-table-blocks' ),
					'importAnalyze'            => __( 'Analyze File', 'dynamic-table-blocks' ),
					'importCommit'             => __( 'Import Table', 'dynamic-table-blocks' ),
					'importFileMissing'        => __( 'Select a file to import.', 'dynamic-table-blocks' ),
					'importFirstRowHeader'     => __( 'Treat first row as headers', 'dynamic-table-blocks' ),
					'importCsvFlatNotice'      => __( 'CSV imports only structure and cell content. Style and smart typing are not imported.', 'dynamic-table-blocks' ),
					'importHeaderNamesTitle'   => __( 'Column Names', 'dynamic-table-blocks' ),
					'importHeaderNameMissing'  => __( 'Enter a name for every column.', 'dynamic-table-blocks' ),
					'importSingleTarget'       => __( 'Import currently supports one target table at a time.', 'dynamic-table-blocks' ),
					'importChooseItem'         => __( 'Backup item', 'dynamic-table-blocks' ),
					'importPreviewTitle'       => __( 'Preview', 'dynamic-table-blocks' ),
					'importWarningsTitle'      => __( 'Warnings', 'dynamic-table-blocks' ),
					'importSourceLabel'        => __( 'Source', 'dynamic-table-blocks' ),
					'importTargetLabel'        => __( 'Target', 'dynamic-table-blocks' ),
					'importRowsLabel'          => __( 'Rows', 'dynamic-table-blocks' ),
					'importColumnsLabel'       => __( 'Columns', 'dynamic-table-blocks' ),
					'importCellsLabel'         => __( 'Cells', 'dynamic-table-blocks' ),
					'importSuccess'            => __( 'Table imported successfully.', 'dynamic-table-blocks' ),
				),
			)
		);
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

		$enable_cron = isset( $_POST['dtbk_cron_enabled'] ) ? '1' : '0'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing -- Checked elsewhere.
		update_option( 'dtbk_cron_enabled', $enable_cron );

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
		$notices     = new DTBK_Admin_Notices();
		$maintenance = DTBK_Maintenance::get_instance();
		$next        = $maintenance->get_next_scheduled();

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
				<?php wp_nonce_field( 'saveSettings', 'dtbkAdminNonce' ); ?>

				<div class="admin-checkbox">
					<span>
						<label for="dtbk_keep_tables_on_uninstall">Do you want to keep table data when plugin is removed?</label>
						<input name="dtbk_keep_tables_on_uninstall" id="dtbk_keep_tables_on_uninstall" type="checkbox" value="1"
							<?php checked( '1', get_option( 'dtbk_keep_tables_on_uninstall' ) ); ?>></input>
					</span>
				</div>

				<hr>

				<div class="admin-checkbox">
					<span>
						<label for="dtbk_cron_enabled">Enable background maintenance?</label>
						<input name="dtbk_cron_enabled" id="dtbk_cron_enabled" type="checkbox" value="1"
							<?php checked( '1', get_option( 'dtbk_cron_enabled' ) ); ?>></input>
					</span>

					<p class="description">
						<?php esc_html_e( 'If your host disables WP-Cron, configure a real cron job to call wp-cron.php or disable this option.', 'dynamic-table-blocks' ); ?>
					</p>

					<p>
						<strong><?php esc_html_e( 'Next scheduled run:', 'dynamic-table-blocks' ); ?></strong>
						<?php
						if ( $next ) {
							printf(
								esc_html( '%1$s at %2$s' ),
								esc_html( date_i18n( get_option( 'date_format' ), $next ) ),
								esc_html( date_i18n( get_option( 'time_format' ), $next ) )
							);
						} else {
							esc_html_e( 'Not currently scheduled.', 'dynamic-table-blocks' );
						}
						?>
					</p>

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

		$args = array(
			'label'   => __( 'Number of tables per page', 'dynamic-table-blocks' ),
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
	 * @param  bool   $status - Value has changed (true) or not (false)
	 * @param  string $option - Identifier of specific screen option
	 * @param  int    $value - Number of pages for the option
	 *
	 * @return int - Updated number of tables to display per page
	 */
	public function set_per_page( $status, $option, $value ) {
		if ( $this->per_page_option === $option ) {
			$value = (int) $value;
			if ( $value < 1 ) {
				$value = 1;
			}
			if ( $value > 200 ) {
				$value = 200;
			}
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

		echo '<div class="wrap">';
		echo '<h1 class="wp-heading-inline">' . esc_html__( 'Dynamic Tables', 'dynamic-table-blocks' ) . '</h1>';
		echo '<a href="#" id="dtbk-import-table-trigger" class="page-title-action">' . esc_html__( 'Import Table', 'dynamic-table-blocks' ) . '</a>';
		echo '<hr class="wp-header-end">';
		echo '<form method = "post">';

		$admin_table_listing->prepare_items();
		$admin_table_listing->search_box( 'Search Tables', 'search_id' );

		echo ' <input type="hidden" name="page" value="list_dynamic_table_blocks"/> ';
		$admin_table_listing->display();

		echo ' </form> ';
		echo ' </div> ';

		// A hidden dialog div the script will turn into a modal for view confirmation
		echo ' <div id="dt-dialog" title="' . esc_attr__( 'Confirm View', 'dynamic-table-blocks' ) . '"style="display:none;">
				<p> ' . esc_html__( 'Are you sure you want to view the selected item ? ', 'dynamic-table-blocks' ) . ' </p>
			</div>';

		// A hidden dialog div the script will turn into a modal for import confirmation
		echo '<div id="dtbk-import-dialog" title="' . esc_attr__( 'Import Dynamic Tables', 'dynamic-table-blocks' ) . '" style="display:none;">
			<p>' . esc_html__( 'Select import format:', 'dynamic-table-blocks' ) . '</p>
			<div class="dtbk-import-buttons">
				<button type="button" class="button button-primary" data-format="json">' . esc_html__( 'Backup (JSON)', 'dynamic-table-blocks' ) . '</button>
				<button type="button" class="button" data-format="csv">' . esc_html__( 'CSV', 'dynamic-table-blocks' ) . '</button>
				<button type="button" class="button" data-format="xlsx">' . esc_html__( 'Excel (XLSX)', 'dynamic-table-blocks' ) . '</button>
			</div>
		</div>';

		// A hidden dialog div the script will turn into a modal for export confirmation
		echo '<div id="dtbk-export-dialog" title="' . esc_attr__( 'Export Dynamic Tables', 'dynamic-table-blocks' ) . '" style="display:none;">
			<p>' . esc_html__( 'Select export format:', 'dynamic-table-blocks' ) . '</p>
			<div class="dtbk-export-buttons">
				<button type="button" class="button button-primary" data-format="json">' . esc_html__( 'Backup (JSON)', 'dynamic-table-blocks' ) . '</button>
				<button type="button" class="button" data-format="csv">' . esc_html__( 'CSV', 'dynamic-table-blocks' ) . '</button>
				<button type="button" class="button" data-format="xlsx">' . esc_html__( 'Excel (XLSX)', 'dynamic-table-blocks' ) . '</button>
			</div>
		</div>';

		// (WP notice styles)
		echo '<div id="dt-js-notices" aria-live="polite"> </div>';
	}

	public function handle_export_download() {

		$cap = dtbk_get_setting( 'capability' );
		if ( ! current_user_can( $cap ) ) {
			wp_die( 'Forbidden', 403 );
		}

		check_admin_referer( 'dtbk_export_download', '_wpnonce' );

		$format  = isset( $_GET['format'] ) ? sanitize_key( wp_unslash( $_GET['format'] ) ) : 'json';
		$ids_raw = isset( $_GET['ids'] ) ? sanitize_text_field( wp_unslash( $_GET['ids'] ) ) : '';
		$ids     = array_values( array_filter( array_map( 'absint', explode( ',', $ids_raw ) ) ) );

		if ( empty( $ids ) ) {
			wp_die( 'No items selected.', 400 );
		}

		switch ( $format ) {
			case 'json':
				$this->export_stream_json_backup( $ids );
				break;

			case 'csv':
				wp_die( 'CSV export not implemented yet.', 501 );

			case 'xlsx':
				wp_die( 'XLSX export not implemented yet.', 501 );

			default:
				wp_die( 'Invalid export format.', 400 );
		}
	}

	private function export_stream_json_backup( array $ids ): void {

		@set_time_limit( 0 );
		ignore_user_abort( true );

		nocache_headers();
		header( 'Content-Type: application/json; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="dtbk-backup-' . gmdate( 'Y-m-d_H-i-s' ) . '.json"' );
		header( 'X-Content-Type-Options: nosniff' );

		if ( function_exists( 'wp_ob_end_flush_all' ) ) {
			wp_ob_end_flush_all();
		}

		$out = fopen( 'php://output', 'wb' );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- Write to output stream.
		fwrite( $out, "{\n" );
		fwrite( $out, '"schema":"dtbk-backup",' );
		fwrite( $out, '"schema_version":1,' );
		fwrite( $out, '"exported_at":"' . gmdate( 'c' ) . '",' );
		fwrite( $out, "\"items\":[\n" );

		$first = true;

		foreach ( $ids as $table_id ) {

			$table = $this->fetch_table_via_rest( (int) $table_id );
			if ( is_wp_error( $table ) || empty( $table ) ) {
				continue;
			}

			$item = array( 'table' => $table ); // <-- table payload shape unchanged

			if ( ! $first ) {
				fwrite( $out, ",\n" );
			}
			$first = false;

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- Write to output stream.
			fwrite( $out, wp_json_encode( $item, JSON_UNESCAPED_SLASHES ) );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- Write to output stream.
		fwrite( $out, "\n]}\n" );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- Write to output stream.
		fclose( $out );
		exit;
	}

	private function fetch_table_via_rest( int $table_id ) {

		$route   = '/dynamic-table-blocks/v1/tables/' . $table_id;
		$request = new \WP_REST_Request( 'GET', $route );
		$request->set_query_params( array( 'context' => 'view' ) );

		$response = rest_do_request( $request );

		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}
}

// Instantiate.
dtbk_new_instance( 'DTBK_Admin' );
