/* External dependencies */
import { useEffect, useState } from '@wordpress/element';
import {
	Modal,
	SelectControl,
	Button,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * React component to support updates for the current row height.
 *
 * @since    1.0.0
 *
 * @param {Object} props
 * @return  {Object} Updated column properties
 */
function ConfigureRowHeight(props) {
	const { openRowHeight, rowLabel, rowAttributes } = props;

	useEffect(() => {
		switch (rowAttributes.rowHeightType) {
			case 'Auto': {
				setHideCustom(true);
				setHideFixed(true);
				break;
			}

			case 'Fixed': {
				setHideCustom(true);
				setHideFixed(false);
				break;
			}

			case 'Custom': {
				setHideCustom(false);
				setHideFixed(true);
				break;
			}
		}

		setRowHeightType(rowAttributes.rowHeightType);
		setMinHeight(rowAttributes.minHeight);
		setMinHeightUnits(rowAttributes.minHeightUnits);
		setMaxHeight(rowAttributes.maxHeight);
		setMaxHeightUnits(rowAttributes.maxHeightUnits);
		setFixedHeight(rowAttributes.fixedHeight);
		setFixedHeightUnits(rowAttributes.fixedHeightUnits);
	}, [rowAttributes]);

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
		openRowHeight(false);
	}

	const [rowHeightType, setRowHeightType] = useState();
	const [hideCustom, setHideCustom] = useState(true);
	const [hideFixed, setHideFixed] = useState(true);
	const [minHeight, setMinHeight] = useState(0);
	const [minHeightUnits, setMinHeightUnits] = useState();
	const [maxHeight, setMaxHeight] = useState(1);
	const [maxHeightUnits, setMaxHeightUnits] = useState();
	const [fixedHeight, setFixedHeight] = useState(0);
	const [fixedHeightUnits, setFixedHeightUnits] = useState();

	/**
	 * Process change in height type and set detault props for the type.
	 *
	 * @since    1.0.0
	 *
	 * @param {string} event New row height type
	 */
	function onHeightType(event) {
		switch (event) {
			case 'Auto': {
				setMaxHeight(0);
				setMaxHeightUnits('fr');
				setMinHeight(0);
				setMinHeightUnits('ch');
				setFixedHeight(0);
				setFixedHeightUnits('px');
				setHideCustom(true);
				setHideFixed(true);
				break;
			}

			case 'Fixed': {
				setMaxHeight(0);
				setMaxHeightUnits('fr');
				setMinHeight(0);
				setMinHeightUnits('ch');
				setFixedHeight(40);
				setFixedHeightUnits('px');
				setHideCustom(true);
				setHideFixed(false);
				break;
			}

			case 'Custom': {
				setMaxHeight(40);
				setMaxHeightUnits('ch');
				setMinHeight(20);
				setMinHeightUnits('ch');
				setFixedHeight(0);
				setFixedHeightUnits('px');
				setHideCustom(false);
				setHideFixed(true);
				break;
			}
		}

		setRowHeightType(event);
	}

	/**
	 * Process change to number of minimum height units.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Minimum height units
	 */
	function onMinimumHeight(event) {
		setMinHeight(event.target.value);
	}

	/**
	 * Process change to the minimum height unit type.
	 *
	 * @since    1.0.0
	 *
	 * @param {string} event Minimum height unit type
	 */
	function onMinimumHeightUnits(event) {
		setMinHeightUnits(event);
	}

	/**
	 * Process change to number of maximum height units.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Maximum height units
	 */
	function onMaximumHeight(event) {
		setMaxHeight(event.target.value);
	}

	/**
	 * Process change to the maximum height unit type
	 *
	 * @since    1.0.0
	 *
	 * @param {string} event Maximum height unit type
	 */
	function onMaximumHeightUnits(event) {
		setMaxHeightUnits(event);
	}

	/**
	 * Process change to number of fixed height units.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Fixed height units
	 */
	function onFixedHeight(event) {
		setFixedHeight(Number(event.target.value));
	}

	/**
	 * Process change to the fixed height unit type
	 *
	 * @since    1.0.0
	 *
	 * @param {string} event Fixed height unit type
	 */
	function onFixedHeightUnits(event) {
		setFixedHeightUnits(event);
	}

	/**
	 * Process form submit.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Form submit
	 */
	function onUpdate(event) {
		const updatedRowAttributes = {
			rowHeightType: rowHeightType,
			minHeight: minHeight,
			minHeightUnits: minHeightUnits,
			maxHeight: Number(maxHeight),
			maxHeightUnits: maxHeightUnits,
			fixedHeight: fixedHeight,
			fixedHeightUnits: fixedHeightUnits,
			isFixedLeftRowGroup: false,
			horizontalAlignment: 'none',
		};

		openRowHeight(false, updatedRowAttributes);
	}

	return (
		<>
			{openRowHeight && (
				<Modal
					title="Configure Row Height"
					onRequestClose={handleCancel}
					focusOnMount="firstContentElement"
					isDismissible="false"
					shouldCloseOnClickOutside="false"
					size="large"
				>
					<p className="row-label">For row {rowLabel}</p>

					<form onSubmit={onUpdate} onMouseDown={stopProp}>
						<SelectControl
							label="Height Type"
							value={rowHeightType}
							onChange={e => onHeightType(e)}
							options={[
								{ value: 'Auto', label: 'Automatic' },
								{ value: 'Fixed', label: 'Fixed height' },
								{ value: 'Custom', label: 'Custom' },
							]}
							__nextHasNoMarginBottom
						/>

						<fieldset className={hideFixed === true ? 'row-height--not-visible' : ''}>
							<legend>Set Fixed Height</legend>

							<span className="row-height-span-input">
								<NumberControl
									className="row-height-input"
									label="Fixed height"
									labelPosition="left"
									value={fixedHeight}
									onBlur={e => onFixedHeight(e)}
								/>

								<SelectControl
									className="row-height-unit-input"
									label="Units"
									labelPosition="left"
									value={fixedHeightUnits}
									onChange={e => onFixedHeightUnits(e)}
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

						<fieldset className={hideCustom === true ? 'row-height--not-visible' : ''}>
							<legend>Set Custom Height</legend>
							<span className="row-height-span-input">
								<NumberControl
									className="row-height-input"
									label="Minimum height"
									labelPosition="left"
									value={minHeight}
									onBlur={e => onMinimumHeight(e)}
								/>

								<SelectControl
									className="row-height-unit-input"
									labelPosition="left"
									label="Units"
									value={minHeightUnits}
									onChange={e => onMinimumHeightUnits(e)}
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

							<span className="row-height-span-input">
								<NumberControl
									className="row-height-input"
									label="Maximum height"
									labelPosition="left"
									value={maxHeight}
									onBlur={e => onMaximumHeight(e)}
								/>

								<SelectControl
									className="row-height-unit-input"
									labelPosition="left"
									label="Units"
									value={maxHeightUnits}
									onChange={e => onMaximumHeightUnits(e)}
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

export { ConfigureRowHeight };
