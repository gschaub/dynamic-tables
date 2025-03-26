<?php
/**
 * Summary.
 *
 * Description.
 *
 * @since Version 3 digits
 */

namespace DynamicTables;

function number_to_letter($letter_number) {

	$letter_map = [];

	$letter_map += [ "1" => "A" ];
	$letter_map += [ "2" => "B" ];
	$letter_map += [ "3" => "C" ];
	$letter_map += [ "4" => "D" ];
	$letter_map += [ "5" => "E" ];
	$letter_map += [ "6" => "F" ];
	$letter_map += [ "7" => "G" ];
	$letter_map += [ "8" => "H" ];
	$letter_map += [ "9" => "I" ];
	$letter_map += [ "a" => "J" ];
	$letter_map += [ "b" => "K" ];
	$letter_map += [ "c" => "L" ];
	$letter_map += [ "d" => "M" ];
	$letter_map += [ "e" => "N" ];
	$letter_map += [ "f" => "O" ];
	$letter_map += [ "g" => "P" ];
	$letter_map += [ "h" => "Q" ];
	$letter_map += [ "i" => "R" ];
	$letter_map += [ "j" => "S" ];
	$letter_map += [ "k" => "T" ];
	$letter_map += [ "l" => "U" ];
	$letter_map += [ "m" => "V" ];
	$letter_map += [ "n" => "W" ];
	$letter_map += [ "o" => "X" ];
	$letter_map += [ "p" => "Y" ];
	$letter_map += [ "q" => "Z" ];

	$letter_lookup = str_split(base_convert($letter_number, 10, 26));
	$letter_digit = '';

	foreach ( $letter_lookup as $letter ) {
		$letter_digit .= $letter_map[ $letter ];
	}

	return $letter_digit;
}

/**
 * Ensure all current table attributes are available for rendering even if the
 * table doesn't contain all values.  We fill in the gaps with attribute defaults
 * as needed.
 */
function get_table_header_attributes ($table_header) {

	$table_default_attributes = array(
		'showGridLines'            => false,
		'bandedRows'               => false,
		'bandedRowBackgroundColor' => '#d8dbda',
		'bandedTextColor'          => '#d8dbda',
		'gridLineWidth'            => 1,
		'allowHorizontalScroll'    => true,
		'enableHeaderRow'          => false,
		'headerAlignment'          => 'center',
		'headerRowSticky'          => false,
		'headerBorder'             => [
			'color' => 'black',
			'style' => 'solid',
			'width' => '1px',
		],
		'horizontalAlignment'      => 'none',
		'bodyAlignment'            => null,
		'bodyBorder'               => [
			'color' => 'black',
			'style' => 'solid',
			'width' => '1px',
		],
		'verticalAlignment'        => 'none',
		'hideTitle'                => false,
	);

	$table_header_attributes = array_merge($table_default_attributes, $table_header['attributes']);
	return $table_header_attributes;
}

function process_rows($rows, $filter) {

	$row_default_attributes = array(
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

	$return_result = array();
	$return_rows = array();
	$return_grid_row_style = '';

	foreach ( $rows as $index => $row ) {
		$row_attributes = array_merge($row_default_attributes, $row['attributes']);

		$formatted_row = array();
		switch ( $filter ) {
			case 'is_header':
				if ( $row['attributes']['isHeader'] === true ) {
					$grid_row_style = format_row($row_attributes);
					$grid_row = array(
						'row_id'       => $row['row_id'],
						'gridRowStyle' => $grid_row_style,
					);
					array_push( $return_rows, $grid_row );
					$return_grid_row_style .= $grid_row_style;
				}
				break;
			case 'is_body':
				if ( $row['attributes']['isHeader'] !== true ) {
					$grid_row_style = format_row($row_attributes);
					$grid_row = array(
						'row_id'       => $row['row_id'],
						'gridRowStyle' => $grid_row_style,
					);
					array_push( $return_rows, $grid_row );
					$return_grid_row_style .= $grid_row_style;
				}
				break;
		}
	}

	$return_result = array(
		'rows'           => $return_rows,
		'grid_row_style' => $return_grid_row_style,
	);

	return $return_result;
}

function format_row($row_attributes) {

	list('rowHeightType'    => $row_height_type,
		'minHeight'         => $min_height,
		'minHeightUnits'    => $min_height_units,
		'maxHeight'         => $max_height,
		'maxHeightUnits'    => $max_height_units,
		'fixedHeight'       => $fixed_height,
		'fixedHeightUnits'  => $fixed_height_units,
		'verticalAlignment' => $vertical_alignment,
	) = $row_attributes;

	$sizing = '';
	$grid_row_style = '';

	switch ( $row_height_type ) {
		case 'Auto':
			$grid_row_style .= 'auto ';
			break;
		case 'Fixed':
			$grid_row_style .= strval($fixed_height) . $fixed_height_units . ' ';
			break;
		case 'Custom':
			$sizing = 'minmax(' . strval($min_height) . $min_height_units . ', ' . strval($max_height) . $max_height_units . ') ';
			$grid_row_style .= $sizing;
			break;
		default:
			error_log('Unrecognized Attibute Type');
	}

	// $grid_row = array(
	//  'row_id'       => $row['row_id'],
	//  'gridRowStyle' => $grid_row_style,
	// );

	return $grid_row_style;
}

function process_columns($columns) {
	$new_grid_column_style = '';

	foreach ( $columns as $index => $column ) {

		list('columnWidthType' => $column_width_type,
			'minWidth' => $min_width,
			'minWidthUnits' => $min_width_units,
			'maxWidth' => $max_width,
			'maxWidthUnits' => $max_width_units,
			'fixedWidth' => $fixed_width,
			'fixedWidthUnits' => $fixed_width_units,
			'disableForTablet' => $disable_for_tablet,
			'disableForPhone' => $disable_for_phone,
			'isFixedLeftColumnGroup' => $is_fixed_left_column_group,
			'horizontalAlignment' => $horizontal_alignment
		) = $column['attributes'];

		$sizing = '';

		switch ( $column_width_type ) {
			case 'Proportional':
				if ( $min_width > 0 ) {
					$sizing = 'minmax(' . strval($min_width) . $min_width_units . ', ' . strval($max_width) . 'fr) ';
				} else {
					$sizing = $max_width . 'fr ';
				}
				$new_grid_column_style .= $sizing;
				break;
			case 'Auto':
				$new_grid_column_style .= 'auto ';
				break;
			case 'Fixed':
				$new_grid_column_style .= strval($fixed_width) . $fixed_width_units . ' ';
				break;
			case 'Custom':
				$sizing = 'minmax(' . strval($min_width) . $min_width_units . ', ' . strval($max_width) . $max_width_units . ') ';
				$new_grid_column_style .= $sizing;
				break;
		}
}

	return $new_grid_column_style;
}

function process_cells($table_cells, $row_id) {
	$filtered_cells = array_filter($table_cells, function($v) use($row_id) {
		return $v['row_id'] === $row_id;
	}, ARRAY_FILTER_USE_BOTH);

	// print_r($filtered_cells);

	$return_cells = array();

	foreach ( $filtered_cells as $index => $cell ) {
		// $row_attributes = array_merge($row_default_attributes, $row['attributes']);

		// list('rowHeightType'    => $row_height_type,
		//  'minHeight'         => $min_height,
		//  'minHeightUnits'    => $min_height_units,
		//  'maxHeight'         => $max_height,
		//  'maxHeightUnits'    => $max_height_units,
		//  'fixedHeight'       => $fixed_height,
		//  'fixedHeightUnits'  => $fixed_height_units,
		//  'verticalAlignment' => $vertical_alignment,
		// ) = $row_attributes;

		// $sizing = '';
		// $grid_row_style = '';

		// switch ( $row_height_type ) {
		//  case 'Auto':
		//      $grid_row_style .= 'auto ';
		//      break;
		//  case 'Fixed':
		//      $grid_row_style .= strval($fixed_height) . $fixed_height_units . ' ';
		//      break;
		//  case 'Custom':
		//      $sizing = 'minmax(' . strval($min_height) . $min_height_units . ', ' . strval($max_height) . $max_height_units . ') ';
		//      $grid_row_style .= $sizing;
		//      break;
		//  default:
		//      error_log('Unrecognized Attibute Type');
		// }
		$cell_id = number_to_letter($cell['column_id']) . $cell['row_id'];

		$grid_cell = array(
			'cell_id' => $cell_id,
			'classes' => $cell['classes'],
			'content' => $cell['content'],
		);
		array_push( $return_cells, $grid_cell );
	}
	return $return_cells;
}

function get_calculated_classes($row_id, $banded_rows, $enable_header_row) {

// $cell_row_id, $cell_column_id, $block_wrapper, $banded_rows, $enable_header_row, $header_classes

	$banded_row_offset = $enable_header_row ? 1 : 0;
	$calculated_classes = '';

	if ( $banded_rows && $banded_row_offset === 0 && $row_id % 2 === 0 ) {
		$calculated_classes .= 'grid-control__body-rows--banded-row ';
	}

	if ( $banded_rows && $banded_row_offset === 1 && $row_id > 1 && ( $row_id + $banded_row_offset ) % 2 === 0 ) {
		$calculated_classes .= 'grid-control__body-rows--banded-row ';
	}

	// if ( $enable_header_row && $cell_row_id == 1 ) {
	//  $calculated_classes .= 'grid-control__header-cells  ' . $header_classes;
	// } else {
	//  $calculated_classes .= 'grid-control__body-cells ';
	// }

	return $calculated_classes;
}

function start_grid_row_nbr($enable_header) {
	$start_grid_line = 1;
	$start_grid_line = $enable_header ? $start_grid_line + 1 : $start_grid_line;

	return $start_grid_line;
}
// endGridRowNbr(1, 'Header', numRows, enableHeaderRow, false)

function end_grid_row_nbr($start_grid_line, $row_group, $num_rows, $enable_header, $enable_footer) {
	$end_grid_line;

	switch ( $row_group ) {
		case 'Header':
			$end_grid_line = 2;
			break;
		case 'Body':
			$end_grid_line = $start_grid_line + $num_rows;
			$end_grid_line = $enable_header ? $end_grid_line - 1 : $end_grid_line;
			$end_grid_line = $enable_header ? $end_grid_line - 1 : $end_grid_line;
			break;
		default:
			error_log('Unknown row type');
	}

	return endGridLine;
}

/**
 * The border style values are stored as a flat object (simple) or as nested objects
 * (complex).  We evaluate the object value to determine which type it is.
 *
 * @param {*} border
 * @returns
 */
function get_border_style_type($border) {
	if ( $border ) {
		foreach ( $border as $index => $border_segment ) {
			if ( is_array($border_segment) ) {
				return 'split';
			}
		}
	return 'flat';
	}
	return 'unknown';
}

/**
 * Get Style value for the specified border segment and attribute
 *
 * @param {*} border
 * @param {*} borderLocation
 * @param {*} borderAttribute
 * @param {*} borderType
 * @returns
 */
function get_border_style($border, $border_location, $border_attribute, $border_type) {

	// print_r('</br>');
	// print_r('</br>');
	// print_r('BORDER STYLE INFO');
	// print_r('</br>');
	// print_r('$body_border_style_type');
	// print_r('</br>');
	// print_r($border);
	// print_r('</br>');
	// print_r($border_location);
	// print_r('</br>');
	// print_r($border_attribute);
	// print_r('</br>');

	// lookup and return the style attibute if it is set
	switch ( $border_type ) {
		case 'split':
			if ( isset($border[ $border_location ][ $border_attribute ]) ) {
				return $border[ $border_location ][ $border_attribute ];
			}
			break;
		case 'flat':
			if ( isset($border[ $border_attribute ]) ) {
				return $border[ $border_attribute ];
			}
			break;
		default:
			switch ( $border_attribute ) {
				case 'color':
					return 'black';
				case 'style':
					return 'solid';
				case 'width':
					return '1px';
			}
	}

	// Return default style attibute none has been set
	switch ( $border_attribute ) {
		case 'color':
			return 'black';
		case 'style':
			return 'solid';
		case 'width':
			return '1px';
	}
}
