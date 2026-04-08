<?php
/**
 * Functions that support front end table rendering.
 *
 * This file includes many utility functions that are required to render a
 * table block on the front end.  It keeps the primary render.php file primarily
 * reserved for html output.
 *
 * @since 1.0.0
 */
namespace DynamicTableBlocks;

use NumberFormatter;

/**
 * Converts a column id (number) to the column id letter
 *
 * Converts the column number to a letter by converting the number to base
 * 26, separating each number, translating the number to a letter, and then
 * concatinating the letters.  This allows a column to be represented by letters
 * in the same way a spreadsheet does.
 *
 * @since 1.0.0
 * @param  int $letter_number Integer to be converted to a string of one or more letters
 * @return void string Letter representation of number provided
 */
function number_to_letter( $letter_number ) {

	$letter_map = array();

	$letter_map += array( '1' => 'A' );
	$letter_map += array( '2' => 'B' );
	$letter_map += array( '3' => 'C' );
	$letter_map += array( '4' => 'D' );
	$letter_map += array( '5' => 'E' );
	$letter_map += array( '6' => 'F' );
	$letter_map += array( '7' => 'G' );
	$letter_map += array( '8' => 'H' );
	$letter_map += array( '9' => 'I' );
	$letter_map += array( 'a' => 'J' );
	$letter_map += array( 'b' => 'K' );
	$letter_map += array( 'c' => 'L' );
	$letter_map += array( 'd' => 'M' );
	$letter_map += array( 'e' => 'N' );
	$letter_map += array( 'f' => 'O' );
	$letter_map += array( 'g' => 'P' );
	$letter_map += array( 'h' => 'Q' );
	$letter_map += array( 'i' => 'R' );
	$letter_map += array( 'j' => 'S' );
	$letter_map += array( 'k' => 'T' );
	$letter_map += array( 'l' => 'U' );
	$letter_map += array( 'm' => 'V' );
	$letter_map += array( 'n' => 'W' );
	$letter_map += array( 'o' => 'X' );
	$letter_map += array( 'p' => 'Y' );
	$letter_map += array( 'q' => 'Z' );

	$letter_lookup = str_split( base_convert( $letter_number, 10, 26 ) );
	$letter_digit  = '';

	foreach ( $letter_lookup as $letter ) {
		$letter_digit .= $letter_map[ $letter ];
	}

	return $letter_digit;
}


/**
 * Does render request originate from an editor preview context?
 *
 * Description - Detects whether this render is being executed for an editor preview
 * context (post editor, site editor, inserter preview, etc.).
 *
 * @since 1.1.0
 *
 * @return bool True if editor preview request, false otherwise.
 */
function dtbk_is_editor_preview_request() {
	// Classic wp-admin block editor.
	if ( is_admin() ) {
		// Post editor, widgets editor, etc.
		if ( function_exists( 'get_current_screen' ) ) {
			$screen = get_current_screen();
			if ( $screen && ! empty( $screen->is_block_editor ) ) {
				return true;
			}
		}
	}

	// REST-based previews (used by post editor, site editor, inserter, etc.).
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		$context = $_REQUEST['context'] ?? null; // phpcs:ignore WordPress.Security.NonceVerification

		if ( $context === 'edit' ) {
			return true;
		}

		$uri = $_SERVER['REQUEST_URI'] ?? '';
		if ( $context === 'edit' && strpos( $uri, '/wp-json/wp/v2/posts' ) !== false ) {
			return true;
		}
	}

	// Fallback: some previews come in via AJAX.
	if ( wp_doing_ajax() ) {
		$action = $_POST['action'] ?? ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( is_string( $action ) && strpos( $action, 'edit-' ) !== false ) {
			return true;
		}
	}
	return false;
}


/**
 * Build a stable DOM id base for a rendered table instance.
 *
 * Stored logical cell ids remain spreadsheet coordinates such as C2. This helper
 * scopes DOM ids by table id so multiple tables can coexist on the same page.
 *
 * @since 1.2.6
 *
 * @param  int|string $table_id Persisted table id
 * @return string               DOM id base
 */
function get_table_tag_id_base( $table_id ) {
	$base_tag_id = absint( $table_id );
	return 'dtbk-table-' . strval( $base_tag_id );
}

/**
 * Return the DOM id for the rendered table title.
 *
 * @since 1.2.6
 *
 * @param  int|string $table_id Persisted table id
 * @return string               Title DOM id
 */
function get_table_title_tag_id( $table_id ) {
	return get_table_tag_id_base( $table_id ) . '-title';
}

/**
 * Return the DOM id for the rendered grid wrapper.
 *
 * @since 1.2.6
 *
 * @param  int|string $table_id Persisted table id
 * @return string               Grid DOM id
 */
function get_table_grid_tag_id( $table_id ) {
	return get_table_tag_id_base( $table_id ) . '-grid';
}

/**
 * Return a unique DOM id for a rendered cell.
 *
 * Stored logical cell ids remain unchanged and may still be used as C2, D14, etc.
 * This helper only scopes the DOM id used in rendered markup.
 *
 * @since 1.2.6
 *
 * @param  int|string $table_id Persisted table id
 * @param  string     $cell_id  Logical cell id
 * @return string               Cell DOM id
 */
function get_table_cell_tag_id( $table_id, $cell_id ) {
	$normalized_cell_id = preg_replace( '/[^A-Za-z0-9_-]+/', '-', trim( (string) $cell_id ) );
	$normalized_cell_id = trim( $normalized_cell_id, '-' );

	if ( '' === $normalized_cell_id ) {
		$normalized_cell_id = 'cell';
	}

	return get_table_tag_id_base( $table_id ) . '-cell-' . $normalized_cell_id;
}











/**
 * Retrieve attribute values for the table header.
 *
 * Ensure all current table attributes are available for rendering even if the
 * table doesn't contain all values.  We fill in the gaps with attribute defaults
 * as needed.
 *
 * @since 1.0.0
 *
 * @param  array $table_header Metadata about the table
 * @return array Table attributes
 */
function get_table_header_attributes( $table_header ) {

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
		'hideTitle'                => false,
	);

	$table_header_attributes = array_merge( $table_default_attributes, $table_header['attributes'] );
	return $table_header_attributes;
}

/**
 * Converts row attributes into css variables
 *
 * Retrieve table rows, provide default attribute values for missing attribibutes,
 * and generate css variable values.  Returns an array of css styles associated with
 * each row in the filter.
 *
 * @since 1.0.0
 *
 * @param  array  $rows All table rows
 * @param  string $filter identifies whether process table header vs. body rows.
 * @return array css variables for table row
 */
function process_rows( $rows, $filter ) {

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

	$return_result         = array();
	$return_rows           = array();
	$return_grid_row_style = '';

	foreach ( $rows as $row ) {
		$row_attributes = array_merge( $row_default_attributes, $row['attributes'] );

		switch ( $filter ) {
			case 'is_header':
				if ( $row_attributes['isHeader'] === true ) {
					$grid_row_style = format_row( $row_attributes );
					$grid_row       = array(
						'row_id'       => $row['row_id'],
						'gridRowStyle' => $grid_row_style,
					);
					array_push( $return_rows, $grid_row );
					$return_grid_row_style .= $grid_row_style;
				}
				break;
			case 'is_body':
				if ( $row_attributes['isHeader'] !== true ) {
					$grid_row_style = format_row( $row_attributes );
					$grid_row       = array(
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

/**
 * Create the css variable for one row based on the passed attributes
 *
 * @since 1.0.0
 * @see process_rows()
 *
 * @param  array $row_attributes All attributes associated with a single table row
 * @return string formatted css variable
 */
function format_row( $row_attributes ) {

	list('rowHeightType'    => $row_height_type,
		'minHeight'         => $min_height,
		'minHeightUnits'    => $min_height_units,
		'maxHeight'         => $max_height,
		'maxHeightUnits'    => $max_height_units,
		'fixedHeight'       => $fixed_height,
		'fixedHeightUnits'  => $fixed_height_units,
		'verticalAlignment' => $vertical_alignment,
	) = $row_attributes;

	$sizing         = '';
	$grid_row_style = '';

	switch ( $row_height_type ) {
		case 'Auto':
			$grid_row_style .= 'auto ';
			break;
		case 'Fixed':
			$grid_row_style .= strval( $fixed_height ) . $fixed_height_units . ' ';
			break;
		case 'Custom':
			$sizing          = 'minmax(' . strval( $min_height ) . $min_height_units . ', ' . strval( $max_height ) . $max_height_units . ') ';
			$grid_row_style .= $sizing;
			break;
		default:
			error_log( 'Unrecognized Attibute Type' );
	}

	return $grid_row_style;
}

/**
 * Create grid-template-columns CSS variableUndocumented function.
 *
 * Loop each column and build the CSS variable from the attributes as formatted
 * and concatenated.
 *
 * @since 1.0.0
 * @param  array $columns Array of columns in the table
 * @return string CSS value for grid-tempalte-columns
 */
function process_columns( $columns ) {
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
					$sizing = 'minmax(' . strval( $min_width ) . $min_width_units . ', ' . strval( $max_width ) . 'fr) ';
				} else {
					$sizing = $max_width . 'fr ';
				}
				$new_grid_column_style .= $sizing;
				break;
			case 'Auto':
				$new_grid_column_style .= 'auto ';
				break;
			case 'Fixed':
				$new_grid_column_style .= strval( $fixed_width ) . $fixed_width_units . ' ';
				break;
			case 'Custom':
				$sizing                 = 'minmax(' . strval( $min_width ) . $min_width_units . ', ' . strval( $max_width ) . $max_width_units . ') ';
				$new_grid_column_style .= $sizing;
				break;
		}
	}

	return $new_grid_column_style;
}

/**
 * Return cells for the specified row.
 *
 * Updates returned cells with the cell id using letters for the column id.
 *
 * @since 1.0.0
 * @since 1.2.0  Update to return cell data type based on column data type attribute.
 *
 * @param  Array $table_cells All cells for the table
 * @param  int   $row_id Current row id
 * @param  Array $table_columns All columns for the table
 * @return array Transformed cells for the current row
 */
function process_cells( $table_cells, $row_id, $table_columns ) {
	$filtered_cells = array_filter(
		$table_cells,
		function ( $v ) use( $row_id ) {
			return $v['row_id'] === $row_id;
		},
		ARRAY_FILTER_USE_BOTH
	);

	$return_cells = array();

	foreach ( $filtered_cells as $cell ) {
		$cell_id = number_to_letter( $cell['column_id'] ) . $cell['row_id'];

		$column_data_type = array(
			'type' => 'general',
		);

		$column_classes = '';

		if ( isset( $table_columns[ $cell['column_id'] - 1 ]['attributes']['columnDataType'] ) ) {
			$column_data_type = $table_columns[ $cell['column_id'] - 1 ]['attributes']['columnDataType'];
		}

		if ( isset( $table_columns[ $cell['column_id'] - 1 ]['classes'] ) ) {
			$column_classes = $table_columns[ $cell['column_id'] - 1 ]['classes'];
		}

		$grid_cell = array(
			'cell_tag_id'    => get_table_cell_tag_id( $cell['table_id'], $cell_id ),
			'data_type'      => $column_data_type,
			'column_classes' => $column_classes,
			'attributes'     => $cell['attributes'],
			'classes'        => $cell['classes'],
			'content'        => $cell['content'],
		);
		array_push( $return_cells, $grid_cell );
	}
	return $return_cells;
}

/**
 * Return CSS class for banded row formatting if the row should be banded.
 *
 * @since 1.0.0
 * @param  int  $row_id
 * @param  bool $banded_rows Does this table use banded rows?
 * @param  bool $enable_header_row Does this table have a header row?
 * @return string
 */
function get_calculated_classes( $row_id, $banded_rows, $enable_header_row ) {

	$banded_row_offset  = $enable_header_row ? 1 : 0;
	$calculated_classes = '';

	if ( $banded_rows && $banded_row_offset === 0 && $row_id % 2 === 0 ) {
		$calculated_classes .= 'grid-control__body-rows--banded-row ';
	}

	if ( $banded_rows && $banded_row_offset === 1 && $row_id > 1 && ( $row_id + $banded_row_offset ) % 2 === 0 ) {
		$calculated_classes .= 'grid-control__body-rows--banded-row ';
	}

	return $calculated_classes;
}

/**
 * Undocumented function
 *
 * Description - A supplement to the summary, above.  Full sentences.
 *
 * @since x.xx.xx
 * @deprecated x.x.x Use new_function_name()
 * @see Function/method/class relied on
 *
 * @link URL
 * @global [type]  Description
 *
 * @param  [type] $enable_header
 * @return void
 */
function start_grid_row_nbr( $enable_header ) {
	$start_grid_line = 1;
	$start_grid_line = $enable_header ? $start_grid_line + 1 : $start_grid_line;

	return null;
}

function end_grid_row_nbr( $start_grid_line, $row_group, $num_rows, $enable_header, $enable_footer ) {
	$end_grid_line = 0;

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
			error_log( 'Unknown row type' );
	}

	return null;
}

/**
 * Identify whether the border is split (a potentially different style on each side) or
 * flat (the same style on eaach side).
 *
 * @since 1.0.0
 *
 * @param  array $border The current border style
 * @return string The boarder's stype type
 */
function get_border_style_type( $border ) {
	if ( $border ) {
		foreach ( $border as $index => $border_segment ) {
			if ( is_array( $border_segment ) ) {
				return 'split';
			}
		}
		return 'flat';
	}
	return 'unknown';
}

/**
 * Retrieve an attibute for table border styling
 *
 * Description - A supplement to the summary, above.  Full sentences.
 *
 * @since 1.0.0
 *
 * @param  array  $border Table attribute for header border style
 * @param  string $border_location The location for which to get the style (left, top, right, bottom)
 * @param  string $border_attribute Attribute Type (color, stype, width)
 * @param  string $border_type Border is slit vs. flat
 * @return string Css style value
 */
function get_border_style( $border, $border_location, $border_attribute, $border_type ) {
	// lookup and return the style attibute if it is set
	switch ( $border_type ) {
		case 'split':
			if ( isset( $border[ $border_location ][ $border_attribute ] ) ) {
				return $border[ $border_location ][ $border_attribute ];
			}
			break;
		case 'flat':
			if ( isset( $border[ $border_attribute ] ) ) {
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

/**
 * Prepare css classes for html render
 *
 * @since 1.2.4
 *
 * @param  string $cell_classes         css classes assigned at the cell level
 * @param  string $column_classes       css classes assigned at the column level
 * @param  array  $conditional_classes  classes assigned based on condition rules
 * @return string                       classes to assign for render
 */
function get_cell_classes( $cell_classes, $column_classes, $conditional_classes ) {

	$applied_conditional_classes = '';

	foreach ( $conditional_classes as $key => $condition_rule ) {
		switch ( $key ) {
			case 'redNegative':
				$applied_conditional_classes = $condition_rule ? $applied_conditional_classes . ' ' . 'grid-control__body-columns--number-red' : $applied_conditional_classes;
		}
	}

	return $cell_classes . ' ' . $column_classes . $applied_conditional_classes;
}

/**
 * Render Date-Time cell data types
 *
 * @since 1.2.0
 *
 * @param  array  $cell                   Cell data and attributes to be rendered
 * @param  string $grid_show_inner_lines  Show inner grid lines for cell?
 * @param  string $grid_inner_line_width  Width for inner grid lines if present
 * @return void
 */
function render_date_time_cell( $cell, $grid_show_inner_lines, $grid_inner_line_width ) {
	$conditional_classes = array();
	// No conditional classes currently exist for date-time

	// Get CSS classes
	$cell_classes        = 'grid-control__body-cells ' . $cell['classes'];
	$cell_render_classes = get_cell_classes( $cell_classes, $cell['column_classes'], $conditional_classes );

	// Prep for future front end editing.
	$editable = false;

	if ( $editable ) {
		// Front End Edit.
		?>
		<input id="<?php echo esc_attr( $cell['cell_tag_id'] ); ?>"
			type=<?php echo esc_attr( $cell['data_type']['settings']['format'] ); ?>
			class="grid-control__body-cells"
			style="--showGridLines: <?php echo esc_attr( $grid_show_inner_lines ); ?>;
				--gridLineWidth: <?php echo esc_attr( $grid_inner_line_width ); ?>"
			value="<?php echo esc_attr( $cell['content'] ); ?>">
		</input>
		<?php
	} else {
		// Display only.
		?>
		<time id="<?php echo esc_attr( $cell['cell_tag_id'] ); ?>"
			role="cell"
			class="<?php echo esc_attr( $cell_render_classes ); ?>"
			style="--showGridLines: <?php echo esc_attr( $grid_show_inner_lines ); ?>;
				--gridLineWidth: <?php echo esc_attr( $grid_inner_line_width ); ?>"
			value=<?php echo esc_attr( $cell['content'] ); ?>
		>
			<?php echo esc_html( format_display_date( $cell ) ); ?>
		</time>
		<?php
	}
}

/**
 * Format a cell date for display.
 *
 * Description - The cell contains the data type and date format.  Converts ISO date to
 *               the display format.
 *
 * @since 1.2.0
 *
 * @param  array $cell  Cell data
 * @return string       Formatted date
 */
function format_display_date( $cell ) {
	if ( ! isset( $cell['attributes']['value']['indexText'] ) ||
		$cell['attributes']['value']['indexText'] === '' ) {
		return '';
	}

	if ( $cell['data_type']['settings']['format'] === 'date' ) {
		return gmdate( 'n/j/Y', strtotime( $cell['attributes']['value']['indexText'] ) );
	}
	if ( $cell['data_type']['settings']['format'] === 'time' ) {
		return gmdate( 'g:i a', strtotime( $cell['attributes']['value']['indexText'] ) );
	}
	if ( $cell['data_type']['settings']['format'] === 'datetime-local' ) {
		return gmdate( 'n/j/Y g:i a', strtotime( $cell['attributes']['value']['indexText'] ) );
	}
	return '';
}

/**
 * Render Date-Time cell data types
 *
 * @since 1.2.4
 *
 * @param  array  $cell                   Cell data and attributes to be rendered
 * @param  string $grid_show_inner_lines  Show inner grid lines for cell?
 * @param  string $grid_inner_line_width  Width for inner grid lines if present
 * @return void
 */
function render_number_cell( $cell, $grid_show_inner_lines, $grid_inner_line_width ) {
	$conditional_classes = array();

	// Build array conditions
	$red_negative = false;
	if ( $cell['data_type']['settings']['formatOptions']['redNegative'] && (float) $cell['content'] < 0 ) {
		$red_negative = true;
	}
	$conditional_classes['redNegative'] = $red_negative;

	// Get CSS classes
	$cell_classes        = 'grid-control__body-cells ' . $cell['classes'];
	$cell_render_classes = get_cell_classes( $cell_classes, $cell['column_classes'], $conditional_classes );

	// Prep for future front end editing.
	$editable = false;
	if ( $editable ) {
		// Front End Edit.
		?>
		<input id="<?php echo esc_attr( $cell['cell_tag_id'] ); ?>"
			type=<?php echo esc_attr( $cell['data_type']['settings']['format'] ); ?>
			class="grid-control__body-cells"
			style="--showGridLines: <?php echo esc_attr( $grid_show_inner_lines ); ?>;
				--gridLineWidth: <?php echo esc_attr( $grid_inner_line_width ); ?>"
			value="<?php echo esc_attr( $cell['content'] ); ?>">
		</input>
		<?php
	} else {
		// Display only.
		?>
		<data id="<?php echo esc_attr( $cell['cell_tag_id'] ); ?>"
			role="cell"
			class=" <?php echo esc_attr( $cell_render_classes ); ?>"
			style="--showGridLines: <?php echo esc_attr( $grid_show_inner_lines ); ?>;
				--gridLineWidth: <?php echo esc_attr( $grid_inner_line_width ); ?>"
			value=<?php echo esc_attr( $cell['content'] ); ?>
		>
			<?php echo esc_html( format_display_number( $cell ) ); ?>
		</data>
		<?php
	}
}

/**
 * Format a cell date for display.
 *
 * Description - The cell contains the data type and number format.  Applies formatting
 *               rules and returns a formatted string representation of the number.
 *
 * @since 1.2.4
 *
 * @param  array $cell  Cell data
 * @return string       Formatted number
 */
function format_display_number( $cell ) {
	if ( ! isset( $cell['attributes']['value']['indexText'] ) ||
		$cell['attributes']['value']['indexText'] === '' ) {
		return '';
	}

	$number_format         = $cell['data_type']['settings']['format'];
	$number_format_options = $cell['data_type']['settings']['formatOptions'];
	$number_value          = $cell['attributes']['value']['indexText'];

	$number_style = '';
	switch ( $number_format ) {
		case 'number':
			$number_style = NumberFormatter::DECIMAL;
			break;
		case 'integer':
			$number_style = NumberFormatter::DECIMAL;
			break;
		case 'percent':
			$number_style = NumberFormatter::PERCENT;
			break;
		case 'currency':
			$number_style = NumberFormatter::CURRENCY;
			break;
	}

	$formatted_number  = new NumberFormatter( 'en_US', $number_style );
	$decimal_pattern   = '';
	$integer_pattern   = '0';
	$negative_brackets = false;
	$currency_format   = false;

	foreach ( $number_format_options as $option => $value ) {
		switch ( $option ) {
			case 'decimalPlaces':
				if ( $value > 0 ) {
					$decimal_pattern = str_repeat( '0', $value );
				}
				break;
			case 'showCurrencySymbol':
				$currency_format = $value;
				break;
			case 'thousandSeparator':
				if ( $value ) {
					$integer_pattern = '#,##0';
				}
				break;
			case 'bracketNegative':
				if ( $value ) {
					$negative_brackets = true;
				}
				break;
		}
	}

	if ( $currency_format ) {
		$integer_pattern = '¤' . $integer_pattern;
	}

	$number_positive_pattern = $decimal_pattern ? $integer_pattern . '.' . $decimal_pattern : $integer_pattern;

	if ( $number_format === 'percent' ) {
		$number_positive_pattern .= '%';
	}

	if ( $negative_brackets ) {
		$number_negative_pattern = '(' . $number_positive_pattern . ')';
	} else {
		$number_negative_pattern = '-' . $number_positive_pattern;
	}

	$number_pattern = $number_positive_pattern . ';' . $number_negative_pattern;
	$formatted_number->setPattern( $number_pattern );

	if ( $currency_format ) {
		return $formatted_number->formatCurrency( $number_value, 'USD' );
	} else {
		return $formatted_number->format( $number_value );
	}
}
