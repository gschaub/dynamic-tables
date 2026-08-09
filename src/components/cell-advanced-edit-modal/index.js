/* External dependencies */
import apiFetch from '@wordpress/api-fetch';
import { useInstanceId } from '@wordpress/compose';
import { useLayoutEffect, useRef, useState, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	Button,
	CheckboxControl,
	TextControl,
	Notice,
	__experimentalVStack as VStack,
	Card,
	CardBody,
	CardHeader,
} from '@wordpress/components';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import './style.scss';

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
	const [linkResolutionError, setLinkResolutionError] = useState('');
	const initialLinkUrlRef = useRef(String(cellAttributes?.cannonical?.url || ''));
	const [isResolvingLink, setIsResolvingLink] = useState(false);

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
						setLinkResolutionError('');
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								url: event,
							},
							indexText: attributes?.indexText || '',
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
							indexText: event,
						};
						console.log('Attributes from Label', attributes);
						break;
					case 'newTab':
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								newTab: event,
							},
							indexText: attributes?.indexText || '',
						};
						console.log('Attributes from Label', attributes);
						break;
					default:
						break;
				}
				const url = attributes.cannonical?.url;
				const label = attributes.cannonical?.label;

				if (attributes.cannonical?.newTab) {
					content =
						'<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
				} else {
					content = '<a href="' + url + '" target="_top">' + label + '</a>';
				}
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
	async function onUpdate(event) {
		event?.preventDefault?.();

		let updatedCellContent = currentCellContent;
		let updatedCellValueAttributes = currentCellValueAttributes;
		const updateCellClasses = currentCellClasses;

		const currentLabel = currentCellValueAttributes?.cannonical?.label || '';
		const currentLinkUrl = String(currentCellValueAttributes?.cannonical?.url || '');
		const shouldResolveLink =
			contentType === 'link' && currentLinkUrl !== initialLinkUrlRef.current;

		if (!currentLabel || currentLabel.trim() === '') {
			setLinkResolutionError(__('The link label cannot be empty.', 'dynamic-table-blocks'));
			return;
		}

		if (shouldResolveLink) {
			setIsResolvingLink(true);
			setLinkResolutionError('');

			try {
				const { resolvedUrl } = await apiFetch({
					path: '/dynamic-table-blocks/v1/resolve-link',
					method: 'POST',
					data: {
						url: currentCellValueAttributes?.cannonical?.url || '',
					},
				});

				if (typeof resolvedUrl !== 'string' || !resolvedUrl) {
					throw new Error(
						__('The link resolver did not return a valid URL.', 'dynamic-table-blocks')
					);
				}

				updatedCellValueAttributes = {
					...currentCellValueAttributes,
					cannonical: {
						...currentCellValueAttributes?.cannonical,
						url: resolvedUrl,
					},
				};

				const label = updatedCellValueAttributes.cannonical?.label || '';

				updatedCellContent = updatedCellValueAttributes.cannonical?.newTab
					? '<a href="' +
						resolvedUrl +
						'" target="_blank" rel="noopener noreferrer">' +
						label +
						'</a>'
					: '<a href="' + resolvedUrl + '" target="_top">' + label + '</a>';
			} catch (error) {
				setLinkResolutionError(
					error?.message || __('We could not reach this web address.', 'dynamic-table-blocks')
				);
				return;
			} finally {
				setIsResolvingLink(false);
			}
		}

		updatedCell(
			event,
			'editedCellContent',
			tableId,
			cellId,
			updatedCellContent,
			updatedCellValueAttributes,
			updateCellClasses
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
										<VStack spacing={4}>
											{linkResolutionError && (
												<Notice status="error" isDismissible={false}>
													{linkResolutionError}
												</Notice>
											)}

											<TextControl
												// className={renderColumnClasses}
												type="text"
												inputMode="url"
												label="Link URL"
												placeholder="https://www.example.com"
												__next40pxDefaultSize
												value={currentCellValueAttributes?.cannonical?.url || ''}
												onChange={e => onUpdateCellValue(e, 'url')}
												help={linkResolutionError || undefined}
												aria-invalid={linkResolutionError ? 'true' : undefined}
											></TextControl>

											<TextControl
												// className={renderColumnClasses}
												type="text"
												label="Link Label"
												__next40pxDefaultSize
												value={currentCellValueAttributes?.cannonical?.label || ''}
												onChange={e => onUpdateCellValue(e, 'label')}
											></TextControl>

											<CheckboxControl
												// className="configure-column-modal__checkbox"
												label={'Open in new tab?'}
												checked={currentCellValueAttributes?.cannonical?.newTab || false}
												onChange={e => onUpdateCellValue(e, 'newTab')}
											/>
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
							{__('Cancel', 'dynamic-table-blocks')}
						</Button>

						<Button
							variant="primary"
							type="submit"
							isBusy={isResolvingLink}
							disabled={isResolvingLink}
						>
							{isResolvingLink
								? __('Verifying link…', 'dynamic-table-blocks')
								: __('Update', 'dynamic-table-blocks')}
						</Button>
					</div>
				</div>
			</form>
		</Modal>
	);
}

export const EditCellContentModal = memo(EditCellContent);
