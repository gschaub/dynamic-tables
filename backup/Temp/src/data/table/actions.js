import { addEntities } from '@wordpress/core-data';
import { addQueryArgs } from "@wordpress/url";
import { apiFetch } from "@wordpress/data-controls";
import { store as coreStore } from "@wordpress/core-data"
import TYPES from "./action-types.js";

const {
    CREATE,
    INSERT_COLUMN,
    INSERT_ROW,
    DELETE,
    DELETE_COLUMN,
    DELETE_ROW,
    UPDATE_TABLE_PROP,
    UPDATE_ROW,
    UPDATE_COLUMN,
    UPDATE_CELL,
    RECEIVE_HYDRATE,
    RECEIVE_HYDRATE_TEST,
    PROCESS_BORDERS
} = TYPES;

export function addTableEntity() {
    ({ registry }) => {
        // let configs = select.getEntitiesConfig(kind);
        // if (configs && configs.length !== 0) {
        //     return configs;
        // }
        registry.dispatch(coreStore).addEntities(tableEntityConfig);

        return configs;
    };
}

/**
 * @example wp.data.dispatch( 'mfw/table').refreshPost
 * @example wp.data.dispatch( 'mfw/table' ).table
 * 
 * 
 * 
 */

export const receiveNewTable =
    (
        table
    ) =>

        async ({ dispatch }) => {
            console.log('createTable')

            await dispatch({
                type: CREATE,
                ...table
            })
        }

export function receiveTable(table_id, post_id, table_name, table_classes, rows, columns, cells) {
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
            rows,
            columns,
            cells
        }
    }
}

export const createTableEntity =
    (tableId) =>
        async ({ select, dispatch, registry }) => {

            const { table_id, block_table_ref, post_id, table_name, table_classes, rows, columns, cells } = select.getTable(tableId, 'Saved');
            const testTable = select.getTable(tableId, 'Saved');
            console.log(testTable);
            const newTable = {
                header: {
                    id: table_id,
                    block_table_ref: block_table_ref,
                    post_id: post_id,
                    table_name: table_name,
                    table_classes: table_classes
                },
                rows: [...rows],
                columns: [...columns],
                cells: [...cells]
            }

            console.log('CREATING TABLE ENTITY')
            console.log(newTable)

            try {
                const tableEntity = await registry
                    .dispatch(coreStore)
                    .saveEntityRecord(
                        'dynamic-tables/v1',
                        'table',
                        newTable
                    );

                dispatch.updateTableProp('table_id', tableEntity.id);

            } catch (error) {
                console.log('            ...Resolver - async error - ' + error);
            }
            console.log('            Resolver - async completed');

        };


export const updateTableEntity =
    (tableId) =>
        ({ select, registry }) => {

            const { table_id, block_table_ref, post_id, table_name, table_classes, rows, columns, cells } = select.getTable(tableId, 'Saved')
            const testTable = select.getTable(tableId, 'Saved')
            console.log(testTable)

            // Remove border row if it exists
            var filteredRows = rows
                .filter((row) =>
                    row.row_id !== '0'
                )

            // Remove border column if it exists
            var filteredColumns = columns
                .filter((column) =>
                    column.column_id !== '0'
                )

            // Remove border cells if they exists
            var filteredCells = cells
                .filter((cell) =>
                    cell.row_id !== '0' && cell.column_id !== '0'
                )

            const updatedTable = {
                id: tableId,
                header: {
                    id: table_id,
                    block_table_ref: block_table_ref,
                    post_id: post_id,
                    table_name: table_name,
                    table_classes: table_classes
                },
                rows: [...filteredRows],
                columns: [...filteredColumns],
                cells: [...filteredCells]
            }

            console.log('UPDATING TABLE ENTITY')
            console.log(updatedTable)


            /**
             * Options: isCached: Bool
             *          undoIgnore: Bool
             *  */
            registry
                .dispatch(coreStore)
                .editEntityRecord(
                    'dynamic-tables/v1',
                    'table',
                    table_id,
                    updatedTable
                );
        };

export const addColumn =
    (
        columnId,
        newColumn,
        columnCells
    ) =>

        async ({ dispatch }) => {
            await dispatch({
                type: INSERT_COLUMN,
                columnId,
                newColumn,
                columnCells
            })
        }

export const addRow = () => {
    return {
        type: INSERT_ROW
    }
}

export const removeColumn =
    (
        columnId
    ) =>
        async ({ dispatch }) => {
            console.log('In Action removeColumn')
            await dispatch({
                type: DELETE_COLUMN,
                columnId
            })

        }

export const removeRow = () => {
    return {
        type: DELETE_ROW
    }
}

export const updateTableProp =
    (
        attribute,
        value
    ) =>

        async ({ dispatch }) => {
            console.log('In Action updateTableProp')

            await dispatch({
                type: UPDATE_TABLE_PROP,
                attribute,
                value
            })
        }

export const updateRow = (rowId, attribute, value) => {

    console.log('In Action updateRow')
    return {
        type: UPDATE_ROW,
        rowId,
        attribute,
        value
    }
}

export const updateColumn = (columnId, attribute, value) => {

    console.log('In Action updateColumn')
    return {
        type: UPDATE_COLUMN,
        columnId,
        attribute,
        value
    }
}

export const updateCell =
    (
        cellId,
        attribute,
        value
    ) =>

        async ({ dispatch }) => {
            console.log('In Action updateCell')

            await dispatch({
                type: UPDATE_CELL,
                cellId,
                attribute,
                value
            })
        }

export const updateTableBorder =
    (
        tableRows,
        tableColumns,
        tableCells
    ) =>

        async ({ dispatch }) => {
            console.log('createTable')

            await dispatch({
                type: PROCESS_BORDERS,
                rows: tableRows,
                columns: tableColumns,
                cells: tableCells
            })
        }


// Hold in case needed
export function receiveTableTest(tableEntity) {
    console.log('            ...Action - In receiveTableTest')
    //console.log(table);
    // console.log('                - id: ' + table_id)
    //console.log('                - table: ' + JSON.stringify(table));
    //console.log('                - tableId ' + tableId);

    return {
        type: RECEIVE_HYDRATE_TEST,
        tableEntity
        // tableTest: {
        //     testTable
        // }
    }
}

const tableEntityConfig = [
    {
        name: 'dynamicTable',
        kind: 'dynamic-tables/v1',
        baseURL: '/dynamic-tables/v1/table',
        // baseURLParams: { tableId: '18' },

        // plural: 'taxonomies',
        // label: __('Taxonomy'),
        // syncConfig: {
        //     fetch: async () => {
        //         return apiFetch({ path: '/' });
        //     },
        //     applyChangesToDoc: (doc, changes) => {
        //         const document = doc.getMap('document');
        //         Object.entries(changes).forEach(([key, value]) => {
        //             if (document.get(key) !== value) {
        //                 document.set(key, value);
        //             }
        //         });
        //     },
        //     fromCRDTDoc: (doc) => {
        //         return doc.getMap('document').toJSON();
        //     },
        // },
        // syncObjectType: 'root/base',
        // getSyncObjectId: () => 'index',
    },

];