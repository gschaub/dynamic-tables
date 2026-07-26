/* Internal dependencies */
import { getDefaultCell, getDefaultColumn, getDefaultRow } from '../table-defaults';
import { numberToLetter, tableSort } from '../utils';

/**
 * Compare JSON-compatible values without depending on object property order.
 *
 * @since    1.4.5
 *
 * @param {*} left  First value
 * @param {*} right Second value
 * @return {boolean} Whether the values are equal
 */
function isDeepEqual(left, right) {
	if (Object.is(left, right)) {
		return true;
	}

	if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') {
		return false;
	}

	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
			return false;
		}

		return left.every((value, index) => isDeepEqual(value, right[index]));
	}

	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);

	if (leftKeys.length !== rightKeys.length) {
		return false;
	}

	return leftKeys.every(
		key => Object.prototype.hasOwnProperty.call(right, key) && isDeepEqual(left[key], right[key])
	);
}

/**
 * Project a local table into the entity shape used for comparison.
 *
 * @since    1.4.5
 *
 * @param {Object}        sourceTable Local table
 * @param {number|string} recordId    Entity record ID
 * @return {Object} Comparable entity-shaped value
 */
function tableToComparableEntityRecord(sourceTable, recordId = sourceTable?.table_id) {
	console.log('In atableToComparableEntityRecord');

	const {
		table_id,
		block_table_ref,
		table_status,
		post_id,
		table_name,
		attributes,
		classes,
		rows = [],
		columns = [],
		cells = [],
	} = sourceTable || {};

	const filteredRows = (Array.isArray(rows) ? rows : [])
		.filter(row => String(row?.row_id) !== '0')
		.map(row => ({ ...row }));

	const filteredColumns = (Array.isArray(columns) ? columns : [])
		.filter(column => String(column?.column_id) !== '0')
		.map(column => ({ ...column }));

	const transformedCells = (Array.isArray(cells) ? cells : [])
		.filter(cell => String(cell?.row_id) !== '0' && String(cell?.column_id) !== '0')
		.map(
			({
				table_id: cellTableId,
				column_id,
				row_id,
				attributes: cellAttributes,
				classes: cellClasses,
				content,
			}) => ({
				table_id: cellTableId,
				column_id,
				row_id,
				attributes: cellAttributes,
				classes: cellClasses,
				content: typeof content === 'boolean' ? String(content) : (content ?? ''),
			})
		);

	return {
		id: recordId,
		title: table_name,
		header: {
			id: table_id,
			block_table_ref,
			status: table_status,
			post_id,
			table_name,
			attributes,
			classes,
		},
		rows: filteredRows,
		columns: filteredColumns,
		cells: transformedCells,
	};
}

/**
 * Add editor-only border controls to a normalized local table.
 *
 * @since    1.4.5
 *
 * @param {Object} table Local table without border controls
 * @return {Object} Local table with border controls
 */
function addTableBorders(table) {
	console.log('addTableBorders');
	const tableId = table.table_id;
	const rows = table.rows.filter(row => String(row?.row_id) !== '0');
	const columns = table.columns.filter(column => String(column?.column_id) !== '0');
	const cells = table.cells.filter(
		cell => String(cell?.row_id) !== '0' && String(cell?.column_id) !== '0'
	);

	const columnIds = columns
		.map(column => Number(column.column_id))
		.filter(columnId => Number.isFinite(columnId) && columnId > 0)
		.sort((a, b) => a - b);

	const rowIds = rows
		.map(row => Number(row.row_id))
		.filter(rowId => Number.isFinite(rowId) && rowId > 0)
		.sort((a, b) => a - b);

	const borderCells = [
		getDefaultCell(tableId, 0, 0, 'Border'),
		...columnIds.map(columnId => getDefaultCell(tableId, columnId, 0, 'Border')),
		...rowIds.map(rowId => getDefaultCell(tableId, 0, rowId, 'Border')),
	];

	return {
		...table,
		rows: tableSort('rows', [...rows, getDefaultRow(tableId, 0, 'Border')]),
		columns: tableSort('columns', [...columns, getDefaultColumn(tableId, 0, 'Border')]),
		cells: tableSort('cells', [...cells, ...borderCells]),
	};
}

/**
 * Convert an edited core-data entity record into the local table-store shape.
 *
 * @since    1.4.5
 *
 * @param {Object}  entityRecord
 * @param {Object}  options
 * @param {boolean} options.includeBorders Whether editor-only borders should be regenerated
 * @return {Object|null} Local table or null for an invalid entity record
 */
export function entityRecordToTable(entityRecord, { includeBorders = false } = {}) {
	console.log('In entityRecordToTable');

	const header = entityRecord?.header || {};
	const tableId = header.id ?? entityRecord?.id;

	if (tableId === undefined || tableId === null) {
		return null;
	}

	const rows = (Array.isArray(entityRecord?.rows) ? entityRecord.rows : [])
		.filter(row => String(row?.row_id) !== '0')
		.map(row => ({ ...row }));

	const columns = (Array.isArray(entityRecord?.columns) ? entityRecord.columns : [])
		.filter(column => String(column?.column_id) !== '0')
		.map(column => ({ ...column }));

	const cells = (Array.isArray(entityRecord?.cells) ? entityRecord.cells : [])
		.filter(cell => String(cell?.row_id) !== '0' && String(cell?.column_id) !== '0')
		.map(cell => ({
			...cell,
			cell_id: numberToLetter(cell.column_id) + cell.row_id,
		}));

	const entityTitle =
		typeof entityRecord?.title === 'string'
			? entityRecord.title
			: (entityRecord?.title?.raw ?? entityRecord?.title?.rendered ?? '');

	const table = {
		table_id: tableId,
		block_table_ref: header.block_table_ref ?? '',
		table_status: header.status ?? '',
		post_id: header.post_id ?? '',
		table_name: header.table_name ?? entityTitle,
		attributes: header.attributes ?? {},
		classes: header.classes ?? '',
		rows,
		columns,
		cells,
	};

	return includeBorders ? addTableBorders(table) : table;
}

/**
 * Compare the canonical data in a local table and edited entity record.
 *
 * Both values are passed through the same persistence projection so
 * editor-only borders and cell identifiers do not create false differences.
 *
 * @since    1.4.5
 *
 * @param {Object} table        Local table
 * @param {Object} entityRecord Edited core-data entity record
 * @return {boolean} Whether the canonical table values match
 */
export function areTableAndEntityRecordsEqual(table, entityRecord) {
	console.log('In areTableAnd EntityRecordsEqual');
	const normalizedEntityTable = entityRecordToTable(entityRecord);

	if (!table || !normalizedEntityTable) {
		return false;
	}

	const recordId = entityRecord?.id ?? entityRecord?.header?.id;
	const currentRecord = tableToComparableEntityRecord(table, recordId);
	const nextRecord = tableToComparableEntityRecord(normalizedEntityTable, recordId);

	return isDeepEqual(currentRecord, nextRecord);
}
