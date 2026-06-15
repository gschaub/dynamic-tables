/* Internal dependencies */
import TYPES from './all-tables-action-types.js';
import { fetchSummaryTablesFromApi, reconcileSummaryTablesWithLocalState } from './all-tables-apis.js';

/* Load constants */
const { RECEIVE_HYDRATE_ALL_TABLES, UPDATE_SUMMARY_TABLE } = TYPES;

/**
 * Returns action object used in signalling a tables have been received
 * from REST service.
 *
 * @since 1.4.0
 *
 * @param {Array|Object} allTables Payload from dynamic tables API
 * @return {Object} Action object
 */
export const receiveSummaryTables = allTables => {
	return {
		type: RECEIVE_HYDRATE_ALL_TABLES,
		tables: allTables,
	};
};

/**
 * Update a single summary-table record in the allTables store.
 *
 * @since 3.1.2
 *
 * @param {Object} table Partial or full summary table payload
 * @return {Object} Action object
 */
export const updateSummaryTable = table => {
	return {
		type: UPDATE_SUMMARY_TABLE,
		tableId: Number(table.table_id),
		table,
	};
};

/**
 * Explicitly refresh summary tables from the REST API.
 *
 * This is intended for imperative refresh points such as post save, opening the
 * existing-table picker, regaining browser focus, or periodic refreshes.
 *
 * @since 3.1.2
 *
 * @return {Object} Action object
 */
export const refreshSummaryTables =
	() =>
	async ({ dispatch, select }) => {
		try {
			const tables = await fetchSummaryTablesFromApi();
			const reconciledTables = reconcileSummaryTablesWithLocalState(tables, {
				unsavedTables: select.getUnsavedTables(),
				deletedTables: select.getDeletedTables(),
			});

			dispatch.receiveSummaryTables(reconciledTables);
			return reconciledTables;
		} catch (error) {
			console.log('Error in refreshSummaryTables', error);
			throw error;
		}
	};
