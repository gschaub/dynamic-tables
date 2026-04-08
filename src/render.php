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
	) = $table_header_attributes;

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
	?>

	<section <?php echo $block_wrapper; ?>>  <!-- Escaping WordPress defined variable breaks the page. -->
		<div style="display:block";>
			<?php if ( ! $hide_title ) { ?>
			<p id="<?php echo esc_attr( $table_title_tag_id ); ?>"
				class="dtbk-table-title"
				style="--gridAlignment: <?php echo esc_attr( $grid_alignment ); ?>;
					white-space:pre-wrap">
				<?php echo wp_kses_post( $table_name ); ?>
			</p>
			<?php } ?>

			<div class="grid-scroller"
				style="--headerRowSticky: <?php echo esc_attr( $header_row_sticky_style ); ?>">

				<div id="<?php echo esc_attr( $table_grid_tag_id ); ?>"
					role="table"
					aria-rowcount="<?php echo esc_attr( $rendered_row_count ); ?>"
					aria-colcount="<?php echo esc_attr( $num_columns ); ?>"
					<?php if ( $table_labelledby ) { ?>
						aria-labelledby="<?php echo esc_attr( $table_labelledby ); ?>"
					<?php } else { ?>
						aria-label="<?php echo esc_attr( $table_accessible_name ); ?>"
					<?php } ?>
					class="<?php echo esc_attr( $header_row_sticky_class ); ?>"
					style="--gridTemplateColumns: <?php echo esc_attr( $grid_column_style ); ?>;
						--horizontalScroll: <?php echo esc_attr( $horizontal_scroll_style ); ?>;
						--headerRowSticky: <?php echo esc_attr( $header_row_sticky_style ); ?>;
						--gridNumColumns: <?php echo esc_attr( $num_columns ); ?>;
						--gridNumRows: <?php echo esc_attr( $num_rows ); ?>;
						--gridAlignment: <?php echo esc_attr( $grid_alignment ); ?>">

					<?php
					if ( $enable_header_row ) {
						foreach ( $header_rows['rows'] as $index => $header_row ) {
							?>
							<div class="grid-control__header"
								role="row"
								style="--gridTemplateHeaderRows: <?php echo esc_attr( $header_row['gridRowStyle'] ); ?>;
									--startGridHeaderRowNbr: 1;
									--endGridHeaderRowNbr: 2;
									--headerBorderTopColor: <?php echo esc_attr( $header_border_top_color ); ?>;
									--headerBorderTopStyle: <?php echo esc_attr( $header_border_top_style ); ?>;
									--headerBorderTopWidth: <?php echo esc_attr( $header_border_top_width ); ?>;
									--headerBorderRightColor: <?php echo esc_attr( $header_border_right_color ); ?>;
									--headerBorderRightStyle: <?php echo esc_attr( $header_border_right_style ); ?>;
									--headerBorderRightWidth: <?php echo esc_attr( $header_border_right_width ); ?>;
									--headerBorderBottomColor: <?php echo esc_attr( $header_border_bottom_color ); ?>;
									--headerBorderBottomStyle: <?php echo esc_attr( $header_border_bottom_style ); ?>;
									--headerBorderBottomWidth: <?php echo esc_attr( $header_border_bottom_width ); ?>;
									--headerBorderLeftColor: <?php echo esc_attr( $header_border_left_color ); ?>;
									--headerBorderLeftStyle: <?php echo esc_attr( $header_border_left_style ); ?>;
									--headerBorderLeftWidth: <?php echo esc_attr( $header_border_left_width ); ?>;
									--headerTextAlignment: <?php echo esc_attr( $header_alignment ); ?>">
							<?php
							$header_row_cells = process_cells( $table_cells, $header_row['row_id'], $table_columns );
							foreach ( $header_row_cells as $index => $header_cell ) {
								?>
									<div id="<?php echo esc_attr( $header_cell['cell_tag_id'] ); ?>"
										role="columnheader"
										class="grid-control__header-cells"
										style="--showGridLines: <?php echo esc_attr( $grid_show_inner_lines ); ?>;
										--gridLineWidth: <?php echo esc_attr( $grid_inner_line_width ); ?>;">
									<?php echo wp_kses_post( $header_cell['content'] ); ?>
									</div>
								<?php
							}
							?>
							</div>
							<?php
						}
					}
					$body_start_grid_line = $enable_header_row ? 1 + count( $header_rows['rows'] ) : 1;
					$body_end_grid_line   = $enable_header_row ?
						$body_start_grid_line + $num_rows - 1 :
						$body_start_grid_line + $num_rows;
					?>

					<div class="grid-control__body"
						role="rowgroup"
						style="--gridTemplateBodyRows: <?php echo esc_attr( $body_rows['grid_row_style'] ); ?>;
							--startGridBodyRowNbr: <?php echo esc_attr( $body_start_grid_line ); ?>;
							--endGridBodyRowNbr: <?php echo esc_attr( $body_end_grid_line ); ?>;
							--bodyBorderTopColor: <?php echo esc_attr( $body_border_top_color ); ?>;
							--bodyBorderTopStyle: <?php echo esc_attr( $body_border_top_style ); ?>;
							--bodyBorderTopWidth: <?php echo esc_attr( $body_border_top_width ); ?>;
							--bodyBorderRightColor: <?php echo esc_attr( $body_border_right_color ); ?>;
							--bodyBorderRightStyle: <?php echo esc_attr( $body_border_right_style ); ?>;
							--bodyBorderRightWidth: <?php echo esc_attr( $body_border_right_width ); ?>;
							--bodyBorderBottomColor: <?php echo esc_attr( $body_border_bottom_color ); ?>;
							--bodyBorderBottomStyle: <?php echo esc_attr( $body_border_bottom_style ); ?>;
							--bodyBorderBottomWidth: <?php echo esc_attr( $body_border_bottom_width ); ?>;
							--bodyBorderLeftColor: <?php echo esc_attr( $body_border_left_color ); ?>;
							--bodyBorderLeftStyle: <?php echo esc_attr( $body_border_left_style ); ?>;
							--bodyBorderLeftWidth: <?php echo esc_attr( $body_border_left_width ); ?>;
							--bodyTextAlignment: <?php echo esc_attr( $body_alignment ); ?>">

						<?php
						foreach ( $body_rows['rows'] as $index => $body_row ) {
							$calculated_classes = get_calculated_classes( $body_row['row_id'], $banded_rows, $enable_header_row );
							?>
							<div class="grid-control__body-row <?php echo esc_attr( $calculated_classes ); ?>"
								role="row"
								style="--bandedRowTextColor: <?php echo esc_attr( $grid_banded_text_color ); ?>;
									--bandedRowBackgroundColor: <?php echo esc_attr( $grid_banded_background_color ); ?>">

								<?php
								$body_row_cells = process_cells( $table_cells, $body_row['row_id'], $table_columns );
								foreach ( $body_row_cells as $index => $body_cell ) {
									/**
									 * Added swith to identify and render each cell according to its data type
									 *
									 * @since 1.2
									 */
									switch ( $body_cell['data_type']['type'] ) {
										case 'general':
											?>
											<div id="<?php echo esc_attr( $body_cell['cell_tag_id'] ); ?>"
												role="cell"
												class="grid-control__body-cells"
												style="--showGridLines: <?php echo esc_attr( $grid_show_inner_lines ); ?>;
													--gridLineWidth: <?php echo esc_attr( $grid_inner_line_width ); ?>">
												<?php echo wp_kses_post( $body_cell['content'] ); ?>
											</div>
											<?php
											break;
										case 'date-time':
											render_date_time_cell( $body_cell, $grid_show_inner_lines, $grid_inner_line_width );
											break;
										case 'number':
											render_number_cell( $body_cell, $grid_show_inner_lines, $grid_inner_line_width );
											break;
										default:
											$cell_text_alignment = 'left';
									}
								}
								?>
							</div>
							<?php
						}
						?>
					</div>
				</div>
			</div>
		</div>
	</section>
	<?php
}
