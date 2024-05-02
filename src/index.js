import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import Edit from './edit';
import metadata from './block.json';

// dynamic-tables/dynamic-tables
console.log(metadata.name)

registerBlockType(metadata.name, {
// registerBlockType('dynamic-tables/dynamic-tables', {
	// From  edit.js
	apiVersion: 3,
	edit: Edit,
	save: function (props) {
		return null
	},
});
