import { createReduxStore, register } from '@wordpress/data';

import {
    STORE_NAME as TABLE_STORE_NAME,
    storeConfig
}
    from "./table";
//import { registerStore } from "@wordpress/data";

export const store = createReduxStore(TABLE_STORE_NAME, storeConfig());
register(store); // Register store after unlocking private selectors to allow resolvers to use them.

