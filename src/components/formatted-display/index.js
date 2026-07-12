/* External dependencies */
import { Button, CheckboxControl, ToggleControl } from '@wordpress/components';
import freeformCheckedIcon from '../../../assets/icons/checkbox/freeform-checked.svg';
import freeformUncheckedIcon from '../../../assets/icons/checkbox/freeform-unchecked.svg';
import statusCheckedIcon from '../../../assets/icons/checkbox/status-icon-checked.svg';
import statusUncheckedIcon from '../../../assets/icons/checkbox/status-icon-unchecked.svg';

/**
 * Render checkbox image
 *
 * @since 1.4.3
 *
 * @param {string} src       Location of image to select
 * @param {string} className Element classes
 * @param {string} label     Whether the image should identify as checked or unchecked
 * @param {number} width     Width to render image in px
 * @param {number} height    Height to render image in px
 * @return {string}  Image HTML to render
 */
function CheckboxAssetIcon({ src, className, label, width, height }) {
	return (
		<img
			className={className}
			src={src}
			alt={label}
			width={width}
			height={height}
			style={{
				display: 'inline-block',
				flexShrink: 0,
				verticalAlign: 'middle',
			}}
		/>
	);
}

/**
 * Render checkbox as Icon
 *
 * @since 1.4.3
 *
 * @param {boolean} checked   Whether the icon is checked
 * @param {string}  className Element classes
 * @param {string}  size      Whether the image should identify as checked or unchecked
 * @param {Object}  onChange  Action associated with checkbox update
 * @return {string}  Icon type checkbox HTML element
 */
export function StatusIcon({ checked, className, size = 24, onChange }) {
	const label = checked ? 'Checked' : 'Unchecked';
	const src = checked ? statusCheckedIcon : statusUncheckedIcon;

	function onHandleClick(event) {
		if (typeof onChange !== 'function') {
			return;
		}

		return onChange(event);
	}

	return (
		<Button
			className={className}
			label={label}
			icon={
				<CheckboxAssetIcon
					src={src}
					className={className}
					label={label}
					width={size}
					height={size}
				/>
			}
			iconSize={size}
			onClick={e => onHandleClick(e)}
		/>
	);
}

/**
 * Render checkbox as freeform icon
 *
 * @since 1.4.3
 *
 * @param {boolean} checked   Whether the icon is checked
 * @param {string}  className Element classes
 * @param {string}  scale     Factor by which to scale the checkbox size
 * @param {Object}  onChange  Action associated with checkbox update
 * @return {string}  Freeform type checkbox HTML element
 */
export function FreeformCheckboxIcon({ checked, className, scale = 1, onChange }) {
	const label = checked ? 'Checked' : 'Unchecked';
	const baseSize = 52;
	const size = baseSize * scale;
	const src = checked ? freeformCheckedIcon : freeformUncheckedIcon;

	function onHandleClick(event) {
		if (typeof onChange !== 'function') {
			return;
		}

		return onChange(event);
	}

	return (
		<Button
			className={className}
			label={label}
			icon={
				<CheckboxAssetIcon
					src={src}
					className={className}
					label={label}
					width={size}
					height={size}
				/>
			}
			iconSize={size}
			onClick={e => onHandleClick(e)}
		/>
	);
}

/**
 * Render the appropriate checkbox based on it type
 *
 * @since 1.4.3
 *
 * @param {boolean} checked   Whether the icon is checked
 * @param {string}  variant   Checkbox type to render
 * @param {Object}  onChange  Action associated with checkbox update
 * @param {string}  className Element classes
 * @param {string}  scale     Factor by which to scale the checkbox size
 * @return {string}  Checkbox HTML element
 */
export function TableCheckbox({ checked, variant, onChange, className = '', scale = 1 }) {
	const isInteractive = typeof onChange === 'function';
	const newChecked = !checked;

	function onUpdateValue(updatedValue) {
		if (!isInteractive) {
			return;
		}

		onChange(updatedValue);
	}

	switch (variant) {
		case 'standard':
			return (
				<CheckboxControl
					checked={!!checked}
					onChange={nextChecked => {
						if (!isInteractive) {
							return;
						}
						onUpdateValue(!!nextChecked);
					}}
				/>
			);
		case 'toggle':
			return (
				<ToggleControl
					checked={!!checked}
					onChange={nextChecked => {
						if (!isInteractive) {
							return;
						}
						onUpdateValue(!!nextChecked);
					}}
					label={''}
				/>
			);
		case 'icon':
			return (
				<StatusIcon
					checked={!!checked}
					className={className}
					size={24}
					onChange={() => {
						onUpdateValue(newChecked);
					}}
				/>
			);
		case 'freeform':
			return (
				<FreeformCheckboxIcon
					checked={!!checked}
					className={className}
					scale={scale}
					onChange={() => {
						onUpdateValue(newChecked);
					}}
				/>
			);
		default:
			return null;
	}
}
