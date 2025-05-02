/* External dependencies */
import { useEffect, useState } from '@wordpress/element';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { AlignmentToolbar } from '@wordpress/block-editor';
import {
	blockTable as icon,
	moreVertical,
	more,
	settings,
	arrowLeft,
	arrowRight,
	arrowUp,
	arrowDown,
	tableColumnBefore,
	tableColumnAfter,
	tableColumnDelete,
	trash,
} from '@wordpress/icons';

/* Internal dependencies */
import { ConfigureColumnWidth } from '../configure-column-width';
import '../../editor.scss';

/**
 * React component drop down menu to configure current column properties.
 *
 * @since    1.0.0
 *
 * @param {Object} props
 * @return {Object} Updated column
 */
function ColumnMenu(props) {
	const [openModalColumnWidth, setOpenModalColumnWidth] = useState(false);
	const [columnAttributes, setColumnAttributes] = useState({});

	const { tableId, columnId, columnLabel, enableProFeatures, updatedColumn } = props;

	useEffect(() => {
		setColumnAttributes(props.columnAttributes);
	}, [props.columnAttributes]);

	console.log('In Component ColumnMenu');
	console.log(props);

	/**
	 * Column attributes for inserting new column.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event    Menu action
	 * @param {number} columnId Column ID for new column
	 */
	function onInsertColumn(event, columnId) {
		console.log('    ...onInsertColumn');
		console.log(event);
		console.log('columnId = ' + columnId);
		updatedColumn(event, 'insert', tableId, columnId, '');
	}

	/**
	 * Column to delete.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event    Menu action
	 * @param {number} columnId Column ID for column to remove
	 */
	function onDeleteColumn(event, columnId) {
		console.log('    ...onInsertColumn');
		console.log(event);
		console.log('columnId = ' + columnId);
		updatedColumn(event, 'delete', tableId, columnId, '');
	}

	/**
	 * Updated column attributes for processing.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event                   Menu action
	 * @param {Object} updatedColumnAttributes Updated column attributes
	 */
	function onUpdateColumnWidth(event, updatedColumnAttributes) {
		console.log('    ...onUpdateColumn Width');
		console.log(event);
		console.log(updatedColumnAttributes);
		if (openModalColumnWidth) {
			setOpenModalColumnWidth(false);
			updatedColumn(event, 'attributes', tableId, columnId, updatedColumnAttributes);
		} else {
			event.preventDefault();
			setOpenModalColumnWidth(true);
		}
	}

	return (
		<>
			<DropdownMenu
				// style={{ display: "none" }}
				icon={moreVertical}
				defaultOpen="true"
				label={columnLabel}
			>
				{({ onClose }) => (
					<>
						<MenuGroup>
							<MenuItem icon={settings} onClick={onUpdateColumnWidth}>
								Update Column Width
							</MenuItem>
						</MenuGroup>
						<MenuGroup>
							<MenuItem icon={tableColumnBefore} onClick={e => onInsertColumn(e, columnId)}>
								Insert Column
							</MenuItem>
							<MenuItem icon={tableColumnDelete} onClick={e => onDeleteColumn(e, columnId)}>
								Delete Column
							</MenuItem>
						</MenuGroup>
					</>
				)}
			</DropdownMenu>

			{openModalColumnWidth && (
				<ConfigureColumnWidth
					columnId={columnId}
					columnLabel={columnLabel}
					columnAttributes={columnAttributes}
					enableProFeatures={enableProFeatures}
					openColumnWidth={onUpdateColumnWidth}
				></ConfigureColumnWidth>
			)}
		</>
	);
}

export { ColumnMenu };
