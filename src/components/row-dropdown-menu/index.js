/* External dependencies */
import { useEffect, useRef, useCallback, useState, memo } from '@wordpress/element';
import { Popover, MenuGroup, MenuItem } from '@wordpress/components';
import { settings, tableRowBefore, tableRowDelete } from '@wordpress/icons';

/* Internal dependencies */
import './style.scss';
import '../../editor.scss';

/**
 * React component drop down menu to configure current row properties.
 *
 * @since    1.0.0
 * @since    1.1.2 Refactor component to improve UX and prerformance
 *
 * @param {Object} props
 * @return {Object} Updated row
 */
function RowMenuImpl(props = {}) {
	const { anchor, tableId, rowId, rowLabel, updatedRow, onRequestClose } = props;

	// Refs for focus management
	const menuRootRef = useRef(null);
	const firstItemRef = useRef(null);

	/**
	 * Close the menu based on event actions
	 *
	 * @since    1.1.2
	 */
	const close = useCallback(() => {
		onRequestClose?.();
	}, [onRequestClose]);

	/**
	 * Handle keyboard navigation.
	 *
	 * Description: Escape closes; Up/Down moves among menu items.
	 *
	 * @since    1.1.2
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

				onRequestClose?.();
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
	 * Close the menu when the popover requests to close.
	 *
	 * @since    1.1.2
	 */
	const handlePopoverClose = useCallback(() => {
		onRequestClose?.();
	}, [onRequestClose]);

	const hasTableId = tableId !== null && tableId !== undefined;
	const hasRowId = rowId !== null && rowId !== undefined;
	const canRender = !!anchor && typeof updatedRow === 'function' && hasTableId && hasRowId;

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
	}, [canRender, anchor, rowId]);

	/**
	 * Row attributes for inserting new row.
	 *
	 * @since    1.0.0
	 * @since    1.1.2 Refactor to use useCallback for performance purposes
	 *
	 * @param {Object} event Menu action
	 * @param {number} rowId Row ID for new row
	 */
	const onInsertRow = useCallback(
		(event, targetRowId) => {
			updatedRow(event, 'insert', tableId, targetRowId, '');
			close();
		},
		[updatedRow, tableId, close]
	);

	/**
	 * Row to delete.
	 *
	 * @since    1.0.0
	 * @since    1.1.2 Refactor to use useCallback for performance purposes
	 *
	 * @param {Object} event Menu action
	 * @param {number} rowId Row ID for row to remove
	 */
	const onDeleteRow = useCallback(
		(event, targetRowId) => {
			updatedRow(event, 'delete', tableId, targetRowId, '');
			close();
		},
		[updatedRow, tableId, close]
	);

	/**
	 * Updated row attributes for processing.
	 *
	 * @since    1.0.0
	 * @since    1.1.2 Refactor to move row height handling up to parent component
	 *
	 * @param {Object} event       Menu action
	 * @param {number} targetRowId Row ID for update
	 */
	const onUpdateRowHeight = useCallback(
		(event, targetRowId) => {
			console.log('In Dropdown Menu, onUpdateRowHeight selection');
			console.log(event);

			updatedRow(event, 'attributes', tableId, targetRowId, '');
			close();
		},
		[tableId, close]
	);

	if (!canRender) return null;

	return (
		<>
			<Popover
				anchor={anchor}
				ref={menuRootRef}
				role="menu"
				aria-label={`Row ${rowLabel} menu`}
				placement="right-start"
				focusOnMount={false}
				offset={8}
				noArrow={false}
				flip
				tabIndex={-1}
				onKeyDown={onKeyDown}
				onClose={handlePopoverClose}
			>
				<MenuGroup>
					<MenuItem icon={settings} onClick={e => onUpdateRowHeight(e, rowId)} ref={firstItemRef}>
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
			</Popover>
		</>
	);
}

export const RowMenu = memo(RowMenuImpl);
