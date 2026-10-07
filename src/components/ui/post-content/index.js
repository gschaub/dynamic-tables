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
	setPostDetails,
	getCellLinkUrl,
	isWebUrl,
} from '../../cell-advanced-edit-modal/value';

import '../../../editor.scss';
import '../../../style.scss';

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

	console.log('Content format = ' + contentFormat);

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
			console.log('calling narrow render');
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

function getDisplayAttributes(contentOptions) {
	const {
		displayTitle,
		displayCoverImage,
		displayExcerpt,
		displayAuthor,
		displayPublishDate,
		displayModifiedDate,
	} = contentOptions;

	console.log('In GetDisplayAttributes, contentOptions: ', contentOptions);
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

	console.log('Post render display array: ', postDisplayAttributes);
	return postDisplayAttributes;
}

function renderPostTitle(renderedContent, linkLocation, postLink) {
	return (
		<div style={{ fontWeight: '600', textAlign: 'center' }}>
			{linkLocation === 'title' ? <a href={postLink}>{renderedContent}</a> : renderedContent}
		</div>
	);
}

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
				<a className="dtbk-post-image__link" href={link.url}>
					{renderedImage}
				</a>
			) : (
				renderedImage
			)}
		</div>
	);
}

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

	console.log('Display Attributes for Narrow Render: ', displayedAttributes);
	return (
		<div className="dtbk-post-content dtbk-post-content--narrow">
			{displayedAttributes.map(({ attribute }) => {
				console.log('Display attribute: ', attribute);
				const formattedContent = evaluateDisplayAttributes(
					attribute,
					postData,
					postLinkInNewTab,
					contentOptions
				);
				if (!formattedContent) {
					console.log('No formatted content for attribute: ', attribute);
					return null;
				}
				return <div>{formattedContent}</div>;
			})}
		</div>
	);
}

function renderWideContent(
	postData,
	postLinkInNewTab,
	displayedAttributes,
	contentOptions,
	cellClasses
) {
	console.log('Display Attributes for Wide Render: ', displayedAttributes);

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

			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					gap: '10px',
					boxSizing: 'inherit',
				}}
			>
				<div
					style={{
						display: 'block',
						boxSizing: 'inherit',
						maxHeight: '100%',
						maxWidth: '100%',
						flex: '1',
					}}
				>
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
				<div
					style={{
						display: 'block',
						boxSizing: 'inherit',
						maxHeight: '100%',
						maxWidth: '100%',
						flex: '1',
					}}
				>
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

function evaluateDisplayAttributes(displayedAttribute, postData, postLinkInNewTab, contentOptions) {
	const { post, image, authorName } = postData;
	const { displayTitleInCover, linkLocation } = contentOptions;

	const postLink = post.link;

	let formattedContent;

	switch (displayedAttribute) {
		case 'title': {
			const renderedContent = post.title.rendered;
			if (displayTitleInCover) break;
			console.log('Preparing title render');
			formattedContent = renderPostTitle(renderedContent, linkLocation, postLink);
			break;
		}
		case 'image': {
			formattedContent = renderPostImage(
				image,
				'auto',
				{
					isLink: linkLocation === 'image',
					url: postLink,
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
