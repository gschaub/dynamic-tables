CREATE TABLE wp_dt_tables (
    id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    post_id bigint(20) unsigned NOT NULL,
    classes text,
    PRIMARY KEY (id))

CREATE TABLE wp_dt_table_columns (
    table_id bigint(20) unsigned NOT NULL,
    column_id varchar(4) NOT NULL DEFAULT ' ',
    column_name varchar(60) NOT NULL DEFAULT ' ',
    classes text,
    PRIMARY KEY (table_id, column_id))

CREATE TABLE wp_dt_table_cells (
    table_id bigint(20) unsigned NOT NULL,
    column_id varchar(4) NOT NULL DEFAULT ' ',
    row_id int NOT NULL,
    classes text,
    datatype varchar(10) NOT NULL DEFAULT ' ',
    content longtext,
    PRIMARY KEY (table_id, column_id, row_id))
