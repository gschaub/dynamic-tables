import { count } from '@wordpress/wordcount';

/**
 * Calculate statistics from the retrieved post's rendered content.
 *
 * @param {Object} post WordPress REST API post.
 * @return {Object|null} Statistics, or null when content is unavailable.
 */
export function getPostStatistics(post) {
	const content = post?.content;

	if (content?.protected || typeof content?.rendered !== 'string') {
		return null;
	}

	const wordCount = count(content.rendered, 'words');
	const readingMinutes = wordCount === 0 ? 0 : Math.max(1, Math.round(wordCount / 189));

	return { wordCount, readingMinutes };
}
