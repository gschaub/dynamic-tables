/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import apiFetch from "@wordpress/api-fetch"
import { useSelect } from "@wordpress/data";
import { useState, useEffect } from "@wordpress/element"
import { __ } from '@wordpress/i18n';
import { useEntityProp } from "@wordpress/core-data"
import {
	TextControl, Panel, PanelBody, PanelRow, TabbableContainer, Spinner,
	__experimentalNumberControl as NumberControl
} from '@wordpress/components';
import { RichText, AlignmentToolbar, InspectorControls, BlockControls, useBlockProps } from '@wordpress/block-editor';

/**
 *  * Internal Dependencies
 */
import { store as tableStore } from "./data"
import numberToLetter from './number-to-letter';
import './editor.scss';



export default function Edit(props) {
	const blockProps = useBlockProps({
		className: "dynamic-table-edit-block"
	})

	const [render, setRender] = useState(0);
	//const[table, setTable] = useState(null);
	// const [tableId, setTableId] = useState('');
	// const [tablePostId, setTablePostId] = useState('');
	// const [tableClasses, setTableClasses] = useState('');
	// const [tableName, setTableName] = useState('');
	// const [renders, setRenders] = useState(0);

	// const [isFetchingData, setIsFetchingData] = useState(false)
	const [gridStyle, setGridStyle] = useState('');
	const [numColumns, setNumColumns] = useState(1);
	const [numRows, setNumRows] = useState(1);
	const [gridCells, setGridCells] = useState([])



	//for(let i=0; i=1; i++) {}


	// const { table = null } = useEffect(() => {
	// 	initTable('17')
	// 	//	return table
	// }, [table]
	// )

	//	function initTable(tableId) {
	// console.log('INSIDE TABLE LOADER - table select')
	const { table = null, tableGetIsResolving, tableHasStartedResolving, tableHasFinishedResolving, tableIsResolving } = useSelect((select) => {
		const selectorArgs = ['17'];

		return {
			table: select(tableStore).getTable(selectorArgs),
			tableGetIsResolving: select(tableStore).getIsResolving('getTable', selectorArgs),
			tableHasStartedResolving: select(tableStore).hasStartedResolution('getTable', selectorArgs),
			tableHasFinishedResolving: select(tableStore).hasFinishedResolution('getTable', selectorArgs),
			tableIsResolving: select(tableStore).isResolving('getTable', selectorArgs)
		}, []

	})


	function processColumns(columns) {
		let newGridStyle = ''
		// console.log('COLUMN STYLE')
		{
			columns.map(({ column_id, column_name, classes }) => {
				// console.log('...Looping Array')
				newGridStyle = newGridStyle + 'auto ';
			})
		}
		// console.log('...Grid Style is - ' + newGridStyle)
		setGridStyle(newGridStyle)
	}


	useEffect(() => {
		setRender(render + 1)
		// console.log('RENDER - ' + render)

	})

	//console.log(JSON.stringify(gridCells, null, 4))

	// if (JSON.stringify(table) !== '{}') {
	if (table !== null) {
		processColumns(table.table[0].columns)
		// console.log('Ready to render - Table value - ' + JSON.stringify(table, null, 4))
		// console.log('Ready to render - Table value - ' + JSON.stringify(table.table[0], null, 4))


		return (
			<div {...blockProps} >
				<p>Store Loaded</p>
			</div >)
	}
	// console.log('Log from Spinner')
	return (
		<div>
			<Spinner></Spinner>
		</div>
	)
}