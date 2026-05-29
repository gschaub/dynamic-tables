CREATE TABLE wp_dtbk_tables (
    id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
	block_table_ref	varchar(15),
	status varchar(10),
    post_id bigint(20) unsigned NOT NULL,
	table_name varchar(60),
	attributes text NULL,
    classes text,
    PRIMARY KEY (id))

CREATE TABLE wp_dtbk_table_columns (
    table_id bigint(20) unsigned NOT NULL,
    column_id varchar(4) NOT NULL DEFAULT ' ',
    column_name varchar(60) NOT NULL DEFAULT ' ',
	attributes text NULL,
    classes text,
    PRIMARY KEY (table_id, column_id))

CREATE TABLE wp_dtbk_table_rows (
	table_id bigint(20) unsigned,
	row_id int(11),
	attributes text NULL,
	classes text NULL,
    PRIMARY KEY (table_id, row_id))

CREATE TABLE wp_dtbk_table_cells (
    table_id bigint(20) unsigned NOT NULL,
    column_id varchar(4) NOT NULL DEFAULT ' ',
    row_id int NOT NULL,
	attributes text NULL,
    classes text,
    content longtext,
    PRIMARY KEY (table_id, column_id, row_id))
