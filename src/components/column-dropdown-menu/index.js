/* External dependencies */
import { useEffect, useRef, useCallback, memo } from '@wordpress/element';
import { Popover, MenuGroup, MenuItem } from '@wordpress/components';
import { cog, settings, tableColumnBefore, tableColumnDelete } from '@wordpress/icons';

/* Internal dependencies */
import './style.scss';
import '../../editor.scss';

/**
 * React component drop down menu to configure current column properties.
 *
 * @since    1.0.0
 * @since    1.1.2 Refactor component to improve UX and prerformance
 *
 * @param {Object} props
 * @return {Object} Updated column
 */
function ColumnMenuImpl(props = {}) {
	const { anchor, tableId, columnId, columnLabel, updatedColumn, onRequestClose } = props;

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
	const hasColumnId = columnId !== null && columnId !== undefined;
	const canRender = !!anchor && typeof updatedColumn === 'function' && hasTableId && hasColumnId;

	// Focus first item on open (next frame so Popover has mounted)
	useEffect(() => {
		if (!canRender) return;

		window.requestAnimationFrame(() => {
			// Prefer explicit first item ref; fallback to first button inside menu
			const el =
				firstItemRef.current || menuRootRef.current?.querySelector?.('button,[role="menuitem"]');
			el?.focus?.();
		});
	}, [canRender, anchor, columnId]);

	/**
	 * Column attributes for inserting new column.
	 *
	 * @since    1.0.0
	 * @since    1.1.2 Refactor to use useCallback for performance purposes
	 *
	 * @param {Object} event    Menu action
	 * @param {number} columnId Column ID for new column
	 */
	const onInsertColumn = useCallback(
		(event, targetColumnId) => {
			updatedColumn(event, 'insert', tableId, targetColumnId, '');
			close();
		},
		[updatedColumn, tableId, close]
	);

	/**
	 * Column to delete.
	 *
	 * @since    1.0.0
	 * @since    1.1.2 Refactor to use useCallback for performance purposes
	 *
	 * @param {Object} event    Menu action
	 * @param {number} columnId Column ID for column to remove
	 */
	const onDeleteColumn = useCallback(
		(event, targetColumnId) => {
			updatedColumn(event, 'delete', tableId, targetColumnId, '');
			close();
		},
		[updatedColumn, tableId, close]
	);

	/**
	 * Updated column attributes for processing.
	 *
	 * @since    1.0.0
	 * @since    1.1.2 Refactor to move column width handling up to parent component
	 *
	 * @param {Object} event          Menu action
	 * @param {Object} targetColumnId Column ID for update
	 */
	const onUpdateColumnWidth = useCallback(
		(event, targetColumnId) => {
			updatedColumn(event, 'attributes', tableId, targetColumnId, '');
			close();
		},
		[tableId, close]
	);

	/**
	 * Updated column attributes for processing.
	 *
	 * @since    1.0.0
	 * @since    1.1.2 Refactor to move column width handling up to parent component
	 *
	 * @param {Object} event          Menu action
	 * @param {Object} targetColumnId Column ID for update
	 */
	const onUpdateColumnDataType = useCallback(
		(event, targetColumnId) => {
			updatedColumn(event, 'dataType', tableId, targetColumnId, '');
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
				className="menu-col__main"
				role="menu"
				aria-label={`Column ${columnLabel} menu`}
				placement="bottom"
				focusOnMount={false}
				offset={8}
				noArrow={false}
				flip
				tabIndex={-1}
				onKeyDown={onKeyDown}
				onClose={handlePopoverClose}
			>
				<MenuGroup className="components-menu-group">
					<MenuItem
						icon={settings}
						onClick={e => onUpdateColumnDataType(e, columnId)}
						ref={firstItemRef}
					>
						Column Content Type...
					</MenuItem>

					<MenuItem
						icon={cog}
						onClick={e => onUpdateColumnWidth(e, columnId)}
					>
						Update Column Width...
					</MenuItem>
				</MenuGroup>

				<MenuGroup>
					<MenuItem icon={tableColumnBefore} onClick={e => onInsertColumn(e, columnId)}>
						Insert Column (Left)
					</MenuItem>

					<MenuItem icon={tableColumnDelete} onClick={e => onDeleteColumn(e, columnId)}>
						Delete Column
					</MenuItem>
				</MenuGroup>
			</Popover>
		</>
	);
}

export const ColumnMenu = memo(ColumnMenuImpl);
