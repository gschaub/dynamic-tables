/* External dependencies */
import { useEffect, useState } from '@wordpress/element';
import {
	Modal,
	SelectControl,
	CheckboxControl,
	Button,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * React component to support updates for the current column width.
 *
 * @since    1.0.0
 *
 * @param {Object} props
 * @return {Object} Updated column properties
 */
function ConfigureColumnWidth(props) {
	const { openColumnWidth, columnId, columnLabel, columnAttributes, enableProFeatures } = props;
	//    const [closePage, setClosePage] = useState(false)

	useEffect(() => {
		switch (columnAttributes.columnWidthType) {
			case 'Proportional': {
				setHideProportional(false);
				setHideCustom(true);
				setHideFixed(true);
				break;
			}

			case 'Auto': {
				setHideProportional(true);
				setHideCustom(true);
				setHideFixed(true);
				break;
			}

			case 'Fixed': {
				setHideProportional(true);
				setHideCustom(true);
				setHideFixed(false);
				break;
			}

			case 'Custom': {
				setHideProportional(true);
				setHideCustom(false);
				setHideFixed(true);
				break;
			}
		}

		setColumnWidthType(columnAttributes.columnWidthType);
		setMinWidth(columnAttributes.minWidth);
		setMinWidthUnits(columnAttributes.minWidthUnits);
		setMaxWidth(columnAttributes.maxWidth);
		setMaxWidthUnits(columnAttributes.maxWidthUnits);
		setFixedWidth(columnAttributes.fixedWidth);
		setFixedWidthUnits(columnAttributes.fixedWidth);
		setDisableForPhone(columnAttributes.disableForPhone);
		setDisableForTablet(columnAttributes.disableForTablet);
	}, [columnAttributes]);

	/**
	 * Stop event processing in favor of custom processing.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Mouse down
	 */
	function stopProp(event) {
		event.stopPropagation();
	}

	/**
	 * Close modal on cancel.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Cancel
	 */
	function handleCancel(event) {
		openColumnWidth(false);
	}

	const [columnWidthType, setColumnWidthType] = useState();
	const [hideProportional, setHideProportional] = useState(true);
	const [hideCustom, setHideCustom] = useState(true);
	const [hideFixed, setHideFixed] = useState(true);
	const [minWidth, setMinWidth] = useState(0);
	const [minWidthUnits, setMinWidthUnits] = useState();
	const [maxWidth, setMaxWidth] = useState(1);
	const [maxWidthUnits, setMaxWidthUnits] = useState();
	const [fixedWidth, setFixedWidth] = useState(0);
	const [fixedWidthUnits, setFixedWidthUnits] = useState();
	const [disableForTablet, setDisableForTablet] = useState(false);
	const [disableForPhone, setDisableForPhone] = useState(false);

	console.log('In Component ConfigureColumnWidth');
	console.log(props);

	/**
	 * Process change in width type and set detault props for the type.
	 *
	 * @since    1.0.0
	 *
	 * @param {string} event New column width type
	 */
	function onWidthType(event) {
		console.log('...In Width Type Update');
		console.log(event);

		switch (event) {
			case 'Proportional': {
				setMaxWidth(1);
				setMaxWidthUnits('fr');
				setMinWidth(20);
				setMinWidthUnits('ch');
				setFixedWidth(0);
				setFixedWidthUnits('px');
				setHideProportional(false);
				setHideCustom(true);
				setHideFixed(true);
				break;
			}

			case 'Auto': {
				setMaxWidth(0);
				setMaxWidthUnits('fr');
				setMinWidth(0);
				setMinWidthUnits('ch');
				setFixedWidth(0);
				setFixedWidthUnits('px');
				setHideProportional(true);
				setHideCustom(true);
				setHideFixed(true);
				break;
			}

			case 'Fixed': {
				setMaxWidth(0);
				setMaxWidthUnits('fr');
				setMinWidth(0);
				setMinWidthUnits('ch');
				setFixedWidth(40);
				setFixedWidthUnits('px');
				setHideProportional(true);
				setHideCustom(true);
				setHideFixed(false);
				break;
			}

			case 'Custom': {
				setMaxWidth(40);
				setMaxWidthUnits('ch');
				setMinWidth(20);
				setMinWidthUnits('ch');
				setFixedWidth(0);
				setFixedWidthUnits('px');
				setHideProportional(true);
				setHideCustom(false);
				setHideFixed(true);
				break;
			}
		}

		setColumnWidthType(event);
	}

	/**
	 * Process change to number of minimum width units.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Minimum width units
	 */
	function onMinimumWidth(event) {
		console.log('...In MixWidth Update');
		console.log(event);
		setMinWidth(event.target.value);
	}

	/**
	 * Process change to the minimum width unit type.
	 *
	 * @since    1.0.0
	 *
	 * @param {string} event Minimum width unit type
	 */
	function onMinimumWidthUnits(event) {
		console.log('...In MixWidth Units Update');
		console.log(event);
		setMinWidthUnits(event);
	}

	/**
	 * Process change to number of maximum width units.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Maximum width units
	 */
	function onMaximumWidth(event) {
		console.log('...In Max Width Update');
		console.log(event);
		setMaxWidth(event.target.value);
	}

	/**
	 * Process change to the maximum width unit type
	 *
	 * @since    1.0.0
	 *
	 * @param {string} event Maximum width unit type
	 */
	function onMaximumWidthUnits(event) {
		console.log('...In Max Width  Update');
		console.log(event);
		setMaxWidthUnits(event);
	}

	/**
	 * Process change to number of fixed width units.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Fixed width units
	 */
	function onFixedWidth(event) {
		console.log('...In Max Width Update');
		console.log(event);
		setFixedWidth(Number(event.target.value));
	}

	/**
	 * Process change to the fixed width unit type
	 *
	 * @since    1.0.0
	 *
	 * @param {string} event Fixed width unit type
	 */
	function onFixedWidthUnits(event) {
		console.log('...In Max Width Units Update');
		console.log(event);
		setFixedWidthUnits(event);
	}

	/**
	 * Process change to hide column for tablet form factor.
	 *
	 * @since    1.0.0
	 *
	 * @param {boolean} checked Hide for tablets
	 */
	function onTablet(checked) {
		console.log('...In Tablet Update');
		console.log(checked);

		setDisableForTablet(checked);
	}

	/**
	 * Process change to hide column for phone form factor.
	 *
	 * @since    1.0.0
	 *
	 * @param {*} checked Hide for phones
	 */
	function onPhone(checked) {
		console.log('...In Phone Update');
		console.log(checked);

		setDisableForPhone(checked);
	}

	/**
	 * Process form submit.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Form submit
	 */
	function onUpdate(event) {
		// event.preventDefault()
		console.log('COLUMN WIDTH UPDATED...');
		console.log(event);
		console.log('...Max Width = ' + maxWidth);

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
		};

		console.log(updatedColumnAttributes);

		openColumnWidth(false, updatedColumnAttributes);
	}

	console.log('RENDER PROPS');
	console.log('...Disable Proportional Input = ' + hideProportional);
	console.log('...Disable Fixed Input = ' + hideFixed);
	console.log('...Disable Custom Input = ' + hideCustom);

	return (
		<>
			{openColumnWidth && (
				<Modal
					title="Configure Column Width"
					onRequestClose={handleCancel}
					focusOnMount="firstContentElement"
					isDismissible="false"
					shouldCloseOnClickOutside="false"
					size="large"
				>
					<p className="column-label">For column {columnLabel}</p>

					<form
						// className="blocks-table__placeholder-form"
						onSubmit={onUpdate}
						onMouseDown={stopProp}
					>
						<SelectControl
							label="Width Type"
							value={columnWidthType}
							onChange={e => onWidthType(e)}
							options={[
								{ value: 'Proportional', label: 'Proportional' },
								{ value: 'Auto', label: 'Automatic' },
								{ value: 'Fixed', label: 'Fixed width' },
								{ value: 'Custom', label: 'Custom' },
							]}
							__nextHasNoMarginBottom
						/>

						<fieldset className={hideProportional === true ? ' column-width--not-visible' : ''}>
							<legend>Set Proportional Width</legend>
							<NumberControl
								className="column-width-value-input"
								label="Number of portions"
								labelPosition="side"
								onBlur={e => onMaximumWidth(e)}
								value={maxWidth}
							/>

							<span className="column-width-span-input">
								<NumberControl
									className="column-width-value-input"
									label="Minimum width"
									labelPosition="left"
									value={minWidth}
									onBlur={e => onMinimumWidth(e)}
								/>

								<SelectControl
									className="column-width-unit-input"
									labelPosition="left"
									label="Units"
									value={minWidthUnits}
									onChange={e => onMinimumWidthUnits(e)}
									options={[
										{ value: 'px', label: 'pixels' },
										{ value: 'ch', label: 'characters' },
										{ value: 'pt', label: 'points' },
										{ value: 'in', label: 'inches' },
										{ value: 'fr', label: 'proportional' },
									]}
									__nextHasNoMarginBottom
								/>
							</span>
						</fieldset>

						<fieldset className={hideFixed === true ? 'column-width--not-visible' : ''}>
							<legend>Set Fixed Width</legend>

							<span className="column-width-span-input">
								<NumberControl
									className="column-width-input"
									label="Fixed width"
									labelPosition="left"
									value={fixedWidth}
									onBlur={e => onFixedWidth(e)}
								/>

								<SelectControl
									className="column-width-unit-input"
									label="Units"
									labelPosition="left"
									value={fixedWidthUnits}
									onChange={e => onFixedWidthUnits(e)}
									options={[
										{ value: 'px', label: 'pixels' },
										{ value: 'ch', label: 'font' },
										{ value: 'pt', label: 'points' },
										{ value: 'in', label: 'inches' },
										{ value: 'fr', label: 'proportional' },
									]}
									__nextHasNoMarginBottom
								/>
							</span>
						</fieldset>

						<fieldset className={hideCustom === true ? 'column-width--not-visible' : ''}>
							<legend>Set Custom Width</legend>
							<span className="column-width-span-input">
								<NumberControl
									className="column-width-input"
									label="Minimum width"
									labelPosition="left"
									value={minWidth}
									onBlur={e => onMinimumWidth(e)}
								/>

								<SelectControl
									className="column-width-unit-input"
									labelPosition="left"
									label="Units"
									value={minWidthUnits}
									onChange={e => onMinimumWidthUnits(e)}
									options={[
										{ value: 'px', label: 'pixels' },
										{ value: 'ch', label: 'characters' },
										{ value: 'pt', label: 'points' },
										{ value: 'in', label: 'inches' },
										{ value: 'fr', label: 'proportional' },
									]}
									__nextHasNoMarginBottom
								/>
							</span>

							<span className="column-width-span-input">
								<NumberControl
									className="column-width-input"
									label="Maximum width"
									labelPosition="left"
									value={maxWidth}
									onBlur={e => onMaximumWidth(e)}
								/>

								<SelectControl
									className="column-width-unit-input"
									labelPosition="left"
									label="Units"
									value={maxWidthUnits}
									onChange={e => onMaximumWidthUnits(e)}
									options={[
										{ value: 'px', label: 'pixels' },
										{ value: 'ch', label: 'characters' },
										{ value: 'pt', label: 'points' },
										{ value: 'in', label: 'inches' },
										{ value: 'fr', label: 'proportional' },
									]}
									__nextHasNoMarginBottom
								/>
							</span>
						</fieldset>

						{enableProFeatures && (
							<>
								<CheckboxControl
									label="Hide for tablet"
									checked={disableForTablet}
									onChange={onTablet}
								/>
								<CheckboxControl
									label="Hide for phone"
									checked={disableForPhone}
									onChange={onPhone}
								/>
							</>
						)}
						<span>
							<Button variant="secondary" onClick={handleCancel}>
								Cancel
							</Button>

							<Button variant="primary" type="submit">
								Update
							</Button>
						</span>
					</form>
				</Modal>
			)}
		</>
	);
}

export { ConfigureColumnWidth };
