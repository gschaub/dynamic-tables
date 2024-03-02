/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { useSelect, useDispatch } from "@wordpress/data";
import { useState, useEffect } from "@wordpress/element"
import { __ } from '@wordpress/i18n';
import { useEntityProp } from "@wordpress/core-data"
import {
	TextControl, Panel, PanelBody, PanelRow, TabbableContainer, Spinner,
	__experimentalNumberControl as NumberControl
} from '@wordpress/components';
import { RichText, AlignmentToolbar, InspectorControls, BlockControls, useBlockProps } from '@wordpress/block-editor';
import { getBlockAttributes } from '@wordpress/blocks';

/**
 *  * Internal Dependencies
 */
import { store as tableStore } from "./data"
import numberToLetter from './utils';
import TABLE_ATTRIBUTE_TYPES from './constants'
import './editor.scss';

export default function Edit(props) {
	const blockProps = useBlockProps({
		className: "dynamic-table-edit-block"
	})

	// console.log(blockProps);
	// console.log(props.attributes);
	console.log(props);
	//	console.log(getBlockAttributes('dynamic-tables/dynamic-tables'))

	const [render, setRender] = useState(0);
	const [numColumns, setNumColumns] = useState(1);
	const [numRows, setNumRows] = useState(1);
	const [gridCells, setGridCells] = useState([])

	const { table = null, tableGetIsResolving, tableHasStartedResolving, tableHasFinishedResolving, tableIsResolving } = useSelect((select) => {
		const selectorArgs = ['18'];

		console.log('...Selecting Table')
		return {
			table: select(tableStore).getTable(selectorArgs),
			tableGetIsResolving: select(tableStore).getIsResolving('getTable', selectorArgs),
			tableHasStartedResolving: select(tableStore).hasStartedResolution('getTable', selectorArgs),
			tableHasFinishedResolving: select(tableStore).hasFinishedResolution('getTable', selectorArgs),
			tableIsResolving: select(tableStore).isResolving('getTable', selectorArgs)
		}
	})

	const { updateCell } = useDispatch(tableStore);
	const { updateColumn } = useDispatch(tableStore);
	const { saveTable } = useDispatch(tableStore);

	function prepareSaveTable(tableId, table) {
		console.log('SAVING table...')
		console.log('   tableId = ' + tableId)
		console.log('   table = ' + JSON.stringify(table, null, 4))

		const restCells = table.cells.map(({ cell_id, ...rest }) => {
			return rest;
		})

		const { post_id, table_name, table_classes } = table
		const restHeader = [
			{
				"id": tableId,
				"post_id": post_id,
				"table_name": table_name,
				"classes": table_classes
			}
		]
		const tableToSave = [
			{
				header: [...restHeader],
				columns: [...table.columns],
				cells: [...restCells]

			}
		]

		return saveTable(tableId, JSON.stringify(tableToSave));
	}

	function setTableAttributes(attribute, id, type, value) {

		console.log('Table Attribute Change: attribute - ' + attribute + ', id - ' + id + ', type - ' + type + ', value - ' + value)

		switch (type) {
			case 'CONTENT':
				{
					if (attribute === 'cell') {
						return (updateCell(id, 'content', value))
					} else if (attribute === 'column') {
						return (updateColumn(id, 'content', value))
					}
					break;
				}
			case 'CLASSES':
				{
					if (attribute === 'cell') {
						return (updateCell(id, 'classes', value))
					} else if (attribute === 'column') {
						return (updateColumn(id, 'classes', value))
					}
					break;

				}//do stuff
				break;
			default:
				console.log('Unrecognized Attibute Type')
		}
	}

	function processColumns(columns) {
		console.log(columns)
		let newGridStyle = ''
		{
			columns.map(({ column_id, column_name, classes }) => {
				newGridStyle = newGridStyle + 'auto ';
			})
		}
		console.log('...Grid Style is - ' + newGridStyle)
		return newGridStyle
	}


	// Set Table Name
	const updateTableName = (e) => {
		//		setTableName(e)
	}

	// Process changes to the number of columns
	const defineColumns = (num_columns) => {
		// console.log('Init Columns')
		setNumColumns(Number(num_columns))
		initTableCells(Number(num_columns), Number(numRows))
		//		initGridStyle(Number(num_columns))
		//		console.log(JSON.stringify(dynamicStyles, null, 4))
	}

	// Process changes to the number of rows
	const defineRows = (num_rows) => {
		// console.log('Init Rows')
		setNumRows(Number(num_rows))
		initTableCells(numColumns, num_rows)
	}

	function debugSetGridCells(cell) {
		console.log('Event Value - ' + JSON.stringify(cell, null, 4))
		let transformedCell = {
			cellRow: cell[0],
			cellColumn: cell[1],
			cellId: cell[2],
			componentClass: cell[3],
			cellValue: cell[4]
		}

		console.log('Transformed cell - ' + JSON.stringify(transformedCell, null, 4))
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

	function logEvent(e) {
		console.log('EVENT...')
		console.log(e)
		//console.log(JSON.stringify(event, null, 4))
	}

	useEffect(() => {
		setRender(render + 1)
		console.log('RENDER - ' + render)

	}, [table])

	//console.log(JSON.stringify(gridCells, null, 4))
	// console.log('MATCH VALUE FOR TABLE - ' + JSON.stringify(table, null, 4))
	console.log('MATCH VALUE FOR TABLE:')
	console.log(table)

	if (JSON.stringify(table.table) !== '{}') {
		//if (table !== null) {
		//		console.log('Ready to render - Table value - ' + JSON.stringify(table, null, 4))
		const gridStyle = processColumns(table.columns)
		// console.log('Ready to render - Table value - ' + JSON.stringify(table[0], null, 4))


		return (
			<div {...blockProps} >

				<InspectorControls>
					<Panel header="Table Definition head">
						<PanelBody title="Table Definition" initialOpen={true}>
							<PanelRow>
								<TextControl label="Table Name" value={table.table_name} onChange={(e) => updateTableName(e)} />
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

				<div> Temporary Table Save to Database
					<button onClick={e => prepareSaveTable(table.table_id, table)}>Save</button>
				</div>
				<div>{table.table_name}</div>
				<TabbableContainer>
					<div className="grid-control" style={{ "--gridTemplateColumns": gridStyle }}>

						{table.cells.map(({ row_id, column_id, classes, content }) => {
							// {gridCells.map(({ cellRow, cellColumn, cellId, componentClass, cellValue }) => {
							return (
								<RichText
									className={classes}
									tabIndex="0"
									tagName="div"
									id={numberToLetter(column_id) + row_id}
									//allowedFormats={['core/bold', 'core/italic']}
									//onChange={cellContent => setGridCells([col, row, cellId, componentClass, cellContent])}
									onChange={e => setTableAttributes('cell', numberToLetter(column_id) + row_id, 'CONTENT', e)}
									value={content}>
								</RichText>
							);
						})}
					</div>
				</TabbableContainer>
			</div >)
	}
	// console.log('Log from Spinner')
	return (
		<div>
			<Spinner></Spinner>
		</div>
	)
}