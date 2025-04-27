/* External dependencies */
import { createReduxStore, register } from '@wordpress/data';

/* Internal dependencies */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';
import STORE_NAME from './constants';

/**
 * Create Dynamic Tables store.
 *
 * @since    1.0.0
 *
 * @type     {Object} Wordpress block store
 */
export const store = createReduxStore(STORE_NAME, {
	reducer,
	selectors,
	actions,
	resolvers,
});

register(store);
