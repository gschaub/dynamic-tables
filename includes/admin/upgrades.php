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

require_once __DIR__ . '/database-schema.php';

class DynamicTableBlocksVersionManagement {

	/**
	 * The plugin version number.
	 *
	 * @since   1.0.0
	 * @since   1.1.0 Added token for encrypted REST services
	 *
	 * @var string
	 */
	protected $current_db_version = '0.0.0';

	/**
	 * Class Instanciation
	 *
	 * Includes the WD upgrade library and gets the installed database version.
	 *
	 * @since 1.0.0
	 * @since 2.0.0 Changed dtbk-version to dtbk_version
	 *
	 * @return void
	 */
	public function __construct() {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$installed_version = get_option( 'dtbk_version', false );

		// Support the legacy option name used by older upgrade checks.
		if ( $installed_version === false ) {
			$installed_version = get_option( 'dtbk-version', false );
		}

		if ( $installed_version !== false ) {
			$this->current_db_version = $installed_version;
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
	public function activate_dynamic_table_blocks( $network_wide ) {
		$notices = new DTBK_Admin_Notices();

		// Network (multisite) activation
		if ( DTBK_IS_MULTISITE and $network_wide ) {

			// Error if multisite activation is not allowed
			if ( ! DTBK_ALLOW_MULTISITE_ACTIVATION ) {
				$message = $notices->admin_notice_library( 'network-activation-error' );
				$title   = 'Network Activation Not Allowed';

				wp_die(
					wp_kses_post( $message ),
					esc_html( $title ),
					array(
						'back_link' => true,
					)
				);
			} else {

				// Activate all sites if allowed
				$sites = get_sites();
				foreach ( $sites as $site ) {
					switch_to_blog( $site->blog_id );
					$this->create_environment_on_activation();
					restore_current_blog();
				}
			}
		} else {
			// Activate specific site
			$this->create_environment_on_activation();
		}
	}

	public function new_site_setup( $site ) {
		switch_to_blog( $site->id );
		$this->create_environment_on_activation();
		restore_current_blog();
	}

	public function deactivate_dynamic_table_blocks() {
		?><div>
			<p class="dtbk-deactivate">
				Do you want to remove underlying data tables?
			</p>
		</div>
		<?php

		// Disable and remove cron.
		$maintenance = DTBK_Maintenance::get_instance();
		$maintenance->unschedule_cron_event();
		delete_transient( 'drbk_cron_lock' );
	}

	public function uninstall_dynamic_table_blocks( $network_wide ) {
		// Network (multisite) activation
		if ( DTBK_IS_MULTISITE and $network_wide ) {
			$sites = get_sites();
			foreach ( $sites as $site ) {
				switch_to_blog( $site->blog_id );
				if ( get_option( 'dtbk_keep_tables_on_uninstall' ) ) {
					update_option( 'dtbk_activation_status', 'Uninstalled' );
				} else {
					$this->remove_environment_on_deactivation();
				}
				restore_current_blog();
			}
		} elseif ( get_option( 'dtbk_keep_tables_on_uninstall' ) ) {
			update_option( 'dtbk_activation_status', 'Uninstalled' );
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
	 * @since 1.4.6 - Added option to enable default block styles.
	 * @since 2.0.0 - Moved SQL to a separate file and removed unreliable code.
	 *
	 * @return void
	 */
	public function create_environment_on_activation() {
		if ( get_option( 'dtbk_activation_status' ) ) {
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

		// Ensure cron is enabled and scheduled on activation.
		$maintenance = DTBK_Maintenance::get_instance();

		if ( false === get_option( 'dtbk_cron_enabled', false ) ) {
			update_option( 'dtbk_cron_enabled', 1 );
		}

		if ( false === get_option( 'dtbk_enable_block_defaults', false ) ) {
			add_option( 'dtbk_enable_block_defaults', '1' );
		}

		if ( $maintenance->is_enabled() ) {
			$maintenance->ensure_cron_scheduled();
		}

		if ( ! $this->maybe_upgrade() ) {
			wp_die(
				esc_html__( 'Dynamic Tables could not create or update its database tables.', 'dynamic-table-blocks' ),
				esc_html__( 'Dynamic Tables activation failed', 'dynamic-table-blocks' ),
				array( 'back_link' => true )
			);
		}
	}

	/**
	 * Return database migrations in the order they must run.
	 *
	 * @since 2.0.0
	 *
	 * @return array Database upgrades indexed by version.
	 */
	private function get_database_upgrades() {
		return array(
			'2.0.0' => array(
				'nullable_columns' => array(
					array(
						'table_suffix'        => 'dtbk_tables',
						'column_name'         => 'table_type',
						'nullable_definition' => 'varchar(32) DEFAULT NULL',
						'after_column'        => 'block_table_ref',
					),
					array(
						'table_suffix'        => 'dtbk_table_columns',
						'column_name'         => 'column_ref',
						'nullable_definition' => 'int(11) DEFAULT NULL',
						'after_column'        => 'column_id',
					),
					array(
						'table_suffix'        => 'dtbk_table_rows',
						'column_name'         => 'row_ref',
						'nullable_definition' => 'int(11) DEFAULT NULL',
						'after_column'        => 'row_id',
					),
				),
				'migration'        => 'upgrade_to_2_0_0',
			),
		);
	}

	/**
	 * Apply the canonical schema for all or selected plugin tables.
	 *
	 * Future migrations can pass only the table suffixes changed by that
	 * version. An empty list applies the complete current schema.
	 *
	 * @since 2.0.0
	 *
	 * @param string[] $table_suffixes Optional DTBK table suffixes to update.
	 * @return bool True when the requested schema was applied successfully.
	 */
	private function apply_database_schema( $table_suffixes = array() ) {
		global $wpdb;

		$queries = dtbk_get_database_schema_queries(
			$wpdb->prefix,
			$table_suffixes
		);

		if ( empty( $queries ) ) {
			return false;
		}

		foreach ( $queries as $sql ) {
			$wpdb->last_error = '';
			dbDelta( $sql );

			if ( $wpdb->last_error !== '' ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Add new columns as nullable before applying the canonical schema.
	 *
	 * @since 2.0.0
	 *
	 * This permits existing rows to be populated before a later ALTER TABLE
	 * statement makes each column NOT NULL.
	 *
	 * Tables that do not exist are skipped because dbDelta() will create them
	 * directly from the canonical schema.
	 *
	 * @param array $columns Column definitions to prepare.
	 * @return bool Whether all required columns were prepared successfully.
	 */
	private function prepare_nullable_columns( $columns ) {
		global $wpdb;

		foreach ( $columns as $column ) {
			$required_keys = array(
				'table_suffix',
				'column_name',
				'nullable_definition',
				'after_column',
			);

			foreach ( $required_keys as $required_key ) {
				if ( empty( $column[ $required_key ] ) ) {
					return false;
				}
			}

			$identifiers = array(
				$column['table_suffix'],
				$column['column_name'],
				$column['after_column'],
			);

			foreach ( $identifiers as $identifier ) {
				if ( ! preg_match( '/^[A-Za-z0-9_]+$/', $identifier ) ) {
					return false;
				}
			}

			$table_name = $wpdb->prefix . $column['table_suffix'];

			/*
			 * Direct, uncached schema queries are intentional during database
			 * upgrades. Dynamic identifiers are safe because they were
			 * restricted to letters, numbers, and underscores above.
			 */
			// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery
			// phpcs:disable WordPress.DB.DirectDatabaseQuery.NoCaching
			// phpcs:disable WordPress.DB.DirectDatabaseQuery.SchemaChange
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

			$table_exists = $wpdb->get_var(
				$wpdb->prepare(
					'SHOW TABLES LIKE %s',
					$wpdb->esc_like( $table_name )
				)
			);

			if ( $table_name !== $table_exists ) {
				continue;
			}

			$column_exists = $wpdb->get_var(
				$wpdb->prepare(
					"SHOW COLUMNS FROM `{$table_name}` LIKE %s",
					$column['column_name']
				)
			);

			if ( $column_exists ) {
				continue;
			}

			$wpdb->last_error = '';
			$wpdb->query(
				"ALTER TABLE `{$table_name}`
				ADD COLUMN `{$column['column_name']}`
				{$column['nullable_definition']}
				AFTER `{$column['after_column']}`"
			);

			if ( $wpdb->last_error ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Upgrade the database schema to version 2.0.0.
	 *
	 * @since 2.0.0
	 *
	 * @return bool True when the migration succeeded.
	 */
	private function upgrade_to_2_0_0() {
		global $wpdb;

		/*
		 * dbDelta() adds missing columns and indexes, but it does not reliably
		 * manage column order, nullability, data migrations, or table
		 * character-set conversions. Apply the remaining 2.0.0 changes
		 * explicitly to the four pre-v2 tables.
		 */
		$version_updates = array(
			"UPDATE `{$wpdb->prefix}dtbk_tables`
				SET `table_type` = 'local'
				WHERE `table_type` IS NULL",
			"UPDATE `{$wpdb->prefix}dtbk_table_columns`
				SET `column_ref` = `column_id`
				WHERE `column_ref` IS NULL",
			"UPDATE `{$wpdb->prefix}dtbk_table_rows`
				SET `row_ref` = `row_id`
				WHERE `row_ref` IS NULL",
			"ALTER TABLE `{$wpdb->prefix}dtbk_tables`
				MODIFY COLUMN `table_type` varchar(32) NOT NULL AFTER `block_table_ref`,
				CONVERT TO CHARACTER SET latin1",
			"ALTER TABLE `{$wpdb->prefix}dtbk_table_columns`
				MODIFY COLUMN `column_ref` int(11) NOT NULL AFTER `column_id`,
				CONVERT TO CHARACTER SET latin1",
			"ALTER TABLE `{$wpdb->prefix}dtbk_table_rows`
				MODIFY COLUMN `row_ref` int(11) NOT NULL AFTER `row_id`,
				CONVERT TO CHARACTER SET latin1",
			"ALTER TABLE `{$wpdb->prefix}dtbk_table_cells`
				CONVERT TO CHARACTER SET latin1",
		);

		foreach ( $version_updates as $sql ) {
			$wpdb->last_error = '';

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
			if ( false === $wpdb->query( $sql ) || '' !== $wpdb->last_error ) {
				return false;
			}
		}

		return true;
	}

	private function remove_environment_on_deactivation() {
		global $wpdb;

		// Plugin tables
		$dtbk_header_tbl  = $wpdb->prefix . 'dtbk_tables';
		$dtbk_columns_tbl = $wpdb->prefix . 'dtbk_table_columns';
		$dtbk_rows_tbl    = $wpdb->prefix . 'dtbk_table_rows';
		$dtbk_cells_tbl   = $wpdb->prefix . 'dtbk_table_cells';

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
	 * Prepare and apply all pending database migrations.
	 *
	 * @since 2.0.0
	 *
	 * @return bool True when no upgrade is required or the upgrade succeeded.
	 */
	public function maybe_upgrade() {
		$pending_upgrades = array();

		foreach ( $this->get_database_upgrades() as $version => $upgrade ) {
			if ( ! $this->dtbk_version_compare( $this->current_db_version, '<', $version ) ) {
				continue;
			}

			$pending_upgrades[ $version ] = $upgrade;
		}

		if ( empty( $pending_upgrades ) ) {
			return ! $this->dynamic_tables_has_upgrade();
		}

		/*
		 * Stage nullable columns for every pending version before applying the
		 * latest canonical schema. This protects installations that skip one
		 * or more plugin versions from receiving a new NOT NULL column before
		 * its legacy rows have been populated.
		 */
		foreach ( $pending_upgrades as $upgrade ) {
			$nullable_columns = $upgrade['nullable_columns'] ?? array();

			if (
				! is_array( $nullable_columns )
				|| (
					! empty( $nullable_columns )
					&& ! $this->prepare_nullable_columns( $nullable_columns )
				)
			) {
				return false;
			}
		}

		if ( ! $this->apply_database_schema() ) {
			return false;
		}

		foreach ( $pending_upgrades as $version => $upgrade ) {
			$migration_method = $upgrade['migration'] ?? '';

			if (
				! is_string( $migration_method )
				|| ! is_callable( array( $this, $migration_method ) )
				|| ! $this->{$migration_method}()
			) {
				return false;
			}

			/*
			 * Record each completed migration separately. If a later migration
			 * fails, the successful migrations will not run again on retry.
			 */
			$this->dtbk_update_db_version( $version );
		}

		/*
		 * This also catches a DTBK_UPGRADE_VERSION increase for which no
		 * corresponding migration was added to get_database_upgrades().
		 */
		return ! $this->dynamic_tables_has_upgrade();
	}

	/**
	 *  dynamic_tables_has_upgrade
	 *
	 *  Returns true if this site has an upgrade available.
	 *
	 *  @since 1.0.0
	 *  @since 2.0.0 Update version upgrade detection mechanism
	 *
	 *  @return  bool
	 */
	public function dynamic_tables_has_upgrade() {
		return $this->dtbk_version_compare(
			$this->current_db_version,
			'<',
			DTBK_UPGRADE_VERSION
		);
	}

	/*
	 *  Updates the DT DB version.
	 *
	 *  @since   1.0.0
	 *  @since   2.0.0 Update version upgrade detection mechanism
	 *
	 *  @param   string $version The new version.
	 *  @return  void
	 */
	public function dtbk_update_db_version( $version = '' ) {
		update_option( 'dtbk_version', $version );
		delete_option( 'dtbk-version' );

		$this->current_db_version = $version;
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
