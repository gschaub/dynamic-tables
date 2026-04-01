/* External dependencies */
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useLayoutEffect, useRef, useState, memo } from '@wordpress/element';
import {
	Modal,
	BaseControl,
	Button,
	SelectControl,
	CheckboxControl,
	RadioControl,
	TextControl,
	__experimentalInputControl as InputControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Flex,
	FlexItem,
	Card,
	CardBody,
	CardHeader,
} from '@wordpress/components';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import './style.scss';
// import '../../style.scss';
import { settings } from '@wordpress/icons';
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
	 *
	 * @param {Object} event Cancel
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
	 * Update number format and set default options
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
	 * @param {*} numberFormat Number format to set
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

	function onNumberPreviewKeyDown(event) {
		if (event.key === '.' && (dataTypeFormat === 'integer' || numberRawValue.includes('.'))) {
			event.preventDefault();
		}
	}

	/**
	 * Change column data types and set formatting defaults
	 *
	 * @since    1.2.0
	 * @since    1.2.4  Add number format
	 *
	 * @param {Object} event Event object to change data type
	 * @return {void}
	 */
	function onUpdateDataType(event) {
		let updatedDataType = {};
		let newColumnClassNames = new Set(columnClassNames);

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
	 *
	 * @param {Object} event Form submit
	 */
	function onUpdate(event) {
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

	return (
		<Modal
			title="Configure Column Content Type"
			overlayClassName="configure-column-modal"
			onRequestClose={handleCancel}
			focusOnMount="firstContentElement"
			isDismissible="false"
			shouldCloseOnClickOutside="false"
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
												// { value: 'image', label: 'Image' },
												// { value: 'link', label: 'Link' },
												// { value: 'checkbox', label: 'Check Box' },
												// { value: 'rating', label: 'Rating' },
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
																__next40pxDefaultSize
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
																	__next40pxDefaultSize
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
																	// id={previewId}
																	id={`${previewId}-entry`}
																	__next40pxDefaultSize
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
																// id={previewId}
																id={`${previewId}-display`}
																__next40pxDefaultSize
																value={numberDisplayValue}
																// value={numberPreviewValue}numberDisplayValue
															/>
														</BaseControl>
													</div>
												</FlexItem>
											</Flex>
										</VStack>
									</CardBody>
								</Card>
							)}
						</VStack>
					</div>
				</div>

				{/* Sticky footer */}
				<div className="configure-column-modal__footer">
					<div className="configure-column-modal__button-group">
						<Button variant="secondary" onClick={handleCancel}>
							Cancel
						</Button>
						<Button variant="primary" type="submit">
							Update
						</Button>
					</div>
				</div>
			</form>
		</Modal>
	);
}

export const ColumnDataTypeModal = memo(ConfigureColumnDataType);
