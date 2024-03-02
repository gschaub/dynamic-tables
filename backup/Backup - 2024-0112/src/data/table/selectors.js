import { createRegistrySelector } from "@wordpress/data";
import { store as coreStore } from "@wordpress/core-data"

export function getTable(state, tableId, tableStatus) {

    console.log('Selector...GetTable ' + tableId)
    console.log('        ...Current Table Status ' + tableStatus)
    console.log(state)
    return state;
    //    return state.table || {};
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
