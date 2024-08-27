/**
 * Get Wordpress Dependencies
 */
import { addQueryArgs } from "@wordpress/url";
import apiFetch from "@wordpress/api-fetch";
import { store as coreStore } from "@wordpress/core-data"
import { numberToLetter } from '../utils';


// import { hydrate } from "./actions";

function computeCellId(fetchedCells) {
    fetchedCells.forEach((cell) => {
        cell.cell_id = numberToLetter(cell.column_id) + cell.row_id
        console.log(cell)
    });
    return {
        fetchedCells
    }
}

// export function getTableIdByBlock(block_table_ref) {
//     return
// }

export const getTable =
    (tableId, isTableStale) =>
        async ({ dispatch, registry }) => {
            console.log('            ...Resolver - Before fetch')
            console.log('            ...Table ID = ' + tableId)
            console.log('            ...Table Stale = ' + isTableStale)
            // if (blockTableStatus === 'New' || blockTableStatus === 'Saved' || tableId == '0') {
            if (!isTableStale || tableId == '0') {
                console.log('Bypassing API Call')
                return
            }
            try {
                const tableEntity =
                    await registry
                        .resolveSelect(coreStore)
                        .getEntityRecord(
                            'dynamic-tables/v1',
                            'table',
                            tableId
                        )

                const table = tableEntity;
                const table_id = table.id;
                const block_table_ref = table.header.block_table_ref;
                const table_status = table.header.status;
                const post_id = table.header.post_id;
                const table_name = table.header.table_name;
                const attributes = table.header.attributes;
                const classes = table.header.classes;
                const rows = table.rows;
                const columns = table.columns;
                computeCellId(table.cells);
                const cells = table.cells;

                dispatch.receiveTable(table_id, block_table_ref, table_status, post_id, table_name, attributes, classes, rows, columns, cells);
            } catch (error) {
                console.log('Error in getTable - Table ID = ' + tableId);
                alert('            ...Resolver - async error - ' + JSON.stringify(error, null, 4));
            }
            console.log('            Resolver - async completed');

        }
