/* External dependencies */
import { store as coreStore } from '@wordpress/core-data';
import { computeCellIds } from '../utils';

/**
 * Requests a table's record from the REST API.
 *
 * @since    1.0.0
 *
 * @param {number}  tableId      Identifier key for the table
 * @param {boolean} isTableStale Whether the current state is stale
 */
export const getTable =
	(tableId, isTableStale) =>
	async ({ dispatch, registry }) => {
		if (!isTableStale || tableId == '0') {
			return;
		}

		try {
			const tableEntity = await registry
				.resolveSelect(coreStore)
				.getEntityRecord('dynamic-table-blocks', 'table', tableId);

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
		} catch (error) {
			console.log('Error in getTable - Table ID = ' + tableId);
			alert('            ...Resolver - async error - ' + JSON.stringify(error, null, 4));
		}
	};
