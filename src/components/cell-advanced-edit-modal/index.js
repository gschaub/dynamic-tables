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
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import './style.scss';
import { FreeformCheckboxIcon, StatusIcon } from '../formatted-display';
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
 * @since    1.4.6
 *
 * @param {Object} props
 * @return {Object} Updated column properties
 */
function EditCellContent(props = {}) {
	const {
		tableId,
		cellId,
		cellContent,
		cellAttributes,
		cellClasses,
		cellContentType,
		enableProFeatures,
		updatedCell,
		onRequestClose,
	} = props;

	console.log('In Edit Cell Modal');
	/**
	 * Stop event processing in favor of custom processing.
	 *
	 * @since    1.4.6
	 *
	 * @param {Object} event Mouse down
	 */
	function stopProp(event) {
		event.stopPropagation();
	}

	/**
	 * Close component modal.
	 *
	 * @since    1.4.6
	 */
	function close() {
		onRequestClose?.();
	}

	/**
	 * Close modal on cancel.
	 *
	 * @since    1.4.6
	 */
	function handleCancel() {
		onRequestClose?.();
	}

	/**
	 * Return new column data type settings.
	 *
	 * @since    1.4.6
	 *
	 * @param {Object} event Form submit
	 */
	function onUpdate(event) {
		event?.preventDefault?.();

		updatedCell(
			event,
			'editedCellContent',
			tableId,
			cellId,
			cellContent,
			cellAttributes,
			cellClasses,
			cellContentType
		);
		close();
	}

	return (
		<Modal
			title="Configure Column Content Type"
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
							<p>Heading</p>

							{/* Cell Content Type */}
							{true && (
								<Card>
									<CardHeader>
										<strong>Content settings</strong>
									</CardHeader>
									<CardBody></CardBody>
								</Card>
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

export const EditCellContentModal = memo(EditCellContent);
