import { useSelect, useDispatch, dispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { store as noticeStore } from '@wordpress/notices';
import { useEntityRecords } from '@wordpress/core-data';
import { usePrevious } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { ForwardedRef } from 'react';
import {
	Panel,
	PanelBody,
	PanelRow,
	Disabled,
	TabbableContainer,
	Button,
	Spinner,
	Placeholder,
	ColorPicker,
	ToggleControl,
	CheckboxControl,
	__experimentalInputControl as InputControl,
	BorderBoxControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import {
	RichText,
	useBlockProps,
	useSettings,
	BlockIcon,
	AlignmentToolbar,
	AlignmentControl,
	InspectorControls,
	BlockControls,
	BlockAlignmentToolbar,
	PanelColorSettings,
} from '@wordpress/block-editor';
import {
	column,
	search,
	blockTable as icon,
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
	openCurrentRowMenu,
	removeTags,
} from './utils';
import {
	initTable,
	initTableCells,
	getDefaultRow,
	getDefaultColumn,
	getDefaultCell,
	getDefaultTableClasses,
	getDefaultTableAttributes,
} from './table-defaults';
import {
	processColumns,
	processHeaderRow,
	processBodyRows,
	gridBandedRowTextColorStyle,
	gridBandedRowBackgroundColorStyle,
	gridInnerBorderStyle,
	gridInnerBorderWidthStyle,
	startGridRowNbr,
	endGridRowNbr,
	getGridHeaderBackgroundColorStyle,
	getHeaderTextAlignmentStyle,
	getBorderStyleType,
	getBorderStyle,
} from './style';

import { ColumnMenu, RowMenu } from './components';
// import TABLE_ATTRIBUTE_TYPES from './constants'
import './editor.scss';

dispatch('core').addEntities([
	{
		name: 'table',
		kind: 'dynamic-tables',
		baseURL: '/dynamic-tables/v1/tables',
		baseURLParams: { context: 'edit' },
		plural: 'tables',
		label: __('Table'),
		getTitle: record => record?.title || __('Unnamed Table'),
	},
]);

/**
 * Exports main logic for Dynamic Tables block.
 *
 * @since    1.0.0
 *
 * @param {Object} props
 */
export default function Edit(props) {
	const blockProps = useBlockProps({
		className: 'dynamic-table-edit-block',
	});

	console.log(props);

	/* Esternal Store Action useDispatch declarations */
	const { lockPostSaving } = useDispatch(editorStore);
	const { lockPostAutosaving } = useDispatch(editorStore);

	/* Table Store Action useDispatch declarations */
	const { receiveNewTable } = useDispatch(tableStore);
	const { createTableEntity } = useDispatch(tableStore);
	const { saveTableEntity } = useDispatch(tableStore);
	const { deleteTableEntity } = useDispatch(tableStore);
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
	const { processUnmountedTables } = useDispatch(tableStore);
	const { processDeletedTables } = useDispatch(tableStore);
	const { createNotice, removeNotice } = useDispatch(noticeStore);

	/* Local State declarations */
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
	const [tableName, setTableName] = useState('');
	const [numColumns, setNumColumns] = useState(1);
	const [numRows, setNumRows] = useState(1);
	const [gridCells, setGridCells] = useState([]);
	const [awaitingTableEntityCreation, setAwaitingTableEntityCreation] = useState(false);

	/* Current future features: Zoom to details */
	const enableFutureFeatures = false;
	const enableProFeatures = false;

	const priorTableRef = useRef({});
	const { table_id, block_table_ref, block_alignment } = props.attributes;
	const themeColors = useSettings('color.palette');
	const borderBoxColors = themeColors[0].map(({ color, name }) => {
		return { color, name };
	});

	console.log('Block Table Ref - ' + block_table_ref);

	/**
	 * Get Current Table Id.
	 *
	 * @type     {*}
	 * @since    1.0.0
	 *
	 * @return Table Id
	 */
	const { currentTableId } = useSelect(select => {
		const { getTableIdByBlock } = select(tableStore);
		const currentTableId = getTableIdByBlock(block_table_ref);
		console.log('Current table id = ' + currentTableId);

		return {
			currentTableId: currentTableId,
		};
	});

	console.log('NEW TABLE INFO');
	console.log(
		'Awaiting entity creation = ' +
			awaitingTableEntityCreation +
			', Props table id = ' +
			table_id +
			', Current table id = ' +
			currentTableId
	);

	/**
	 * Set Table ID for newly created tables
	 *
	 * @since    1.0.0
	 *
	 * @returns  {boolean} Was Table Changed?
	 */
	const setTableIdChanged = () => {
		if (awaitingTableEntityCreation && Number(currentTableId) !== Number(table_id)) {
			console.log('  ... In table changed - TRUE');
			return true;
		}
		console.log('  ... In table changed - FALSE');
		return false;
	};

	const isTableIdChanged = setTableIdChanged();

	console.log('Table id after select = ' + currentTableId);
	console.log('Table id update: ' + isTableIdChanged);

	/**
	 * Identify unmounted tables
	 *
	 * Table blocks is unmounted when entering the text editor AND when deleted.  However,
	 * don't know whether the table was deleted when an unmount is detected.  Therefore,
	 * we mark them as unmounted at that time, and can identify whether the block was
	 * truly deleted on the subsequent render.
	 *
	 * We mark tables as deleted if they do not identify that the block has been remounted
	 *
	 * @since 1.0.0
	 *
	 * @type  {Object} Object of all table id's that are currently unmounted
	 */
	const { unmountedTables } = useSelect(select => {
		const { getUnmountedTables } = select(tableStore);
		return {
			unmountedTables: getUnmountedTables(),
		};
	});

	if (Object.keys(unmountedTables).length > 0) {
		processUnmountedTables(unmountedTables);
	}

	/**
	 * Retrive table id's of all tables in a status of deleted.
	 *
	 * @since  1.0.0
	 *
	 * @type   {Object} Object of all table id's for tables with a 'deleted' status
	 */
	const { deletedTables } = useSelect(select => {
		const { getDeletedTables } = select(tableStore);
		return {
			deletedTables: getDeletedTables(),
		};
	});

	/**
	 * Identifies when the post which was being saved has completed the
	 * save.
	 *
	 * @since    1.0.0
	 *
	 * @type     {boolean} Post changes have been saved
	 */
	const postChangesAreSaved = usePostChangesSaved();

	/**
	 * Fires when posts have just finished saving and when a change is detected in
	 * unmounted tables.
	 */
	useEffect(() => {
		if (postChangesAreSaved) {
			alert('Sync REST Now');
			/**
			 * Remove deleted tables from persisted store
			 */
			if (Object.keys(deletedTables).length > 0) {
				console.log(deletedTables);
				processDeletedTables(deletedTables);
			}

			/**
			 * Tables are persisted when they are created, but should only remain
			 * if the underlying post is saved.  Here we update the status of new
			 * tables from "new" to "saved" once the post is saved.
			 */
			if (table.table_status == 'new') {
				console.log('Saving new table - ' + table.table_id);
				setTableAttributes(table.table_id, 'table_status', '', 'PROP', 'saved');
				saveTableEntity(table.table_id);
				console.log(table);
			}
		}
	}, [postChangesAreSaved, unmountedTables]);

	/**
	 * Set Block Table Status
	 *
	 * @since    1.0.0
	 *
	 * @return  {("None" | "New" | "Stale" | "Saved")}  Table Status
	 */
	const setBlockTableStatus = () => {
		if (block_table_ref === '') {
			return 'None';
		}

		if (table_id === '0') {
			return 'New';
		}

		if (isTableStale) {
			return 'Stale';
		}

		return 'Saved';
	};

	/**
	 * Summary. (use period). <break> Description. (use period).
	 *
	 * @since    1.0.0
	 *
	 * @return  {boolean} Is this a new dybamic table block?
	 */
	const setNewBlock = () => {
		if (block_table_ref === '') {
			return true;
		}
		return false;
	};

	/**
	 * Set lock for saving.
	 *
	 * @since    1.0.0
	 */
	const setSaveLock = () => {
		lockPostSaving('lockPostSaving');
		lockPostAutosaving('lockPostAutosaving');
	};

	/**
	 * Remove lock for saving.
	 *
	 * @since    1.0.0
	 */
	const setClearSaveLock = () => {
		lockPostSaving('unlockPostSaving');
		lockPostAutosaving('unlockPostAutosaving');
	};

	const isNewBlock = setNewBlock();
	const blockTableStatus = setBlockTableStatus();

	/**
	 * Prepare for New Block
	 */
	if (isNewBlock) {
		setSaveLock();
	}

	/**
	 * Retrieve table entity from table webservice and load table store.
	 *
	 * @since    1.0.0
	 */
	const {
		table,
		tableStatus,
		tableHasStartedResolving,
		tableHasFinishedResolving,
		tableIsResolving,
	} = useSelect(
		select => {
			console.log(
				'Table ID = ' +
					table_id +
					', Stale = ' +
					isTableStale +
					', Block Table Ref = ' +
					block_table_ref
			);
			const {
				getTable,
				getTableIdByBlock,
				hasStartedResolution,
				hasFinishedResolution,
				isResolving,
			} = select(tableStore);
			const selectorArgs = [table_id, isTableStale];

			if (block_table_ref === '') {
				return {
					table: {},
					tableStatus: '',
					tableHasStartedResolving: false,
					tableHasFinishedResolving: false,
					tableIsResolving: false,
				};
			}
			const getBlockTable = (table_id, isTableStale, block_table_ref) => {
				let selectedTable = getTable(table_id, isTableStale);
				console.log(selectedTable);
				// if (table_id === '0' && selectedTable.block_table_ref.length === 0 && awaitingTableEntityCreation) {
				if (
					table_id === '0' &&
					selectedTable.block_table_ref === '' &&
					awaitingTableEntityCreation
				) {
					const newTableId = getTableIdByBlock(block_table_ref);
					selectedTable = getTable(newTableId, isTableStale);

					// Must sync post_id here for new table because "resolving" attributes are not available
					if (
						String(props.context.postId) !== selectedTable.post_id &&
						String(props.context.postId) !== '0'
					) {
						setTableAttributes(
							selectedTable.table_id,
							'post_id',
							'',
							'PROP',
							String(props.context.postId)
						);
					}

					setAwaitingTableEntityCreation(false);
					setClearSaveLock();
					props.setAttributes({ table_id: Number(selectedTable.table_id) });
				}
				return selectedTable;
			};

			const blockTable = getBlockTable(table_id, isTableStale, block_table_ref);
			const tableHasStartedResolving = hasStartedResolution('getTable', selectorArgs);
			const tableHasFinishedResolving = hasFinishedResolution('getTable', selectorArgs);
			const tableIsResolving = isResolving('getTable', selectorArgs);

			if (tableHasFinishedResolving) {
				setTableStale(() => false);
			}

			return {
				table: blockTable,
				tableStatus: blockTable.table_status,
				tableHasStartedResolving: tableHasStartedResolving,
				tableHasFinishedResolving: tableHasFinishedResolving,
				tableIsResolving: tableIsResolving,
			};
		},
		[table_id, isTableIdChanged, isTableStale, block_table_ref]
	);

	/**
	 * Lookup table attribute value.
	 *
	 * @since    1.0.0
	 *
	 * @param {Array}  tableAttributes
	 * @param {string} attributeName
	 * @return {*} Attribute value
	 */
	function getTablePropAttribute(tableAttributes, attributeName) {
		const attributeValue = tableAttributes?.[attributeName];
		return attributeValue;
	}

	/**
	 * Extract and unpack table attributes
	 */
	const showGridLines = getTablePropAttribute(table.attributes, 'showGridLines');
	const allowHorizontalScroll = getTablePropAttribute(table.attributes, 'allowHorizontalScroll');
	const enableHeaderRow = getTablePropAttribute(table.attributes, 'enableHeaderRow');
	const headerAlignment = getTablePropAttribute(table.attributes, 'headerAlignment');
	const gridHeaderBackgroundColor = getTablePropAttribute(
		table.attributes,
		'tableHeaderBackgroundColor'
	);
	const headerRowSticky = getTablePropAttribute(table.attributes, 'headerRowSticky');
	const headerBorder = getTablePropAttribute(table.attributes, 'headerBorder');
	const bodyAlignment = getTablePropAttribute(table.attributes, 'bodyAlignment');
	const bodyBorder = getTablePropAttribute(table.attributes, 'bodyBorder');
	const bandedRows = getTablePropAttribute(table.attributes, 'bandedRows');
	const bandedTextColor = getTablePropAttribute(table.attributes, 'bandedTextColor');
	const bandedRowBackgroundColor = getTablePropAttribute(
		table.attributes,
		'bandedRowBackgroundColor'
	);
	const gridLineWidth = getTablePropAttribute(table.attributes, 'gridLineWidth');
	const gridAlignment = block_alignment;
	const horizontalAlignment = getTablePropAttribute(table.attributes, 'horizontalAlignment');
	const verticalAlignment = getTablePropAttribute(table.attributes, 'verticalAlignment');
	const hideTitle = getTablePropAttribute(table.attributes, 'hideTitle');
	console.log(JSON.stringify(headerBorder, null, 4));

	/**
	 * Synchronize PostId
	 *
	 * Post ID is assigned a value of '0' upon table creation and can change over the life of a post.
	 * props.context is authoritative for Post ID so we ensure the table is sync'd to that.
	 */
	if (
		tableHasStartedResolving &&
		tableHasFinishedResolving &&
		!awaitingTableEntityCreation &&
		String(props.context.postId) !== table.post_id
	) {
		setTableAttributes(table.table_id, 'post_id', '', 'PROP', String(props.context.postId));
		saveTableEntity(table.table_id);
	}

	/**
	 * Perform clean-up for deleted table block at time of deletion
	 */
	useEffect(() => {
		return () => {
			setTableAttributes(
				table.table_id,
				'unmounted_blockid',
				'',
				'PROP',
				blockProps['data-block'],
				false
			);
			// saveTableEntity(table.table_id)
		};
	}, []);

	const tableColumnLength =
		JSON.stringify(table.table) === '{}' || blockTableStatus == 'None' ? 0 : table.columns.length;
	const tableRowLength =
		JSON.stringify(table.table) === '{}' || blockTableStatus == 'None' ? 0 : table.rows.length;

	/**
	 * Set state for number of columns and rows when the number of table rows has changes
	 *
	 * TODO: Verify this is still needed following update to table store to track all tables in editor
	 */
	useEffect(() => {
		if (!isNewBlock) {
			if (tableColumnLength != numColumns) {
				setNumColumns(tableColumnLength);
			}
			if (tableRowLength != numRows) {
				setNumRows(tableRowLength);
			}
		}
	}, [tableColumnLength, tableRowLength]);

	console.log('Table ID from Block - ' + table_id);
	console.log('Block Table Ref from Block - ' + block_table_ref);

	/**
	 * Insert a new column in the table.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} tableId  Identifier key for the table
	 * @param {number} columnId Identifier for the table column
	 * @return {Object} Dynamic Table
	 */
	function insertColumn(tableId, columnId) {
		const newColumn = getDefaultColumn(tableId, columnId);
		const tableCells = [];

		for (let i = 0; i < numRows; i++) {
			if (i === 0) {
				const cell = getDefaultCell(tableId, columnId, i, 'Border');
				tableCells.push(cell);
			} else {
				const cell = getDefaultCell(tableId, columnId, i);
				tableCells.push(cell);
			}
		}

		addColumn(tableId, columnId, newColumn, tableCells);
		setTableStale(false);
		return updateTableEntity(tableId);
	}

	/**
	 * Insert a new row in the table.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} tableId Identifier key for the table
	 * @param {number} rowId   Identifier for the table row
	 * @return {Object} Dynamic Table
	 */
	function insertRow(tableId, rowId) {
		const newRow = getDefaultRow(tableId, rowId);
		const tableCells = [];

		for (let i = 0; i < numColumns; i++) {
			if (i === 0) {
				const cell = getDefaultCell(tableId, i, rowId, 'Border');
				// cell.content =
				tableCells.push(cell);
			} else {
				const cell = getDefaultCell(tableId, i, rowId);
				tableCells.push(cell);
			}
		}

		addRow(tableId, rowId, newRow, tableCells);
		setTableStale(false);
		return updateTableEntity(tableId);
	}

	/**
	 * Delete a column from the table
	 *
	 * @param {number} tableId  Identifier key for the table
	 * @param {number} columnId Identifier for the table column
	 * @return {Object} Dynamic Table
	 */
	function deleteColumn(tableId, columnId) {
		removeColumn(tableId, columnId);
		setTableStale(false);
		return updateTableEntity(tableId);
	}

	/**
	 * Delete a column from the table
	 *
	 * @since    1.0.0
	 *
	 * @param {*} tableId
	 * @param {*} rowId
	 * @return {Object} Dynamic Table
	 */
	function deleteRow(tableId, rowId) {
		removeRow(tableId, rowId);
		setTableStale(false);
		return updateTableEntity(tableId);
	}

	/**
	 * Update table store to reflect changes made to EXISTING table attributes.
	 *
	 * @since    1.0.0
	 *
	 * @param {number}                  tableId        Identifier key for the table
	 * @param {string}                  attribute      (table, column, row, cell)
	 * @param {number | null}           id             Column and/or row id
	 * @param {string}                  type           (CONTENT, ATTRIBUTES, CLASSES, PROP)
	 * @param {string | number | Array} value          New value that will replace existing config
	 * @param {boolean}                 [persist=true] Update table entity (not just the table store)
	 */
	function setTableAttributes(tableId, attribute, id, type, value, persist = true) {
		switch (type) {
			case 'CONTENT': {
				if (attribute === 'cell') {
					updateCell(tableId, id, 'content', value);
				}
				break;
			}
			case 'ATTRIBUTES': {
				if (attribute === 'cell') {
					updateCell(tableId, id, 'attributes', value);
				} else if (attribute === 'row') {
					setRowAttributes(value);
					updateRow(tableId, id, 'attributes', value);
				} else if (attribute === 'column') {
					setColumnAttributes(value);
					updateColumn(tableId, id, 'attributes', value);
				} else if (attribute === 'table') {
					updateTableProp(tableId, 'attributes', value);
				}
				break;
			}
			case 'CLASSES': {
				if (attribute === 'cell') {
					updateCell(tableId, id, 'classes', value);
				} else if (attribute === 'column') {
					updateColumn(tableId, id, 'classes', value);
				}
				break;
			}
			case 'PROP':
				{
					updateTableProp(tableId, attribute, value);
					if (attribute === 'unmounted_blockid') {
						updateTableEntity(tableId, 'unknown');
					}
				}
				break;

			default:
				console.log('Unrecognized Attibute Type');
		}
		setTableStale(false);

		/**
		 * Update Table Status only table change is for status and the
		 * call must bypass the regular persist (persist === false)
		 */
		if (persist) {
			return updateTableEntity(tableId);
		}
	}

	/**
	 * Show or hide column and row borders to support updates to them.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Are borders being toggled on?
	 */
	function onToggleBorders(table, isChecked) {
		let updatedRows;
		let updatedColumns;
		let updatedCells;

		/**
		 * Remove borders if unchecked
		 */
		if (isChecked === false) {
			setNumColumns(numColumns - 1);
			setNumRows(numRows - 1);

			updatedRows = table.rows.filter(row => row.row_id !== '0');
			updatedColumns = table.columns.filter(column => column.column_id !== '0');
			updatedCells = table.cells.filter(cell => cell.row_id !== '0' && cell.column_id !== '0');
			console.log(updatedCells);
			updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells);
		} else {
			/**
			 * Create borders if checked
			 */
			setNumColumns(numColumns + 1);
			setNumRows(numRows + 1);

			/**  Create header row border at top of table */
			const rowBorder = [];
			rowBorder.push(getDefaultRow(table_id, 0, 'Border'));

			const rowCells = [];
			for (let i = 0; i <= numColumns; i++) {
				const cell = getDefaultCell(table_id, i, 0, 'Border');
				console.log(cell);
				rowCells.push(cell);
			}

			/** Create column border down left side of table */
			const columnBorder = [];
			columnBorder.push(getDefaultColumn(table_id, 0, 'Border'));

			const columnCells = [];
			for (let i = 1; i <= numRows; i++) {
				const cell = getDefaultCell(table_id, 0, i, 'Border');
				columnCells.push(cell);
			}

			/** Sort table parts */
			updatedRows = tableSort('rows', [...table.rows, ...rowBorder]);
			updatedColumns = tableSort('columns', [...table.columns, ...columnBorder]);
			updatedCells = tableSort('cells', [...table.cells, ...rowCells, ...columnCells]);

			updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells);
		}
		setShowBorders(isChecked);
		setTableStale(false);
	}

	/**
	 * Create new table and related table entity.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} columnCount Number of columns in table
	 * @param {number} rowCount    Number of rows in table
	 * @param {string} tableName   Name of new table
	 */
	function createTable(columnCount, rowCount, tableName) {
		setTableStale(false);
		const newBlockTableRef = generateBlockTableRef();
		const newTable = initTable(newBlockTableRef, columnCount, rowCount, tableName);

		props.setAttributes({ block_table_ref: newBlockTableRef });
		receiveNewTable(newTable);
		setAwaitingTableEntityCreation(true);
		createTableEntity();
	}

	/**
	 * Process event to create new table.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Table Creation Event
	 */
	function onCreateTable(event) {
		event.preventDefault();
		createTable(numColumns, numRows, tableName);
	}

	/**
	 * Process changes for the column count when defining a new table creation.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} num_columns Number of columns entered in form
	 */
	function onChangeInitialColumnCount(num_columns) {
		let newNumColumns = num_columns;
		if (num_columns < 1 || num_columns > 50) {
			const errorText =
				'Cannot have ' +
				num_columns +
				' columns.  You must have at least 1 and no more than 50 columns.';
			createNotice('error', errorText, {
				id: 'invalidNumColumns',
				isDismissible: true,
				politeness: 'assertive',
			});

			newNumColumns = Number(numColumns);
		} else {
			removeNotice('invalidNumColumns');
		}
		setNumColumns(newNumColumns);
	}

	/**
	 * Process changes for the row count when defining a new table creation.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} num_rows Number of rows entered in form
	 */
	function onChangeInitialRowCount(num_rows) {
		let newNumRows = num_rows;
		if (num_rows < 1 || num_rows > 1000) {
			const errorText =
				'Cannot have ' + num_rows + ' rows.  You must have at least 1 and no more than 1,000 rows.';
			createNotice('error', errorText, {
				id: 'invalidNumRows',
				isDismissible: true,
				politeness: 'assertive',
			});

			newNumRows = Number(numRows);
		} else {
			removeNotice('invalidNumRows');
		}
		setNumRows(newNumRows);
	}

	/**
	 * Process updates (insert, update, delete) to a table column.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event                   Table Creation Event
	 * @param {string} updateType              attribute (Update), insert, delete
	 * @param {number} tableId                 Identifier key for the table
	 * @param {number} columnId                Identifier for the table column
	 * @param {Array}  updatedColumnAttributes New column attribute values
	 */
	function onUpdateColumn(event, updateType, tableId, columnId, updatedColumnAttributes) {
		switch (updateType) {
			case 'attributes': {
				setTableAttributes(tableId, 'column', columnId, 'ATTRIBUTES', updatedColumnAttributes);
				break;
			}
			case 'insert': {
				setOpenColumnRow(0);
				setColumnMenuVisible(false);
				insertColumn(tableId, columnId);
				break;
			}
			case 'delete': {
				setOpenColumnRow(0);
				setColumnMenuVisible(false);
				deleteColumn(tableId, columnId);
				break;
			}
			default:
				console.log('Unrecognized Column Update Type');
		}
	}

	/**
	 * Process updates (insert, update, delete) to a table row.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event                   Table Creation Event
	 * @param {string} updateType              attribute (Update), insert, delete
	 * @param {number} tableId                 Identifier key for the table
	 * @param {number} rowId                   Identifier for the table row
	 * @param {Array}  updatedColumnAttributes New column attribute values
	 * @param {Array}  updatedRowAttributes    New row attribute values
	 */
	function onUpdateRow(event, updateType, tableId, rowId, updatedRowAttributes) {
		switch (updateType) {
			case 'attributes': {
				setTableAttributes(tableId, 'row', rowId, 'ATTRIBUTES', updatedRowAttributes);
				break;
			}
			case 'insert': {
				setOpenColumnRow(0);
				setRowMenuVisible(false);
				insertRow(tableId, rowId);
				break;
			}
			case 'delete': {
				setOpenColumnRow(0);
				setRowMenuVisible(false);
				deleteRow(tableId, rowId);
				break;
			}
			default:
				console.log('Unrecognized Row Update Type');
		}
	}

	/**
	 * Process mouse clicks on the table borders.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} column_id Identifier for the table column
	 * @param {number} row_id    Identifier for the table row
	 * @param {Object} table     Dynamic Table
	 * @param {Object} event     Border mouse click event
	 */
	function onMouseBorderClick(column_id, row_id, table, event) {
		if (row_id === '0' && column_id !== '0') {
			console.log('Opening Column ' + column_id);
			const compareColumnId = column_id;
			const clickedColumn = table.columns.find(({ column_id }) => column_id === compareColumnId);
			console.log(clickedColumn);
			setColumnAttributes(clickedColumn.attributes);
			setColumnMenuVisible(true);
			setOpenColumnRow(column_id);
		}

		if (row_id !== '0' && column_id === '0') {
			console.log('Opening Row ' + row_id);
			const compareRowId = row_id;
			const clickedRow = table.rows.find(({ row_id }) => row_id === compareRowId);
			console.log(clickedRow);
			setRowAttributes(clickedRow.attributes);
			setRowMenuVisible(true);
			setOpenColumnRow(row_id);
		}
		setTableStale(false);
	}

	/**
	 * Process request to prevent the table title from displaying
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Is the table title being hidden?
	 */
	function onHideTitle(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			hideTitle: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to allow the table to scroll horizontally
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Show horizontal scroll bar if appropriate?
	 */
	function onAllowHorizontalScroll(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			allowHorizontalScroll: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to show banded even numbered table rows
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Show banded table rows?
	 */
	function onShowBandedRows(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			bandedRows: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process requests for specific background and text colors on banded table rows
	 *
	 * @param {Object} table Dynamic Table
	 * @param {string} type  Attribute to be colored (background, text)
	 * @param {string} color New color code (hex)
	 */
	function onBandedRowColor(table, type, color) {
		let updatedTableAttributes = '';
		if (type == 'background') {
			updatedTableAttributes = {
				...table.attributes,
				bandedRowBackgroundColor: color,
			};
			setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
		}

		if (type == 'text') {
			updatedTableAttributes = {
				...table.attributes,
				bandedTextColor: color,
			};
			setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
		}
	}

	/**
	 * Process request create a header row from the first table row.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Create a header row
	 */
	function onEnableHeaderRow(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			enableHeaderRow: isChecked,
			headerRowSticky: false,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);

		const updatedRowAttributes = {
			...table.rows.find(x => x.row_id === '1').attributes,
			isHeader: isChecked ? true : false,
		};
		setTableAttributes(table.table_id, 'row', '1', 'ATTRIBUTES', updatedRowAttributes);
	}

	/**
	 * Process request to align header column content horizontally.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table     Dynamic Table
	 * @param {string} alignment The alignment position (left, center, right)
	 */
	function onAlignHeader(table, alignment) {
		const updatedTableAttributes = {
			...table.attributes,
			headerAlignment: alignment,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to syle header row borders.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table  Dynamic Table
	 * @param {Array}  border Outside header border color, width, style
	 */
	function onHeaderBorder(table, border) {
		const updatedTableAttributes = {
			...table.attributes,
			headerBorder: border,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to make the header row sticky with vertical scroll.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Make header row sticky
	 */
	function onHeaderRowSticky(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			headerRowSticky: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to align body column content horizontally.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table     Dynamic Table
	 * @param {string} alignment The alignment position (left, center, right)
	 */
	function onAlignBody(table, alignment) {
		const updatedTableAttributes = {
			...table.attributes,
			bodyAlignment: alignment,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to syle body row borders.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table  Dynamic Table
	 * @param {Array}  border Outside body border color, width, style
	 */
	function onBodyBorder(table, border) {
		const updatedTableAttributes = {
			...table.attributes,
			bodyBorder: border,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to show inner body row grid lines.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Show inner body row grid lines
	 */
	function onShowGridLines(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			showGridLines: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to set grid line width
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table         Dynamic Table
	 * @param {string} gridLineWidth Width of grid lines in pixels
	 */
	function onGridLineWidth(table, gridLineWidth) {
		const updatedTableAttributes = {
			...table.attributes,
			gridLineWidth: Number(gridLineWidth),
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Set variables used to render the dynamic table
	 */

	const gridColumnStyle = processColumns(
		isNewBlock,
		tableIsResolving,
		enableFutureFeatures,
		table.columns
	);

	const gridHeaderRowStyle = processHeaderRow(isNewBlock, tableIsResolving, table.rows);
	const gridBodyRowStyle = processBodyRows(isNewBlock, tableIsResolving, table.rows);
	const startGridHeaderRowNbrStyle = showBorders ? 2 : 1;

	const endGridHeaderRowNbrStyle = endGridRowNbr(
		1,
		'Header',
		numRows,
		enableHeaderRow,
		showBorders,
		false
	);

	const startGridBodyRowNbrStyle = startGridRowNbr(enableHeaderRow, showBorders);

	const endGridBodyRowNbrStyle = endGridRowNbr(
		startGridBodyRowNbrStyle,
		'Body',
		numRows,
		enableHeaderRow,
		showBorders,
		false
	);

	const horizontalScrollStyle = allowHorizontalScroll ? 'auto' : 'hidden';

	const gridBandedRowTextColor = gridBandedRowTextColorStyle(
		isNewBlock,
		tableIsResolving,
		bandedTextColor
	);

	const gridBandedRowBackgroundColor = gridBandedRowBackgroundColorStyle(
		isNewBlock,
		tableIsResolving,
		bandedRowBackgroundColor
	);

	const gridShowInnerLines = gridInnerBorderStyle(isNewBlock, tableIsResolving, showGridLines);

	const gridInnerLineWidth = gridInnerBorderWidthStyle(
		isNewBlock,
		tableIsResolving,
		showGridLines,
		gridLineWidth
	);

	const headerRowStickyStyle = headerRowSticky ? 'auto' : 'hidden';
	const headerRowStickyClass = headerRowSticky ? 'grid-control__header--sticky ' : '';

	const gridHeaderBackgroundColorStyle = getGridHeaderBackgroundColorStyle(
		isNewBlock,
		tableIsResolving,
		gridHeaderBackgroundColor,
		blockProps.style.backgroundColor
	);

	/**
	 * Header Styling
	 */
	const headerTextAlignmentStyle = getHeaderTextAlignmentStyle(
		isNewBlock,
		tableIsResolving,
		headerAlignment
	);
	const headerBorderStyleType = getBorderStyleType(headerBorder);

	// Top header border
	const headerBorderTopColor = getBorderStyle(headerBorder, 'top', 'color', headerBorderStyleType);
	const headerBorderTopStyle = getBorderStyle(headerBorder, 'top', 'style', headerBorderStyleType);
	const headerBorderTopWidth = getBorderStyle(headerBorder, 'top', 'width', headerBorderStyleType);

	// Right header border
	const headerBorderRightColor = getBorderStyle(
		headerBorder,
		'right',
		'color',
		headerBorderStyleType
	);
	const headerBorderRightStyle = getBorderStyle(
		headerBorder,
		'right',
		'style',
		headerBorderStyleType
	);
	const headerBorderRightWidth = getBorderStyle(
		headerBorder,
		'right',
		'width',
		headerBorderStyleType
	);

	// Bottom header border
	const headerBorderBottomColor = getBorderStyle(
		headerBorder,
		'bottom',
		'color',
		headerBorderStyleType
	);
	const headerBorderBottomStyle = getBorderStyle(
		headerBorder,
		'bottom',
		'style',
		headerBorderStyleType
	);
	const headerBorderBottomWidth = getBorderStyle(
		headerBorder,
		'bottom',
		'width',
		headerBorderStyleType
	);

	// Left header border
	const headerBorderLeftColor = getBorderStyle(
		headerBorder,
		'left',
		'color',
		headerBorderStyleType
	);
	const headerBorderLeftStyle = getBorderStyle(
		headerBorder,
		'left',
		'style',
		headerBorderStyleType
	);
	const headerBorderLeftWidth = getBorderStyle(
		headerBorder,
		'left',
		'width',
		headerBorderStyleType
	);

	/**
	 * Body Styling
	 */
	const bodyTextAlignmentStyle = getHeaderTextAlignmentStyle(
		isNewBlock,
		tableIsResolving,
		bodyAlignment
	);
	const bodyBorderStyleType = getBorderStyleType(bodyBorder);
	// Top body border
	const bodyBorderTopColor = getBorderStyle(bodyBorder, 'top', 'color', bodyBorderStyleType);
	const bodyBorderTopStyle = getBorderStyle(bodyBorder, 'top', 'style', bodyBorderStyleType);
	const bodyBorderTopWidth = getBorderStyle(bodyBorder, 'top', 'width', bodyBorderStyleType);

	// Right body border
	const bodyBorderRightColor = getBorderStyle(bodyBorder, 'right', 'color', bodyBorderStyleType);
	const bodyBorderRightStyle = getBorderStyle(bodyBorder, 'right', 'style', bodyBorderStyleType);
	const bodyBorderRightWidth = getBorderStyle(bodyBorder, 'right', 'width', bodyBorderStyleType);

	// Bottom body border
	const bodyBorderBottomColor = getBorderStyle(bodyBorder, 'bottom', 'color', bodyBorderStyleType);
	const bodyBorderBottomStyle = getBorderStyle(bodyBorder, 'bottom', 'style', bodyBorderStyleType);
	const bodyBorderBottomWidth = getBorderStyle(bodyBorder, 'bottom', 'width', bodyBorderStyleType);

	// Left body border
	const bodyBorderLeftColor = getBorderStyle(bodyBorder, 'left', 'color', bodyBorderStyleType);
	const bodyBorderLeftStyle = getBorderStyle(bodyBorder, 'left', 'style', bodyBorderStyleType);
	const bodyBorderLeftWidth = getBorderStyle(bodyBorder, 'left', 'width', bodyBorderStyleType);

	if (!tableIsResolving) {
		// console.log(table.attributes?.bandedRows)
	}

	return (
		<div {...blockProps}>
			{/* Render an existing table after it has been fetched  */}

			{!isNewBlock && !tableIsResolving && (
				<>
					<BlockControls>
						<BlockAlignmentToolbar
							value={block_alignment}
							onChange={e => props.setAttributes({ block_alignment: e })}
						/>
					</BlockControls>

					<InspectorControls>
						<Panel>
							<PanelBody title="Definition" initialOpen={true}>
								<PanelRow>
									<div className="grid-control__inspector-controls--read-only">
										<span className="grid-control__inspector-controls--read-only-label">
											Table Name:
										</span>
										{removeTags(table.table_name)}
									</div>
								</PanelRow>

								<PanelRow>
									<div className="grid-control__inspector-controls--read-only">
										<span className="grid-control__inspector-controls--read-only-label">
											Table Columns/Rows:
										</span>
										{numColumns}/{numRows}
									</div>
								</PanelRow>

								<PanelRow>
									<CheckboxControl
										label="Show table borders"
										__nextHasNoMarginBottom
										checked={showBorders}
										onChange={e => onToggleBorders(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<CheckboxControl
										label="Hide Table Title"
										__nextHasNoMarginBottom
										checked={hideTitle}
										onChange={e => onHideTitle(table, e)}
									/>
								</PanelRow>
							</PanelBody>

							<PanelBody title="Table Header" initialOpen={false}>
								<PanelRow>
									<CheckboxControl
										label="First Row as Header?"
										__nextHasNoMarginBottom
										checked={enableHeaderRow}
										onChange={e => onEnableHeaderRow(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<CheckboxControl
										label="Freeze Header Row?"
										__nextHasNoMarginBottom
										disabled={!enableHeaderRow}
										checked={headerRowSticky}
										onChange={e => onHeaderRowSticky(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<span className="inspector-controls-menu__header-alignment--middle">
										<AlignmentControl
											id="header-alignment"
											value={headerAlignment}
											onChange={e => onAlignHeader(table, e)}
										/>
										<label
											className="inspector-controls-nemu__label--left-margin"
											htmlFor="header-alignment"
										>
											Text Alignment
										</label>
									</span>
								</PanelRow>

								<PanelRow>
									<BorderBoxControl
										className="border-box-workaround"
										__next40pxDefaultSize
										__experimentalIsRenderedInSidebar
										label="Borders"
										// hideLabelFromVision="false"
										isCompact="true"
										colors={borderBoxColors}
										value={headerBorder}
										onChange={e => onHeaderBorder(table, e)}
									/>
								</PanelRow>
							</PanelBody>

							<PanelBody title="Table Body" initialOpen={false}>
								<PanelRow>
									<CheckboxControl
										label="Allow Horizontal Acroll?"
										__nextHasNoMarginBottom
										checked={allowHorizontalScroll}
										onChange={e => onAllowHorizontalScroll(table, e)}
									/>
								</PanelRow>

								<PanelRow>
									<span className="inspector-controls-menu__header-alignment--middle">
										<AlignmentControl
											id="body-alignment"
											value={bodyAlignment}
											onChange={e => onAlignBody(table, e)}
										/>
										<label
											className="inspector-controls-menu__label--left-margin"
											htmlFor="body-alignment"
										>
											Text Alignment
										</label>
									</span>
								</PanelRow>

								<PanelRow>
									<BorderBoxControl
										className="border-box-workaround"
										label="Borders"
										hideLabelFromVision="false"
										isCompact="true"
										colors={borderBoxColors}
										value={bodyBorder}
										onChange={e => onBodyBorder(table, e)}
									/>
								</PanelRow>
							</PanelBody>
						</Panel>
					</InspectorControls>

					<InspectorControls group="styles">
						<PanelBody title="Banded Table Rows" initialOpen={false}>
							<PanelRow>
								<CheckboxControl
									label="Display Banded Rows"
									__nextHasNoMarginBottom
									checked={bandedRows}
									// checked={true}
									onChange={e => onShowBandedRows(table, e)}
								/>
							</PanelRow>
							<PanelColorSettings
								__experimentalIsRenderedInSidebar
								title={'Banded Row Color'}
								colors={themeColors}
								colorSettings={[
									{
										value: bandedTextColor,
										onChange: newColor => onBandedRowColor(table, 'text', newColor),
										label: 'Text',
									},
									{
										value: bandedRowBackgroundColor,
										onChange: newColor => onBandedRowColor(table, 'background', newColor),
										label: 'Background',
									},
								]}
							/>
						</PanelBody>

						<PanelBody title="Grid Lines" initialOpen={false}>
							<PanelRow>
								<CheckboxControl
									label="Display Inner Grid Lines"
									__nextHasNoMarginBottom
									checked={showGridLines}
									onChange={e => onShowGridLines(table, e)}
								/>
							</PanelRow>

							<PanelRow>
								<NumberControl
									label="Inner Grid Line Width"
									value={gridLineWidth}
									labelPosition="side"
									onChange={e => onGridLineWidth(table, e)}
								/>
							</PanelRow>
						</PanelBody>
					</InspectorControls>
					<InspectorControls group="typography"></InspectorControls>

					<div style={{ display: 'block' }}>
						{!hideTitle && (
							<RichText
								id="tableTitle"
								style={{ '--gridAlignment': gridAlignment }}
								tagName="p"
								allowedFormats={['core/bold', 'core/italic']}
								onChange={e => setTableAttributes(table_id, 'table_name', '', 'PROP', e)}
								value={table.table_name}
							></RichText>
						)}

						<TabbableContainer>
							<div
								className="grid-scroller"
								style={{
									'--headerRowSticky': headerRowStickyStyle,
									// "--startGridBodyRowNbr": startGridBodyRowNbrStyle,
									// "--endGridBodyRowNbr": endGridBodyRowNbrStyle
								}}
							>
								<div
									className={'grid-control ' + headerRowStickyClass}
									style={{
										'--gridTemplateColumns': gridColumnStyle,
										'--horizontalScroll': horizontalScrollStyle,
										'--headerRowSticky': headerRowStickyStyle,
										'--gridNumColumns': numColumns,
										'--gridNumRows': numRows,
										'--gridAlignment': gridAlignment,
									}}
								>
									{/* Render Table Border Row if present */}
									{showBorders && (
										<div className={'grid-control__border'}>
											{table.cells
												.filter(cell => cell.attributes.border && cell.row_id === '0')
												.map(
													({
														table_id,
														row_id,
														column_id,
														cell_id,
														content,
														attributes,
														classes,
													}) => {
														console.log('Rendering Body Row Cell' + cell_id);

														const borderContent = setBorderContent(row_id, column_id, content);
														const isOpenCurrentColumnMenu = openCurrentColumnMenu(
															columnMenuVisible,
															openColumnRow,
															column_id
														);
														const isFirstColumn = column_id === '1' ? true : false;
														return (
															<>
																{/* Show zoom to details column */}
																{isFirstColumn && enableFutureFeatures && (
																	<div className={'grid-control__border-cells'} />
																)}

																<div
																	id={cell_id}
																	onMouseDown={e => onMouseBorderClick(column_id, row_id, table, e)}
																	className={classes}
																>
																	{borderContent}
																	{isOpenCurrentColumnMenu && (
																		<ColumnMenu
																			tableId={table_id}
																			columnId={column_id}
																			columnLabel={borderContent}
																			columnAttributes={columnAttributes}
																			enableProFeatures={enableProFeatures}
																			updatedColumn={onUpdateColumn}
																		></ColumnMenu>
																	)}
																</div>
															</>
														);
													}
												)}
										</div>
									)}

									{/* Render Table Header Row if present */}
									{table.rows
										.filter(row => row.attributes.isHeader === true)
										.map(({ row_id, attributes }) => {
											const renderedRow = row_id;
											return (
												<div
													className="grid-control__header"
													style={{
														'--gridTemplateHeaderRows': gridHeaderRowStyle,
														'--startGridHeaderRowNbr': startGridHeaderRowNbrStyle,
														'--endGridHeaderRowNbr': endGridHeaderRowNbrStyle,
														'--headerBorderTopColor': headerBorderTopColor,
														'--headerBorderTopStyle': headerBorderTopStyle,
														'--headerBorderTopWidth': headerBorderTopWidth,
														'--headerBorderRightColor': headerBorderRightColor,
														'--headerBorderRightStyle': headerBorderRightStyle,
														'--headerBorderRightWidth': headerBorderRightWidth,
														'--headerBorderBottomColor': headerBorderBottomColor,
														'--headerBorderBottomStyle': headerBorderBottomStyle,
														'--headerBorderBottomWidth': headerBorderBottomWidth,
														'--headerBorderLeftColor': headerBorderLeftColor,
														'--headerBorderLeftStyle': headerBorderLeftStyle,
														'--headerBorderLeftWidth': headerBorderLeftWidth,
														'--headerTextAlignment': headerTextAlignmentStyle,
													}}
												>
													{table.cells
														.filter(cell => cell.row_id === renderedRow)
														.map(
															({
																table_id,
																row_id,
																column_id,
																cell_id,
																content,
																attributes,
																classes,
															}) => {
																const isFirstColumn = column_id === '1' ? true : false;
																const isBorder = attributes.border;
																const borderContent = setBorderContent(row_id, column_id, content);
																const isOpenCurrentRowMenu = openCurrentRowMenu(
																	rowMenuVisible,
																	openColumnRow,
																	row_id
																);
																const showGridLinesCSS = gridShowInnerLines;
																const gridLineWidthCSS = gridInnerLineWidth;

																return (
																	<>
																		{/* Show zoom to details column */}
																		{isFirstColumn && isBorder && enableFutureFeatures && (
																			<div className={'grid-control__border-cells'} />
																		)}

																		{isBorder && (
																			<div
																				id={cell_id}
																				onMouseDown={e =>
																					onMouseBorderClick(column_id, row_id, table, e)
																				}
																				className={classes}
																			>
																				{borderContent}
																				{isOpenCurrentRowMenu && (
																					<RowMenu
																						tableId={table_id}
																						rowId={row_id}
																						rowLabel={borderContent}
																						rowAttributes={rowAttributes}
																						updatedRow={onUpdateRow}
																					></RowMenu>
																				)}
																			</div>
																		)}
																		{/* Show zoom to details column */}
																		{isFirstColumn && enableFutureFeatures && (
																			<div
																				className={'grid-control__header-cells'}
																				style={{
																					'--showGridLines': showGridLinesCSS,
																					'--gridLineWidth': gridLineWidthCSS,
																				}}
																			></div>
																		)}
																		{!isBorder && (
																			<RichText
																				id={cell_id}
																				className={'grid-control__header-cells'}
																				style={{
																					'--showGridLines': showGridLinesCSS,
																					'--gridLineWidth': gridLineWidthCSS,
																				}}
																				tabIndex="0"
																				tagName="div"
																				onChange={e =>
																					setTableAttributes(
																						table_id,
																						'cell',
																						cell_id,
																						'CONTENT',
																						e
																					)
																				}
																				value={content}
																			></RichText>
																		)}
																	</>
																);
															}
														)}
												</div>
											);
										})}

									{/* Render Table Body */}
									<div
										className={'grid-control__body'}
										style={{
											'--gridTemplateBodyRows': gridBodyRowStyle,
											'--startGridBodyRowNbr': startGridBodyRowNbrStyle,
											'--endGridBodyRowNbr': endGridBodyRowNbrStyle,
											'--bodyBorderTopColor': bodyBorderTopColor,
											'--bodyBorderTopStyle': bodyBorderTopStyle,
											'--bodyBorderTopWidth': bodyBorderTopWidth,
											'--bodyBorderRightColor': bodyBorderRightColor,
											'--bodyBorderRightStyle': bodyBorderRightStyle,
											'--bodyBorderRightWidth': bodyBorderRightWidth,
											'--bodyBorderBottomColor': bodyBorderBottomColor,
											'--bodyBorderBottomStyle': bodyBorderBottomStyle,
											'--bodyBorderBottomWidth': bodyBorderBottomWidth,
											'--bodyBorderLeftColor': bodyBorderLeftColor,
											'--bodyBorderLeftStyle': bodyBorderLeftStyle,
											'--bodyBorderLeftWidth': bodyBorderLeftWidth,
											'--bodyTextAlignment': bodyTextAlignmentStyle,
										}}
									>
										{/* Render Table Body Row Wrapper*/}
										{table.rows
											.filter(row => row.attributes.isHeader !== true && row.row_id !== '0')
											.map(({ row_id, attributes }) => {
												const renderedRow = row_id;
												// console.log('Rendering Body Row ' + renderedRow)

												/**
												 * Set calculated class names
												 */
												let calculatedClasses = '';

												const bandedRowOffset = enableHeaderRow ? 1 : 0;
												if (bandedRows && bandedRowOffset == 0 && Number(row_id) % 2 === 0) {
													calculatedClasses =
														calculatedClasses + 'grid-control__body-rows--banded-row ';
												}

												if (
													bandedRows &&
													bandedRowOffset == 1 &&
													Number(row_id) > 1 &&
													(Number(row_id) + bandedRowOffset) % 2 === 0
												) {
													calculatedClasses =
														calculatedClasses + 'grid-control__body-rows--banded-row ';
												}

												return (
													<div
														className={'grid-control__body-row ' + calculatedClasses}
														style={{
															'--bandedRowTextColor': gridBandedRowTextColor,
															'--bandedRowBackgroundColor': gridBandedRowBackgroundColor,
														}}
													>
														{/* Render Table Body Row Cells*/}
														{table.cells
															.filter(cell => cell.row_id === renderedRow)
															.map(
																({
																	table_id,
																	row_id,
																	column_id,
																	cell_id,
																	content,
																	attributes,
																	classes,
																}) => {
																	// console.log('Rendering Body Row Cell' + cell_id)
																	/**
																	 * Set general processing variables
																	 */
																	const isFirstColumn = column_id === '1' ? true : false;
																	const isBorder = attributes.border;
																	const borderContent = setBorderContent(
																		row_id,
																		column_id,
																		content
																	);
																	const isOpenCurrentRowMenu = openCurrentRowMenu(
																		rowMenuVisible,
																		openColumnRow,
																		row_id
																	);
																	const showGridLinesCSS = gridShowInnerLines;
																	const gridLineWidthCSS = gridInnerLineWidth;

																	return (
																		<>
																			{/* Show zoom to details column */}
																			{isFirstColumn && isBorder && enableFutureFeatures && (
																				<div className={'grid-control__border-cells'} />
																			)}

																			{isBorder && (
																				<div
																					id={cell_id}
																					onMouseDown={e =>
																						onMouseBorderClick(column_id, row_id, table, e)
																					}
																					className={classes}
																				>
																					{borderContent}
																					{isOpenCurrentRowMenu && (
																						<RowMenu
																							tableId={table_id}
																							rowId={row_id}
																							rowLabel={borderContent}
																							rowAttributes={rowAttributes}
																							updatedRow={onUpdateRow}
																						></RowMenu>
																					)}
																				</div>
																			)}

																			{/* Show zoom to details column */}
																			{isFirstColumn && !isBorder && enableFutureFeatures && (
																				<div
																					className={
																						'grid-control__body-cells grid-control__body-cells--zoom'
																					}
																					style={{
																						'--showGridLines': showGridLinesCSS,
																						'--gridLineWidth': gridLineWidthCSS,
																					}}
																				>
																					<Button href="#" icon={search} />
																				</div>
																			)}

																			{!isBorder && (
																				<RichText
																					id={cell_id}
																					className={'grid-control__body-cells ' + classes}
																					style={{
																						'--showGridLines': showGridLinesCSS,
																						'--gridLineWidth': gridLineWidthCSS,
																					}}
																					tabIndex="0"
																					tagName="div"
																					onChange={e =>
																						setTableAttributes(
																							table_id,
																							'cell',
																							cell_id,
																							'CONTENT',
																							e
																						)
																					}
																					value={content}
																				></RichText>
																			)}
																		</>
																	);
																}
															)}
													</div>
												);
											})}
									</div>
								</div>
							</div>
						</TabbableContainer>
					</div>
				</>
			)}

			{/* Show a spinner while the table is being fetcheds */}
			{!isNewBlock && tableIsResolving && <Spinner>Retrieving Table Data</Spinner>}

			{/* Show the form to identify and create a new table */}
			{isNewBlock && (
				<Placeholder
					label={__('Dynamic Table')}
					icon={<BlockIcon icon={icon} showColors />}
					instructions={__('Create a new dynamic table.')}
				>
					<form className="blocks-table__placeholder-form" onSubmit={onCreateTable}>
						<InputControl
							label={__('Table Name')}
							placeholder="New Table"
							required="true"
							onChange={e => setTableName(e)}
							value={tableName}
							className="blocks-table__placeholder-input"
						/>

						<NumberControl
							__nextHasNoMarginBottom
							label={__('Table Columns')}
							min={1}
							required="true"
							value={numColumns}
							onChange={e => onChangeInitialColumnCount(e)}
							className="blocks-table__placeholder-input"
						/>

						<NumberControl
							__nextHasNoMarginBottom
							label={__('Table Rows')}
							required="true"
							min={1}
							value={numRows}
							onChange={e => onChangeInitialRowCount(e)}
							className="blocks-table__placeholder-input"
						/>
						<Button className="blocks-table__placeholder-button" variant="primary" type="submit">
							{__('Create Table')}
						</Button>
					</form>
				</Placeholder>
			)}
		</div>
	);
}
