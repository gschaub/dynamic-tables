import { addQueryArgs } from "@wordpress/url";
import { apiFetch } from "@wordpress/data-controls";
import TYPES from "./action-types.js";

const { PERSIST, PERSIST_TABLE_START, PERSIST_TABLE_FINISH, UPDATE_COLUMN, UPDATE_CELL, CREATE, DELETE, RECEIVE_HYDRATE } = TYPES;


/**
 * @example wp.data.dispatch( 'mfw/table').refreshPost
 * @example wp.data.dispatch( 'mfw/table' ).table
 * 
 * 
 * 
 */


export function receiveTable(table_id, post_id, table_name, table_classes, columns, cells) {
    console.log('            ...Action - In receiveTable')
    //console.log(table);
    console.log('                - id: ' + table_id)
    //console.log('                - table: ' + JSON.stringify(table));
    //console.log('                - tableId ' + tableId);

    return {
        type: RECEIVE_HYDRATE,
        table: {
            table_id,
            post_id,
            table_name,
            table_classes,
            columns,
            cells
        }
    }
}

export const updateColumn = (columnId, attribute, value) => {

    console.log('In Action updateColumn')
    //    let cell = table[0].cells.find(({id}) => id === cellId).attribute.value;
    return {
        type: UPDATE_COLUMN,
        columnId,
        attribute,
        value
    }
}

export const updateCell = (cellId, attribute, value) => {

    console.log('In Action updateCell')
    //    let cell = table[0].cells.find(({id}) => id === cellId).attribute.value;
    return {
        type: UPDATE_CELL,
        cellId,
        attribute,
        value
    }

}

export const receiveTablePersist = (tableId, postResult) => {
    console.log(postResult);
    return {
        type: 'PERSIST',
        putTable: {
            tableId,
            postResult
        }
        // items: Array.isArray(items) ? items : [items],
        // persistedEdits: edits,
        // meta,
    };
}


export const saveTable =
    (
        id,
        table,
        // {
        //     __unstableFetch = apiFetch
        // } = {}
    ) =>

        async ({ dispatch }) => {
            console.log('            ...Action saveTable - Before fetch')
            console.log('In ACTION saveTable - id = ' + id)
            console.log('In ACTION saveTable - id = ' + table)

            let postResult;
            let error;

            try {
                dispatch({
                    type: 'PERSIST_TABLE_START',
                    id,
                });

                let hasError = false;

                try {
                    const path = addQueryArgs('dynamic-tables/v1/table');
                    console.log('            ...Action saveTable - API Call - ' + path);

                    const postResult = await apiFetch({
                        path: path,
                        medthod: 'PUT',
                        data: table
                    });

                    //                    console.log(postResult);

                    // const post_id = postResult.table.table[0].header[0].post_id;
                    // const table_name = postResult.table.table[0].header[0].table_name;
                    // const table_classes = postResult.table.table[0].header[0].classes;
                    // const columns = postResult.table.table[0].columns;
                    // computeCellId(postResult.table.table[0].cells)
                    // const cells = postResult.table.table[0].cells;
                    // dispatch.receiveTable(table_id, post_id, table_name, table_classes, columns, cells);

                    dispatch.receiveTablePersist(id, postResult);

                    //  dispatch.receiveTablePersist(
                    //     id,
                    //     postResult
                    // );

                } catch (_error) {
                    console.log('            ...Action - async error - ' + _error);
                    hasError = true;
                    error = _error;
                }

                console.log('            Action saveTable - async completed');

                dispatch({
                    type: 'PERSIST_TABLE_FINISH',
                    id,
                    error,
                });


                // if (hasError && throwOnError) {
                //     throw error;
                // }

                return postResult;
            } finally {

            }
            // return {
            //     type: PERSIST,
            // }

        }
