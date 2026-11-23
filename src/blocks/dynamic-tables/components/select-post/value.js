/* External dependencies */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { htmlToIndexText } from '../../utils';

/**
 * Validate an absolute HTTP or HTTPS URL.
 *
 * @since    1.5.0
 *
 * @param {string} value url to be formatted
 * @return {string | boolean}   Is url valid
 */
function isAbsoluteWebUrl(value) {
	if (typeof value !== 'string' || !value.trim()) return false;
	try {
		const { protocol } = new URL(value.trim());
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Convert post attibutes a Combobox option.
 *
 * @since    1.5.0
 *
 * @param {Object|null} post Post details.
 * @return {Object|null} Combobox option.
 */
export function getSelectedPostOption(post) {
	const postId = Number(post?.postId);
	const postType = post?.postType;

	if (
		!Number.isSafeInteger(postId) ||
		postId <= 0 ||
		typeof postType !== 'string' ||
		postType.length === 0
	) {
		return null;
	}

	return {
		value: String(postId),
		label:
			typeof post.title === 'string' && post.title
				? post.title
				: __('No title found', 'dynamic-table-blocks'),
		postType,
	};
}

/**
 * Convert REST API search results to combobox options.
 *
 * @since    1.5.0
 * @since    1.5.1 - Fix post type not returned
 *
 * @param {Array} posts WordPress search results.
 * @return {Array} Combobox options.
 */
export function getPostSearchOptions(posts) {
	return posts.map(post => {
		const postId = Number(post?.id);
		if (
			!Number.isSafeInteger(postId) ||
			postId <= 0 ||
			typeof post?.subtype !== 'string' ||
			post.subtype.length === 0 ||
			typeof post?.title !== 'string'
		) {
			throw new Error(__('The search response was invalid.', 'dynamic-table-blocks'));
		}

		return {
			value: String(postId),
			label: htmlToIndexText(post.title) || __('No title found', 'dynamic-table-blocks'),
			postType: post.subtype,
		};
	});
}

/**
 * Convert a retrieved WordPress post to the selector's public value.
 *
 * @since    1.5.0
 * @param {Object} post Retrieved WordPress post.
 * @return {Object} Selected post details.
 */
export function getSelectedPost(post) {
	const postId = Number(post?.id);
	const postType = post?.type;
	const renderedTitle = post?.title?.rendered;
	const url = typeof post?.link === 'string' ? post.link.trim() : '';

	if (
		!Number.isSafeInteger(postId) ||
		postId <= 0 ||
		typeof postType !== 'string' ||
		postType.length === 0 ||
		typeof renderedTitle !== 'string'
	) {
		throw new Error(__('The post response was invalid.', 'dynamic-table-blocks'));
	}

	if (!isAbsoluteWebUrl(url)) {
		throw new Error(__('The post has an invalid web address.', 'dynamic-table-blocks'));
	}

	return {
		postId,
		postType,
		title: htmlToIndexText(renderedTitle),
		url,
		author: post.author,
	};
}

/**
 * Build the disabled option used when a search has no selectable results.
 *
 * @since    1.5.0
 *
 * @return {Object} Disabled combobox option.
 */
export function getNoPostResultsOption() {
	return {
		value: '',
		label: __('No matching content found or search term is too short.', 'dynamic-table-blocks'),
		disabled: true,
	};
}
