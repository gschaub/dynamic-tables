import { addQueryArgs } from '@wordpress/url';
import { apiFetch } from '@wordpress/data-controls';
import { addEntities, store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { loadTableEntityConfig } from './table-entity';
import TYPES from './action-types.js';

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
	RECEIVE_HYDRATE_TEST,
	PERSIST,
	PROCESS_BORDERS,
} = TYPES;

// loadTableEntityConfig()

/**
 * @example wp.data.dispatch( 'mfw/table').refreshPost
 * @example wp.data.dispatch( 'mfw/table' ).table
 *
 *
 *
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
		} = select.getTable('0', 'Saved');
		const testTable = select.getTable('0', false);
		console.log(testTable);
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
			alert('            ...Create Table Entity - async error - ' + error);
		}
	};

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

export const updateTableEntity =
	(tableId, overrideTableStatus = '') =>
	({ select, registry }) => {
		const testTable = select.getTable(tableId, false);
		console.log(testTable);
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

export const processDeletedTables =
	deletedTables =>
	({ dispatch, registry }) => {
		console.log('In Action processDeletedTables');
		Object.keys(deletedTables).forEach(key => {
			const deletedTableId = deletedTables[key].table_id;
			console.log(deletedTableId);
			dispatch.deleteTableEntity(deletedTables[key].table_id);
		});
	};

export const processUnmountedTables =
	unmountedTables =>
	({ dispatch, registry }) => {
		console.log('In Action processDeletedTables');
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

export const addColumn = (tableId, columnId, newColumn, columnCells) => {
	return {
		type: INSERT_COLUMN,
		tableId,
		columnId,
		newColumn,
		columnCells,
	};
};

export const addRow = (tableId, rowId, newRow, rowCells) => {
	return {
		type: INSERT_ROW,
		tableId,
		rowId,
		newRow,
		rowCells,
	};
};

export const removeColumn = (tableId, columnId) => {
	return {
		type: DELETE_COLUMN,
		tableId,
		columnId,
	};
};

export const removeRow = (tableId, rowId) => {
	return {
		type: DELETE_ROW,
		tableId,
		rowId,
	};
};

export const assignTableId = tableId => {
	console.log('In Action updateTableProp');
	return {
		type: CHANGE_TABLE_ID,
		tableId: '0',
		newTableId: String(tableId),
	};
};

export const updateTableProp = (tableId, attribute, value) => {
	console.log('In Action updateTableProp');
	return {
		type: UPDATE_TABLE_PROP,
		tableId: tableId,
		attribute,
		value,
	};
};

export const removeTableProp = (tableId, attribute) => {
	console.log('In Action removeTableProp');
	return {
		type: REMOVE_TABLE_PROP,
		tableId: tableId,
		attribute,
	};
};

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

// Hold in case needed
export function receiveTableTest(tableEntity) {
	console.log('            ...Action - In receiveTableTest');
	//console.log(table);
	// console.log('                - id: ' + table_id)
	//console.log('                - table: ' + JSON.stringify(table));
	//console.log('                - tableId ' + tableId);

	return {
		type: RECEIVE_HYDRATE_TEST,
		tableEntity,
		// tableTest: {
		//     testTable
		// }
	};
}
