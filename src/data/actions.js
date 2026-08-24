/* External dependencies */
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticeStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/* Internal dependencies */
import TYPES from './action-types.js';
import { showMessageNotice } from '../messages';
import { computeCellIds } from '../utils';
import { isDeepEqual } from './table-entity-adapter';

/* Load constants */
const {
	CREATE_TABLE,
	INSERT_COLUMN,
	INSERT_ROW,
	DELETE_TABLE,
	DELETE_COLUMN,
	DELETE_ROW,
	MOVE_COLUMN,
	MOVE_ROW,
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
 * Signals that table needs to be cloned, setting the table_id to zero and providng
 * a new table postId and blockTableRef.
 *
 * @since    1.1.0
 *
 * @param {*} tableId
 * @param {*} postId
 * @param {*} blockTableRef
 * @return {Object} Action object
 */
export const cloneTable =
	(tableId, postId, blockTableRef) =>
	async ({ select, dispatch, registry }) => {
		const { table_name, attributes, classes, rows, columns, cells } = select.getTable(
			tableId,
			true
		);

		const rowsWithResetId = [];
		const columnsWithResetId = [];
		const cellsWithResetId = [];

		rows.forEach(row => {
			const cloneRow = {
				...row,
				table_id: '0',
			};
			rowsWithResetId.push(cloneRow);
		});

		columns.forEach(column => {
			const cloneColumn = {
				...column,
				table_id: '0',
			};
			columnsWithResetId.push(cloneColumn);
		});

		cells.forEach(cell => {
			const cloneCell = {
				...cell,
				table_id: '0',
			};
			cellsWithResetId.push(cloneCell);
		});

		const newTable = {
			title: table_name,
			header: {
				id: '0',
				block_table_ref: blockTableRef,
				status: 'new',
				post_id: postId,
				table_name: table_name,
				attributes: attributes,
				classes: classes,
			},
			rows: [...rowsWithResetId],
			columns: [...columnsWithResetId],
			cells: [...cellsWithResetId],
		};

		try {
			const tableEntity = await registry
				.dispatch(coreStore)
				.saveEntityRecord('dynamic-table-blocks', 'table', newTable);

			const table = tableEntity;
			const table_id = table.id;
			const block_table_ref = table.header.block_table_ref;
			const table_status = table.header.status;
			const post_id = table.header.post_id;
			const table_name = table.header.table_name;
			const attributes = table.header.attributes;
			const classes = table.header.classes;
			const rows = table.rows;
			const columns = table.columns;
			computeCellIds(table.cells);
			const cells = table.cells;

			dispatch.receiveTable(
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
			);
			return tableEntity.id;
		} catch (error) {
			console.error('Error in cloneTable', error);
			throw error;
		}
	};

/**
 * Action to create WordPress Core-Data dynamic table entity based on local table.
 * persists the data as soon as the table is created, before post is saved/published.
 *
 * @since    1.0.0
 *
 * @return  {Object} Action object
 */
export const createTableEntity =
	(tableIdToCreate = '0') =>
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
		} = select.getTable(tableIdToCreate, true);
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

		try {
			const tableEntity = await registry
				.dispatch(coreStore)
				.saveEntityRecord('dynamic-table-blocks', 'table', newTable);

			dispatch.assignTableId(tableEntity.id);
			return tableEntity.id;
		} catch (error) {
			console.error('Error in createTableEntity', error);
			throw error;
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
	async ({ registry }) => {
		const editedTableData = registry
			.select(coreStore)
			.getEditedEntityRecord('dynamic-table-blocks', 'table', tableId);

		try {
			return await registry
				.dispatch(coreStore)
				.saveEditedEntityRecord('dynamic-table-blocks', 'table', tableId);
		} catch (error) {
			console.error('Error in saveTableEntity - Table ID - ' + tableId, error);
			throw error;
		}
	};

/**
 * Update table entity based on changes made to local table updates.  This does
 * not persist changes, only queues them for when the post is saved/published.
 *
 * @since    1.0.0
 * @since    1.4.5 - Add undo/redo support
 *
 * @param {*}                         tableId                    Identifier key for the table
 * @param {string}                    [overrideTableStatus]      Updates the table's status if populated
 * @param {Object|null}               [tableOverride]            Optionally uses this source table
 * @param {Object}                    [options]                  Entity update options
 * @param {'record'|'cache'|'ignore'} [options.history='record'] Undo history behavior
 * @return  {Object} Action Object
 */
export const updateTableEntity =
	(tableId, overrideTableStatus = '', tableOverride = null, { history = 'record' } = {}) =>
	({ select, registry }) => {
		const sourceTable = tableOverride || select.getTable(tableId, false);

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
		} = sourceTable;

		const safeRows = Array.isArray(rows) ? rows : [];
		const safeColumns = Array.isArray(columns) ? columns : [];
		const safeCells = Array.isArray(cells) ? cells : [];

		// Remove border row if it exists
		const filteredRows = safeRows.filter(row => row.row_id !== '0');

		// Remove border column if it exists
		const filteredColumns = safeColumns.filter(column => column.column_id !== '0');

		// Remove border cells if they exists
		const filteredCells = safeCells.filter(cell => cell.row_id !== '0' && cell.column_id !== '0');

		// Remove cell_id from cells. They don't go back to the webservice
		const transformedCells = filteredCells.map(
			({ table_id, column_id, row_id, attributes, classes, content }) => ({
				table_id,
				column_id,
				row_id,
				attributes,
				classes,
				content: typeof content === 'boolean' ? String(content) : (content ?? ''),
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

		/**
		 * Options: isCached: Coalesce a series of updates, default false
		 *          undoIgnore: default false
		 */
		try {
			let entityEditOptions = {};

			switch (history) {
				case 'record':
					break;

				case 'cache':
					entityEditOptions = {
						isCached: true,
					};
					break;

				case 'ignore':
					entityEditOptions = {
						undoIgnore: true,
					};
					break;

				default:
					throw new Error(`Unsupported entity history mode: ${history}`);
			}

			const currentEntity = registry
				.select(coreStore)
				.getEditedEntityRecord('dynamic-table-blocks', 'table', table_id);
			const currentEntityTitle =
				typeof currentEntity?.title === 'string'
					? currentEntity.title
					: (currentEntity?.title?.raw ?? currentEntity?.title?.rendered ?? '');
			const comparableCurrentEntity = currentEntity
				? {
						...currentEntity,
						title: currentEntityTitle,
					}
				: {};

			/* Limit entity and persistence updates to specific changes rather than replacing the
			 * the entire table content
			 */
			const entityEdits = Object.entries(updatedTable).reduce((edits, [key, value]) => {
				if (key !== 'id' && !isDeepEqual(comparableCurrentEntity[key], value)) {
					edits[key] = value;
				}

				return edits;
			}, {});

			if (Object.keys(entityEdits).length === 0) {
				return;
			}

			return registry
				.dispatch(coreStore)
				.editEntityRecord(
					'dynamic-table-blocks',
					'table',
					table_id,
					entityEdits,
					entityEditOptions
				);
		} catch (error) {
			console.error('Error in updateTableEntity - Table ID - ' + table_id, error);
			showMessageNotice(registry.dispatch(noticeStore).createNotice, 'update-entity-error');
			return false;
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
	async ({ dispatch, registry }) => {
		try {
			await registry
				.dispatch(coreStore)
				.deleteEntityRecord('dynamic-table-blocks', 'table', tableId);

			dispatch({
				type: DELETE_TABLE,
				tableId,
			});
		} catch (error) {
			console.error('Error in deleteTableEntity - Table ID - ' + tableId, error);
			throw error;
		}
	};

/**
 * Signals a delete of table entities for all local tables with a status of 'deleted'.
 *
 * @since   1.0.0
 * @since   1.4.8  Address bug that incorrectly deletes blocks that have unmounted
 *
 * A block can temporarily unmount while Gutenberg replaces or restores blocks.
 * Recheck the current block tree immediately before deleting so a stale unmount
 * classification cannot remove a table that has since remounted.
 *
 * @param {Object} deletedTables Object of deleted tables
 * @return  {Object} Action object
 */
export const processDeletedTables =
	deletedTables =>
	async ({ dispatch, registry }) => {
		const stillMountedTables = Object.values(deletedTables).filter(table =>
			hasDynamicTableBlock(registry, table)
		);

		stillMountedTables.forEach(table => {
			console.warn('[DTBK] Cancelled pending table deletion because the block is still mounted.', {
				tableId: table.table_id,
				blockTableRef: table.block_table_ref,
				priorStatus: table.prior_status,
			});
		});

		const tablesToDelete = Object.values(deletedTables).filter(
			table => !hasDynamicTableBlock(registry, table)
		);

		const restoreResults = await Promise.allSettled(
			stillMountedTables.map(async table => {
				const tableId = table.table_id;
				const restoredStatus = table.prior_status || 'saved';

				dispatch.updateTableProp(tableId, 'table_status', restoredStatus);
				dispatch.removeTableProp(tableId, 'prior_status');
				dispatch.updateTableEntity(tableId, restoredStatus, undefined, {
					history: 'ignore',
				});
				await dispatch.saveTableEntity(tableId);
			})
		);

		const failedRestores = restoreResults.filter(result => result.status === 'rejected');
		if (failedRestores.length > 0) {
			throw failedRestores[0].reason;
		}

		const deleteResults = await Promise.allSettled(
			tablesToDelete.map(table => dispatch.deleteTableEntity(table.table_id))
		);

		const failedDeletes = deleteResults.filter(result => result.status === 'rejected');

		if (failedDeletes.length > 0) {
			throw failedDeletes[0].reason;
		}
	};

/**
 * Searches for previously unmounted tables block in post.  If found, remove block id
 * attribute. Otherwise, mark table with a deleted.
 *
 * @since    1.0.0
 * @since    1.1.0  Refactored to use table_id and block_table_ref for matching
 * @since    1.4.5  Add support for undo/redo management
 *
 * @param {Object} unmountedTables Object of currently unmounted tables
 * @return  {Object} Action object
 */
export const processUnmountedTables =
	unmountedTables =>
	async ({ dispatch, registry }) => {
		const results = await Promise.allSettled(
			Object.keys(unmountedTables).map(async key => {
				const priorStatus = unmountedTables[key].prior_status;
				const isBlockPattern = unmountedTables[key].isPattern ? true : false;

				// Search all blocks to find a match for this unmounted table block.
				const tableBlock = hasDynamicTableBlock(registry, unmountedTables[key]);

				if (tableBlock) {
					dispatch.updateTableProp(unmountedTables[key].table_id, 'table_status', priorStatus);
					dispatch.removeTableProp(unmountedTables[key].table_id, 'prior_status');
					dispatch.removeTableProp(unmountedTables[key].table_id, 'unmounted_block');
					dispatch.updateTableEntity(unmountedTables[key].table_id, undefined, undefined, {
						history: 'ignore',
					});
					await dispatch.saveTableEntity(unmountedTables[key].table_id);
				} else if (isBlockPattern) {
					dispatch.removeTableProp(unmountedTables[key].table_id, 'isPattern');
					dispatch.updateTableEntity(unmountedTables[key].table_id, undefined, undefined, {
						history: 'ignore',
					});
					await dispatch.saveTableEntity(unmountedTables[key].table_id);
				} else {
					dispatch.updateTableProp(unmountedTables[key].table_id, 'table_status', 'deleted');
					dispatch.removeTableProp(unmountedTables[key].table_id, 'unmounted_block');
					dispatch.updateTableEntity(unmountedTables[key].table_id, 'deleted', undefined, {
						history: 'ignore',
					});
					await dispatch.saveTableEntity(unmountedTables[key].table_id);
				}
			})
		);
		const failed = results.filter(result => result.status === 'rejected');
		if (failed.length > 0) {
			throw failed[0].reason;
		}
	};

/**
 * Find your Dynamic Tables block by a stable key (block_table_ref) or fallback (table_id).
 *
 * @since    1.0.0
 *
 * @param {Object} registry      - Redux registry
 * @param {Object} tableStateRow - Unmounted table
 * @return {Object|null} block
 */
const hasDynamicTableBlock = (registry, tableStateRow) => {
	const tableId = tableStateRow.table_id;
	const blockTableRef = tableStateRow.block_table_ref;

	if (!blockTableRef || tableId === undefined || tableId === null) {
		return false;
	}

	const allBlocks = registry.select(blockEditorStore).getBlocks();
	return blockTreeHasMatch(
		allBlocks,
		b =>
			b?.name === 'dynamic-table-blocks/dynamic-table-blocks' &&
			b?.attributes?.block_table_ref === blockTableRef &&
			Number(b?.attributes?.table_id) === Number(tableId)
	);
};

const blockTreeHasMatch = (blocks, predicate) => {
	for (const block of blocks) {
		if (predicate(block)) {
			return true;
		}

		if (block.innerBlocks?.length) {
			if (blockTreeHasMatch(block.innerBlocks, predicate)) {
				return true;
			}
		}
	}
	return false;
};

/**
 * Signals the removal of a table from the state tree only. The underlying table
 * remains persisted in the database.
 *
 * @since    1.0.0
 *
 * @param {number} tableId
 * @return {Object} Action object
 */
export const removeTableBlock = tableId => {
	return {
		type: DELETE_TABLE,
		tableId,
	};
};

/**
 * Signals the addition of a new table column.
 *
 * @since    1.0.0
 * @since    1.2.2  Added support to insert column either left or right of the current column
 *
 * @param {number}       tableId     Identifier key for the table
 * @param {number}       columnId    Identifier for a table column
 * @param {string}       direction   Add row above or below current row
 * @param {Object}       newColumn   Column definition
 * @param {Array|Object} columnCells Cell definitions associated with the column
 * @return  {Object} Action object
 */
export const addColumn = (tableId, columnId, direction, newColumn, columnCells) => {
	return {
		type: INSERT_COLUMN,
		tableId,
		columnId,
		direction,
		newColumn,
		columnCells,
	};
};

/**
 * Signals the addition of a new table row.
 *
 * @since    1.0.0
 * @since    1.2.2  Added support to insert row either above or below the current row
 *
 * @param {number}       tableId   Identifier key for the table
 * @param {number}       rowId     Identifier for a table row
 * @param {string}       direction Add row above or below current row
 * @param {Object}       newRow    Row definition
 * @param {Array|Object} rowCells  Cell definitions associated with the row
 * @return  {Object} Action object
 */
export const addRow = (tableId, rowId, direction, newRow, rowCells) => {
	return {
		type: INSERT_ROW,
		tableId,
		rowId,
		direction,
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
 * Signals the move of a new table row (up or down).
 *
 * @since    1.2.2
 *
 * @param {number} tableId   Identifier key for the table
 * @param {number} columnId  Identifier for a table row
 * @param {string} direction Move row up or down
 * @return  {Object} Action object
 */
export const moveColumn = (tableId, columnId, direction) => {
	return {
		type: MOVE_COLUMN,
		tableId,
		columnId,
		direction,
	};
};

/**
 * Signals the move of a new table row (up or down).
 *
 * @since    1.2.2
 *
 * @param {number} tableId   Identifier key for the table
 * @param {number} rowId     Identifier for a table row
 * @param {string} direction Move row up or down
 * @return  {Object} Action object
 */
export const moveRow = (tableId, rowId, direction) => {
	return {
		type: MOVE_ROW,
		tableId,
		rowId,
		direction,
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
	return {
		type: UPDATE_ROW,
		tableId,
		rowId,
		attribute,
		value,
	};
};

/**
 * Signal an update to a column attributes.
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
		await dispatch({
			type: PROCESS_BORDERS,
			tableId: tableId,
			rows: tableRows,
			columns: tableColumns,
			cells: tableCells,
		});
	};
