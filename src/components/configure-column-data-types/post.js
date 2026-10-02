/* External dependencies */
import { useInstanceId } from '@wordpress/compose';
import { useLayoutEffect, useRef, useState, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	CheckboxControl,
	RadioControl,
	__experimentalVStack as VStack,
	Flex,
	FlexItem,
	Card,
	CardBody,
	CardHeader,
} from '@wordpress/components';
import {
	Card as NewCard,
	InputControl as NewInputControl,
	CheckboxControl as NewCheckboxControl,
	SelectControl as NewSelectControl,
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
	const { persistedPostFormat, columnClasses, onChange } = props;
	const instanceId = useInstanceId(ConfigurePostColumnDataType);
	const previewId = `dtbk-preview-${instanceId}`;

	const [postFormat, setPostFormat] = useState(persistedPostFormat?.format || '');
	const [postOptions, setPostOptions] = useState(persistedPostFormat?.formatOptions || '');

	const defaultDisplayElement = {
		display: false,
		column: 'none',
		order: 0,
	};

	console.log('Retrieved Column Data: ', persistedPostFormat);

	console.log(
		'Initial Post Display Element: ',
		sortPostDisplayElements(
			loadPostDisplayElements(persistedPostFormat.formatOptions, defaultDisplayElement)
		)
	);

	const initialPostDisplayElements = sortPostDisplayElements(
		loadPostDisplayElements(persistedPostFormat.formatOptions, defaultDisplayElement)
	);
	const [postDisplayElements, setPostDisplayElements] = useState(initialPostDisplayElements);

	const [postLinkLocation, setPostLinkLocation] = useState(
		persistedPostFormat.formatOptions?.linkLocation || 'title'
	);
	const [postTitleInCover, setPostTitleInCover] = useState(
		persistedPostFormat.formatOptions?.displayTitleInCover || false
	);

	const [postImageSize, setPostImageSize] = useState(
		persistedPostFormat.formatOptions?.displayImageSize || 'thumbnail'
	);

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

	if (!postFormat) setPostFormat('link');

	/**
	 * Update post format and set default options
	 *
	 * @since 1.4.11
	 *
	 * @param {string} postFormat Post format to set
	 */
	function onPostFormat(postFormat) {
		console.log('Setting Post Format');
		setPostFormat(postFormat);

		const { newDisplayElements, newDisplayOptions } = getPostFormatDefaults(
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
			loadPostDisplayElements(newDisplayElements, defaultDisplayElement)
		);

		setPostLinkLocation('title');
		setPostTitleInCover(false);
		setPostImageSize('thumbnail');
		setPostDisplayElements(resetDisplayElementsArray);

		const updatedDataType = {
			settings: {
				format: postFormat,
				formatOptions: newDisplayOptions,
			},
		};

		setPostOptions(newDisplayOptions);
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
		console.log('Setting Post Format Option: attribute = ' + option);
		console.log('Setting Post Format Option: value = ', value);

		const displayToObject = {};
		postDisplayElements.map(({ element, displayAttributes }) => {
			return (displayToObject[element] = displayAttributes);
		});
		console.log('Display Options Before Update = ', displayToObject);

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
				if (newDisplayCoverImage !== 0) {
					newTitleInCover = value;
				} else {
					newTitleInCover = false;
				}
				break;
			case 'link-location':
				if (newDisplayCoverImage !== 0) {
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

		console.log('Updated Post Display Element', newDisplayElements);

		const updateIsDisplayElement = newDisplayElements[updatedElement] || null;
		if (updateIsDisplayElement) {
			const updatedElementDisplay = newDisplayElements[updatedElement].display;
			const updatedElementOrder = newDisplayElements[updatedElement].order;
			const oldElementOrder = priorElement.order;

			console.log('Updated Element = ' + updatedElementOrder);
			console.log('Updated Element Prior Order = ' + oldElementOrder);

			// Close order gap when an element becomes not displayed
			if (updatedElementOrder !== oldElementOrder && updatedElementOrder === 0) {
				for (const element in newDisplayElements) {
					const elementOrder = newDisplayElements[element].order;
					const elementDisplay = newDisplayElements[element].display;
					if (elementDisplay && elementOrder > oldElementOrder && element !== updatedElement) {
						newDisplayElements[element].order = elementOrder - 1;
					}
				}
			}

			// Increment order order for elements when an element becomes goes down in order
			if (updatedElementDisplay && updatedElementOrder !== oldElementOrder) {
				for (const element in newDisplayElements) {
					const elementOrder = newDisplayElements[element].order;
					const elementDisplay = newDisplayElements[element].display;
					if (
						elementDisplay &&
						elementOrder === updatedElementOrder &&
						element !== updatedElement
					) {
						newDisplayElements[element].order = oldElementOrder;
					}
				}
			}
		}

		console.log('Updated Display Elements: ', newDisplayElements);
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
			setting: {
				format: postFormat,
				formatOptions: updatedFormatOptions,
			},
		};

		setPostOptions(updatedFormatOptions);
		updatePostConfig(updatedPostSettings);
	}

	function countFilteredDisplayItems(items, column) {
		const filteredItems = items.filter(
			el => el.displayAttributes.display && el.displayAttributes.column === column
		);
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

	// 		case 'post':
	// 			setDataTypeFormat('link');
	// 			onPostFormat('link');
	// 			newColumnClassNames.delete('grid-control__body-columns--number-align-right');
	// 			newColumnClassNames.delete('grid-control__body-columns--date-align-right');
	// 			setColumnClassNames(newColumnClassNames);
	// 			return;

	// 		columnDataType: dataType,
	// 		case 'post':
	// 			break;
	// 	}

	function updatePostConfig(updatedPostConfig) {
		onChange(updatedPostConfig);
	}

	const testCellContent = 'Test Content';
	const testCellAttributes = {
		canonical: {
			postId: 196,
			postType: 'post',
		},
		ref: [{ postId: '196' }],
	};
	const testCellClasses = '';
	const testCellContentType = {
		settings: {
			format: postFormat,
			formatOptions: postOptions,
		},
	};

	return (
		<Card>
			<CardHeader>
				<strong>Content settings</strong>
			</CardHeader>
			<CardBody>
				<VStack spacing={3}>
					<div>Select the specific content display options.</div>

					{/* True split layout */}
					<Flex gap={24} align="stretch" className="configure-column-modal__split">
						{/* Left column */}
						<FlexItem className="configure-column-modal__left" isBlock>
							<VStack spacing={3}>
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
									<div className="configure-column-modal__options">
										<strong>Formatting Options</strong>
										<NewCard.Root>
											<NewCard.Header>
												<NewCard.Title>Content Elements To Display</NewCard.Title>
											</NewCard.Header>
											<NewCard.Content>
												<table>
													<thead>
														<tr>
															<th>Element</th>
															<th>Display?</th>
															<th>Order</th>
															{postFormat === 'wide' && <th>Location</th>}
														</tr>
													</thead>
													<tbody>
														{postDisplayElements.map(
															({ elementName, updateOption, displayAttributes }) => {
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
											</NewCard.Content>
										</NewCard.Root>

										{(() => {
											const coverImage = postDisplayElements.find(
												({ element }) => element === 'displayCoverImage'
											);
											const title = postDisplayElements.find(
												({ element }) => element === 'displayTitle'
											);

											console.log('Cover Impage:', coverImage);
											console.log('Title:', title);

											return (
												coverImage.displayAttributes.display > 0 &&
												title.displayAttributes.display > 0 && (
													<CheckboxControl
														label={'Display title in Cover Image?'}
														checked={postTitleInCover}
														onChange={checked => onPostFormatOption(checked, 'title-in-cover')}
													/>
												)
											);
										})()}

										{(() => {
											const coverImage = postDisplayElements.find(
												({ element }) => element === 'displayCoverImage'
											);
											console.log('Cover Impage:', coverImage);

											return (
												coverImage.displayAttributes.display > 0 && (
													<>
														<RadioControl
															label="Link Location"
															selected={postLinkLocation}
															options={[
																{ label: 'Title', value: 'title' },
																{ label: 'Cover Image', value: 'image' },
															]}
															onChange={value => onPostFormatOption(value, 'link-location')}
														/>
														<NewSelectControl
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
									</div>
								)}
							</VStack>
						</FlexItem>

						{/* Right column */}
						<FlexItem className="configure-column-modal__right" isBlock>
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
											cellContentType={testCellContentType}
										/>
									</div>
								</BaseControl>
							</div>
						</FlexItem>
					</Flex>
				</VStack>
			</CardBody>
		</Card>
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

	// console.log('Items per column type = ', columnItemCount);
	// console.log('Items in column (' + elementName + ')= ' + maxDisplayItems(column, columnItemCount));

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
			<td>
				<CheckboxControl
					checked={display}
					onChange={checked => onPostDisplayUpdate(checked, updateOption, 'display')}
				/>
			</td>

			<td>
				{display ? (
					<NewInputControl
						label={elementName + ' ' + labelOrderSuffix}
						hideLabelFromVision
						min={1}
						step={1}
						max={maxDisplayItems(column, columnItemCount)}
						value={order || 1}
						onValueChange={value => onPostDisplayUpdate(value, updateOption, 'order')}
						type="number"
						size="compact"
						suffix={
							<NumberIncrementControl
								baseInteger={Number(order)}
								iconPair="arrow-up-down"
								reverseIcons
								onClick={value => onPostDisplayUpdate(value, updateOption, 'order')}
							/>
						}
					/>
				) : (
					__('n/a', 'dynamic-table-blocks')
				)}
			</td>
			<td>
				{postFormat === 'wide' && (
					<NewSelectControl
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

	const displayOptions = {
		...formatOptions,
		displayTitleInCover: false,
		displayImageSize: 'thumbnail',
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
