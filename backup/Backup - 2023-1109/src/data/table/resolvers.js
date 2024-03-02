/**
 * Get Wordpress Dependencies
 */
import { addQueryArgs } from "@wordpress/url";
import apiFetch from "@wordpress/api-fetch";
import numberToLetter from '../../utils';


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
    (id) =>
        async ({ dispatch }) => {
            console.log('            ...Resolver - Before fetch')
            try {
                //const queryParams = { tableId: id }
                const path = addQueryArgs('dynamic-tables/v1/table?tableId=' + id);
                console.log('            ...Resolver - API Call - ' + path);
                const table = await apiFetch({ path });
                const table_id = table.table[0].header[0].id;
                const post_id = table.table[0].header[0].post_id;
                const table_name = table.table[0].header[0].table_name;
                const table_classes = table.table[0].header[0].classes;
                const columns = table.table[0].columns;
                computeCellId(table.table[0].cells)
                const cells = table.table[0].cells;

                dispatch.receiveTable(table_id, post_id, table_name, table_classes, columns, cells);
            } catch (error) {
                console.log('            ...Resolver - async error - ' + error);
            }
            console.log('            Resolver - async completed');

        }

// control = table[0].header;
// columns = table[0].columns;
// cells = table[0].cells;
