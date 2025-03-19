<?php

namespace DynamicTables;

// require_once plugin_dir_path(__DIR__) . 'includes/dynamicTablesDbPersist.php';
// require_once plugin_dir_path(__DIR__) . 'includes/dynamicTablesRoutes.php';
// require_once plugin_dir_path(__DIR__) . 'includes/dynamicTablesAPI.php';
// require_once plugin_dir_path(__DIR__) . 'includes/dynamic-tables-rest-api.php';
// require_once plugin_dir_path(__DIR__) . 'includes/render_helper.php';

/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

// Exit if accessed directly
if ( ! defined('ABSPATH') ) {
	exit;
}
error_log('Render Attribs = ' . json_encode($attributes));
//  print_r($attributes, true));
$table_id = $attributes['table_id'];
$block_table_ref = $attributes['block_table_ref'];
$grid_alignment = $attributes['block_alignment'];
$block_background_color = $attributes['background_color'];

/**
 * Get Table - Load variables
 */

$table = get_table($table_id);
if ( is_wp_error($table) ) {
	error_log('Table = ' . print_r($table, true));
	die;
}

$table_header = $table['header'];
$table_name = $table_header['table_name'];
$table_columns = $table['columns'];
$table_rows = $table['rows'];
$table_cells = $table['cells'];

$num_columns = count($table_columns);
$num_rows = count($table_rows);

list('showGridLines' => $show_grid_lines,
	'enableHeaderRow' => $enable_header_row,
	'tableHeaderBackgroundColor' => $table_header_background_color,
	'headerRowSticky' => $header_row_sticky,
	'bandedRows' => $banded_rows,
	'bandedRowTextColor' => $grid_banded_text_color,
	'bandedRowBackgroundColor' => $grid_banded_background_color,
	'gridLineWidth' => $grid_line_width,
	'horizontalAlignment' => $table_horizontal_alignment,
	'verticalAlignment' => $table_vertical_alignment
) = $table_header['attributes'];

$grid_column_style = process_columns($table_columns);
$grid_show_inner_lines = $show_grid_lines ? 'solid' : 'hidden';
$grid_inner_line_width = $show_grid_lines ? strval($grid_line_width) . 'px' : '0px';
$grid_header_background_color_style = $table_header_background_color ? $table_header_background_color : $block_background_color;

$block_wrapper = get_block_wrapper_attributes();
$block_wrapper_sticky_header = str_replace('"', '', str_replace('class=', '', $block_wrapper)) . ' ';

// echo '>' . $block_wrapper . '< </br>';
// echo '>' . $blockWrapperStickyHeader . '< </br>';
// echo 'Header Row Sticky = ' . $header_row_sticky;

?>

<div <?php echo esc_attr($block_wrapper); ?>>

	<p id="tableTitle"
		style="--gridAlignment: <?php echo esc_attr($grid_alignment); ?>;">
		<?php echo wp_kses_post($table_name); ?>
	</p>

	<?php if ( $header_row_sticky ) {?>
		<div class="grid-scroller"
			style="--gridHeaderColor: <?php echo esc_attr($grid_header_background_color_style); ?>;">
	<?php }?>

	<div class="grid-control"
		style="--gridTemplateColumns: <?php echo esc_attr($grid_column_style); ?>;
			--gridAlignment: <?php echo esc_attr($grid_alignment); ?>;">

		<?php foreach ( $table_rows as $index => $row ) {

	?>

		<?php foreach ( $table_cells as $cell_index => $cell ) {
		$cell_row_id = $cell['row_id'];
		$cell_column_id = $cell['column_id'];
		$cell_id = number_to_letter($cell_column_id) . $cell_row_id;

		$calculated_classes = get_calculated_classes($cell_row_id, $cell_column_id, $block_wrapper, $banded_rows, $enable_header_row, $block_wrapper_sticky_header);

		if ( $cell['row_id'] === $row['row_id'] ) {?>
					<div id="<?php echo esc_attr($cell_id); ?>"
						class="<?php echo esc_attr($cell['classes'] . $calculated_classes); ?>"
						style="--bandedRowTextColor: <?php echo esc_attr($grid_banded_text_color); ?>;
							--bandedRowBackgroundColor: <?php echo esc_attr($grid_banded_background_color); ?>;
							--showGridLines: <?php echo esc_attr($grid_show_inner_lines); ?>;
							--gridLineWidth: <?php echo esc_attr($grid_inner_line_width); ?>;">
						<?php echo wp_kses_post($cell['content']); ?>
					</div> <?php }
	}
}?>
		</div>
	<?php if ( $header_row_sticky ) {
	echo '</div>';
}?>
</div>
