import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import Edit from './edit';
import metadata from './block.json';

registerBlockType(metadata.name, {
	// From  edit.js
	//apiVersion: 3,
	edit: Edit,
	save: function (props) {
		return null
	},
});
