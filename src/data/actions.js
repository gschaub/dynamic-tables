/* External dependencies */
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/* Internal dependencies */
import TYPES from './action-types.js';

/* Load constants */
const {
	CREATE_TABLE,
	INSERT_COLUMN,
	INSERT_ROW,
	DELETE_TABLE,
	DELETE_COLUMN,
	DELETE_ROW,
	CHANGE_TABLE_ID,
	UPDATE_TABLE_PROP,
	REMOVE_TABLE_PROP,
	UPDATE_ROW,
	UPDATE_COLUMN,
	UPDATE_CELL,
	RECEIVE_HYDRATE,
	PROCESS_BORDERS,
} = TYPES;

/**
 * Returns action object used in signalling a new table has been received
 * from UI.
 *
 * @since    1.0.0
 *
 * @param {Object} table Dynamic Table
 * @return  {Object} Action object
 */
export function receiveNewTable(table) {
	console.log('Receiving New Table');
	console.log(table);
	console.log(table.table.table_id);

	return {
		type: CREATE_TABLE,
		tableId: table.table.table_id,
		...table,
	};
}

/**
 * Returns action object used in signalling a new table has been received
 * from REST service.
 *
 * @since    1.0.0
 *
 * @param {number}       table_id        Identifier key for the table
 * @param {string}       block_table_ref Cross reference identified linking table to block within post
 * @param {string}       table_status    Status of retrieved table
 * @param {number}       post_id         Identifier key for the post in which the table appears
 * @param {string}       table_name      Descriptive name of table
 * @param {Array}        attributes      Table header level attributes
 * @param {string}       classes         Table header level classes
 * @param {Array|Object} rows            Array of table row objects
 * @param {Array|Object} columns         Array of table column objects
 * @param {Array|Object} cells           Array of table cell objects
 * @return {Object} Action object
 */
export function receiveTable(
	table_id,
	block_table_ref,
	table_status,
	post_id,
	table_name,
	attributes,
	classes,
	rows,
	columns,
	cells
) {
	console.log('            ...Action - In receiveTable');
	//console.log(table);
	console.log('                - id: ' + table_id);
	//console.log('                - table: ' + JSON.stringify(table));
	//console.log('                - tableId ' + tableId);
	console.log('Block Ref = ' + block_table_ref);
	console.log('Status = ' + table_status);

	return {
		type: RECEIVE_HYDRATE,
		tableId: table_id,
		table: {
			table_id,
			block_table_ref,
			table_status,
			post_id,
			table_name,
			attributes,
			classes,
			rows,
			columns,
			cells,
		},
	};
}

/**
 * Action to create WordPress Core-Data dynamic table entity based on local table.
 * persists the data as soon as the table is created, before post is saved/published.
 *
 * @since    1.0.0
 *
 * @return  {Object} Action object
 */
export const createTableEntity =
	() =>
	async ({ select, dispatch, registry }) => {
		const {
			table_id,
			block_table_ref,
			post_id,
			table_name,
			attributes,
			classes,
			rows,
			columns,
			cells,
		} = select.getTable('0', true);
		const newTable = {
			title: table_name,
			header: {
				id: table_id,
				block_table_ref: block_table_ref,
				status: 'new',
				post_id: post_id,
				table_name: table_name,
				attributes: attributes,
				classes: classes,
			},
			rows: [...rows],
			columns: [...columns],
			cells: [...cells],
		};

		console.log('CREATING TABLE ENTITY');
		console.log(newTable);

		try {
			const tableEntity = await registry
				.dispatch(coreStore)
				.saveEntityRecord('dynamic-tables', 'table', newTable);

			dispatch.assignTableId(tableEntity.id);

			return tableEntity.id;
		} catch (error) {
			console.log(
				'Error in createTableEntity -  Table ID - ' +
					table_id +
					', block table ref = ' +
					block_table_ref +
					', Post Id = ' +
					post_id
			);
		}
	};

/**
 * Action to save table entity changes that are required for processing
 * at time other than when the post is saved/published.
 *
 * @since    1.0.0
 *
 * @param {number} tableId Identifier key for the table
 * @return {Object} Action Object
 */
export const saveTableEntity =
	tableId =>
	({ registry }) => {
		console.log('SAVING TABLE ENTITY');

		try {
			registry.dispatch(coreStore).saveEditedEntityRecord('dynamic-tables', 'table', tableId);
		} catch (error) {
			console.log('Error in saveTableEntity - Table ID - ' + tableId);
			alert('            ...Save Table Entity - async error - ' + error);
		}
	};

/**
 * Update table entity based on changes made to local table updates.  This does
 * not persist changes, only queues them for when the post is saved/published.
 *
 * @since    1.0.0
 *
 * @param {*}      tableId                  Identifier key for the table
 * @param {string} [overrideTableStatus=''] Updates the table's status if populated
 * @return  {Object} Action Object
 */
export const updateTableEntity =
	(tableId, overrideTableStatus = '') =>
	({ select, registry }) => {
		const {
			table_id,
			block_table_ref,
			table_status,
			post_id,
			table_name,
			attributes,
			classes,
			rows,
			columns,
			cells,
		} = select.getTable(tableId, false);

		// Remove border row if it exists
		const filteredRows = rows.filter(row => row.row_id !== '0');

		// Remove border column if it exists
		const filteredColumns = columns.filter(column => column.column_id !== '0');

		// Remove border cells if they exists
		const filteredCells = cells.filter(cell => cell.row_id !== '0' && cell.column_id !== '0');

		// Remove cell_id from cells.  They don't go back to the webservice
		const transformedCells = filteredCells.map(
			({ table_id, column_id, row_id, attributes, classes, content }) => ({
				table_id,
				column_id,
				row_id,
				attributes,
				classes,
				content,
			})
		);

		const tableStatus = (overrideTableStatus, table_status) => {
			if (overrideTableStatus) {
				return overrideTableStatus;
			}
			return table_status;
		};

		const updatedTable = {
			id: tableId,
			title: table_name,
			header: {
				id: table_id,
				block_table_ref: block_table_ref,
				status: tableStatus(overrideTableStatus, table_status),
				post_id: post_id,
				table_name: table_name,
				attributes: attributes,
				classes: classes,
			},
			rows: [...filteredRows],
			columns: [...filteredColumns],
			cells: [...transformedCells],
		};

		console.log('UPDATING TABLE ENTITY');
		console.log(updatedTable);

		/**
		 * Options: isCached: Bool
		 *          undoIgnore: Bool
		 */
		try {
			registry
				.dispatch(coreStore)
				.editEntityRecord('dynamic-tables', 'table', table_id, updatedTable);
		} catch (error) {
			console.log('Error in updateTableEntity - Table ID - ' + tableId);
			alert('            ...Update Table Entity - async error - ' + error);
		}
	};

/**
 * Remove table entity.  The delete is persisted.
 *
 * @since    1.0.0
 *
 * @see      processDeletedTables
 *
 * @param {number} tableId Identifier key for the table
 * @return {Object} Action Object
 */
export const deleteTableEntity =
	tableId =>
	async ({ select, dispatch, registry }) => {
		console.log('In Action deleteTableEntity');

		try {
			const deletedTableEntity = await registry
				.dispatch(coreStore)
				.deleteEntityRecord('dynamic-tables', 'table', tableId);

			dispatch({
				type: DELETE_TABLE,
				tableId,
			});
		} catch (error) {
			console.log('Error in deleteTableEntity - Table ID - ' + tableId);
			alert('            ...Resolver - async error - ' + error);
		}
		console.log('            Resolver - async completed');
	};

/**
 * Signals a delete of table entities for all local tables with a status of 'deleted'.
 *
 * @since    1.0.0
 *
 * @param {Object} deletedTables Object of deleted tables
 * @return  {Object} Action object
 */
export const processDeletedTables =
	deletedTables =>
	({ dispatch }) => {
		console.log('In Action processDeletedTables');
		Object.keys(deletedTables).forEach(key => {
			const deletedTableId = deletedTables[key].table_id;
			console.log(deletedTableId);
			dispatch.deleteTableEntity(deletedTables[key].table_id);
		});
	};

/**
 * Searches for previously unbounted tables' block in post.  If found, remove block id
 * attribute. Otherwise, mark table with a deleted.
 *
 * @since    1.0.0
 *
 * @param {Object} unmountedTables Object of currently unmounted tables
 * @return  {Object} Action object
 */
export const processUnmountedTables =
	unmountedTables =>
	({ dispatch, registry }) => {
		console.log('In Action processUnmountedTables');
		Object.keys(unmountedTables).forEach(key => {
			const unmountedTableBlockId = unmountedTables[key].unmounted_blockid;
			const tableBlock = registry.select(blockEditorStore).getBlock(unmountedTableBlockId);
			console.log(tableBlock);
			if (tableBlock) {
				dispatch.removeTableProp(unmountedTables[key].table_id, 'unmounted_blockid');
				dispatch.updateTableProp(unmountedTables[key].table_id, 'table_status');
			} else {
				dispatch.removeTableProp(unmountedTables[key].table_id, 'unmounted_blockid');
				dispatch.updateTableProp(unmountedTables[key].table_id, 'table_status', 'deleted');
			}
		});
	};

/**
 * Signals the addition of a new table column.
 *
 * @since    1.0.0
 *
 * @param {number}       tableId     Identifier key for the table
 * @param {number}       columnId    Identifier for a table column
 * @param {Object}       newColumn   Column definition
 * @param {Array|Object} columnCells Cell definitions associated with the column
 * @return  {Object} Action object
 */
export const addColumn = (tableId, columnId, newColumn, columnCells) => {
	return {
		type: INSERT_COLUMN,
		tableId,
		columnId,
		newColumn,
		columnCells,
	};
};

/**
 * Signals the addition of a new table row.
 *
 * @since    1.0.0
 *
 * @param {number}       tableId  Identifier key for the table
 * @param {number}       rowId    Identifier for a table row
 * @param {Object}       newRow   Row definition
 * @param {Array|Object} rowCells Cell definitions associated with the row
 * @return  {Object} Action object
 */
export const addRow = (tableId, rowId, newRow, rowCells) => {
	return {
		type: INSERT_ROW,
		tableId,
		rowId,
		newRow,
		rowCells,
	};
};

/**
 * Signals the removal of a table column.
 *
 * @since    1.0.0
 *
 * @param {number} tableId  Identifier key for the table
 * @param {number} columnId Identifier for a table column
 * @return  {Object} Action object
 */
export const removeColumn = (tableId, columnId) => {
	return {
		type: DELETE_COLUMN,
		tableId,
		columnId,
	};
};

/**
 * Signals the removal of a table row.
 *
 * @since    1.0.0
 *
 * @param {number} tableId Identifier key for the table
 * @param {number} rowId   Identifier for a table row
 * @return {Object} Action object
 */
export const removeRow = (tableId, rowId) => {
	return {
		type: DELETE_ROW,
		tableId,
		rowId,
	};
};

/**
 * Signals the assignment of a table id following the creation of a new table.
 *
 * @since    1.0.0
 *
 * @param {number} tableId Identifier key for the table
 * @return  {Object} Action object
 */
export const assignTableId = tableId => {
	return {
		type: CHANGE_TABLE_ID,
		tableId: '0',
		newTableId: String(tableId),
	};
};

/**
 * Signal an update to a header level table attribute.
 *
 * @since    1.0.0
 *
 * @param {number}              tableId   Identifier key for the table
 * @param {string}              attribute attribute name
 * @param {string|number|Array} value     New value for the attribute
 * @return  {Object} Action object
 */
export const updateTableProp = (tableId, attribute, value) => {
	console.log('In Action updateTableProp');
	return {
		type: UPDATE_TABLE_PROP,
		tableId: tableId,
		attribute,
		value,
	};
};

/**
 * Signal the removal of a header level table attribute.
 *
 * @since    1.0.0
 *
 * @param {number} tableId   Identifier key for the table
 * @param {string} attribute attribute name
 * @return  {Object} Action object
 */
export const removeTableProp = (tableId, attribute) => {
	console.log('In Action removeTableProp');
	return {
		type: REMOVE_TABLE_PROP,
		tableId: tableId,
		attribute,
	};
};

/**
 * Signal an update to a row attribute/prop.
 *
 * @since    1.0.0
 *
 * @param {number}        tableId   Identifier key for the table
 * @param {number}        rowId     Identifier for a table row
 * @param {string}        attribute Type of prop (attributes, classes)
 * @param {Object|string} value     New value for the prop
 * @return  {Object} Action object
 */
export const updateRow = (tableId, rowId, attribute, value) => {
	console.log('In Action updateRow');
	return {
		type: UPDATE_ROW,
		tableId,
		rowId,
		attribute,
		value,
	};
};

/**
 * Signal an update to a row attribute/prop.
 *
 * @since    1.0.0
 *
 * @param {number}        tableId   Identifier key for the table
 * @param {number}        columnId  Identifier for a table column
 * @param {string}        attribute Type of prop (attributes, classes)
 * @param {Object|string} value     New value for the prop
 * @return  {Object} Action object
 */
export const updateColumn = (tableId, columnId, attribute, value) => {
	console.log('In Action updateColumn');
	return {
		type: UPDATE_COLUMN,
		tableId,
		columnId,
		attribute,
		value,
	};
};

/**
 * Signal an update to a cell attribute/prop.
 *
 * @since    1.0.0
 *
 * @param {number}        tableId   Identifier key for the table
 * @param {string}        cellId    Identifier for a table cell
 * @param {string}        attribute Type of prop (content, attributes, classes)
 * @param {Object|string} value     New value for the prop
 * @return {Object} Action object
 */
export const updateCell = (tableId, cellId, attribute, value) => {
	console.log('In Action updateCell');
	return {
		type: UPDATE_CELL,
		tableId,
		cellId,
		attribute,
		value,
	};
};

/**
 * Signal the addition or removal of table borders.
 *
 * @since    1.0.0
 *
 * @param {Array|Object} tableId
 * @param {Array|Object} tableRows    Array of table row objects
 * @param {Array|Object} tableColumns Array of table column objects
 * @param {Array|Object} tableCells   Array of table cell objects
 * @return  {Object} Action object
 */
export const updateTableBorder =
	(tableId, tableRows, tableColumns, tableCells) =>
	async ({ dispatch }) => {
		console.log('Updating Border');

		await dispatch({
			type: PROCESS_BORDERS,
			tableId: tableId,
			rows: tableRows,
			columns: tableColumns,
			cells: tableCells,
		});
	};
