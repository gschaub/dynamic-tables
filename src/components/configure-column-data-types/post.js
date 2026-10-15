/* External dependencies */
import { useState } from '@wordpress/element';
import { escapeAttribute, escapeEditableHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';
import { Card, Stack, CheckboxControl, RadioGroupControl, SelectControl } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import './style.scss';
import { NumberIncrementControl } from '../ui/number-increment-control';
import { CellPostContent } from '../ui/post-content';
import { SelectPost } from '../select-post';

const wideColumnSplitItems = [
	{
		value: 'equal',
		label: 'Equal: 50% / 50%',
	},
	{
		value: 'left-third',
		label: 'Left 1/3 / Right 2/3',
	},
	{
		value: 'right-third',
		label: 'Left 2/3 / Right 1/3',
	},
	{
		value: 'fit-left',
		label: 'Fit Left Content / Fill Right',
	},
];

const postImageSizeItems = [
	{
		value: 'thumbnail',
		label: 'Thumbnail: (150 x 150)',
	},
	{
		value: 'medium',
		label: 'Medium: (300 x 300)',
	},
	{
		value: 'medium_large',
		label: 'Medium/Large (768 Wide)',
	},
	{
		value: 'large',
		label: 'Large (1024 x 1024)',
	},
];

const postDisplayColumnItems = [
	{ value: 'left', label: 'Left' },
	{ value: 'right', label: 'Right' },
	{ value: 'span', label: 'Span Columns' },
];

/**
 * React component to configure post formatting options for a column.
 *
 * @since    1.5.0
 *
 * @param {Object} props                    Components props
 * @param {Object} props.postSettings       Post format and disply options
 * @param {string} props.columnClasses      Classes that are specific to this column
 * @param {Object} props.columnPreviewWidth Cell content to render
 * @param {string} props.onChange
 * @return {Object} Updated column properties
 */
export function ConfigurePostColumnDataType(props = {}) {
	const { postSettings, columnClasses = '', columnPreviewWidth, onChange } = props;

	const { format: postFormat, formatOptions: postOptions } = postSettings || {};

	const initialPostDisplayElements = sortPostDisplayElements(
		loadPostDisplayElements(postOptions, defaultDisplayElement)
	);
	const [postDisplayElements, setPostDisplayElements] = useState(initialPostDisplayElements);

	const [postLinkLocation, setPostLinkLocation] = useState(postOptions?.linkLocation || 'title');
	const [postTitleInCover, setPostTitleInCover] = useState(
		postOptions?.displayTitleInCover || false
	);
	const [postImageSize, setPostImageSize] = useState(postOptions?.displayImageSize || 'thumbnail');
	const [postWideColumnSplit, setPostWideColumnSplit] = useState(
		postOptions?.wideColumnSplit ?? 'equal'
	);

	const [samplePost, setSamplePost] = useState(null);

	const initialPostItemsNoneColumnCount = countFilteredDisplayItems(
		initialPostDisplayElements,
		'none'
	);
	const initialPostItemsSpanColumnsCount = countFilteredDisplayItems(
		initialPostDisplayElements,
		'span'
	);
	const initialPostItemsLeftColumnCount = countFilteredDisplayItems(
		initialPostDisplayElements,
		'left'
	);
	const initialPostItemsRightColumnCount = countFilteredDisplayItems(
		initialPostDisplayElements,
		'right'
	);

	const [displayPostItemsNoneColumnCount, setPostDisplayItemsNoneColumnCount] = useState(
		initialPostItemsNoneColumnCount
	);
	const [displayPostItemsSpanColumnsCount, setPostDisplayItemsSpanColumnsCount] = useState(
		initialPostItemsSpanColumnsCount
	);
	const [displayPostItemsLeftColumnCount, setPostDisplayItemsLeftColumnCount] = useState(
		initialPostItemsLeftColumnCount
	);
	const [displayPostItemsRightColumnCount, setPostDisplayItemsRightColumnCount] = useState(
		initialPostItemsRightColumnCount
	);

	const postDisplayItemsPerColumn = {
		none: displayPostItemsNoneColumnCount,
		span: displayPostItemsSpanColumnsCount,
		left: displayPostItemsLeftColumnCount,
		right: displayPostItemsRightColumnCount,
	};

	/**
	 * Update post format and set default options
	 *
	 * @since 1.5.0
	 *
	 * @param {string} postFormat Post format to set
	 */
	function onPostFormat(postFormat) {
		const { displayOptions, displayElements } = getPostFormatDefaults(
			postFormat,
			defaultDisplayElement
		);

		switch (postFormat) {
			case 'link': {
				setPostDisplayItemsNoneColumnCount(1);
				setPostDisplayItemsSpanColumnsCount(0);
				setPostDisplayItemsLeftColumnCount(0);
				setPostDisplayItemsRightColumnCount(0);
				break;
			}
			case 'narrow': {
				setPostDisplayItemsNoneColumnCount(3);
				setPostDisplayItemsSpanColumnsCount(0);
				setPostDisplayItemsLeftColumnCount(0);
				setPostDisplayItemsRightColumnCount(0);
				break;
			}
			case 'wide': {
				setPostDisplayItemsNoneColumnCount(0);
				setPostDisplayItemsSpanColumnsCount(0);
				setPostDisplayItemsLeftColumnCount(2);
				setPostDisplayItemsRightColumnCount(1);
				break;
			}
			default:
				return;
		}

		const resetDisplayElementsArray = sortPostDisplayElements(
			loadPostDisplayElements(displayElements, defaultDisplayElement)
		);

		setPostLinkLocation('title');
		setPostTitleInCover(false);
		setPostImageSize('thumbnail');
		setPostWideColumnSplit('equal');
		setPostDisplayElements(resetDisplayElementsArray);

		const updatedDataType = {
			format: postFormat,
			formatOptions: displayOptions,
		};

		updatePostConfig(updatedDataType);
	}

	/**
	 * Update post formatting options based on configuration input
	 *
	 * @since 1.5.0
	 *
	 * @param {Object} value  Formatting value to set
	 * @param {string} option Formatting option
	 */
	function onPostFormatOption(value, option) {
		const displayToObject = {};
		postDisplayElements.forEach(({ element, displayAttributes }) => {
			displayToObject[element] = { ...displayAttributes };
		});

		let {
			displayTitle: newDisplayTitle,
			displayCoverImage: newDisplayCoverImage,
			displayExcerpt: newDisplayExcerpt,
			displayAuthor: newDisplayAuthor,
			displayPublishDate: newDisplayPublishDate,
			displayModifiedDate: newDisplayModifiedDate,
		} = displayToObject;

		let newLinkLocation = postLinkLocation;
		let newTitleInCover = postTitleInCover;
		let newImageSize = postImageSize;
		let newWideColumnSplit = postWideColumnSplit;

		let updatedElement;
		let priorElement;

		switch (option) {
			case 'display-title':
				updatedElement = 'displayTitle';
				priorElement = newDisplayTitle;
				newDisplayTitle = value;
				break;
			case 'display-image':
				updatedElement = 'displayCoverImage';
				priorElement = newDisplayCoverImage;
				newDisplayCoverImage = value;
				if (newDisplayCoverImage === 0) {
					newLinkLocation = 'title';
					newTitleInCover = false;
				}
				break;
			case 'display-excerpt':
				updatedElement = 'displayExcerpt';
				priorElement = newDisplayExcerpt;
				newDisplayExcerpt = value;
				break;
			case 'display-author':
				updatedElement = 'displayAuthor';
				priorElement = newDisplayAuthor;
				newDisplayAuthor = value;
				break;
			case 'display-published':
				updatedElement = 'displayPublishDate';
				priorElement = newDisplayPublishDate;
				newDisplayPublishDate = value;
				break;
			case 'display-modified':
				updatedElement = 'displayModifiedDate';
				priorElement = newDisplayModifiedDate;
				newDisplayModifiedDate = value;
				break;
			case 'title-in-cover':
				updatedElement = 'displayTitle';
				priorElement = newDisplayTitle;

				if (newDisplayCoverImage.display) {
					if (value) {
						newDisplayTitle = { display: true, column: 'none', order: 0 };
						newLinkLocation = 'image';
					} else {
						newDisplayTitle = {
							display: true,
							column: postFormat === 'narrow' ? 'none' : 'left',
							order: 1,
						};
					}
					newTitleInCover = value;
				} else {
					newTitleInCover = false;
				}
				break;
			case 'link-location':
				if (newDisplayCoverImage.display) {
					newLinkLocation = value;
				} else {
					newLinkLocation = 'title';
				}
				break;
			case 'image-size':
				newImageSize = value;
				break;
			case 'wide-column-split':
				newWideColumnSplit = value;
				break;
			default:
				return;
		}

		const newDisplayElements = {
			displayTitle: newDisplayTitle,
			displayCoverImage: newDisplayCoverImage,
			displayExcerpt: newDisplayExcerpt,
			displayAuthor: newDisplayAuthor,
			displayPublishDate: newDisplayPublishDate,
			displayModifiedDate: newDisplayModifiedDate,
		};

		const updatedDisplayElement = newDisplayElements[updatedElement] || null;
		if (updatedDisplayElement && priorElement) {
			const updatedElementDisplay = updatedDisplayElement.display;
			const updatedElementColumn = updatedDisplayElement.column;
			const updatedElementOrder = updatedDisplayElement.order;

			const oldElementDisplay = priorElement.display;
			const oldElementColumn = priorElement.column;
			const oldElementOrder = priorElement.order;

			/*
			 * Remove the changed element from its previous position. This closes
			 * the gap when it is hidden, moved to another column, or reordered
			 * within its current column.
			 */
			if (
				oldElementDisplay &&
				oldElementOrder > 0 &&
				(!updatedElementDisplay ||
					updatedElementColumn !== oldElementColumn ||
					updatedElementOrder !== oldElementOrder)
			) {
				for (const element in newDisplayElements) {
					const displayElement = newDisplayElements[element];

					if (
						element !== updatedElement &&
						displayElement.display &&
						displayElement.column === oldElementColumn &&
						displayElement.order > oldElementOrder
					) {
						displayElement.order -= 1;
					}
				}
			}

			/*
			 * Insert the changed element at its new ordered position. Elements
			 * already at or after that position move down to make room. An order
			 * of zero means the element is displayed outside the ordered flow.
			 */
			if (
				updatedElementDisplay &&
				updatedElementOrder > 0 &&
				(!oldElementDisplay ||
					updatedElementColumn !== oldElementColumn ||
					updatedElementOrder !== oldElementOrder)
			) {
				for (const element in newDisplayElements) {
					const displayElement = newDisplayElements[element];

					if (
						element !== updatedElement &&
						displayElement.display &&
						displayElement.column === updatedElementColumn &&
						displayElement.order >= updatedElementOrder
					) {
						displayElement.order += 1;
					}
				}
			}
		}

		const orderedDisplayAttributes = sortPostDisplayElements(
			loadPostDisplayElements(newDisplayElements, defaultDisplayElement)
		);
		setPostDisplayElements(orderedDisplayAttributes);

		setPostDisplayItemsNoneColumnCount(countFilteredDisplayItems(orderedDisplayAttributes, 'none'));
		setPostDisplayItemsSpanColumnsCount(
			countFilteredDisplayItems(orderedDisplayAttributes, 'span')
		);
		setPostDisplayItemsLeftColumnCount(countFilteredDisplayItems(orderedDisplayAttributes, 'left'));
		setPostDisplayItemsRightColumnCount(
			countFilteredDisplayItems(orderedDisplayAttributes, 'right')
		);

		setPostLinkLocation(newLinkLocation);
		setPostTitleInCover(newTitleInCover);
		setPostImageSize(newImageSize);
		setPostWideColumnSplit(newWideColumnSplit);

		const updatedFormatOptions = {
			displayTitle: newDisplayTitle,
			displayCoverImage: newDisplayCoverImage,
			displayExcerpt: newDisplayExcerpt,
			displayAuthor: newDisplayAuthor,
			displayPublishDate: newDisplayPublishDate,
			displayModifiedDate: newDisplayModifiedDate,
			displayTitleInCover: newTitleInCover,
			displayImageSize: newImageSize,
			wideColumnSplit: newWideColumnSplit,
			linkLocation: newLinkLocation,
		};

		const updatedPostSettings = {
			format: postFormat,
			formatOptions: updatedFormatOptions,
		};

		updatePostConfig(updatedPostSettings);
	}

	/**
	 * Count the number of items to be displayed for a specified formatted column
	 *
	 * @since 1.5.0
	 *
	 * @param {Array}  items  Post elements available for display
	 * @param {string} column Column for which items are to be counted
	 * @return {number} number of items to be displayed for the specified column
	 */
	function countFilteredDisplayItems(items, column) {
		const filteredItems = items.filter(el => {
			return (
				el.displayAttributes.display &&
				el.displayAttributes.order > 0 &&
				el.displayAttributes.column === column
			);
		});

		return filteredItems?.length || 0;
	}

	/**
	 * Converts the available post elements for display from an object to an array
	 *
	 * @since 1.5.0
	 *
	 * @param {Object} columnData     All post elements available for display
	 * @param {Object} defaultElement Default display element
	 * @return {Object[]}             Array of objects that define post elements
	 */
	function loadPostDisplayElements(columnData, defaultElement) {
		const displayElements = Array();

		displayElements.push({
			element: 'displayTitle',
			elementName: 'Title',
			updateOption: 'display-title',
			defaultOrder: 1,
			displayAttributes: columnData?.displayTitle || defaultElement,
		});

		displayElements.push({
			element: 'displayExcerpt',
			elementName: 'Excerpt',
			updateOption: 'display-excerpt',
			defaultOrder: 2,
			displayAttributes: columnData?.displayExcerpt || defaultElement,
		});

		displayElements.push({
			element: 'displayCoverImage',
			elementName: 'Cover Image',
			updateOption: 'display-image',
			defaultOrder: 3,
			displayAttributes: columnData?.displayCoverImage || defaultElement,
		});

		displayElements.push({
			element: 'displayAuthor',
			elementName: 'Author',
			updateOption: 'display-author',
			defaultOrder: 4,
			displayAttributes: columnData?.displayAuthor || defaultElement,
		});

		displayElements.push({
			element: 'displayPublishDate',
			elementName: 'Published Date',
			updateOption: 'display-published',
			defaultOrder: 5,
			displayAttributes: columnData?.displayPublishDate || defaultElement,
		});

		displayElements.push({
			element: 'displayModifiedDate',
			elementName: 'Last Modified Date',
			updateOption: 'display-modified',
			defaultOrder: 6,
			displayAttributes: columnData?.displayModifiedDate || defaultElement,
		});

		return displayElements;
	}

	/**
	 * Sorts elements for display by column and then order within the column
	 *
	 * @since 1.5.0
	 *
	 * @param {Object[]} displayElements Elements available for display
	 * @return {Object[]}} Sorted displayElements
	 */
	function sortPostDisplayElements(displayElements) {
		displayElements.sort((a, b) => {
			if (a.displayAttributes.display !== b.displayAttributes.display) {
				return a.displayAttributes.display ? -1 : 1;
			}

			if (!a.displayAttributes.display) {
				return a.defaultOrder - b.defaultOrder;
			}

			const columnCompare = a.displayAttributes.column.localeCompare(b.displayAttributes.column);
			return columnCompare || a.displayAttributes.order - b.displayAttributes.order;
		});
		return displayElements;
	}

	/**
	 * Return the column content format for the post column
	 *
	 * @since 1.5.0
	 *
	 * @param {Object} updatedPostConfig Updated post column format
	 */
	function updatePostConfig(updatedPostConfig) {
		onChange(updatedPostConfig);
	}

	/**
	 * Store the post selected by SelectPost.
	 *
	 * @since 1.5.0
	 *
	 * @param {Object|null} post Selected post or null.
	 */
	function onPostSelection(post) {
		setSamplePost(post);
	}

	const sampleCellContent = samplePost
		? '<a href="' +
			escapeAttribute(samplePost.url) +
			'">' +
			escapeEditableHTML(samplePost.title) +
			'</a>'
		: '';
	const sampleCellAttributes = {
		value: samplePost
			? {
					canonical: {
						postId: samplePost.postId,
						postType: samplePost.postType,
					},
					refs: [{ postId: samplePost.postId }],
					indexText: samplePost.title,
				}
			: {},
	};

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>
					<strong>Content settings</strong>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<div>Select the specific content display options.</div>
					<RadioGroupControl
						label="Post Layout"
						value={postFormat}
						items={[
							{ label: 'Link Only', value: 'link' },
							{ label: 'Wide', value: 'wide' },
							{ label: 'Narrow', value: 'narrow' },
						]}
						onValueChange={value => onPostFormat(value)}
					/>

					{/* True split layout */}
					<Stack direction="row" gap="md" align="stretch" className="configure-column-modal__split">
						{/* Left column */}
						<div className="configure-column-modal__left">
							<Stack direction="column" gap="sm">
								{postFormat !== 'link' && (
									<Stack direction="column" gap="md">
										<strong style={{ textAlign: 'center' }}>Formatting Options</strong>
										<Card.Root>
											<Card.Header>
												<Card.Title>Content Elements To Display</Card.Title>
											</Card.Header>
											<Card.Content>
												<table className="configure-column-modal__post-elements-table">
													<thead>
														<tr>
															<th style={{ textAlign: 'left' }}>Element</th>
															<th>Display?</th>
															<th>Order</th>
															{postFormat === 'wide' && <th>Location</th>}
														</tr>
													</thead>
													<tbody>
														{postDisplayElements.map(
															({ elementName, updateOption, displayAttributes }) => {
																if (postOptions?.displayTitleInCover) {
																	return (
																		updateOption !== 'display-title' && (
																			<DislpayPostElementRow
																				elementName={elementName}
																				displayElement={displayAttributes}
																				updateOption={updateOption}
																				postFormat={postFormat}
																				columnItemCount={postDisplayItemsPerColumn}
																				onChange={onPostFormatOption}
																			/>
																		)
																	);
																}
																return (
																	<DislpayPostElementRow
																		elementName={elementName}
																		displayElement={displayAttributes}
																		updateOption={updateOption}
																		postFormat={postFormat}
																		columnItemCount={postDisplayItemsPerColumn}
																		onChange={onPostFormatOption}
																	/>
																);
															}
														)}
													</tbody>
												</table>
											</Card.Content>
										</Card.Root>

										{postFormat === 'wide' && (
											<SelectControl
												label="Column Proportions"
												value={wideColumnSplitItems.find(
													({ value }) => value === postWideColumnSplit
												)}
												onValueChange={item => onPostFormatOption(item.value, 'wide-column-split')}
												items={wideColumnSplitItems}
											/>
										)}

										{(() => {
											const coverImage = postDisplayElements.find(
												({ element }) => element === 'displayCoverImage'
											);

											return (
												coverImage.displayAttributes.display && (
													<>
														<SelectControl
															label="Image Size"
															value={postImageSizeItems.find(
																({ value }) => value === postImageSize
															)}
															onValueChange={item => onPostFormatOption(item.value, 'image-size')}
															items={postImageSizeItems}
														/>
													</>
												)
											);
										})()}

										{(() => {
											const coverImage = postDisplayElements.find(
												({ element }) => element === 'displayCoverImage'
											);
											const title = postDisplayElements.find(
												({ element }) => element === 'displayTitle'
											);

											return (
												coverImage.displayAttributes.display &&
												title.displayAttributes.display && (
													<>
														<CheckboxControl
															label={'Display title in Cover Image?'}
															checked={postTitleInCover}
															onCheckedChange={checked =>
																onPostFormatOption(checked, 'title-in-cover')
															}
														/>

														{!postTitleInCover && (
															<RadioGroupControl
																label="Link Location"
																value={postLinkLocation}
																items={[
																	{ label: 'Title', value: 'title' },
																	{ label: 'Cover Image', value: 'image' },
																]}
																onValueChange={value => onPostFormatOption(value, 'link-location')}
															/>
														)}
													</>
												)
											);
										})()}
									</Stack>
								)}
							</Stack>
						</div>

						{/* Right column */}
						<div className="configure-column-modal__right">
							<Stack direction="column" gap="md">
								<strong style={{ textAlign: 'center' }}>Preview</strong>
								<Card.Root>
									<Card.Content>
										<div>Select Post To Preview</div>
										<SelectPost onChange={onPostSelection} />
									</Card.Content>
								</Card.Root>

								<Card.Root>
									<Card.Content>
										<div>Formatted Preview</div>
										<div
											className={
												'configure-column-modal__post-preview-cell ' +
												'grid-control__body-cells grid-control__cellEditor ' +
												columnClasses
											}
											style={{
												inlineSize: columnPreviewWidth ? `${columnPreviewWidth}px` : '100%',
											}}
										>
											{samplePost && (
												<CellPostContent
													cellContent={sampleCellContent}
													cellAttributes={sampleCellAttributes}
													cellClasses={columnClasses}
													contentType={postSettings}
												/>
											)}
											{!samplePost && (
												<p>
													<em style={{ alignText: 'center' }}>Select a post to preview</em>
												</p>
											)}
										</div>
									</Card.Content>
								</Card.Root>
							</Stack>
						</div>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * React component to support display configuration for a single post element
 *
 * @since 1.5.0
 *
 * @param {Object}   props
 * @param {string}   props.elementName     Description of post element
 * @param {Object}   props.displayElement  Element display configuration
 * @param {string}   props.updateOption    Handle for updates to display configuration
 * @param {string}   props.postFormat      Current post display format (link|narrow|wide)
 * @param {number}   props.columnItemCount Number of elements by location currently being displayed
 * @param {Function} props.onChange        Handles display configuration updates
 * @return {Element}                       Rendered table row
 */
function DislpayPostElementRow(props) {
	const { elementName, displayElement, updateOption, postFormat, columnItemCount, onChange } =
		props;
	const { display, order, column } = displayElement;
	const labelColumnSuffix = __('Display Column', 'dynamic-table-blocks');

	/**
	 * Current number of items to be displayed for the current column location
	 *
	 * @since 1.5.0
	 *
	 * @param {string} column          Column to which this display element belongs
	 * @param {Object} columnItemCount Total items to be displayed for all locations
	 * @return {number}                Number of items for display for the column
	 */
	function maxDisplayItems(column, columnItemCount) {
		if (column === 'none') return columnItemCount.none;
		if (column === 'span') return columnItemCount.span;
		if (column === 'left') return columnItemCount.left;
		if (column === 'right') return columnItemCount.right;
		return 0;
	}

	/**
	 * Apply configuration update selected by user
	 *
	 * @since 1.5.0
	 *
	 * @param {string|number|boolean} updatedValue         New value
	 * @param {string}                updatedDisplayOption Display element being updated
	 * @param {string}                updatedAttribute     Specific element attribute being updated
	 */
	function onPostDisplayUpdate(updatedValue, updatedDisplayOption, updatedAttribute) {
		let newDisplay = display;
		let newColumn = column;
		let newOrder = Number(order);

		switch (updatedAttribute) {
			case 'display': {
				newDisplay = updatedValue;
				if (updatedValue) {
					newColumn = postFormat === 'wide' ? 'left' : 'none';
					const itemCount = maxDisplayItems(newColumn, columnItemCount);
					newOrder = itemCount + 1;
				} else {
					newColumn = 'none';
					newOrder = 0;
				}
				break;
			}
			case 'column': {
				const itemCount = maxDisplayItems(updatedValue, columnItemCount);
				newColumn = updatedValue;
				newOrder = itemCount + 1;
				break;
			}
			case 'order': {
				const itemCount = maxDisplayItems(column, columnItemCount);
				if (Number(updatedValue) < 1 || Number(updatedValue) > itemCount) {
					return;
				}
				newOrder = Number(updatedValue);
				break;
			}
			default: {
				break;
			}
		}

		const updatedDisplayElement = {
			display: newDisplay,
			column: newColumn,
			order: newOrder,
		};
		onChange(updatedDisplayElement, updatedDisplayOption);
	}

	return (
		<tr>
			<td>{elementName}</td>
			<td style={{ verticalAlign: 'middle' }}>
				<Stack direction="row" align="center" justify="center">
					<CheckboxControl
						label={elementName}
						hideLabelFromVision
						checked={display}
						onCheckedChange={checked => onPostDisplayUpdate(checked, updateOption, 'display')}
					/>
				</Stack>
			</td>

			<td style={{ verticalAlign: 'middle' }}>
				<Stack direction="row" align="center" justify="center">
					{display ? (
						<NumberIncrementControl
							baseInteger={Number(order)}
							iconPair="arrow-up-down"
							reverseIcons
							wrapper="pill"
							onClick={value => onPostDisplayUpdate(value, updateOption, 'order')}
						/>
					) : (
						__('n/a', 'dynamic-table-blocks')
					)}
				</Stack>
			</td>
			<td style={{ verticalAlign: 'middle' }}>
				<Stack direction="row" align="center" justify="center">
					{postFormat === 'wide' &&
						(display ? (
							<SelectControl
								label={elementName + ' ' + labelColumnSuffix}
								size="compact"
								hideLabelFromVision
								value={postDisplayColumnItems.find(({ value }) => value === column)}
								onValueChange={item => onPostDisplayUpdate(item.value, updateOption, 'column')}
								items={postDisplayColumnItems}
							/>
						) : (
							__('n/a', 'dynamic-table-blocks')
						))}
				</Stack>
			</td>
		</tr>
	);
}

/**
 * Default post display elements and options for a given post format
 *
 * @since 1.5.0
 *
 * @param {string} postFormat            Format to default
 * @param {Object} defaultDisplayElement Default display element
 * @return {Object|null}                 Default post display configuration
 */
export function getPostFormatDefaults(postFormat, defaultDisplayElement) {
	let formatOptions;

	switch (postFormat) {
		case 'link': {
			formatOptions = {
				displayTitle: {
					...defaultDisplayElement,
					display: true,
					order: 1,
				},
				displayCoverImage: defaultDisplayElement,
				displayExcerpt: defaultDisplayElement,
				displayAuthor: defaultDisplayElement,
				displayPublishDate: defaultDisplayElement,
				displayModifiedDate: defaultDisplayElement,
			};
			break;
		}
		case 'narrow': {
			formatOptions = {
				displayTitle: {
					...defaultDisplayElement,
					display: true,
					order: 1,
				},
				displayCoverImage: {
					...defaultDisplayElement,
					order: 0,
				},
				displayExcerpt: {
					...defaultDisplayElement,
					display: true,
					order: 2,
				},
				displayAuthor: {
					...defaultDisplayElement,
					display: true,
					order: 3,
				},
				displayPublishDate: defaultDisplayElement,
				displayModifiedDate: defaultDisplayElement,
			};
			break;
		}
		case 'wide': {
			formatOptions = {
				displayTitle: {
					...defaultDisplayElement,
					display: true,
					column: 'left',
					order: 1,
				},
				displayCoverImage: {
					...defaultDisplayElement,
					order: 0,
				},
				displayExcerpt: {
					...defaultDisplayElement,
					display: true,
					column: 'left',
					order: 2,
				},
				displayAuthor: {
					...defaultDisplayElement,
					display: true,
					column: 'right',
					order: 1,
				},
				displayPublishDate: defaultDisplayElement,
				displayModifiedDate: defaultDisplayElement,
			};
			break;
		}
		default:
			return null;
	}

	const displayOptions = {
		...formatOptions,
		displayTitleInCover: false,
		displayImageSize: 'thumbnail',
		wideColumnSplit: 'equal',
		linkLocation: 'title',
	};

	const displayElements = {
		displayTitle: formatOptions.displayTitle,
		displayCoverImage: formatOptions.displayCoverImage,
		displayExcerpt: formatOptions.displayExcerpt,
		displayAuthor: formatOptions.displayAuthor,
		displayShortContent: formatOptions.displayShortContent,
		displayPublishDate: formatOptions.displayPublishDate,
		displayModifiedDate: formatOptions.displayModifiedDate,
	};

	return { displayOptions, displayElements };
}

/**
 * Default display element attributes for initialization
 *
 * @since 1.5.0
 */
export const defaultDisplayElement = {
	display: false,
	column: 'none',
	order: 0,
};
