/* External dependencies */
import { useInstanceId } from '@wordpress/compose';
import { useLayoutEffect, useRef, useState, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	BaseControl,
	Button,
	SelectControl,
	CheckboxControl,
	RadioControl,
	TextControl,
	ToggleControl,
	__experimentalInputControl as InputControl,
	__experimentalVStack as VStack,
	Flex,
	FlexItem,
	Card,
	CardBody,
	CardHeader,
} from '@wordpress/components';
import {
	Card as NewCard,
	Stack,
	InputControl as NewInputControl,
	CheckboxControl as NewCheckboxControl,
	SelectControl as NewSelectControl,
	InputLayout,
	IconButton,
} from '@wordpress/ui';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import './style.scss';
import { FreeformCheckboxIcon, StatusIcon } from '../ui/icon';
import { NumberIncrementControl } from '../ui/number-increment-control';
import {
	normalizeColumnDataType,
	stageClassesForEdit,
	prepareClassesForUse,
	sanitizeNumberInput,
	formattedNumber,
	toPercentEntryValue,
	fromPercentEntryValue,
	countCaretTokens,
	getCaretIndexFromTokenCount,
	getFirstNumericIndex,
	normalizeCaretForPresentationPrefix,
} from '../../utils';
import { CellPostContent } from '../ui/post-content';
import { ConfigurePostColumnDataType } from './post';

/**
 * React component to configure data types for a column.
 *
 * @since    1.1.2
 *
 * @param {Object} props
 * @return {Object} Updated column properties
 */
function ConfigureColumnDataType(props = {}) {
	const instanceId = useInstanceId(ConfigureColumnDataType);
	const previewId = `dtbk-preview-${instanceId}`;
	const {
		tableId,
		columnId,
		columnLabel,
		columnAttributes,
		columnClasses,
		updatedColumn,
		onRequestClose,
	} = props;

	const normalizedColumnDataType = normalizeColumnDataType(columnAttributes?.columnDataType);

	const [columnName, setColumnName] = useState(columnLabel);
	const [dataType, setDataType] = useState(normalizedColumnDataType);
	const [dataTypeFormat, setDataTypeFormat] = useState(
		normalizedColumnDataType?.settings?.format || ''
	);
	const [updateColumnStyle, setUpdateColumnStyle] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.updateColumnStyle || true
	);

	const [columnClassNames, setColumnClassNames] = useState(stageClassesForEdit(columnClasses));
	const columnClassNamesRender = prepareClassesForUse(columnClassNames);

	// Date specific attributes
	const initDefaultToToday =
		normalizedColumnDataType?.settings?.defaultToToday === true ? true : false;
	const isDateDataType = normalizedColumnDataType?.type === 'date-time' ? true : false;
	const initDatePreviewValue =
		initDefaultToToday && isDateDataType
			? formattedDate(normalizedColumnDataType?.settings?.format)
			: '';

	const [dateDefaultToToday, setDateDefaultToToday] = useState(initDefaultToToday);
	const [datePreviewValue, setDatePreviewValue] = useState(initDatePreviewValue);

	// Number specifica attributes
	const [decimalPlaces, setDecimalPlaces] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.decimalPlaces || 0
	);
	const [thousandSeparator, setThousandSeparator] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.thousandSeparator || true
	);
	const [currency, setCurrency] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.showCurrencySymbol || false
	);
	const [redNegative, setRedNegative] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.redNegative || false
	);
	const [bracketNegative, setBracketNegative] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.bracketNegative || false
	);

	const numberEntryWrapperRef = useRef(null);
	const numberEntryInputRef = useRef(null);
	const pendingCaretRef = useRef(null);
	const [percentEntryValue, setPercentEntryValue] = useState(null);

	const [numberRawValue, setNumberRawValue] = useState('');
	const sanitizedPreviewNumber = sanitizeNumberInput(numberRawValue, dataTypeFormat);
	const showNegativeNumberPreview =
		redNegative &&
		sanitizedPreviewNumber !== '' &&
		sanitizedPreviewNumber !== '-' &&
		Number(sanitizedPreviewNumber) < 0;

	const numberEntryValue =
		dataTypeFormat === 'percent'
			? (percentEntryValue ?? toPercentEntryValue(numberRawValue))
			: numberRawValue;

	const numberDisplayValue = formattedNumber(
		numberRawValue,
		dataTypeFormat,
		thousandSeparator,
		decimalPlaces,
		currency,
		bracketNegative
	);

	// Checkbox specific attributes
	const [checkboxHideIfEmpty, setCheckboxHideIfEmpty] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.hideIfEmpty || false
	);
	const [checkboxDefaultToChecked, setCheckboxDefaultToChecked] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.defaultToChecked || false
	);
	const isCheckboxDataType = normalizedColumnDataType?.type === 'checkbox' ? true : false;

	// Post specific attributes
	const defaultDisplayElement = {
		display: false,
		column: 'none',
		order: 0,
	};

	console.log('Retrieved Column Data: ', normalizedColumnDataType);

	console.log(
		'Initial Post Display Element: ',
		sortPostDisplayElements(
			loadPostDisplayElements(
				normalizedColumnDataType.settings.formatOptions,
				defaultDisplayElement
			)
		)
	);

	const initialPostDisplayElements = sortPostDisplayElements(
		loadPostDisplayElements(normalizedColumnDataType.settings.formatOptions, defaultDisplayElement)
	);

	const [postDisplayElements, setPostDisplayElements] = useState(initialPostDisplayElements);

	const [postLinkLocation, setPostLinkLocation] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.linkLocation || 'title'
	);
	const [postTitleInCover, setPostTitleInCover] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.displayTitleInCover || false
	);

	const [postImageSize, setPostImageSize] = useState(
		normalizedColumnDataType?.settings?.formatOptions?.displayImageSize || 'thumbnail'
	);

	const initialPostItemsNoneColumnCount = countFilteredDisplayItems(
		initialPostDisplayElements,
		'none'
	);
	const initialPostItemsSpanColumnsCount = countFilteredDisplayItems(
		initialPostDisplayElements,
		'span'
	);
	const initialPostItemsLeftColumnCount = countFilteredDisplayItems(
		initialPostDisplayElements,
		'left'
	);
	const initialPostItemsRightColumnCount = countFilteredDisplayItems(
		initialPostDisplayElements,
		'right'
	);

	const [displayPostItemsNoneColumnCount, setPostDisplayItemsNoneColumnCount] = useState(
		initialPostItemsNoneColumnCount
	);
	const [displayPostItemsSpanColumnsCount, setPostDisplayItemsSpanColumnsCount] = useState(
		initialPostItemsSpanColumnsCount
	);
	const [displayPostItemsLeftColumnCount, setPostDisplayItemsLeftColumnCount] = useState(
		initialPostItemsLeftColumnCount
	);
	const [displayPostItemsRightColumnCount, setPostDisplayItemsRightColumnCount] = useState(
		initialPostItemsRightColumnCount
	);

	const postDisplayItemsPerColumn = {
		none: displayPostItemsNoneColumnCount,
		span: displayPostItemsSpanColumnsCount,
		left: displayPostItemsLeftColumnCount,
		right: displayPostItemsRightColumnCount,
	};

	if (dataType.type === 'post' && !dataTypeFormat) {
		setDataTypeFormat('link');
	}

	// Column width attributes
	const [columnWidthType, setColumnWidthType] = useState(columnAttributes.columnWidthType);
	const [minWidth, setMinWidth] = useState(columnAttributes.minWidth);
	const [minWidthUnits, setMinWidthUnits] = useState(columnAttributes.minWidthUnits);
	const [maxWidth, setMaxWidth] = useState(columnAttributes.maxWidth);
	const [maxWidthUnits, setMaxWidthUnits] = useState(columnAttributes.maxWidthUnits);
	const [fixedWidth, setFixedWidth] = useState(columnAttributes.fixedWidth);
	const [fixedWidthUnits, setFixedWidthUnits] = useState(columnAttributes.fixedWidthUnits);
	const [disableForTablet, setDisableForTablet] = useState(columnAttributes.disableForTablet);
	const [disableForPhone, setDisableForPhone] = useState(columnAttributes.disableForPhone);

	/**
	 * Stop event processing in favor of custom processing.
	 *
	 * @since    1.1.2
	 *
	 * @param {Object} event Mouse down
	 */
	function stopProp(event) {
		event.stopPropagation();
	}

	/**
	 * Close component modal.
	 *
	 * @since    1.1.2
	 */
	function close() {
		onRequestClose?.();
	}

	/**
	 * Close modal on cancel.
	 *
	 * @since    1.1.2
	 */
	function handleCancel() {
		onRequestClose?.();
	}

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
	 * Update date format and set default options
	 *
	 * @since 1.2.0
	 *
	 * @param {string} dateFormat
	 */
	function formattedDate(dateFormat) {
		const today = new Date();

		if (dateFormat === 'date') {
			return today.toISOString().split('T')[0];
		}
		if (dateFormat === 'time') {
			const hh = String(today.getHours()).padStart(2, '0');
			const mm = String(today.getMinutes()).padStart(2, '0');
			return `${hh}:${mm}`;
		}
		if (dateFormat === 'datetime-local') {
			const yyyy = today.getFullYear();
			const mo = String(today.getMonth() + 1).padStart(2, '0');
			const dd = String(today.getDate()).padStart(2, '0');
			const hh = String(today.getHours()).padStart(2, '0');
			const mm = String(today.getMinutes()).padStart(2, '0');
			return `${yyyy}-${mo}-${dd}T${hh}:${mm}`;
		}
		return '';
	}

	/**
	 * Update date format and set default options
	 *
	 * @since 1.2.0
	 *
	 * @param {string} dateFormat Date/Time format to set
	 */
	function onDateTimeType(dateFormat) {
		setDataTypeFormat(dateFormat);
		if (dateDefaultToToday) setDatePreviewValue(formattedDate(dateFormat));

		const dataTypeSettings = {
			format: dateFormat,
			defaultToToday: dateDefaultToToday,
			formatOptions: {
				updateColumnStyle: updateColumnStyle,
			},
		};

		let newColumnClassNames = new Set(columnClassNames);
		newColumnClassNames = newColumnClassNames.add('grid-control__body-columns--column-align-right');
		setColumnClassNames(newColumnClassNames);

		const updatedDataType = {
			type: 'date-time',
			settings: dataTypeSettings,
		};
		setDataType(updatedDataType);
	}

	/**
	 * Update date formatting options based on configuration input
	 *
	 * @since 1.2.4
	 *
	 * @param {Object} event  Formatting value to set
	 * @param {string} option Formatting option
	 */
	function onDateFormatOption(event, option) {
		let newUpdateColumnStyle = updateColumnStyle;
		let newColumnClassNames = new Set(columnClassNames);

		switch (option) {
			case 'format-column':
				newUpdateColumnStyle = event;
				if (event) {
					newColumnClassNames = newColumnClassNames.add(
						'grid-control__body-columns--date-align-right'
					);
				}
				break;
		}

		setUpdateColumnStyle(newUpdateColumnStyle);
		setColumnClassNames(newColumnClassNames);

		const updatedDataType = {
			...dataType,
			settings: {
				format: dataType.settings.format,
				defaultToToday: dateDefaultToToday,
				formatOptions: {
					updateColumnStyle: newUpdateColumnStyle,
				},
			},
		};

		setDataType(updatedDataType);
	}

	/**
	 * Set the date value to today's date if default to today is checked.
	 *
	 * @since 1.2.0
	 *
	 * @param {boolean} isChecked Default today's date
	 * @param {string}  type      Date/Time Format
	 */
	function onDateDefaultToToday(isChecked, type) {
		if (!isChecked) {
			setDatePreviewValue('');
		} else {
			setDatePreviewValue(formattedDate(type));
		}

		setDateDefaultToToday(isChecked);

		const dataTypeSettings = {
			format: type,
			defaultToToday: isChecked,
			formatOptions: {
				updateColumnStyle: updateColumnStyle,
			},
		};

		const updatedDataType = {
			type: 'date-time',
			settings: dataTypeSettings,
		};

		setDataType(updatedDataType);
	}

	/**
	 * Update number format and set default options
	 *
	 * @since 1.2.4
	 *
	 * @param {string} numberFormat Number format to set
	 */
	function onNumberFormat(numberFormat) {
		setPercentEntryValue(null);

		if (numberFormat === 'percent' && dataTypeFormat !== 'percent') {
			// divide by 100
			const revisedNumberValue = !!numberRawValue ? String(Number(numberRawValue) / 100) : '';
			setNumberRawValue(revisedNumberValue);
		}

		if (numberFormat !== 'percent' && dataTypeFormat === 'percent') {
			// multiply by 100
			const revisedNumberValue = !!numberRawValue ? String(Number(numberRawValue) * 100) : '';
			setNumberRawValue(revisedNumberValue);
		}

		setDataTypeFormat(numberFormat);

		let dataTypeSettings = '';
		setUpdateColumnStyle(true);

		switch (numberFormat) {
			case 'number':
				setDecimalPlaces(0);
				setThousandSeparator(true);
				setCurrency(false);
				setRedNegative(false);
				setBracketNegative(false);

				dataTypeSettings = {
					format: numberFormat,
					formatOptions: {
						decimalPlaces: 0,
						thousandSeparator: true,
						showCurrencySymbol: false,
						redNegative: false,
						bracketNegative: false,
						updateColumnStyle: true,
					},
				};

				break;
			case 'integer':
				setDecimalPlaces(0);
				setThousandSeparator(true);
				setCurrency(false);
				setRedNegative(false);
				setBracketNegative(false);

				dataTypeSettings = {
					format: numberFormat,
					formatOptions: {
						decimalPlaces: 0,
						thousandSeparator: true,
						showCurrencySymbol: false,
						redNegative: false,
						bracketNegative: false,
						updateColumnStyle: true,
					},
				};

				break;
			case 'percent':
				setDecimalPlaces(0);
				setThousandSeparator(true);
				setCurrency(false);
				setRedNegative(false);
				setBracketNegative(false);

				dataTypeSettings = {
					format: numberFormat,
					formatOptions: {
						decimalPlaces: 0,
						thousandSeparator: true,
						showCurrencySymbol: false,
						redNegative: false,
						bracketNegative: false,
						updateColumnStyle: true,
					},
				};

				break;
			case 'currency':
				setDecimalPlaces(2);
				setCurrency(true);
				setThousandSeparator(true);
				setRedNegative(false);
				setBracketNegative(false);

				dataTypeSettings = {
					format: numberFormat,
					formatOptions: {
						decimalPlaces: 2,
						thousandSeparator: true,
						showCurrencySymbol: true,
						redNegative: false,
						bracketNegative: false,
						updateColumnStyle: true,
					},
				};
		}

		let newColumnClassNames = new Set(columnClassNames);
		newColumnClassNames = newColumnClassNames.add('grid-control__body-columns--number-align-right');
		setColumnClassNames(newColumnClassNames);

		const updatedDataType = {
			type: 'number',
			settings: dataTypeSettings,
		};

		setDataType(updatedDataType);
	}

	/**
	 * Update number formatting options based on configuration input
	 *
	 * @since 1.2.4
	 *
	 * @param {Object} event  Formatting value to set
	 * @param {string} option Formatting option
	 */
	function onNumberFormatOption(event, option) {
		let newDecimalPlaces = decimalPlaces;
		let newThousandSeparator = thousandSeparator;
		let newCurrency = currency;
		let newRedNegative = redNegative;
		let newBracketNegative = bracketNegative;
		let newUpdateColumnStyle = updateColumnStyle;
		let newColumnClassNames = new Set(columnClassNames);

		switch (option) {
			case 'decimal':
				newDecimalPlaces = Math.max(0, event || 0);
				break;
			case 'thousand':
				newThousandSeparator = event;
				break;
			case 'currency':
				newCurrency = event;
				break;
			case 'red-negative':
				newRedNegative = event;
				break;
			case 'bracket-negative':
				newBracketNegative = event;
				break;
			case 'format-column':
				newUpdateColumnStyle = event;
				if (event) {
					newColumnClassNames = newColumnClassNames.add(
						'grid-control__body-columns--number-align-right'
					);
				}
				break;
		}

		setDecimalPlaces(newDecimalPlaces);
		setThousandSeparator(newThousandSeparator);
		setCurrency(newCurrency);
		setRedNegative(newRedNegative);
		setBracketNegative(newBracketNegative);
		setUpdateColumnStyle(newUpdateColumnStyle);
		setColumnClassNames(newColumnClassNames);

		const updatedDataType = {
			...dataType,
			settings: {
				format: dataType.settings.format,
				formatOptions: {
					decimalPlaces: newDecimalPlaces,
					thousandSeparator: newThousandSeparator,
					showCurrencySymbol: newCurrency,
					redNegative: newRedNegative,
					bracketNegative: newBracketNegative,
					updateColumnStyle: newUpdateColumnStyle,
				},
			},
		};

		setDataType(updatedDataType);
	}

	/**
	 * Change number string from entry
	 *
	 * @since 1.2.4
	 *
	 * @param {Object} event New number string
	 */
	function onNumberPreviewChange(event) {
		const input = numberEntryInputRef.current;

		const entryValue = sanitizeNumberInput(
			event,
			dataTypeFormat === 'percent' ? 'number' : dataTypeFormat
		);
		const selectionStart = input?.selectionStart ?? entryValue.length;
		const firstNumericIndex = getFirstNumericIndex(entryValue);

		pendingCaretRef.current = {
			tokenCount: countCaretTokens(entryValue, selectionStart),
			wasAtStart: selectionStart === 0,
			wasInPrefixZone:
				firstNumericIndex !== -1 && selectionStart > 0 && selectionStart <= firstNumericIndex,
		};

		let nextRawValue = entryValue;
		let revisedDecimalPlaces = decimalPlaces ?? 0;

		if (dataTypeFormat === 'percent') {
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

		if (dataTypeFormat !== 'integer') {
			const [integerPart, fractionPart = ''] = nextRawValue.split('.');
			const fractionalExcessLength = fractionPart.length - revisedDecimalPlaces;

			if (fractionalExcessLength > 0) {
				nextRawValue = `${integerPart}.${fractionPart.slice(0, revisedDecimalPlaces)}`;
			}
		}

		setNumberRawValue(nextRawValue);
	}

	/**
	 * Update checkbox format and set default options
	 *
	 * @since 1.4.3
	 *
	 * @param {string} checkboxFormat   Checkbox format to set
	 * @param {string} changeDataFormat Triggered by a change in column data type
	 */
	function onCheckboxFormat(checkboxFormat, changeDataFormat = false) {
		setDataTypeFormat(checkboxFormat);

		let formatOptions = {
			hideIfEmpty: checkboxHideIfEmpty,
			defaultToChecked: checkboxDefaultToChecked,
			updateColumnStyle: updateColumnStyle,
		};

		if (changeDataFormat) {
			setCheckboxHideIfEmpty(false);
			setCheckboxDefaultToChecked(false);
			setUpdateColumnStyle(true);

			formatOptions = {
				hideIfEmpty: false,
				defaultToChecked: false,
				updateColumnStyle: true,
			};
		}

		const dataTypeSettings = {
			format: checkboxFormat,
			formatOptions: {
				...formatOptions,
			},
		};

		const updatedDataType = {
			type: 'checkbox',
			settings: dataTypeSettings,
		};

		setDataType(updatedDataType);
	}

	/**
	 * Update checkbox formatting options based on configuration input
	 *
	 * @since 1.4.3
	 *
	 * @param {Object} event  Formatting value to set
	 * @param {string} option Formatting option
	 */
	function onCheckboxFormatOption(event, option) {
		let newHideIfEmpty = checkboxHideIfEmpty;
		let newDefaultToChecked = checkboxDefaultToChecked;
		let newUpdateColumnStyle = updateColumnStyle;

		switch (option) {
			case 'hideEmpty':
				newHideIfEmpty = event;
				break;
			case 'default-checked':
				newDefaultToChecked = event;
				break;
			case 'format-column':
				newUpdateColumnStyle = event;
				break;
		}

		setCheckboxHideIfEmpty(newHideIfEmpty);
		setCheckboxDefaultToChecked(newDefaultToChecked);
		setUpdateColumnStyle(newUpdateColumnStyle);

		const updatedDataType = {
			...dataType,
			settings: {
				format: dataType.settings.format,
				formatOptions: {
					hideIfEmpty: newHideIfEmpty,
					defaultToChecked: newDefaultToChecked,
					updateColumnStyle: newUpdateColumnStyle,
				},
			},
		};

		setDataType(updatedDataType);
	}

	/**
	 * Update post format and set default options
	 *
	 * @since 1.4.11
	 *
	 * @param {string} postFormat Post format to set
	 */
	function onPostFormat(postFormat) {
		console.log('Setting Post Format');
		setDataTypeFormat(postFormat);

		let formatOptions;

		switch (postFormat) {
			case 'link': {
				formatOptions = {
					displayTitle: {
						...defaultDisplayElement,
						display: true,
						order: 1,
					},
					displayCoverImage: defaultDisplayElement,
					displayExcerpt: defaultDisplayElement,
					displayAuthor: defaultDisplayElement,
					displayShortContent: defaultDisplayElement,
					displayPublishDate: defaultDisplayElement,
					displayModifiedDate: defaultDisplayElement,
					displayTitleInCover: false,
					displayImageSize: 'thumbnail',
					linkLocation: 'title',
				};
				setPostDisplayItemsNoneColumnCount(1);
				setPostDisplayItemsSpanColumnsCount(0);
				setPostDisplayItemsLeftColumnCount(0);
				setPostDisplayItemsRightColumnCount(0);
				break;
			}
			case 'narrow': {
				formatOptions = {
					displayTitle: {
						...defaultDisplayElement,
						display: true,
						order: 1,
					},
					displayCoverImage: {
						...defaultDisplayElement,
						order: 0,
					},
					displayExcerpt: {
						...defaultDisplayElement,
						display: true,
						order: 2,
					},
					displayAuthor: {
						...defaultDisplayElement,
						display: true,
						order: 3,
					},
					displayShortContent: defaultDisplayElement,
					displayPublishDate: defaultDisplayElement,
					displayModifiedDate: defaultDisplayElement,
					displayTitleInCover: false,
					displayImageSize: 'thumbnail',
					linkLocation: 'title',
				};
				setPostDisplayItemsNoneColumnCount(3);
				setPostDisplayItemsSpanColumnsCount(0);
				setPostDisplayItemsLeftColumnCount(0);
				setPostDisplayItemsRightColumnCount(0);
				break;
			}
			case 'wide': {
				formatOptions = {
					displayTitle: {
						...defaultDisplayElement,
						display: true,
						column: 'left',
						order: 1,
					},
					displayCoverImage: {
						...defaultDisplayElement,
						order: 0,
					},
					displayExcerpt: {
						...defaultDisplayElement,
						display: true,
						column: 'left',
						order: 2,
					},
					displayAuthor: {
						...defaultDisplayElement,
						display: true,
						column: 'right',
						order: 1,
					},
					displayShortContent: defaultDisplayElement,
					displayPublishDate: defaultDisplayElement,
					displayModifiedDate: defaultDisplayElement,
					displayTitleInCover: false,
					displayImageSize: 'thumbnail',
					linkLocation: 'title',
				};
				setPostDisplayItemsNoneColumnCount(0);
				setPostDisplayItemsSpanColumnsCount(0);
				setPostDisplayItemsLeftColumnCount(2);
				setPostDisplayItemsRightColumnCount(1);
				break;
			}
			default:
				return;
		}

		const newDisplayElements = {
			displayTitle: formatOptions.displayTitle,
			displayCoverImage: formatOptions.displayCoverImage,
			displayExcerpt: formatOptions.displayExcerpt,
			displayAuthor: formatOptions.displayAuthor,
			displayShortContent: formatOptions.displayShortContent,
			displayPublishDate: formatOptions.displayPublishDate,
			displayModifiedDate: formatOptions.displayModifiedDate,
		};

		const resetDisplayElementsArray = sortPostDisplayElements(
			loadPostDisplayElements(newDisplayElements, defaultDisplayElement)
		);

		setPostLinkLocation('title');
		setPostTitleInCover(false);
		setPostImageSize('thumbnail');
		setPostDisplayElements(resetDisplayElementsArray);

		const updatedDataType = {
			type: 'post',
			settings: {
				format: postFormat,
				formatOptions: formatOptions,
			},
		};

		setDataType(updatedDataType);
	}

	/**
	 * Update post formatting options based on configuration input
	 *
	 * @since 1.4.11
	 *
	 * @param {Object} value  Formatting value to set
	 * @param {string} option Formatting option
	 */
	function onPostFormatOption(value, option) {
		console.log('Setting Post Format Option: attribute = ' + option);
		console.log('Setting Post Format Option: value = ', value);

		const displayToObject = {};
		postDisplayElements.map(({ element, displayAttributes }) => {
			return (displayToObject[element] = displayAttributes);
		});
		console.log('Display Options Before Update = ', displayToObject);

		let {
			displayTitle: newDisplayTitle,
			displayCoverImage: newDisplayCoverImage,
			displayExcerpt: newDisplayExcerpt,
			displayAuthor: newDisplayAuthor,
			displayPublishDate: newDisplayPublishDate,
			displayModifiedDate: newDisplayModifiedDate,
		} = displayToObject;

		let newLinkLocation = postLinkLocation;
		let newTitleInCover = postTitleInCover;
		let newImageSize = postImageSize;

		let updatedElement;
		let priorElement;

		switch (option) {
			case 'display-title':
				updatedElement = 'displayTitle';
				priorElement = newDisplayTitle;
				newDisplayTitle = value;
				break;
			case 'display-image':
				updatedElement = 'displayCoverImage';
				priorElement = newDisplayCoverImage;
				newDisplayCoverImage = value;
				if (newDisplayCoverImage === 0) {
					newLinkLocation = 'title';
					newTitleInCover = false;
				}
				break;
			case 'display-excerpt':
				updatedElement = 'displayExcerpt';
				priorElement = newDisplayExcerpt;
				newDisplayExcerpt = value;
				break;
			case 'display-author':
				updatedElement = 'displayAuthor';
				priorElement = newDisplayAuthor;
				newDisplayAuthor = value;
				break;
			case 'display-published':
				updatedElement = 'displayPublishDate';
				priorElement = newDisplayPublishDate;
				newDisplayPublishDate = value;
				break;
			case 'display-modified':
				updatedElement = 'displayModifiedDate';
				priorElement = newDisplayModifiedDate;
				newDisplayModifiedDate = value;
				break;
			case 'title-in-cover':
				if (newDisplayCoverImage !== 0) {
					newTitleInCover = value;
				} else {
					newTitleInCover = false;
				}
				break;
			case 'link-location':
				if (newDisplayCoverImage !== 0) {
					newLinkLocation = value;
				} else {
					newLinkLocation = 'title';
				}
				break;
			case 'image-size':
				newImageSize = value;
				break;
			default:
				return;
		}

		const newDisplayElements = {
			displayTitle: newDisplayTitle,
			displayCoverImage: newDisplayCoverImage,
			displayExcerpt: newDisplayExcerpt,
			displayAuthor: newDisplayAuthor,
			displayPublishDate: newDisplayPublishDate,
			displayModifiedDate: newDisplayModifiedDate,
		};

		console.log('Updated Post Display Element', newDisplayElements);

		const updateIsDisplayElement = newDisplayElements[updatedElement] || null;
		if (updateIsDisplayElement) {
			const updatedElementDisplay = newDisplayElements[updatedElement].display;
			const updatedElementOrder = newDisplayElements[updatedElement].order;
			const oldElementOrder = priorElement.order;

			console.log('Updated Element = ' + updatedElementOrder);
			console.log('Updated Element Prior Order = ' + oldElementOrder);

			// Close order gap when an element becomes not displayed
			if (updatedElementOrder !== oldElementOrder && updatedElementOrder === 0) {
				for (const element in newDisplayElements) {
					const elementOrder = newDisplayElements[element].order;
					const elementDisplay = newDisplayElements[element].display;
					if (elementDisplay && elementOrder > oldElementOrder && element !== updatedElement) {
						newDisplayElements[element].order = elementOrder - 1;
					}
				}
			}

			// Increment order order for elements when an element becomes goes down in order
			if (updatedElementDisplay && updatedElementOrder !== oldElementOrder) {
				for (const element in newDisplayElements) {
					const elementOrder = newDisplayElements[element].order;
					const elementDisplay = newDisplayElements[element].display;
					if (
						elementDisplay &&
						elementOrder === updatedElementOrder &&
						element !== updatedElement
					) {
						newDisplayElements[element].order = oldElementOrder;
					}
				}
			}
		}

		console.log('Updated Display Elements: ', newDisplayElements);
		const orderedDisplayAttributes = sortPostDisplayElements(
			loadPostDisplayElements(newDisplayElements, defaultDisplayElement)
		);
		setPostDisplayElements(orderedDisplayAttributes);

		setPostDisplayItemsNoneColumnCount(countFilteredDisplayItems(orderedDisplayAttributes, 'none'));
		setPostDisplayItemsSpanColumnsCount(
			countFilteredDisplayItems(orderedDisplayAttributes, 'span')
		);
		setPostDisplayItemsLeftColumnCount(countFilteredDisplayItems(orderedDisplayAttributes, 'left'));
		setPostDisplayItemsRightColumnCount(
			countFilteredDisplayItems(orderedDisplayAttributes, 'right')
		);

		setPostLinkLocation(newLinkLocation);
		setPostTitleInCover(newTitleInCover);
		setPostImageSize(newImageSize);

		const updatedDataType = {
			...dataType,
			settings: {
				format: dataType.settings.format,
				formatOptions: {
					displayTitle: newDisplayTitle,
					displayCoverImage: newDisplayCoverImage,
					displayExcerpt: newDisplayExcerpt,
					displayAuthor: newDisplayAuthor,
					displayPublishDate: newDisplayPublishDate,
					displayModifiedDate: newDisplayModifiedDate,
					displayTitleInCover: newTitleInCover,
					displayImageSize: newImageSize,
					linkLocation: newLinkLocation,
				},
			},
		};

		setDataType(updatedDataType);
	}

	function onPostUpdate(updatedPostConfig) {
		const updatedDataType = {
			type: 'post',
			updatedPostConfig,
		};

		setDataType(updatedDataType);
	}

	function countFilteredDisplayItems(items, column) {
		const filteredItems = items.filter(
			el => el.displayAttributes.display && el.displayAttributes.column === column
		);
		return filteredItems?.length || 0;
	}

	function loadPostDisplayElements(columnData, defaultElement) {
		const displayElements = Array();

		displayElements.push({
			element: 'displayTitle',
			elementName: 'Title',
			updateOption: 'display-title',
			defaultOrder: 1,
			displayAttributes: columnData?.displayTitle || defaultElement,
		});

		displayElements.push({
			element: 'displayExcerpt',
			elementName: 'Excerpt',
			updateOption: 'display-excerpt',
			defaultOrder: 2,
			displayAttributes: columnData?.displayExcerpt || defaultElement,
		});

		displayElements.push({
			element: 'displayCoverImage',
			elementName: 'Cover Image',
			updateOption: 'display-image',
			defaultOrder: 3,
			displayAttributes: columnData?.displayCoverImage || defaultElement,
		});

		displayElements.push({
			element: 'displayAuthor',
			elementName: 'Author',
			updateOption: 'display-author',
			defaultOrder: 4,
			displayAttributes: columnData?.displayAuthor || defaultElement,
		});

		displayElements.push({
			element: 'displayPublishDate',
			elementName: 'Published Date',
			updateOption: 'display-published',
			defaultOrder: 5,
			displayAttributes: columnData?.displayPublishDate || defaultElement,
		});

		displayElements.push({
			element: 'displayModifiedDate',
			elementName: 'Last Modified Date',
			updateOption: 'display-modified',
			defaultOrder: 6,
			displayAttributes: columnData?.displayModifiedDate || defaultElement,
		});

		return displayElements;
	}

	function sortPostDisplayElements(displayElements) {
		displayElements.sort((a, b) => {
			if (a.displayAttributes.display !== b.displayAttributes.display) {
				return a.displayAttributes.display ? -1 : 1;
			}

			if (!a.displayAttributes.display) {
				return a.defaultOrder - b.defaultOrder;
			}

			const columnCompare = a.displayAttributes.column.localeCompare(b.displayAttributes.column);
			return columnCompare || a.displayAttributes.order - b.displayAttributes.order;
		});
		return displayElements;
	}

	/**
	 * Change column data types and set formatting defaults
	 *
	 * @since    1.2.0
	 * @since    1.2.4  Add number format
	 * @since    1.4.3  Add checkbox format
	 *
	 * @param {Object} event Event object to change data type
	 * @return {void}
	 */
	function onUpdateDataType(event) {
		let updatedDataType = {};
		const newColumnClassNames = new Set(columnClassNames);

		switch (event) {
			case 'date-time':
				setDataTypeFormat('date');
				updatedDataType = {
					type: 'date-time',
					settings: {
						format: 'date',
						defaultToToday: false,
					},
				};
				newColumnClassNames.delete('grid-control__body-columns--number-align-right');
				break;
			case 'number':
				setDataTypeFormat('number');
				onNumberFormat('number');
				newColumnClassNames.delete('grid-control__body-columns--date-align-right');
				setColumnClassNames(newColumnClassNames);
				return;
			case 'checkbox':
				setDataTypeFormat('checkbox');
				onCheckboxFormat('standard', true);
				newColumnClassNames.delete('grid-control__body-columns--number-align-right');
				newColumnClassNames.delete('grid-control__body-columns--date-align-right');
				setColumnClassNames(newColumnClassNames);
				return;
			case 'link':
				setDataTypeFormat('link');
				updatedDataType = {
					type: 'link',
				};
				newColumnClassNames.delete('grid-control__body-columns--number-align-right');
				newColumnClassNames.delete('grid-control__body-columns--date-align-right');
				break;
			case 'post':
				setDataTypeFormat('link');
				onPostFormat('link');
				newColumnClassNames.delete('grid-control__body-columns--number-align-right');
				newColumnClassNames.delete('grid-control__body-columns--date-align-right');
				setColumnClassNames(newColumnClassNames);
				return;
			default:
				updatedDataType = {
					type: event,
				};
				newColumnClassNames.delete('grid-control__body-columns--date-align-right');
				newColumnClassNames.delete('grid-control__body-columns--number-align-right');
				break;
		}
		setColumnClassNames(newColumnClassNames);
		setDataType(updatedDataType);
	}

	/**
	 * Return new column data type settings.
	 *
	 * @since    1.2.0
	 * @since    1.4.3 - Update for checkbox content type
	 *
	 * @param {Object} event Form submit
	 */
	function onUpdate(event) {
		event?.preventDefault?.();

		const updatedColumnAttributes = {
			columnWidthType: columnWidthType,
			minWidth: minWidth,
			minWidthUnits: minWidthUnits,
			maxWidth: Number(maxWidth),
			maxWidthUnits: maxWidthUnits,
			fixedWidth: fixedWidth,
			fixedWidthUnits: fixedWidthUnits,
			disableForTablet: disableForTablet,
			disableForPhone: disableForPhone,
			isFixedLeftColumnGroup: false,
			horizontalAlignment: 'none',
			columnDataType: dataType,
		};

		/**
		 * Ensure column classes are updated if additional classes were added to the
		 * block subsequent to the prior column configuration
		 */
		let newColumnClassNames = new Set(columnClassNames);

		switch (dataType.type) {
			case 'general':
				break;
			case 'date-time':
				newColumnClassNames = newColumnClassNames.add(
					'grid-control__body-columns--date-align-right'
				);
				break;
			case 'number':
				newColumnClassNames = newColumnClassNames.add(
					'grid-control__body-columns--number-align-right'
				);
				break;
			case 'checkbox':
				break;
			case 'link':
				break;
			case 'post':
				break;
		}

		setColumnClassNames(newColumnClassNames);
		const updatedColumnClasses = prepareClassesForUse(newColumnClassNames);

		updatedColumn(
			event,
			'dataType',
			tableId,
			columnId,
			columnName,
			updatedColumnAttributes,
			updatedColumnClasses
		);
		close();
	}

	const renderColumnClasses = clsx(columnClassNamesRender, {
		'grid-control__body-columns--number-red': showNegativeNumberPreview,
	});

	// console.log('Column Content Type: ', dataType);
	console.log('Post Display Elements: ', postDisplayElements);
	// console.log(dataType.type);
	// console.log(dataTypeFormat);

	const testCellContent = 'Test Content';
	const testCellAttributes = {
		canonical: {
			postId: 196,
			postType: 'post',
		},
		ref: [{ postId: '196' }],
	};
	const testCellClasses = '';
	// const testCellContentType = dataType;
	const testCellContentType = {
		settings: {
			format: dataType.settings.format,
			formatOptions: dataType.settings.formatOptions,
		},
	};

	return (
		<Modal
			title="Configure Column Content Type"
			overlayClassName="configure-column-modal"
			onRequestClose={handleCancel}
			focusOnMount="firstContentElement"
			isDismissible={false}
			shouldCloseOnClickOutside={false}
			size="large"
		>
			<form
				className="configure-data-type--form configure-column-modal__form"
				onSubmit={onUpdate}
				onMouseDown={stopProp}
			>
				{/* Scrollable body */}
				<div className="configure-column-modal__body">
					<div className="configure-column-modal__body-inner">
						<VStack spacing={4}>
							<p className="column-label">For column {columnName}</p>

							<Card>
								<CardHeader>
									<strong>Basics</strong>
								</CardHeader>
								<CardBody>
									<VStack spacing={3}>
										<InputControl
											label="Column Name"
											value={columnName}
											onChange={value => setColumnName(value)}
										/>

										<SelectControl
											label="Content Type"
											value={dataType.type}
											onChange={onUpdateDataType}
											options={[
												{ value: 'general', label: 'General' },
												{ value: 'date-time', label: 'Date/Time' },
												{ value: 'number', label: 'Number' },
												{ value: 'checkbox', label: 'Check Box' },
												{ value: 'link', label: 'Link' },
												// { value: 'image', label: 'Image' },
												// { value: 'rating', label: 'Rating' },
												{ value: 'post', label: 'Site Content' },
											]}
											__nextHasNoMarginBottom
										/>
									</VStack>
								</CardBody>
							</Card>

							{/* Date/Time Settings */}
							{dataType.type === 'date-time' && (
								<Card>
									<CardHeader>
										<strong>Content settings</strong>
									</CardHeader>
									<CardBody>
										<VStack spacing={3}>
											<div>Select the specific date/time appearance.</div>

											{/* True split layout */}
											<Flex gap={24} align="stretch" className="configure-column-modal__split">
												{/* Left column */}
												<FlexItem className="configure-column-modal__left" isBlock>
													<VStack spacing={3}>
														<RadioControl
															label="Format"
															selected={dataTypeFormat}
															options={[
																{ label: 'Date only', value: 'date' },
																{ label: 'Time only', value: 'time' },
																{ label: 'Date & time', value: 'datetime-local' },
															]}
															onChange={value => onDateTimeType(value)}
														/>

														<div className="configure-column-modal__options">
															<strong>Options</strong>
															<CheckboxControl
																className="configure-column-modal__checkbox"
																label="Default to today's date"
																checked={dateDefaultToToday}
																onChange={e => onDateDefaultToToday(e, dataTypeFormat)}
															/>
															<CheckboxControl
																className="configure-column-modal__checkbox"
																label={'Auto format column?'}
																checked={updateColumnStyle}
																onChange={e => onDateFormatOption(e, 'format-column')}
															/>
														</div>
													</VStack>
												</FlexItem>

												{/* Right column */}
												<FlexItem className="configure-column-modal__right" isBlock>
													<div className="configure-column-modal__preview">
														<BaseControl
															id={previewId}
															label="Preview"
															help="This is only a preview; it won’t change saved values."
														>
															<TextControl
																className={renderColumnClasses}
																type={dataTypeFormat}
																label={''}
																id={previewId}
																step={60}
																value={datePreviewValue}
																onChange={setDatePreviewValue}
															/>
														</BaseControl>
													</div>
												</FlexItem>
											</Flex>
										</VStack>
									</CardBody>
								</Card>
							)}

							{/* Number Settings */}
							{dataType.type === 'number' && (
								<Card>
									<CardHeader>
										<strong>Content settings</strong>
									</CardHeader>
									<CardBody>
										<VStack spacing={3}>
											<div>Select the specific number type.</div>

											{/* True split layout */}
											<Flex gap={24} align="stretch" className="configure-column-modal__split">
												{/* Left column */}
												<FlexItem className="configure-column-modal__left" isBlock>
													<VStack spacing={3}>
														<RadioControl
															label="Number Type"
															selected={dataTypeFormat}
															options={[
																{ label: 'General', value: 'number' },
																{ label: 'Integer', value: 'integer' },
																{ label: 'Percent', value: 'percent' },
																{ label: 'Currency', value: 'currency' },
															]}
															onChange={value => onNumberFormat(value)}
														/>

														<div className="configure-column-modal__options">
															<strong>Formatting Options</strong>
															{(dataTypeFormat === 'number' ||
																dataTypeFormat === 'percent' ||
																dataTypeFormat === 'currency') && (
																<TextControl
																	className="configure-column-modal__input"
																	type={'number'}
																	label={'Decimal Places'}
																	value={decimalPlaces}
																	onChange={e => onNumberFormatOption(e, 'decimal')}
																/>
															)}
															<CheckboxControl
																className="configure-column-modal__checkbox"
																label={'Thousand Separator'}
																checked={thousandSeparator}
																onChange={e => onNumberFormatOption(e, 'thousand')}
															/>
															{dataTypeFormat === 'currency' && (
																<CheckboxControl
																	className="configure-column-modal__checkbox"
																	label={'Currency'}
																	checked={currency}
																	onChange={e => onNumberFormatOption(e, 'currency')}
																/>
															)}
															{(dataTypeFormat === 'number' ||
																dataTypeFormat === 'integer' ||
																dataTypeFormat === 'currency') && (
																<CheckboxControl
																	className="configure-column-modal__checkbox"
																	label={'Bracket negative numbers?'}
																	checked={bracketNegative}
																	onChange={e => onNumberFormatOption(e, 'bracket-negative')}
																/>
															)}
															<CheckboxControl
																className="configure-column-modal__checkbox"
																label={'Display negative numbers in red?'}
																checked={redNegative}
																onChange={e => onNumberFormatOption(e, 'red-negative')}
															/>
															<CheckboxControl
																className="configure-column-modal__checkbox"
																label={'Auto format column?'}
																checked={updateColumnStyle}
																onChange={e => onNumberFormatOption(e, 'format-column')}
															/>
														</div>
													</VStack>
												</FlexItem>

												{/* Right column */}
												<FlexItem className="configure-column-modal__right" isBlock>
													<div className="configure-column-modal__preview">
														<BaseControl
															id={previewId}
															label="Preview"
															help="This is only a preview; it won’t change saved values."
														>
															<div ref={numberEntryWrapperRef}>
																<TextControl
																	className={`configure-column-modal__input-preview ${renderColumnClasses}`}
																	type={'text'}
																	inputMode={dataTypeFormat === 'integer' ? 'numeric' : 'decimal'}
																	label={'Entry'}
																	id={`${previewId}-entry`}
																	value={numberEntryValue}
																	onChange={e => onNumberPreviewChange(e)}
																	onBlur={() => {
																		pendingCaretRef.current = null;
																		setPercentEntryValue(null);
																	}}
																/>
															</div>
															<TextControl
																className={`configure-column-modal__display-preview ${renderColumnClasses}`}
																type={'text'}
																inputMode={dataTypeFormat === 'integer' ? 'numeric' : 'decimal'}
																label={'Display'}
																disabled={true}
																id={`${previewId}-display`}
																value={numberDisplayValue}
															/>
														</BaseControl>
													</div>
												</FlexItem>
											</Flex>
										</VStack>
									</CardBody>
								</Card>
							)}

							{/* Checkbox Settings */}
							{dataType.type === 'checkbox' && (
								<Card>
									<CardHeader>
										<strong>Content settings</strong>
									</CardHeader>
									<CardBody>
										<VStack spacing={3}>
											<div>Select the specific checkbox type.</div>

											{/* True split layout */}
											<Flex gap={24} align="stretch" className="configure-column-modal__split">
												{/* Left column */}
												<FlexItem className="configure-column-modal__left" isBlock>
													<VStack spacing={3}>
														<RadioControl
															label="Checkbox Type"
															selected={dataTypeFormat}
															options={[
																{ label: 'Standard', value: 'standard' },
																{ label: 'Toggle', value: 'toggle' },
																{ label: 'Icon', value: 'icon' },
																{ label: 'Free Form', value: 'freeform' },
															]}
															onChange={value => onCheckboxFormat(value)}
														/>

														<div className="configure-column-modal__options">
															<strong>Formatting Options</strong>
															<CheckboxControl
																className="configure-column-modal__checkbox"
																label={'Hide checkbox when no value exists?'}
																checked={checkboxHideIfEmpty}
																onChange={e => onCheckboxFormatOption(e, 'hideEmpty')}
															/>
															<CheckboxControl
																className="configure-column-modal__checkbox"
																label={'Default to "Checked"'}
																checked={checkboxDefaultToChecked}
																onChange={e => onCheckboxFormatOption(e, 'default-checked')}
															/>
															<CheckboxControl
																className="configure-column-modal__checkbox"
																label={'Auto format column?'}
																checked={updateColumnStyle}
																onChange={e => onCheckboxFormatOption(e, 'format-column')}
															/>
														</div>
													</VStack>
												</FlexItem>

												{/* Right column */}
												<FlexItem className="configure-column-modal__right" isBlock>
													<div className="configure-column-modal__preview configure-column-modal__preview--checkbox">
														<BaseControl
															id={previewId}
															label="Preview"
															style={{ alignContent: 'center', flexWrap: 'wrap', height: '20%' }}
															className="configure-column-modal__checkbox-preview-control"
														>
															<div className="configure-column-modal__checkbox-preview-state">
																<div>When Checked</div>
																{dataTypeFormat === 'standard' && (
																	<CheckboxControl
																		className="configure-column-modal__checkbox-preview"
																		checked={true}
																	/>
																)}
																{dataTypeFormat === 'toggle' && (
																	<ToggleControl
																		className="configure-column-modal__checkbox-preview"
																		checked={true}
																	/>
																)}
																{dataTypeFormat === 'icon' && (
																	<StatusIcon
																		className="configure-column-modal__checkbox-preview"
																		checked={true}
																	/>
																)}
																{dataTypeFormat === 'freeform' && (
																	<FreeformCheckboxIcon
																		className="configure-column-modal__checkbox-preview"
																		checked={true}
																		scale={0.6}
																	/>
																)}
															</div>

															<div className="configure-column-modal__checkbox-preview-state">
																<div>When Unchecked</div>
																{dataTypeFormat === 'standard' && (
																	<CheckboxControl
																		className="configure-column-modal__checkbox-preview"
																		checked={false}
																	/>
																)}
																{dataTypeFormat === 'toggle' && (
																	<ToggleControl
																		className="configure-column-modal__checkbox-preview"
																		checked={false}
																	/>
																)}
																{dataTypeFormat === 'icon' && (
																	<StatusIcon
																		className="configure-column-modal__checkbox-preview"
																		checked={false}
																	/>
																)}
																{dataTypeFormat === 'freeform' && (
																	<FreeformCheckboxIcon
																		className="configure-column-modal__checkbox-preview"
																		checked={false}
																		scale={0.6}
																	/>
																)}
															</div>
														</BaseControl>
													</div>
												</FlexItem>
											</Flex>
										</VStack>
									</CardBody>
								</Card>
							)}

							{/* Post Settings */}
							{dataType.type === 'post' && (
								<>
									<ConfigurePostColumnDataType
										persistedPostFormat={normalizedColumnDataType?.settings}
										onChange={onPostUpdate}
									/>
									<Card>
										<CardHeader>
											<strong>Content settings</strong>
										</CardHeader>
										<CardBody>
											<VStack spacing={3}>
												<div>Select the specific content display options.</div>

												{/* True split layout */}
												<Flex gap={24} align="stretch" className="configure-column-modal__split">
													{/* Left column */}
													<FlexItem className="configure-column-modal__left" isBlock>
														<VStack spacing={3}>
															<RadioControl
																label="Post Layout"
																selected={dataTypeFormat}
																options={[
																	{ label: 'Link Only', value: 'link' },
																	{ label: 'Wide', value: 'wide' },
																	{ label: 'Narrow', value: 'narrow' },
																]}
																onChange={value => onPostFormat(value)}
															/>

															{dataTypeFormat !== 'link' && (
																<div className="configure-column-modal__options">
																	<strong>Formatting Options</strong>
																	<NewCard.Root>
																		<NewCard.Header>
																			<NewCard.Title>Content Elements To Display</NewCard.Title>
																		</NewCard.Header>
																		<NewCard.Content>
																			<table>
																				<thead>
																					<tr>
																						<th>Element</th>
																						<th>Display?</th>
																						<th>Order</th>
																						{dataTypeFormat === 'wide' && <th>Location</th>}
																					</tr>
																				</thead>
																				<tbody>
																					{postDisplayElements.map(
																						({ elementName, updateOption, displayAttributes }) => {
																							return (
																								<DislpayPostElementRow
																									elementName={elementName}
																									displayElement={displayAttributes}
																									updateOption={updateOption}
																									postFormat={dataTypeFormat}
																									columnItemCount={postDisplayItemsPerColumn}
																									onChange={onPostFormatOption}
																								/>
																							);
																						}
																					)}
																				</tbody>
																			</table>
																		</NewCard.Content>
																	</NewCard.Root>

																	{(() => {
																		const coverImage = postDisplayElements.find(
																			({ element }) => element === 'displayCoverImage'
																		);
																		const title = postDisplayElements.find(
																			({ element }) => element === 'displayTitle'
																		);

																		console.log('Cover Impage:', coverImage);
																		console.log('Title:', title);

																		return (
																			coverImage.displayAttributes.display > 0 &&
																			title.displayAttributes.display > 0 && (
																				<CheckboxControl
																					label={'Display title in Cover Image?'}
																					checked={postTitleInCover}
																					onChange={checked =>
																						onPostFormatOption(checked, 'title-in-cover')
																					}
																				/>
																			)
																		);
																	})()}

																	{(() => {
																		const coverImage = postDisplayElements.find(
																			({ element }) => element === 'displayCoverImage'
																		);
																		console.log('Cover Impage:', coverImage);

																		return (
																			coverImage.displayAttributes.display > 0 && (
																				<>
																					<RadioControl
																						label="Link Location"
																						selected={postLinkLocation}
																						options={[
																							{ label: 'Title', value: 'title' },
																							{ label: 'Cover Image', value: 'image' },
																						]}
																						onChange={value =>
																							onPostFormatOption(value, 'link-location')
																						}
																					/>
																					<NewSelectControl
																						label="Image Size"
																						value={postImageSize}
																						defaultValue="thumbnail"
																						onValueChange={value =>
																							onPostFormatOption(value, 'image-size')
																						}
																						items={[
																							{
																								value: 'thumbnail',
																								label: 'Thumbnail: (150 x 150)',
																							},
																							{ value: 'medium', label: 'Medium: (300 x 300)' },
																							{
																								value: 'medium_large',
																								label: 'Medium/Large (768 Wide)',
																							},
																							{ value: 'large', label: 'Large (1024 x 1024)' },
																						]}
																					/>
																				</>
																			)
																		);
																	})()}
																</div>
															)}
														</VStack>
													</FlexItem> */}

													{/* Right column */}
													{/* <FlexItem className="configure-column-modal__right" isBlock>
														<div style={{ display: 'flex', flexDirection: 'column' }}>
															<BaseControl
																id={previewId}
																label="Preview"
																style={{ alignContent: 'center', flexWrap: 'wrap', height: '20%' }}
															>
																<div>
																	<div>Post Cell Preview</div>
																	<CellPostContent
																		cellContent={testCellContent}
																		cellAttributes={testCellAttributes}
																		cellClasses={testCellClasses}
																		cellContentType={testCellContentType}
																	/>
																</div>
															</BaseControl>
														</div>
													</FlexItem> */}
												</Flex>
											</VStack>
										</CardBody>
									</Card>
								</>
							)}
						</VStack>
					</div>
				</div>

				{/* Sticky footer */}
				<div className="configure-column-modal__footer">
					<div className="configure-column-modal__button-group">
						<Button variant="secondary" onClick={handleCancel}>
							{__('Cancel', 'dynamic-table-blocks')}
						</Button>
						<Button variant="primary" type="submit">
							{__('Update', 'dynamic-table-blocks')}
						</Button>
					</div>
				</div>
			</form>
		</Modal>
	);
}

function DislpayPostElementRow(props) {
	const { elementName, displayElement, updateOption, postFormat, columnItemCount, onChange } =
		props;
	const { display, order, column } = displayElement;
	const labelOrderSuffix = __('Display Order', 'dynamic-table-blocks');
	const labelColumnSuffix = __('Display Column', 'dynamic-table-blocks');

	function maxDisplayItems(column, columnItemCount) {
		if (column === 'none') return columnItemCount.none;
		if (column === 'span') return columnItemCount.span;
		if (column === 'left') return columnItemCount.left;
		if (column === 'right') return columnItemCount.right;
		return 0;
	}

	// console.log('Items per column type = ', columnItemCount);
	// console.log('Items in column (' + elementName + ')= ' + maxDisplayItems(column, columnItemCount));

	function onDisplayUpdate(updatedValue, updatedDisplayOption, updatedAttribute) {
		let newDisplay = display;
		let newColumn = column;
		let newOrder = Number(order);

		switch (updatedAttribute) {
			case 'display': {
				newDisplay = updatedValue;
				if (updatedValue) {
					newColumn = postFormat === 'wide' ? 'left' : 'none';
					const itemCount = maxDisplayItems(newColumn, columnItemCount);
					newOrder = itemCount + 1;
				} else {
					newColumn = 'none';
					newOrder = 0;
				}
				break;
			}
			case 'column': {
				console.log('Upated column value: ', updatedValue);
				const itemCount = maxDisplayItems(updatedValue, columnItemCount);
				newColumn = updatedValue;
				newOrder = itemCount + 1;
				break;
			}
			case 'order': {
				const itemCount = maxDisplayItems(column, columnItemCount);
				if (Number(updatedValue) < 1 || Number(updatedValue) > itemCount) {
					return;
				}
				newOrder = Number(updatedValue);
				break;
			}
			default: {
				break;
			}
		}

		const updatedDisplayElement = {
			display: newDisplay,
			column: newColumn,
			order: newOrder,
		};

		console.log('Changed Display Element ( ' + updatedDisplayOption + '): ', updatedDisplayElement);
		onChange(updatedDisplayElement, updatedDisplayOption);
	}

	return (
		<tr>
			<td>{elementName}</td>
			<td>
				<CheckboxControl
					checked={display}
					onChange={checked => onDisplayUpdate(checked, updateOption, 'display')}
				/>
			</td>

			<td>
				{display ? (
					<NewInputControl
						label={elementName + ' ' + labelOrderSuffix}
						hideLabelFromVision
						min={1}
						step={1}
						max={maxDisplayItems(column, columnItemCount)}
						value={order || 1}
						onValueChange={value => onDisplayUpdate(value, updateOption, 'order')}
						type="number"
						size="compact"
						suffix={
							<NumberIncrementControl
								baseInteger={Number(order)}
								iconPair="arrow-up-down"
								reverseIcons
								onClick={value => onDisplayUpdate(value, updateOption, 'order')}
							/>
						}
					/>
				) : (
					__('n/a', 'dynamic-table-blocks')
				)}
			</td>
			<td>
				{postFormat === 'wide' && (
					<NewSelectControl
						label={elementName + ' ' + labelColumnSuffix}
						hideLabelFromVision
						value={column || 'none'}
						onValueChange={value => onDisplayUpdate(value.value, updateOption, 'column')}
						items={[
							{
								value: 'left',
								label: 'Left',
							},
							{ value: 'right', label: 'Right' },
							{
								value: 'span',
								label: 'Span Columns',
							},
						]}
					/>
				)}
			</td>
		</tr>
	);
}

export const ColumnDataTypeModal = memo(ConfigureColumnDataType);
