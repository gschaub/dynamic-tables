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

	const { type: contentType, settings } = cellContentType;
	const { format: contentFormat } = settings?.format || '';

	const [currentCellContent, setCurrentCellContent] = useState(cellContent);
	const [currentCellValueAttributes, setCurrentCellValueAttributes] = useState(
		cellAttributes || {}
	);
	const [currentCellClasses, setCurrentCellClasses] = useState(cellClasses);

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

	function onUpdateCellValue(event, attribute) {
		let content = currentCellContent;
		let attributes = currentCellValueAttributes;

		switch (contentType) {
			case 'link':
				if (!attributes) {
					console.log('Resetting attributes. Prior:', attributes);
					attributes = {
						cannonical: {
							url: '#',
							label: '',
						},
						indexText: '',
					};
				}

				switch (attribute) {
					case 'url':
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								url: event,
							},
						};
						console.log('Attributes from URL', attributes);
						break;
					case 'label':
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								label: event,
							},
						};
						console.log('Attributes from Label', attributes);
						break;
					default:
						break;
				}
				const url = attributes.cannonical?.url;
				const label = attributes.cannonical?.label;
				content =
					'<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
				break;
			default:
				break;
		}
		console.log('Attributes: ', attributes);
		console.log('Content: ', content);

		setCurrentCellContent(content);
		setCurrentCellValueAttributes(attributes);
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

		const updatedCellContent = currentCellContent;
		const updatedCellValueAttributes = currentCellValueAttributes;
		const updateCellClasses = currentCellClasses;

		updatedCell(
			event,
			'editedCellContent',
			tableId,
			cellId,
			updatedCellContent,
			updatedCellValueAttributes,
			updateCellClasses,
		);
		close();
	}

	return (
		<Modal
			title="Edit Cell Content"
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
							{cellContentType.type === 'link' && (
								<Card>
									<CardHeader>
										<strong>Content settings</strong>
									</CardHeader>
									<CardBody>
										<TextControl
											// className={renderColumnClasses}
											type="url"
											label="Link URL"
											placeholder="http://"
											// id={previewId}
											// step={60}
											__next40pxDefaultSize
											value={currentCellValueAttributes?.cannonical?.url || ''}
											onChange={e => onUpdateCellValue(e, 'url')}
										></TextControl>
										<TextControl
											// className={renderColumnClasses}
											type="text"
											label="Link Label"
											// placeholder="http://"
											// id={previewId}
											// step={60}
											__next40pxDefaultSize
											value={currentCellValueAttributes?.cannonical?.label || ''}
											onChange={e => onUpdateCellValue(e, 'label')}
										></TextControl>
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
