/* External dependencies */
import { useEffect, useRef, useCallback, memo } from '@wordpress/element';
import { Popover, MenuGroup, MenuItem } from '@wordpress/components';
// import { copySmall, scissors, paste } from '@wordpress/icons';
import { CopyIcon, ScissorsIcon, ClipboardIcon } from '@phosphor-icons/react';

/* Internal dependencies */
import './style.scss';
import '../../editor.scss';
import { getCellIdCoordinates } from '../../utils';

/**
 * React component drop down menu to configure current cell properties.
 *
 * @since    1.3.1
 *
 * @param {Object} props
 * @return {Object|null} Updated cell
 */
function CellMenuImpl(props = {}) {
	const {
		menuId,
		anchor,
		table,
		isContentOnlyMode = false,
		cellId,
		cellAttributes,
		updatedCell,
		canPaste = false,
		onRequestClose,
	} = props;

	const tableId = table?.table_id;
	const { row_id } = getCellIdCoordinates(cellId);

	// Support disabling row movement that would bring out-of-bounds conditions
	const numTableRows = table?.rows?.length - 1;
	const lastRowId = table?.rows[numTableRows]?.row_id;
	const headerRowId = table?.rows?.find(r => r.attributes.isRowHeader === true)?.row_id;
	const firstBodyRowId = headerRowId ? Number(headerRowId) + 1 : 1;
	const disableInsertRowUp = Number(row_id) === 0 ? true : false;
	const disableMoveRowUp = Number(row_id) <= Number(firstBodyRowId) ? true : false;
	const disableMoveRowDown = Number(lastRowId) === Number(row_id) ? true : false;

	// Refs for focus management
	const menuRootRef = useRef(null);
	const firstItemRef = useRef(null);

	/**
	 * Close the menu based on event actions
	 *
	 * @since    1.3.1
	 */
	const close = useCallback(() => {
		onRequestClose?.();
	}, [onRequestClose]);

	/**
	 * Handle keyboard navigation.
	 *
	 * Description: Escape closes; Up/Down moves among menu items.
	 *
	 * @since    1.3.1
	 *
	 * @param {Object} e Key down event
	 *
	 */
	const onKeyDown = useCallback(
		e => {
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				close();
				return;
			}

			if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

			e.preventDefault();

			const root = menuRootRef.current;
			if (!root) return;

			const items = Array.from(root.querySelectorAll('button,[role="menuitem"]')).filter(
				el => !el.disabled && el.getAttribute('aria-disabled') !== 'true'
			);

			if (!items.length) return;

			const doc = root.ownerDocument;
			const active = doc?.activeElement;

			const idx = items.indexOf(active);
			const dir = e.key === 'ArrowDown' ? 1 : -1;

			const nextIdx = idx === -1 ? 0 : (idx + dir + items.length) % items.length;
			items[nextIdx]?.focus?.();
		},
		[onRequestClose]
	);

	/**
	 * Initiate cell content copy based on menu selection.
	 *
	 * @since    1.3.1
	 *
	 * @param {Object} event  Menu action
	 * @param {string} cellId Cell ID of the copied cell
	 */
	const onCopyCell = useCallback(
		(event, cellId) => {
			const updateType = 'copyCell';

			updatedCell(event, updateType, tableId, cellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	/**
	 * Initiate cell content cut based on menu selection.
	 *
	 * @since    1.3.1
	 *
	 * @param {Object} event  Menu action
	 * @param {string} cellId Cell ID of the cell to cut
	 */
	const onCutCell = useCallback(
		(event, cellId) => {
			const updateType = 'cutCell';

			updatedCell(event, updateType, tableId, cellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	/**
	 * Initiate content paste into the cell based on menu selection.
	 *
	 * @since    1.3.1
	 *
	 * @param {Object} event  Menu action
	 * @param {string} cellId Cell ID of the cell to receive pasted content
	 */
	const onPasteCell = useCallback(
		(event, cellId) => {
			const updateType = 'pasteCell';

			updatedCell(event, updateType, tableId, cellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	/**
	 * Initiate content delete for the cell based on menu selection.
	 *
	 * @since    1.3.1
	 *
	 * @param {Object} event  Menu action
	 * @param {string} cellId Cell ID of the cell from which to delete content
	 */
	const onClearCellContent = useCallback(
		(event, cellId) => {
			const updateType = 'clearCellContent';

			updatedCell(event, updateType, tableId, cellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	/**
	 * Row attributes for inserting new row.
	 *
	 * @since    1.3.1
	 *
	 * @param {Object} event        Menu action
	 * @param {string} targetCellId Reference cellID for insert
	 * @param {string} direction    Direction to insert row
	 */
	const onInsertRow = useCallback(
		(event, targetCellId, direction) => {
			const updateType = direction === 'above' ? 'insert-above' : 'insert-below';

			updatedCell(event, updateType, tableId, targetCellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	/**
	 * Row to delete.
	 *
	 * @since    1.3.1
	 *
	 * @param {Object} event        Menu action
	 * @param {string} targetCellId Reference cellID for delete
	 */
	const onDeleteRow = useCallback(
		(event, targetCellId) => {
			updatedCell(event, 'delete', tableId, targetCellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	/**
	 * Row attributes for moving a row up or down.
	 *
	 * @since    1.3.1
	 *
	 * @param {Object} event        Menu action
	 * @param {string} targetCellId Reference cellID for move
	 * @param {string} direction    Direction to move row
	 */
	const onMoveRow = useCallback(
		(event, targetCellId, direction) => {
			const updateType = direction === 'up' ? 'move-up' : 'move-down';

			updatedCell(event, updateType, tableId, targetCellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	/**
	 * Close the menu when the popover requests to close.
	 *
	 * @since    1.3.1
	 */
	const handlePopoverClose = useCallback(() => {
		onRequestClose?.();
	}, [onRequestClose]);

	const canShowRowInsertDelete = !cellAttributes?.isRowHeader;
	const canShowRowMove = !isContentOnlyMode && !cellAttributes?.isRowHeader;

	const hasTableId = tableId !== null && tableId !== undefined;
	const hasCellId = cellId !== null && cellId !== undefined;

	const canRender = !!anchor && typeof updatedCell === 'function' && hasTableId && hasCellId;

	// Focus first item on open (next frame so Popover has mounted)
	useEffect(() => {
		// Only do focus work when we’re actually rendering the menu
		if (!canRender) return;

		window.requestAnimationFrame(() => {
			// Prefer explicit first item ref; fallback to first button inside menu
			const el =
				firstItemRef.current || menuRootRef.current?.querySelector?.('button,[role="menuitem"]');
			el?.focus?.();
		});
	}, [canRender, anchor, cellId]);

	if (!canRender) return null;
	const menuBuildNonce = 'cell-menu-v2';

	const copyIcon = (
		<CopyIcon size={16} style={{ color: 'steelblue' }} weight="regular" aria-hidden="true" />
	);
	const cutIcon = (
		<ScissorsIcon size={16} style={{ color: 'steelblue' }} weight="regular" aria-hidden="true" />
	);
	const pasteIcon = (
		<ClipboardIcon
			size={16}
			style={{ color: canPaste ? 'steelblue' : 'lightblue' }}
			weight="regular"
			aria-hidden="true"
		/>
	);

	return (
		<>
			<Popover
				anchor={anchor}
				className="menu-cell__main"
				placement="right-start"
				focusOnMount={false}
				offset={8}
				noArrow={false}
				flip
				onClose={handlePopoverClose}
			>
				<div
					id={menuId}
					ref={menuRootRef}
					data-dtbk-build={menuBuildNonce}
					role="menu"
					aria-label={`Cell ${cellId} menu`}
					tabIndex={-1}
					onKeyDown={onKeyDown}
				>
					<MenuGroup>
						<MenuItem ref={firstItemRef} icon={copyIcon} onClick={e => onCopyCell(e, cellId)}>
							Copy
						</MenuItem>
						<MenuItem icon={cutIcon} onClick={e => onCutCell(e, cellId)}>
							Cut
						</MenuItem>
						<MenuItem icon={pasteIcon} disabled={!canPaste} onClick={e => onPasteCell(e, cellId)}>
							Paste
						</MenuItem>
						<MenuItem shortcut={'Delete'} onClick={e => onClearCellContent(e, cellId)}>
							Clear Content
						</MenuItem>
					</MenuGroup>

					{canShowRowInsertDelete && (
						<>
							<MenuGroup>
								<MenuItem
									shortcut={'Alt + Shift + ↑'}
									disabled={disableInsertRowUp}
									onClick={e => onInsertRow(e, cellId, 'above')}
								>
									Insert Row Above
								</MenuItem>

								<MenuItem
									shortcut={'Alt + Shift + ↓'}
									onClick={e => onInsertRow(e, cellId, 'below')}
								>
									Insert Row Below
								</MenuItem>
							</MenuGroup>

							{canShowRowMove && (
								<MenuGroup>
									<MenuItem
										shortcut={'Alt + ↑'}
										disabled={disableMoveRowUp}
										onClick={e => onMoveRow(e, cellId, 'up')}
									>
										Move Row Up
									</MenuItem>

									<MenuItem
										shortcut={'Alt + ↓'}
										disabled={disableMoveRowDown}
										onClick={e => onMoveRow(e, cellId, 'down')}
									>
										Move Row Down
									</MenuItem>
								</MenuGroup>
							)}

							<MenuGroup>
								<MenuItem shortcut={'Alt + Delete'} onClick={e => onDeleteRow(e, cellId)}>
									Delete Row
								</MenuItem>
							</MenuGroup>
						</>
					)}
				</div>
			</Popover>
		</>
	);
}

export const CellMenu = memo(CellMenuImpl);
