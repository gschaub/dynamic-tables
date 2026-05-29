/**
 * Retrieve the current cached state of all tables in summary format.
 * the table from the REST api.
 *
 * @since    1.3.2
 *
 * @param {Object}  state          Current state of tables
 * @param {boolean} areTablesStale Should fresh data be fetch from API?
 * @return {Object} Requested Table
 */
export function getSummaryTables(state, areTablesStale = false) {
	return state.allTables;
}
