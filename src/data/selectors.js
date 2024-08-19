import { createRegistrySelector } from "@wordpress/data";
import { store as coreStore } from "@wordpress/core-data"

export function getTable(state, tableId, isTableStale) {

    console.log('Selector...GetTable ' + tableId)
    console.log('        ...Current Table Stale ' + isTableStale)
    console.log(state)

    if (!state.tables.hasOwnProperty(tableId)) {
        console.log('State not defined')
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
            cells: []
        }
    }

    return state.tables[tableId]
}

export function getTables(state) {
    return state.tables

}

export function getNewTableIdByBlock(state, block_table_ref) {
    const newTable = Object.keys(state.tables)
        .reduce((acc, key) => {
            if (state.tables[key]?.block_table_ref === block_table_ref) {
                console.log({ ...state.tables[key]?.block_table_ref })
                acc[key] = { ...state.tables[key] }
            }
            return acc
        }, {})

    if (newTable.length === 0) {
        return false
    }
    return Object.keys(newTable)
}

/**
 * Return all tables that are associated with unmounted blocks
 * 
 * @param {*} state 
 * @returns 
 */
export function getUnmountedTables(state) {
    console.log(state.tables)
    const unmountedTables = Object.keys(state.tables)
        .reduce((acc, key) => {
            if (state.tables[key].unmounted_blockid) {
                acc[key] = { ...state.tables[key] }
            }
            return acc
        }, {})
    return unmountedTables
}

export function getDeletedTables(state) {
    const deletedTables = Object.keys(state.tables)
        .reduce((acc, key) => {
            console.log(state.tables[key].table_status)
            if (state.tables[key].table_status === 'deleted') {
                acc[key] = { ...state.tables[key] }
            }
            return acc
        }, {})
    return deletedTables
}

export function getUnsavedTables(state) {
    const deletedTables = Object.keys(state.tables)
        .reduce((acc, key) => {
            console.log(state.tables[key].table_status)
            if (state.tables[key].table_status === 'new') {
                acc[key] = { ...state.tables[key] }
            }
            return acc
        }, {})
    return deletedTables
}

export function getTableBlockId(state) {

}

export const getTableTest = createRegistrySelector(
    // (select) => (state, tableId) => {
    (select) => () => {

        return select(coreStore).getEntityRecord(
            'dynamic-tables/v1',
            'table',
            '18'
        )
    });
