/* External dependencies */
// import apiFetch from '@wordpress/api-fetch';
import { store as coreDataStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
// import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Retrieve a WordPress post.
 *
 * @since    1.4.10
 * Description - Retrieve a post, page, or REST-enabled custom post type.
 *
 * @param {number|string} postId           Post ID.
 * @param {Object}        options          Lookup options.
 * @param {string}        options.postType WordPress post type.
 * @param {AbortSignal}   options.signal   Prevents returning a cancelled lookup.
 * @return {Promise<Object>} WordPress REST API post object.
 */
export async function lookupPost(postId, { postType = 'post', signal } = {}) {
	const id = Number(postId);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new Error(__('Choose a valid post.', 'dynamic-table-blocks'));
	}

	// let route;
	// if (postType === 'post') {
	// 	route = '/wp/v2/posts';
	// } else if (postType === 'page') {
	// 	route = '/wp/v2/pages';
	// } else {
	// 	const type = await apiFetch({
	// 		path: '/wp/v2/types/' + encodeURIComponent(postType),
	// 		signal,
	// 	});
	// 	if (!type?.rest_namespace || !type?.rest_base) {
	// 		throw new Error(__('This post type cannot be retrieved.', 'dynamic-table-blocks'));
	// 	}
	// 	route = '/' + type.rest_namespace + '/' + type.rest_base;
	// }

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

	// const post = await apiFetch({
	// 	path: route + '/' + id,
	// 	signal,
	// });

	const post = await resolveSelect(coreDataStore).getEntityRecord('postType', postType, id, {
		context: 'view',
	});

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

	if (
		Number(post?.id) !== id ||
		typeof post?.link !== 'string' ||
		typeof post?.title?.rendered !== 'string' ||
		typeof post?.type !== 'string'
	) {
		throw new Error(__('The post response was incomplete.', 'dynamic-table-blocks'));
	}
	return post;
}

/** Size Options:
 * thumbnail: 150 x 150, cropped, site configurable
 * medium: Up to 300 x 300, aspect ratio preserved, site configurable
 * medium_large Up to 768 wide, no height limit
 * large: Up to 1024 x 1024, aspect ratio preserved, site configurable
 */
export async function lookupPostImage(mediaId, { size = 'thumbnail' } = {}) {
	// const media = useSelect(
	// 	select => {
	// 		if (!mediaId) {
	// 			return null;
	// 		}

	// 		return select(coreDataStore).getEntityRecord('postType', 'attachment', mediaId, {
	// 			context: 'view',
	// 		});
	// 	},
	// 	[mediaId]
	// );

	if (!mediaId) {
		return null;
	}

	const media = await resolveSelect(coreDataStore).getEntityRecord(
		'postType',
		'attachment',
		Number(mediaId),
		{ context: 'view' }
	);

	if (!media?.source_url) {
		return null;
	}

	const image = media.media_details?.sizes?.[size];

	const width = image?.width || media.media_details?.width;
	const height = image?.height || media.media_details?.height;
	const candidates = [
		...Object.values(media.media_details?.sizes || {}),
		{
			source_url: media.source_url,
			width: media.media_details?.width,
			height: media.media_details?.height,
		},
	];

	const sources = new Map();

	if (width > 0 && height > 0) {
		for (const candidate of candidates) {
			if (!candidate.source_url || !(candidate.width > 0) || !(candidate.height > 0)) {
				continue;
			}

			// Allow a one-pixel difference from resizing and rounding.
			const expectedHeight = (candidate.width * height) / width;
			if (Math.abs(candidate.height - expectedHeight) > 1) {
				continue;
			}

			sources.set(candidate.width, candidate.source_url);
		}
	}

	const srcSet = [...sources.entries()]
		.sort(([a], [b]) => a - b)
		.map(([sourceWidth, url]) => `${url} ${sourceWidth}w`)
		.join(', ');

	return {
		src: image?.source_url || media.source_url,
		loading: 'lazy',
		srcSet: srcSet || undefined,
		alt: media.alt_text || '',
		width,
		height,
	};
}

export async function lookupPostAuthor(authorId) {
	// return useSelect(
	// 	select => {
	// 		if (!authorId) {
	// 			return null;
	// 		}

	// 		const author = select(coreDataStore).getEntityRecord('root', 'user', authorId, {
	// 			context: 'view',
	// 		});

	// 		return author?.name || null;
	// 	},
	// 	[authorId]
	// );
	if (!authorId) {
		return null;
	}

	const author = await resolveSelect(coreDataStore).getEntityRecord(
		'root',
		'user',
		Number(authorId),
		{ context: 'view' }
	);

	return author?.name || null;
}
