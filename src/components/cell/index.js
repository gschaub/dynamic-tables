/* External dependencies */
import { useState, useEffect, useLayoutEffect, useRef, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { RichText } from '@wordpress/block-editor';
import { Icon, pencil as edit } from '@wordpress/icons';
import clsx from 'clsx';

/* Internal dependencies */
import {
	getCellIdCoordinates,
	formatedDisplayDate,
	formattedIsoDate,
	normalizeColumnDataType,
	sanitizeNumberInput,
	formattedNumber,
	toPercentEntryValue,
	fromPercentEntryValue,
	countCaretTokens,
	getCaretIndexFromTokenCount,
	getFirstNumericIndex,
	normalizeCaretForPresentationPrefix,
	htmlToIndexText,
} from '../../utils';

import { TableCheckbox } from '../formatted-display';
import '../../editor.scss';

/**
 * Component to render and manage cell content editing
 *
 * Data Shape as follows with date-time as an example
 *
 * Type Registry
 *
 *   TYPES = {
 *     general: {
 *       label: 'Rich Text',
 * 	   },
 *
 *     'date-time': {
 *       label: 'Date/Time',
 *       formats: {
 *         date: { label: 'Date' },
 *         time: { label: 'Time' },
 *         datetime-local: { label: 'Date & Time' },
 *       },
 *     },
 *   }
 *
 *   Column - attributes.columnDataType:
 *	  {
 *        Date/Time Example
 *
 *		  type: 'date-time',
 *		  settings: {
 *			  format: 'date',
 *			  defaultToToday: false,
 *	  },
 *
 *   Cell - Content:
 *     Raw content value (example 10/1/2025)
 *
 *   Cell - attributes.value:
 *   {
 *        Column columnDataType may be included only if an override is permitted
 *        for this data type AND an override exists for this particular cell
 *        overrides: {...}
 *
 * 		  meta: {
 *            label: 'My Date',
 * 		      size: 'My Size',
 *        },
 * 		  // Dependencies on other objects external to Cell. Example for post
 * 	  	  ref: {
 * 			  kind: 'post',
 * 			  id: 45,
 * 		  },
 * 		  // search support
 * 		  indexText: 'optimized for web search, all text only' (example 2025-10-01),
 *   }
 *
 * @since 1.1.1
 * @since 1.2.0  Added column data type logic and Date/Time render
 * @since 1.2.4  Added support for number column content type
 *
 * @param {Object} props Passed attributes
 * @return {Object} events for cell content editing
 */
export function Cell(props) {
	const {
		cellType,
		isContentOnlyMode = false,
		dataFormat,
		table,
		cell_id,
		content,
		attributes,
		isFocused,
		columnClassNames,
		cellBaseClasses,
		cellClassNames,
		showGridLinesCSS,
		gridLineWidthCSS,
		onChange,
		onMouseDown,
		onContextMenu,
		borderHandleProps = {},
		cellTagId,
		isEditing,
		onRequestEdit,
		onRequestStopEdit,
		onRequestFocus,
		canOpenContextMenu = false,
		contextMenuProps = {},
	} = props;

	const { column_id, row_id } = getCellIdCoordinates(cell_id);
	const table_id = table?.table_id;
	const { type, settings } = normalizeColumnDataType(dataFormat);

	const [inputType, setInputType] = useState(() => settings?.format || '');
	const [cellContent, setCellContent] = useState();
	const initialCellValue = useRef(content);
	const [cellAttributes, setCellAttributes] = useState(attributes);

	const numberEntryWrapperRef = useRef(null);
	const numberEntryInputRef = useRef(null);
	const pendingCaretRef = useRef(null);
	const [percentEntryValue, setPercentEntryValue] = useState(null);

	const numberEntryValue =
		inputType === 'percent'
			? (percentEntryValue ?? toPercentEntryValue(cellContent))
			: (cellContent ?? '');

	const numberDisplayValue = formattedNumber(
		cellContent,
		inputType,
		settings?.formatOptions?.thousandSeparator,
		settings?.formatOptions?.decimalPlaces,
		settings?.formatOptions?.showCurrencySymbol,
		settings?.formatOptions?.bracketNegative
	);
	const sanitizedNumber = sanitizeNumberInput(cellContent, inputType);
	const redNegativeNumber =
		settings?.formatOptions?.redNegative &&
		sanitizedNumber !== '' &&
		sanitizedNumber !== '-' &&
		Number(sanitizedNumber) < 0;
	const checkboxVariant = settings?.format || inputType || 'standard';
	const shouldHideCheckbox =
		!isEditing && settings?.formatOptions?.hideIfEmpty && isEmptyCheckboxValue(cellContent);

	/**
	 * Identify whether checkbox cell value is empty
	 *
	 * @since 1.4.3
	 *
	 * @param {boolean} value Checkbox cell value
	 * @return {boolean}  Is cell content empty?
	 */
	function isEmptyCheckboxValue(value) {
		return value === '' || value === null || value === undefined;
	}

	/**
	 * Identify whether checkbox value should be true or false
	 *
	 * @since 1.4.3
	 *
	 * @param {boolean} value Checkbox cell value
	 * @return {boolean} Checkbox value to render
	 */
	function getCheckboxCheckedState(value) {
		const normalizedValue = typeof value === 'string' ? value.trim().toLowerCase() : value;

		if (
			normalizedValue === true ||
			normalizedValue === 'true' ||
			normalizedValue === 1 ||
			normalizedValue === '1'
		) {
			return true;
		}

		if (
			normalizedValue === false ||
			normalizedValue === 'false' ||
			normalizedValue === 0 ||
			normalizedValue === '0'
		) {
			return false;
		}

		return !!(settings?.formatOptions?.defaultToChecked && isEmptyCheckboxValue(value));
	}

	/**
	 * Return markup for checkbox being edited
	 *
	 * @since 1.4.3
	 */
	function checkboxEditValue() {
		const isChecked = getCheckboxCheckedState(cellContent);
		const scale = checkboxVariant === 'freeform' ? 0.6 : 1;

		return (
			<TableCheckbox
				checked={isChecked}
				variant={checkboxVariant}
				scale={scale}
				onChange={processBooleanCellEdit}
			/>
		);
	}

	/**
	 * Process effect of changes to cell level attributes
	 *
	 * @since 1.2.0
	 */
	useEffect(() => {
		setCellAttributes(attributes);
		initialCellValue.current = content ?? '';

		// Default behavior: raw content as-is
		setCellContent(content ?? '');
	}, [content, attributes]);

	/**
	 * Process effect of changes to column level attributes
	 *
	 * @since 1.2.0
	 */
	useEffect(() => {
		if (cellType !== 'body' || (type !== 'date-time' && type !== 'number')) return;

		const resolvedFormat = settings?.format || '';

		if (isEditing) {
			// Enter edit mode: force a valid HTML input value FIRST
			if (cellType === 'body' && type === 'date-time') {
				const raw = content ?? initialCellValue.current ?? '';

				if (raw) {
					setCellContent(formattedIsoDate(raw, resolvedFormat));
				} else if (settings?.defaultToToday) {
					setCellContent(formattedIsoDate('', resolvedFormat));
				} else {
					setCellContent('');
				}
			}

			// Enter edit mode: force a valid HTML input value FIRST
			if (cellType === 'body' && type === 'number') {
				const raw = content ?? initialCellValue.current ?? '';
				setCellContent(raw);
			}
		} else {
			const raw = content ?? '';
			if (cellType === 'body' && type === 'date-time') {
				setCellContent(raw ? formatedDisplayDate(raw, resolvedFormat) : '');
			}
			if (cellType === 'body' && type === 'number') {
				setCellContent(raw);
			}
		}

		setInputType(resolvedFormat);
		setCellAttributes(attributes);
		initialCellValue.current = content ?? '';
	}, [isEditing, content, attributes, cellType, type, settings?.format, settings?.defaultToToday]);

	/**
	 * Support caret positioning during entry
	 *
	 * @since 1.2.4
	 */
	useLayoutEffect(() => {
		const input = numberEntryWrapperRef.current?.querySelector('input') ?? null;
		numberEntryInputRef.current = input;

		if (!input || !pendingCaretRef.current) {
			return;
		}

		if (input !== input.ownerDocument.activeElement) {
			pendingCaretRef.current = null;
			return;
		}

		let nextCaret = getCaretIndexFromTokenCount(input.value, pendingCaretRef.current.tokenCount);

		nextCaret = normalizeCaretForPresentationPrefix(
			input.value,
			nextCaret,
			pendingCaretRef.current
		);

		input.setSelectionRange(nextCaret, nextCaret);
		pendingCaretRef.current = null;
	}, [numberEntryValue]);

	/**
	 * Handle onChange event for cell content update
	 *
	 * @since 1.1.1
	 * @since 1.2.0   Converted input to object to update multiple fields
	 *
	 * @param {Object} patch event data
	 */
	function updateCellData(patch) {
		initialCellValue.current = patch.content;

		if (patch.content !== undefined) setCellContent(patch.content);
		if (patch.attributes !== undefined) setCellAttributes(patch.attributes);

		onChange(table_id, cell_id, patch);
	}

	/**
	 * Support key press overrides for date/time input
	 *
	 * @since 1.2.2
	 *
	 * @param {Object} event Key press event
	 */
	function onDateTimeKeyDown(event) {
		const key = String(event.key || '').toLowerCase();
		if ((inputType === 'time' || inputType === 'datetime-local') && (key === 'a' || key === 'p')) {
			const currentValue = event.currentTarget?.value ?? cellContent ?? '';
			const nextValue = applyMeridiemShortcut(currentValue, inputType, key);

			if (nextValue !== currentValue) {
				event.preventDefault();
				event.stopPropagation();
				setCellContent(nextValue);
			}
		}
	}

	/**
	 * Support key press overrides for date/time input
	 *
	 * @since 1.2.2
	 *
	 * @param {string} currentCellContent Cell contents
	 * @param {string} format             Date/Time format
	 * @param {string} keyValue           Key press value
	 * @return {string} Updated input value
	 */
	function applyMeridiemShortcut(currentCellContent, format, keyValue) {
		if (!currentCellContent || (format !== 'time' && format !== 'datetime-local')) {
			return currentCellContent;
		}

		const isPm = keyValue === 'p';

		if (format === 'time') {
			const match = /^(\d{2}):(\d{2})(:\d{2})?$/.exec(currentCellContent);
			if (!match) return currentCellContent;

			let hours = Number(match[1]);
			if (!Number.isFinite(hours)) return currentCellContent;

			if (isPm && hours < 12) hours += 12;
			if (!isPm && hours >= 12) hours -= 12;

			return `${String(hours).padStart(2, '0')}:${match[2]}${match[3] || ''}`;
		}

		const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(:\d{2})?$/.exec(currentCellContent);
		if (!match) return currentCellContent;

		let hours = Number(match[2]);
		if (!Number.isFinite(hours)) return currentCellContent;

		if (isPm && hours < 12) hours += 12;
		if (!isPm && hours >= 12) hours -= 12;

		return `${match[1]}T${String(hours).padStart(2, '0')}:${match[3]}${match[4] || ''}`;
	}

	/**
	 * Change number string from entry
	 *
	 * @since 1.2.4
	 *
	 * @param {Object} event New number string
	 */
	function onNumberChange(event) {
		const input = numberEntryInputRef.current;
		const entryValue = sanitizeNumberInput(event, inputType === 'percent' ? 'number' : inputType);
		const selectionStart = input?.selectionStart ?? entryValue.length;
		const firstNumericIndex = getFirstNumericIndex(entryValue);

		pendingCaretRef.current = {
			tokenCount: countCaretTokens(entryValue, selectionStart),
			wasAtStart: selectionStart === 0,
			wasInPrefixZone:
				firstNumericIndex !== -1 && selectionStart > 0 && selectionStart <= firstNumericIndex,
		};

		let nextRawValue = entryValue;
		let revisedDecimalPlaces = settings?.formatOptions?.decimalPlaces ?? 0;

		if (inputType === 'percent') {
			const [integerPart, fractionPart = ''] = entryValue.split('.');
			const nextEntryValue =
				fractionPart.length > revisedDecimalPlaces
					? `${integerPart}.${fractionPart.slice(0, revisedDecimalPlaces)}`
					: entryValue;

			setPercentEntryValue(nextEntryValue);
			revisedDecimalPlaces += 2;
			nextRawValue = fromPercentEntryValue(nextEntryValue);
		} else {
			setPercentEntryValue(null);
		}

		if (inputType !== 'integer') {
			const [integerPart, fractionPart = ''] = nextRawValue.split('.');
			const fractionalExcessLength = fractionPart.length - revisedDecimalPlaces;

			if (fractionalExcessLength > 0) {
				nextRawValue = `${integerPart}.${fractionPart.slice(0, revisedDecimalPlaces)}`;
			}
		}

		setCellContent(nextRawValue);
	}

	/**
	 * Prepare updated cell content and pass to update handler
	 *
	 * @since 1.3.1
	 *
	 * @param {string} nextContent   Updated formatted text content for the cell
	 * @param {string} nextIndexText Updated plain text conent for the cell
	 */
	function persistCellEdit(nextContent, nextIndexText) {
		updateCellData({
			content: nextContent,
			attributes: {
				...cellAttributes,
				value: {
					...(cellAttributes?.value || {}),
					indexText: nextIndexText,
				},
			},
		});
	}

	function processBooleanCellEdit(updatedValue) {
		persistCellEdit(updatedValue, updatedValue ? 'true' : 'false');
	}

	/**
	 * Relay mouse down event for menu cells
	 *
	 * @since 1.2.0
	 *
	 * @param {number} column_id Clicked table column
	 * @param {number} row_id    Clicked table row
	 * @param {Object} table     Current Dynamic Table
	 * @param {Object} e         Border click event object
	 */
	function passMouseMenuClick(column_id, row_id, table, e) {
		if (e.button !== 0) {
			onContextMenu(column_id, row_id, table, e);
		} else {
			onMouseDown(column_id, row_id, table, e);
		}
	}

	/**
	 * Render the common control for cell types edited in a modal.
	 *
	 * @since 1.4.6
	 *
	 * @param {string} label Accessible label and native tooltip text.
	 * @return {Object} Cell edit button.
	 */
	const renderCellEditButton = (label = __('Edit cell', 'dynamic-table-blocks')) => (
		<button
			type="button"
			className="grid-control__cell-edit-button"
			aria-label={label}
			data-dtbk-cell-edit-button
			title={label}
			onMouseDown={e => {
				e.preventDefault();
			}}
			onClick={e => {
				passMouseEditClick(
					table_id,
					cell_id,
					cellContent,
					cellAttributes,
					cellBaseClasses,
					dataFormat,
					e
				);
			}}
		>
			<Icon icon={edit} size={16} />
		</button>
	);

	/**
	 * Relay mouse down event for cell editing
	 *
	 * @since 1.4.6
	 *
	 * @param {number} table_id        Table identifier
	 * @param {string} cell_id         Clicked table cell for editing
	 * @param {Object} cellContent     Cell content
	 * @param {Object} cellAttributes  Cell attributes
	 * @param {string} cellBaseClasses Cell space delimited class names
	 * @param {Object} dataFormat      Column data format
	 * @param {Object} e               Border click event object
	 */
	function passMouseEditClick(
		table_id,
		cell_id,
		cellContent,
		cellAttributes,
		cellBaseClasses,
		dataFormat,
		e
	) {
		const cellValueAttributes = cellAttributes?.value || {};
		onMouseDown(
			table_id,
			cell_id,
			cellContent,
			cellValueAttributes,
			cellBaseClasses,
			dataFormat,
			e
		);
	}

	/**
	 * React HTML to render a cell based on its type
	 *
	 * @since 1.1.1
	 * @since 1.2.0    Add DateTime render type
	 * @since 1.2.4    Add Number render type
	 *
	 * @return {void}
	 */
	const renderTypes = {
		richText: () => (
			<RichText
				tagName="div"
				className="dtbk-cell-general-content"
				value={cellContent}
				readOnly={!isEditing}
				spellCheck={true}
				onBlur={() => {
					if (isEditing) {
						onRequestStopEdit?.();
					}
				}}
				onChange={
					!isEditing
						? undefined
						: next => {
								const indexText = htmlToIndexText(next);
								persistCellEdit(next, indexText);
							}
				}
			></RichText>
		),
		border: () => {
			const isCornerBorderCell = String(row_id) === '0' && String(column_id) === '0';
			const isBorderHandle =
				!isCornerBorderCell && (String(row_id) === '0' || String(column_id) === '0');
			const isRowHandle = String(column_id) === '0' && String(row_id) !== '0';
			const currentRow = isRowHandle
				? table?.rows?.find(r => String(r.row_id) === String(row_id))
				: null;
			const isHeaderRowHandle = currentRow?.attributes?.isHeader === true;
			const canOpenBorderMenu = !isContentOnlyMode || (isRowHandle && !isHeaderRowHandle);

			if (!isBorderHandle || !canOpenBorderMenu) {
				return <div aria-hidden="true">{cellContent}</div>;
			}

			return (
				<button
					type="button"
					className="grid-control__border-button"
					aria-label={borderHandleProps.ariaLabel}
					aria-haspopup="menu"
					aria-expanded={borderHandleProps.expanded}
					aria-controls={borderHandleProps.expanded ? borderHandleProps.controls : undefined}
					onMouseDown={e => {
						e.preventDefault();
					}}
					onClick={e => {
						passMouseMenuClick(column_id, row_id, table, e);
					}}
				>
					<span aria-hidden="true">{cellContent}</span>
				</button>
			);
		},

		dateTime: () => {
			if (!isEditing) {
				return <div>{cellContent}</div>;
			}

			return (
				<TextControl
					className={renderClassesEdit}
					type={inputType}
					value={cellContent}
					onKeyDown={event => {
						onDateTimeKeyDown(event);
					}}
					onChange={next => {
						setCellContent(next);
					}}
					onBlur={event => {
						if (event?.target?.dataset?.cancelEdit === 'true') {
							delete event.target.dataset.cancelEdit;
							onRequestStopEdit?.();
							return;
						}

						const format = settings?.format || inputType || 'date';
						const next = event?.target?.value ?? cellContent ?? '';
						const formattedContent = formattedIsoDate(next, format);
						persistCellEdit(next, formattedContent);
						onRequestStopEdit?.();
					}}
				/>
			);
		},
		number: () => {
			if (!isEditing) {
				return <div>{numberDisplayValue}</div>;
			}

			return (
				<div ref={numberEntryWrapperRef}>
					<TextControl
						className={renderClassesEdit}
						type={'text'}
						inputMode={inputType === 'integer' ? 'numeric' : 'decimal'}
						value={numberEntryValue}
						onChange={event => {
							onNumberChange(event);
						}}
						onBlur={event => {
							pendingCaretRef.current = null;
							setPercentEntryValue(null);

							if (event?.target?.dataset?.cancelEdit === 'true') {
								delete event.target.dataset.cancelEdit;
								onRequestStopEdit?.();
								return;
							}

							const next = cellContent ?? '';
							persistCellEdit(next, next);
							onRequestStopEdit?.();
						}}
					/>
				</div>
			);
		},
		checkbox: () => {
			if (shouldHideCheckbox) {
				return null;
			}

			if (!isEditing) {
				if (settings?.formatOptions?.hideIfEmpty && isEmptyCheckboxValue(cellContent)) {
					return null;
				}

				const isChecked = getCheckboxCheckedState(cellContent);

				const scale = checkboxVariant === 'freeform' ? 0.6 : 1;

				return <TableCheckbox checked={isChecked} variant={checkboxVariant} scale={scale} />;
			}

			const editedCheckbox = checkboxEditValue();

			return <div>{editedCheckbox}</div>;
		},
		link: () => {
			if (!isEditing) {
				return (
					<>
						<RichText.Content
							tagName="span"
							className="grid-control__cell-edit-content"
							value={cellContent}
						/>
						{renderCellEditButton(__('Edit link cell', 'dynamic-table-blocks'))}
					</>
				);
			}
			return <div>Placeholder</div>;
		},
		post: () => {
			if (!isEditing) {
				return (
					<>
						<RichText.Content
							tagName="span"
							className="grid-control__cell-edit-content"
							value={cellContent}
						/>
						{renderCellEditButton(__('Edit link cell', 'dynamic-table-blocks'))}
					</>
				);
			}
			return <div>Placeholder</div>;
		},
	};

	let renderPipeline = [];

	switch (cellType) {
		case 'border':
			renderPipeline = ['border'];
			break;
		case 'header':
			renderPipeline = ['richText'];
			break;
		case 'body':
			switch (type) {
				case 'general':
					renderPipeline = ['richText'];
					break;
				case 'border':
					renderPipeline = ['border'];
					break;
				case 'date-time':
					renderPipeline = ['dateTime'];
					break;
				case 'number':
					renderPipeline = ['number'];
					break;
				case 'checkbox':
					renderPipeline = ['checkbox'];
					break;
				case 'link':
					renderPipeline = ['link'];
					break;
				case 'post':
					renderPipeline = ['post'];
					break;
				default:
					break;
			}
			break;
		default:
			break;
	}

	const renderClassesDisplay = clsx(columnClassNames, cellClassNames, {
		'grid-control__cellEditor--dateTimeInput': cellType === 'body' || type === 'date-time',
		'grid-control__body-cells--checkbox': type === 'checkbox',
		'grid-control__body-columns--number-red': redNegativeNumber,
	});

	const renderClassesEdit = clsx(columnClassNames, {
		'grid-control__cellEditor--dateTimeInput': cellType === 'body' || type === 'date-time',
		'grid-control__body-cells--checkbox': type === 'checkbox',
		'grid-control__body-columns--number-red': redNegativeNumber,
	});

	const isBorderCell = cellType === 'border';

	let cellRole = 'presentation';
	if (cellType === 'header') {
		cellRole = 'columnheader';
	} else if (cellType === 'body') {
		cellRole = 'gridcell';
	}

	const ariaColIndex = !isBorderCell ? Number(column_id) : undefined;
	const computedTabIndex = !isBorderCell && isFocused ? 0 : -1;

	return (
		<div
			id={cellTagId}
			role={cellRole}
			aria-colindex={ariaColIndex}
			aria-haspopup={!isBorderCell && canOpenContextMenu ? 'menu' : undefined}
			aria-expanded={!isBorderCell && canOpenContextMenu ? contextMenuProps.expanded : undefined}
			aria-controls={
				!isBorderCell && canOpenContextMenu && contextMenuProps.expanded
					? contextMenuProps.controls
					: undefined
			}
			data-cell-id={cell_id}
			data-col={Number(column_id)}
			data-row={Number(row_id)}
			tabIndex={computedTabIndex}
			className={renderClassesDisplay}
			style={
				cellType === 'border'
					? undefined
					: {
							'--showGridLines': showGridLinesCSS,
							'--gridLineWidth': gridLineWidthCSS,
						}
			}
			onMouseDown={e => {
				if (cellType === 'border') return;
				if (isEditing) return;
				if (e.button !== 0) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				onRequestFocus?.(Number(column_id), Number(row_id));
			}}
			onDoubleClick={e => {
				if (cellType === 'border') return;
				e.preventDefault();
				onRequestEdit?.(cell_id);
			}}
			onContextMenu={e => {
				if (cellType === 'border' || !canOpenContextMenu) return;
				e.preventDefault();
				passMouseMenuClick(column_id, row_id, table, e);
				onRequestFocus?.(Number(column_id), Number(row_id));
			}}
		>
			{renderPipeline.map(key => {
				const renderPart = renderTypes[key];

				if (!renderPart) {
					return null;
				}

				// Stable key in React list:
				return <Fragment key={key}>{renderPart()}</Fragment>;
			})}
		</div>
	);
}
