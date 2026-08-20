<?php
/**
 * Functions that render the table body based on the render mode.
 *
 * @since 1.4.7
 */
namespace DynamicTableBlocks;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


/**
 * Render output as a table, identical to its appearance in the editor.
 *
 * @since 1.4.7
 *
 * @param array $render_context output content and props required to format it.
 * @return void
 */
function render_table_body(array $render_context) {
	extract( $render_context, EXTR_SKIP ); // phpcs:ignore WordPress.PHP.DontExtract.extract_extract -- Internal, explicitly constructed render context.
	?>

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
								case 'checkbox':
									render_checkbox_cell( $body_cell, $grid_show_inner_lines, $grid_inner_line_width );
									break;
								case 'link':
									render_link_cell( $body_cell, $grid_show_inner_lines, $grid_inner_line_width );
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
<?php }

/**
 * Render output as a list.
 *
 * @since 1.4.7
 *
 * @param string $render_mode Target output type to display (ordered/unordered list).
 * @param string $list_item_style_type Style to use for numbering/bullet.
 * @param array $render_context output Content and props required to format it.
 * @return void
 */
function render_list_body( $render_mode, $list_item_style_type, array $render_context ) {
	extract( $render_context, EXTR_SKIP ); // phpcs:ignore WordPress.PHP.DontExtract.extract_extract -- Internal, explicitly constructed render context.

	$list_tag = 'ol' === $render_mode ? 'ol' : 'ul';
	$allowed_list_item_style_types = array(
		'ol' => array(
			'decimal',
			'decimal-leading-zero',
			'lower-alpha',
			'upper-alpha',
			'lower-roman',
			'upper-roman',
		),
		'ul' => array( 'disc', 'circle', 'square' ),
	);

	if ( ! in_array( $list_item_style_type, $allowed_list_item_style_types[ $list_tag ], true ) ) {
		$list_item_style_type = 'ol' === $list_tag ? 'decimal' : 'disc';
	}
	?>

	<<?php echo esc_attr( $list_tag ); ?>
		class="dtbk-table-list"
		style="list-style-type: <?php echo esc_attr( $list_item_style_type ); ?>;">

		<?php foreach ( $body_rows['rows'] as $index => $body_row ) {
		?>
		<li> <?php
			$body_row_cells = process_cells( $table_cells, $body_row['row_id'], $table_columns );
			$cell_count = count( $body_row_cells );

			foreach ( $body_row_cells as $cell_index => $body_cell ) {
				$last_cell_in_row = $cell_index === $cell_count - 1;
				switch ( $body_cell['data_type']['type'] ) {
					case 'general':
						echo wp_kses_post( $body_cell['content'] );
						break;
					case 'date-time':
						render_date_time_cell( $body_cell, $grid_show_inner_lines, $grid_inner_line_width, true );
						break;
					case 'number':
						render_number_cell( $body_cell, $grid_show_inner_lines, $grid_inner_line_width, true );
						break;
					case 'checkbox':
						// Do not display checkbox columns in list view
						break;
					case 'link':
						render_link_cell( $body_cell, $grid_show_inner_lines, $grid_inner_line_width, true );
						break;
					default:
						$cell_text_alignment = 'left';
				}
				if ( ! $last_cell_in_row ) {
					echo ' ';
				}
			}?>
		</li><?php
	} ?>

	</<?php echo esc_attr( $list_tag ); ?>>
	<?php
}
