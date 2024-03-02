/**
 * Get Wordpress Dependencies
 */
import { addQueryArgs } from "@wordpress/url";
import apiFetch from "@wordpress/api-fetch";


// import { hydrate } from "./actions";


export const getTable =
    (id) =>
        async ({ dispatch }) => {
            console.log('            ...Resolver - Before fetch')
            //            try {
            //const queryParams = { tableId: id }
            const path = addQueryArgs('dynamic-tables/v1/table?tableId=' + id)
            // console.log('            ...Resolver - API Call - ' + path)
            const table = await apiFetch({ path });
            // console.log('            ...Resolver - After fetch - returned table - ' + JSON.stringify(table))
            //    console.log(table)
            //            dispatch.receiveTable(table, id);
            //            } catch (error) {
            console.log('            ...Resolver - async error - ' + error)
            //            }
            console.log('            Resolver - async completed')

        }
