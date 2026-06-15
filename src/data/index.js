/* External dependencies */
import { createReduxStore, register } from '@wordpress/data';

/* Internal dependencies */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';

import {
	actions as allTablesActions,
	selectors as allTablesSelectors,
	resolvers as allTablesResolvers,
} from './all-tables';

import STORE_NAME from './constants';

/**
 * Create Dynamic Tables store.
 *
 * @since    1.0.0
 * @since    1.4.0  Added support for combined reducers
 *
 * @type     {Object} Wordpress block store
 */
export const store = createReduxStore(STORE_NAME, {
	reducer,
	selectors: {
		...selectors,
		...allTablesSelectors,
	},
	actions: {
		...actions,
		...allTablesActions,
	},
	resolvers: {
		...resolvers,
		...allTablesResolvers,
	},
});

register(store);
