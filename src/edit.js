/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { useSelect, useDispatch, dispatch } from "@wordpress/data";
import { useState, useEffect, useRef } from "@wordpress/element"
import { usePrevious } from "@wordpress/compose";
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
	ColorPicker,
	ToggleControl,
	CheckboxControl,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalNumberControl as NumberControl
} from '@wordpress/components';
import {
	RichText,
	useBlockProps,
	BlockIcon,
	AlignmentToolbar,
	InspectorControls,
	BlockControls
} from '@wordpress/block-editor';
import {
	column,
	// alignLeft,
	// alignRight,
	// alignCenter,
	search,
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
import { usePostChangesSaved } from './hooks';
import {
	numberToLetter,
	generateBlockTableRef,
	initTable,
	initTableCells,
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

	const blockProps = useBlockProps({
		className: "dynamic-table-edit-block"
	})

	/**
	 * Table Store Action useDispatch declarations
	 */
	const { receiveNewTable } = useDispatch(tableStore);
	const { createTableEntity } = useDispatch(tableStore);
	const { deleteTable } = useDispatch(tableStore);
	const { addColumn } = useDispatch(tableStore);
	const { addRow } = useDispatch(tableStore);
	const { removeColumn } = useDispatch(tableStore);
	const { removeRow } = useDispatch(tableStore);
	const { updateTableProp } = useDispatch(tableStore);
	const { removeTableProp } = useDispatch(tableStore);
	const { updateRow } = useDispatch(tableStore);
	const { updateColumn } = useDispatch(tableStore);
	const { updateCell } = useDispatch(tableStore);
	const { updateTableEntity } = useDispatch(tableStore);
	const { updateTableBorder } = useDispatch(tableStore);
	const { processUnmountedTables } = useDispatch(tableStore);
	const { processDeletedTables } = useDispatch(tableStore);

	/**
	 * Local State declarations
	 */
	const [isTableStale, setTableStale] = useState(true);
	const [openColumnRow, setOpenColumnRow] = useState(0);
	const [tablePropAttributes, setTablePropAttributes] = useState({});
	const [columnAttributes, setColumnAttributes] = useState({});
	const [columnMenuVisible, setColumnMenuVisible] = useState(false);
	const [rowMenuVisible, setRowMenuVisible] = useState(false);
	const [openRowColumn, setOpenRowColumn] = useState(0);
	const [rowAttributes, setRowAttributes] = useState({});
	const [render, setRender] = useState(0);
	const [showBorders, setShowBorders] = useState(false);
	const [numColumns, setNumColumns] = useState(2);
	const [numRows, setNumRows] = useState(2);
	const [gridCells, setGridCells] = useState([]);
	const [awaitingTableEntityCreation, setAwaitingTableEntityCreation] = useState(false);

	const priorTableRef = useRef({});
	const { table_id, block_table_ref } = props.attributes;

	console.log('Block Table Ref - ' + block_table_ref)

	/**
	 * Load entity framework for table entity type
	 */
	useEffect(() => {
		dispatch('core').addEntities([
			{
				name: 'table',
				kind: 'dynamic-tables/v1',
				baseURL: '/dynamic-tables/v1/table'
			}
		]);
	}, []);

	/**
	 * Table blocks unmounted when entering the text editor AND when deleted.  However, 
	 * don't know whether the table was deleted when an unmount is detected.  Therefore, 
	 * we mark them as unmounted at that time, and can identify whether the block was 
	 * truly deleted on the subsequent render.
	 * 
	 * We mark tables as deleted if they do not identify that the block has been remounted 
	 */
	const { unmountedTables } = useSelect(
		(select) => {
			const { getUnmountedTables } = select(tableStore);
			return {
				unmountedTables: getUnmountedTables()
			}
		})

	if (Object.keys(unmountedTables).length > 0) {
		processUnmountedTables(unmountedTables)
	}

	const { deletedTables } = useSelect(
		(select) => {
			const { getDeletedTables } = select(tableStore);
			return {
				deletedTables: getDeletedTables()
			}
		})

	const postChangesAreSaved = usePostChangesSaved()
	console.log(postChangesAreSaved)
	console.log(unmountedTables)
	useEffect(() => {
		if (postChangesAreSaved) {
			alert('Sync REST Now')
			/**
			 * Remove deleted tables from persisted store
			 */
			if (Object.keys(deletedTables).length > 0) {
				console.log(deletedTables)
				processDeletedTables(deletedTables)
			}

			/**
			 * Update status of new tables to saved
			 */
			if (table.table_status == 'new') {
				console.log('Saving new table - ' + table.table_id)
				setTableAttributes(table.table_id, 'table_status', '', 'PROP', 'saved')
				console.log(table)
			}

		}

	}, [postChangesAreSaved, unmountedTables]);

	const setBlockTableStatus = () => {
		if (block_table_ref === '') {
			return 'None'
		}

		if (table_id === '0') {
			return 'New'
		}

		if (isTableStale) {
			return 'Stale'
		}

		return 'Saved'
	}

	const setNewBlock = () => {
		if (block_table_ref === '') {
			return true
		}
		return false
	}

	const isNewBlock = setNewBlock()
	const blockTableStatus = setBlockTableStatus();

	/**
	 * Retrieve table entity from table webservice and load table store
	 */
	const {
		table,
		tableStatus,
		tableHasStartedResolving,
		tableHasFinishedResolving,
		tableIsResolving
	} = useSelect(
		(select) => {
			console.log('Table ID = ' + table_id + ', Stale = ' + isTableStale + ', Block Table Ref = ' + block_table_ref);
			const { getTable, getNewTableIdByBlock, hasStartedResolution, hasFinishedResolution, isResolving } = select(tableStore);
			const selectorArgs = [table_id, isTableStale]

			if (block_table_ref === '') {
				return {
					table: {},
					tableStatus: '',
					tableHasStartedResolving: false,
					tableHasFinishedResolving: false,
					tableIsResolving: false
				}
			}
			const getBlockTable = (table_id, isTableStale, block_table_ref) => {
				let selectedTable = getTable(table_id, isTableStale);
				console.log(selectedTable)
				if (table_id === '0' && selectedTable.block_table_ref.length === 0 && awaitingTableEntityCreation) {
					const newTableId = getNewTableIdByBlock(block_table_ref);
					selectedTable = getTable(newTableId, isTableStale);
					setAwaitingTableEntityCreation(false)
					props.setAttributes({ table_id: Number(selectedTable.table_id) })
				}
				return selectedTable;
			};

			const blockTable = getBlockTable(table_id, isTableStale, block_table_ref)
			const tableHasStartedResolving = hasStartedResolution('getTable', selectorArgs)
			const tableHasFinishedResolving = hasFinishedResolution('getTable', selectorArgs)
			const tableIsResolving = isResolving('getTable', selectorArgs)

			if (tableHasFinishedResolving) {
				setTableStale(() => false)
			}

			// console.log('isTableStale = ' + isTableStale)
			// console.log('tableHasStartedResolving = ' + hasStartedResolution('getTable', selectorArgs))
			// console.log('tableHasFinishedResolving = ' + hasFinishedResolution('getTable', selectorArgs))
			// console.log('tableIsResolving = ' + isResolving('getTable', selectorArgs))

			return {
				table: blockTable,
				tableStatus: blockTable.table_status,
				tableHasStartedResolving: tableHasStartedResolving,
				tableHasFinishedResolving: tableHasFinishedResolving,
				tableIsResolving: tableIsResolving
			};
		},
		[
			table_id,
			isTableStale,
			block_table_ref
		]
	);

	function getTablePropAttribute(tableAttributes, attributeName) {
		const attributeValue = tableAttributes?.[attributeName]
		return attributeValue
	}

	const showGridLines = getTablePropAttribute(table.table_attributes, 'showGridLines')
	const bandedRows = getTablePropAttribute(table.table_attributes, 'bandedRows')
	const bandedRowColor = getTablePropAttribute(table.table_attributes, 'bandedRowColor')
	const gridLineWidth = getTablePropAttribute(table.table_attributes, 'gridLineWidth')
	const horizontalAlignment = getTablePropAttribute(table.table_attributes, 'horizontalAlignment')
	const verticalAlignment = getTablePropAttribute(table.table_attributes, 'verticalAlignment')

	/**
	 * Perform clean-up for deleted table block at time of deletion
	 */
	useEffect(() => {

		return () => {
			setTableAttributes(table.table_id, 'unmounted_blockid', '', 'PROP', blockProps["data-block"], false)
		};
	}, [])

	const tableColumnLength = (JSON.stringify(table.table) === '{}' || blockTableStatus == 'None') ? 0 : table.columns.length
	const tableRowLength = (JSON.stringify(table.table) === '{}' || blockTableStatus == 'None') ? 0 : table.rows.length

	/**
	 * Set state for number of columns and rows when the number of table rows has changes
	 * 
	 * TODO: Verify this is still needed following update to table store to track all tables in editor
	 */
	useEffect(() => {
		if (tableColumnLength != numColumns) {
			setNumColumns(tableColumnLength);
		}
		if (tableRowLength != numRows) {
			setNumRows(tableRowLength);
		}
	},
		[tableColumnLength, tableRowLength]
	)

	console.log('Table ID from Block - ' + table_id);
	console.log('Block Table Ref from Block - ' + block_table_ref);

	/**
	 * Called upon event to add a column
	 * 
	 * @param {*} tableId 
	 * @param {*} columnId 
	 * @returns 
	 */
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
		setTableStale(false)
		return (updateTableEntity(tableId));
	}

	/**
	 * Called upon event to delete a column
	 * 
	 * @param {*} tableId 
	 * @param {*} columnId 
	 * @returns 
	 */
	function deleteColumn(tableId, columnId) {
		console.log('Deleting Column - ' + columnId)
		removeColumn(columnId)

		console.log('Update coreStore');
		setTableStale(false)
		return (updateTableEntity(tableId));
	}

	/**
	 * Update table store to reflect changes made to EXISTING table attributes
	 * 
	 * 
	 * @param {*} tableId - Id of table to update
	 * @param {*} attribute - Table Object Attribute
	 * @param {*} id - Array Index Id
	 * @param {*} type - See Below
	 * @param {*} value - New attribute value
	 * @param {*} persist - Write update to entity record
	 * @returns 
	 * 
	 * Valid Types:
	 * - CONTENT - Cell Content
	 * - ATTRIBUTES - Array of attributes
	 * - CLASSES - Array of Classes
	 * - PROP - Table Property
	 */

	function setTableAttributes(tableId, attribute, id, type, value, persist = true) {

		console.log('Table Attribute Change: attribute - ' + attribute + ', id - ' + id + ', type - ' + type + ', value - ' + value)
		let updatedTable;

		switch (type) {
			case 'CONTENT':
				{
					if (attribute === 'cell') {
						updateCell(tableId, id, 'content', value)
					}
					break;
				}
			case 'ATTRIBUTES':
				{
					if (attribute === 'cell') {
						console.log('...Updating Cell')
						updateCell(tableId, id, 'attributes', value)
					} else if (attribute === 'column') {
						console.log('...Updating Column')
						console.log(value)
						setColumnAttributes(value)
						updateColumn(tableId, id, 'attributes', value)
					} else if (attribute === 'table') {
						console.log('...Updating Table Attributes')
						console.log(value)
						updateTableProp(tableId, 'table_attributes', value)

					}
					break;
				}
			case 'CLASSES':
				{
					if (attribute === 'cell') {
						updateCell(tableId, id, 'classes', value)
					} else if (attribute === 'column') {
						updateColumn(tableId, id, 'classes', value)
					}
					break;
				}
			case 'PROP':
				{
					updateTableProp(tableId, attribute, value)
					// if (attribute === 'table_name') {
					// 	updateTableProp(tableId, 'table_name', value)
					// }
					break;
				}
			default:
				console.log('Unrecognized Attibute Type')
		}
		console.log('Update coreStore');
		setTableStale(false)
		// console.log(updatedTable);
		if (persist) {
			return (updateTableEntity(tableId));
		}
	}

	/**
	 * Add/remove grid control column and row when table attribute of "Show Grid" is checked
	 * 
	 * @param {*} table 
	 * @param {*} isChecked 
	 * @returns 
	 */
	function onToggleBorders(table, isChecked) {

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
			updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells)


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
					classes: 'grid-control__cells--border hover',
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
					classes: 'grid-control__cells--border hover',
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

			updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells)
		}

		setShowBorders(isChecked);
		setTableStale(false)
		return;
	}

	/**
	 * Establish grid css grid-template-columns based upon attributes associated with columns
	 * 
	 * @param {*} isNewBlock 
	 * @param {*} tableIsResolving 
	 * @param {*} columns 
	 * @returns 
	 */
	function processColumns(isNewBlock, tableIsResolving, columns) {
		if (isNewBlock || tableIsResolving) {
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

				if (column_id === '1') {
					newGridColumnStyle = newGridColumnStyle + '40px '
				}
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

	/**
	 * Establish grid css grid-template-rowss based upon attributes associated with rows
	 * 
	 * @param {*} isNewBlock 
	 * @param {*} tableIsResolving 
	 * @param {*} rows 
	 * @returns 
	 */
	function processRows(isNewBlock, tableIsResolving, rows) {
		if (isNewBlock || tableIsResolving) {
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

	/**
	 * Create Styling Variable for showing inner grid borders/lines
	  * 
	  * @param {*} isNewBlock 
	  * @param {*} tableIsResolving 
	  * @param {*} showGridLines 
	  * @returns 
	  */
	function gridBandedColorStyle(isNewBlock, tableIsResolving, color) {
		if (isNewBlock || tableIsResolving) {
			return undefined;
		};

		return color;
	}


	/**
	 * Create Styling Variable for showing inner grid borders/lines
	  * 
	  * @param {*} isNewBlock 
	  * @param {*} tableIsResolving 
	  * @param {*} showGridLines 
	  * @returns 
	  */
	function gridInnerBorderStyle(isNewBlock, tableIsResolving, showGridLines) {
		if (isNewBlock || tableIsResolving) {
			return undefined;
		};
		console.log('show grid lines = ' + showGridLines)
		if (showGridLines) {
			return 'solid';
		};

		return 'hidden';
	}

	/**
 * Create Styling Variable for inner grid borders/lines width
 * 
 * @param {*} isNewBlock 
 * @param {*} tableIsResolving 
 * @param {*} showGridLines 
 * @returns 
 */
	function gridInnerBorderWidthStyle(isNewBlock, tableIsResolving, showGridLines, gridLineWidth) {
		if (isNewBlock || tableIsResolving) {
			return undefined;
		};

		if (!showGridLines) {
			return '0px';
		};

		return String(gridLineWidth) + 'px';
	}

	function createTable(columnCount, rowCount) {

		console.log('FUNCTION - CREATE TABLE')
		console.log('InitialRows - ' + rowCount)
		console.log('InitialColumns - ' + columnCount)

		var newBlockTableRef = generateBlockTableRef()
		const newTable = initTable(newBlockTableRef, columnCount, rowCount)

		console.log(JSON.stringify(newTable, null, 4));
		props.setAttributes({ block_table_ref: newBlockTableRef })
		receiveNewTable(newTable)
		setAwaitingTableEntityCreation(true)
		createTableEntity();
		//		setBlockTableStatus('New');
	}

	function onCreateTable(event) {
		event.preventDefault();
		createTable(numColumns, numRows)
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
		setTableStale(false)

	}

	/**
	 * Show colored bands on even numbered table rows
	 * 
	 * @param {*} table 
	 * @param {*} isChecked 
	 */
	function onShowBandedRows(table, isChecked) {
		const updatedTableAttributes = {
			...table.table_attributes,
			bandedRows: isChecked
		}
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
 * Show colored bands on even numbered table rows
 * 
 * @param {*} table 
 * @param {*} color 
 */
	function onBandedRowColor(table, color) {
		const updatedTableAttributes = {
			...table.table_attributes,
			bandedRowColor: color
		}
		console.log(updatedTableAttributes)
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	  * Show inner grid lines
	* 
	* @param {*} table 
	* @param {*} isChecked 
	 */
	function onShowGridLines(table, isChecked) {
		const updatedTableAttributes = {
			...table.table_attributes,
			showGridLines: isChecked
		}
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	  * Inner grid line width
	* 
	* @param {*} table 
	* @param {*} gridLineWidth
	 */
	function onGridLineWidth(table, gridLineWidth) {
		const updatedTableAttributes = {
			...table.table_attributes,
			gridLineWidth: Number(gridLineWidth)
		}
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	const gridColumnStyle = processColumns(isNewBlock, tableIsResolving, table.columns)
	const gridRowStyle = processRows(isNewBlock, tableIsResolving, table.rows)
	const gridBandedColor = gridBandedColorStyle(isNewBlock, tableIsResolving, bandedRowColor)
	const gridShowInnerLines = gridInnerBorderStyle(isNewBlock, tableIsResolving, showGridLines)
	const gridInnerLineWidth = gridInnerBorderWidthStyle(isNewBlock, tableIsResolving, showGridLines, gridLineWidth)

	console.log('Grid Column Style = ' + gridColumnStyle)
	// const gridStyle = setGridStyle(isNewBlock, tableIsResolving, table)
	console.log('Banded Grid Color = ' + gridBandedColor)

	console.log('MATCH VALUE FOR TABLE:')
	console.log(table)
	// console.log(isRetrievingTable(table))
	console.log(JSON.stringify(table))
	console.log('Is Block New - ' + isNewBlock)
	console.log('Block Table Status - ' + blockTableStatus);
	console.log('Is Table Resolving - ' + tableIsResolving);
	console.log('gridColumnStyle = ' + gridColumnStyle);
	console.log('gridRowStyle = ' + gridRowStyle);

	if (!tableIsResolving) {
		// console.log(table.table_attributes?.bandedRows)
	}

	return (
		<div {...blockProps} >

			{!isNewBlock && !tableIsResolving && (
				<>
					<InspectorControls>
						<Panel header="Table Definition head">
							<PanelBody title="Table Definition" initialOpen={true}>
								<PanelRow>
									<TextControl label="Table Name"
										value={table.table_name} />
									{/* onChange={e => setTableAttributes(table_id, 'table_name', '', 'PROP', e)} /> */}
								</PanelRow>

								<PanelRow>
									<CheckboxControl label="Show table borders"
										checked={showBorders}
										onChange={(e) => onToggleBorders(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<NumberControl label="Table Columns" value={numColumns} labelPosition="side" onChange={(e) => defineColumns(e)} />
								</PanelRow>

								<PanelRow>
									<NumberControl label="Table Rows" value={numRows} labelPosition="side" onChange={(e) => defineRows(e)} />
								</PanelRow>

							</PanelBody>

							<PanelBody title="Banded Table Rows" initialOpen={false}>
								<PanelRow>
									<CheckboxControl label="Display Banded Rows"
										checked={bandedRows}
										// checked={true}
										onChange={(e) => onShowBandedRows(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<ColorPicker
										color={bandedRowColor}
										enableAlpha={false}
										defaultValue={"#d8dbda"}
										onChange={(e) => onBandedRowColor(table, e)}
									/>
								</PanelRow>
							</PanelBody>

							<PanelBody title="Grid Lines" initialOpen={false}>
								<PanelRow>
									<CheckboxControl label="Display Inner Grid Lines"
										checked={showGridLines}
										// checked={true}
										onChange={(e) => onShowGridLines(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<NumberControl label="Inner Grid Line Width"
										value={gridLineWidth}
										labelPosition="side"
										onChange={(e) => onGridLineWidth(table, e)}
									/>
								</PanelRow>
							</PanelBody>

						</Panel>
					</InspectorControls>

					{/* <div>{table.table_name}</div> */}

					<RichText
						// id={tableName}
						// className={"grid-control__cells " + calculatedClasses + classes}
						tagName="div"
						//allowedFormats={['core/bold', 'core/italic']}
						//onChange={cellContent => setGridCells([col, row, cellId, componentClass, cellContent])}
						onChange={e => setTableAttributes(table_id, 'table_name', '', 'PROP', e)}
						value={table.table_name}>
					</RichText>


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
								const isFirstColumn = column_id === '1' ? true : false;

								let calculatedClasses = ''
								if (bandedRows) {
									if (Number(row_id) % 2 === 0) {
										calculatedClasses = calculatedClasses + 'grid-control__cells--banded-row '
									}
								}

								console.log('...Rendering - ' + cell_id)
								console.log('Calculated Classes = ' + calculatedClasses)
								// console.log('Column Menu Visible = ' + columnMenuVisible)
								// console.log('Show Inner Grid Lines = ' + gridShowInnerLines)
								// console.log('Inner Grid Line Width = ' + gridInnerLineWidth)
								console.log('Open Column = ' + openColumnRow)
								console.log('Open Current Column Menu = ' + isOpenCurrentColumnMenu)

								return (
									<>
										{isFirstColumn && isBorder && (
											<div className={"grid-control__cells--border"} />
										)}

										{isBorder && (
											<div
												id={cell_id}
												onMouseDown={e => onMouseColumnClick(column_id, row_id, table, e)}
												className={classes}>
												{borderContent}
												{isOpenCurrentColumnMenu && (
													<ColumnMenu
														tableId={table_id}
														columnId={column_id}
														columnLabel={borderContent}
														columnAttributes={columnAttributes}
														updatedColumn={onUpdateColumn}>
													</ColumnMenu>
												)}
											</div>
										)}

										{isFirstColumn && !isBorder && (
											<div
												className={"grid-control__cells grid-control__cells--zoom " + calculatedClasses}
												style={{
													"--bandedRowColor": gridBandedColor,
													"--showGridLines": gridShowInnerLines,
													"--gridLineWidth": gridInnerLineWidth
												}}
											>
												<Button
													href="#"
													icon={search}
												/>
											</div>
										)}

										{!isBorder && (
											<RichText
												id={cell_id}
												className={"grid-control__cells " + calculatedClasses + classes}
												style={{
													"--bandedRowColor": gridBandedColor,
													"--showGridLines": gridShowInnerLines,
													"--gridLineWidth": gridInnerLineWidth
												}}
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

			{!isNewBlock && tableIsResolving && (
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