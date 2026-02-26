/* External dependencies */
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useState, memo } from '@wordpress/element';
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

/**
 * Internal dependencies
 */
import './style.scss';
import { settings } from '@wordpress/icons';

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
	const { tableId, columnId, columnLabel, columnAttributes, updatedColumn, onRequestClose } = props;

	if (columnAttributes) {
		console.log('Initial column attributes:');
		console.log(columnAttributes);
	}

	// Column data type attributes
	const defaultDataType = {
		columnDataType: {
			type: 'general',
		},
	};

	const [columnName, setColumnName] = useState(columnLabel);
	const [dataType, setDataType] = useState(
		columnAttributes?.columnDataType ? columnAttributes.columnDataType : defaultDataType
	);
	const [format, setFormat] = useState(
		columnAttributes?.columnDataType?.settings?.format || 'date'
	);

	// Date specific attributes
	const initDefaultToToday =
		columnAttributes?.columnDataType?.settings?.defaultToToday === true ? true : false;
	const isDateDataType = columnAttributes.columnDataType?.type === 'date-time' ? true : false;
	const initDatePreviewValue =
		initDefaultToToday && isDateDataType
			? formattedDate(columnAttributes?.columnDataType?.settings?.format)
			: '';

	const [dateDefaultToToday, setDateDefaultToToday] = useState(initDefaultToToday);
	const [datePreviewValue, setDatePreviewValue] = useState(initDatePreviewValue);

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

	function formattedDate(type) {
		const today = new Date();

		if (type === 'date') {
			return today.toISOString().split('T')[0];
		}
		if (type === 'time') {
			const hh = String(today.getHours()).padStart(2, '0');
			const mm = String(today.getMinutes()).padStart(2, '0');
			return `${hh}:${mm}`;
		}
		if (type === 'datetime-local') {
			const yyyy = today.getFullYear();
			const mo = String(today.getMonth() + 1).padStart(2, '0');
			const dd = String(today.getDate()).padStart(2, '0');
			const hh = String(today.getHours()).padStart(2, '0');
			const mm = String(today.getMinutes()).padStart(2, '0');
			return `${yyyy}-${mo}-${dd}T${hh}:${mm}`;
		}
		return '';
	}

	function onDateTimeType(e, type) {
		if (!e && format === type) {
			setFormat('date');
			if (dateDefaultToToday) setDatePreviewValue(formattedDate('date'));
			return;
		}

		setFormat(type);
		if (dateDefaultToToday) setDatePreviewValue(formattedDate(type));

		const dataTypeSettings = {
			format: type,
			defaultToToday: dateDefaultToToday,
		};

		const updatedDataType = {
			type: 'date-time',
			settings: dataTypeSettings,
		};
		setDataType(updatedDataType);
	}

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
		};

		const updatedDataType = {
			type: 'date-time',
			settings: dataTypeSettings,
		};

		setDataType(updatedDataType);
	}

	function onUpdateDataType(e) {
		let updatedDataType = {};

		switch (e) {
			case 'date-time':
				setFormat('date');
				updatedDataType = {
					type: 'date-time',
					settings: {
						format: 'date',
						defaultToToday: false,
					},
				};
				break;
			default:
				updatedDataType = {
					type: e,
				};
				break;
		}

		setDataType(updatedDataType);
	}

	/**
	 * Process form submit.
	 *
	 * @since    1.0.0
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

		console.log('updated column attributes:');
		console.log(updatedColumnAttributes);
		updatedColumn(event, 'dataType', tableId, columnId, updatedColumnAttributes, columnName);

		close();
	}

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
												// { value: 'checkbox', label: 'Check Box' },
												// { value: 'rating', label: 'Rating' },
											]}
											__nextHasNoMarginBottom
										/>
									</VStack>
								</CardBody>
							</Card>

							{/* Settings */}
							{dataType.type !== 'general' && (
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
															selected={format}
															options={[
																{ label: 'Date only', value: 'date' },
																{ label: 'Time only', value: 'time' },
																{ label: 'Date & time', value: 'datetime-local' },
															]}
															onChange={value => onDateTimeType(true, value)}
														/>

														<div className="configure-column-modal__advanced">
															<strong>Advanced</strong>
															<CheckboxControl
																label="Default to today's date"
																checked={dateDefaultToToday}
																onChange={e => onDateDefaultToToday(e, format)}
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
																type={format}
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
