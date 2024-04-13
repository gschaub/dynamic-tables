/**select re
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
	Disabled,
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
	__experimentalBorderBoxControl as BorderBoxControl,
	__experimentalNumberControl as NumberControl
} from '@wordpress/components';
import {
	RichText,
	useBlockProps,
	useSetting,
	BlockIcon,
	AlignmentToolbar,
	AlignmentControl,
	InspectorControls,
	BlockControls,
	BlockAlignmentToolbar,
	PanelColorSettings
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
	tableSort,
	generateBlockTableRef,
	setBorderContent,
	openCurrentColumnMenu,
	openCurrentRowMenu
} from './utils';
import {
	initTable,
	initTableCells,
	getDefaultRow,
	getDefaultColumn,
	getDefaultCell,
	getDefaultTableClasses,
	getDefaultTableAttributes
} from './table-defaults';
import {
	processColumns,
	processRows,
	processTableBodyRows,
	gridBandedRowTextColorStyle,
	gridBandedRowBackgroundColorStyle,
	gridInnerBorderStyle,
	gridInnerBorderWidthStyle,
	startGridBodyRowNbr,
	endGridBodyRowNbr,
	getGridHeaderBackgroundColorStyle,
	getHeaderTextAlignmentStyle,
	getHeaderBorderStyleType,
	getHeaderBorderStyle
} from './style';

import { ColumnMenu, RowMenu } from './components';
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
	const { table_id, block_table_ref, block_alignment } = props.attributes;
	const themeColors = useSetting('color.palette')
	console.log(themeColors)

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

	/**
	 * Extract and unpack table attributes
	 */
	const showGridLines = getTablePropAttribute(table.table_attributes, 'showGridLines')
	const enableHeaderRow = getTablePropAttribute(table.table_attributes, 'enableHeaderRow')
	const headerAlignment = getTablePropAttribute(table.table_attributes, 'headerAlignment')
	const gridHeaderBackgroundColor = getTablePropAttribute(table.table_attributes, 'tableHeaderBackgroundColor')
	const headerRowSticky = getTablePropAttribute(table.table_attributes, 'headerRowSticky')
	const headerBorder = getTablePropAttribute(table.table_attributes, 'headerBorder')
	const bandedRows = getTablePropAttribute(table.table_attributes, 'bandedRows')
	const bandedRowTextColor = getTablePropAttribute(table.table_attributes, 'bandedRowTextColor')
	const bandedRowBackgroundColor = getTablePropAttribute(table.table_attributes, 'bandedRowBackgroundColor')
	const gridLineWidth = getTablePropAttribute(table.table_attributes, 'gridLineWidth')
	const gridAlignment = block_alignment;
	const horizontalAlignment = getTablePropAttribute(table.table_attributes, 'horizontalAlignment')
	const verticalAlignment = getTablePropAttribute(table.table_attributes, 'verticalAlignment')

	console.log(JSON.stringify(headerBorder, null, 4));

	/**
	 * Extract and unpack table classes
	 */



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

		for (let i = 0; i < numRows; i++) {
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

		addColumn(tableId, columnId, newColumn, tableCells)

		console.log('Update coreStore');
		setTableStale(false)
		return (updateTableEntity(tableId));
	}

	/**
	 * Called upon event to add a row
	 * 
	 * @param {*} tableId 
	 * @param {*} rowId 
	 * @returns 
	 */
	function insertRow(tableId, rowId) {
		const newRow = getDefaultRow(tableId, rowId)
		var tableCells = []

		for (let i = 0; i < numColumns; i++) {
			if (i === 0) {
				let cell = getDefaultCell(tableId, i, rowId, 'Border')
				// cell.content = 
				tableCells.push(cell)
			} else {
				let cell = getDefaultCell(tableId, i, rowId)
				tableCells.push(cell)
			}
		}

		console.log('ADDING ROW')
		console.log('RowId = ' + rowId)
		console.log(newRow)
		console.log(tableCells)

		addRow(tableId, rowId, newRow, tableCells)

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
		removeColumn(tableId, columnId)

		console.log('Update coreStore');
		setTableStale(false)
		return (updateTableEntity(tableId));
	}

	/**
	 * Called upon event to delete a row
	 * 
	 * @param {*} tableId 
	 * @param {*} rowId 
	 * @returns 
	 */
	function deleteRow(tableId, rowId) {
		console.log('Deleting Row - ' + rowId)
		removeRow(tableId, rowId)

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
					} else if (attribute === 'row') {
						console.log('...Updating Row')
						console.log(value)
						setRowAttributes(value)
						updateRow(tableId, id, 'attributes', value)
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

		/**
		 * Remove borders if unchecked
		 */
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

			/**
			* Create borders if checked
			*/
			setNumColumns(numColumns + 1)
			setNumRows(numRows + 1)

			// Create header row border at top of table
			var rowBorder = []
			rowBorder.push(getDefaultRow(table_id, 0, 'Border'))

			var rowCells = []
			for (let i = 0; i <= numColumns; i++) {
				let cell = getDefaultCell(table_id, i, 0, 'Border')
				console.log(cell)
				rowCells.push(cell);
			}

			// Create column border down left side of table
			var columnBorder = []
			columnBorder.push(getDefaultColumn(table_id, 0, 'Border'))

			var columnCells = []
			for (let i = 1; i <= numRows; i++) {
				let cell = getDefaultCell(table_id, 0, i, 'Border')
				columnCells.push(cell);
			}

			// Sort table parts
			updatedRows = tableSort('rows', [...table.rows, ...rowBorder])
			updatedColumns = tableSort('columns', [...table.columns, ...columnBorder])
			updatedCells = tableSort('cells', [...table.cells, ...rowCells, ...columnCells])

			// console.log(table)
			// console.log('Row border - ' + JSON.stringify(rowBorder, null, 4));
			// console.log('Column border - ' + JSON.stringify(columnBorder, null, 4));
			// console.log('Updated columns - ' + JSON.stringify(updatedColumns, null, 4));
			// console.log('Updated cells - ' + JSON.stringify(updatedCells, null, 4));

			updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells)
		}

		setShowBorders(isChecked);
		setTableStale(false)
		return;
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
					setOpenColumnRow(0);
					setColumnMenuVisible(false);
					insertColumn(tableId, columnId);
					break;
				}
			case 'delete':
				{
					setOpenColumnRow(0);
					setColumnMenuVisible(false);
					deleteColumn(tableId, columnId);
					break;
				}
			default:
				console.log('Unrecognized Column Update Type')
		}
		console.log('Show Borders = ' + showBorders)
	}

	function onUpdateRow(event, updateType, tableId, rowId, updatedRowAttributes) {
		console.log('    ...onUpdateRow');
		console.log(event);
		console.log(updatedRowAttributes);

		switch (updateType) {
			case 'attributes':
				{
					setTableAttributes(tableId, 'column', rowId, 'ATTRIBUTES', updatedRowAttributes);
					break;
				}
			case 'insert':
				{
					setOpenColumnRow(0);
					setRowMenuVisible(false);
					insertRow(tableId, rowId);
					break;
				}
			case 'delete':
				{
					setOpenColumnRow(0);
					setRowMenuVisible(false);
					deleteRow(tableId, rowId);
					break;
				}
			default:
				console.log('Unrecognized Row Update Type')
		}
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
			const clickedRow = table.rows.find(({ row_id }) => row_id === compareRowId)
			console.log(clickedRow)
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
	function onBandedRowColor(table, type, color) {
		let updatedTableAttributes = ''
		if (type == 'background') {
			updatedTableAttributes = {
				...table.table_attributes,
				bandedRowBackgroundColor: color
			}
			console.log(updatedTableAttributes)
			setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
		}

		if (type == 'text') {
			updatedTableAttributes = {
				...table.table_attributes,
				bandedRowTextColor: color
			}
			console.log(updatedTableAttributes)
			setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
		}
	}

	/**
	* Make first table row the Header
	* 
	* @param {*} table 
	* @param {*} isChecked 
	*/
	function onEnableHeaderRow(table, isChecked) {
		const updatedTableAttributes = {
			...table.table_attributes,
			enableHeaderRow: isChecked,
			headerRowSticky: false
		}
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);

		const updatedRowAttributes = {
			...table.rows.find(x => x.row_id === '1').attributes,
			isHeader: isChecked ? true : false
		}

		console.log(updatedRowAttributes)
		setTableAttributes(table.table_id, 'row', '1', 'ATTRIBUTES', updatedRowAttributes);
	}

	/**
	* Make first table row the Header
	* 
	* @param {*} table 
	* @param {*} alignmentValue 
	*/
	function onAlignHeader(table, alignment) {
		console.log('ON HEADER ALIGNMENT')
		console.log(alignment)
		const updatedTableAttributes = {
			...table.table_attributes,
			headerAlignment: alignment
		}
		console.log(updatedTableAttributes)
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	* Make first table row the Header
	* 
	* @param {*} table 
	* @param {*} isChecked 
	*/
	function onHeaderBorder(table, border) {
		console.log('ON HEADER BORDER')
		console.log(border)

		const updatedTableAttributes = {
			...table.table_attributes,
			headerBorder: border
		}
		console.log(updatedTableAttributes)
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	* Make first table row the Header
	* 
	* @param {*} table 
	* @param {*} isChecked 
	*/
	function onHeaderRowSticky(table, isChecked) {
		const updatedTableAttributes = {
			...table.table_attributes,
			headerRowSticky: isChecked
		}
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
	const gridBodyRowStyle = processTableBodyRows(isNewBlock, tableIsResolving, table.rows)
	const startGridBodyRowNbrStyle = startGridBodyRowNbr(enableHeaderRow, showBorders)
	const endGridBodyRowNbrStyle = endGridBodyRowNbr(startGridBodyRowNbrStyle, numRows, enableHeaderRow, false)

	const gridBandedRowTextColor = gridBandedRowTextColorStyle(isNewBlock, tableIsResolving, bandedRowTextColor)
	const gridBandedRowBackgroundColor = gridBandedRowBackgroundColorStyle(isNewBlock, tableIsResolving, bandedRowBackgroundColor)
	const gridShowInnerLines = gridInnerBorderStyle(isNewBlock, tableIsResolving, showGridLines)
	const gridInnerLineWidth = gridInnerBorderWidthStyle(isNewBlock, tableIsResolving, showGridLines, gridLineWidth)

	const headerRowStickyStyle = headerRowSticky ? 'auto' : 'hidden';
	const headerRowStickyClass = headerRowSticky ? 'grid-control__header--sticky ' : '';
	const gridHeaderBackgroundColorStyle = getGridHeaderBackgroundColorStyle(isNewBlock, tableIsResolving, gridHeaderBackgroundColor, blockProps.style.backgroundColor)
	const headerTextAlignmentStyle = getHeaderTextAlignmentStyle(isNewBlock, tableIsResolving, headerAlignment)
	const headerBorderStyleType = getHeaderBorderStyleType(headerBorder)
	// Top header border
	const headerBorderTopColor = getHeaderBorderStyle(headerBorder, 'top', 'color', headerBorderStyleType);
	const headerBorderTopStyle = getHeaderBorderStyle(headerBorder, 'top', 'style', headerBorderStyleType);
	const headerBorderTopWidth = getHeaderBorderStyle(headerBorder, 'top', 'width', headerBorderStyleType);

	// Top header border
	const headerBorderRightColor = getHeaderBorderStyle(headerBorder, 'right', 'color', headerBorderStyleType);
	const headerBorderRightStyle = getHeaderBorderStyle(headerBorder, 'right', 'style', headerBorderStyleType);
	const headerBorderRightWidth = getHeaderBorderStyle(headerBorder, 'right', 'width', headerBorderStyleType);
	``
	// Top header border
	const headerBorderBottomColor = getHeaderBorderStyle(headerBorder, 'bottom', 'color', headerBorderStyleType);
	const headerBorderBottomStyle = getHeaderBorderStyle(headerBorder, 'bottom', 'style', headerBorderStyleType);
	const headerBorderBottomWidth = getHeaderBorderStyle(headerBorder, 'bottom', 'width', headerBorderStyleType);

	// Top header border
	const headerBorderLeftColor = getHeaderBorderStyle(headerBorder, 'left', 'color', headerBorderStyleType);
	const headerBorderLeftStyle = getHeaderBorderStyle(headerBorder, 'left', 'style', headerBorderStyleType);
	const headerBorderLeftWidth = getHeaderBorderStyle(headerBorder, 'left', 'width', headerBorderStyleType);

	console.log('Grid Column Style = ' + gridColumnStyle)
	// const gridStyle = setGridStyle(isNewBlock, tableIsResolving, table)
	console.log('Banded Grid Text Color = ' + gridBandedRowTextColor)
	console.log('Banded Grid Background Color = ' + gridBandedRowBackgroundColor)

	console.log('MATCH VALUE FOR TABLE:')
	console.log(table)
	// console.log(isRetrievingTable(table))
	console.log(JSON.stringify(table))
	console.log('Is Block New - ' + isNewBlock)
	console.log('Block Table Status - ' + blockTableStatus);
	console.log('Is Table Resolving - ' + tableIsResolving);
	console.log('gridColumnStyle = ' + gridColumnStyle);
	console.log('gridRowStyle = ' + gridRowStyle);
	console.log(blockProps);
	console.log(blockProps.style.backgroundColor);

	if (!tableIsResolving) {
		// console.log(table.table_attributes?.bandedRows)
	}

	return (
		<div {...blockProps} >
			{!isNewBlock && !tableIsResolving && (
				<>
					<BlockControls>
						<BlockAlignmentToolbar
							value={block_alignment}
							onChange={(e) => props.setAttributes({ block_alignment: e })}
						/>
					</BlockControls>

					<InspectorControls>
						<Panel>
							<PanelBody title="Definition" initialOpen={true}>

								<PanelRow>
									<CheckboxControl label="Show table borders"
										checked={showBorders}
										onChange={(e) => onToggleBorders(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<Disabled>
										<NumberControl label="Table Columns" value={numColumns} labelPosition="side" onChange={(e) => defineColumns(e)} />
									</Disabled>
								</PanelRow>

								<PanelRow>
									<Disabled>
										<NumberControl label="Table Rows" value={numRows} labelPosition="side" onChange={(e) => defineRows(e)} />
									</Disabled>
								</PanelRow>

							</PanelBody>

							<PanelBody title="Table Header" initialOpen={true}>
								<PanelRow>
									<CheckboxControl label="First Row as Header?"
										checked={enableHeaderRow}
										// checked={true}
										onChange={(e) => onEnableHeaderRow(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<CheckboxControl label="Freeze Header Row?"
										checked={headerRowSticky}
										// checked={true}
										onChange={(e) => onHeaderRowSticky(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<span className="inspector-controls-menu__header-alignment--middle">
										<AlignmentControl
											id="header-alignment"
											value={headerAlignment}
											onChange={(e) => onAlignHeader(table, e)}
										/>
										<label className="inspector-controls-nemu__label--left-margin"
											for="header-alignment">
											Text Alignment
										</label>
									</span>
								</PanelRow>

								<PanelRow>
									<BorderBoxControl
										label="Borders"
										hideLabelFromVision="false"
										isCompact="true"
										colors={themeColors}
										value={headerBorder}
										onChange={(e) => onHeaderBorder(table, e)}
									/>
								</PanelRow>

							</PanelBody>


						</Panel>
					</InspectorControls>

					<InspectorControls group="styles">
						<PanelBody title="Banded Table Rows" initialOpen={false}>
							<PanelRow>
								<CheckboxControl label="Display Banded Rows"
									checked={bandedRows}
									// checked={true}
									onChange={(e) => onShowBandedRows(table, e)}
								/>
							</PanelRow>
							<PanelColorSettings
								__experimentalIsRenderedInSidebar
								title={'Banded Row Color'}
								colors={themeColors}
								colorSettings={[
									{
										value: bandedRowTextColor,
										onChange: (newColor) => onBandedRowColor(table, 'text', newColor),
										label: 'Text'
									},
									{
										value: bandedRowBackgroundColor,
										onChange: (newColor) => onBandedRowColor(table, 'background', newColor),
										label: 'Background'
									}
								]}
							/>
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
					</InspectorControls>
					<InspectorControls group="typography">
					</InspectorControls>

					<RichText
						id="tableTitle"
						style={{ "--gridAlignment": gridAlignment }}
						tagName="p"
						allowedFormats={['core/bold', 'core/italic']}
						onChange={e => setTableAttributes(table_id, 'table_name', '', 'PROP', e)}
						value={table.table_name}>
					</RichText>

					<TabbableContainer>
						< div className="grid-scroller"
							style={{
								"--headerRowSticky": headerRowStickyStyle,
								"--startGridBodyRowNbr": startGridBodyRowNbrStyle,
								"--endGridBodyRowNbr": endGridBodyRowNbrStyle
							}}>

							<div className={"grid-control " + headerRowStickyClass}
								style={{
									"--gridTemplateColumns": gridColumnStyle,
									"--gridTemplateRows": gridRowStyle,
									"--headerRowSticky": headerRowStickyStyle,
									"--gridNumColumns": numColumns,
									"--gridNumRows": numRows,
									"--gridAlignment": gridAlignment
								}}>

								{/* TODO: Add overflow-x option if the overflow option is selected */}

								{/* Render Table Border Row if present */}
								{showBorders &&
									(table.cells
										.filter(cell => cell.attributes.border && cell.row_id === '0')
										.map(({ table_id, row_id, column_id, cell_id, content, attributes, classes }) => {
											console.log('Rendering Body Row Cell' + cell_id)

											const borderContent = setBorderContent(row_id, column_id, content)
											const isOpenCurrentColumnMenu = openCurrentColumnMenu(columnMenuVisible, openColumnRow, column_id)
											const isFirstColumn = column_id === '1' ? true : false;
											return (
												<>
													{isFirstColumn && (
														<div className={"grid-control__cells--border"} />
													)}

													< div
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
												</>
											)
										})
									)
								}

								{/* Render Table Header Row if present */}
								{table.rows.filter(row => row.attributes.isHeader === true)
									.map(({ row_id, attributes }) => {
										const renderedRow = row_id;
										return (
											<div className="grid-control__header"
												style={{
													"--headerBorderTopColor": headerBorderTopColor,
													"--headerBorderTopStype": headerBorderTopStyle,
													"--headerBorderTopWidth": headerBorderTopWidth,
													"--headerBorderRightColor": headerBorderRightColor,
													"--headerBorderRightStype": headerBorderRightStyle,
													"--headerBorderRightWidth": headerBorderRightWidth,
													"--headerBorderBottomColor": headerBorderBottomColor,
													"--headerBorderBottomStype": headerBorderBottomStyle,
													"--headerBorderBottomWidth": headerBorderBottomWidth,
													"--headerBorderLeftColor": headerBorderLeftColor,
													"--headerBorderLeftStype": headerBorderLeftStyle,
													"--headerBorderLeftWidth": headerBorderLeftWidth,
													"--headerTextAlignment": headerTextAlignmentStyle
												}}
											>
												{table.cells
													.filter(cell => cell.row_id === renderedRow)
													.map(({ table_id, row_id, column_id, cell_id, content, attributes, classes }) => {
														const isFirstColumn = column_id === '1' ? true : false;
														const isBorder = attributes.border;
														const borderContent = setBorderContent(row_id, column_id, content)
														const isOpenCurrentRowMenu = openCurrentRowMenu(rowMenuVisible, openColumnRow, row_id)
														let showGridLinesCSS = gridShowInnerLines
														let gridLineWidthCSS = gridInnerLineWidth

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
																		{isOpenCurrentRowMenu && (
																			<RowMenu
																				tableId={table_id}
																				rowId={row_id}
																				rowLabel={borderContent}
																				rowAttributes={rowAttributes}
																				updatedRow={onUpdateRow}>
																			</RowMenu>
																		)}
																	</div>
																)}
																{isFirstColumn && (
																	< div
																		className={"grid-control__header-cells"}
																		style={{
																			"--showGridLines": showGridLinesCSS,
																			"--gridLineWidth": gridLineWidthCSS
																		}}
																	></div >
																)}
																{!isBorder && (
																	<RichText
																		id={cell_id}
																		className={"grid-control__header-cells"}
																		style={{
																			"--showGridLines": showGridLinesCSS,
																			"--gridLineWidth": gridLineWidthCSS
																		}}
																		tabIndex="0"
																		tagName="div"
																		onChange={e => setTableAttributes(table_id, 'cell', cell_id, 'CONTENT', e)}
																		value={content}>
																	</RichText>
																)}
															</>
														)

													})}
											</div >
										)
									})}

								{/* Render Table Body */}
								<div className={"grid-control__body"}
									style={{
										"--gridTemplateBodyRows": gridBodyRowStyle,
										"--startGridBodyRowNbr": startGridBodyRowNbrStyle,
										"--endGridBodyRowNbr": endGridBodyRowNbrStyle
									}}

								>

									{/* Render Table Body Row Wrapper*/}
									{table.rows.filter(row => row.attributes.isHeader !== true && row.row_id !== '0')
										.map(({ row_id, attributes }) => {
											const renderedRow = row_id;
											console.log('Rendering Body Row ' + renderedRow)
											return (
												<div className=" grid-control__body-row">

													{/* Render Table Body Row Cells*/}
													{table.cells
														.filter(cell => cell.row_id === renderedRow)
														.map(({ table_id, row_id, column_id, cell_id, content, attributes, classes }) => {
															console.log('Rendering Body Row Cell' + cell_id)
															/**
															 * Set general processing variables
															 */
															const isFirstColumn = column_id === '1' ? true : false;
															const isBorder = attributes.border;
															const borderContent = setBorderContent(row_id, column_id, content)
															const isOpenCurrentRowMenu = openCurrentRowMenu(rowMenuVisible, openColumnRow, row_id)
															let showGridLinesCSS = gridShowInnerLines
															let gridLineWidthCSS = gridInnerLineWidth

															/**
															 * Set calculated class names
															 */
															let calculatedClasses = ''

															const bandedRowOffset = enableHeaderRow ? 1 : 0
															if (bandedRows && bandedRowOffset == 0 && Number(row_id) % 2 === 0) {
																calculatedClasses = calculatedClasses + 'grid-control__cells--banded-row '
															}

															if (bandedRows && bandedRowOffset == 1 && Number(row_id) > 1 && (Number(row_id) + bandedRowOffset) % 2 === 0) {
																calculatedClasses = calculatedClasses + 'grid-control__cells--banded-row '
															}

															return (
																<>
																	{(isFirstColumn) && isBorder && (
																		<div className={"grid-control__cells--border"} />
																	)}

																	{isBorder && (
																		<div
																			id={cell_id}
																			onMouseDown={e => onMouseColumnClick(column_id, row_id, table, e)}
																			className={classes}>
																			{borderContent}
																			{isOpenCurrentRowMenu && (
																				<RowMenu
																					tableId={table_id}
																					rowId={row_id}
																					rowLabel={borderContent}
																					rowAttributes={rowAttributes}
																					updatedRow={onUpdateRow}>
																				</RowMenu>
																			)}
																		</div>
																	)}

																	{isFirstColumn && !isBorder && (
																		<div
																			className={"grid-control__body-cells grid-control__cells--zoom " + calculatedClasses}
																			style={{
																				"--bandedRowTextColor": gridBandedRowTextColor,
																				"--bandedRowBackgroundColor": gridBandedRowBackgroundColor,
																				"--showGridLines": showGridLinesCSS,
																				"--gridLineWidth": gridLineWidthCSS
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
																			className={'grid-control__body-cells ' + calculatedClasses + classes}
																			style={{
																				"--bandedRowTextColor": gridBandedRowTextColor,
																				"--bandedRowBackgroundColor": gridBandedRowBackgroundColor,
																				"--showGridLines": showGridLinesCSS,
																				"--gridLineWidth": gridLineWidthCSS
																			}}
																			tabIndex="0"
																			tagName="div"
																			onChange={e => setTableAttributes(table_id, 'cell', cell_id, 'CONTENT', e)}
																			value={content}>
																		</RichText>
																	)}
																</>
															)

														})}
												</div >
											)
										})
									}
								</div>
							</div>
						</div>
					</TabbableContainer>
				</>
			)
			}

			{
				!isNewBlock && tableIsResolving && (
					<Spinner>Retrieving Table Data</Spinner>
				)
			}


			{
				isNewBlock && (
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
				)
			}

		</div >
	)
}