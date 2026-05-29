/* External dependencies */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Fetch summary tables from the REST API and normalize them for the allTables store.
 *
 * @since 3.1.2
 *
 * @return {Promise<Object>} Summary tables keyed by table id
 */
export async function fetchSummaryTablesFromApi() {
	const path = addQueryArgs('/dynamic-table-blocks/v1/tables', {
		context: 'view',
		status: ['saved', 'new', 'loaded'],
	});

	const tableSummaries = await apiFetch({ path });

	return tableSummaries.reduce((allTables, { id, header = {}, column_structures = [] }) => {
		allTables[id] = {
			table_id: id,
			block_table_ref: header.block_table_ref,
			table_status: header.status,
			post_id: header.post_id,
			table_name: header.table_name,
			total_rows: header.total_rows,
			total_columns: header.total_columns,
			columns: column_structures,
		};

		return allTables;
	}, {});
}

/**
 * Overlay local unsaved and deleted table state onto fetched summary tables.
 *
 * This keeps the summary picker accurate before post save finishes by preserving
 * local "new" and "deleted" state that may not yet exist in the REST response.
 *
 * @since 3.1.2
 *
 * @param {Object} tables             API summary tables
 * @param {Object} args               Local overlay state
 * @param {Object} args.unsavedTables Local tables with unsaved changes
 * @param {Object} args.deletedTables Local deleted tables that have not been saved
 * @return {Object} Reconciled summary tables
 */
export function reconcileSummaryTablesWithLocalState(
	tables,
	{ unsavedTables = {}, deletedTables = {} } = {}
) {
	const reconciledTables = { ...tables };

	Object.values(unsavedTables).forEach(
		({ table_id, block_table_ref, table_status, post_id, table_name, rows = [], columns = [] }) => {
			const summaryRows = rows.filter(({ row_id }) => Number(row_id) !== 0);
			const summaryColumns = columns.filter(({ column_id }) => Number(column_id) !== 0);

			reconciledTables[table_id] = {
				...(reconciledTables[table_id] || {}),
				table_id,
				block_table_ref,
				table_status,
				post_id,
				table_name,
				total_rows: summaryRows.length,
				total_columns: summaryColumns.length,
				columns: summaryColumns,
			};
		}
	);

	Object.values(deletedTables).forEach(({ table_id }) => {
		delete reconciledTables[table_id];
	});

	return reconciledTables;
}
