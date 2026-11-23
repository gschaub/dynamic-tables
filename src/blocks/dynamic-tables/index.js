import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import Edit from './edit';
import metadata from './block.json';

registerBlockType(metadata.name, {
	apiVersion: 3,
	edit: Edit,
	save(props) {
		return null;
	},
});
