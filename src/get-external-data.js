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

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

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

/**
 * Retrieve multiple WordPress posts of the same post type.
 *
 * @since    1.5.0
 *
 * @param {Array<number|string>} postIds          Post IDs.
 * @param {Object}               options          Lookup options.
 * @param {string}               options.postType WordPress post type.
 * @param {AbortSignal}          options.signal   Prevents returning a cancelled lookup.
 * @return {Promise<Array<Object>>} WordPress REST API post objects.
 */
export async function lookupPosts(postIds, { postType, signal } = {}) {
	const ids = [
		...new Set(
			(Array.isArray(postIds) ? postIds : [])
				.map(Number)
				.filter(id => Number.isSafeInteger(id) && id > 0)
		),
	];

	if (ids.length === 0) {
		return [];
	}

	if (typeof postType !== 'string' || postType.length === 0) {
		throw new Error(__('The post type is missing.', 'dynamic-table-blocks'));
	}

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

	/*
	 * WordPress REST collection endpoints normally limit per_page to 100,
	 * so divide larger requests into supported batches.
	 */
	const batches = [];

	for (let index = 0; index < ids.length; index += 100) {
		batches.push(ids.slice(index, index + 100));
	}

	const results = await Promise.all(
		batches.map(batch =>
			resolveSelect(coreDataStore).getEntityRecords('postType', postType, {
				context: 'view',
				include: batch,
				orderby: 'include',
				per_page: batch.length,
			})
		)
	);

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

	const posts = results.flat();
	const postsById = new Map(posts.map(post => [Number(post?.id), post]));

	const hasIncompletePost = ids.some(id => {
		const post = postsById.get(id);

		return (
			typeof post?.link !== 'string' ||
			typeof post?.title?.rendered !== 'string' ||
			typeof post?.type !== 'string'
		);
	});

	if (hasIncompletePost) {
		throw new Error(__('One or more post responses were incomplete.', 'dynamic-table-blocks'));
	}

	return ids.map(id => postsById.get(id));
}

/**
 * Retrieves the best image size of those available in the media object.
 *
 * @since    1.5.0
 *
 * Description - Images are available in the following standard sizes within WordPress.
 *                  - thumbnail: 150 x 150, cropped, site configurable
 *                  - medium: Up to 300 x 300, aspect ratio preserved, site configurable
 *                  - medium_large: Up to 768 wide, no height limit
 *                  - large: Up to 1024 x 1024, aspect ratio preserved, site configurable
 *
 *               Additionally, multiple sizes may be stored in the media object. However, that doesn't mean
 *               all media has all of these sizes. We select the one that can best be formatted to the
 *               requested size and return it.
 *
 * @param {Object} media Media object that includes multiple sizes.
 * @param {string} size  Requested render size.
 * @return {Object} Single image from the media object.
 */
function formatPostImage(media, size = 'thumbnail') {
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

/**
 * Retrieve and format a single WordPress post image.
 *
 * @since    1.5.0
 *
 * @param {number} mediaId Attachment ID.
 * @param {string} size    Requested image size.
 * @return {Object} Image result containing the image.
 */
export async function lookupPostImage(mediaId, { size = 'thumbnail' } = {}) {
	if (!mediaId) {
		return null;
	}

	const media = await resolveSelect(coreDataStore).getEntityRecord(
		'postType',
		'attachment',
		Number(mediaId),
		{ context: 'view' }
	);

	return formatPostImage(media, size);
}

/**
 * Retrieve and format multiple WordPress post images.
 *
 * @since    1.5.0
 *
 * @param {Array<number|string>} mediaIds       Attachment IDs.
 * @param {Object}               options        Lookup options.
 * @param {string}               options.size   Requested image size.
 * @param {AbortSignal}          options.signal Prevents returning a cancelled lookup.
 * @return {Promise<Array<Object>>} Image results containing mediaId and image.
 */
export async function lookupPostImages(mediaIds, { size = 'thumbnail', signal } = {}) {
	const ids = [
		...new Set(
			(Array.isArray(mediaIds) ? mediaIds : [])
				.map(Number)
				.filter(id => Number.isSafeInteger(id) && id > 0)
		),
	];

	if (ids.length === 0) {
		return [];
	}

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

	const batches = [];

	for (let index = 0; index < ids.length; index += 100) {
		batches.push(ids.slice(index, index + 100));
	}

	const results = await Promise.all(
		batches.map(batch =>
			resolveSelect(coreDataStore).getEntityRecords('postType', 'attachment', {
				context: 'view',
				include: batch,
				orderby: 'include',
				per_page: batch.length,
			})
		)
	);

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

	return results.flat().map(media => ({
		mediaId: Number(media.id),
		image: formatPostImage(media, size),
	}));
}

/**
 * Retrieve multiple WordPress post authors.
 *
 * @since    1.5.0
 *
 * @param {Array<number|string>} authorIds      Author IDs.
 * @param {Object}               options        Lookup options.
 * @param {AbortSignal}          options.signal Prevents returning a cancelled lookup.
 * @return {Promise<Array<Object>>} Author results containing authorId and authorName.
 */
export async function lookupPostAuthors(authorIds, { signal } = {}) {
	const ids = [
		...new Set(
			(Array.isArray(authorIds) ? authorIds : [])
				.map(Number)
				.filter(id => Number.isSafeInteger(id) && id > 0)
		),
	];

	if (ids.length === 0) {
		return [];
	}

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

	const batches = [];

	for (let index = 0; index < ids.length; index += 100) {
		batches.push(ids.slice(index, index + 100));
	}

	const results = await Promise.all(
		batches.map(batch =>
			resolveSelect(coreDataStore).getEntityRecords('root', 'user', {
				context: 'view',
				include: batch,
				orderby: 'include',
				per_page: batch.length,
			})
		)
	);

	if (signal?.aborted) {
		throw new DOMException('The lookup was aborted.', 'AbortError');
	}

	return results.flat().map(author => ({
		authorId: Number(author.id),
		authorName: author.name || null,
	}));
}

/**
 * Retrieve a single WordPress post author.
 *
 * @since    1.5.0
 *
 * @param {number} authorId Author ID.
 * @return {string} The author's name.
 */
export async function lookupPostAuthor(authorId) {
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
