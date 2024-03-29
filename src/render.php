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
$blockBackgroundColor = $attributes[ 'backgroundColor' ];

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

list('showGridLines' => $showGridLines,
    'enableHeaderRow' => $enableHeaderRow,
    'tableHeaderBackgroundColor' => $tableHeaderBackgroundColor,
    'headerRowSticky' => $headerRowSticky,
    'bandedRows' => $bandedRows,
    'bandedRowColor' => $gridBandedColor,
    'gridLineWidth' => $gridineWidth,
    'horizontalAlignment' => $tableHorizontalAlignment,
    'verticalAlignment' => $tableVerticalAlignment
) = $tableHeader[ 'attributes' ];

$gridColumnStyle = process_columns($tableColumns);
$gridShowInnerLines = $showGridLines ? 'solid' : 'hidden';
$gridInnerLineWidth = $showGridLines ? strval($gridineWidth) . 'px' : '0px';
$gridHeaderBackgroundColorStyle = $tableHeaderBackgroundColor ? $tableHeaderBackgroundColor : $blockBackgroundColor;

$blockWrapper = get_block_wrapper_attributes();
$blockWrapperStickyHeader = str_replace('"', '', str_replace('class=', '', $blockWrapper)) . ' ';

// echo '>' . $blockWrapper . '< </br>';
// echo '>' . $blockWrapperStickyHeader . '< </br>';
// echo 'Header Row Sticky = ' . $headerRowSticky;

?>

<div <?php echo $blockWrapper; ?>>

    <p><?php echo $tableName; ?></p>

    <?php if ($headerRowSticky) {?>
        <div class="grid-scroller"
            style="--gridHeaderColor: <?php echo $gridHeaderBackgroundColorStyle; ?>";>
    <?php }?>

	<div class="grid-control" style="--gridTemplateColumns: <?php echo $gridColumnStyle; ?>;">

    	<?php foreach ($tableRows as $index => $row) {

    ?>

        <?php foreach ($tableCells as $cellIndex => $cell) {
        $cellRowId = $cell[ 'row_id' ];
        $cellColumnId = $cell[ 'column_id' ];
        $cellId = numberToLetter($cellColumnId) . $cellRowId;

        $calculatedClasses = getCalculatedClasses($cellRowId, $cellColumnId, $blockWrapper, $bandedRows, $enableHeaderRow, $blockWrapperStickyHeader);

        if ($cell[ 'row_id' ] === $row[ 'row_id' ]) {?>
				    <div id="<?php echo $cellId; ?>"
                        class="<?php echo $cell[ 'classes' ] . $calculatedClasses; ?>"
                        style="--bandedRowColor: <?php echo $gridBandedColor; ?>;
                            --showGridLines: <?php echo $gridShowInnerLines; ?>;
                            --gridLineWidth: <?php echo $gridInnerLineWidth; ?>;">
                        <?php echo $cell[ 'content' ]; ?>
                    </div> <?php }
    }
}?>
        </div>
   <?php if ($headerRowSticky) {
    echo '</div>';
}?>
</div>
</p>


