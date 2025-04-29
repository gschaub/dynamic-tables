/**
 * Retrieve the current state of a single table by table id.  If stale, refresh
 * the table from the REST api.
 *
 * @since    1.0.0
 *
 * @param {Object}  state        Current state of tables
 * @param {number}  tableId      Identifier key for the table
 * @param {boolean} isTableStale Should fresh data be fetch from API?
 * @return {Object} Requested Table
 */
export function getTable(state, tableId, isTableStale) {
	console.log('Selector...GetTable ' + tableId);
	console.log('        ...Current Table Stale ' + isTableStale);
	console.log(state);

	if (!state.tables.hasOwnProperty(tableId)) {
		console.log('State not defined');
		return {
			table_id: tableId,
			block_table_ref: '',
			post_id: '',
			table_status: '',
			table_name: '',
			attributes: [],
			classes: '',
			rows: [],
			columns: [],
			cells: [],
		};
	}
	return state.tables[tableId];
}

/**
 * Retrieve the current state of a all tables (table blocks) in the post.
 *
 * @since    1.0.0
 *
 * @param {Object} state Current state of tables
 * @return {Object} All tables
 */
export function getTables(state) {
	return state.tables;
}

/**
 * Retrieve the current state of a single table by the block's cross reference key.
 *
 * @since    1.0.0
 *
 * @param {Object} state           Current state of tables
 * @param {string} block_table_ref Cross refernece from block to identify table
 * @return {number} Table id of requested table
 */
export function getTableIdByBlock(state, block_table_ref) {
	const newTable = Object.keys(state.tables).reduce((acc, key) => {
		if (state.tables[key]?.block_table_ref === block_table_ref) {
			console.log({ ...state.tables[key]?.block_table_ref });
			acc[key] = { ...state.tables[key] };
		}
		return acc;
	}, {});

	if (newTable.length === 0) {
		return false;
	}
	return Object.keys(newTable);
}

/**
 * Return all tables that are associated with unmounted blocks
 *
 * @param {*} state
 * @returns
 */
/**
 * Get all tables associated with unmounted blocks.
 *
 * @since    1.0.0
 *
 * @param {Object} state Current state of tables
 * @return {Object} Unmounted tables
 */
export function getUnmountedTables(state) {
	console.log(state.tables);
	const unmountedTables = Object.keys(state.tables).reduce((acc, key) => {
		if (state.tables[key].unmounted_blockid) {
			acc[key] = { ...state.tables[key] };
		}
		return acc;
	}, {});
	return unmountedTables;
}

/**
 * Get all tables with a status of 'deleted'.
 *
 * @since    1.0.0
 *
 * @param {Object} state Current state of tables
 * @return {Object} Deleted tables
 */
export function getDeletedTables(state) {
	const deletedTables = Object.keys(state.tables).reduce((acc, key) => {
		console.log(state.tables[key].table_status);
		if (state.tables[key].table_status === 'deleted') {
			acc[key] = { ...state.tables[key] };
		}
		return acc;
	}, {});
	return deletedTables;
}

/**
 * Get all tables with a status of 'new'.  There should theoretically only be one
 * at any time.
 *
 * @since    1.0.0
 *
 * @param {Object} state Current state of tables
 * @return {Object} New tables
 */
export function getUnsavedTables(state) {
	const newTables = Object.keys(state.tables).reduce((acc, key) => {
		console.log(state.tables[key].table_status);
		if (state.tables[key].table_status === 'new') {
			acc[key] = { ...state.tables[key] };
		}
		return acc;
	}, {});
	return newTables;
}
