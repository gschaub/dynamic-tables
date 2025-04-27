import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export const loadTableEntityConfig = () => {
	const tableConfig = {
		name: 'table',
		kind: 'dynamic-tables',
		baseURL: '/dynamic-tables/v1/tables',
		baseURLParams: { context: 'edit' },
		plural: 'tables',
		label: __('Table'),
		getTitle: record => record?.title || __('Unnamed Table'),
	};

	dispatch('core').addEntities(tableConfig);
	console.log(tableConfig);
	alert('processed Entity');

	return tableConfig;
};
