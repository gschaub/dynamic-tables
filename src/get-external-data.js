/* External dependencies */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { htmlToIndexText } from './utils';

/**
 * Retrieve a WordPress post.
 *
 * @since    1.4.10
 * Description - Retrieve a post, page, or REST-enabled custom post type.
 *
 * @param {number|string} postId           Post ID.
 * @param {Object}        options          Lookup options.
 * @param {string}        options.postType WordPress post type.
 * @param {AbortSignal}   options.signal   Request cancellation signal.
 * @return {Promise<Object>} Normalized post details.
 */
export async function lookupPost(postId, { postType = 'post', signal } = {}) {
	const id = Number(postId);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new Error(__('Choose a valid post.', 'dynamic-table-blocks'));
	}

	let route;
	if (postType === 'post') {
		route = '/wp/v2/posts';
	} else if (postType === 'page') {
		route = '/wp/v2/pages';
	} else {
		const type = await apiFetch({
			path: '/wp/v2/types/' + encodeURIComponent(postType),
			signal,
		});
		if (!type?.rest_namespace || !type?.rest_base) {
			throw new Error(__('This post type cannot be retrieved.', 'dynamic-table-blocks'));
		}
		route = '/' + type.rest_namespace + '/' + type.rest_base;
	}
	const post = await apiFetch({
		path: route + '/' + id + '?_fields=id,type,title,link,author',
		signal,
	});
	if (
		Number(post?.id) !== id ||
		typeof post?.link !== 'string' ||
		typeof post?.title?.rendered !== 'string' ||
		typeof post?.type !== 'string'
	) {
		throw new Error(__('The post response was incomplete.', 'dynamic-table-blocks'));
	}
	return {
		postId: id,
		postType: post.type,
		title: htmlToIndexText(post.title.rendered),
		url: post.link,
		author: post.author,
	};
}
