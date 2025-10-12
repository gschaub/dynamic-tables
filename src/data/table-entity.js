import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export const loadTableEntityConfig = () => {
	const tableConfig = {
		name: 'table',
		kind: 'dynamic-tables',
		baseURL: '/dynamic-tables/v1/tables',
		baseURLParams: { context: 'edit' },
		plural: 'tables',
		label: __('Table', 'dynamic-table'),
		getTitle: record => record?.title || __('Unnamed Table', 'dynamic-table'),
	};

	dispatch('core').addEntities(tableConfig);
	console.log(tableConfig);

	return tableConfig;
};
