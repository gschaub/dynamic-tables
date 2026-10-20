/* Internal dependencies */
import { numberToLetter, generateTablePartRef } from './utils';

/**
 * Create a new dynamic table
 *
 * @since 1.0.0
 * @since 1.4.9 - Bring user defined columns into table creation
 * @since 2.0.0 - Updates for schema version 2
 *
 * @param {string} newBlockTableRef Block table cross reference unique string
 * @param {string} tableType        Type assigned by this creation process
 * @param {number} columnCount      Number of columns to include in the table
 * @param {number} rowCount         Number of rows to include in the table
 * @param {string} tableName        Name of the new table
 * @param {Array}  columns          Table columns
 * @return  {Object} New Dynamic Table
 */
export function initTable(newBlockTableRef, tableType, columnCount, rowCount, tableName, columns) {
	const tableCells = initTableCells(Number(columnCount), Number(rowCount));
	const rowArray = [];
	const rowRefs = new Set();

	for (let i = 1; i <= rowCount; i++) {
		const row = getDefaultRow('0', i, 'Body', generateTablePartRef(rowRefs));
		rowArray.push(row);
	}

	const columnArray = [];
	const columnRefs = new Set();

	for (let i = 1; i <= columnCount; i++) {
		const column = getDefaultColumn('0', i, 'Body', generateTablePartRef(columnRefs));
		const columnInputName = columns[i - 1]?.column_name || '';
		column.column_name = columnInputName !== '' ? columnInputName : column.column_name;
		columnArray.push(column);
	}

	const newTable = {
		table: {
			table_id: '0',
			block_table_ref: newBlockTableRef,
			table_type: tableType,
			post_id: '0',
			table_status: 'new',
			table_name: tableName,
			attributes: getDefaultTableAttributes('table'),
			classes: getDefaultTableClasses('table'),
			rows: rowArray,
			columns: columnArray,
			cells: tableCells,
		},
	};

	return newTable;
}

/**
 * Build an array of table cells using default attribute values.
 *
 * @since    1.0.0
 *
 * @param {number} init_num_columns
 * @param {number} init_num_rows
 * @return  {Array} Array of cells associated with the new table
 */
export function initTableCells(init_num_columns, init_num_rows) {
	const tableCells = [];

	let x = 1;
	let y = 1;

	while (y <= init_num_rows) {
		while (x <= init_num_columns) {
			if (y == 1) {
				const cell = getDefaultCell('0', String(x), String(y));
				tableCells.push(cell);
			} else {
				const cell = getDefaultCell('0', String(x), String(y));
				tableCells.push(cell);
			}
			x++;
		}
		x = 1;
		y++;
	}
	return tableCells;
}

/**
 * Get a new row with default values.
 *
 * @since    1.0.0
 * @since    2.0.0 - Updates for schema version 2
 *
 * @param {number} tableId     Table id to assign to row
 * @param {number} rowId       Row id to assign to row
 * @param {string} rowLocation Border or another value, default = body
 * @param {string} rowRef      Stable reference for a persisted row
 * @return  {Array} New table row
 */
export function getDefaultRow(tableId, rowId, rowLocation = 'Body', rowRef) {
	let row;

	if (rowLocation !== 'Border' && (rowRef === undefined || rowRef === null)) {
		throw new TypeError('A persisted row requires rowRef');
	}

	if (rowLocation === 'Border') {
		row = {
			table_id: String(tableId),
			row_id: String(rowId),
			row_ref: '0',
			attributes: getDefaultTableAttributes('rows', rowLocation),
			classes: getDefaultTableClasses('rows'),
		};
	} else {
		row = {
			table_id: String(tableId),
			row_id: String(rowId),
			row_ref: String(rowRef),
			attributes: getDefaultTableAttributes('rows', rowLocation),
			classes: getDefaultTableClasses('rows'),
		};
	}
	return row;
}

/**
 * Get a new column with default values.
 *
 * @since    1.0.0
 * @since    1.4.9 - Updated default column name
 * @since    2.0.0 - Updates for schema version 2
 *
 * @param {number} tableId        Table id to assign to column
 * @param {number} columnId       Column id to assign to column
 * @param {string} columnLocation Border or another value, default = body
 * @param {string} columnRef      Stable reference for a persisted column
 * @return  {Array} New table column
 */
export function getDefaultColumn(tableId, columnId, columnLocation = 'Body', columnRef) {
	let column;

	if (columnLocation !== 'Border' && (columnRef === undefined || columnRef === null)) {
		throw new TypeError('A persisted column requires columnRef');
	}

	if (columnLocation === 'Border') {
		column = {
			table_id: String(tableId),
			column_id: String(columnId),
			column_ref: '0',
			column_name: 'Border Column ' + String(columnId),
			attributes: getDefaultTableAttributes('columns', columnLocation),
			classes: '',
		};
	} else {
		column = {
			table_id: String(tableId),
			column_id: String(columnId),
			column_ref: String(columnRef),
			column_name: 'Column ' + numberToLetter(Number(columnId)),
			attributes: getDefaultTableAttributes('columns', columnLocation),
			classes: getDefaultTableClasses('columns'),
		};
	}
	return column;
}

/**
 * Get a new cell with default values.
 *
 * @since    1.0.0
 *
 * @param {number} tableId      Table id to assign to cell
 * @param {number} columnId     Column id to assign to column
 * @param {number} rowId        Row id to assign to row
 * @param {string} cellLocation Border or another value, default = body
 * @return {Array} New table cell
 */
export function getDefaultCell(tableId, columnId, rowId, cellLocation = 'Body') {
	let cell;
	const columnLetter = numberToLetter(columnId);
	const borderContent = rowId == 0 ? columnLetter : String(rowId);

	if (cellLocation === 'Border') {
		cell = {
			table_id: String(tableId),
			column_id: String(columnId),
			row_id: String(rowId),
			cell_id: rowId === 0 ? columnLetter + '0' : '0' + String(rowId),
			attributes: getDefaultTableAttributes('cells', cellLocation),
			classes: 'grid-control__border-cells hover',
			content: borderContent,
		};
	} else {
		cell = {
			table_id: String(tableId),
			column_id: String(columnId),
			row_id: String(rowId),
			cell_id: columnLetter + rowId,
			attributes: getDefaultTableAttributes('cells', cellLocation),
			classes: getDefaultTableClasses('cells'),
			content: '',
		};
	}
	return cell;
}

/**
 * Get default attributes for a specific table part.
 *
 * @since    1.0.0
 * @since    1.4.7 Add title tag and front end options
 *
 * @param {string} tableComponent    table header, rows, column, cell
 * @param {string} componentLocation Border or another value, default = body
 * @return {Object} Attributes
 */
export function getDefaultTableAttributes(tableComponent, componentLocation = 'Body') {
	const tableBaseAttributes = {
		showGridLines: true,
		bandedRows: false,
		bandedRowBackgroundColor: '#d8dbda',
		bandedTextColor: 'black',
		gridLineWidth: 1,
		allowHorizontalScroll: true,
		enableHeaderRow: false,
		headerAlignment: 'center',
		headerRowSticky: false,
		headerBorder: { color: 'black', style: 'solid', width: '1px' },
		horizontalAlignment: 'none',
		bodyAlignment: undefined,
		bodyBorder: { color: 'black', style: 'solid', width: '1px' },
		verticalAlignment: 'none',
		hideTitle: true,
		titleTagElement: 'p',
		frontEndOptions: {
			renderMode: 'table',
			listItemStyleType: '',
			allowFiltering: true,
			allowSorting: true,
			allowEditing: false,
		},
	};

	const columnAttributes = {
		columnDataType: { type: 'general' },
		columnWidthType: 'Proportional',
		minWidth: 2,
		minWidthUnits: 'ch',
		maxWidth: 1,
		maxWidthUnits: 'fr',
		fixedWidth: 1,
		fixedWidthUnits: 'fr',
		disableForTablet: false,
		disableForPhone: false,
		isFixedLeftColumnGroup: false,
		horizontalAlignment: 'none',
	};

	const columnBorderAttributes = {
		columnDataType: { type: 'border' },
		columnWidthType: 'Fixed',
		minWidth: 0,
		minWidthUnits: '',
		maxWidth: 0,
		maxWidthUnits: '',
		fixedWidth: 28,
		fixedWidthUnits: 'px',
		disableForTablet: false,
		disableForPhone: false,
		isFixedLeftColumnGroup: false,
		horizontalAlignment: 'center',
	};

	const rowAttributes = {
		rowHeightType: 'Auto',
		minHeight: 0,
		minHeightUnits: 'em',
		maxHeight: 0,
		maxHeightUnits: 'em',
		fixedHeight: 0,
		fixedHeightUnits: 'em',
		isHeader: false,
		verticalAlignment: 'none',
	};

	const rowBorderAttributes = {
		rowHeightType: 'Auto',
		minHeight: 0,
		minHeightUnits: 'em',
		maxHeight: 0,
		maxHeightUnits: 'em',
		fixedHeight: 0,
		fixedHeightUnits: 'em',
		isHeader: false,
		verticalAlignment: 'none',
	};

	const cellAttributes = {
		border: false,
		value: { indexText: '' },
	};

	const cellBorderAttributes = {
		border: true,
	};

	switch (tableComponent) {
		case 'table':
			return tableBaseAttributes;
		case 'columns':
			if (componentLocation === 'Border') {
				return columnBorderAttributes;
			}
			return columnAttributes;
		case 'rows':
			if (componentLocation === 'Border') {
				return rowBorderAttributes;
			}
			return rowAttributes;
		case 'cells':
			if (componentLocation === 'Border') {
				return cellBorderAttributes;
			}
			return cellAttributes;
	}
}

/**
 * Get default classes for a specific table part.
 *
 * @since    1.0.0
 *
 * @param {string} tableComponent table header, rows, column, cell
 * @return  {string} Classes
 */
export function getDefaultTableClasses(tableComponent) {
	const tableBaseClasses = '';

	const columnClasses = '';

	const rowClasses = '';

	const cellClasses = '';

	switch (tableComponent) {
		case 'table':
			return tableBaseClasses;
		case 'columns':
			return columnClasses;
		case 'rows':
			return rowClasses;
		case 'cells':
			return cellClasses;
	}
}
