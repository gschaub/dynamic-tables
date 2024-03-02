import { apiFetch } from "@wordpress/fetch-api";
import { addQueryArgs } from "@wordpress/url";
import { hydrate } from "./actions";


export const getTable = (
    id = '') => {

    console.log('            In resolver.js - Running Webservice');
    async ({ dispatch }) => {


        const path = addQueryArgs('dynamic-tables/v1/tableData', id)
        //  const table = await apiFetch({ path });
        dispatch.recieveTable(table);


    }
}
