/* External dependencies */
import { useEffect, useRef, useCallback, memo } from '@wordpress/element';
import { Popover, MenuGroup, MenuItem } from '@wordpress/components';
import { copySmall, scissors, paste } from '@wordpress/icons';

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
 * @return {Object} Updated cell
 */
function CellMenuImpl(props = {}) {
	const {
		menuId,
		anchor,
		table,
		cellId,
		cellAttributes,
		updatedCell,
		onRequestClose,
	} = props;

	const tableId = table?.table_id;
	const {column_id, row_id} = getCellIdCoordinates(cellId);

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

	const onCopyCell = useCallback(
		(event, cellId) => {
			const updateType = 'copyCell';

			updatedCell(event, updateType, tableId, cellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	const onCutCell = useCallback(
		(event, cellId) => {
			const updateType = 'cutCell';

			updatedCell(event, updateType, tableId, cellId, '');
			close();
		},
		[updatedCell, tableId, close]
	);

	const onPasteCell = useCallback(
		(event, cellId) => {
			const updateType = 'pasteCell';

			updatedCell(event, updateType, tableId, cellId, '');
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

	const hasTableId = tableId !== null && tableId !== undefined;
	const hasCellId = cellId !== null && cellId !== undefined;

	const canRender =
		!!anchor && hasTableId && hasCellId;

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
					role="menu"
					aria-label={`Cell ${cellId} menu`}
					tabIndex={-1}
					onKeyDown={onKeyDown}
				>
					<MenuGroup>
						<MenuItem icon={copySmall} onClick={e => onCopyCell(e, cellId)}>
							Copy
						</MenuItem>
						<MenuItem icon={scissors} onClick={e => onCutCell(e, cellId)}>
							Cut
						</MenuItem>
						<MenuItem icon={paste} onClick={e => onPasteCell(e, cellId)}>
							Paste
						</MenuItem>
					</MenuGroup>
				</div>
			</Popover>
		</>
	);
}

export const CellMenu = memo(CellMenuImpl);
