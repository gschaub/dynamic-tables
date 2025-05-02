/* External dependencies */
import { useEffect, useState } from '@wordpress/element';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical, settings, tableRowBefore, tableRowDelete } from '@wordpress/icons';

/* Internal dependencies */
import { ConfigureRowHeight } from '../configure-row-height';
import '../../editor.scss';

/**
 * React component drop down menu to configure current row properties.
 *
 * @since    1.0.0
 *
 * @param {Object} props
 * @return {Object} Updated row
 */
function RowMenu(props) {
	const [openModalRowHeight, setOpenModalRowHeight] = useState(false);
	const [rowAttributes, setRowAttributes] = useState({});

	const { tableId, rowId, rowLabel, updatedRow } = props;

	useEffect(() => {
		setRowAttributes(props.rowAttributes);
	}, [props.rowAttributes]);

	/**
	 * Row attributes for inserting new row.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Menu action
	 * @param {number} rowId Row ID for new row
	 */
	function onInsertRow(event, rowId) {
		updatedRow(event, 'insert', tableId, rowId, '');
	}

	/**
	 * Row to delete.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Menu action
	 * @param {number} rowId Row ID for row to remove
	 */
	function onDeleteRow(event, rowId) {
		updatedRow(event, 'delete', tableId, rowId, '');
	}

	/**
	 * Updated row attributes for processing.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event                Menu action
	 * @param {Object} updatedRowAttributes Updated row attributes
	 */
	function onUpdateRowHeight(event, updatedRowAttributes) {
		if (openModalRowHeight) {
			setOpenModalRowHeight(false);
			updatedRow(event, 'attributes', tableId, rowId, updatedRowAttributes);
		} else {
			event.preventDefault();
			setOpenModalRowHeight(true);
		}
	}

	return (
		<>
			<DropdownMenu
				// style={{ display: "none" }}
				icon={moreVertical}
				defaultOpen="true"
				label={rowLabel}
			>
				{({ onClose }) => (
					<>
						<MenuGroup>
							<MenuItem icon={settings} onClick={onUpdateRowHeight}>
								Update Row Height
							</MenuItem>
						</MenuGroup>
						<MenuGroup>
							<MenuItem icon={tableRowBefore} onClick={e => onInsertRow(e, rowId)}>
								Insert Row
							</MenuItem>
							<MenuItem icon={tableRowDelete} onClick={e => onDeleteRow(e, rowId)}>
								Delete Row
							</MenuItem>
						</MenuGroup>
					</>
				)}
			</DropdownMenu>

			{openModalRowHeight && (
				<ConfigureRowHeight
					rowId={rowId}
					rowLabel={rowLabel}
					rowAttributes={rowAttributes}
					openRowHeight={onUpdateRowHeight}
				></ConfigureRowHeight>
			)}
		</>
	);
}

export { RowMenu };
