import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export const loadTableEntityConfig = () => {
	const tableConfig = {
		name: 'table',
		kind: 'dynamic-table-blocks',
		baseURL: '/dynamic-table-blocks/v1/tables',
		baseURLParams: { context: 'edit' },
		plural: 'tables',
		label: __('Table', 'dynamic-table-blocks'),
		getTitle: record => record?.title || __('Unnamed Table', 'dynamic-table-blocks'),
	};

	dispatch('core').addEntities(tableConfig);
	return tableConfig;
};
