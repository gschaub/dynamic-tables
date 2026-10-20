<?php
/**
 * Dynamic Tables database schema.
 *
 * @since 2.0.0
 */

namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Return the database schema as individual dbDelta() queries.
 *
 * The definitions mirror Development Docs/dt-schema-v2-update.sql while
 * replacing the site-specific wp_3_ prefix with the active site's prefix.
 *
 * @since 2.0.0
 *
 * @param string $table_prefix WordPress table prefix for the current site.
 * @param string[] $table_suffixes Optional DTBK table suffixes to return.
 * @return string[]
 */
function dtbk_get_database_schema_queries( $table_prefix, $table_suffixes = array() ) {
	$schema = <<<'SQL'
CREATE TABLE {{prefix}}dtbk_tables (
	id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
	block_table_ref varchar(15) NOT NULL,
	table_type varchar(32) NOT NULL,
	status varchar(10) NOT NULL,
	post_id bigint(20) unsigned NOT NULL,
	table_name varchar(60) NOT NULL,
	attributes text DEFAULT NULL,
	classes text DEFAULT NULL,
	PRIMARY KEY  (id),
	KEY post (post_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_table_columns (
	table_id bigint(20) unsigned NOT NULL,
	column_id int(11) NOT NULL,
	column_ref int(11) NOT NULL,
	column_name varchar(60) NOT NULL DEFAULT ' ',
	attributes text DEFAULT NULL,
	classes text DEFAULT NULL,
	PRIMARY KEY  (table_id,column_id),
	UNIQUE KEY table_id_column_ref (table_id,column_ref)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_table_rows (
	table_id bigint(20) unsigned NOT NULL,
	row_id int(11) NOT NULL,
	row_ref int(11) NOT NULL,
	attributes text DEFAULT NULL,
	classes text DEFAULT NULL,
	PRIMARY KEY  (table_id,row_id),
	UNIQUE KEY table_id_row_ref (table_id,row_ref)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_table_cells (
	table_id bigint(20) unsigned NOT NULL,
	column_id int(11) NOT NULL,
	row_id int(11) NOT NULL,
	attributes text DEFAULT NULL,
	classes text DEFAULT NULL,
	content longtext DEFAULT NULL,
	PRIMARY KEY  (table_id,column_id,row_id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_account (
	id bigint(20) unsigned NOT NULL,
	account_ref varchar(45) NOT NULL,
	external_account_id varchar(128) DEFAULT NULL,
	account_name varchar(191) DEFAULT NULL,
	account_email varchar(191) DEFAULT NULL,
	status varchar(31) NOT NULL,
	created_at datetime NOT NULL,
	modified_at datetime DEFAULT NULL,
	PRIMARY KEY  (id),
	UNIQUE KEY account_ref (account_ref),
	UNIQUE KEY external_account_id (external_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_connectors (
	connector_ref varchar(32) NOT NULL,
	type varchar(32) NOT NULL,
	provider varchar(64) NOT NULL,
	connector_name varchar(128) DEFAULT NULL,
	configuration longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuration`)),
	enabled tinyint(1) NOT NULL DEFAULT 1,
	PRIMARY KEY  (connector_ref),
	KEY type (type),
	KEY provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_connector_credentials (
	connector_ref varchar(32) NOT NULL,
	credential_ref varchar(32) NOT NULL,
	credential_role varchar(64) DEFAULT NULL,
	PRIMARY KEY  (connector_ref,credential_ref),
	KEY credential_ref (credential_ref)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_connector_model (
	connector_ref varchar(32) NOT NULL,
	model varchar(64) NOT NULL,
	model_version smallint(6) NOT NULL,
	model_name varchar(128) DEFAULT NULL,
	connector_model_ref varchar(32) NOT NULL,
	configuration longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuration`)),
	PRIMARY KEY  (connector_ref,model,model_version),
	UNIQUE KEY connector_model_ref (connector_model_ref)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_credentials (
	credential_ref varchar(32) NOT NULL,
	wp_user_id bigint(20) DEFAULT NULL,
	credential_type varchar(64) NOT NULL,
	credential_name varchar(128) DEFAULT NULL,
	credential_value longtext NOT NULL,
	expires_at datetime DEFAULT NULL,
	metadata longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
	PRIMARY KEY  (credential_ref),
	KEY wp_user_id (wp_user_id),
	KEY credential_type (credential_type)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_indexed_search (
	table_id bigint(20) unsigned NOT NULL,
	post_id bigint(20) unsigned NOT NULL,
	search_text longtext DEFAULT NULL,
	imdex_version smallint(6) NOT NULL DEFAULT 1,
	document_hash binary(32) DEFAULT NULL,
	status tinyint(1) NOT NULL DEFAULT 0,
	dirty_at datetime DEFAULT NULL,
	modified_at datetime DEFAULT NULL,
	error_code varchar(64) DEFAULT NULL,
	meta longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
	PRIMARY KEY  (table_id,post_id),
	KEY post_id (post_id),
	KEY status_dirty_at (status,dirty_at),
	FULLTEXT KEY search_text (search_text)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_log (
	id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
	table_id bigint(20) unsigned DEFAULT NULL,
	log_source varchar(45) NOT NULL,
	user_id bigint(20) DEFAULT NULL,
	log_level varchar(16) NOT NULL DEFAULT 'info',
	log_code varchar(64) DEFAULT NULL,
	logged_datetime datetime NOT NULL,
	log_message text DEFAULT NULL,
	context longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`context`)),
	PRIMARY KEY  (id),
	KEY log_source_logged_datetime (log_source,logged_datetime),
	KEY table_id_logged_datetime (table_id,logged_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_products (
	id bigint(20) unsigned NOT NULL,
	product_ref varchar(32) NOT NULL,
	product_key varchar(128) NOT NULL,
	product_name varchar(191) NOT NULL,
	product_type varchar(64) DEFAULT NULL,
	enabled tinyint(4) NOT NULL DEFAULT 1,
	PRIMARY KEY  (id),
	UNIQUE KEY product_ref (product_ref)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_subscribed_products (
	subscription_id bigint(20) unsigned NOT NULL,
	product_id bigint(20) unsigned NOT NULL,
	status varchar(32) NOT NULL,
	starts_at datetime DEFAULT NULL,
	ends_at datetime DEFAULT NULL,
	PRIMARY KEY  (subscription_id,product_id),
	KEY product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_subscription (
	id bigint(20) unsigned NOT NULL,
	subscription_ref varchar(32) NOT NULL,
	account_id bigint(20) unsigned NOT NULL,
	external_subscription_id varchar(128) DEFAULT NULL,
	subscription_key_ref varchar(32) DEFAULT NULL,
	status varchar(32) NOT NULL,
	starts_at datetime DEFAULT NULL,
	expired_at datetime DEFAULT NULL,
	cancelled_at datetime DEFAULT NULL,
	created_at datetime NOT NULL,
	modified_at datetime DEFAULT NULL,
	PRIMARY KEY  (id),
	UNIQUE KEY subscription_ref (subscription_ref),
	UNIQUE KEY external_subscription_id (external_subscription_id),
	KEY account_id (account_id),
	KEY subscription_key_ref (subscription_key_ref)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_table_connector (
	table_id int(20) NOT NULL,
	connector_model_ref varchar(32) NOT NULL,
	direction varchar(16) NOT NULL,
	configuration longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuration`)),
	enabled tinyint(1) NOT NULL DEFAULT 1,
	PRIMARY KEY  (table_id,connector_model_ref),
	KEY connector_model_ref (connector_model_ref)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_table_translatable (
	translatable_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
	table_id bigint(20) unsigned NOT NULL,
	entity_type varchar(20) NOT NULL,
	column_ref varchar(32) DEFAULT NULL,
	row_ref varchar(32) DEFAULT NULL,
	property_key varchar(64) NOT NULL,
	created_at datetime NOT NULL,
	PRIMARY KEY  (translatable_id),
	KEY table_id (table_id),
	KEY table_id_column_ref (table_id,column_ref),
	KEY table_id_row_ref (table_id,row_ref)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE {{prefix}}dtbk_translations (
	translatable_id bigint(20) NOT NULL,
	locale varchar(32) NOT NULL,
	translation longtext DEFAULT NULL,
	source_hash varchar(64) DEFAULT NULL,
	updated_at datetime DEFAULT NULL,
	created_at datetime NOT NULL,
	PRIMARY KEY  (translatable_id,locale)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SQL;

	$schema = str_replace( '{{prefix}}', $table_prefix, $schema );
	$queries = preg_split(
		'/;\s*(?:\r?\n|$)/',
		trim( $schema ),
		-1,
		PREG_SPLIT_NO_EMPTY
	);

	if ( ! is_array( $queries ) ) {
		return array();
	}

	if ( empty( $table_suffixes ) ) {
		return $queries;
	}

	$table_suffixes = array_values( array_unique( $table_suffixes ) );
	$requested_tables = array();
	$filtered_queries = array();

	foreach ( $table_suffixes as $table_suffix ) {
		$requested_tables[] = $table_prefix . $table_suffix;
	}

	foreach ( $queries as $query ) {
		foreach ( $requested_tables as $table_name ) {
			if ( str_starts_with( $query, "CREATE TABLE {$table_name} (" ) ) {
				$filtered_queries[] = $query;
				break;
			}
		}
	}

	if ( count( $filtered_queries ) !== count( $requested_tables ) ) {
		return array();
	}

	return $filtered_queries;
}
