-- Synchronize the wp_3_dtbk_* schema with the wp_dtbk_* schema.
-- Generated from the live `local` database schema on 2026-10-18.
--
-- This script preserves data in the four existing wp_3_dtbk_* tables,
-- adds their missing columns, aligns their character set with the wp_ source
-- tables, and creates the 13 missing counterpart tables and their indexes.
--
-- MariaDB/MySQL DDL causes implicit commits. Back up the database before use.

SET NAMES utf8mb4;

-- Existing counterpart tables: add columns introduced in the wp_ schema.
ALTER TABLE `wp_3_dtbk_tables`
  ADD COLUMN IF NOT EXISTS `table_type` varchar(32) DEFAULT NULL AFTER `block_table_ref`;

ALTER TABLE `wp_3_dtbk_table_columns`
  ADD COLUMN IF NOT EXISTS `column_ref` int(11) DEFAULT NULL AFTER `column_id`;

ALTER TABLE `wp_3_dtbk_table_rows`
  ADD COLUMN IF NOT EXISTS `row_ref` int(11) DEFAULT NULL AFTER `row_id`;

-- Populate legacy records before enforcing NOT NULL.
UPDATE `wp_3_dtbk_tables`
SET `table_type` = 'local'
WHERE `table_type` IS NULL;

UPDATE `wp_3_dtbk_table_columns`
SET `column_ref` = `column_id`
WHERE `column_ref` IS NULL;

UPDATE `wp_3_dtbk_table_rows`
SET `row_ref` = `row_id`
WHERE `row_ref` IS NULL;

ALTER TABLE `wp_3_dtbk_tables`
  MODIFY COLUMN `table_type` varchar(32) NOT NULL AFTER `block_table_ref`;

ALTER TABLE `wp_3_dtbk_table_columns`
  MODIFY COLUMN `column_ref` int(11) NOT NULL AFTER `column_id`,
  ADD UNIQUE KEY `table_id_column_ref` (`table_id`, `column_ref`);

ALTER TABLE `wp_3_dtbk_table_rows`
  MODIFY COLUMN `row_ref` int(11) NOT NULL AFTER `row_id`,
  ADD UNIQUE KEY `table_id_row_ref` (`table_id`, `row_ref`);

-- Align the four existing tables with the source tables' default character set.
ALTER TABLE `wp_3_dtbk_tables` CONVERT TO CHARACTER SET latin1;
ALTER TABLE `wp_3_dtbk_table_columns` CONVERT TO CHARACTER SET latin1;
ALTER TABLE `wp_3_dtbk_table_rows` CONVERT TO CHARACTER SET latin1;
ALTER TABLE `wp_3_dtbk_table_cells` CONVERT TO CHARACTER SET latin1;

-- Missing counterpart tables.
CREATE TABLE IF NOT EXISTS `wp_3_dtbk_account` (
  `id` bigint(20) unsigned NOT NULL,
  `account_ref` varchar(45) NOT NULL,
  `external_account_id` varchar(128) DEFAULT NULL,
  `account_name` varchar(191) DEFAULT NULL,
  `account_email` varchar(191) DEFAULT NULL,
  `status` varchar(31) NOT NULL,
  `created_at` datetime NOT NULL,
  `modified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_ref` (`account_ref`),
  UNIQUE KEY `external_account_id` (`external_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_connectors` (
  `connector_ref` varchar(32) NOT NULL,
  `type` varchar(32) NOT NULL,
  `provider` varchar(64) NOT NULL,
  `connector_name` varchar(128) DEFAULT NULL,
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
    CHECK (json_valid(`configuration`)),
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`connector_ref`),
  KEY `type` (`type`),
  KEY `provider` (`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_connector_credentials` (
  `connector_ref` varchar(32) NOT NULL,
  `credential_ref` varchar(32) NOT NULL,
  `credential_role` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`connector_ref`, `credential_ref`),
  KEY `credential_ref` (`credential_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_connector_model` (
  `connector_ref` varchar(32) NOT NULL,
  `model` varchar(64) NOT NULL,
  `model_version` smallint(6) NOT NULL,
  `model_name` varchar(128) DEFAULT NULL,
  `connector_model_ref` varchar(32) NOT NULL,
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
    CHECK (json_valid(`configuration`)),
  PRIMARY KEY (`connector_ref`, `model`, `model_version`),
  UNIQUE KEY `connector_model_ref` (`connector_model_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_credentials` (
  `credential_ref` varchar(32) NOT NULL,
  `wp_user_id` bigint(20) DEFAULT NULL,
  `credential_type` varchar(64) NOT NULL,
  `credential_name` varchar(128) DEFAULT NULL,
  `credential_value` longtext NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
    CHECK (json_valid(`metadata`)),
  PRIMARY KEY (`credential_ref`),
  KEY `wp_user_id` (`wp_user_id`),
  KEY `credential_type` (`credential_type`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_indexed_search` (
  `table_id` bigint(20) unsigned NOT NULL,
  `post_id` bigint(20) unsigned NOT NULL,
  `search_text` longtext DEFAULT NULL,
  `imdex_version` smallint(6) NOT NULL DEFAULT 1,
  `document_hash` binary(32) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `dirty_at` datetime DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL,
  `error_code` varchar(64) DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`table_id`, `post_id`),
  KEY `post_id` (`post_id`),
  KEY `status_dirty_at` (`status`, `dirty_at`),
  FULLTEXT KEY `search_text` (`search_text`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `table_id` bigint(20) unsigned DEFAULT NULL,
  `log_source` varchar(45) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `log_level` varchar(16) NOT NULL DEFAULT 'info',
  `log_code` varchar(64) DEFAULT NULL,
  `logged_datetime` datetime NOT NULL,
  `log_message` text DEFAULT NULL,
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
    CHECK (json_valid(`context`)),
  PRIMARY KEY (`id`),
  KEY `log_source_logged_datetime` (`log_source`, `logged_datetime`),
  KEY `table_id_logged_datetime` (`table_id`, `logged_datetime`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_products` (
  `id` bigint(20) unsigned NOT NULL,
  `product_ref` varchar(32) NOT NULL,
  `product_key` varchar(128) NOT NULL,
  `product_name` varchar(191) NOT NULL,
  `product_type` varchar(64) DEFAULT NULL,
  `enabled` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_ref` (`product_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_subscribed_products` (
  `subscription_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `status` varchar(32) NOT NULL,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  PRIMARY KEY (`subscription_id`, `product_id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_subscription` (
  `id` bigint(20) unsigned NOT NULL,
  `subscription_ref` varchar(32) NOT NULL,
  `account_id` bigint(20) unsigned NOT NULL,
  `external_subscription_id` varchar(128) DEFAULT NULL,
  `subscription_key_ref` varchar(32) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `starts_at` datetime DEFAULT NULL,
  `expired_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `modified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscription_ref` (`subscription_ref`),
  UNIQUE KEY `external_subscription_id` (`external_subscription_id`),
  KEY `account_id` (`account_id`),
  KEY `subscription_key_ref` (`subscription_key_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_table_connector` (
  `table_id` int(20) NOT NULL,
  `connector_model_ref` varchar(32) NOT NULL,
  `direction` varchar(16) NOT NULL,
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
    CHECK (json_valid(`configuration`)),
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`table_id`, `connector_model_ref`),
  KEY `connector_model_ref` (`connector_model_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_table_translatable` (
  `translatable_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `table_id` bigint(20) unsigned NOT NULL,
  `entity_type` varchar(20) NOT NULL,
  `column_ref` varchar(32) DEFAULT NULL,
  `row_ref` varchar(32) DEFAULT NULL,
  `property_key` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`translatable_id`),
  KEY `table_id` (`table_id`),
  KEY `table_id_column_ref` (`table_id`, `column_ref`),
  KEY `table_id_row_ref` (`table_id`, `row_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `wp_3_dtbk_translations` (
  `translatable_id` bigint(20) NOT NULL,
  `locale` varchar(32) NOT NULL,
  `translation` longtext DEFAULT NULL,
  `source_hash` varchar(64) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`translatable_id`, `locale`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Verification: this should return no rows after the script completes.
SELECT
  source_tables.TABLE_NAME AS `missing_source_table_counterpart`
FROM information_schema.TABLES AS source_tables
LEFT JOIN information_schema.TABLES AS target_tables
  ON target_tables.TABLE_SCHEMA = source_tables.TABLE_SCHEMA
  AND target_tables.TABLE_NAME = CONCAT(
    'wp_3_',
    SUBSTRING(source_tables.TABLE_NAME, CHAR_LENGTH('wp_') + 1)
  )
WHERE source_tables.TABLE_SCHEMA = DATABASE()
  AND source_tables.TABLE_NAME LIKE 'wp\_dtbk%' ESCAPE '\\'
  AND target_tables.TABLE_NAME IS NULL
ORDER BY source_tables.TABLE_NAME;
