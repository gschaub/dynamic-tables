/* External dependencies */
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import '../../../editor.scss';
import '../../../style.scss';

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
