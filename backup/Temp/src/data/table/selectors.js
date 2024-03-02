import { createRegistrySelector } from "@wordpress/data";
import { store as coreStore } from "@wordpress/core-data"

export function getTable(state, tableId, tableStatus) {

    console.log('Selector...GetTable ' + tableId)
    console.log('        ...Current Table Status ' + tableStatus)
    console.log(state)

    if (state.table.table_id === '' || Object.keys(state.table).length === 0) {
        console.log('State not defined')
        return state.table;
    }

    let itrateState = { ...state }
    let blockTableID = Number(tableId)

    console.log('State table id = ' + Number(state.table.table_id) + ' vs. Block table id = ' + blockTableID)

    if (blockTableID == Number(state.table.table_id)) {
        console.log('FOUND TABLE MATCH')
        return state.table
    }


    let matchingTable = Object.keys(state).filter((table) => table.table_id === tableId)
    console.log(matchingTable)
    // return state.table

    // itrateState.forEach((table) => {
    //     console.log('State Table ID = ' + table.table_id)
    //     console.log('Block Table ID = ' + blockTableID)
    //     if (table.table_id === blockTableID) {
    //         console.log('Found Matching Table')
    //         return state.table;
    //     }
    // })

    return false
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
