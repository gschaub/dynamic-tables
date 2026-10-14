/* External dependencies */
import { useState, useRef, useEffect, memo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Modal, Button, CheckboxControl, TextControl, Notice } from '@wordpress/components';
import { Card, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { SelectPost } from '../select-post';
import {
	normalizeCellValueAttributes,
	getPostOption,
	getNewTab,
	getCellLinkUrl,
	buildCellContent,
	isWebUrl,
	setPostDetails,
	removePostDetails,
} from './value';

import './style.scss';
import '../../editor.scss';

/**
 * Keep only the last edit request.
 *
 * @since    1.4.10
 *
 * @description Keep only the latest request active and abort it when the modal unmounts.
 */
function useLatestRequest() {
	const ref = useRef(null);
	useEffect(
		() => () => {
			ref.current?.abort();
			ref.current = null;
		},
		[]
	);
	const cancel = () => {
		ref.current?.abort();
		ref.current = null;
	};
	const begin = () => {
		cancel();
		const requestHandler = new AbortController();
		ref.current = requestHandler;
		return requestHandler;
	};
	const isCurrent = requestHandler =>
		ref.current === requestHandler && !requestHandler.signal.aborted;
	const finish = requestHandler => {
		if (!isCurrent(requestHandler)) return false;
		ref.current = null;
		return true;
	};
	return { ref, begin, cancel, isCurrent, finish };
}

/**
 * React component to edit multi-part cell content.
 *
 * @since    1.4.6
 * @since    1.4.10  Added support for post data type.
 *
 * @param {Object} props
 * @return {Object} Updated cell content and its related value attributes
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

	const { type: contentType, settings } = cellContentType;
	const { format: contentFormat } = settings?.format || '';
	const columnOptions = settings?.formatOptions || {};

	const [currentCell, setCurrentCell] = useState(() => ({
		content: cellContent || '',
		attributes: normalizeCellValueAttributes(cellAttributes, cellContent, contentType),
	}));
	const { attributes: currentCellValueAttributes } = currentCell;
	const [currentCellClasses, setCurrentCellClasses] = useState(cellClasses);
	const newTab = getNewTab(currentCellValueAttributes, columnOptions);

	// Save management for async operations
	const saveRequest = useLatestRequest();
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState('');

	// link spectific configuration
	const initialLinkUrlRef = useRef(String(currentCellValueAttributes?.canonical?.url || '').trim());

	const [linkErrors, setLinkErrors] = useState({});

	// post state
	const [postSelectionStatus, setPostSelectionStatus] = useState(() => ({
		isLoading: false,
		isValid: Boolean(getPostOption(currentCell.attributes)),
	}));
	const { isLoading: isLoadingPost, isValid: isPostSelectionValid } = postSelectionStatus;

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
	 * Close modal on cancel.
	 *
	 * @since    1.4.6
	 * @since    1.4.10 Update to support aborts
	 */
	function handleCancel() {
		saveRequest.cancel();
		onRequestClose?.();
	}

	/**
	 * Store the post selected by SelectPost.
	 *
	 * @param {Object|null} post Selected post or null.
	 */
	function onPostSelection(post) {
		if (saveRequest.ref.current) return;
		updateCellValue('post', post);
	}

	/**
	 * Update whether the post link opens in a new tab.
	 *
	 * @param {boolean} value Whether to open in a new tab.
	 */
	function onPostNewTabSelection(value) {
		if (saveRequest.ref.current) return;
		updateCellValue('newTab', value);
	}

	/**
	 * Update cell value.
	 *
	 * @since  1.4.10
	 *
	 * @param {string}                     attribute Attribute to update.
	 * @param {string|boolean|Object|null} value     Value to update; null clears a post selection.
	 */
	function updateCellValue(attribute, value) {
		if (saveRequest.ref.current) return;
		setSaveError('');
		if (contentType === 'link') {
			setLinkErrors(previous => ({ ...previous, [attribute]: '' }));
		}

		setCurrentCell(previous => {
			let attributes = previous.attributes;
			let postUrl;
			switch (contentType) {
				case 'link': {
					switch (attribute) {
						case 'url': {
							attributes = {
								...attributes,
								canonical: { ...attributes.canonical, url: value },
							};
							break;
						}
						case 'label': {
							attributes = {
								...attributes,
								canonical: { ...attributes.canonical, label: value },
								indexText: value,
							};
							break;
						}
						case 'newTab': {
							attributes = {
								...attributes,
								options: { ...attributes.options, newTab: Boolean(value) },
							};
							break;
						}
						default: {
							return previous;
						}
					}
					break;
				}
				case 'post': {
					switch (attribute) {
						case 'post': {
							if (value === null) {
								attributes = removePostDetails(attributes);
							} else {
								attributes = setPostDetails(attributes, value);
								postUrl = value.url;
							}
							break;
						}
						case 'newTab': {
							postUrl = getCellLinkUrl(previous.content);
							attributes = {
								...attributes,
								options: { ...attributes.options, newTab: Boolean(value) },
							};
							break;
						}
						default: {
							return previous;
						}
					}
					break;
				}
				default: {
					return previous;
				}
			}

			return {
				attributes,
				content: buildCellContent(contentType, attributes, columnOptions, postUrl),
			};
		});
	}

	/**
	 * Return new cell content and value attributes.
	 *
	 * @since    1.4.6
	 * @since    1.5.0 - Add support for post contentType
	 *
	 * @param {Object} event Form submit
	 */
	async function onUpdate(event) {
		event?.preventDefault?.();

		if (saveRequest.ref.current || isLoadingPost) return;
		setSaveError('');

		let attributes = currentCell.attributes;
		let postUrl;

		// Validate link content type before saving
		switch (contentType) {
			case 'link': {
				const errors = {};

				if (!String(attributes.canonical.label || '').trim()) {
					errors.label = __('The link label cannot be empty.', 'dynamic-table-blocks');
				}

				if (!isWebUrl(attributes.canonical.url)) {
					errors.url = __('Enter a valid web address.', 'dynamic-table-blocks');
				}
				setLinkErrors(errors);
				if (Object.keys(errors).length) return;
				break;
			}

			// Validate post content type before saving
			case 'post': {
				if (!isPostSelectionValid || !getPostOption(attributes)) {
					setSaveError(
						__('Select a post and wait for it to load before updating.', 'dynamic-table-blocks')
					);
					return;
				}
				break;
			}

			default: {
				setSaveError(__('This content type cannot be edited here.', 'dynamic-table-blocks'));
				return;
			}
		}

		const request = saveRequest.begin();
		setIsSaving(true);

		try {
			switch (contentType) {
				case 'link': {
					const url = String(attributes.canonical.url).trim();
					let resolvedUrl = url;

					if (url !== initialLinkUrlRef.current) {
						const result = await apiFetch({
							path: '/dynamic-table-blocks/v1/resolve-link',
							method: 'POST',
							data: { url },
							signal: request.signal,
						});

						if (!saveRequest.isCurrent(request)) return;
						resolvedUrl = result?.resolvedUrl;
					}

					if (!isWebUrl(resolvedUrl)) {
						throw new Error(__('The resolved web address was invalid.', 'dynamic-table-blocks'));
					}

					attributes = {
						...attributes,
						canonical: { ...attributes.canonical, url: resolvedUrl },
						indexText: String(attributes.canonical.label || ''),
					};
					break;
				}

				case 'post': {
					postUrl = getCellLinkUrl(currentCell.content);
					break;
				}
			}

			if (!saveRequest.isCurrent(request)) return;
			const content = buildCellContent(contentType, attributes, columnOptions, postUrl);

			// Omit empty attributes when writing the cell back.
			const savedAttributes = { ...attributes };

			if (savedAttributes.refs.length === 0) {
				delete savedAttributes.refs;
			}

			if (Object.keys(savedAttributes.meta).length === 0) {
				delete savedAttributes.meta;
			}

			if (Object.keys(savedAttributes.options).length === 0) {
				delete savedAttributes.options;
			}

			updatedCell(
				event,
				'editedCellContent',
				tableId,
				cellId,
				content,
				savedAttributes,
				currentCellClasses
			);

			if (saveRequest.isCurrent(request)) handleCancel();
		} catch (error) {
			if (saveRequest.isCurrent(request)) {
				setSaveError(
					error?.message || __('The cell could not be updated. Try again.', 'dynamic-table-blocks')
				);
			}
		} finally {
			if (saveRequest.finish(request)) setIsSaving(false);
		}
	}

	let updateLabel = __('Update', 'dynamic-table-blocks');
	if (isSaving) updateLabel = __('Saving…', 'dynamic-table-blocks');
	else if (isLoadingPost) updateLabel = __('Loading post…', 'dynamic-table-blocks');

	return (
		<Modal
			title={__('Edit Cell Content', 'dynamic-table-blocks')}
			onRequestClose={handleCancel}
			focusOnMount="firstContentElement"
			isDismissible={false}
			shouldCloseOnClickOutside={false}
			size="large"
		>
			<form className="blocks-table__placeholder-form" onSubmit={onUpdate} onMouseDown={stopProp}>
				{saveError && (
					<Notice status="error" isDismissible={false}>
						{saveError}
					</Notice>
				)}
				<fieldset
					disabled={isSaving}
					className="dtbk-adv-edit-content-fields"
					aria-label={__('Cell content settings', 'dynamic-table-blocks')}
				>
					{/* Scrollable body */}
					<div className="configure-column-modal__body">
						<div className="configure-column-modal__body-inner">
							<Stack gap="sm">
								{/* Cell Content Type */}
								{contentType === 'link' && (
									<Card.Root className="dtbk-adv-edit-content-settings-field-layout dtbk-adv-edit-content-settings-full-width">
										<Card.Header>
											<Card.Title>
												<strong>{__('Content settings', 'dynamic-table-blocks')}</strong>
											</Card.Title>
										</Card.Header>
										<Card.Content>
											<Stack direction="column" gap="lg">
												<TextControl
													type="text"
													inputMode="url"
													label={__('Link URL', 'dynamic-table-blocks')}
													placeholder="https://www.example.com"
													value={currentCellValueAttributes?.canonical?.url || ''}
													onChange={value => updateCellValue('url', value)}
													help={linkErrors.url || undefined}
													aria-invalid={linkErrors.url ? 'true' : undefined}
												/>

												<TextControl
													type="text"
													label={__('Link Label', 'dynamic-table-blocks')}
													value={currentCellValueAttributes?.canonical?.label || ''}
													onChange={value => updateCellValue('label', value)}
													help={linkErrors.label || undefined}
													aria-invalid={linkErrors.label ? 'true' : undefined}
												/>

												<CheckboxControl
													label={__('Open in new tab?', 'dynamic-table-blocks')}
													checked={newTab}
													onChange={value => updateCellValue('newTab', value)}
												/>
											</Stack>
										</Card.Content>
									</Card.Root>
								)}

								{contentType === 'post' && (
									<Card.Root className="dtbk-adv-edit-content-settings-field-layout dtbk-adv-edit-content-settings-full-width">
										<Card.Header>
											<Card.Title>
												<strong>{__('Content settings', 'dynamic-table-blocks')}</strong>
											</Card.Title>
										</Card.Header>
										<Card.Content>
											<Stack direction="column" gap="lg">
												<SelectPost
													initialPost={{
														postId: currentCellValueAttributes?.canonical?.postId,
														postType: currentCellValueAttributes?.canonical?.postType,
														title: currentCellValueAttributes?.indexText,
													}}
													disabled={isSaving}
													onChange={onPostSelection}
													onStatusChange={setPostSelectionStatus}
												/>

												<CheckboxControl
													label={__('Open in new tab?', 'dynamic-table-blocks')}
													checked={newTab}
													disabled={isLoadingPost || !isPostSelectionValid}
													onChange={onPostNewTabSelection}
												/>
											</Stack>
										</Card.Content>
									</Card.Root>
								)}
							</Stack>
						</div>
					</div>
				</fieldset>

				{/* Sticky footer */}
				<div className="configure-column-modal__footer">
					<div className="configure-column-modal__button-group">
						<Button variant="secondary" type="button" onClick={handleCancel}>
							{__('Cancel', 'dynamic-table-blocks')}
						</Button>

						<Button
							variant="primary"
							type="submit"
							isBusy={isSaving || isLoadingPost}
							disabled={isSaving || isLoadingPost}
						>
							{updateLabel}
						</Button>
					</div>
				</div>
			</form>
		</Modal>
	);
}

export const EditCellContentModal = memo(EditCellContent);
