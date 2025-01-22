import { useEffect, useState } from "@wordpress/element"
import {
    DropdownMenu,
    MenuGroup,
    MenuItem
} from '@wordpress/components';
import {
    AlignmentToolbar

} from '@wordpress/block-editor';
import {
    blockTable as icon,
    moreVertical,
    more,
    settings,
    arrowLeft,
    arrowRight,
    arrowUp,
    arrowDown,
    tableRowBefore,
    tableRowAfter,
    tableRowDelete,
    trash
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as tableStore } from "../../data"
import { ConfigureRowHeight } from '../configure-row-height';
import '../../editor.scss';


function RowMenu(props) {

    const [openModalRowHeight, setOpenModalRowHeight] = useState(false);
    const [rowAttributes, setRowAttributes] = useState({})

    const {
        tableId,
        rowId,
        rowLabel,
        updatedRow
    } = props

    useEffect(() => {
        setRowAttributes(props.rowAttributes)
    }, [props.rowAttributes])

    console.log('In Component RowMenu')
    console.log(props)

    function onInsertRow(event, rowId) {
        console.log('    ...onInsertRow');
        console.log(event);
        console.log('rowId = ' + rowId)
        updatedRow(event, 'insert', tableId, rowId, '')
    }

    function onDeleteRow(event, rowId) {
        console.log('    ...onDeleteRow');
        console.log(event);
        console.log('rowId = ' + rowId)
        updatedRow(event, 'delete', tableId, rowId, '')
    }

    function onUpdateRowHeight(event, updatedRowAttributes) {
        console.log('    ...onUpdateRowHeight');
        console.log(event);
        console.log(updatedRowAttributes);
        if (openModalRowHeight) {
            event.preventDefault()
            setOpenModalRowHeight(false)
            updatedRow(event, 'attributes', tableId, rowId, updatedRowAttributes)
        } else {
            event.preventDefault()
            setOpenModalRowHeight(true)
        }
    }

    console.log('Open row height page = ' + openModalRowHeight)

    return (
        <>
            <DropdownMenu
                // style={{ display: "none" }}
                icon={moreVertical}
                defaultOpen="true"
                label={rowLabel}>
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
                    openRowHeight={onUpdateRowHeight}>
                </ConfigureRowHeight>
            )}
        </>

    )
}

export { RowMenu };