import { apiFetch } from "@wordpress/data-controls";
import TYPES from "./action-types.js";

const { UPDATE, CREATE, DELETE, HYDRATE } = TYPES;

export function* createTable(table) {
    const path = `dynamic-tables/v1/table`;
    const method = 'POST';
    const result = yield apiFetch({ path, method });
    //action
}

/**
 * @example wp.data.dispatch( 'mfw/table').refreshPost
 * @example wp.data.dispatch( 'mfw/table' ).table
 * 
 * 
 * 
 */

export function receiveTable(id) {
    console.log('In receiveTable action')
    return {
        type: 'HYDRATE',
        id
    }
}


//     const result = yield fetch(something(), {
//         method: "POST",
//         body: table
//     });
//     if (result) {
//         return {
//             type: CREATE,
//             table
//         };
//     }
//     return;

export function* updateTable(table) {
    const result = yield fetch(something(tableId), {
        method: "PUT",
        body: table
    });
    if (result) {
        return {
            type: UPDATE,
            table
        };
    }
}

export function* deleteTable(tableId) {
    const result = yield fetch(something(tableId), {
        method: "DELETE"
    });
    if (result) {
        return {
            type: DELETE,
            tableId
        };
    }
}

export const hydrate = (table) => {
    console.log('      In action.js - Hydrating');
    return {
        type: HYDRATE,
        table
    };
}   