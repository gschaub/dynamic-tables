<?php

namespace DynamicTables;

class DynamicTablesVersionManagement {

	/**
	 * The plugin version number.
	 *
	 * @date    9/30/2024
	 * @since   1.0.0
	 *
	 * @var string
	 */
	protected $current_db_version;

	/**
	 * Nothing to initialize
	 */
	public function __construct() {
		/**
		 *  dt_get_db_version
		 *
		 *  Returns the Dynamic Tables DB version.
		 *
		 *  @date    9/2/2024
		 *  @since   1.0.0
		 *
		 *  @param   void
		 *  @return  string
		 */
		if ( get_option( 'dt_version' ) ) {
			$this->current_db_version = get_option( 'dt_version' );
		}
	}

	public static function activate_dynamic_tables() {

		if ( ! isset( $current_db_version ) ) {
			error_log( 'Activating DT' );

			global $wpdb;

			$charset_collate = $wpdb->get_charset_collate();

			// Plugin tables
			$dt_header_tbl = $wpdb->prefix . 'dt_tables_test';
			$dt_columns_tbl = $wpdb->prefix . 'dt_table_columns_t_tst';
			$dt_rows_tbl   = $wpdb->prefix . 'dt_table_rows_test';
			$dt_cells_tbl  = $wpdb->prefix . 'dt_table_cells_test';

			/**
			 * Create plugin tables
			 */
			$sql = "CREATE TABLE $dt_header_tbl (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            block_table_ref varchar(15) NOT NULL,
            status varchar(10) NOT NULL,
            post_id bigint(20) unsigned NOT NULL,
            table_name varchar(60) NOT NULL,
            attributes text DEFAULT NULL,
            classes text DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY  post (post_id,id)
        )  $charset_collate;";

			dbDelta( $sql );

			$sql = "CREATE TABLE $dt_columns_tbl (
            table_id bigint(20) unsigned NOT NULL,
            column_id int(11) NOT NULL,
            column_name varchar(60) NOT NULL DEFAULT ' ',
            attributes text DEFAULT NULL,
            classes text DEFAULT NULL,
            PRIMARY KEY  (table_id,column_id)
        )  $charset_collate;";

			dbDelta( $sql );

			$sql = "CREATE TABLE $dt_rows_tbl (
            table_id bigint(20) unsigned NOT NULL,
            row_id int(11) NOT NULL,
            attributes text DEFAULT NULL,
            classes text DEFAULT NULL,
           PRIMARY KEY  (table_id,row_id)
        )  $charset_collate;";

			dbDelta( $sql );

			$sql = "CREATE TABLE $dt_cells_tbl (
            table_id bigint(20) unsigned NOT NULL,
            column_id int(11) NOT NULL,
            row_id int(11) NOT NULL,
            attributes text DEFAULT NULL,
            classes text DEFAULT NULL,
            content longtext DEFAULT NULL,
            PRIMARY KEY  (table_id,column_id,row_id)
        )  $charset_collate;";

			dbDelta( $sql );

			add_option( 'dt_version', DT_VERSION );
		}
	}

	public static function deactivate_dynamic_tables() {
		// Silence is golden
		?><div>
			<p class="dt-deactivate">
				Do you want to remove underlying data tables?
			</p>
		</div>
		<?php
	}

	public static function uninstall_dynamic_tables() {
		error_log( 'Uninstalling DT' );
		?>

		<div>
			<p class="dt-deactivate">
				Do you want to remove underlying data tables?
			</p>
		</div>
		<?php

		global $wpdb;

		// Plugin tables
		$dt_header_tbl    = $wpdb->prefix . 'dt_tables_test';
		$dt_columns_tbl = $wpdb->prefix . 'dt_table_columns_t_tst';
		$dt_rows_tbl      = $wpdb->prefix . 'dt_table_rows_test';
		$dt_cells_tbl     = $wpdb->prefix . 'dt_table_cells_test';

		$sql = "DROP TABLE IF EXISTS $dt_header_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dt_columns_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dt_rows_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dt_cells_tbl";
		$wpdb->query( $sql );

		delete_option( 'dt_version' );
	}

	/**
	 *  dynamic_tables_has_upgrade
	 *
	 *  Returns true if this site has an upgrade avaialble.
	 *
	 *  @date    9/2/2024
	 *  @since   1.0.0
	 *
	 *  @param   void
	 *  @return  bool
	 */
	public function dynamic_tables_has_upgrade() {

		// Set current version the lowest possible version if not previously installed
		if ( ! isset( $this->current_db_version ) ) {
			$this->current_db_version = '0.0.0';
		}

		if ( $this->current_db_version && $this->dt_version_compare( $this->current_db_version, '<', DT_UPGRADE_VERSION ) ) {
			return true;
		}

		if ( $this->current_db_version !== DT_VERSION ) {
			$this->dt_update_db_version( DT_VERSION );
		}

		return false;
	}

	/**
	 *  Runs upgrade routines if this site has an upgrade available.
	 *
	 *  @date  24/8/18
	 *  @since 5.7.4
	 */
	public function dt_upgrade_all() {
		// Increase time limit if possible.
		if ( function_exists( 'set_time_limit' ) ) {
			set_time_limit( 600 );
		}

		// start timer
		// timer_start();

		// log
		// acf_dev_log('ACF Upgrade Begin.');

		/**
		 *  Placeholder for future release upgrades with the upgrade targets
		 *  listed in ascending release order
		 */

		// Version number (x.x.x) for upgrade target
		if ( $this->dt_version_compare( $this->current_db_version, '<', '5.0.0' ) ) {
			// upgrade method for this upgrade version - e.g., dt_upgrade_500();
		}

		/**
		 * When adding new upgrade routines here, increment the DT_UPGRADE_VERSION
		 * constant in `dynamic-tables.php` to the new highest upgrade version.
		 */

		// upgrade DB version once all updates are complete
		$this->dt_update_db_version( DT_VERSION );

		if ( is_multisite() ) {
			// Clears the network upgrade notification banner after site upgrades.
			// delete_site_transient('acf_network_upgrade_needed_' . DT_UPGRADE_VERSION);
		}

		// log
		// acf_dev_log('ACF Upgrade Complete.', $wpdb->num_queries, timer_stop(0));
	}

	/*
	 *  dt_update_db_version
	 *
	 *  Updates the DT DB version.
	 *
	 *  @date    9/2/2024
	 *  @since   1.0.0
	 *
	 *  @param   string $version The new version.
	 *  @return  void
	 */
	function dt_update_db_version( $version = '' ) {
		update_option( 'dt_version', $version );
	}

	/**
	 * dt_version_compare
	 *
	 * Similar to the version_compare() function but with extra functionality.
	 *
	 * @since   5.5.0
	 *
	 * @param   string $left    The left version number.
	 * @param   string $compare The compare operator.
	 * @param   string $right   The right version number.
	 * @return  boolean
	 */
	public function dt_version_compare( $left = '', $compare = '>', $right = '' ) {

		// Detect 'wp' placeholder.
		if ( $left === 'wp' ) {
			global $wp_version;
			$left = $wp_version;
		}

		// Return result.
		return version_compare( $left, $right, $compare );
	}
}
