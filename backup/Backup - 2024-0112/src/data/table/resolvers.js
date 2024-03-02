/**
 * Get Wordpress Dependencies
 */
import { addQueryArgs } from "@wordpress/url";
import apiFetch from "@wordpress/api-fetch";
import { store as coreStore } from "@wordpress/core-data"
import { numberToLetter } from '../../utils';


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

export const getTable =
    (tableId, tableStatus) =>
        async ({ dispatch, registry }) => {
            console.log('            ...Resolver - Before fetch')
            console.log('            ...Table ID = ' + tableId)
            console.log('            ...Table Status = ' + tableStatus)
            if (tableStatus === 'New' || tableStatus === 'Saved' || tableId == '0') {
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

                const table = tableEntity
                const table_id = table.id;
                const post_id = table.header.post_id;
                const table_name = table.header.table_name;
                const table_classes = table.header.classes;
                const rows = table.rows;
                const columns = table.columns;
                computeCellId(table.cells);
                const cells = table.cells;

                dispatch.receiveTable(table_id, post_id, table_name, table_classes, rows, columns, cells);
            } catch (error) {
                console.log('            ...Resolver - async error - ' + error);
            }
            console.log('            Resolver - async completed');

        }
