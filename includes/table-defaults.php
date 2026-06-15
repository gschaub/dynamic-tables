<?php
/**
 * Default values for creating dynamic tables.
 *
 * @since 1.4.0
 */
namespace DynamicTableBlocks;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Retrieve default table header attributes
 *
 * @since 1.4.0
 *
 * @return array Default table header attributes
 */
function get_default_table_attributes() {
	return array(
		'showGridLines'            => true,
		'bandedRows'               => false,
		'bandedRowBackgroundColor' => '#d8dbda',
		'bandedTextColor'          => 'black',
		'gridLineWidth'            => 1,
		'allowHorizontalScroll'    => true,
		'enableHeaderRow'          => false,
		'headerAlignment'          => 'center',
		'headerRowSticky'          => false,
		'headerBorder'             => array(
			'color' => 'black',
			'style' => 'solid',
			'width' => '1px',
		),
		'horizontalAlignment'      => 'none',
		'bodyAlignment'            => null,
		'bodyBorder'               => array(
			'color' => 'black',
			'style' => 'solid',
			'width' => '1px',
		),
		'verticalAlignment'        => 'none',
		'hideTitle'                => true,
	);
}

/**
 * Retrieve default table row attributes
 *
 * @since 1.4.0
 *
 * @return array Default table row attributes
 */
function get_default_row_attributes() {
	return array(
		'rowHeightType'     => 'Auto',
		'minHeight'         => 0,
		'minHeightUnits'    => 'em',
		'maxHeight'         => 0,
		'maxHeightUnits'    => 'em',
		'fixedHeight'       => 0,
		'fixedHeightUnits'  => 'em',
		'isHeader'          => false,
		'verticalAlignment' => 'none',
	);
}

/**
 * Retrieve default table column attributes
 *
 * @since 1.4.0
 *
 * @return array Default table column attributes
 */
function get_default_column_attributes() {
	return array(
		'columnDataType'         => array( 'type' => 'general' ),
		'columnWidthType'        => 'Proportional',
		'minWidth'               => 2,
		'minWidthUnits'          => 'ch',
		'maxWidth'               => 1,
		'maxWidthUnits'          => 'fr',
		'fixedWidth'             => 1,
		'fixedWidthUnits'        => 'fr',
		'disableForTablet'       => false,
		'disableForPhone'        => false,
		'isFixedLeftColumnGroup' => false,
		'horizontalAlignment'    => 'none',
	);
}

/**
 * Retrieve default table cell attributes
 *
 * @since 1.4.0
 *
 * @return array Default table cell attributes
 */
function get_default_cell_attributes() {
	return array(
		'border' => false,
		'value'  => array(
			'indexText' => '',
		),
	);
}
