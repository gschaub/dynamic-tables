/* External dependencies */
import apiFetch from '@wordpress/api-fetch';
import { useInstanceId } from '@wordpress/compose';
import { useLayoutEffect, useRef, useState, memo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	Button,
	CheckboxControl,
	TextControl,
	ComboboxControl,
	Notice,
} from '@wordpress/components';
import { Card, Stack, InputControl, InputLayout, IconButton } from '@wordpress/ui';

import clsx from 'clsx';

/**
 * Internal dependencies
 */
import './style.scss';
import '../../editor.scss';

/**
 * React component to configure data types for a column.
 *
 * @since    1.4.6
 * @since    1.4.6  Added support for post data type.
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
	const [selectOptions, setSelectOptions] = useState([]);
	const [isSearching, setIsSearching] = useState(false);

	const [selectedPostId, setSelectedPostId] = useState(
		cellAttributes?.cannonical?.postId ? String(cellAttributes.cannonical.postId) : null
	);

	const [selectedPost, setSelectedPost] = useState({
		postId: cellAttributes?.cannonical?.postId ? String(cellAttributes.cannonical.postId) : 0,
		postType: cellAttributes?.cannonical?.postId ? String(cellAttributes.cannonical.postType) : 0,
		title: cellAttributes?.indexText || '',
		url: cellContent || '',
	});

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

	function updateCellValue(attribute, value) {
		let content = currentCellContent;
		let attributes = currentCellValueAttributes;

		switch (contentType) {
			case 'link':
				if (!attributes) {
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
								url: value,
							},
							indexText: attributes?.indexText || '',
						};
						break;
					case 'label':
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								label: value,
							},
							indexText: value,
						};
						break;
					case 'newTab':
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								newTab: value,
							},
							indexText: attributes?.indexText || '',
						};
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
			case 'post':
				if (!attributes) {
					attributes = {
						cannonical: {
							postId: 0,
							postType: '',
						},
						refs: [
							{
								postId: 0,
							},
						],
						indexText: '',
					};
				}

				switch (attribute) {
					case 'postId':
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								postId: value,
							},
							refs: [
								{
									postId: value,
								},
							],
							indexText: attributes?.indexText || '',
						};
						break;
					case 'postType':
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								postType: value || '',
							},
							refs: attributes?.refs || [{}],
							indexText: attributes?.indexText || '',
						};
						break;
					case 'title':
						attributes = {
							...attributes,
							refs: attributes?.refs || [{}],
							indexText: value || '',
						};
						break;
					case 'newTab':
						attributes = {
							...attributes,
							cannonical: {
								...attributes?.cannonical,
								newTab: value,
							},
							indexText: attributes?.indexText || '',
						};
						break;
					default:
						break;
				}
				const postTitle = attributes.indexText || '';

				content = postTitle;

				// if (attributes.cannonical?.newTab) {
				// 	content =
				// 		'<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
				// } else {
				// 	content = '<a href="' + url + '" target="_top">' + label + '</a>';
				// }
				break;
			default:
				break;
		}

		setCurrentCellContent(content);
		setCurrentCellValueAttributes(attributes);
	}

	function onUpdateCellValue(event, attribute) {
		const value = event;
		updateCellValue(attribute, value);
	}

	/**
	 * Retrieve a WordPress post.
	 *
	 * @since    1.4.10
	 *
	 * @param {Object} event onChange event from post selection
	 */
	async function onPostSelection(event) {
		event?.preventDefault?.();
		console.log('onPostSelection event:', event);

		const postId = event;
		if (postId) {
			setIsSearching(true);
			try {
				const post = await lookupPost(postId);
				console.log('...post details:', post);

				const selectedPostDetails = {
					postId: postId,
					postType: post.postType,
					title: post.title,
					url: post.url,
				};
				console.log('selected post details:', selectedPostDetails);
				setSelectedPostId(postId);
				setSelectedPost(selectedPostDetails);

				updateCellValue('postId', postId);
				updateCellValue('postType', post.postType);
				updateCellValue('title', post.title);
			} finally {
				setIsSearching(false);
			}
		}
	}

	/**
	 * Retrieve a WordPress post.
	 *
	 * @since    1.4.10
	 *
	 * @param {string} postId Text on which to search
	 */
	async function lookupPost(postId) {
		const post = await apiFetch({
			path: `/wp/v2/posts/${postId}`,
			method: 'GET',
		});

		const title = decodeEntities(post.title.rendered);
		const url = post.link;
		const postType = post.type;
		const author = post.author;

		return {
			postId: postId,
			postType: postType,
			title: title,
			url: url,
			author: author,
		};
	}

	/**
	 * Query WordPress Posts.
	 *
	 * @since    1.4.10
	 *
	 * @param {string} value Text on which to search
	 */
	async function onPostSearch(value) {
		value?.preventDefault?.();
		const noResults = [
			{
				value: '',
				label: 'No matching content found or search term is too short.',
			},
		];

		if (value.trim(' ').length < 3) {
			setSelectOptions(noResults);
			return;
		}

		setIsSearching(true);
		try {
			const basePath = '/wp/v2/search';
			const seacrhTitle = value;

			const posts = await apiFetch({
				path: basePath + '?type=post&search=' + encodeURIComponent(seacrhTitle),
				method: 'GET',
			});

			let postsList = [];
			if (posts && Array.isArray(posts)) {
				postsList = posts.map(post => ({
					id: post.id,
					title: decodeEntities(post.title),
					url: post.url,
				}));
			}

			let selectOptionResults = noResults;

			if (postsList.length > 0) {
				selectOptionResults = postsList.map(post => ({
					value: String(post.id),
					label: post.title,
				}));
			}

			setSelectOptions(selectOptionResults);
		} finally {
			setIsSearching(false);
		}
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

		if (contentType === 'link') {
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

	console.log('selected postId = ', selectedPostId);
	console.log('selected post:', selectedPost);

	return (
		<Modal
			title="Edit Cell Content"
			onRequestClose={handleCancel}
			focusOnMount="firstContentElement"
			isDismissible={false}
			shouldCloseOnClickOutside={false}
			size="large"
		>
			<form className="blocks-table__placeholder-form" onSubmit={onUpdate} onMouseDown={stopProp}>
				{/* Scrollable body */}
				<div className="configure-column-modal__body">
					<div className="configure-column-modal__body-inner">
						<Stack gap="sm">
							{/* Cell Content Type */}
							{cellContentType.type === 'link' && (
								<Card.Root className="dtbk-adv-edit-content-settings-field-layout dtbk-adv-edit-content-settings-full-width">
									<Card.Header>
										<Card.Title>
											<strong>Content settings</strong>
										</Card.Title>
									</Card.Header>
									<Card.Content>
										<Stack direction="column" gap="lg">
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
												value={currentCellValueAttributes?.cannonical?.url || ''}
												onChange={e => onUpdateCellValue(e, 'url')}
												help={linkResolutionError || undefined}
												aria-invalid={linkResolutionError ? 'true' : undefined}
											></TextControl>

											<TextControl
												// className={renderColumnClasses}
												type="text"
												label="Link Label"
												value={currentCellValueAttributes?.cannonical?.label || ''}
												onChange={e => onUpdateCellValue(e, 'label')}
											></TextControl>

											<CheckboxControl
												// className="configure-column-modal__checkbox"
												label={'Open in new tab?'}
												checked={currentCellValueAttributes?.cannonical?.newTab || false}
												onChange={e => onUpdateCellValue(e, 'newTab')}
											/>
										</Stack>
									</Card.Content>
								</Card.Root>
							)}

							{cellContentType.type === 'post' && (
								<Card.Root className="dtbk-adv-edit-content-settings-field-layout dtbk-adv-edit-content-settings-full-width">
									<Card.Header>
										<Card.Title>
											<strong>Content settings</strong>
										</Card.Title>
									</Card.Header>
									<Card.Content>
										<Stack direction="column" gap="lg">
											<ComboboxControl
												label={__('Content Title', 'dynamic-table-blocks')}
												placeholder="New WordPress Content"
												required
												isLoading={isSearching}
												options={selectOptions}
												value={selectedPostId}
												size="compact"
												onFilterValueChange={value => onPostSearch(value)}
												onChange={event => onPostSelection(event)}
											/>

											<CheckboxControl
												label={'Open in new tab?'}
												checked={currentCellValueAttributes?.cannonical?.newTab || false}
												onChange={e => onUpdateCellValue(e, 'newTab')}
											/>
										</Stack>
									</Card.Content>
								</Card.Root>
							)}
						</Stack>
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
