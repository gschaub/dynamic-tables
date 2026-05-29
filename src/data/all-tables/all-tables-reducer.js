/* Internal dependencies */
import TYPES from './all-tables-action-types';

const { RECEIVE_HYDRATE_ALL_TABLES, UPDATE_SUMMARY_TABLE } = TYPES;

/**
 * Dynamic Table reducer helper for a single table.
 *
 * @since    3.1.2
 *
 * @param {Object} state  Current tables state
 * @param {Object} action Action activity to be performed
 * @return {Object} Updated tables state
 */
const reducer = (state = {}, action) => {
	switch (action.type) {
		case RECEIVE_HYDRATE_ALL_TABLES:
			return {
				...action.tables,
			};

		case UPDATE_SUMMARY_TABLE:
			return {
				...state,
				[action.tableId]: {
					...(state[action.tableId] || {}),
					...action.table,
				},
			};

		default:
			return state;
	}
};

export default reducer;
