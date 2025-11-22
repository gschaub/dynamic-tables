<?php
/**
 * Support Dynamic Tables Plugin Activation, Deactivation, and Upgrades
 *
 * @since 1.0.0
 */

namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DynamicTableBlocksVersionManagement {

	/**
	 * The plugin version number.
	 *
	 * @since   1.0.0
	 * @since   1.1.0 Added token for encrypted REST services
	 *
	 * @var string
	 */
	protected $current_db_version;

	/**
	 * Class Instanciation
	 *
	 * Includes the WD upgrade library and gets the installed database version.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function __construct() {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		if ( get_option( 'dtbk-version' ) ) {
				$this->current_db_version = get_option( 'dtbk-version' );
			}
		}

	/**
	 * Workflow for activation
	 *
	 * Ensures that activation rules are met, fails the activation if not, and prepares
	 * for activation database activities
	 *
	 * @since 1.0.0
	 *
	 * @param  bool $network_wide True if the activation attempt is for the full network.
	 * @return void
	 */
	public function activate_dynamic_table_blocks($network_wide) {
		$notices = new DTBK_Admin_Notices();

		// Network (multisite) activation
		if ( DTBK_IS_MULTISITE and $network_wide ) {

			// Error if multisite activation is not allowed
			if ( ! DTBK_ALLOW_MULTISITE_ACTIVATION ) {
				$message = $notices->admin_notice_library( 'network-activation-error' );
				$title = 'Network Activation Not Allowed';

				wp_die(wp_kses_post($message),
					esc_html($title),
					array(
						'back_link' => true,
					)
				);
			} else {

				// Activate all sites if allowed
				$sites = get_sites();
				foreach ( $sites as $site ) {
					switch_to_blog( $site->blog_id);
					$this->create_environment_on_activation();
					restore_current_blog();
				}
			}
		} else {
			// Activate specific site
			$this->create_environment_on_activation();
		}
	}

	public function new_site_setup($site) {
		switch_to_blog( $site->id);
		$this->create_environment_on_activation();
		restore_current_blog();
	}

	public function deactivate_dynamic_table_blocks() {
		?><div>
			<p class="dtbk-deactivate">
				Do you want to remove underlying data tables?
			</p>
		</div><?php
	}

	public function uninstall_dynamic_table_blocks($network_wide) {
		// Network (multisite) activation
		if ( DTBK_IS_MULTISITE and $network_wide ) {
			$sites = get_sites();
			foreach ( $sites as $site ) {
				switch_to_blog( $site->blog_id);
				if ( get_option('dtbk_keep_tables_on_uninstall') ) {
					update_option('dtbk_activation_status', 'Uninstalled');
				} else {
					$this->remove_environment_on_deactivation();
				}
				restore_current_blog();
			}
		} elseif ( get_option('dtbk_keep_tables_on_uninstall') ) {
			update_option('dtbk_activation_status', 'Uninstalled');
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
		if ( get_option('dtbk_activation_status') ) {
			update_option( 'dtbk_activation_status', 'Active' );
		} else {
			add_option( 'dtbk_activation_status', 'Active' );
			add_option( 'dtbk_keep_tables_on_uninstall', 1 );
		}

		// Establish security token
		if ( ! get_option( 'dtbk_token', false ) ) {
			// Random, high entropy, stored only in DB
			$secret = wp_generate_password( 64, true, true );
			add_option( 'dtbk_token', $secret, '', false ); // autoload = false
		}

		if ( ! isset( $current_db_version ) ) {
			global $wpdb;

			$charset_collate = $wpdb->get_charset_collate();

			// Plugin tables
			$dtbk_header_tbl = $wpdb->prefix . 'dtbk_tables';
			$dtbk_columns_tbl = $wpdb->prefix . 'dtbk_table_columns';
			$dtbk_rows_tbl   = $wpdb->prefix . 'dtbk_table_rows';
			$dtbk_cells_tbl  = $wpdb->prefix . 'dtbk_table_cells';

			/**
			 * Create plugin tables
			 */
			$sql = "CREATE TABLE $dtbk_header_tbl (
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

			$sql = "CREATE TABLE $dtbk_columns_tbl (
            table_id bigint(20) unsigned NOT NULL,
            column_id int(11) NOT NULL,
            column_name varchar(60) NOT NULL DEFAULT ' ',
            attributes text DEFAULT NULL,
            classes text DEFAULT NULL,
            PRIMARY KEY  (table_id,column_id)
        )  $charset_collate;";

			dbDelta( $sql );

			$sql = "CREATE TABLE $dtbk_rows_tbl (
            table_id bigint(20) unsigned NOT NULL,
            row_id int(11) NOT NULL,
            attributes text DEFAULT NULL,
            classes text DEFAULT NULL,
           PRIMARY KEY  (table_id,row_id)
        )  $charset_collate;";

			dbDelta( $sql );

			$sql = "CREATE TABLE $dtbk_cells_tbl (
            table_id bigint(20) unsigned NOT NULL,
            column_id int(11) NOT NULL,
            row_id int(11) NOT NULL,
            attributes text DEFAULT NULL,
            classes text DEFAULT NULL,
            content longtext DEFAULT NULL,
            PRIMARY KEY  (table_id,column_id,row_id)
        )  $charset_collate;";

			dbDelta( $sql );

			add_option( 'dtbk_version', DTBK_VERSION );
		}
	}

	private function remove_environment_on_deactivation() {
		global $wpdb;

		// Plugin tables
		$dtbk_header_tbl    = $wpdb->prefix . 'dtbk_tables';
		$dtbk_columns_tbl   = $wpdb->prefix . 'dtbk_table_columns';
		$dtbk_rows_tbl      = $wpdb->prefix . 'dtbk_table_rows';
		$dtbk_cells_tbl     = $wpdb->prefix . 'dtbk_table_cells';

		$sql = "DROP TABLE IF EXISTS $dtbk_header_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dtbk_columns_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dtbk_rows_tbl";
		$wpdb->query( $sql );

		$sql = "DROP TABLE  IF EXISTS $dtbk_cells_tbl";
		$wpdb->query( $sql );

		delete_option( 'dtbk_version' );
		delete_option( 'dtbk_keep_tables_on_uninstall' );
		delete_option( 'dtbk_activation_status' );
		delete_option( 'dtbk_token' );
	}

	/**
	 *  dynamic_tables_has_upgrade
	 *
	 *  Returns true if this site has an upgrade avaialble.
	 *
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

		if ( $this->current_db_version && $this->dtbk_version_compare( $this->current_db_version, '<', DTBK_UPGRADE_VERSION ) ) {
			return true;
		}

		if ( $this->current_db_version !== DTBK_VERSION ) {
			$this->dtbk_update_db_version( DTBK_VERSION );
		}

		return false;
	}

	/*
	 *  Updates the DT DB version.
	 *
	 *  @since   1.0.0
	 *
	 *  @param   string $version The new version.
	 *  @return  void
	 */
	function dtbk_update_db_version( $version = '' ) {
		update_option( 'dtbk_version', $version );
	}

	/**
	 * dtbk_version_compare
	 *
	 * Similar to the version_compare() function but with extra functionality.
	 *
	 * @since   1.0.0
	 *
	 * @param   string $left    The left version number.
	 * @param   string $compare The compare operator.
	 * @param   string $right   The right version number.
	 * @return  boolean
	 */
	public function dtbk_version_compare( $left = '', $compare = '>', $right = '' ) {

		// Detect 'wp' placeholder.
		if ( $left === 'wp' ) {
			global $wp_version;
			$left = $wp_version;
		}

		// Return result.
		return version_compare( $left, $right, $compare );
	}
}
