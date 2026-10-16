/* External dependencies */
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import '../../../editor.scss';
import '../../../style.scss';

/**
 * React component to render the post's word count
 *
 * @since 1.5.0
 * @param {string|null} wordCount Number of words in the post
 * @return {Element} Markup for read time
 */
export function PostWordCount({ wordCount }) {
	if (wordCount === null || wordCount === undefined) {
		return null;
	}

	return (
		<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
			<span>
				{sprintf(
					/* translators: %s: Number of words. */
					_n('%s word', '%s words', wordCount, 'dynamic-table-blocks'),
					wordCount
				)}
			</span>
		</div>
	);
}
