/* External dependencies */
import { useState, useEffect, memo, RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { lookupPost, lookupPostImage, lookupPostAuthor } from '../../../get-external-data';
import { isEmptyObject, formatedDisplayDate, htmlToIndexText } from '../../../utils';
import { getPostStatistics } from './post-statistics';
import {
	normalizeCellValueAttributes,
	getCellLinkUrl,
	isWebUrl,
} from '../../cell-advanced-edit-modal/value';

import '../../../editor.scss';
import '../../../style.scss';

/**
 * Render formatted post content in a cell
 *
 * @since    1.5.0
 *
 * @param {Object}             props
 * @param {string|HTMLElement} props.cellContent    Cached content in the cell's content attribute
 * @param {Object}             props.cellAttributes Cell content to render
 * @param {string}             props.cellClasses    Configurable cell classes to be applied to the render
 * @param {Object}             props.contentType    Column content configuration
 * @return {void}
 */
function RenderCellPostContent(props = {}) {
	const { cellContent, cellAttributes, cellClasses, contentType } = props;

	const contentFormat = contentType?.format || '';
	const contentOptions = contentType?.formatOptions || {};
	const displayedAttributes = getDisplayAttributes(contentOptions);

	const {
		canonical: cellCanonical,
		options: cellDisplayOptions,
		externalData,
		indexText: cellIndexText,
	} = normalizeCellValueAttributes(cellAttributes?.value, cellContent, 'post');

	const isExternalDataEmpty = isEmptyObject(externalData);
	const postId = Number(cellCanonical?.postId);
	const postType = cellCanonical?.postType;
	const hasValidPostReference =
		Number.isSafeInteger(postId) &&
		postId > 0 &&
		typeof postType === 'string' &&
		postType.length > 0;

	const postLinkInNewTab = cellDisplayOptions?.newTab || false;

	const [fetchedPostData, setFetchedPostData] = useState(null);
	const postData = isExternalDataEmpty ? fetchedPostData : externalData;
	const post = postData?.post;
	const needsImage = contentOptions?.displayCoverImage?.display;
	const needsAuthor = contentOptions?.displayAuthor?.display;
	const imageSize = contentOptions?.displayImageSize || 'thumbnail';

	useEffect(() => {
		setFetchedPostData(null);

		if (!isExternalDataEmpty || !hasValidPostReference || contentFormat === 'link') {
			return undefined;
		}

		const request = new AbortController();
		let active = true;

		async function getPost() {
			try {
				const postValue = await lookupPost(postId, {
					postType,
					signal: request.signal,
				});

				if (!active) return;

				const [image, authorName] = await Promise.all([
					lookupPostImage(postValue.featured_media, { size: imageSize }),
					lookupPostAuthor(postValue.author),
				]);

				if (active) {
					setFetchedPostData({
						post: postValue,
						image,
						authorName,
						statistics: getPostStatistics(postValue),
					});
				}
			} catch {
				if (active) {
					setFetchedPostData(null);
				}
			}
		}

		getPost();

		return () => {
			active = false;
			request.abort();
		};
	}, [
		isExternalDataEmpty,
		hasValidPostReference,
		postId,
		postType,
		contentFormat,
		needsImage,
		needsAuthor,
		imageSize,
	]);

	if (!hasValidPostReference) {
		return null;
	}

	if (contentFormat !== 'link') {
		if (!post || Number(post.id) !== Number(postId) || post.type !== postType) {
			return null;
		}
	}

	switch (contentFormat) {
		case 'link': {
			// Render link
			const postLink = post?.link || getCellLinkUrl(cellContent);

			if (!isWebUrl(postLink)) {
				return null;
			}

			const linkLabel = cellIndexText || htmlToIndexText(cellContent);

			return (
				<a
					href={postLink}
					target={postLinkInNewTab ? '_blank' : '_top'}
					rel={postLinkInNewTab ? 'noopener noreferrer' : undefined}
				>
					{linkLabel}
				</a>
			);
		}
		case 'narrow': {
			// Render narrow
			return renderNarrowContent(
				postData,
				postLinkInNewTab,
				displayedAttributes,
				contentOptions,
				cellClasses
			);
		}
		case 'wide': {
			// Render wide
			return renderWideContent(
				postData,
				postLinkInNewTab,
				displayedAttributes,
				contentOptions,
				cellClasses
			);
		}
		default: {
			return null;
		}
	}
}

/**
 * Retrieve post elements for display, put them in an array, and sort them
 *
 * @since 1.5.0
 *
 * @param {Object} contentOptions Displayable post elements
 * @return {Array} Sorted array of post element to be displayed
 */
function getDisplayAttributes(contentOptions) {
	const {
		displayTitle,
		displayCoverImage,
		displayExcerpt,
		displayAuthor,
		displayPublishDate,
		displayModifiedDate,
	} = contentOptions;

	const postDisplayAttributes = Array();

	if (displayTitle.display) {
		postDisplayAttributes.push({
			attribute: 'title',
			slot: displayTitle,
		});
	}

	if (displayCoverImage.display) {
		postDisplayAttributes.push({
			attribute: 'image',
			slot: displayCoverImage,
		});
	}

	if (displayExcerpt.display) {
		postDisplayAttributes.push({
			attribute: 'excerpt',
			slot: displayExcerpt,
		});
	}

	if (displayAuthor.display) {
		postDisplayAttributes.push({
			attribute: 'author',
			slot: displayAuthor,
		});
	}

	if (displayPublishDate.display) {
		postDisplayAttributes.push({
			attribute: 'published',
			slot: displayPublishDate,
		});
	}

	if (displayModifiedDate.display) {
		postDisplayAttributes.push({
			attribute: 'modified',
			slot: displayModifiedDate,
		});
	}

	// sort array on column location, then display order
	postDisplayAttributes.sort((a, b) => {
		const columnCompare = a.slot.column.localeCompare(b.slot.column);

		if (columnCompare !== 0) {
			return columnCompare;
		}

		return a.slot.order - b.slot.order;
	});

	return postDisplayAttributes;
}

/**
 * Markup to render the post's title
 *
 * @since 1.5.0
 *
 * @param {string}  renderedContent  The post's title
 * @param {string}  linkLocation     Where to  place the post's link
 * @param {URL}     postLink         The post's URL
 * @param {boolean} postLinkInNewTab Open the link in a new tab?
 * @return {Element} Markup to render the title
 */
function renderPostTitle(renderedContent, linkLocation, postLink, postLinkInNewTab) {
	const postTitle = htmlToIndexText(renderedContent);

	return (
		<div style={{ fontWeight: '600', textAlign: 'center' }}>
			{linkLocation === 'title' ? (
				<a
					href={postLink}
					target={postLinkInNewTab ? '_blank' : '_top'}
					rel={postLinkInNewTab ? 'noopener noreferrer' : undefined}
				>
					{postTitle}
				</a>
			) : (
				postTitle
			)}
		</div>
	);
}

/**
 * Markup to render the post's cover image
 *
 * @since 1.5.0
 *
 * @param {Object} image The post's image and related meta
 * @param {string} sizes Image sizes attribute
 * @param {Object} link  The post's URL
 * @param {Object} title The post's title
 * @return {Element|null} Markup to render the cover image
 */
function renderPostImage(image, sizes, link, title) {
	if (!image) {
		return null;
	}

	const renderedImage = (
		<span className="dtbk-post-image__frame">
			<img
				className="dtbk-post-image__media"
				src={image.src}
				loading={image.loading}
				srcSet={sizes ? image.srcSet : undefined}
				sizes={sizes}
				alt={image.alt}
				width={image.width}
				height={image.height}
			/>

			{title.embedTitle && (
				<span className="dtbk-post-image__title">{htmlToIndexText(title.title)}</span>
			)}
		</span>
	);

	return (
		<div className="dtbk-post-image">
			{link.isLink ? (
				<a
					className="dtbk-post-image__link"
					href={link.url}
					target={link.newTab ? '_blank' : '_top'}
					rel={link.newTab ? 'noopener noreferrer' : undefined}
				>
					{renderedImage}
				</a>
			) : (
				renderedImage
			)}
		</div>
	);
}

/**
 * Markup to render the post's excerpt
 *
 * @since 1.5.0
 *
 * @param {string} renderedContent The post's excerpt
 * @return {Element} Markup to render the excerpt
 */
function renderPostExcept(renderedContent) {
	return (
		<div style={{ display: 'flex', gap: '8px', width: '100%' }}>
			<style>{`
				.dtb-post-excerpt > p:first-child {
					margin: 0;
					padding: 0;
				}
			`}</style>
			<em>
				<RawHTML className="dtb-post-excerpt">{renderedContent || ''}</RawHTML>
			</em>
		</div>
	);
}

/**
 * Markup to render the posts author's name
 *
 * @since 1.5.0
 *
 * @param {string} authorName The name of the post's author
 * @return {Element} Markup to render the author name
 */
function renderPostAuthor(authorName) {
	const contentLabel = __('Author:', 'dynamic-table-blocks');

	return (
		<div style={{ display: 'flex', gap: '8px', width: '100%' }}>
			<div style={{}}>
				<strong>{contentLabel}</strong>
			</div>
			<span>{authorName || ''}</span>
		</div>
	);
}

/**
 * Markup to render the post's original publish date
 *
 * @since 1.5.0
 *
 * @param {string} renderedContent The post's publication date
 * @return {Element} Markup to render the publication date
 */
function renderPublishedDate(renderedContent) {
	const contentLabel = __('Published:', 'dynamic-table-blocks');
	const displayDate = formatedDisplayDate(renderedContent, 'date');

	return (
		<div style={{ display: 'flex', gap: '8px', width: '100%' }}>
			<div style={{}}>
				<strong>{contentLabel}</strong>
			</div>
			<span>{displayDate}</span>
		</div>
	);
}

/**
 * Markup to render the date the post was last updated
 *
 * @since 1.5.0
 *
 * @param {string} renderedContent The post's modified date
 * @return {Element} Markup to render the last modified date
 */
function renderModifiedDate(renderedContent) {
	const contentLabel = __('Last Updated:', 'dynamic-table-blocks');
	const displayDate = formatedDisplayDate(renderedContent, 'date');

	return (
		<div style={{ display: 'flex', gap: '8px', width: '100%' }}>
			<div style={{}}>
				<strong>{contentLabel}</strong>
			</div>
			<span>{displayDate}</span>
		</div>
	);
}

/**
 * Create HTML markup to render the table cell for the post in narrow format
 *
 * @since 1.5.0
 *
 * @param {Object}  postData            The post's data for rendering
 * @param {boolean} postLinkInNewTab    Should the post be displayed in a new tab?
 * @param {Array}   displayedAttributes Sorted list of post elements to be displayed
 * @param {Object}  contentOptions      Render format options for the post
 * @param {string}  cellClasses         CSS classes to be applied to the cell
 * @return {Element} Markup to render the post
 */
function renderNarrowContent(
	postData,
	postLinkInNewTab,
	displayedAttributes,
	contentOptions,
	cellClasses
) {
	// Reserved for future use
	// const postCategoriesApi = post.wp.term.href;
	// const postTagsApi = post.wp.term.tags;

	return (
		<div className="dtbk-post-content dtbk-post-content--narrow">
			{displayedAttributes.map(({ attribute }) => {
				const formattedContent = evaluateDisplayAttributes(
					attribute,
					postData,
					postLinkInNewTab,
					contentOptions
				);
				if (!formattedContent) {
					return null;
				}
				return <div>{formattedContent}</div>;
			})}
		</div>
	);
}

/**
 * Create HTML markup to render the table cell for the post in wide format
 *
 * @since 1.5.0
 *
 * @param {Object}  postData            The post's data for rendering
 * @param {boolean} postLinkInNewTab    Should the post be displayed in a new tab?
 * @param {Array}   displayedAttributes Sorted list of post elements to be displayed
 * @param {Object}  contentOptions      Render format options for the post
 * @param {string}  cellClasses         CSS classes to be applied to the cell
 * @return {Element} Markup to render the post
 */
function renderWideContent(
	postData,
	postLinkInNewTab,
	displayedAttributes,
	contentOptions,
	cellClasses
) {
	const wideColumnSplit = contentOptions?.wideColumnSplit ?? 'equal';

	return (
		<div className="dtbk-post-content dtbk-post-content--wide">
			<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 10px' }}>
				{displayedAttributes.map(({ attribute, slot }) => {
					let formattedContent;
					if (slot.column === 'span') {
						formattedContent = evaluateDisplayAttributes(
							attribute,
							postData,
							postLinkInNewTab,
							contentOptions
						);
						return <div>{formattedContent}</div>;
					}
					return null;
				})}
			</div>

			<div className="dtbk-post-content__columns" data-column-split={wideColumnSplit}>
				<div className="dtbk-post-content__column dtbk-post-content__column--left">
					<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
						{displayedAttributes.map(({ attribute, slot }) => {
							let formattedContent;
							if (slot.column === 'left') {
								formattedContent = evaluateDisplayAttributes(
									attribute,
									postData,
									postLinkInNewTab,
									contentOptions
								);
								return <div>{formattedContent}</div>;
							}
							return null;
						})}
					</div>
				</div>
				<div className="dtbk-post-content__column dtbk-post-content__column--right">
					<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
						{displayedAttributes.map(({ attribute, slot }) => {
							let formattedContent;
							if (slot.column === 'right') {
								formattedContent = evaluateDisplayAttributes(
									attribute,
									postData,
									postLinkInNewTab,
									contentOptions
								);
								return <div>{formattedContent}</div>;
							}
							return null;
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Retrieve and return HTML markup associated with each displayed post element
 *
 * @since 1.5.2
 *
 * @param {Object}  displayedAttribute The post attribute to be rendered
 * @param {Object}  postData           The post's data for rendering
 * @param {boolean} postLinkInNewTab   Should the post be displayed in a new tab?
 * @param {Object}  contentOptions     Render format options for the post
 * @return {Element} Markup to render the specific post element
 */
function evaluateDisplayAttributes(displayedAttribute, postData, postLinkInNewTab, contentOptions) {
	const { post, image, authorName } = postData;
	const { displayTitleInCover, linkLocation } = contentOptions;

	const postLink = post.link;

	let formattedContent;

	switch (displayedAttribute) {
		case 'title': {
			const renderedContent = post.title.rendered;
			if (displayTitleInCover) break;
			formattedContent = renderPostTitle(renderedContent, linkLocation, postLink, postLinkInNewTab);
			break;
		}
		case 'image': {
			formattedContent = renderPostImage(
				image,
				'auto',
				{
					isLink: linkLocation === 'image',
					url: postLink,
					newTab: postLinkInNewTab,
				},
				{
					embedTitle: displayTitleInCover,
					title: post.title.rendered,
				}
			);
			break;
		}
		case 'excerpt': {
			const renderedContent = post.excerpt.rendered;
			formattedContent = renderPostExcept(renderedContent);
			break;
		}
		case 'author': {
			formattedContent = renderPostAuthor(authorName);
			break;
		}
		case 'published': {
			const renderedContent = post.date;
			formattedContent = renderPublishedDate(renderedContent);
			break;
		}
		case 'modified': {
			const renderedContent = post.modified;
			formattedContent = renderModifiedDate(renderedContent);
			break;
		}
		default: {
			break;
		}
	}
	return formattedContent;
}

export const CellPostContent = memo(RenderCellPostContent);
