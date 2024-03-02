/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { useSelect, useDispatch, dispatch } from "@wordpress/data";
import { useState, useEffect, useRef } from "@wordpress/element"
import { __ } from '@wordpress/i18n';
import {
	ForwardedRef
} from 'react';
import {
	Panel,
	PanelBody,
	PanelRow,
	TabbableContainer,
	Button,
	TextControl,
	Spinner,
	Placeholder,
	ToggleControl,
	CheckboxControl,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalNumberControl as NumberControl
} from '@wordpress/components';
import {
	RichText,
	BlockIcon,
	AlignmentToolbar,
	InspectorControls,
	BlockControls,
	useBlockProps
} from '@wordpress/block-editor';
import {
	column,
	// alignLeft,
	// alignRight,
	// alignCenter,
	blockTable as icon
	// tableColumnAfter,
	// tableColumnBefore,
	// tableColumnDelete,
	// tableRowAfter,
	// tableRowBefore,
	// tableRowDelete,
	// table,
	// moreVertical,
	// more,
	// arrowLeft,
	// arrowRight,
	// arrowUp,
	// arrowDown,
	// trash
} from '@wordpress/icons';


/**
 *  * Internal Dependencies
 */
import { store as tableStore } from './data';
import {
	numberToLetter,
	generateBlockTableRef,
	getDefaultRow,
	getDefaultColumn,
	getDefaultCell,
	getDefaultTableClasses,
	getDefaultTableAttributes
} from './utils';
import { ColumnMenu } from './components';
// import TABLE_ATTRIBUTE_TYPES from './constants'
import './editor.scss';

export default function Edit(props) {

	/**
	 * Table Store Action useDispatch declarations
	 */
	const { receiveNewTable } = useDispatch(tableStore);
	const { createTableEntity } = useDispatch(tableStore);
	const { addColumn } = useDispatch(tableStore);
	const { addRow } = useDispatch(tableStore);
	const { removeColumn } = useDispatch(tableStore);
	const { removeRow } = useDispatch(tableStore);
	const { updateTableProp } = useDispatch(tableStore);
	const { updateRow } = useDispatch(tableStore);
	const { updateColumn } = useDispatch(tableStore);
	const { updateCell } = useDispatch(tableStore);
	const { updateTableEntity } = useDispatch(tableStore);
	const { updateTableBorder } = useDispatch(tableStore);

	/**
	 * Local State declarations
	 */
	const [isTableStale, setTableStale] = useState(true);
	const [openColumnRow, setOpenColumnRow] = useState(0)
	const [columnAttributes, setColumnAttributes] = useState({})
	const [columnMenuVisible, setColumnMenuVisible] = useState(false)
	const [rowMenuVisible, setRowMenuVisible] = useState(false)
	const [openRowColumn, setOpenRowColumn] = useState(0)
	const [rowAttributes, setRowAttributes] = useState({})
	const [render, setRender] = useState(0);
	const [showBorders, setShowBorders] = useState(false);
	const [numColumns, setNumColumns] = useState(2);
	const [numRows, setNumRows] = useState(2);
	const [gridCells, setGridCells] = useState([])

	const priorTableRef = useRef({})
	const { table_id, block_table_ref } = props.attributes;

	useEffect(() => {
		dispatch('core').addEntities([
			{
				name: 'table',
				kind: 'dynamic-tables/v1',
				baseURL: '/dynamic-tables/v1/table'
			}
		]);
	}, []);

	console.log('Block Table Ref - ' + block_table_ref)

	function setTableStatus() {
		if (block_table_ref === '') {
			return 'None'
		}

		if (table_id === '0') {
			return 'New'
		}

		// if (isTableStale) {
		// 	return 'Stale'
		// }

		return 'Saved'
	}

	function setNewBlock() {
		if (block_table_ref === '') {
			return true
		}
		return false
	}

	function setIsTableResolving(table) {
		console.log('Table Resolving Status - ' + JSON.stringify(table))
		if (table.table_id === undefined) {
			return true
		}
		return false
	}

	const isNewBlock = setNewBlock()
	const tableStatus = setTableStatus();

	const {
		table,
		tableHasStartedResolving,
		tableHasFinishedResolving,
		tableIsResolving
	} = useSelect((select) => {
		console.log('Table Status = ' + tableStatus)

		if (tableStatus == 'None') {
			return {
				table: {}
			};
		}

		console.log('Block Table ID = ' + table_id)
		console.log('Table Status = ' + tableStatus)

		let returnedTable = (select(tableStore).getTable(table_id, tableStatus))
		console.log(returnedTable)
		if (returnedTable === false) {
			console.log('Fallback to existing Table')
			console.log(priorTableRef.current)
			returnedTable = priorTableRef.current
		}
		priorTableRef.current = returnedTable
		console.log(priorTableRef)

		return {
			table: returnedTable,
			tableHasStartedResolving: select(tableStore).hasStartedResolution('getTable', table_id, tableStatus),
			tableHasFinishedResolving: select(tableStore).hasFinishedResolution('getTable', table_id, tableStatus),
			tableIsResolving: select(tableStore).isResolving('getTable', table_id, tableStatus)
		}
	})

	const blockProps = useBlockProps({
		className: "dynamic-table-edit-block",
		table
	})

	console.log('BLOCK PROPS')
	console.log(blockProps)
	console.log(props)
	console.log(table)

	// console.log('Has Table Started Resolving? - ' + tableHasStartedResolving)
	// console.log('Has Table Finished  Resolving? - ' + tableHasFinishedResolving)
	// console.log('Is Table Resolving? - ' + tableIsResolving)


	useEffect(() => {
		if (table.table_id != + '0' && tableStatus === 'New') {
			props.setAttributes({ table_id: table.table_id });
		}
	},
		[table.table_id, tableStatus]
	)

	const testTable = (JSON.stringify(table) === '{}' || tableStatus == 'None') ? 0 : table.columns
	console.log(testTable);
	const tableColumnLength = (JSON.stringify(table) === '{}' || tableStatus == 'None') ? 0 : table.columns.length
	const tableRowLength = (JSON.stringify(table) === '{}' || tableStatus == 'None') ? 0 : table.rows.length

	// console.log(table.columns.length + ' - ' + table.rows.length)
	// useEffect(() => {
	// 	if (tableColumnLength != numColumns) {
	// 		setNumColumns(tableColumnLength);
	// 	}
	// 	if (tableRowLength != numRows) {
	// 		setNumRows(tableRowLength);
	// 	}
	// },
	// 	[tableColumnLength, tableRowLength]
	// )

	console.log('Table ID from Block - ' + table_id);
	console.log('Block Table Ref from Block - ' + block_table_ref);

	function insertColumn(tableId, columnId) {
		const newColumn = getDefaultColumn(tableId, columnId)
		var tableCells = []

		for (let i = 1; i < numRows; i++) {
			console.log('Creating column row = ' + i)
			if (i === 0) {
				let cell = getDefaultCell(tableId, columnId, i, 'Border')
				tableCells.push(cell)
			} else {
				let cell = getDefaultCell(tableId, columnId, i)
				tableCells.push(cell)
			}
		}

		console.log('ADDING COLUMN')
		console.log('ColumnId = ' + columnId)
		console.log(newColumn)
		console.log(tableCells)

		addColumn(columnId, newColumn, tableCells)

		console.log('Update coreStore');
		// setTableStale(false)
		return (updateTableEntity(tableId));
	}

	function deleteColumn(tableId, columnId) {
		console.log('Deleting Column - ' + columnId)
		removeColumn(columnId)

		console.log('Update coreStore');
		// setTableStale(false)
		return (updateTableEntity(tableId));
	}

	/**
	 * 
	 * @param {*} tableId 
	 * @param {*} attribute 
	 * @param {*} id 
	 * @param {*} type 
	 * @param {*} value 
	 * @returns 
	 * 
	 * Valid Types:
	 * - CONTENT - Cell Content
	 * - ATTRIBUTES - Array of attributes
	 * - CLASSES - Array of Classes
	 * - PROP - Table Property
	 */

	function setTableAttributes(tableId, attribute, id, type, value) {

		console.log('Table Attribute Change: attribute - ' + attribute + ', id - ' + id + ', type - ' + type + ', value - ' + value)
		let updatedTable;

		switch (type) {
			case 'CONTENT':
				{
					if (attribute === 'cell') {
						updateCell(id, 'content', value)
					}
					break;
				}
			case 'ATTRIBUTES':
				{
					if (attribute === 'cell') {
						console.log('...Updating Cell')
						updateCell(id, 'attributes', value)
					} else if (attribute === 'column') {
						console.log('...Updating Column')
						console.log(value)
						setColumnAttributes(value)
						updateColumn(id, 'attributes', value)
					}
					break;
				}
			case 'CLASSES':
				{
					if (attribute === 'cell') {
						updateCell(id, 'classes', value)
					} else if (attribute === 'column') {
						updateColumn(id, 'classes', value)
					}
					break;
				}
			case 'PROP':
				{
					if (attribute === 'table_name') {
						updateTableProp('table_name', value)
					}
					break;
				}
			default:
				console.log('Unrecognized Attibute Type')
		}
		console.log('Update coreStore');
		// setTableStale(false)
		// console.log(updatedTable);
		return (updateTableEntity(tableId));
	}

	function onToggleBorders(isChecked) {

		console.log('TOGGLING BORDER')
		console.log(table);
		console.log('Number Columns before update = ' + numColumns)

		if (isChecked === false) {
			setNumColumns(numColumns - 1)
			setNumRows(numRows - 1)

			var updatedRows = table.rows
				.filter((row) =>
					row.row_id !== '0'
				)

			var updatedColumns = table.columns
				.filter((column) =>
					column.column_id !== '0'
				)

			var updatedCells = table.cells
				.filter((cell) =>
					cell.row_id !== '0' && cell.column_id !== '0'
				)

			console.log(updatedCells)
			updateTableBorder(updatedRows, updatedColumns, updatedCells)


		} else {
			setNumColumns(numColumns + 1)
			setNumRows(numRows + 1)

			var rowBorder = [{
				table_id: String(table_id),
				row_id: '0',
				row_name: 'Border',
				attributes: '',
				classes: ''
			}]

			var rowCells = []
			// var cellAttributes = []

			let cellAttributes = {
				border: "true"
			}

			console.log('Number Columns = ' + numColumns)
			for (let i = 0; i <= numColumns; i++) {
				let columnLetter = numberToLetter(i)
				console.log('Creating Border Column - ' + columnLetter)

				let cell = {
					table_id: String(table_id),
					column_id: String(i),
					row_id: '0',
					cell_id: columnLetter + '0',
					attributes: cellAttributes,
					classes: 'border hover',
					content: columnLetter
				}
				rowCells.push(cell);
			}

			const borderColumnAttributes = {
				columnWidthType: 'Fixed',
				minWidth: 0,
				minWidthUnits: '',
				maxWidth: 0,
				maxWidthUnits: '',
				fixedWidth: 20,
				fixedWidthUnits: 'px',
				disableForTablet: false,
				disableForPhone: false,
				isFixedLeftColumnGroup: false,
				horizontalAlignment: 'center'
			}

			var columnBorder = [{
				table_id: String(table_id),
				column_id: '0',
				column_name: 'Border',
				attributes: borderColumnAttributes,
				classes: ''
			}]

			var columnCells = []

			for (let i = 1; i <= numRows; i++) {

				let cell = {
					table_id: String(table_id),
					column_id: '0',
					row_id: String(i),
					cell_id: '0' + String(i),
					attributes: cellAttributes,
					classes: 'border hover',
					content: String(i)
				}
				columnCells.push(cell);
			}

			var updatedRows = [...table.rows, ...rowBorder]
			updatedRows.sort((a, b) => {
				if ([a.row_id] < [b.row_id]) {
					return -1
				} else {
					return 1
				}
			})

			var updatedColumns = [...table.columns, ...columnBorder]
			updatedColumns.sort((a, b) => {
				if ([a.column_id] < [b.column_id]) {
					return -1
				} else {
					return 1
				}
			})

			var updatedCells = [...table.cells, ...rowCells, ...columnCells]
			updatedCells.sort((a, b) => {
				if ([[a.row_id], [a.column_id]] < [[b.row_id], [b.column_id]]) {
					return -1
				} else {
					return 1
				}
			})

			console.log('Row border - ' + JSON.stringify(rowBorder, null, 4));
			console.log('Column border - ' + JSON.stringify(columnBorder, null, 4));
			console.log('Updated columns - ' + JSON.stringify(updatedColumns, null, 4));
			console.log('Updated cells - ' + JSON.stringify(updatedCells, null, 4));

			updateTableBorder(updatedRows, updatedColumns, updatedCells)
		}

		setShowBorders(isChecked);
		// setTableStale(false)
		return;
	}

	function processColumns(isNewBlock, isTableResolving, columns) {
		if (isNewBlock || isTableResolving) {
			return undefined
		}

		let newGridColumnStyle = ''
		{
			columns.map(({ column_id, column_name, attributes, classes }) => {
				console.log('Column ID - ' + newGridColumnStyle)
				console.log(attributes)
				const { columnWidthType,
					minWidth,
					minWidthUnits,
					maxWidth,
					maxWidthUnits,
					fixedWidth,
					fixedWidthUnits,
					disableForTablet,
					disableForPhone,
					isFixedLeftColumnGroup,
					horizontalAlignment
				} = attributes;

				let sizing = '';

				switch (columnWidthType) {
					case 'Proportional':
						{
							if (minWidth > 0) {
								sizing = 'minmax(' + minWidth + minWidthUnits + ', ' + maxWidth + 'fr) '
							} else (
								// sizing = '1fr '
								sizing = maxWidth + 'fr '
							)
							newGridColumnStyle = newGridColumnStyle + sizing;
							break;
						}
					case 'Auto':
						{
							newGridColumnStyle = newGridColumnStyle + 'auto ';
							break;
						}
					case 'Fixed':
						{
							newGridColumnStyle = newGridColumnStyle + fixedWidth + fixedWidthUnits + ' ';
							break;
						}
					case 'Custom':
						{
							sizing = 'minmax(' + minWidth + minWidthUnits + ', ' + maxWidth + maxWidthUnits + ') '
							newGridColumnStyle = newGridColumnStyle + sizing;
							break;
						}
					default:
						console.log('Unrecognized Attibute Type')
				}

				// if (column_id === '0') {
				// 	newGridColumnStyle = newGridColumnStyle + '20px ';
				// } else {
				// 	newGridColumnStyle = newGridColumnStyle + 'auto ';
				// }
			})
		}
		console.log('grid-template-columns = ' + newGridColumnStyle)
		// setTableStale(false)
		return newGridColumnStyle
	}

	function processRows(isNewBlock, isTableResolving, rows) {
		if (isNewBlock || isTableResolving) {
			return undefined
		}

		let newGridRowStyle = ''
		{
			rows.map(({ row_id, attributes, classes }) => {
				console.log('Row ID - ' + newGridRowStyle)
				if (row_id === '0') {
					newGridRowStyle = newGridRowStyle + '25px ';
				} else {
					newGridRowStyle = newGridRowStyle + 'auto ';
				}
			})
		}
		// setTableStale(false)
		return newGridRowStyle
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
						table_id: '0',
						column_id: String(x),
						row_id: String(y),
						cell_id: columnLetter + y,
						attributes: getDefaultTableAttributes('cells'),
						classes: getDefaultTableClasses('cells'),
						content: 'Cell' + columnLetter + y
					}
					tableCells.push(cell)
				} else {
					let cell = {
						table_id: '0',
						column_id: String(x),
						row_id: String(y),
						cell_id: columnLetter + y,
						attributes: getDefaultTableAttributes('cells'),
						classes: getDefaultTableClasses('cells'),
						content: 'Cell' + columnLetter + y
					}
					tableCells.push(cell)
				}
				x++
			}
			var x = 1
			y++
		}

		// setGridCells(tableCells)
		// console.log('CREATE TABLE - cells...')
		// console.log(JSON.stringify(tableCells, null, 4))
		return tableCells;
	}

	function createTable(columnCount, rowCount) {

		console.log('FUNCTION - CREATE TABLE')
		console.log('InitialRows - ' + rowCount)
		console.log('InitialColumns - ' + columnCount)

		// let tableCells
		var newBlockTableRef = generateBlockTableRef()
		var tableCells = initTableCells(Number(columnCount), Number(rowCount))

		var rowArray = [];

		for (let i = 1; i <= rowCount; i++) {
			console.log('Row loop - ' + i)
			let row = {
				table_id: '0',
				row_id: i,
				attributes: getDefaultTableAttributes('rows'),
				classes: getDefaultTableClasses('rows')
			}
			// console.log('...looped row - ' + JSON.stringify(row, null, 4))
			rowArray.push(row)
			// console.log('...row array - ' + JSON.stringify(rowArray, null, 4))
		}

		var columnArray = [];

		for (let i = 1; i <= columnCount; i++) {
			console.log('Column loop - ' + i)
			let column = {
				table_id: '0',
				column_id: i,
				column_name: 'Comments',
				attributes: getDefaultTableAttributes('columns'),
				classes: getDefaultTableClasses('columns')
			}
			// console.log('...looped column - ' + JSON.stringify(column, null, 4))
			columnArray.push(column)
			// console.log('...column array - ' + JSON.stringify(columnArray, null, 4))
		}

		const newTable = {
			table: {
				table_id: '0',
				block_table_ref: newBlockTableRef,
				post_id: 0,
				table_name: 'Test Table',
				table_classes: getDefaultTableClasses('table'),
				rows: rowArray,
				columns: columnArray,
				cells: tableCells
			}
		}

		console.log(JSON.stringify(newTable, null, 4));
		receiveNewTable(newTable)
		props.setAttributes({ block_table_ref: newBlockTableRef })
		createTableEntity('0');
		console.log('new table id - ' + table.table_id)
		//		setTableStatus('New');
	}

	function onCreateTable(event) {
		event.preventDefault();
		createTable(numColumns, numRows)

		// setHasTableCreated(true);
	}

	function onChangeInitialColumnCount(num_columns) {
		console.log(num_columns)
		setNumColumns(num_columns)
	}

	function onChangeInitialRowCount(num_rows) {
		console.log(num_rows)
		setNumRows(num_rows)
	}

	function onUpdateColumn(event, updateType, tableId, columnId, updatedColumnAttributes) {
		console.log('    ...onUpdateColumn');
		console.log(event);
		console.log(updatedColumnAttributes);

		switch (updateType) {
			case 'attributes':
				{
					setTableAttributes(tableId, 'column', columnId, 'ATTRIBUTES', updatedColumnAttributes);
					break;
				}
			case 'insert':
				{
					onToggleBorders(false)
					setOpenColumnRow(0);
					setColumnMenuVisible(false);
					insertColumn(tableId, columnId);
					// onToggleBorders(true)
					break;

				}
			case 'delete':
				{
					onToggleBorders(false)
					setOpenColumnRow(0);
					setColumnMenuVisible(false);
					deleteColumn(tableId, columnId);
					// onToggleBorders(true)
					break;
				}
			default:
				console.log('Unrecognized Column Update Type')
		}
		setShowBorders(false);
		console.log('Show Borders = ' + showBorders)

	}

	function onMouseColumnClick(column_id, row_id, table, event) {

		console.log('MOUSE CLICKED IN BORDER')
		console.log('Column = ' + column_id)
		console.log('Row = ' + row_id)
		console.log(table)
		console.log(event)

		if (row_id === '0' && column_id !== '0') {
			console.log('Opening Column ' + column_id)
			let compareColumnId = column_id
			const clickedColumn = table.columns.find(({ column_id }) => column_id === compareColumnId)
			console.log(clickedColumn)
			setColumnAttributes(clickedColumn.attributes)
			setColumnMenuVisible(true)
			setOpenColumnRow(column_id)
		}

		if (row_id !== '0' && column_id === '0') {
			console.log('Opening Row ' + row_id)
			let compareRowId = row_id
			const clickedRow = table.columns.find(({ row_id }) => row_id === compareRowId)
			setRowAttributes(clickedRow.attributes)
			setRowMenuVisible(true)
			setOpenColumnRow(row_id)
		}
		// alert('Mouse clicked on column')
		// return <ColumnMenu>Column Menu</ColumnMenu>
		// setTableStale(false)

	}

	const isTableResolving = setIsTableResolving(table)

	// const gridStyle = 

	const gridColumnStyle = processColumns(isNewBlock, isTableResolving, table.columns)
	const gridRowStyle = processRows(isNewBlock, isTableResolving, table.rows)


	console.log('Grid Column Style = ' + gridColumnStyle)
	// const gridStyle = setGridStyle(isNewBlock, isTableResolving, table)

	console.log('MATCH VALUE FOR TABLE:')
	console.log(table)
	// console.log(isRetrievingTable(table))
	console.log(JSON.stringify(table))
	console.log('Is Block New - ' + isNewBlock)
	console.log('Table Status - ' + tableStatus);
	console.log('Is Table Resolving - ' + isTableResolving);
	console.log('gridColumnStyle = ' + gridColumnStyle);
	console.log('gridRowStyle = ' + gridRowStyle);

	const postBlocks = wp.data.select('core/block-editor')
		.getBlocks();
	console.log(postBlocks)

	return (
		<div {...blockProps} >

			<div>{table.table_name}</div>
			<p>Table Block Information</p>
			<ul>
				<li>Table = {table.table_id}</li>
				<li>Table Attrib = {table_id}</li>
				<li>Table Block Ref Attrib = {block_table_ref}</li>,
				{console.log(blockProps)}
				<li>Block Props = {blockProps.id}</li>
			</ul>

			{!isNewBlock && !isTableResolving && (
				<>
					<InspectorControls>
						<Panel header="Table Definition head">
							<PanelBody title="Table Definition" initialOpen={true}>
								<PanelRow>
									<TextControl label="Table Name"
										value={table.table_name}
										onChange={e => setTableAttributes(table_id, 'table_name', '', 'PROP', e)} />
								</PanelRow>

								<PanelRow>
									<CheckboxControl label="Show table borders"
										checked={showBorders}
									// onChange={(e) => onToggleBorders(e)}
									/>
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

					<TabbableContainer>
						<div className="grid-control" style={{ "--gridTemplateColumns": gridColumnStyle, "--gridTemplateRows": gridRowStyle }}>

							{table.cells.map(({ table_id, row_id, column_id, cell_id, content, attributes, classes }) => {
								const isBorder = attributes.border;

								function setBorderContent(row, column, content) {
									if (row === '0' && column === '0') {
										return ''
									} else {
										return content
									}
								}

								function openCurrentColumnMenu(columnMenuVisible, openColumnRow, column_id) {
									if (columnMenuVisible && openColumnRow === column_id) {
										return true
									}
									return false
								}

								const borderContent = setBorderContent(row_id, column_id, content)
								const isOpenCurrentColumnMenu = openCurrentColumnMenu(columnMenuVisible, openColumnRow, column_id)

								console.log('...Rendering - ' + cell_id)
								console.log('Column Menu Visible = ' + columnMenuVisible)
								console.log('Open Column = ' + openColumnRow)
								console.log('Open Current Column Menu = ' + isOpenCurrentColumnMenu)

								return (
									<>
										{isBorder && (
											<div
												id={cell_id}
												// onMouseDown={e => onMouseColumnClick(column_id, row_id, table, e)}
												className={classes}>
												{borderContent}
											</div>
										)}
										{!isBorder && (
											<RichText
												id={cell_id}
												className={"grid-cell " + classes}
												tabIndex="0"
												tagName="div"
												//allowedFormats={['core/bold', 'core/italic']}
												//onChange={cellContent => setGridCells([col, row, cellId, componentClass, cellContent])}
												onChange={e => setTableAttributes(table_id, 'cell', cell_id, 'CONTENT', e)}
												value={content}>
											</RichText>
										)}
									</>
								)
							})}
						</div>
					</TabbableContainer>
				</>
			)}

			{!isNewBlock && isTableResolving && (
				<Spinner>Retrieving Table Data</Spinner>
			)}


			{isNewBlock && (
				<Placeholder
					label={__('Dynamic Table')}
					icon={<BlockIcon icon={icon} showColors />}
					instructions={__('Create a new dynamic table.')}
				>
					<form
						className="blocks-table__placeholder-form"
						onSubmit={onCreateTable}
					>

						<NumberControl
							__nextHasNoMarginBottom
							label={__('Table Columns')}
							onChange={e => onChangeInitialColumnCount(e)}
							value={numColumns}
							className="blocks-table__placeholder-input"
						/>

						<NumberControl
							__nextHasNoMarginBottom
							label={__('Table Rows')}
							onChange={e => onChangeInitialRowCount(e)}
							value={numRows}
							className="blocks-table__placeholder-input"
						/>
						<Button
							className="blocks-table__placeholder-button"
							variant="primary"
							type="submit"
						>
							{__('Create Table')}
						</Button>
					</form>
				</Placeholder>
			)}

		</div>
	)
}