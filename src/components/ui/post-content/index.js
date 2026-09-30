/* External dependencies */
import { useState, useEffect, memo, RawHTML } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
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
import { lookupPost, lookupPostImage, lookupPostAuthor } from '../../../get-external-data';
import { htmlToIndexText, formatedDisplayDate } from '../../../utils';
import { PostAuthor } from './post-author';
import { PostImage } from './post-image';
import { PostTimeToRead } from './post-read-time';
import { PostWordCount } from './post-word-count';
import { getPostStatistics } from './post-statistics';
import {
	normalizeCellValueAttributes,
	getPostOption,
	getNewTab,
	getCellLinkUrl,
	buildCellContent,
	isWebUrl,
	setPostDetails,
	removePostDetails,
} from '../../cell-advanced-edit-modal/value';

import '../../../editor.scss';
import '../../../style.scss';

function RenderCellPostContent(props = {}) {
	const { cellContent, cellAttributes, cellClasses, cellContentType } = props;

	const { type: contentType, settings } = cellContentType;
	const contentFormat = settings?.format || '';
	const contentOptions = settings?.formatOptions || {};
	const displayedAttributes = getDisplayAttributes(contentOptions);

	const { canonical: cellCanonical, options: cellDisplayOptions } = normalizeCellValueAttributes(
		cellAttributes,
		cellContent,
		contentType
	);
	const postId = cellCanonical?.postId || 0;
	const postType = cellCanonical?.postType || 'post';

	const postLinkInNewTab = cellDisplayOptions?.newTab || false;

	const [postData, setPostData] = useState(null);
	const [postError, setPostError] = useState(null);
	const post = postData?.post;
	const needsImage = contentOptions?.displayCoverImage > 0;
	const needsAuthor = contentOptions?.displayAuthor > 0;
	const imageSize = contentOptions?.displayImageSize || 'thumbnail';

	useEffect(() => {
		const request = new AbortController();
		let active = true;

		setPostData(null);
		setPostError(null);

		async function getPost() {
			try {
				const postValue = await lookupPost(postId, {
					postType: postType,
					signal: request.signal,
				});

				if (!active) return;

				const [image, authorName] = await Promise.all([
					needsImage ? lookupPostImage(postValue.featured_media, { size: imageSize }) : null,
					needsAuthor ? lookupPostAuthor(postValue.author) : null,
				]);

				if (active) {
					setPostData({
						post: postValue,
						image,
						authorName,
						statistics: getPostStatistics(postValue),
					});
				}
			} catch (error) {
				if (active) {
					setPostError(error?.message || __('Unable to load the post.', 'dynamic-table-blocks'));
				}
			}
		}

		if (contentFormat !== 'link') {
			getPost();
		}

		return () => {
			active = false;
			request.abort();
		};
	}, [postId, postType, contentFormat, needsImage, needsAuthor, imageSize]);

	if (contentFormat !== 'link') {
		if (postError) {
			return (
				<Notice status="error" isDismissible={false}>
					{postError}
				</Notice>
			);
		}

		if (!post || Number(post.id) !== Number(postId) || post.type !== postType) {
			return null;
		}
	}

	switch (contentFormat) {
		case 'link': {
			// Render link
			return cellContent;
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
			break;
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

	const postDisplayAttributes = Array();

	if (displayTitle > 0) {
		postDisplayAttributes.push({
			attribute: 'title',
			slot: displayTitle,
		});
	}

	if (displayCoverImage > 0) {
		postDisplayAttributes.push({
			attribute: 'image',
			slot: displayCoverImage,
		});
	}

	if (displayExcerpt > 0) {
		postDisplayAttributes.push({
			attribute: 'excerpt',
			slot: displayExcerpt,
		});
	}

	if (displayAuthor > 0) {
		postDisplayAttributes.push({
			attribute: 'author',
			slot: displayAuthor,
		});
	}

	if (displayPublishDate > 0) {
		postDisplayAttributes.push({
			attribute: 'published',
			slot: displayPublishDate,
		});
	}

	if (displayModifiedDate > 0) {
		postDisplayAttributes.push({
			attribute: 'modified',
			slot: displayModifiedDate,
		});
	}

	// sort array before return

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
	return (
		<div style={{ display: 'flex', width: '100%' }}>
			<PostImage image={image} sizes={sizes} link={link} title={title} />
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
			<span>
				<PostAuthor authorName={authorName} />
			</span>
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
	const { post, image, authorName } = postData;
	const { displayTitleInCover, displayImageSize, linkLocation } = contentOptions;

	const postLink = post.link;

	// Reserved for future use
	// const postCategoriesApi = post.wp.term.href;
	// const postTagsApi = post.wp.term.tags;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
			{displayedAttributes.map(({ attribute }) => {
				let formattedContent;

				switch (attribute) {
					case 'title': {
						const renderedContent = post.title.rendered;
						if (displayTitleInCover) break;
						formattedContent = renderPostTitle(renderedContent, linkLocation, postLink);
						break;
					}
					case 'image': {
						const link = {
							isLink: linkLocation === 'image' ? true : false,
							url: linkLocation === 'image' ? postLink : null,
						};

						const title = {
							embedTitle: displayTitleInCover,
							title: displayTitleInCover ? post.title.rendered : '',
						};

						formattedContent = renderPostImage(image, 'auto', link, title);
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
	const { post, image, authorName } = postData;
	const { displayTitleInCover, linkLocation } = contentOptions;

	const postLink = post.link;

	// Reserved for future use
	// const postCategoriesApi = post.wp.term.href;
	// const postTagsApi = post.wp.term.tags;

	return displayedAttributes.map(({ attribute }) => {
		let formattedContent;

		switch (attribute) {
			case 'title': {
				const renderedContent = post.title.rendered;
				if (displayTitleInCover) break;
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
			case 'content': {
				const renderedContent = post.content.rendered;
				formattedContent = renderShortContent(renderedContent);
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

		return <div>{formattedContent}</div>;
	});
}

export const CellPostContent = memo(RenderCellPostContent);
