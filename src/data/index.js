import { createReduxStore, register } from '@wordpress/data';

import reducer from "./reducer";
import * as selectors from "./selectors";
import * as actions from "./actions";
import * as resolvers from "./resolvers";
import STORE_NAME from "./constants";

// const storeConfig = () => ({
//     selectors,
//     actions,
//     reducer,
//     resolvers
// });

// export const store = createReduxStore(STORE_NAME, storeConfig());
export const store = createReduxStore(STORE_NAME, {
    reducer,
    selectors,
    actions,
    resolvers
});

register(store);

// Register store after unlocking private selectors to allow resolvers to use them.
