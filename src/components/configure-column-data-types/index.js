/* External dependencies */
import { useEffect, useState, memo } from '@wordpress/element';
import {
	Modal,
	Panel,
	PanelBody,
	PanelRow,
	SelectControl,
	__experimentalInputControl as InputControl,
	CheckboxControl,
	Button,
	__experimentalNumberControl as NumberControl,
	TextControl,
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
	const [dateDefaultTodaysDate, setDateDefaultTodaysDate] = useState(
		columnAttributes?.columnDataType?.settings?.dateDefaultTodaysDate || false
	);
	const [datePreviewValue, setDatePreviewValue] = useState('');

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
			return today.toTimeString().split(' ')[0];
		}
		if (type === 'datetime-local') {
			const date = today.toISOString().split('T')[0];
			const time = today.toTimeString().split(' ')[0];
			return `${date}T${time}`;
		}
		return '';
	}

	function onDateTimeType(e, type) {
		if (!e && format === type) {
			setFormat('date');
			if (dateDefaultTodaysDate) setDatePreviewValue(formattedDate('date'));
			return;
		}

		setFormat(type);
		if (dateDefaultTodaysDate) setDatePreviewValue(formattedDate(type));

		const dataTypeSettings = {
			format: type,
			defaultToToday: dateDefaultTodaysDate,
		};

		const updatedDataType = {
			type: 'date-time',
			settings: dataTypeSettings,
		};
		setDataType(updatedDataType);
	}

	function onDateDefaultTodaysDate(isChecked, type) {
		if (!isChecked) {
			setDatePreviewValue('');
		} else {
			setDatePreviewValue(formattedDate(type));
		}

		setDateDefaultTodaysDate(isChecked);

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
		<>
			<Modal
				title="Configure Column Content Type"
				onRequestClose={handleCancel}
				focusOnMount="firstContentElement"
				isDismissible="false"
				shouldCloseOnClickOutside="false"
				size="large"
			>
				<p className="column-label">For column {columnName}</p>

				<hr />

				<form className="configure-data-type--form" onSubmit={onUpdate} onMouseDown={stopProp}>
					<InputControl
						label="Column Name"
						value={columnName}
						onChange={value => setColumnName(value)}
					/>

					<hr style={{ marginTop: '10px' }} />

					<SelectControl
						className="column-data-type--select"
						label="Content Type"
						value={dataType.type}
						onChange={onUpdateDataType}
						options={[
							{ value: 'general', label: 'General' },
							{ value: 'date-time', label: 'Data/Time' },
							// { value: 'checkbox', label: 'Check Box' },
							// { value: 'rating', label: 'Rating' },
						]}
						__nextHasNoMarginBottom
					/>

					{dataType.type !== 'general' && (
						<Panel header="Content Settings" className="column-data-type--settings">
							{dataType.type === 'date-time' && (
								<>
									<p>Select the specific date/time appearance.</p>

									<div className="configure-column-type--settings-container">
										<div className="configure-column-type--settings-options">
											<PanelRow>
												<CheckboxControl
													label="Date Only"
													checked={format === 'date'}
													onChange={e => onDateTimeType(e, 'date')}
												/>
											</PanelRow>

											<PanelRow>
												<CheckboxControl
													label="Time Only"
													checked={format === 'time'}
													onChange={e => onDateTimeType(e, 'time')}
												/>
											</PanelRow>

											<PanelRow>
												<CheckboxControl
													label="Date & Time"
													checked={format === 'datetime-local'}
													onChange={e => onDateTimeType(e, 'datetime-local')}
												/>
											</PanelRow>
											<PanelBody title="Other Settings" initialOpen={false}>
												<PanelRow>
													<CheckboxControl
														label="Default to today's date"
														checked={dateDefaultTodaysDate}
														onChange={e => onDateDefaultTodaysDate(e, format)}
													/>
												</PanelRow>
											</PanelBody>
										</div>

										<div className="configure-column-type--settings-preview">
											<TextControl
												label="Preview"
												type={format}
												value={datePreviewValue}
												onChange={setDatePreviewValue}
											/>
										</div>
									</div>
								</>
							)}

							{dataType.type === 'checkbox' && (
								<>
									<p>Check Box specific settings will go here.</p>
								</>
							)}

							{dataType.type === 'rating' && (
								<>
									<p>Rating specific settings will go here.</p>
								</>
							)}
						</Panel>
					)}

					<span className="configure-column-modal__button-group">
						<Button variant="secondary" onClick={handleCancel}>
							Cancel
						</Button>

						<Button variant="primary" type="submit">
							Update
						</Button>
					</span>
				</form>
			</Modal>
		</>
	);
}

export const ColumnDataTypeModal = memo(ConfigureColumnDataType);
