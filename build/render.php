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
 * Get Table - Load variables
 */

$table = get_table($tableId);
$tableHeader = $table[ 'header' ];
$tableName = $tableHeader[ 'table_name' ];
$tableColumns = $table[ 'columns' ];
$tableRows = $table[ 'rows' ];
$tableCells = $table[ 'cells' ];

$numColumns = count($tableColumns);
$numRows = count($tableRows);

list('bandedRows' => $bandedRows,
    'bandedRowColor' => $gridBandedColor,
    'showGridLines' => $gridShowInnerLines,
    'gridLineWidth' => $gridInnerLineWidth,
    'horizontalAlignment' => $tableHorizontalAlignment,
    'verticalAlignment' => $tableVerticalAlignment
) = $tableHeader[ 'attributes' ];

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
        $cellRowId = $cell[ 'row_id' ];
        $cellColumnId = $cell[ 'column_id' ];
        $cellId = numberToLetter($cellColumnId) . $cellRowId;

        $calculatedClasses = getCalculatedClasses($cellRowId, $cellColumnId, $bandedRows);

        if ($cell[ 'row_id' ] === $row[ 'row_id' ]) {?>
				<div id="<?php echo $cellId; ?>" class="grid-control__cells <?php echo $cell[ 'classes' ] . $calculatedClasses; ?>" style="--bandedRowColor: <?php echo $gridBandedColor; ?>; --showGridLines: <?php echo $gridShowInnerLines; ?>; --gridLineWidth: <?php echo $gridInnerLineWidth; ?>;"><?php echo $cell[ 'content' ]; ?></div> <?php }
    }
}?>
	</div>
</div>

</p>


