<?php

require_once plugin_dir_path(__DIR__) . 'inc/dynamicTablesDbPersist.php';
require_once plugin_dir_path(__DIR__) . 'inc/dynamicTablesRoutes.php';
require_once plugin_dir_path(__DIR__) . 'inc/renderHelper.php';

/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

$tableId = $attributes[ 'table_id' ];
$blockTableRef = $attributes[ 'block_table_ref' ];

/**
 * Get Table
 */

$table = get_table($tableId);
$tableName = $table[ 'header' ][ 'table_name' ];
$tableColumns = $table[ 'columns' ];
$tableRows = $table[ 'rows' ];
$tableCells = $table[ 'cells' ];

$numColumns = count($tableColumns);
$numRows = count($tableRows);

$gridColumnStyle = process_columns($tableColumns);

?>

<p <?php echo get_block_wrapper_attributes(); ?>>

<!-- <ul>Block Attributes
		<li>Columns Style = <?php echo $gridColumnStyle; ?></li>
		<li>Table ID = <?php echo $tableId; ?></li>
		<li>Block Table Reference = <?php echo $blockTableRef; ?></li>
</ul> -->

<div>
	<!-- <p><?php echo json_encode($table); ?></p> -->
	<p><?php echo $tableName; ?></p>
	<!-- <p><?php echo json_encode($tableRows); ?></p> -->

	<div class="grid-control" style="--gridTemplateColumns: <?php echo $gridColumnStyle; ?>;">

	<?php foreach ($tableRows as $index => $row) {
    ?>
	<!-- <p><?php echo json_encode($row); ?></p> -->

		<?php foreach ($tableCells as $cellIndex => $cell) {
        $cellId = numberToLetter($cell[ 'column_id' ]) . $cell[ 'row_id' ];
        if ($cell[ 'row_id' ] === $row[ 'row_id' ]) {?>
				<!-- <p><?php echo json_encode($cell); ?></p> -->
				<div id="<?php echo $cellId; ?>" class="<?php echo 'grid-control__cells ' . $cell[ 'classes' ]; ?>">
					<?php echo $cell[ 'content' ]; ?>
				</div> <?php }}}?>
	</div>
</div>

</p>


