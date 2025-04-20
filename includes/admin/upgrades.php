<?php

namespace DynamicTables;

/**
 * Support Dynamic Tables Plugin Activation, Deactivation, and Upgrades
 *
 * @since 1.00.00
 */
class DynamicTablesVersionManagement {

	/**
	 * The plugin version number.
	 *
	 * @since   1.0.0
	 *
	 * @var string
	 */
	protected $current_db_version;

	/**
	 * Class Instanciation
	 *
	 * Includes the WD upgrade library and gets the installed database version.
	 *
	 * @since 1.00.00
	 *
	 * @return void
	 */
	public function __construct() {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		if ( get_option( 'dt-version' ) ) {
				$this->current_db_version = get_option( 'dt-version' );
			}
		}

	/**
	 * Workflow for activation
	 *
	 * Ensures that activation rules are met, fails the activation if not, and prepares
	 * for activation database activities
	 *
	 * @since 1.00.00
	 *
	 * @param  bool $network_wide True if the activation attempt is for the full network.
	 * @return void
	 */
	public function activate_dynamic_tables($network_wide) {
		$notices = new DT_Admin_Notices();

		// Network (multisite) activation
		if ( DT_IS_MULTISITE and $network_wide ) {

			// Error if multisite activation is not allowed
			if ( ! DT_ALLOW_MULTISITE_ACTIVATION ) {
				$message = $notices->admin_notice_library( 'network-activation-error' );
				$title = 'Network Activation Not Allowed';
				$args = array(
					'back_link' => true,
				);

				wp_die($message, $title, $args);
			} else {

				// Activate all sites if allowed
				error_log('In multisite activation is supported');
				$sites = get_sites();
				foreach ( $sites as $site ) {
					error_log('Looping site for activation');
					switch_to_blog( $site->blog_id);
					$this->create_environment_on_activation();
					restore_current_blog();
				}
			}
		} else {
			// Activate specific site
			error_log('Site level activation');
			$this->create_environment_on_activation();
		}
	}

	public function new_site_setup($site) {
		error_log('Activating new site on multi-site network');
		switch_to_blog( $site->id);
		$this->create_environment_on_activation();
		restore_current_blog();
	}

	public function deactivate_dynamic_tables() {
		// Silence is golden
		?><div>
			<p class="dt-deactivate">
				Do you want to remove underlying data tables?
			</p>
		</div><?php
	}

	public function uninstall_dynamic_tables($network_wide) {
		error_log( 'Uninstalling DT' );

		// Network (multisite) activation
		if ( DT_IS_MULTISITE and $network_wide ) {
			$sites = get_sites();
			foreach ( $sites as $site ) {
				error_log( 'Looping site for deactivation' );

				switch_to_blog( $site->blog_id);
				if ( get_option('dt_keep_tables_on_uninstall') ) {
					update_option('dt_activation_status', 'Uninstalled');
				} else {
					$this->remove_environment_on_deactivation();
				}
				restore_current_blog();
			}
		} elseif ( get_option('dt_keep_tables_on_uninstall') ) {
			update_option('dt_activation_status', 'Uninstalled');
		} else {
			$this->remove_environment_on_deactivation();
		}
	}

	/**
	 * Initialize Dynamic Tables core database environment
	 *
	 * Create Dynamic Tables database entries if they do not already exist
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function create_environment_on_activation() {
		// $current_activation_status = ;
		// error_log('Current Activation Status = '. $current_activation_status);
		if ( get_option('dt_activation_status') ) {
			error_log('Activating prior inactive install');
			update_option( 'dt_activation_status', 'Active' );
		} else {
			error_log('New Activation');
			add_option( 'dt_activation_status', 'Active' );
			add_option( 'dt_keep_tables_on_uninstall', 1 );
		}

		if ( ! isset( $current_db_version ) ) {
			error_log( 'Adding DT tables' );

			global $wpdb;

			$charset_collate = $wpdb->get_charset_collate();

			// Plugin tables
			// $dt_header_tbl = $wpdb->prefix . 'dt_tables';
			// $dt_columns_tbl = $wpdb->prefix . 'dt_table_columns';
			// $dt_rows_tbl   = $wpdb->prefix . 'dt_table_rows';
			// $dt_cells_tbl  = $wpdb->prefix . 'dt_table_cells';

			$dt_header_tbl = $wpdb->prefix . 'dt_tables_test';
			$dt_columns_tbl = $wpdb->prefix . 'dt_table_columns_test';
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

	private function remove_environment_on_deactivation() {
		global $wpdb;

		// Plugin tables
		$dt_header_tbl    = $wpdb->prefix . 'dt_tables';
		$dt_columns_tbl   = $wpdb->prefix . 'dt_table_columns';
		$dt_rows_tbl      = $wpdb->prefix . 'dt_table_rows';
		$dt_cells_tbl     = $wpdb->prefix . 'dt_table_cells';

		// $dt_header_tbl    = $wpdb->prefix . 'dt_tables_test';
		// $dt_columns_tbl   = $wpdb->prefix . 'dt_table_columns_test';
		// $dt_rows_tbl      = $wpdb->prefix . 'dt_table_rows_test';
		// $dt_cells_tbl     = $wpdb->prefix . 'dt_table_cells_test';

		$sql = "DROP TABLE IF EXISTS $dt_header_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dt_columns_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dt_rows_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dt_cells_tbl";
		$wpdb->query( $sql );

		delete_option( 'dt_version' );
		delete_option( 'dt_keep_tables_on_uninstall' );
		delete_option( 'dt_activation_status' );
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
			// delete_transient('acf_network_upgrade_needed_' . DT_UPGRADE_VERSION);
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
