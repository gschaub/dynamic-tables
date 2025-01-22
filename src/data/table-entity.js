import { store as coreStore } from "@wordpress/core-data"

export const loadTableEntityConfig = () => {
    const tableConfig =
    {
        name: 'table',
        kind: 'dynamic-tables/v1',
        baseURL: '/dynamic-tables/v1/tables',
        baseURLParams: { context: 'edit' },
        plural: 'tables',
        label: __('Table')
    }

    dispatch(coreStore).addEntities(tableConfig);
    console.log(tableConfig);
    alert('processed Entity');

    return tableConfig;
}