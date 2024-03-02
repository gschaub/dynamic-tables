/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import apiFetch from "@wordpress/api-fetch"
import { useSelect } from "@wordpress/data";
import { useState, useEffect } from "@wordpress/element"
import { __ } from '@wordpress/i18n';
import { useEntityProp } from "@wordpress/core-data"
import {
    TextControl, Panel, PanelBody, PanelRow, TabbableContainer, Spinner,
    __experimentalNumberControl as NumberControl
} from '@wordpress/components';
import { RichText, AlignmentToolbar, InspectorControls, BlockControls, useBlockProps } from '@wordpress/block-editor';

/**
 *  * Internal Dependencies
 */
import { store as tableStore } from "../../src/data"
import numberToLetter from '../../src/number-to-letter';
import './editor.scss';



export default function Edit(props) {
    const blockProps = useBlockProps({
        className: "dynamic-table-edit-block"
    })

    const [table, setTable] = useState([]);
    const [tableId, setTableId] = useState('');
    const [tablePostId, setTablePostId] = useState('');
    const [tableClasses, setTableClasses] = useState('');
    const [tableName, setTableName] = useState('');
    const [renders, setRenders] = useState(0);



    const [isFetchingData, setIsFetchingData] = useState(false)
    const [gridStyle, setGridStyle] = useState('');
    const [numColumns, setNumColumns] = useState(1);
    const [numRows, setNumRows] = useState(1);
    const [gridCells, setGridCells] = useState([])
    //	const { table, table_id, table_post_id, table_classes } = useSelect((select) => {

    //const table = loadTableData()






    //	function loadTableData() {

    const { tableLoadResult = {} } = useSelect((select) => {
        const selectorArgs = ['17'];
        console.log('INSIDE TABLE LOADER - table select: ' + JSON.stringify(select(tableStore).getTable(selectorArgs), null, 4))
        return {
            tableLoadResult: select(tableStore).getTable(selectorArgs)
        }
    });

    // console.log('Table Data AFTER select: - ' + JSON.stringify(tableLoadResult, null, 4))
    // console.log('... Started = ' + JSON.stringify(tableLoadResolveStarted, null, 4))
    // console.log('... Finished = ' + JSON.stringify(tableLoadResolveFinished, null, 4))
    // console.log('... Processing = ' + JSON.stringify(tableLoadResolveProcessing, null, 4))

    useEffect(() => {

        if (Object.keys(tableLoadResult).length === 0) {
            console.log('...EMPTY - Spinner')
        } else {
            console.log('...RESOLVED - Populate Data')
            setTable(tableLoadResult.data)
            //			console.log(table.id)

        }
    },
        [tableLoadResult]
    )

    console.log(table)
    console.log(JSON.stringify(table))
    //	console.log(Object.keys(table))
    // if (table[0].id != undefined) {
    // 	console.log(table[0].id)
    // }

    //	const { tableId = '', tablePostId = '', tableName = '', tableClasses = '' } = () => {
    //		return (

    table.map((id, post_id, table_name, classes) => {
        setTableId(id)
        setTablePostId(post_id)
        setTableName(table_name)
        setTableClasses(classes)
    }
    )


    //	{table[0].map(({ id, post_id, table_name, classes })//=> {

    console.log('...' + tableId)

    // return (
    // 	tableId: id,
    // 	postId: post_id,
    // 	tableName: table_name,
    // 	tableClasses: classes
    // )}



    //console.log('Table Test - TableId - ' + tableId)



    //	const { table_id, table_post_id, table_name, table_classes } = () => {//} tableData;
    //		return tableData.map({ table_id, table_post_id, table, table_classes })
    //}

    //() => {
    //	return {table.map({ table_id, table_post_id, table, table_classes })// => {
    // return {
    // 	table_id: { id },
    // 	post_id: { post_id },
    // 	table: {table_name},
    // 	tableClasses: {classes}
    // }
    //		table.map({ table_id, table_post_id, table, table_classes })
    //}}

    // return(
    // 	table_id = { id },
    // 		post_id = { post_id },
    // 		table = {table_name},
    // 		tableClasses = {classes}




    console.log('Edit.js - Table:');
    //	console.log(JSON.stringify(table, null, 4));
    //console.log('Edit.js - Table Data - ' + JSON.stringify(tableData, null, 4));
    //	console.log('Edit.js - tableData ' + tableData);
    //console.log('   Edit.js - tableData properties ' + table_id + ', ' + table_post_id + ', ' + table_name + ', ' + table_classes)
    // console.log('Edit.js - blockPropos - ' + JSON.stringify(blockProps, null, 4));

    //let $tableNameTest = 
    //	console.log('Edit.js - tableData ' + JSON.stringify(tableData));





    //	const { table_id, table_post_id, table_classes } = () => {
    //		return {table.map({ table_id, table_post_id, table, table_classes })// => {
    // return {
    // 	table_id: { id },
    // 	post_id: { post_id },
    // 	table: {table_name},
    // 	tableClasses: {classes}
    // }
    //		table.map({ table_id, table_post_id, table, table_classes })
    //	}}

    // return(
    // 	table_id = { id },
    // 		post_id = { post_id },
    // 		table = {table_name},
    // 		tableClasses = {classes}

    // )
    //		gridCells.map(({ cellRow, cellColumn, cellId, componentClass, cellValue }) => {
    // 			return (
    // 				<RichText
    // 					className={componentClass}
    // 					tabIndex="0"
    // 					tagName="div"
    // 					id={cellId}
    // 					onChange={e => debugSetGridCells([cellRow, cellColumn, cellId, componentClass, e])}
    // 					value={cellValue}>
    // 				</RichText>
    // 			);






    //		return { table: select(tableStore).getTable('17') };






    // const [gridCells, setGridCells] = useState([
    // 	{
    // 		cellRow: '0',
    // 		cellColumn: '0',
    // 		cellId: '00',
    // 		componentClass: 'header',
    // 		cellValue: 'Column A'
    // 	}
    // ]);


    // console.log('post id: ' + props.context.postId)

    // useEffect(() => {
    // 	var random = getRndInteger(1, 10000)
    // 	props.setAttributes({ stateValue: random })
    // 	console.log(random)
    // }, [tableName])

    // useEffect(() => {
    // 	async function go() {
    // 		const response = await apiFetch({
    // 			//path: `dynamic-tables/v1/getTableName?id=${props.attributes.table_id}`,
    // 			path: `dynamic-tables/v1/TableName?id=1`,
    // 			method: "GET"
    // 		})
    // 		if (!tableName && response != tableName) {
    // 			setTableName(response)
    // 			console.log(response)
    // 		}
    // 	}
    // 	go()
    // }, [tableName])

    // Set Table Name
    // const updateTableName = (e) => {
    // 	setTableName(e)
    // }

    // Process changes to the number of columns
    const defineColumns = (num_columns) => {
        console.log('Init Columns')
        setNumColumns(Number(num_columns))
        initTableCells(Number(num_columns), Number(numRows))
        initGridStyle(Number(num_columns))
        //		console.log(JSON.stringify(dynamicStyles, null, 4))
    }

    // Process changes to the number of rows
    const defineRows = (num_rows) => {
        console.log('Init Rows')
        setNumRows(Number(num_rows))
        initTableCells(numColumns, num_rows)
    }

    function debugSetGridCells(cell) {
        let transformedCell = {
            cellRow: cell[0],
            cellColumn: cell[1],
            cellId: cell[2],
            componentClass: cell[3],
            cellValue: cell[4]
        }

        console.log(JSON.stringify(transformedCell, null, 4))
        LoadTableCells(transformedCell)
        console.log('Update Cell')
    }

    function getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Create grid array
    function initTableCells(init_num_columns, init_num_rows) {
        console.log(init_num_rows)
        var tableCells = []

        var x = 1
        var y = 1

        while (y <= init_num_rows) {
            while (x <= init_num_columns) {
                let columnLetter = numberToLetter(x)
                if (y == 1) {
                    let cell = {
                        cellRow: String(y),
                        cellColumn: String(x),
                        cellId: columnLetter + y,
                        componentClass: 'header',
                        cellValue: 'Cell' + columnLetter + y
                    }
                    tableCells.push(cell)
                } else {
                    let cell = {
                        cellRow: String(y),
                        cellColumn: String(x),
                        cellId: columnLetter + y,
                        componentClass: 'body',
                        cellValue: 'Cell' + columnLetter + y
                    }
                    tableCells.push(cell)
                }
                x++
            }
            var x = 1
            y++
        }

        setGridCells(tableCells)
        console.log(JSON.stringify(tableCells, null, 4))
    }

    function LoadTableCells(updatedCell) {
        var tableCells = gridCells

        console.log('Updated Cell ID: ' + updatedCell.cellId)
        console.log('Find Match: ' + JSON.stringify(tableCells.find(x => x.cellId === updatedCell.cellId), null, 4))

        if (tableCells.find(x => x.cellId === updatedCell.cellId)) {
            var filtered = tableCells.filter(x => x.cellId !== updatedCell.cellId)
            tableCells = filtered
        }
        // push
        tableCells.push(updatedCell)
        //console.log(tableCells.cellId)
        //console.log(tableCells.map(x => x.cellId))
        tableCells.sort((a, b) => {
            if ([[a.cellRow], [a.cellColumn]] < [[b.cellRow], [b.cellColumn]]) {
                return -1
            } else {
                return 1
            }
        })
        //tableCells.sort((a, b) => a.map(x => x.cellId) - b.map(x => x.cellId))
        setGridCells(tableCells)


        console.log(JSON.stringify(updatedCell))
        console.log(tableCells)
        console.log(JSON.stringify(tableCells, null, 4))
    }

    // Set grid column css
    function initGridStyle(init_num_columns) {

        let newGridStyle = ''
        var i = 1

        while (i <= init_num_columns) {
            if (i == 1) {
                newGridStyle = newGridStyle + "auto"
            } else {
                newGridStyle = newGridStyle + " auto"
            }
            i++
        }
        setGridStyle(newGridStyle)

    }

    function logEvent(e) {
        console.log('EVENT...')
        console.log(e)
        //console.log(JSON.stringify(event, null, 4))
    }


    console.log(JSON.stringify(gridCells, null, 4))

    return (
        <div {...blockProps} >

            {table.map(({ id = '', post_id = '', table_name = '', classes = '' }) => {
                return (
                    <ul>
                        <li>{id}</li>
                        <li>{post_id}</li>
                        <li>{table_name}</li>
                        <li>{classes}</li>
                    </ul>
                )
            })}



            {/* {<div>
				<ul>
					<li>{tableId}</li>
					<li>{tablePostId}</li>
					<li>{tableName}</li>
					<li>{tableClasses}</li>
				</ul>
			</div>} */}

            <InspectorControls>
                <Panel header="Table Definition head">
                    <PanelBody title="Table Definition" initialOpen={true}>
                        <PanelRow>
                            <TextControl label="Table Name" value={tableName} onChange={(e) => updateTableName(e)} />
                        </PanelRow>

                        <PanelRow>
                            <NumberControl label="Table Columns" value={numColumns} labelPosition="side" onChange={(e) => defineColumns(e)} />
                        </PanelRow>

                        <PanelRow>
                            <NumberControl label="Table Rows" value={numRows} labelPosition="side" onChange={(e) => defineRows(e)} />
                        </PanelRow>
                    </PanelBody>
                </Panel>
            </InspectorControls>

            {isFetchingData === true && (<Spinner></Spinner>)}

            <div>{tableName}</div>
            <TabbableContainer>
                <div className="grid-control" style={{ "--gridTemplateColumns": gridStyle }}>

                    {gridCells.map(({ cellRow, cellColumn, cellId, componentClass, cellValue }) => {
                        return (
                            <RichText
                                className={componentClass}
                                tabIndex="0"
                                tagName="div"
                                id={cellId}
                                //allowedFormats={['core/bold', 'core/italic']}
                                //onChange={cellContent => setGridCells([col, row, cellId, componentClass, cellContent])}
                                onChange={e => debugSetGridCells([cellRow, cellColumn, cellId, componentClass, e])}
                                value={cellValue}>
                            </RichText>
                        );
                    })}
                </div>
            </TabbableContainer>
        </div >)
}