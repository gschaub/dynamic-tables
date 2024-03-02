import { addEntities } from '@wordpress/core-data';
import { addQueryArgs } from "@wordpress/url";
import { apiFetch } from "@wordpress/data-controls";
import { store as coreStore } from "@wordpress/core-data"
import { store as blockEditorStore } from "@wordpress/block-editor"
import TYPES from "./action-types.js";

const {
    CREATE_TABLE,
    INSERT_COLUMN,
    INSERT_ROW,
    DELETE_TABLE,
    DELETE_COLUMN,
    DELETE_ROW,
    UPDATE_TABLE_PROP,
    REMOVE_TABLE_PROP,
    UPDATE_ROW,
    UPDATE_COLUMN,
    UPDATE_CELL,
    RECEIVE_HYDRATE,
    RECEIVE_HYDRATE_TEST,
    PERSIST,
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

export function receiveNewTable(table) {
    console.log('Receiving New Table')
    console.log(table)
    console.log(table.table.table_id)

    return {
        type: CREATE_TABLE,
        tableId: table.table.table_id,
        ...table
    }
}

export function receiveTable(table_id, block_table_ref, post_id, table_name, table_attributes, table_classes, rows, columns, cells) {
    console.log('            ...Action - In receiveTable')
    //console.log(table);
    console.log('                - id: ' + table_id)
    //console.log('                - table: ' + JSON.stringify(table));
    //console.log('                - tableId ' + tableId);

    return {
        type: RECEIVE_HYDRATE,
        tableId: table_id,
        table: {
            table_id,
            block_table_ref,
            post_id,
            table_status: 'saved',
            table_name,
            table_attributes,
            table_classes,
            rows,
            columns,
            cells
        }
    }
}

export const createTableEntity =
    () =>
        async ({ select, dispatch, registry }) => {

            const { table_id, block_table_ref, post_id, table_name, table_attributes, table_classes, rows, columns, cells } = select.getTable('0', 'Saved');
            const testTable = select.getTable('0', 'Saved');
            console.log(testTable);
            const newTable = {
                header: {
                    id: table_id,
                    block_table_ref: block_table_ref,
                    post_id: post_id,
                    table_name: table_name,
                    table_attributes: table_attributes,
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

                dispatch.updateTableProp(tableEntity.id, 'table_id', tableEntity.id);

            } catch (error) {
                console.log('            ...Resolver - async error - ' + error);
            }
            console.log('            Resolver - async completed');

        };


export const updateTableEntity =
    (tableId) =>
        ({ select, registry }) => {

            const testTable = select.getTable(tableId, 'Saved')
            console.log(testTable)
            const { table_id, block_table_ref, post_id, table_name, table_classes, rows, columns, cells } = select.getTable(tableId, 'Saved')

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
             */
            registry
                .dispatch(coreStore)
                .editEntityRecord(
                    'dynamic-tables/v1',
                    'table',
                    table_id,
                    updatedTable
                );
        };

export const deleteTableEntity =
    (tableId) =>
        async ({ select, dispatch, registry }) => {
            console.log('In Action deleteTableEntity')

            try {
                const deletedTableEntity = await registry
                    .dispatch(coreStore)
                    .deleteEntityRecord(
                        'dynamic-tables/v1',
                        'table',
                        tableId
                    );

                dispatch({
                    type: DELETE_TABLE,
                    tableId
                })
            } catch (error) {
                console.log('            ...Resolver - async error - ' + error);
            }
            console.log('            Resolver - async completed');
        };

export const processDeletedTables =
    (deletedTables) =>
        ({ dispatch, registry }) => {
            Object.keys(deletedTables).forEach(key => {
                const deletedTableId = deletedTables[key].table_id
                dispatch.deleteTableEntity(deletedTables[key].table_id)
            })
        }

export const processUnmountedTables =
    (unmountedTables) =>
        ({ dispatch, registry }) => {
            Object.keys(unmountedTables).forEach(key => {
                const unmountedTableBlockId = unmountedTables[key].unmounted_blockid
                const tableBlock = registry.select(blockEditorStore).getBlock(unmountedTableBlockId)
                console.log(tableBlock)
                if (tableBlock) {
                    dispatch.removeTableProp(unmountedTables[key].table_id, 'unmounted_blockid')
                } else {
                    dispatch.removeTableProp(unmountedTables[key].table_id, 'unmounted_blockid')
                    dispatch.updateTableProp(unmountedTables[key].table_id, 'table_status', 'deleted');
                }
            })
        }

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

export const updateTableProp = (tableId, attribute, value) => {
    console.log('In Action updateTableProp')
    return {
        type: UPDATE_TABLE_PROP,
        tableId: tableId,
        attribute,
        value
    }
}

export const removeTableProp = (tableId, attribute) => {
    console.log('In Action updateTableProp')
    return {
        type: REMOVE_TABLE_PROP,
        tableId: tableId,
        attribute
    }
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

export const updateCell = (tableId, cellId, attribute, value) => {
    console.log('In Action updateCell')
    return {
        type: UPDATE_CELL,
        tableId,
        cellId,
        attribute,
        value
    }
}

// async ({ dispatch }) => {
//     console.log('In Action updateCell')

//     await dispatch({
//         type: UPDATE_CELL,
//         cellId,
//         attribute,
//         value
//     })
// }

export const updateTableBorder =
    (
        tableId,
        tableRows,
        tableColumns,
        tableCells
    ) =>

        async ({ dispatch }) => {
            console.log('Updating Border')

            await dispatch({
                type: PROCESS_BORDERS,
                tableId: tableId,
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