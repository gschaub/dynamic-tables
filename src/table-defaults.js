/* Internal dependencies */
import { numberToLetter } from './utils';

/**
 * Create a new dynamic table
 *
 * @since    1.0.0
 *
 * @param {string} newBlockTableRef Block table cross reference unique string
 * @param {number} columnCount      Number of columns to include in the table
 * @param {number} rowCount         Number of rows to include in the table
 * @param {string} tableName        Name of the new table
 * @return  {Object} New Dynamic Table
 */
export function initTable(newBlockTableRef, columnCount, rowCount, tableName) {
	const tableCells = initTableCells(Number(columnCount), Number(rowCount));
	const rowArray = [];

	for (let i = 1; i <= rowCount; i++) {
		const row = getDefaultRow('0', i);
		rowArray.push(row);
	}

	const columnArray = [];

	for (let i = 1; i <= columnCount; i++) {
		const column = getDefaultColumn('0', i);
		columnArray.push(column);
	}

	const newTable = {
		table: {
			table_id: '0',
			block_table_ref: newBlockTableRef,
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
 *
 * @param {number} tableId     Table id to assign to row
 * @param {number} rowId       Row id to assign to row
 * @param {string} rowLocation Border or another value, default = body
 * @return  {Array} New table row
 */
export function getDefaultRow(tableId, rowId, rowLocation = 'Body') {
	let row;
	if (rowLocation === 'Border') {
		row = {
			table_id: String(tableId),
			row_id: String(rowId),
			attributes: getDefaultTableAttributes('rows', rowLocation),
			classes: getDefaultTableClasses('rows'),
		};
	} else {
		row = {
			table_id: String(tableId),
			row_id: String(rowId),
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
 *
 * @param {number} tableId        Table id to assign to column
 * @param {number} columnId       Column id to assign to column
 * @param {string} columnLocation Border or another value, default = body
 * @return  {Array} New table column
 */
export function getDefaultColumn(tableId, columnId, columnLocation = 'Body') {
	let column;
	if (columnLocation === 'Border') {
		column = {
			table_id: String(tableId),
			column_id: String(columnId),
			column_name: 'Border',
			attributes: getDefaultTableAttributes('columns', columnLocation),
			classes: '',
		};
	} else {
		column = {
			table_id: String(tableId),
			column_id: String(columnId),
			column_name: 'Comments',
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
			cell_id: rowId === 0 ? columnLetter + '0' : '0' + String(columnId),
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
		bandedTextColor: '#d8dbda',
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
	};

	const columnAttributes = {
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
