/* Internal dependencies */
import {
	fetchSummaryTablesFromApi,
	reconcileSummaryTablesWithLocalState,
} from './all-tables-apis.js';

/**
 * Requests a summary tables from the REST API.
 *
 * @since    1.4.0
 *
 * @param {boolean} areTablesStale Whether the current state is stale
 */
export const getSummaryTables =
	areTablesStale =>
	async ({ dispatch, select }) => {
		if (!areTablesStale) {
			return;
		}

		try {
			const tables = await fetchSummaryTablesFromApi();
			const reconciledTables = reconcileSummaryTablesWithLocalState(tables, {
				unsavedTables: select.getUnsavedTables(),
				deletedTables: select.getDeletedTables(),
			});

			dispatch.receiveSummaryTables(reconciledTables);
		} catch (error) {
			console.log('Error in getSummaryTables', error);
		}
	};
