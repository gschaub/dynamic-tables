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

function get_calculated_classes($cell_row_id, $cell_column_id, $block_wrapper, $banded_rows, $enable_header_row, $header_classes) {
	$calculated_classes = '';

	if ( $banded_rows && ! $enable_header_row && $cell_row_id % 2 === 0 ) {
		$calculated_classes .= 'grid-control__cells--banded-row ';
	}

	if ( $banded_rows && $enable_header_row && $cell_row_id > 1 && ( $cell_row_id + 1 ) % 2 === 0 ) {
		$calculated_classes .= 'grid-control__cells--banded-row ';
	}

	if ( $enable_header_row && $cell_row_id == 1 ) {
		$calculated_classes .= 'grid-control__header-cells  ' . $header_classes;
	} else {
		$calculated_classes .= 'grid-control__body-cells ';
	}

	return $calculated_classes;
}
