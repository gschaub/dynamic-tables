/* External dependencies */
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BaseControl, RadioControl } from '@wordpress/components';
import {
	Card,
	Stack,
	InputControl as NewInputControl,
	CheckboxControl,
	SelectControl,
} from '@wordpress/ui';

/**
 * Internal dependencies
 */
import './style.scss';
import { NumberIncrementControl } from '../ui/number-increment-control';
import { CellPostContent } from '../ui/post-content';

/**
 * React component to configure data types for a column.
 *
 * @since    1.1.2
 *
 * @param {Object} props
 * @return {Object} Updated column properties
 */
export function ConfigurePostColumnDataType(props = {}) {
	const { postSettings, columnClasses, onChange } = props;
	const instanceId = useInstanceId(ConfigurePostColumnDataType);
	const previewId = `dtbk-preview-${instanceId}`;
	console.log('Initiial post format', postSettings);

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
	 * @since 1.4.11
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
	 * @since 1.4.11
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
			 * Insert the changed element at its new position. A newly displayed
			 * element or an element moved between columns arrives with the last
			 * available order, so no existing target-column elements are shifted
			 * in those cases. Reordering within a column shifts every element at
			 * or after the insertion point.
			 */

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

		const updatedFormatOptions = {
			displayTitle: newDisplayTitle,
			displayCoverImage: newDisplayCoverImage,
			displayExcerpt: newDisplayExcerpt,
			displayAuthor: newDisplayAuthor,
			displayPublishDate: newDisplayPublishDate,
			displayModifiedDate: newDisplayModifiedDate,
			displayTitleInCover: newTitleInCover,
			displayImageSize: newImageSize,
			linkLocation: newLinkLocation,
		};

		const updatedPostSettings = {
			format: postFormat,
			formatOptions: updatedFormatOptions,
		};

		updatePostConfig(updatedPostSettings);
	}

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

	function updatePostConfig(updatedPostConfig) {
		onChange(updatedPostConfig);
	}

	const testCellContent = 'Test Content';
	const testCellAttributes = {
		value: {
			canonical: {
				postId: 196,
				postType: 'post',
			},
			ref: [{ postId: '196' }],
		},
	};
	const testCellClasses = '';
	const testCellContentType = postSettings;

	console.log('Test Content Format', testCellContentType);

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

					{/* True split layout */}
					<Stack direction="row" gap="md" align="stretch">
						{/* Left column */}
						<div className="configure-column-modal__left">
							<Stack direction="column" gap="sm">
								<RadioControl
									label="Post Layout"
									selected={postFormat}
									options={[
										{ label: 'Link Only', value: 'link' },
										{ label: 'Wide', value: 'wide' },
										{ label: 'Narrow', value: 'narrow' },
									]}
									onChange={value => onPostFormat(value)}
								/>

								{postFormat !== 'link' && (
									<Stack direction="column" gap="md" className="configure-column-modal__options">
										<strong>Formatting Options</strong>
										<Card.Root>
											<Card.Header>
												<Card.Title>Content Elements To Display</Card.Title>
											</Card.Header>
											<Card.Content>
												<table>
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

										{(() => {
											const coverImage = postDisplayElements.find(
												({ element }) => element === 'displayCoverImage'
											);

											return (
												coverImage.displayAttributes.display && (
													<>
														<SelectControl
															label="Image Size"
															value={postImageSize}
															defaultValue="thumbnail"
															onValueChange={value => onPostFormatOption(value, 'image-size')}
															items={[
																{ value: 'thumbnail', label: 'Thumbnail: (150 x 150)' },
																{ value: 'medium', label: 'Medium: (300 x 300)' },
																{
																	value: 'medium_large',
																	label: 'Medium/Large (768 Wide)',
																},
																{ value: 'large', label: 'Large (1024 x 1024)' },
															]}
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

											// console.log('Cover Image:', coverImage);
											// console.log('Title:', title);

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
															<RadioControl
																label="Link Location"
																selected={postLinkLocation}
																options={[
																	{ label: 'Title', value: 'title' },
																	{ label: 'Cover Image', value: 'image' },
																]}
																onChange={value => onPostFormatOption(value, 'link-location')}
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
							<div style={{ display: 'flex', flexDirection: 'column' }}>
								<BaseControl
									id={previewId}
									label="Preview"
									style={{ alignContent: 'center', flexWrap: 'wrap', height: '20%' }}
								>
									<div>
										<div>Post Cell Preview</div>
										<CellPostContent
											cellContent={testCellContent}
											cellAttributes={testCellAttributes}
											cellClasses={testCellClasses}
											contentType={postSettings}
										/>
									</div>
								</BaseControl>
							</div>
						</div>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

function DislpayPostElementRow(props) {
	const { elementName, displayElement, updateOption, postFormat, columnItemCount, onChange } =
		props;
	const { display, order, column } = displayElement;
	const labelOrderSuffix = __('Display Order', 'dynamic-table-blocks');
	const labelColumnSuffix = __('Display Column', 'dynamic-table-blocks');

	function maxDisplayItems(column, columnItemCount) {
		if (column === 'none') return columnItemCount.none;
		if (column === 'span') return columnItemCount.span;
		if (column === 'left') return columnItemCount.left;
		if (column === 'right') return columnItemCount.right;
		return 0;
	}

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
				console.log('Upated column value: ', updatedValue);
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

		console.log('Changed Display Element ( ' + updatedDisplayOption + '): ', updatedDisplayElement);
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
						// <NewInputControl
						// 	label={elementName + ' ' + labelOrderSuffix}
						// 	hideLabelFromVision
						// 	min={1}
						// 	step={1}
						// 	max={maxDisplayItems(column, columnItemCount)}
						// 	value={order || 1}
						// 	onValueChange={value => onPostDisplayUpdate(value, updateOption, 'order')}
						// 	type="number"
						// 	size="compact"
						// 	suffix={
						<NumberIncrementControl
							baseInteger={Number(order)}
							iconPair="arrow-up-down"
							reverseIcons
							wrapper="pill"
							// showValue
							onClick={value => onPostDisplayUpdate(value, updateOption, 'order')}
						/>
					) : (
						__('n/a', 'dynamic-table-blocks')
					)}
				</Stack>
			</td>
			<td style={{ verticalAlign: 'middle' }}>
				<Stack direction="row" align="center" justify="center">
					{postFormat === 'wide' && (
						<SelectControl
							label={elementName + ' ' + labelColumnSuffix}
							hideLabelFromVision
							value={column || 'none'}
							onValueChange={value => onPostDisplayUpdate(value.value, updateOption, 'column')}
							items={[
								{
									value: 'left',
									label: 'Left',
								},
								{ value: 'right', label: 'Right' },
								{
									value: 'span',
									label: 'Span Columns',
								},
							]}
						/>
					)}
				</Stack>
			</td>
		</tr>
	);
}

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
			return;
	}

	console.log('New display format options: ', formatOptions);
	const displayOptions = {
		...formatOptions,
		displayTitleInCover: false,
		displayImageSize: 'thumbnail',
		linkLocation: 'title',
	};

	console.log('New extended display format options: ', displayOptions);

	const displayElements = {
		displayTitle: formatOptions.displayTitle,
		displayCoverImage: formatOptions.displayCoverImage,
		displayExcerpt: formatOptions.displayExcerpt,
		displayAuthor: formatOptions.displayAuthor,
		displayShortContent: formatOptions.displayShortContent,
		displayPublishDate: formatOptions.displayPublishDate,
		displayModifiedDate: formatOptions.displayModifiedDate,
	};

	console.log('New extended display elements: ', displayElements);

	return { displayOptions, displayElements };
}

export const defaultDisplayElement = {
	display: false,
	column: 'none',
	order: 0,
};
