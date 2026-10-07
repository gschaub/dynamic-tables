/* External dependencies */
import { useState, useRef, useEffect, memo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	Button,
	CheckboxControl,
	TextControl,
	ComboboxControl,
	Notice,
} from '@wordpress/components';
import { Card, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { lookupPost } from '../../get-external-data';
import { htmlToIndexText } from '../../utils';
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
 * Keep one combobox's state and requests together.
 *
 * @param {Object|Function|null} initialOption Initial selection or its initializer.
 * @return {Object} Independent combobox state and request handlers.
 */
function useComboboxState(initialOption = null) {
	const [selectedOption, setSelectedOption] = useState(initialOption);
	const [selectOptions, setSelectOptions] = useState([]);

	const selectedValue = selectedOption?.value ?? null;
	const comboboxOptions =
		selectedOption && !selectOptions.some(option => option.value === selectedValue)
			? [selectedOption, ...selectOptions]
			: selectOptions;

	const searchRequest = useLatestRequest();

	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState('');
	const selectionRequest = useLatestRequest();
	const [isLoading, setIsLoading] = useState(false);
	const [selectionError, setSelectionError] = useState('');

	return {
		selectedOption,
		setSelectedOption,
		selectedValue,
		comboboxOptions,
		selectOptions,
		setSelectOptions,
		searchRequest,
		isSearching,
		setIsSearching,
		searchError,
		setSearchError,
		selectionRequest,
		isLoading,
		setIsLoading,
		selectionError,
		setSelectionError,
	};
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
	const postCombobox = useComboboxState(() => getPostOption(currentCell.attributes));
	const {
		selectedOption: selectedPostOption,
		setSelectedOption: setSelectedPostOption,
		setSelectOptions: setPostSelectOptions,
	} = postCombobox;

	const {
		searchRequest: postSearchRequest,
		isSearching: isSearchingPosts,
		setIsSearching: setIsSearchingPosts,
		searchError: postSearchError,
		setSearchError: setPostSearchError,
	} = postCombobox;

	const {
		selectionRequest: postRequest,
		isLoading: isLoadingPost,
		setIsLoading: setIsLoadingPost,
		selectionError: postError,
		setSelectionError: setPostError,
	} = postCombobox;

	const selectedPostId = postCombobox.selectedValue;
	const postComboboxOptions = postCombobox.comboboxOptions;

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
		postSearchRequest.cancel();
		postRequest.cancel();
		saveRequest.cancel();
		onRequestClose?.();
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
	 * Retrieve a WordPress post.
	 *
	 * @since    1.4.10
	 *
	 * @param {string|null} value onChange event from post selection
	 */
	async function onPostSelection(value) {
		if (saveRequest.ref.current) return;
		postSearchRequest.cancel();
		postRequest.cancel();
		setIsSearchingPosts(false);
		setIsLoadingPost(false);
		setPostSearchError('');
		setPostError('');
		setSaveError('');

		if (value === null || value === '') {
			setSelectedPostOption(null);
			setPostSelectOptions([]);
			updateCellValue('post', null);
			return;
		}

		const option = postComboboxOptions.find(item => item.value === String(value) && !item.disabled);
		if (!option) {
			setPostError(__('Choose a post from the search results.', 'dynamic-table-blocks'));
			return;
		}

		setSelectedPostOption(option);
		const request = postRequest.begin();
		setIsLoadingPost(true);

		try {
			const fetchedPost = await lookupPost(option.value, {
				postType: option.postType,
				signal: request.signal,
			});

			if (!postRequest.isCurrent(request)) return;

			const post = {
				postId: Number(fetchedPost.id),
				postType: fetchedPost.type,
				title: htmlToIndexText(fetchedPost.title.rendered),
				url: fetchedPost.link,
				author: fetchedPost.author,
			};

			if (!isWebUrl(post.url)) {
				throw new Error(__('The post has an invalid web address.', 'dynamic-table-blocks'));
			}

			const nextOption = {
				value: String(post.postId),
				label: post.title || __('No title found', 'dynamic-table-blocks'),
				postType: post.postType,
				title: post.title,
				url: post.url,
			};

			setSelectedPostOption(nextOption);
			updateCellValue('post', post);

			setPostSelectOptions(previous =>
				previous.map(item => (item.value === nextOption.value ? nextOption : item))
			);
		} catch (error) {
			if (postRequest.isCurrent(request)) {
				setPostError(
					error?.message ||
						__('The post could not be loaded. Select it again to retry.', 'dynamic-table-blocks')
				);
			}
		} finally {
			if (postRequest.finish(request)) setIsLoadingPost(false);
		}
	}

	/**
	 * Update whether the post link opens in a new tab.
	 *
	 * @since    1.4.10
	 *
	 * @param {boolean} value Whether to open in a new tab.
	 */
	function onPostNewTabSelection(value) {
		if (saveRequest.ref.current) {
			return;
		}
		updateCellValue('newTab', value);
	}

	/**
	 * Query WordPress Posts.
	 *
	 * @since    1.4.10
	 *
	 * @param {string} value Text on which to search
	 */
	async function onPostSearch(value) {
		if (saveRequest.ref.current) return;
		postSearchRequest.cancel();
		setIsSearchingPosts(false);
		setPostSearchError('');
		const searchTerm = String(value ?? '').trim();
		const noResults = [
			{
				value: '',
				label: __('No matching content found or search term is too short.', 'dynamic-table-blocks'),
				disabled: true,
			},
		];

		if (!searchTerm && selectedPostOption) {
			setPostSelectOptions([]);
			return;
		}

		if (searchTerm.length < 3) {
			setPostSelectOptions(noResults);
			return;
		}

		const request = postSearchRequest.begin();
		setIsSearchingPosts(true);
		try {
			const posts = await apiFetch({
				path: '/wp/v2/search?type=post&search=' + encodeURIComponent(searchTerm),
				signal: request.signal,
			});

			if (!postSearchRequest.isCurrent(request)) return;
			if (!Array.isArray(posts)) {
				throw new Error(__('The search response was invalid.', 'dynamic-table-blocks'));
			}

			const options = posts
				.filter(
					post =>
						Number.isSafeInteger(Number(post.id)) &&
						Number(post.id) > 0 &&
						typeof post.subtype === 'string'
				)
				.map(post => ({
					value: String(post.id),
					label: htmlToIndexText(post.title || '') || __('No title found', 'dynamic-table-blocks'),
					postType: post.subtype,
				}));

			setPostSelectOptions(options.length ? options : noResults);
		} catch (error) {
			if (postSearchRequest.isCurrent(request)) {
				setPostSelectOptions([]);
				setPostSearchError(
					error?.message || __('The search failed. Try again.', 'dynamic-table-blocks')
				);
			}
		} finally {
			if (postSearchRequest.finish(request)) setIsSearchingPosts(false);
		}
	}

	/**
	 * Return new cell content and value attributes.
	 *
	 * @since    1.4.6
	 * @since    1.4.10 - Add support for post contentType
	 *
	 * @param {Object} event Form submit
	 */
	async function onUpdate(event) {
		event?.preventDefault?.();

		if (saveRequest.ref.current || postRequest.ref.current) return;
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
				const committedOption = getPostOption(attributes);
				if (!selectedPostOption || postError || committedOption?.value !== selectedPostId) {
					setPostError(
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

		postSearchRequest.cancel();
		setIsSearchingPosts(false);
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
												{(postError || postSearchError) && (
													<Notice status="error" isDismissible={false}>
														{postError || postSearchError}
													</Notice>
												)}

												<ComboboxControl
													label={__('Content Title', 'dynamic-table-blocks')}
													placeholder={__('Search WordPress content', 'dynamic-table-blocks')}
													help={__('Type at least 3 characters to search.', 'dynamic-table-blocks')}
													isLoading={isSearchingPosts || isLoadingPost}
													options={postComboboxOptions}
													value={selectedPostId}
													expandOnFocus={false}
													onFilterValueChange={onPostSearch}
													onChange={onPostSelection}
												/>

												<CheckboxControl
													label={__('Open in new tab?', 'dynamic-table-blocks')}
													checked={newTab}
													disabled={isLoadingPost || Boolean(postError)}
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
