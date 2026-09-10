<?php

namespace DynamicTableBlocks;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Do not render table in editor preview mode.
 *
 * @todo Provide a realistic static preview block.
 */
if ( dtbk_is_editor_preview_request() ) {
	return '<div class="wp-block-dynamic-table-blocks-dynamic-table-blocks">'
		. esc_html__( 'Dynamic Table preview', 'dynamic-table-blocks' )
		. '</div>';
}

$table_id        = isset( $attributes['table_id'] ) ? absint( $attributes['table_id'] ) : 0;
$block_table_ref = $attributes['block_table_ref'];
$grid_alignment  = $attributes['block_alignment'];

// Fail if invalid table ID.
if ( (int) $table_id <= 0 ) {
	error_log( 'Invalid table ID provided in block attributes.' );
	return;
}

/**
 * Get Table - Load variables
 */
$table = get_table( $table_id );
if ( is_wp_error( $table ) ) {
	error_log( 'The following error occured when rendering table: ' . implode( ', ', $table->get_error_messages() ) );
} else {

	$table_header  = $table['header'];
	$table_name    = $table_header['table_name'];
	$table_columns = $table['columns'];
	$table_rows    = $table['rows'];
	$table_cells   = $table['cells'];
	$num_columns   = count( $table_columns );
	$num_rows      = count( $table_rows );

	$table_header_attributes = get_table_header_attributes( $table_header );

	list( 'showGridLines' => $show_grid_lines,
		'bandedRows' => $banded_rows,
		'bandedRowBackgroundColor' => $grid_banded_background_color,
		'bandedTextColor' => $grid_banded_text_color,
		'gridLineWidth' => $grid_line_width,
		'allowHorizontalScroll' => $allow_horizontal_scroll,
		'enableHeaderRow' => $enable_header_row,
		'headerAlignment' => $header_alignment,
		'headerRowSticky' => $header_row_sticky,
		'headerBorder' => $header_border,
		'horizontalAlignment' => $table_horizontal_alignment,
		'bodyAlignment' => $body_alignment,
		'bodyBorder' => $body_border,
		'verticalAlignment' => $table_vertical_alignment,
		'hideTitle' => $hide_title,
		'titleTagElement' => $title_tag_element,
	) = $table_header_attributes;

	list( 'renderMode' => $render_mode,
			'listItemStyleType' => $list_item_style_type,
			'allowFiltering' => $allow_filtering,
			'allowSorting' => $allow_sorting,
			'allowEditing' => $allow_editing,
	) = $table_header_attributes['frontEndOptions'];

	$allowed_render_modes = array( 'table', 'ol', 'ul' );
	$render_mode          = in_array( $render_mode, $allowed_render_modes, true )
		? $render_mode
		: 'table';


	$header_row_sticky_style = $header_row_sticky ? 'auto' : 'hidden';
	$header_row_sticky_class = $header_row_sticky ? 'grid-control grid-control__header--sticky' : 'grid-control';
	$horizontal_scroll_style = $allow_horizontal_scroll ? 'auto' : 'hidden';

	$grid_column_style     = process_columns( $table_columns );
	$grid_show_inner_lines = $show_grid_lines ? 'solid' : 'hidden';
	$grid_inner_line_width = $show_grid_lines ? strval( $grid_line_width ) . 'px' : '0px';
	$table_grid_tag_id     = get_table_grid_tag_id( $table_id );
	$table_title_tag_id    = get_table_title_tag_id( $table_id );
	$table_title_text      = trim( wp_strip_all_tags( $table_name, true ) );
	$table_accessible_name = $table_title_text !== '' ? $table_title_text : __( 'Dynamic table', 'dynamic-table-blocks' );
	$table_labelledby      = ( ! $hide_title && '' !== $table_title_text ) ? $table_title_tag_id : '';
	$header_rows           = process_rows( $table_rows, 'is_header' );
	$body_rows             = process_rows( $table_rows, 'is_body' );
	$rendered_row_count    = count( $body_rows['rows'] ) + ( $enable_header_row ? count( $header_rows['rows'] ) : 0 );

	$title_tag_element = sanitize_table_title_tag_element( $title_tag_element );

	$block_wrapper               = get_block_wrapper_attributes();
	$block_wrapper_sticky_header = str_replace( '"', '', str_replace( 'class=', '', $block_wrapper ) ) . ' ';

	/**
	* Header Styling
	*/
	$header_border_style_type = get_border_style_type( $header_border );
	// Top header border
	$header_border_top_color = get_border_style( $header_border, 'top', 'color', $header_border_style_type );
	$header_border_top_style = get_border_style( $header_border, 'top', 'style', $header_border_style_type );
	$header_border_top_width = get_border_style( $header_border, 'top', 'width', $header_border_style_type );

	// Right header border
	$header_border_right_color = get_border_style( $header_border, 'right', 'color', $header_border_style_type );
	$header_border_right_style = get_border_style( $header_border, 'right', 'style', $header_border_style_type );
	$header_border_right_width = get_border_style( $header_border, 'right', 'width', $header_border_style_type );

	// Bottom header border
	$header_border_bottom_color = get_border_style( $header_border, 'bottom', 'color', $header_border_style_type );
	$header_border_bottom_style = get_border_style( $header_border, 'bottom', 'style', $header_border_style_type );
	$header_border_bottom_width = get_border_style( $header_border, 'bottom', 'width', $header_border_style_type );

	// Left header border
	$header_border_left_color = get_border_style( $header_border, 'left', 'color', $header_border_style_type );
	$header_border_left_style = get_border_style( $header_border, 'left', 'style', $header_border_style_type );
	$header_border_left_width = get_border_style( $header_border, 'left', 'width', $header_border_style_type );

	/**
	* Body Styling
	*/
	$body_border_style_type = get_border_style_type( $body_border );
	// Top body border.
	$body_border_top_color = get_border_style( $body_border, 'top', 'color', $body_border_style_type );
	$body_border_top_style = get_border_style( $body_border, 'top', 'style', $body_border_style_type );
	$body_border_top_width = get_border_style( $body_border, 'top', 'width', $body_border_style_type );

	// Right body border.
	$body_border_right_color = get_border_style( $body_border, 'right', 'color', $body_border_style_type );
	$body_border_right_style = get_border_style( $body_border, 'right', 'style', $body_border_style_type );
	$body_border_right_width = get_border_style( $body_border, 'right', 'width', $body_border_style_type );

	// Bottom body border.
	$body_border_bottom_color = get_border_style( $body_border, 'bottom', 'color', $body_border_style_type );
	$body_border_bottom_style = get_border_style( $body_border, 'bottom', 'style', $body_border_style_type );
	$body_border_bottom_width = get_border_style( $body_border, 'bottom', 'width', $body_border_style_type );

	// Left body border.
	$body_border_left_color = get_border_style( $body_border, 'left', 'color', $body_border_style_type );
	$body_border_left_style = get_border_style( $body_border, 'left', 'style', $body_border_style_type );
	$body_border_left_width = get_border_style( $body_border, 'left', 'width', $body_border_style_type );

	$render_context = array(
		'banded_rows'                  => $banded_rows,
		'body_alignment'               => $body_alignment,
		'body_border_bottom_color'     => $body_border_bottom_color,
		'body_border_bottom_style'     => $body_border_bottom_style,
		'body_border_bottom_width'     => $body_border_bottom_width,
		'body_border_left_color'       => $body_border_left_color,
		'body_border_left_style'       => $body_border_left_style,
		'body_border_left_width'       => $body_border_left_width,
		'body_border_right_color'      => $body_border_right_color,
		'body_border_right_style'      => $body_border_right_style,
		'body_border_right_width'      => $body_border_right_width,
		'body_border_top_color'        => $body_border_top_color,
		'body_border_top_style'        => $body_border_top_style,
		'body_border_top_width'        => $body_border_top_width,
		'body_rows'                    => $body_rows,
		'enable_header_row'            => $enable_header_row,
		'grid_alignment'               => $grid_alignment,
		'grid_banded_background_color' => $grid_banded_background_color,
		'grid_banded_text_color'       => $grid_banded_text_color,
		'grid_column_style'            => $grid_column_style,
		'grid_inner_line_width'        => $grid_inner_line_width,
		'grid_show_inner_lines'        => $grid_show_inner_lines,
		'header_alignment'             => $header_alignment,
		'header_border_bottom_color'   => $header_border_bottom_color,
		'header_border_bottom_style'   => $header_border_bottom_style,
		'header_border_bottom_width'   => $header_border_bottom_width,
		'header_border_left_color'     => $header_border_left_color,
		'header_border_left_style'     => $header_border_left_style,
		'header_border_left_width'     => $header_border_left_width,
		'header_border_right_color'    => $header_border_right_color,
		'header_border_right_style'    => $header_border_right_style,
		'header_border_right_width'    => $header_border_right_width,
		'header_border_top_color'      => $header_border_top_color,
		'header_border_top_style'      => $header_border_top_style,
		'header_border_top_width'      => $header_border_top_width,
		'header_row_sticky_class'      => $header_row_sticky_class,
		'header_row_sticky_style'      => $header_row_sticky_style,
		'header_rows'                  => $header_rows,
		'horizontal_scroll_style'      => $horizontal_scroll_style,
		'num_columns'                  => $num_columns,
		'num_rows'                     => $num_rows,
		'rendered_row_count'           => $rendered_row_count,
		'table_accessible_name'        => $table_accessible_name,
		'table_cells'                  => $table_cells,
		'table_columns'                => $table_columns,
		'table_grid_tag_id'            => $table_grid_tag_id,
		'table_labelledby'             => $table_labelledby,
	); ?>

	<section <?php echo $block_wrapper; ?>>  <!-- Escaping WordPress defined variable breaks the page. -->
		<div style="display:block";>
			<?php if ( ! $hide_title ) { ?>
			<<?php echo esc_attr( $title_tag_element ); ?> id="<?php echo esc_attr( $table_title_tag_id ); ?>"
				class="dtbk-table-title"
				style="--gridAlignment: <?php echo esc_attr( $grid_alignment ); ?>;">
				<?php echo wp_kses_post( $table_name ); ?>
			</<?php echo esc_attr( $title_tag_element ); ?>>
			<?php }

			if ( $render_mode === 'table' ) {
				render_table_body($render_context);
			} else {
				render_list_body($render_mode, $list_item_style_type, $render_context);
			}
			?>
		</div>
	</section>
	<?php
}
